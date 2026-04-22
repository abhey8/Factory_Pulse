import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

async function resetEvents() {
  await request(app).post("/api/admin/reset-and-seed").expect(201);
  await request(app).delete("/api/admin/events").expect(200);
}

describe("metrics", () => {
  beforeEach(async () => {
    await resetEvents();
  });

  it("calculates worker durations from chronologically ordered state events", async () => {
    await request(app)
      .post("/api/events/ingest")
      .send([
        {
          timestamp: "2026-04-21T10:00:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "working",
          confidence: 0.95
        },
        {
          timestamp: "2026-04-21T10:30:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "product_count",
          confidence: 0.94,
          count: 5
        },
        {
          timestamp: "2026-04-21T11:00:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "idle",
          confidence: 0.93
        },
        {
          timestamp: "2026-04-21T11:15:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "product_count",
          confidence: 0.92,
          count: 2
        },
        {
          timestamp: "2026-04-21T11:30:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "working",
          confidence: 0.91
        },
        {
          timestamp: "2026-04-21T12:00:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "absent",
          confidence: 0.9
        }
      ])
      .expect(201);

    const response = await request(app)
      .get("/api/metrics/workers/W001")
      .query({ to: "2026-04-21T12:00:00.000Z" })
      .expect(200);

    expect(response.body.data).toMatchObject({
      worker_id: "W001",
      active_time_seconds: 5400,
      idle_time_seconds: 1800,
      absent_time_seconds: 0,
      tracked_time_seconds: 7200,
      utilization_percentage: 75,
      total_units_produced: 7,
      units_per_active_hour: 4.67,
      units_per_tracked_hour: 3.5
    });
  });

  it("computes correctly when events arrive out of order", async () => {
    await request(app)
      .post("/api/events/ingest")
      .send([
        {
          timestamp: "2026-04-21T11:00:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "idle",
          confidence: 0.94
        },
        {
          timestamp: "2026-04-21T10:00:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "working",
          confidence: 0.95
        }
      ])
      .expect(201);

    const response = await request(app)
      .get("/api/metrics/workers/W001")
      .query({ to: "2026-04-21T12:00:00.000Z" })
      .expect(200);

    expect(response.body.data.active_time_seconds).toBe(3600);
    expect(response.body.data.idle_time_seconds).toBe(3600);
    expect(response.body.data.utilization_percentage).toBe(50);
  });

  it("aggregates production separately from state durations", async () => {
    await request(app)
      .post("/api/events/ingest")
      .send([
        {
          timestamp: "2026-04-21T09:10:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "product_count",
          confidence: 0.93,
          count: 4
        },
        {
          timestamp: "2026-04-21T09:20:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "product_count",
          confidence: 0.94,
          count: 6
        }
      ])
      .expect(201);

    const response = await request(app)
      .get("/api/metrics/workstations/S001")
      .expect(200);

    expect(response.body.data).toMatchObject({
      station_id: "S001",
      occupancy_time_seconds: 0,
      tracked_time_seconds: 0,
      utilization_percentage: 0,
      total_units_produced: 10,
      throughput_rate_units_per_hour: 0
    });
  });

  it("calculates factory utilization and production rates", async () => {
    await request(app)
      .post("/api/events/ingest")
      .send([
        {
          timestamp: "2026-04-21T10:00:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "working",
          confidence: 0.95
        },
        {
          timestamp: "2026-04-21T11:00:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "idle",
          confidence: 0.93
        },
        {
          timestamp: "2026-04-21T10:30:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "product_count",
          confidence: 0.92,
          count: 8
        },
        {
          timestamp: "2026-04-21T10:00:00.000Z",
          worker_id: "W002",
          workstation_id: "S002",
          event_type: "working",
          confidence: 0.91
        },
        {
          timestamp: "2026-04-21T12:00:00.000Z",
          worker_id: "W002",
          workstation_id: "S002",
          event_type: "absent",
          confidence: 0.9
        },
        {
          timestamp: "2026-04-21T11:30:00.000Z",
          worker_id: "W002",
          workstation_id: "S002",
          event_type: "product_count",
          confidence: 0.92,
          count: 12
        }
      ])
      .expect(201);

    const response = await request(app)
      .get("/api/metrics/factory")
      .query({ to: "2026-04-21T12:00:00.000Z" })
      .expect(200);

    expect(response.body.data).toMatchObject({
      total_productive_time_seconds: 10800,
      total_tracked_time_seconds: 14400,
      total_production_count: 20,
      production_rate_units_per_tracked_hour: 5,
      average_worker_utilization_percentage: 75
    });
  });

  it("clips duration calculations to filtered time ranges", async () => {
    await request(app)
      .post("/api/events/ingest")
      .send([
        {
          timestamp: "2026-04-21T08:00:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "working",
          confidence: 0.95
        },
        {
          timestamp: "2026-04-21T10:00:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "idle",
          confidence: 0.93
        },
        {
          timestamp: "2026-04-21T11:00:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "absent",
          confidence: 0.9
        },
        {
          timestamp: "2026-04-21T09:30:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "product_count",
          confidence: 0.91,
          count: 3
        },
        {
          timestamp: "2026-04-21T10:45:00.000Z",
          worker_id: "W001",
          workstation_id: "S001",
          event_type: "product_count",
          confidence: 0.9,
          count: 7
        }
      ])
      .expect(201);

    const response = await request(app)
      .get("/api/metrics/workers/W001")
      .query({
        from: "2026-04-21T09:00:00.000Z",
        to: "2026-04-21T10:30:00.000Z"
      })
      .expect(200);

    expect(response.body.data).toMatchObject({
      active_time_seconds: 3600,
      idle_time_seconds: 1800,
      absent_time_seconds: 0,
      tracked_time_seconds: 5400,
      utilization_percentage: 66.67,
      total_units_produced: 3
    });
  });
});
