export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Factory Productivity API",
    version: "0.1.0",
    description:
      "Backend APIs for a manufacturing productivity dashboard powered by AI CCTV events."
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "API is healthy"
          }
        }
      }
    },
    "/api/workers": {
      get: {
        summary: "List workers",
        responses: {
          "200": {
            description: "Workers sorted by worker ID"
          }
        }
      }
    },
    "/api/workstations": {
      get: {
        summary: "List workstations",
        responses: {
          "200": {
            description: "Workstations sorted by station ID"
          }
        }
      }
    },
    "/api/events": {
      get: {
        summary: "List AI events",
        parameters: [
          {
            in: "query",
            name: "worker_id",
            schema: { type: "string" },
            example: "W001"
          },
          {
            in: "query",
            name: "workstation_id",
            schema: { type: "string" },
            example: "S001"
          },
          {
            in: "query",
            name: "event_type",
            schema: {
              type: "string",
              enum: ["working", "idle", "absent", "product_count"]
            }
          },
          {
            in: "query",
            name: "from",
            schema: { type: "string", format: "date-time" }
          },
          {
            in: "query",
            name: "to",
            schema: { type: "string", format: "date-time" }
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", minimum: 1, maximum: 500, default: 100 }
          }
        ],
        responses: {
          "200": {
            description: "Events sorted by timestamp descending"
          }
        }
      }
    },
    "/api/events/ingest": {
      post: {
        summary: "Ingest one or more AI CCTV events",
        description:
          "Accepts a single event object or an array. Duplicate semantic fingerprints are skipped so delayed retries do not double-count metrics.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                oneOf: [
                  { $ref: "#/components/schemas/AIEventInput" },
                  {
                    type: "array",
                    minItems: 1,
                    items: { $ref: "#/components/schemas/AIEventInput" }
                  }
                ]
              }
            }
          }
        },
        responses: {
          "201": {
            description: "All valid new events were inserted"
          },
          "207": {
            description: "Some events were inserted and some were invalid or duplicates"
          },
          "400": {
            description: "Payload was malformed or all events were invalid"
          }
        }
      }
    },
    "/api/bootstrap": {
      get: {
        summary: "Get dashboard bootstrap payload",
        description:
          "Returns workers, workstations, and factory metrics for the React dashboard startup request.",
        responses: {
          "200": {
            description: "Bootstrap data for dashboard loading"
          }
        }
      }
    },
    "/api/metrics/factory": {
      get: {
        summary: "Get factory-level productivity metrics",
        description:
          "Computes metrics from event timestamps after sorting state events chronologically.",
        parameters: [
          { in: "query", name: "from", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "to", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "worker_id", schema: { type: "string" } },
          { in: "query", name: "workstation_id", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Factory metrics" }
        }
      }
    },
    "/api/metrics/workers": {
      get: {
        summary: "Get worker-level productivity metrics",
        parameters: [
          { in: "query", name: "from", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "to", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "worker_id", schema: { type: "string" } },
          { in: "query", name: "workstation_id", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Worker metrics sorted by worker ID" }
        }
      }
    },
    "/api/metrics/workers/{workerId}": {
      get: {
        summary: "Get metrics for one worker",
        parameters: [
          {
            in: "path",
            name: "workerId",
            required: true,
            schema: { type: "string" },
            example: "W001"
          },
          { in: "query", name: "from", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "to", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "workstation_id", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Worker metrics" },
          "404": { description: "Worker not found" }
        }
      }
    },
    "/api/metrics/workstations": {
      get: {
        summary: "Get workstation-level productivity metrics",
        parameters: [
          { in: "query", name: "from", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "to", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "worker_id", schema: { type: "string" } },
          { in: "query", name: "workstation_id", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Workstation metrics sorted by station ID" }
        }
      }
    },
    "/api/metrics/workstations/{stationId}": {
      get: {
        summary: "Get metrics for one workstation",
        parameters: [
          {
            in: "path",
            name: "stationId",
            required: true,
            schema: { type: "string" },
            example: "S001"
          },
          { in: "query", name: "from", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "to", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "worker_id", schema: { type: "string" } }
        ],
        responses: {
          "200": { description: "Workstation metrics" },
          "404": { description: "Workstation not found" }
        }
      }
    },
    "/api/admin/seed": {
      post: {
        summary: "Seed baseline factory data without clearing existing documents",
        responses: {
          "201": {
            description: "Seed data was upserted"
          }
        }
      }
    },
    "/api/admin/reset-and-seed": {
      post: {
        summary: "Reset and seed baseline factory data",
        responses: {
          "201": {
            description: "Existing factory documents were cleared and seed data was inserted"
          }
        }
      }
    },
    "/api/admin/events": {
      delete: {
        summary: "Delete all AI events",
        responses: {
          "200": {
            description: "All AI events were deleted"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Worker: {
        type: "object",
        properties: {
          workerId: { type: "string", example: "W001" },
          name: { type: "string", example: "Asha Patel" }
        }
      },
      Workstation: {
        type: "object",
        properties: {
          stationId: { type: "string", example: "S001" },
          name: { type: "string", example: "Cutting Bay 1" },
          type: { type: "string", example: "cutting" }
        }
      },
      AIEventInput: {
        type: "object",
        required: [
          "timestamp",
          "worker_id",
          "workstation_id",
          "event_type",
          "confidence"
        ],
        properties: {
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2026-04-21T08:30:00.000Z"
          },
          worker_id: { type: "string", example: "W001" },
          workstation_id: { type: "string", example: "S001" },
          event_type: {
            type: "string",
            enum: ["working", "idle", "absent", "product_count"],
            example: "product_count"
          },
          confidence: { type: "number", minimum: 0, maximum: 1, example: 0.94 },
          count: {
            type: "integer",
            minimum: 0,
            description: "Required for product_count events; defaults to 0 otherwise",
            example: 12
          },
          source_event_id: {
            type: "string",
            description: "Optional source-system event ID used as an additional idempotency key",
            example: "camera-1-20260421-000123"
          }
        }
      }
    }
  }
};
