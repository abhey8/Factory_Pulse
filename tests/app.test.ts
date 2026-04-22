import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const app = createApp();

describe("app", () => {
  it("returns health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  it("serves the OpenAPI document", async () => {
    const response = await request(app).get("/openapi.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.0.3");
    expect(response.body.paths["/api/workers"]).toBeDefined();
    expect(response.body.paths["/api/bootstrap"]).toBeDefined();
  });

  it("serves the React dashboard shell", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Design FactoryPulse AI Dashboard");
    expect(response.text).toContain('<div id="root"></div>');
  });

  it("returns a bootstrap payload for dashboard loading", async () => {
    await request(app).post("/api/admin/reset-and-seed").expect(201);

    const response = await request(app).get("/api/bootstrap");

    expect(response.status).toBe(200);
    expect(response.body.data.workers).toHaveLength(6);
    expect(response.body.data.workstations).toHaveLength(6);
    expect(response.body.data.factory.total_production_count).toEqual(expect.any(Number));
    expect(response.body.meta.generated_at).toEqual(expect.any(String));
  });

  it("returns a clear 404 response for unknown routes", async () => {
    const response = await request(app).get("/missing");

    expect(response.status).toBe(404);
    expect(response.body.error.message).toContain("Route not found");
  });
});
