import { analyzeHandler } from "./_core.js";

export default async function handler(req: any, res: any) {
  return analyzeHandler(req, res);
}
