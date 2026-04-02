import { campaignReleaseHandler } from "../_core";

export default async function handler(req: any, res: any) {
  return campaignReleaseHandler(req, res);
}
