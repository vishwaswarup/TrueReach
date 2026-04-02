import type { Request, Response } from "express";
import { createApp } from "../server/app";

let appPromise: ReturnType<typeof createApp> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = createApp({
      enableVite: false,
      serveFrontend: false,
      artificialDelayMs: process.env.NODE_ENV === "production" ? 0 : 1500,
    });
  }

  return appPromise;
}

export default async function handler(req: Request, res: Response) {
  const app = await getApp();
  return app(req, res);
}
