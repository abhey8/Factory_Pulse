import { Request, Response } from "express";
import {
  getFactoryMetrics,
  getWorkerMetric,
  getWorkerMetrics,
  getWorkstationMetric,
  getWorkstationMetrics
} from "../services/metrics.service";
import { metricsQuerySchema } from "../validators/metrics.validator";

function serializeWindow(window: { start: Date | null; end: Date | null }) {
  return {
    from: window.start?.toISOString() ?? null,
    to: window.end?.toISOString() ?? null
  };
}

export async function factoryMetrics(req: Request, res: Response) {
  const query = metricsQuerySchema.parse(req.query);
  const result = await getFactoryMetrics(query);

  res.json({ data: result.factory, meta: { window: serializeWindow(result.window) } });
}

export async function workerMetrics(req: Request, res: Response) {
  const query = metricsQuerySchema.parse(req.query);
  const result = await getWorkerMetrics(query);

  res.json({
    data: result.workers,
    meta: {
      count: result.workers.length,
      window: serializeWindow(result.window)
    }
  });
}

export async function workerMetric(req: Request, res: Response) {
  const query = metricsQuerySchema.parse(req.query);
  const result = await getWorkerMetric(String(req.params.workerId), query);

  if (!result) {
    res.status(404).json({ error: { message: "Worker not found" } });
    return;
  }

  res.json({ data: result.worker, meta: { window: serializeWindow(result.window) } });
}

export async function workstationMetrics(req: Request, res: Response) {
  const query = metricsQuerySchema.parse(req.query);
  const result = await getWorkstationMetrics(query);

  res.json({
    data: result.workstations,
    meta: {
      count: result.workstations.length,
      window: serializeWindow(result.window)
    }
  });
}

export async function workstationMetric(req: Request, res: Response) {
  const query = metricsQuerySchema.parse(req.query);
  const result = await getWorkstationMetric(String(req.params.stationId), query);

  if (!result) {
    res.status(404).json({ error: { message: "Workstation not found" } });
    return;
  }

  res.json({
    data: result.workstation,
    meta: { window: serializeWindow(result.window) }
  });
}
