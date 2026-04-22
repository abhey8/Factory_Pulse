import { Router } from "express";
import { apiRoutes } from "../config/api";
import { getWorkstations } from "../controllers/workstation.controller";
import { asyncHandler } from "../lib/asyncHandler";

export const workstationRouter = Router();

workstationRouter.get(apiRoutes.workstations, asyncHandler(getWorkstations));
