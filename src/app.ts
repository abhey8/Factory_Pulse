import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { API_PREFIX, corsOptions } from "./config/api";
import { openApiSpec } from "./docs/openapi";
import { errorHandler, notFoundHandler } from "./lib/errors";
import { apiRouter } from "./routes";
import { healthRouter } from "./routes/health.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), "public")));

  app.use(healthRouter);
  app.get("/openapi.json", (_req, res) => res.json(openApiSpec));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use(API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
