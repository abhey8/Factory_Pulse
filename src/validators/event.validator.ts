import { z } from "zod";

export const eventTypeSchema = z.enum([
  "working",
  "idle",
  "absent",
  "product_count"
]);

export const aiEventSchema = z
  .object({
    timestamp: z.string().datetime({ offset: true }),
    worker_id: z.string().trim().min(1),
    workstation_id: z.string().trim().min(1),
    event_type: eventTypeSchema,
    confidence: z.number().min(0).max(1),
    count: z.number().int().nonnegative().optional(),
    source_event_id: z.string().trim().min(1).optional()
  })
  .superRefine((event, ctx) => {
    if (event.event_type === "product_count" && event.count === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["count"],
        message: "count is required for product_count events"
      });
    }
  })
  .transform((event) => ({
    ...event,
    timestamp: new Date(event.timestamp),
    count: event.count ?? 0
  }));

export const ingestBodySchema = z.union([
  z.record(z.unknown()),
  z.array(z.unknown()).min(1)
]);

export const eventQuerySchema = z
  .object({
    worker_id: z.string().trim().min(1).optional(),
    workstation_id: z.string().trim().min(1).optional(),
    event_type: eventTypeSchema.optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(100)
  })
  .transform((query) => ({
    ...query,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined
  }));

export type AIEventInput = z.infer<typeof aiEventSchema>;
export type EventQueryInput = z.infer<typeof eventQuerySchema>;
