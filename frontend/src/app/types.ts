export type WorkerStatus = "working" | "idle" | "absent";
export type WorkstationStatus = "active" | "idle" | "offline";
export type EventType = "working" | "idle" | "absent" | "product_count";

export interface Worker {
  id: string;
  name: string;
  activeTime: number;
  idleTime: number;
  absentTime: number;
  trackedTime: number;
  utilization: number;
  unitsProduced: number;
  unitsPerHour: number;
  status: WorkerStatus;
  station?: string;
}

export interface Workstation {
  id: string;
  name: string;
  type: string;
  occupancyTime: number;
  trackedTime: number;
  utilization: number;
  unitsProduced: number;
  throughputRate: number;
  status: WorkstationStatus;
  assignedWorker?: string;
}

export interface Event {
  id: string;
  timestamp: string;
  workerId: string;
  workerName: string;
  stationId: string;
  stationName?: string;
  eventType: EventType;
  confidence: number;
  count?: number;
}

export interface ProductionDataPoint {
  time: string;
  production: number;
}

export interface SummaryMetrics {
  totalProductiveTime: number;
  totalProduction: number;
  avgUtilization: number;
  avgProductionRate: number;
}
