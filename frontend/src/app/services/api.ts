import {
  Event,
  EventType,
  ProductionDataPoint,
  SummaryMetrics,
  Worker,
  WorkerStatus,
  Workstation,
  WorkstationStatus
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

type BackendWorker = {
  workerId: string;
  name: string;
};

type BackendWorkstation = {
  stationId: string;
  name: string;
  type: string;
};

type BackendFactoryMetrics = {
  total_productive_time_seconds: number;
  total_production_count: number;
  production_rate_units_per_tracked_hour: number;
  average_worker_utilization_percentage: number;
};

type BackendWorkerMetric = {
  worker_id: string;
  name: string;
  active_time_seconds: number;
  idle_time_seconds: number;
  absent_time_seconds: number;
  tracked_time_seconds: number;
  utilization_percentage: number;
  total_units_produced: number;
  units_per_tracked_hour: number;
};

type BackendWorkstationMetric = {
  station_id: string;
  name: string;
  type: string;
  occupancy_time_seconds: number;
  tracked_time_seconds: number;
  utilization_percentage: number;
  total_units_produced: number;
  throughput_rate_units_per_hour: number;
};

type BackendEvent = {
  id: string;
  timestamp: string;
  worker_id: string;
  workstation_id: string;
  event_type: EventType;
  confidence: number;
  count: number;
};

type BootstrapPayload = {
  workers: BackendWorker[];
  workstations: BackendWorkstation[];
  factory: BackendFactoryMetrics;
};

export type DashboardFilters = {
  workerId?: string;
  workstationId?: string;
};

export type DashboardData = {
  summary: SummaryMetrics;
  workers: Worker[];
  workstations: Workstation[];
  events: Event[];
  productionData: ProductionDataPoint[];
  allWorkers: BackendWorker[];
  allWorkstations: BackendWorkstation[];
  generatedAt: string;
};

function endpoint(path: string) {
  return `${API_BASE_URL}${path}`;
}

function queryString(filters: DashboardFilters) {
  const params = new URLSearchParams();

  if (filters.workerId) {
    params.set("worker_id", filters.workerId);
  }

  if (filters.workstationId) {
    params.set("workstation_id", filters.workstationId);
  }

  return params.toString();
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(endpoint(path));
  const body = await parseResponse<T>(response);

  if (!response.ok) {
    const message = getErrorMessage(body, response.status);
    throw new Error(message);
  }

  return (body as ApiEnvelope<T>).data;
}

async function post<T>(path: string): Promise<T> {
  const response = await fetch(endpoint(path), { method: "POST" });
  const body = await parseResponse<T>(response);

  if (!response.ok) {
    const message = getErrorMessage(body, response.status);
    throw new Error(message);
  }

  return (body as ApiEnvelope<T>).data;
}

async function parseResponse<T>(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as ApiEnvelope<T> | { error?: { message?: string } };
  }

  return {
    error: {
      message: `Request failed with status ${response.status}: ${await response.text()}`
    }
  };
}

function getErrorMessage(body: ApiEnvelope<unknown> | { error?: { message?: string } }, status: number) {
  return "error" in body && body.error?.message
    ? body.error.message
    : `Request failed with status ${status}`;
}

