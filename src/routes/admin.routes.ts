import { Router } from "express";
import { apiRoutes } from "../config/api";
import { clearEvents, resetAndSeed, seed } from "../controllers/admin.controller";
import { asyncHandler } from "../lib/asyncHandler";

export const adminRouter = Router();

adminRouter.post(apiRoutes.adminSeed, asyncHandler(seed));
adminRouter.post(apiRoutes.adminResetAndSeed, asyncHandler(resetAndSeed));
adminRouter.delete(apiRoutes.adminEvents, asyncHandler(clearEvents));
