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

export async function handleWithApp(req: Request, res: Response) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error("API invocation failed", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
