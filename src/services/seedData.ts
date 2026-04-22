import { Types } from "mongoose";
import { AIEventModel } from "../models/aiEvent.model";
import { WorkerModel } from "../models/worker.model";
import { WorkstationModel } from "../models/workstation.model";
import { SeedResult } from "../types/api";

type AIEventType = "working" | "idle" | "absent" | "product_count";

export const seedWorkers = [
  { workerId: "W001", name: "Asha Patel" },
  { workerId: "W002", name: "Rohan Mehta" },
  { workerId: "W003", name: "Neha Sharma" },
  { workerId: "W004", name: "Imran Khan" },
  { workerId: "W005", name: "Kavya Rao" },
  { workerId: "W006", name: "Vikram Singh" }
];

export const seedWorkstations = [
  { stationId: "S001", name: "Cutting Bay 1", type: "cutting" },
  { stationId: "S002", name: "Assembly Line A", type: "assembly" },
  { stationId: "S003", name: "Assembly Line B", type: "assembly" },
  { stationId: "S004", name: "Quality Check", type: "quality" },
  { stationId: "S005", name: "Packaging Cell", type: "packaging" },
  { stationId: "S006", name: "Dispatch Prep", type: "dispatch" }
];

function shiftTime(hour: number, minute: number): Date {
  const date = new Date("2026-04-21T00:00:00.000Z");
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

function eventFingerprint(parts: {
  occurredAt: Date;
  workerExternalId: string;
  stationExternalId: string;
  eventType: AIEventType;
  count: number;
}): string {
  return [
    parts.occurredAt.toISOString(),
    parts.workerExternalId,
    parts.stationExternalId,
    parts.eventType,
    parts.count
  ].join("|");
}

function buildSeedEvents() {
  const eventRows: Array<{
    occurredAt: Date;
    workerExternalId: string;
    stationExternalId: string;
    eventType: AIEventType;
    confidence: number;
    count: number;
  }> = [];

  seedWorkers.forEach((worker, workerIndex) => {
    const station = seedWorkstations[workerIndex];

    for (let block = 0; block < 8; block += 1) {
      const hour = 8 + block;
      eventRows.push({
        occurredAt: shiftTime(hour, 5 + workerIndex),
        workerExternalId: worker.workerId,
        stationExternalId: station.stationId,
        eventType: "working",
        confidence: 0.9 + ((workerIndex + block) % 8) / 100,
        count: 0
      });

      eventRows.push({
        occurredAt: shiftTime(hour, 35 + (workerIndex % 10)),
        workerExternalId: worker.workerId,
        stationExternalId: station.stationId,
        eventType: "product_count",
        confidence: 0.86 + ((workerIndex + block) % 10) / 100,
        count: 6 + ((workerIndex * 2 + block) % 7)
      });
    }
  });

  eventRows.push(
    {
      occurredAt: shiftTime(10, 20),
      workerExternalId: "W002",
      stationExternalId: "S002",
      eventType: "idle",
      confidence: 0.89,
      count: 0
    },
    {
      occurredAt: shiftTime(12, 10),
      workerExternalId: "W004",
      stationExternalId: "S004",
      eventType: "idle",
      confidence: 0.92,
      count: 0
    },
    {
      occurredAt: shiftTime(13, 0),
      workerExternalId: "W006",
      stationExternalId: "S006",
      eventType: "absent",
      confidence: 0.94,
      count: 0
    },
    {
      occurredAt: shiftTime(14, 25),
      workerExternalId: "W003",
      stationExternalId: "S003",
      eventType: "idle",
      confidence: 0.88,
      count: 0
    },
    {
      occurredAt: shiftTime(15, 40),
      workerExternalId: "W005",
      stationExternalId: "S005",
      eventType: "absent",
      confidence: 0.91,
      count: 0
    }
  );

  return eventRows.map((event, index) => ({
    ...event,
    sourceEventId: `seed-${String(index + 1).padStart(3, "0")}`,
    eventFingerprint: eventFingerprint(event)
  }));
}

export async function seedDatabase(options: { reset: boolean }): Promise<SeedResult> {
  if (options.reset) {
    await AIEventModel.deleteMany({});
    await WorkerModel.deleteMany({});
    await WorkstationModel.deleteMany({});
  }

  const workers = await Promise.all(
    seedWorkers.map((worker) =>
      WorkerModel.findOneAndUpdate(
        { workerId: worker.workerId },
        { $set: worker },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean()
    )
  );

  const workstations = await Promise.all(
    seedWorkstations.map((station) =>
      WorkstationModel.findOneAndUpdate(
        { stationId: station.stationId },
        { $set: station },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean()
    )
  );

  const workerByCode = new Map(workers.map((worker) => [worker.workerId, worker]));
  const stationByCode = new Map(
    workstations.map((station) => [station.stationId, station])
  );

  const events = buildSeedEvents();

  await Promise.all(
    events.map((event) => {
      const worker = workerByCode.get(event.workerExternalId);
      const station = stationByCode.get(event.stationExternalId);

      if (!worker || !station) {
        throw new Error(
          `Invalid seed reference for ${event.workerExternalId}/${event.stationExternalId}`
        );
      }

      return AIEventModel.findOneAndUpdate(
        { sourceEventId: event.sourceEventId },
        {
          $set: {
            occurredAt: event.occurredAt,
            workerExternalId: event.workerExternalId,
            stationExternalId: event.stationExternalId,
            eventType: event.eventType,
            confidence: event.confidence,
            count: event.count,
            sourceEventId: event.sourceEventId,
            eventFingerprint: event.eventFingerprint,
            workerRef: worker._id as Types.ObjectId,
            workstationRef: station._id as Types.ObjectId
          }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    })
  );

  return {
    workers: seedWorkers.length,
    workstations: seedWorkstations.length,
    events: events.length
  };
}
