import { Request, Response } from "express";
import { listWorkers } from "../services/worker.service";

export async function getWorkers(_req: Request, res: Response) {
  const workers = await listWorkers();
  res.json({ data: workers });
}
