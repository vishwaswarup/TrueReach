import { analyzeHandler } from "./_core";

export default async function handler(req: any, res: any) {
  return analyzeHandler(req, res);
}
