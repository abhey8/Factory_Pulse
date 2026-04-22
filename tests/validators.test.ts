import { describe, expect, it } from "vitest";
import { aiEventSchema } from "../src/validators/event.validator";

describe("aiEventSchema", () => {
  it("accepts a valid AI event payload", () => {
    const parsed = aiEventSchema.parse({
      timestamp: "2026-04-21T08:30:00.000Z",
      worker_id: "W001",
      workstation_id: "S001",
      event_type: "product_count",
      confidence: 0.94,
      count: 12,
      source_event_id: "camera-1-0001"
    });

    expect(parsed.timestamp).toBeInstanceOf(Date);
    expect(parsed.count).toBe(12);
  });

  it("rejects unknown event types and invalid confidence scores", () => {
    const result = aiEventSchema.safeParse({
      timestamp: "2026-04-21T08:30:00.000Z",
      worker_id: "W001",
      workstation_id: "S001",
      event_type: "break",
      confidence: 1.4,
      count: 0
    });

    expect(result.success).toBe(false);
  });
});
