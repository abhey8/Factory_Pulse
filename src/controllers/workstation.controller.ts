import { Request, Response } from "express";
import { listWorkstations } from "../services/workstation.service";

export async function getWorkstations(_req: Request, res: Response) {
  const workstations = await listWorkstations();
  res.json({ data: workstations });
}
