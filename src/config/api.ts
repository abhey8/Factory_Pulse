import { CorsOptions } from "cors";
import { env } from "./env";

export const API_PREFIX = "/api";

export const apiRoutes = {
  bootstrap: "/bootstrap",
  workers: "/workers",
  workstations: "/workstations",
  events: "/events",
  eventIngest: "/events/ingest",
  metricsFactory: "/metrics/factory",
  metricsWorkers: "/metrics/workers",
  metricsWorkstations: "/metrics/workstations",
  adminSeed: "/admin/seed",
  adminResetAndSeed: "/admin/reset-and-seed",
  adminEvents: "/admin/events"
} as const;

export const corsOptions: CorsOptions = {
  origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN,
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
