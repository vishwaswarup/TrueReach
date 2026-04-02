import express from "express";
import path from "path";
import { createCampaignStore, CampaignStore } from "./campaignStore";
import { loadInfluencerData } from "./data";
import { buildAnalysisResult, buildCleanAudienceProfile, generateCreatorData } from "./logic";
import { generateAuditSummary, generateCommentQualityAnalysis, generatePricingInsight } from "./aiSummary";
import { InfluencerDataMap } from "./types";

export interface AppOptions {
  dataPath?: string;
  artificialDelayMs?: number;
  enableVite?: boolean;
  serveFrontend?: boolean;
  getMockData?: () => InfluencerDataMap;
  campaignStore?: CampaignStore;
  generateCampaignId?: () => string;
}

export async function createApp(options: AppOptions = {}) {
  const app = express();
  app.use(express.json());

  const dataPath = options.dataPath ?? path.join(process.cwd(), "data.json");
  const getMockData = options.getMockData ?? (() => loadInfluencerData(dataPath));
  const delayMs = options.artificialDelayMs ?? 1500;
  const campaignStore = options.campaignStore ?? createCampaignStore();
  const generateCampaignId = options.generateCampaignId
    ?? (() => `CAMP${Math.floor(Math.random() * 1000)}`);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const loadDataOrFallback = () => {
    try {
      return getMockData();
    } catch (error) {
      console.warn("Failed to load creator data, using synthetic fallback", error);
      return {} as InfluencerDataMap;
    }
  };

  app.get("/api/analyze/:creator", async (req, res) => {
    const { creator } = req.params;
    const mockData = loadDataOrFallback();

    if (delayMs > 0) {
      await delay(delayMs);
    }

    const influencer = mockData[creator.toLowerCase()];
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

    return res.json({
      ...analysis,
      ai_summary: aiSummary,
      pricing_insight: pricingInsight,
      synthetic: isSynthetic,
    });
  });

  app.post("/api/campaign/start", (req, res) => {
    const { creator, amount } = req.body ?? {};
    if (typeof creator !== "string" || creator.trim().length === 0 || !Number.isFinite(amount)) {
      return res.status(400).json({ error: "Invalid campaign payload" });
    }

    const campaign = campaignStore.startCampaign(creator, amount, generateCampaignId);
    return res.json({ campaign_id: campaign.campaign_id, status: campaign.status, amount: campaign.amount });
  });

  app.post("/api/campaign/engagement", (req, res) => {
    const { campaign_id, engagement } = req.body ?? {};
    if (typeof campaign_id !== "string" || campaign_id.trim().length === 0 || !Number.isFinite(engagement)) {
      return res.status(400).json({ error: "Invalid engagement payload" });
    }

    const campaign = campaignStore.recordEngagement(campaign_id, engagement);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    return res.json({
      campaign_id,
      engagement: campaign.engagement,
      milestone_met: campaign.milestone_met,
    });
  });

  app.post("/api/campaign/release", (req, res) => {
    const { campaign_id } = req.body ?? {};
    if (typeof campaign_id !== "string" || campaign_id.trim().length === 0) {
      return res.status(400).json({ error: "Invalid campaign payload" });
    }

    const campaign = campaignStore.getCampaign(campaign_id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    if (!campaign.milestone_met) {
      return res.status(400).json({ error: "Engagement milestone not met" });
    }

    const released = campaignStore.releaseCampaign(campaign_id);
    if (!released) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    return res.json({ status: released.status });
  });

  const simulateCleanAudience = (req: express.Request, res: express.Response) => {
    const { creator } = req.body ?? {};
    if (typeof creator !== "string" || creator.trim().length === 0) {
      return res.status(400).json({ error: "Invalid simulation payload" });
    }

    const mockData = loadDataOrFallback();

    const profile = mockData[creator.toLowerCase()] ?? generateCreatorData(creator);
    const current = buildAnalysisResult(profile);
    const cleaned = buildAnalysisResult(buildCleanAudienceProfile(profile));

    return res.json({
      new_score: cleaned.score,
      new_price: cleaned.pricing.recommended_price,
      improvement: {
        score_increase: Math.round((cleaned.score - current.score) * 10) / 10,
        price_increase: cleaned.pricing.recommended_price - current.pricing.recommended_price,
      },
    });
  };

  app.post("/api/simulate/clean-audience", simulateCleanAudience);
  app.post("/simulate/clean-audience", simulateCleanAudience);

  const enableVite = options.enableVite ?? process.env.NODE_ENV !== "production";
  const serveFrontend = options.serveFrontend ?? true;

  if (serveFrontend) {
    if (enableVite) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }
  return app;
}
