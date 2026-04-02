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

export async function handleWithApp(req: Request, res: Response, forcedPath?: string) {
  const app = await getApp();
  if (forcedPath) {
    const queryIndex = req.url.indexOf("?");
    const query = queryIndex >= 0 ? req.url.slice(queryIndex) : "";
    req.url = `${forcedPath}${query}`;
  }

  return app(req, res);
}
