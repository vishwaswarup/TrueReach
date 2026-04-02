import { campaignStartHandler } from "../_core";

export default async function handler(req: any, res: any) {
  return campaignStartHandler(req, res);
}
