import { Router } from "express";
import { apiRoutes } from "../config/api";
import {
  factoryMetrics,
  workerMetric,
  workerMetrics,
  workstationMetric,
  workstationMetrics
} from "../controllers/metrics.controller";
import { asyncHandler } from "../lib/asyncHandler";

export const metricsRouter = Router();

metricsRouter.get(apiRoutes.metricsFactory, asyncHandler(factoryMetrics));
metricsRouter.get(apiRoutes.metricsWorkers, asyncHandler(workerMetrics));
metricsRouter.get(`${apiRoutes.metricsWorkers}/:workerId`, asyncHandler(workerMetric));
metricsRouter.get(apiRoutes.metricsWorkstations, asyncHandler(workstationMetrics));
metricsRouter.get(
  `${apiRoutes.metricsWorkstations}/:stationId`,
  asyncHandler(workstationMetric)
);
