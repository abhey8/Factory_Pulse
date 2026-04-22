import { InferSchemaType, Model, Schema, Types, model, models } from "mongoose";

const workerSchema = new Schema(
  {
    workerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    collection: "workers",
    timestamps: true
  }
);

export type Worker = InferSchemaType<typeof workerSchema>;
export type WorkerDocument = Worker & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const WorkerModel =
  (models.Worker as Model<WorkerDocument> | undefined) ||
  model<WorkerDocument>("Worker", workerSchema);
