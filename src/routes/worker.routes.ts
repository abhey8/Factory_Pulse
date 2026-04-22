import { Router } from "express";
import { apiRoutes } from "../config/api";
import { getWorkers } from "../controllers/worker.controller";
import { asyncHandler } from "../lib/asyncHandler";

export const workerRouter = Router();

workerRouter.get(apiRoutes.workers, asyncHandler(getWorkers));
