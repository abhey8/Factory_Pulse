import { WorkstationModel } from "../models/workstation.model";

export async function listWorkstations() {
  const workstations = await WorkstationModel.find()
    .sort({ stationId: 1 })
    .select({ stationId: 1, name: 1, type: 1, createdAt: 1, updatedAt: 1, _id: 0 })
    .lean();

  return workstations;
}
