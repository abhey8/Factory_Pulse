import { FilterQuery, Types } from "mongoose";
import { AIEvent, AIEventModel } from "../models/aiEvent.model";
import { WorkerModel } from "../models/worker.model";
import { WorkstationModel } from "../models/workstation.model";
import { AIEventInput, EventQueryInput, aiEventSchema } from "../validators/event.validator";

type IngestionItemResult =
  | {
      index: number;
      status: "inserted";
      id: string;
      fingerprint: string;
    }
  | {
      index: number;
      status: "duplicate";
      fingerprint: string;
      reason: string;
    }
  | {
      index: number;
      status: "invalid";
      reason: string;
      issues?: unknown;
    };

export type IngestionResult = {
  summary: {
    received: number;
    inserted: number;
    skipped: number;
    duplicates: number;
    invalid: number;
  };
  items: IngestionItemResult[];
};

function normalizeIncomingPayload(payload: unknown): unknown[] {
  return Array.isArray(payload) ? payload : [payload];
}

// Duplicate strategy:
// Cameras may retry after intermittent connectivity, so we compute a stable
// semantic fingerprint from normalized event time, worker, workstation, type,
// and count. Confidence is intentionally excluded because the same edge event
// may be re-sent with slightly different model confidence after reprocessing;
// counting it twice would corrupt production metrics.
export function buildEventFingerprint(event: AIEventInput): string {
  return [
    event.timestamp.toISOString(),
    event.worker_id,
    event.workstation_id,
    event.event_type,
    event.count
  ].join("|");
}

function zodErrorSummary(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message
  }));
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export async function ingestEvents(payload: unknown): Promise<IngestionResult> {
  const incoming = normalizeIncomingPayload(payload);
  const parsed = incoming.map((event, index) => {
    const result = aiEventSchema.safeParse(event);
    return { index, result };
  });

  const items: IngestionItemResult[] = parsed
    .filter((entry) => !entry.result.success)
    .map((entry) => ({
      index: entry.index,
      status: "invalid",
      reason: "Validation failed",
      issues: entry.result.success ? undefined : zodErrorSummary(entry.result.error)
    }));

  const validEvents = parsed
    .filter((entry): entry is { index: number; result: { success: true; data: AIEventInput } } => entry.result.success)
    .map((entry) => ({
      index: entry.index,
      event: entry.result.data,
      fingerprint: buildEventFingerprint(entry.result.data)
    }));

  const workerIds = [...new Set(validEvents.map((entry) => entry.event.worker_id))];
  const stationIds = [...new Set(validEvents.map((entry) => entry.event.workstation_id))];

  const [workers, stations, existingEvents] = await Promise.all([
    WorkerModel.find({ workerId: { $in: workerIds } }).lean(),
    WorkstationModel.find({ stationId: { $in: stationIds } }).lean(),
    AIEventModel.find({
      eventFingerprint: { $in: validEvents.map((entry) => entry.fingerprint) }
    })
      .select({ eventFingerprint: 1, _id: 0 })
      .lean()
  ]);

  const workerByExternalId = new Map(workers.map((worker) => [worker.workerId, worker]));
  const stationByExternalId = new Map(stations.map((station) => [station.stationId, station]));
  const duplicateFingerprints = new Set(
    existingEvents
      .map((event) => event.eventFingerprint)
      .filter((fingerprint): fingerprint is string => Boolean(fingerprint))
  );
  const seenInBatch = new Set<string>();

  for (const entry of validEvents) {
    const worker = workerByExternalId.get(entry.event.worker_id);
    const station = stationByExternalId.get(entry.event.workstation_id);

    if (!worker) {
      items.push({
        index: entry.index,
        status: "invalid",
        reason: `Unknown worker_id: ${entry.event.worker_id}`
      });
      continue;
    }

    if (!station) {
      items.push({
        index: entry.index,
        status: "invalid",
        reason: `Unknown workstation_id: ${entry.event.workstation_id}`
      });
      continue;
    }

    if (duplicateFingerprints.has(entry.fingerprint) || seenInBatch.has(entry.fingerprint)) {
      items.push({
        index: entry.index,
        status: "duplicate",
        fingerprint: entry.fingerprint,
        reason: "Event fingerprint already exists"
      });
      continue;
    }

    try {
      const created = await AIEventModel.create({
        occurredAt: entry.event.timestamp,
        workerExternalId: entry.event.worker_id,
        stationExternalId: entry.event.workstation_id,
        eventType: entry.event.event_type,
        confidence: entry.event.confidence,
        count: entry.event.count,
        sourceEventId: entry.event.source_event_id,
        eventFingerprint: entry.fingerprint,
        workerRef: worker._id as Types.ObjectId,
        workstationRef: station._id as Types.ObjectId
      });

      seenInBatch.add(entry.fingerprint);
      items.push({
        index: entry.index,
        status: "inserted",
        id: created._id.toString(),
        fingerprint: entry.fingerprint
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        items.push({
          index: entry.index,
          status: "duplicate",
          fingerprint: entry.fingerprint,
          reason: "Unique event key already exists"
        });
        continue;
      }

      throw error;
    }
  }

  items.sort((a, b) => a.index - b.index);

  const inserted = items.filter((item) => item.status === "inserted").length;
  const duplicates = items.filter((item) => item.status === "duplicate").length;
  const invalid = items.filter((item) => item.status === "invalid").length;

  return {
    summary: {
      received: incoming.length,
      inserted,
      skipped: duplicates + invalid,
      duplicates,
      invalid
    },
    items
  };
}

export async function listEvents(query: EventQueryInput) {
  const where: FilterQuery<AIEvent> = {};

  if (query.worker_id) {
    where.workerExternalId = query.worker_id;
  }

  if (query.workstation_id) {
    where.stationExternalId = query.workstation_id;
  }

  if (query.event_type) {
    where.eventType = query.event_type;
  }

  if (query.from || query.to) {
    where.occurredAt = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {})
    };
  }

  const events = await AIEventModel.find(where)
    .sort({ occurredAt: -1 })
    .limit(query.limit)
    .select({
      occurredAt: 1,
      workerExternalId: 1,
      stationExternalId: 1,
      eventType: 1,
      confidence: 1,
      count: 1,
      sourceEventId: 1,
      eventFingerprint: 1,
      createdAt: 1
    })
    .lean();

  return events.map((event) => ({
    id: event._id.toString(),
    timestamp: event.occurredAt,
    worker_id: event.workerExternalId,
    workstation_id: event.stationExternalId,
    event_type: event.eventType,
    confidence: event.confidence,
    count: event.count,
    source_event_id: event.sourceEventId,
    event_fingerprint: event.eventFingerprint,
    created_at: event.createdAt
  }));
}

export async function deleteEvents() {
  const result = await AIEventModel.deleteMany({});
  return { deleted: result.deletedCount };
}
