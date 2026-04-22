import { WorkerModel } from "../models/worker.model";

export async function listWorkers() {
  const workers = await WorkerModel.find()
    .sort({ workerId: 1 })
    .select({ workerId: 1, name: 1, createdAt: 1, updatedAt: 1, _id: 0 })
    .lean();

  return workers;
}
