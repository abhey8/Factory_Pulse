import { Router } from "express";
import { apiRoutes } from "../config/api";
import { bootstrap } from "../controllers/bootstrap.controller";
import { asyncHandler } from "../lib/asyncHandler";

export const bootstrapRouter = Router();

bootstrapRouter.get(apiRoutes.bootstrap, asyncHandler(bootstrap));
