import { describe, expect, it } from "vitest";
import {
  analyze_comments,
  calculateAuthenticityScore,
  calculatePricing,
  classifyConfidence,
  classifyRiskLevel,
} from "../../server/logic";
import { InfluencerProfile } from "../../server/types";

describe("backend logic", () => {
  it("calculates score and flags based on profile signals", () => {
    const profile: InfluencerProfile = {
      followers: 50000,
      engagement_rate: 0.8,
      growth_spike: true,
      fake_followers: 45,
      repetitive_comments: true,
      claimed_price: 30000,
    };

    const { score, flags, reasoning, commentAnalysis, scoreBreakdown } = calculateAuthenticityScore(profile);
    expect(score).toBe(40.5);
    expect(flags).toHaveLength(4);
    expect(flags).toContain("Sudden follower spike detected");
    expect(reasoning).toContain("High fake follower percentage reduced trust");
    expect(commentAnalysis.comment_quality_score).toBeGreaterThanOrEqual(0);
    expect(scoreBreakdown).toEqual([
      { factor: "Fake Followers", impact: -22.5 },
      { factor: "Low Engagement", impact: -12 },
      { factor: "Growth Spike", impact: -15 },
      { factor: "Bot Comments", impact: -10 },
    ]);
  });

  it("detects bot-like comments with low uniqueness", () => {
    const analysis = analyze_comments([
      "Nice",
      "Nice",
      "Nice",
      "Nice",
      "Wow",
    ]);

    expect(analysis.bot_like_comments).toBe(true);
    expect(analysis.comment_quality_score).toBe(40);
  });

  it("classifies risk levels at boundaries", () => {
    expect(classifyRiskLevel(49)).toBe("High Risk");
    expect(classifyRiskLevel(50)).toBe("Moderate Risk");
    expect(classifyRiskLevel(79)).toBe("Moderate Risk");
    expect(classifyRiskLevel(80)).toBe("Low Risk");
  });

  it("classifies confidence at boundaries", () => {
    expect(classifyConfidence(81)).toBe("High");
    expect(classifyConfidence(80)).toBe("Medium");
    expect(classifyConfidence(50)).toBe("Medium");
    expect(classifyConfidence(49.9)).toBe("Low");
  });

  it("avoids invalid pricing math when claimed price is zero", () => {
    const profile: InfluencerProfile = {
      followers: 10000,
      engagement_rate: 3,
      growth_spike: false,
      fake_followers: 5,
      repetitive_comments: false,
      claimed_price: 0,
    };

    const pricing = calculatePricing(profile, 90);
    expect(pricing.claimed_price).toBe(0);
    expect(pricing.overpriced_percentage).toBe(0);
  });
});
