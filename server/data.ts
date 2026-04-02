import fs from "fs";
import { InfluencerDataMap } from "./types";

export function loadInfluencerData(dataPath: string): InfluencerDataMap {
  const rawData = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(rawData) as InfluencerDataMap;
}
