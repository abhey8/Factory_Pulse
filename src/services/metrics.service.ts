import { FilterQuery } from "mongoose";
import { AIEvent, AIEventModel } from "../models/aiEvent.model";
import { WorkerModel } from "../models/worker.model";
import { WorkstationModel } from "../models/workstation.model";
import { MetricsQueryInput } from "../validators/metrics.validator";

type StateEventType = "working" | "idle" | "absent";

type StateEvent = {
  occurredAt: Date;
  workerExternalId: string;
  stationExternalId: string;
  eventType: string;
};

type ProductEvent = {
  workerExternalId: string;
  stationExternalId: string;
  count: number;
};

type DurationTotals = {
  activeSeconds: number;
  idleSeconds: number;
  absentSeconds: number;
  trackedSeconds: number;
};

type AnalysisWindow = {
  start: Date | null;
  end: Date | null;
};

type NonEmptyAnalysisWindow = {
  start: Date;
  end: Date;
};

const stateEventTypes = ["working", "idle", "absent"];

function secondsBetween(start: Date, end: Date): number {
  return Math.max(0, (end.getTime() - start.getTime()) / 1000);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function percent(numerator: number, denominator: number): number {
  return denominator > 0 ? round((numerator / denominator) * 100) : 0;
}

function ratePerHour(total: number, seconds: number): number {
  const hours = seconds / 3600;
  return hours > 0 ? round(total / hours) : 0;
}

function emptyDurations(): DurationTotals {
  return {
    activeSeconds: 0,
    idleSeconds: 0,
    absentSeconds: 0,
    trackedSeconds: 0
  };
}

function addDuration(totals: DurationTotals, eventType: StateEventType, seconds: number) {
  if (eventType === "working") {
    totals.activeSeconds += seconds;
  } else if (eventType === "idle") {
    totals.idleSeconds += seconds;
  } else {
    totals.absentSeconds += seconds;
  }

  totals.trackedSeconds += seconds;
}

function eventWhere(query: MetricsQueryInput): FilterQuery<AIEvent> {
  const where: FilterQuery<AIEvent> = {};

  if (query.worker_id) {
    where.workerExternalId = query.worker_id;
  }

  if (query.workstation_id) {
    where.stationExternalId = query.workstation_id;
  }

  return where;
}

async function getAnalysisWindow(query: MetricsQueryInput): Promise<AnalysisWindow> {
  const where: FilterQuery<AIEvent> = {
    ...eventWhere(query)
  };

  if (query.from || query.to) {
    where.occurredAt = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {})
    };
  }

  const [minEvent, maxEvent] = await Promise.all([
    AIEventModel.findOne(where).sort({ occurredAt: 1 }).select({ occurredAt: 1 }).lean(),
    AIEventModel.findOne(where).sort({ occurredAt: -1 }).select({ occurredAt: 1 }).lean()
  ]);

  const start = query.from ?? minEvent?.occurredAt;
  const end = query.to ?? maxEvent?.occurredAt;

  if (!start || !end || start > end) {
    return { start: null, end: null };
  }

  return { start, end };
}

async function getMetricEvents(query: MetricsQueryInput, window: NonEmptyAnalysisWindow) {
  const stateEvents = await AIEventModel.find({
    ...eventWhere(query),
    eventType: { $in: stateEventTypes },
    occurredAt: { $lte: window.end }
  })
    .sort({ occurredAt: 1 })
    .select({
      occurredAt: 1,
      workerExternalId: 1,
      stationExternalId: 1,
      eventType: 1,
      _id: 0
    })
    .lean();

  const productEvents = await AIEventModel.find({
    ...eventWhere(query),
    eventType: "product_count",
    occurredAt: {
      $gte: window.start,
      $lte: window.end
    }
  })
    .select({
      workerExternalId: 1,
      stationExternalId: 1,
      count: 1,
      _id: 0
    })
    .lean();

  return { stateEvents, productEvents };
}

