import { z } from "zod";

export const metricsQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    worker_id: z.string().trim().min(1).optional(),
    workstation_id: z.string().trim().min(1).optional()
  })
  .superRefine((query, ctx) => {
    if (query.from && query.to && new Date(query.from) > new Date(query.to)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "to must be greater than or equal to from"
      });
    }
  })
  .transform((query) => ({
    ...query,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined
  }));

export type MetricsQueryInput = z.infer<typeof metricsQuerySchema>;
