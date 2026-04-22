import { env } from "./config/env";
import { createApp } from "./app";
import { logger } from "./lib/logger";
import { connectMongoDB, disconnectMongoDB } from "./lib/mongo";

const app = createApp();

let server: ReturnType<typeof app.listen> | undefined;

async function start() {
  await connectMongoDB();

  server = app.listen(env.PORT, () => {
    logger.info("Factory productivity API listening", {
      port: env.PORT,
      nodeEnv: env.NODE_ENV
    });
  });
}

async function shutdown(signal: string) {
  logger.info("Shutdown signal received", { signal });

  if (!server) {
    await disconnectMongoDB();
    process.exit(0);
  }

  server.close(async () => {
    await disconnectMongoDB();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

start().catch((error) => {
  logger.error("Failed to start API", {
    message: error instanceof Error ? error.message : "Unknown startup error"
  });
  process.exit(1);
});
