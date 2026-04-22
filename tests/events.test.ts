import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { AIEventModel } from "../src/models/aiEvent.model";

const app = createApp();

const validEvent = {
  timestamp: "2026-04-21T09:15:00.000Z",
  worker_id: "W001",
  workstation_id: "S001",
  event_type: "product_count",
  confidence: 0.95,
  count: 11
};

describe("event ingestion", () => {
  beforeEach(async () => {
    await request(app).post("/api/admin/reset-and-seed").expect(201);
    await request(app).delete("/api/admin/events").expect(200);
  });

  it("ingests a valid single event", async () => {
    const response = await request(app)
      .post("/api/events/ingest")
      .send(validEvent)
      .expect(201);

    expect(response.body.data.summary).toMatchObject({
      received: 1,
      inserted: 1,
      skipped: 0,
      duplicates: 0,
      invalid: 0
    });

    const stored = await AIEventModel.find().lean();
    expect(stored).toHaveLength(1);
    expect(stored[0].occurredAt.toISOString()).toBe(validEvent.timestamp);
  });

  it("rejects invalid payloads cleanly", async () => {
    const response = await request(app)
      .post("/api/events/ingest")
      .send({
        ...validEvent,
        worker_id: "W404",
        confidence: 1.2
      })
      .expect(400);

    expect(response.body.data.summary).toMatchObject({
      received: 1,
      inserted: 0,
      invalid: 1
    });
    expect(response.body.data.items[0].status).toBe("invalid");
  });

  it("skips duplicate events without double-counting", async () => {
    await request(app).post("/api/events/ingest").send(validEvent).expect(201);

    const duplicateResponse = await request(app)
      .post("/api/events/ingest")
      .send(validEvent)
      .expect(200);

    expect(duplicateResponse.body.data.summary).toMatchObject({
      received: 1,
      inserted: 0,
      skipped: 1,
      duplicates: 1,
      invalid: 0
    });

    const stored = await AIEventModel.find().lean();
    expect(stored).toHaveLength(1);
  });

  it("supports batch ingestion with valid, duplicate, and invalid item results", async () => {
    const response = await request(app)
      .post("/api/events/ingest")
      .send([
        validEvent,
        {
          timestamp: "2026-04-21T09:20:00.000Z",
          worker_id: "W002",
          workstation_id: "S002",
          event_type: "working",
          confidence: 0.9
        },
        validEvent,
        {
          timestamp: "2026-04-21T09:25:00.000Z",
          worker_id: "W999",
          workstation_id: "S002",
          event_type: "idle",
          confidence: 0.88
        }
      ])
      .expect(207);

    expect(response.body.data.summary).toMatchObject({
      received: 4,
      inserted: 2,
      skipped: 2,
      duplicates: 1,
      invalid: 1
    });
    expect(response.body.data.items.map((item: { status: string }) => item.status)).toEqual([
      "inserted",
      "inserted",
      "duplicate",
      "invalid"
    ]);
  });

  it("accepts out-of-order events and lists by event timestamp descending", async () => {
    await request(app)
      .post("/api/events/ingest")
      .send([
        {
          ...validEvent,
          timestamp: "2026-04-21T15:00:00.000Z",
          count: 8
        },
        {
          ...validEvent,
          timestamp: "2026-04-21T08:00:00.000Z",
          count: 3
        }
      ])
      .expect(201);

    const response = await request(app)
      .get("/api/events")
      .query({ worker_id: "W001", limit: 10 })
      .expect(200);

    expect(response.body.data.map((event: { timestamp: string }) => event.timestamp)).toEqual([
      "2026-04-21T15:00:00.000Z",
      "2026-04-21T08:00:00.000Z"
    ]);
  });
});
