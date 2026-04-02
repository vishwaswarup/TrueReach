import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../server/app";
import { createCampaignStore } from "../../server/campaignStore";
import { InfluencerDataMap } from "../../server/types";

describe("API endpoints", () => {
  const mockData: InfluencerDataMap = {
    maria_lux: {
      followers: 250000,
      engagement_rate: 4.2,
      growth_spike: false,
      fake_followers: 8,
      repetitive_comments: false,
      claimed_price: 120000,
    },
  };

  it("returns analysis for a known creator", async () => {
    const app = await createApp({
      getMockData: () => mockData,
      artificialDelayMs: 0,
      enableVite: false,
      serveFrontend: false,
    });

    const response = await request(app).get("/api/analyze/maria_lux");
    expect(response.status).toBe(200);
    expect(response.body.score).toBe(96);
    expect(response.body.confidence).toBe("High");
    expect(response.body.ai_summary).toBeTypeOf("string");
    expect(response.body.pricing_insight).toBeTypeOf("string");
    expect(response.body.reasoning).toBeTypeOf("object");
    expect(response.body.score_breakdown).toBeTypeOf("object");
    expect(response.body.comment_analysis).toBeTypeOf("object");
    expect(response.body.comment_analysis.is_bot_like).toBeTypeOf("boolean");
    expect(response.body.comment_analysis.confidence).toMatch(/High|Medium|Low/);
    expect(response.body.comment_analysis.explanation).toBeTypeOf("string");
    expect(response.body.comment_analysis.comment_quality_score).toBeTypeOf("number");
    expect(response.body.pricing.claimed_price).toBe(120000);
  });

  it("returns synthetic analysis for unknown creator", async () => {
    const app = await createApp({
      getMockData: () => mockData,
      artificialDelayMs: 0,
      enableVite: false,
      serveFrontend: false,
    });

    const response = await request(app).get("/api/analyze/unknown");
    expect(response.status).toBe(200);
    expect(response.body.synthetic).toBe(true);
    expect(response.body.score).toBeTypeOf("number");
    expect(response.body.ai_summary).toBeTypeOf("string");
    expect(response.body.pricing_insight).toBeTypeOf("string");
    expect(response.body.comment_analysis.explanation).toBeTypeOf("string");
  });

  it("falls back to synthetic analysis when data source fails", async () => {
    const app = await createApp({
      getMockData: () => {
        throw new Error("Data unavailable");
      },
      artificialDelayMs: 0,
      enableVite: false,
      serveFrontend: false,
    });

    const response = await request(app).get("/api/analyze/maria_lux");
    expect(response.status).toBe(200);
    expect(response.body.synthetic).toBe(true);
    expect(response.body.ai_summary).toBeTypeOf("string");
  });

  it("validates campaign payloads", async () => {
    const app = await createApp({
      getMockData: () => mockData,
      artificialDelayMs: 0,
      enableVite: false,
      serveFrontend: false,
    });

    const response = await request(app)
      .post("/api/campaign/start")
      .send({ creator: "", amount: "bad" });

    expect(response.status).toBe(400);
  });

  it("handles campaign lifecycle", async () => {
    const store = createCampaignStore();
    const app = await createApp({
      getMockData: () => mockData,
      artificialDelayMs: 0,
      enableVite: false,
      serveFrontend: false,
      campaignStore: store,
      generateCampaignId: () => "CAMP123",
    });

    const start = await request(app)
      .post("/api/campaign/start")
      .send({ creator: "maria_lux", amount: 5000 });

    expect(start.status).toBe(200);
    expect(start.body.campaign_id).toBe("CAMP123");

    const engagement = await request(app)
      .post("/api/campaign/engagement")
      .send({ campaign_id: "CAMP123", engagement: 1200 });

    expect(engagement.status).toBe(200);
    expect(engagement.body.milestone_met).toBe(true);

    const release = await request(app)
      .post("/api/campaign/release")
      .send({ campaign_id: "CAMP123" });

    expect(release.status).toBe(200);
    expect(release.body.status).toBe("released");
  });

  it("blocks release when milestone not met", async () => {
    const app = await createApp({
      getMockData: () => mockData,
      artificialDelayMs: 0,
      enableVite: false,
      serveFrontend: false,
      generateCampaignId: () => "CAMP222",
    });

    await request(app)
      .post("/api/campaign/start")
      .send({ creator: "maria_lux", amount: 5000 });

    const release = await request(app)
      .post("/api/campaign/release")
      .send({ campaign_id: "CAMP222" });

    expect(release.status).toBe(400);
  });

  it("returns improved score and pricing for clean audience simulation", async () => {
    const app = await createApp({
      getMockData: () => mockData,
      artificialDelayMs: 0,
      enableVite: false,
      serveFrontend: false,
    });

    const response = await request(app)
      .post("/simulate/clean-audience")
      .send({ creator: "maria_lux" });

    expect(response.status).toBe(200);
    expect(response.body.new_score).toBeTypeOf("number");
    expect(response.body.new_price).toBeTypeOf("number");
    expect(response.body.improvement.score_increase).toBeGreaterThanOrEqual(0);
  });
});
