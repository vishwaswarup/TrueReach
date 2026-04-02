import { AnalysisResult, CommentQualityAnalysis, InfluencerProfile } from "./types.js";

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, decimals = 2) => {
  const value = Math.random() * (max - min) + min;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

export const DEFAULT_MOCK_COMMENTS = [
  "Nice pic 🔥",
  "Awesome 🔥",
  "Nice pic 🔥",
  "Cool",
  "Nice pic 🔥",
];

export function analyze_comments(comments: string[] = DEFAULT_MOCK_COMMENTS) {
  const sourceComments = comments.length > 0 ? comments : DEFAULT_MOCK_COMMENTS;
  const normalized = sourceComments.map((comment) => comment.trim().toLowerCase()).filter(Boolean);
  const totalComments = normalized.length;
  const uniqueComments = new Set(normalized).size;
  const uniqueRatio = totalComments > 0 ? uniqueComments / totalComments : 1;
  const botLikeComments = uniqueRatio < 0.5;
  const commentQualityScore = Math.min(100, Math.max(0, Math.round(uniqueRatio * 100)));
  const repetitivePercent = Math.round((1 - uniqueRatio) * 100);
  const explanation = `${repetitivePercent}% comments are repetitive and ${
    botLikeComments ? "likely bot-generated" : "show moderate diversity"
  }`;

  let confidence: CommentQualityAnalysis["confidence"] = "Medium";
  if (uniqueRatio <= 0.35 || uniqueRatio >= 0.8) {
    confidence = "High";
  } else if (uniqueRatio > 0.45 && uniqueRatio < 0.65) {
    confidence = "Low";
  }

  return {
    is_bot_like: botLikeComments,
    confidence,
    explanation,
    bot_like_comments: botLikeComments,
    comment_quality_score: commentQualityScore,
    insight: explanation,
    source: "rule-based" as const,
  };
}

export function generateCreatorData(username: string): InfluencerProfile {
  const followers = randomInt(10_000, 500_000);
  const fake_followers = randomInt(5, 50);
  const growth_spike = Math.random() < 0.3;

  const fakePenalty = ((fake_followers - 5) / 45) * 2.5;
  let engagement_rate = randomFloat(0.8, 6) - fakePenalty;
  if (!growth_spike) {
    engagement_rate += 0.2;
  }
  if (fake_followers > 30) {
    engagement_rate = Math.min(engagement_rate, 2.5);
  }
  engagement_rate = Math.min(6, Math.max(0.5, engagement_rate));

  const repetitive_comments = fake_followers > 30 ? true : Math.random() < 0.25;
  const priceFactor = randomFloat(0.3, 0.8, 2);
  const claimed_price = Math.round(followers * priceFactor);

  return {
    followers,
    engagement_rate,
    growth_spike,
    fake_followers,
    repetitive_comments,
    claimed_price,
  };
}

export function buildCleanAudienceProfile(profile: InfluencerProfile): InfluencerProfile {
  return {
    ...profile,
    fake_followers: Math.max(5, Math.round(profile.fake_followers * 0.3)),
    engagement_rate: Math.min(10, Math.round((profile.engagement_rate + 1.5) * 10) / 10),
  };
}

export function calculateAuthenticityScore(
  profile: InfluencerProfile,
  externalCommentAnalysis?: CommentQualityAnalysis
) {
  let score = 100;
  const flags: string[] = [];
  const reasoning: string[] = [];
  const scoreBreakdown: Array<{ factor: string; impact: number }> = [];
  const commentAnalysis = externalCommentAnalysis ?? analyze_comments(profile.comments);

  const fakeFollowerPenalty = Math.round(profile.fake_followers * 0.5 * 10) / 10;
  score -= fakeFollowerPenalty;
  scoreBreakdown.push({ factor: "Fake Followers", impact: -fakeFollowerPenalty });
  if (profile.fake_followers > 20) {
    flags.push("High fake follower percentage");
    reasoning.push("High fake follower percentage reduced trust");
  }

  if (profile.engagement_rate < 2) {
    const lowEngagementPenalty = Math.round((2 - profile.engagement_rate) * 10 * 10) / 10;
    score -= lowEngagementPenalty;
    scoreBreakdown.push({ factor: "Low Engagement", impact: -lowEngagementPenalty });
    flags.push("Low engagement rate detected");
    reasoning.push("Low engagement indicates weak audience quality");
  }

  if (profile.growth_spike) {
    score -= 15;
    scoreBreakdown.push({ factor: "Growth Spike", impact: -15 });
    flags.push("Sudden follower spike detected");
    reasoning.push("Unnatural growth spike created volatility risk");
  }
  const botCommentRisk = profile.repetitive_comments
    || (commentAnalysis.is_bot_like && profile.fake_followers > 20);
  if (botCommentRisk) {
    score -= 10;
    scoreBreakdown.push({ factor: "Bot Comments", impact: -10 });
    flags.push("Bot-like comment behavior detected");
    reasoning.push(commentAnalysis.explanation);
  }

  score = Math.min(100, Math.max(0, Math.round(score * 10) / 10));

  if (reasoning.length === 0) {
    reasoning.push("Balanced growth and audience quality signals support credibility");
  }

  return { score, flags, reasoning, commentAnalysis, scoreBreakdown };
}

export function classifyConfidence(score: number): AnalysisResult["confidence"] {
  if (score > 80) {
    return "High";
  }
  if (score >= 50) {
    return "Medium";
  }
  return "Low";
}

export function classifyRiskLevel(score: number): AnalysisResult["risk_level"] {
  if (score < 50) {
    return "High Risk";
  }
  if (score < 80) {
    return "Moderate Risk";
  }
  return "Low Risk";
}

export function calculatePricing(profile: InfluencerProfile, score: number) {
  const recommendedPrice = profile.followers * 0.5 * (score / 100);
  const claimedPrice = profile.claimed_price;
  const overpricedPercentage = claimedPrice > 0
    ? Math.round(((claimedPrice - recommendedPrice) / claimedPrice) * 100)
    : 0;

  return {
    claimed_price: claimedPrice,
    recommended_price: Math.round(recommendedPrice),
    overpriced_percentage: overpricedPercentage,
  };
}

export function buildAnalysisResult(
  profile: InfluencerProfile,
  commentAnalysisOverride?: CommentQualityAnalysis
): AnalysisResult {
  const { score, flags, reasoning, commentAnalysis, scoreBreakdown } = calculateAuthenticityScore(
    profile,
    commentAnalysisOverride
  );
  return {
    score,
    confidence: classifyConfidence(score),
    reasoning,
    score_breakdown: scoreBreakdown,
    comment_analysis: commentAnalysis,
    risk_level: classifyRiskLevel(score),
    flags,
    metrics: {
      followers: profile.followers,
      engagement_rate: profile.engagement_rate,
      fake_followers: profile.fake_followers,
      growth_spike: profile.growth_spike,
      repetitive_comments: profile.repetitive_comments,
    },
    pricing: calculatePricing(profile, score),
  };
}
