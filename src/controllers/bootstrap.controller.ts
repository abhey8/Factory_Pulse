import { Request, Response } from "express";
import { getBootstrapData } from "../services/bootstrap.service";

export async function bootstrap(_req: Request, res: Response) {
  const data = await getBootstrapData();

  res.json({
    data,
    meta: {
      generated_at: new Date().toISOString()
    }
  });
}
