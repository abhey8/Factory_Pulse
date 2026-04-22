import { Request, Response } from "express";
import { ingestEvents, listEvents } from "../services/event.service";
import { eventQuerySchema, ingestBodySchema } from "../validators/event.validator";

export async function ingest(req: Request, res: Response) {
  const bodyCheck = ingestBodySchema.safeParse(req.body);

  if (!bodyCheck.success) {
    res.status(400).json({
      error: {
        message: "Request body must be a single event object or a non-empty array of events"
      }
    });
    return;
  }

  const result = await ingestEvents(bodyCheck.data);
  const statusCode =
    result.summary.inserted > 0
      ? result.summary.invalid > 0
        ? 207
        : 201
      : result.summary.duplicates > 0 && result.summary.invalid === 0
        ? 200
        : 400;

  res.status(statusCode).json({ data: result });
}

export async function getEvents(req: Request, res: Response) {
  const query = eventQuerySchema.parse(req.query);
  const events = await listEvents(query);
  res.json({
    data: events,
    meta: {
      count: events.length,
      sort: "timestamp_desc"
    }
  });
}
