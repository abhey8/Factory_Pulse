import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // Required outside Docker. Keeping this explicit avoids accidentally running
  // against the wrong local or production database.
  MONGODB_URI: z
    .string({
      required_error:
        "MONGODB_URI is required. Copy .env.example to .env and set your MongoDB connection string."
    })
    .min(1, "MONGODB_URI cannot be empty."),
  // Safe defaults for local development and the assessment demo.
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  // Use a specific frontend origin in real deployments, for example
  // http://localhost:5173 during local frontend development.
  CORS_ORIGIN: z.string().min(1).default("*")
});

export const env = envSchema.parse(process.env);
