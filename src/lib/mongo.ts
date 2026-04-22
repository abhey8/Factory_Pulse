import mongoose from "mongoose";
import { env } from "../config/env";
import { AIEventModel } from "../models/aiEvent.model";
import { WorkerModel } from "../models/worker.model";
import { WorkstationModel } from "../models/workstation.model";
import { logger } from "./logger";

export async function connectMongoDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI);
  await Promise.all([
    WorkerModel.init(),
    WorkstationModel.init(),
    AIEventModel.init()
  ]);
  logger.info("MongoDB connected");
}

export async function disconnectMongoDB() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}
