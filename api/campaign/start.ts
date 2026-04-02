import { campaignStartHandler } from "../_core.js";

export default async function handler(req: any, res: any) {
  return campaignStartHandler(req, res);
}
