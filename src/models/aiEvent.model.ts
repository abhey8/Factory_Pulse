import { InferSchemaType, Model, Schema, Types, model, models } from "mongoose";

export const eventTypes = ["working", "idle", "absent", "product_count"] as const;

const aiEventSchema = new Schema(
  {
    occurredAt: {
      type: Date,
      required: true,
      index: true
    },
    workerExternalId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    stationExternalId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    eventType: {
      type: String,
      required: true,
      enum: eventTypes,
      index: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    count: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    sourceEventId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    eventFingerprint: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    workerRef: {
      type: Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
      index: true
    },
    workstationRef: {
      type: Schema.Types.ObjectId,
      ref: "Workstation",
      required: true,
      index: true
    }
  },
  {
    collection: "ai_events",
    timestamps: true
  }
);

aiEventSchema.index({ workerExternalId: 1, occurredAt: 1 });
aiEventSchema.index({ stationExternalId: 1, occurredAt: 1 });
aiEventSchema.index({ eventType: 1, occurredAt: 1 });

export type AIEvent = InferSchemaType<typeof aiEventSchema>;
export type AIEventDocument = AIEvent & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AIEventModel =
  (models.AIEvent as Model<AIEventDocument> | undefined) ||
  model<AIEventDocument>("AIEvent", aiEventSchema);
