import { Request, Response } from "express";
import { deleteEvents } from "../services/event.service";
import { seedDatabase } from "../services/seedData";

export async function seed(_req: Request, res: Response) {
  const result = await seedDatabase({ reset: false });
  res.status(201).json({ data: result });
}

export async function resetAndSeed(_req: Request, res: Response) {
  const result = await seedDatabase({ reset: true });
  res.status(201).json({ data: result });
}

export async function clearEvents(_req: Request, res: Response) {
  const result = await deleteEvents();
  res.json({ data: result });
}