// State events are interpreted as "state starts now and lasts until the next
// state event for the same worker at the same station." Events may arrive out
// of order; metrics sort by occurredAt and never by insertion order. Open final
// intervals close at the explicit `to` query bound when provided, otherwise at
// the max event timestamp in the filtered dataset.
function computeDurationsByWorkerStation(
  stateEvents: StateEvent[],
  window: NonEmptyAnalysisWindow
) {
  const grouped = new Map<string, StateEvent[]>();

  for (const event of stateEvents) {
    const key = `${event.workerExternalId}|${event.stationExternalId}`;
    grouped.set(key, [...(grouped.get(key) ?? []), event]);
  }

  const durations = new Map<
    string,
    DurationTotals & { workerExternalId: string; stationExternalId: string }
  >();

  for (const [key, events] of grouped) {
    const [workerExternalId, stationExternalId] = key.split("|");
    const totals = {
      ...emptyDurations(),
      workerExternalId,
      stationExternalId
    };
    const orderedEvents = [...events].sort(
      (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime()
    );

    for (let index = 0; index < orderedEvents.length; index += 1) {
      const event = orderedEvents[index];
      const nextEvent = orderedEvents[index + 1];
      const intervalStart =
        event.occurredAt > window.start ? event.occurredAt : window.start;
      const rawIntervalEnd = nextEvent?.occurredAt ?? window.end;
      const intervalEnd = rawIntervalEnd < window.end ? rawIntervalEnd : window.end;

      if (intervalEnd <= window.start || intervalEnd <= intervalStart) {
        continue;
      }

      addDuration(
        totals,
        event.eventType as StateEventType,
        secondsBetween(intervalStart, intervalEnd)
      );
    }

    durations.set(key, totals);
  }

  return durations;
}

function aggregateDurations(
  values: Iterable<DurationTotals>,
  predicate: (value: DurationTotals) => boolean = () => true
): DurationTotals {
  const totals = emptyDurations();

  for (const value of values) {
    if (!predicate(value)) {
      continue;
    }

    totals.activeSeconds += value.activeSeconds;
    totals.idleSeconds += value.idleSeconds;
    totals.absentSeconds += value.absentSeconds;
    totals.trackedSeconds += value.trackedSeconds;
  }

  return totals;
}

function productionBy(
  events: ProductEvent[],
  keyForEvent: (event: ProductEvent) => string
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const event of events) {
    const key = keyForEvent(event);
    totals.set(key, (totals.get(key) ?? 0) + event.count);
  }

  return totals;
}

function workerMetricPayload(args: {
  workerId: string;
  name: string;
  durations: DurationTotals;
  unitsProduced: number;
}) {
  return {
    worker_id: args.workerId,
    name: args.name,
    active_time_seconds: round(args.durations.activeSeconds),
    idle_time_seconds: round(args.durations.idleSeconds),
    absent_time_seconds: round(args.durations.absentSeconds),
    tracked_time_seconds: round(args.durations.trackedSeconds),
    utilization_percentage: percent(
      args.durations.activeSeconds,
      args.durations.trackedSeconds
    ),
    total_units_produced: args.unitsProduced,
    units_per_active_hour: ratePerHour(
      args.unitsProduced,
      args.durations.activeSeconds
    ),
    units_per_tracked_hour: ratePerHour(
      args.unitsProduced,
      args.durations.trackedSeconds
    )
  };
}

function workstationMetricPayload(args: {
  stationId: string;
  name: string;
  type: string;
  durations: DurationTotals;
  unitsProduced: number;
}) {
  return {
    station_id: args.stationId,
    name: args.name,
    type: args.type,
    occupancy_time_seconds: round(args.durations.activeSeconds),
    idle_time_seconds: round(args.durations.idleSeconds),
    absent_time_seconds: round(args.durations.absentSeconds),
    tracked_time_seconds: round(args.durations.trackedSeconds),
    utilization_percentage: percent(
      args.durations.activeSeconds,
      args.durations.trackedSeconds
    ),
    total_units_produced: args.unitsProduced,
    throughput_rate_units_per_hour: ratePerHour(
      args.unitsProduced,
      args.durations.trackedSeconds
    )
  };
}

async function buildMetricsContext(query: MetricsQueryInput) {
  const window = await getAnalysisWindow(query);

  if (!window.start || !window.end) {
    return {
      window,
      workerStationDurations: new Map(),
      productEvents: []
    };
  }

  const requiredWindow: NonEmptyAnalysisWindow = {
    start: window.start,
    end: window.end
  };
  const { stateEvents, productEvents } = await getMetricEvents(query, requiredWindow);

  return {
    window,
    workerStationDurations: computeDurationsByWorkerStation(
      stateEvents,
      requiredWindow
    ),
    productEvents
  };
}

