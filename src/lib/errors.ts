import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "./logger";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        details: error.flatten()
      }
    });
    return;
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  logger.error("Unhandled request error", { message });
  res.status(500).json({ error: { message } });
}
