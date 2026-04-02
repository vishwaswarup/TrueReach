import path from "path";
import { loadInfluencerData } from "../server/data.js";
import { buildAnalysisResult, buildCleanAudienceProfile, generateCreatorData } from "../server/logic.js";
import { generateAuditSummary, generateCommentQualityAnalysis, generatePricingInsight } from "../server/aiSummary.js";
import { Campaign, InfluencerDataMap } from "../server/types.js";

const campaignStore = new Map<string, Campaign>();
let cachedData: InfluencerDataMap | null = null;

function getData(): InfluencerDataMap {
  if (cachedData) {
    return cachedData;
  }

  try {
    const dataPath = path.join(process.cwd(), "data.json");
    cachedData = loadInfluencerData(dataPath);
    return cachedData;
  } catch (error) {
    console.warn("Failed to load creator data, using synthetic fallback", error);
    cachedData = {};
    return cachedData;
  }
}

function sendJson(res: any, status: number, payload: unknown) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(status).json(payload);
  }

  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
  return undefined;
}

function getQueryParam(req: any, key: string): string | undefined {
  const fromQuery = req?.query?.[key];
  if (typeof fromQuery === "string") {
    return fromQuery;
  }
  if (Array.isArray(fromQuery) && typeof fromQuery[0] === "string") {
    return fromQuery[0];
  }

  try {
    const url = new URL(req.url ?? "", "http://localhost");
    return url.searchParams.get(key) ?? undefined;
  } catch {
    return undefined;
  }
}

async function parseJsonBody(req: any): Promise<any> {
  if (req?.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req?.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
  } catch {
    return {};
  }
}

function generateCampaignId() {
  return `CAMP${Math.floor(Math.random() * 1000)}`;
}

export async function analyzeHandler(req: any, res: any) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const creatorRaw = getQueryParam(req, "creator") ?? "";
    const creator = creatorRaw.trim().toLowerCase();
    if (!creator) {
      return sendJson(res, 400, { error: "Creator is required" });
    }

    const data = getData();
    const influencer = data[creator];
    const isSynthetic = !influencer;
    const profile = influencer ?? generateCreatorData(creator);

    const commentAnalysis = await generateCommentQualityAnalysis(profile.comments);
    const analysis = buildAnalysisResult(profile, commentAnalysis);
    const [aiSummary, pricingInsight] = await Promise.all([
      generateAuditSummary({
        profile,
        score: analysis.score,
        recommended_price: analysis.pricing.recommended_price,
        claimed_price: analysis.pricing.claimed_price,
      }),
      generatePricingInsight({
        profile,
        recommended_price: analysis.pricing.recommended_price,
        claimed_price: analysis.pricing.claimed_price,
      }),
    ]);

    return sendJson(res, 200, {
      ...analysis,
      ai_summary: aiSummary,
      pricing_insight: pricingInsight,
      synthetic: isSynthetic,
    });
  } catch (error) {
    console.error("Analyze request failed", error);
    return sendJson(res, 500, { error: "Failed to analyze creator" });
  }
}

export async function campaignStartHandler(req: any, res: any) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const body = await parseJsonBody(req);
  const creator = typeof body.creator === "string" ? body.creator.trim() : "";
  const amount = Number(body.amount);

  if (!creator || !Number.isFinite(amount)) {
    return sendJson(res, 400, { error: "Invalid campaign payload" });
  }

  const campaignId = generateCampaignId();
  const campaign: Campaign = {
    campaign_id: campaignId,
    creator,
    amount,
    status: "locked",
    engagement: 0,
    milestone_met: false,
  };
  campaignStore.set(campaignId, campaign);

  return sendJson(res, 200, {
    campaign_id: campaign.campaign_id,
    status: campaign.status,
    amount: campaign.amount,
  });
}

export async function campaignEngagementHandler(req: any, res: any) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const body = await parseJsonBody(req);
  const campaignId = typeof body.campaign_id === "string" ? body.campaign_id.trim() : "";
  const engagement = Number(body.engagement);

  if (!campaignId || !Number.isFinite(engagement)) {
    return sendJson(res, 400, { error: "Invalid engagement payload" });
  }

  const campaign = campaignStore.get(campaignId);
  if (!campaign) {
    return sendJson(res, 404, { error: "Campaign not found" });
  }

  campaign.engagement = engagement;
  campaign.milestone_met = engagement >= 1000;
  campaignStore.set(campaignId, campaign);

  return sendJson(res, 200, {
    campaign_id: campaignId,
    engagement: campaign.engagement,
    milestone_met: campaign.milestone_met,
  });
}

export async function campaignReleaseHandler(req: any, res: any) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const body = await parseJsonBody(req);
  const campaignId = typeof body.campaign_id === "string" ? body.campaign_id.trim() : "";

  if (!campaignId) {
    return sendJson(res, 400, { error: "Invalid campaign payload" });
  }

  const campaign = campaignStore.get(campaignId);
  if (!campaign) {
    return sendJson(res, 404, { error: "Campaign not found" });
  }

  if (!campaign.milestone_met) {
    return sendJson(res, 400, { error: "Engagement milestone not met" });
  }

  campaign.status = "released";
  campaignStore.set(campaignId, campaign);

  return sendJson(res, 200, { status: campaign.status });
}

export async function simulateCleanAudienceHandler(req: any, res: any) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const body = await parseJsonBody(req);
  const creator = typeof body.creator === "string" ? body.creator.trim().toLowerCase() : "";

  if (!creator) {
    return sendJson(res, 400, { error: "Invalid simulation payload" });
  }

  const data = getData();
  const profile = data[creator] ?? generateCreatorData(creator);
  const current = buildAnalysisResult(profile);
  const cleaned = buildAnalysisResult(buildCleanAudienceProfile(profile));

  return sendJson(res, 200, {
    new_score: cleaned.score,
    new_price: cleaned.pricing.recommended_price,
    improvement: {
      score_increase: Math.round((cleaned.score - current.score) * 10) / 10,
      price_increase: cleaned.pricing.recommended_price - current.pricing.recommended_price,
    },
  });
}