export async function getWorkerMetrics(query: MetricsQueryInput) {
  const [workers, context] = await Promise.all([
    WorkerModel.find(query.worker_id ? { workerId: query.worker_id } : {})
      .sort({ workerId: 1 })
      .lean(),
    buildMetricsContext(query)
  ]);
  const production = productionBy(context.productEvents, (event) => event.workerExternalId);

  return {
    window: context.window,
    workers: workers.map((worker) => {
      const durations = aggregateDurations(
        context.workerStationDurations.values(),
        (value) =>
          "workerExternalId" in value && value.workerExternalId === worker.workerId
      );

      return workerMetricPayload({
        workerId: worker.workerId,
        name: worker.name,
        durations,
        unitsProduced: production.get(worker.workerId) ?? 0
      });
    })
  };
}

export async function getWorkerMetric(workerId: string, query: MetricsQueryInput) {
  const result = await getWorkerMetrics({ ...query, worker_id: workerId });
  return result.workers[0] ? { window: result.window, worker: result.workers[0] } : null;
}

export async function getWorkstationMetrics(query: MetricsQueryInput) {
  const [workstations, context] = await Promise.all([
    WorkstationModel.find(
      query.workstation_id ? { stationId: query.workstation_id } : {}
    )
      .sort({ stationId: 1 })
      .lean(),
    buildMetricsContext(query)
  ]);
  const production = productionBy(
    context.productEvents,
    (event) => event.stationExternalId
  );

  return {
    window: context.window,
    workstations: workstations.map((station) => {
      const durations = aggregateDurations(
        context.workerStationDurations.values(),
        (value) =>
          "stationExternalId" in value && value.stationExternalId === station.stationId
      );

      return workstationMetricPayload({
        stationId: station.stationId,
        name: station.name,
        type: station.type,
        durations,
        unitsProduced: production.get(station.stationId) ?? 0
      });
    })
  };
}

export async function getWorkstationMetric(
  stationId: string,
  query: MetricsQueryInput
) {
  const result = await getWorkstationMetrics({
    ...query,
    workstation_id: stationId
  });
  return result.workstations[0]
    ? { window: result.window, workstation: result.workstations[0] }
    : null;
}

export async function getFactoryMetrics(query: MetricsQueryInput) {
  const [workerResult, workstationResult] = await Promise.all([
    getWorkerMetrics(query),
    getWorkstationMetrics(query)
  ]);
  const activeWorkers = workerResult.workers.filter(
    (worker) => worker.tracked_time_seconds > 0
  );
  const activeStations = workstationResult.workstations.filter(
    (station) => station.tracked_time_seconds > 0
  );
  const totalProductiveTime = workerResult.workers.reduce(
    (sum, worker) => sum + worker.active_time_seconds,
    0
  );
  const totalTrackedTime = workerResult.workers.reduce(
    (sum, worker) => sum + worker.tracked_time_seconds,
    0
  );
  const totalProductionCount = workerResult.workers.reduce(
    (sum, worker) => sum + worker.total_units_produced,
    0
  );
  const averageWorkerUtilization =
    activeWorkers.length > 0
      ? round(
          activeWorkers.reduce(
            (sum, worker) => sum + worker.utilization_percentage,
            0
          ) / activeWorkers.length
        )
      : 0;
  const averageWorkerProductionRate =
    activeWorkers.length > 0
      ? round(
          activeWorkers.reduce(
            (sum, worker) => sum + worker.units_per_tracked_hour,
            0
          ) / activeWorkers.length
        )
      : 0;
  const averageWorkstationThroughputRate =
    activeStations.length > 0
      ? round(
          activeStations.reduce(
            (sum, station) => sum + station.throughput_rate_units_per_hour,
            0
          ) / activeStations.length
        )
      : 0;

  return {
    window: workerResult.window,
    factory: {
      total_productive_time_seconds: round(totalProductiveTime),
      total_tracked_time_seconds: round(totalTrackedTime),
      total_production_count: totalProductionCount,
      production_rate_units_per_tracked_hour: ratePerHour(
        totalProductionCount,
        totalTrackedTime
      ),
      average_worker_production_rate_units_per_hour:
        averageWorkerProductionRate,
      average_workstation_throughput_rate_units_per_hour:
        averageWorkstationThroughputRate,
      average_worker_utilization_percentage: averageWorkerUtilization,
      worker_count: workerResult.workers.length,
      workstation_count: workstationResult.workstations.length
    }
  };
}
