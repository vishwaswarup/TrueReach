import type { Request, Response } from "express";
import { handleWithApp } from "../_shared";

export default async function handler(req: Request, res: Response) {
  return handleWithApp(req, res, "/api/campaign/engagement");
}
