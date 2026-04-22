import { InferSchemaType, Model, Schema, Types, model, models } from "mongoose";

const workstationSchema = new Schema(
  {
    stationId: {
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
    },
    type: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    collection: "workstations",
    timestamps: true
  }
);

export type Workstation = InferSchemaType<typeof workstationSchema>;
export type WorkstationDocument = Workstation & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const WorkstationModel =
  (models.Workstation as Model<WorkstationDocument> | undefined) ||
  model<WorkstationDocument>("Workstation", workstationSchema);
