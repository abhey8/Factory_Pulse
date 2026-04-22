import { Router } from "express";
import { apiRoutes } from "../config/api";
import { getEvents, ingest } from "../controllers/event.controller";
import { asyncHandler } from "../lib/asyncHandler";

export const eventRouter = Router();

eventRouter.get(apiRoutes.events, asyncHandler(getEvents));
eventRouter.post(apiRoutes.eventIngest, asyncHandler(ingest));