function hours(seconds: number) {
  return Math.round((seconds / 3600) * 10) / 10;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function workerStatusFor(worker: BackendWorkerMetric, events: BackendEvent[]): WorkerStatus {
  const latestState = events.find(
    (event) =>
      event.worker_id === worker.worker_id && event.event_type !== "product_count"
  );

  if (latestState?.event_type === "working") {
    return "working";
  }

  if (latestState?.event_type === "idle") {
    return "idle";
  }

  if (latestState?.event_type === "absent") {
    return "absent";
  }

  return worker.tracked_time_seconds > 0 ? "working" : "absent";
}

function stationStatusFor(
  station: BackendWorkstationMetric,
  events: BackendEvent[]
): WorkstationStatus {
  const latestState = events.find(
    (event) =>
      event.workstation_id === station.station_id && event.event_type !== "product_count"
  );

  if (latestState?.event_type === "working") {
    return "active";
  }

  if (latestState?.event_type === "idle") {
    return "idle";
  }

  if (latestState?.event_type === "absent") {
    return "offline";
  }

  return station.tracked_time_seconds > 0 ? "active" : "offline";
}

function latestStationFor(workerId: string, events: BackendEvent[], stations: Map<string, string>) {
  const event = events.find((item) => item.worker_id === workerId);
  return event ? (stations.get(event.workstation_id) ?? event.workstation_id) : undefined;
}

function latestWorkerFor(stationId: string, events: BackendEvent[], workers: Map<string, string>) {
  const event = events.find((item) => item.workstation_id === stationId);
  return event ? (workers.get(event.worker_id) ?? event.worker_id) : undefined;
}

function mapEvents(
  events: BackendEvent[],
  workerNames: Map<string, string>,
  stationNames: Map<string, string>
): Event[] {
  return events.map((event) => ({
    id: event.id,
    timestamp: event.timestamp,
    workerId: event.worker_id,
    workerName: workerNames.get(event.worker_id) ?? event.worker_id,
    stationId: event.workstation_id,
    stationName: stationNames.get(event.workstation_id),
    eventType: event.event_type,
    confidence: event.confidence,
    count: event.event_type === "product_count" ? event.count : undefined
  }));
}

function buildProductionData(events: BackendEvent[]): ProductionDataPoint[] {
  const totals = new Map<string, number>();

  events
    .filter((event) => event.event_type === "product_count")
    .forEach((event) => {
      const time = new Date(event.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
      totals.set(time, (totals.get(time) ?? 0) + event.count);
    });

  return [...totals.entries()]
    .reverse()
    .map(([time, production]) => ({ time, production }));
}

export async function fetchDashboardData(filters: DashboardFilters = {}): Promise<DashboardData> {
  const filterQuery = queryString(filters);
  const suffix = filterQuery ? `?${filterQuery}` : "";
  const eventSuffix = filterQuery ? `?${filterQuery}&limit=500` : "?limit=500";

  const [bootstrap, factory, workerMetrics, workstationMetrics, events] =
    await Promise.all([
      request<BootstrapPayload>("/bootstrap"),
      request<BackendFactoryMetrics>(`/metrics/factory${suffix}`),
      request<BackendWorkerMetric[]>(`/metrics/workers/${suffix}`),
      request<BackendWorkstationMetric[]>(`/metrics/workstations/${suffix}`),
      request<BackendEvent[]>(`/events${eventSuffix}`)
    ]);

  const workerNames = new Map(bootstrap.workers.map((worker) => [worker.workerId, worker.name]));
  const stationNames = new Map(
    bootstrap.workstations.map((station) => [station.stationId, station.name])
  );

  return {
    summary: {
      totalProductiveTime: hours(factory.total_productive_time_seconds),
      totalProduction: factory.total_production_count,
      avgUtilization: round(factory.average_worker_utilization_percentage),
      avgProductionRate: round(factory.production_rate_units_per_tracked_hour)
    },
    workers: workerMetrics.map((worker) => ({
      id: worker.worker_id,
      name: worker.name,
      activeTime: hours(worker.active_time_seconds),
      idleTime: hours(worker.idle_time_seconds),
      absentTime: hours(worker.absent_time_seconds),
      trackedTime: hours(worker.tracked_time_seconds),
      utilization: round(worker.utilization_percentage),
      unitsProduced: worker.total_units_produced,
      unitsPerHour: round(worker.units_per_tracked_hour),
      status: workerStatusFor(worker, events),
      station: latestStationFor(worker.worker_id, events, stationNames)
    })),
    workstations: workstationMetrics.map((station) => ({
      id: station.station_id,
      name: station.name,
      type: station.type,
      occupancyTime: hours(station.occupancy_time_seconds),
      trackedTime: hours(station.tracked_time_seconds),
      utilization: round(station.utilization_percentage),
      unitsProduced: station.total_units_produced,
      throughputRate: round(station.throughput_rate_units_per_hour),
      status: stationStatusFor(station, events),
      assignedWorker: latestWorkerFor(station.station_id, events, workerNames)
    })),
    events: mapEvents(events.slice(0, 12), workerNames, stationNames),
    productionData: buildProductionData(events),
    allWorkers: bootstrap.workers,
    allWorkstations: bootstrap.workstations,
    generatedAt: new Date().toISOString()
  };
}

export async function seedData() {
  return post<{ workers: number; workstations: number; events: number }>("/admin/seed");
}
