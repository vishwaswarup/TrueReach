export interface InfluencerProfile {
  followers: number;
  engagement_rate: number;
  growth_spike: boolean;
  fake_followers: number;
  repetitive_comments: boolean;
  comments?: string[];
  claimed_price: number;
}

export type InfluencerDataMap = Record<string, InfluencerProfile>;

export interface CommentQualityAnalysis {
  is_bot_like: boolean;
  confidence: "High" | "Medium" | "Low";
  explanation: string;
  bot_like_comments: boolean;
  comment_quality_score: number;
  insight: string;
  source: "gemini" | "rule-based";
}

export interface AnalysisResult {
  synthetic?: boolean;
  ai_summary?: string;
  pricing_insight?: string;
  score: number;
  confidence: "High" | "Medium" | "Low";
  reasoning: string[];
  score_breakdown: Array<{
    factor: string;
    impact: number;
  }>;
  comment_analysis: {
    is_bot_like: boolean;
    confidence: "High" | "Medium" | "Low";
    explanation: string;
    bot_like_comments: boolean;
    comment_quality_score: number;
    insight: string;
    source: "gemini" | "rule-based";
  };
  risk_level: "Low Risk" | "Moderate Risk" | "High Risk";
  flags: string[];
  metrics: {
    followers: number;
    engagement_rate: number;
    fake_followers: number;
    growth_spike: boolean;
    repetitive_comments: boolean;
  };
  pricing: {
    claimed_price: number;
    recommended_price: number;
    overpriced_percentage: number;
  };
}

export interface Campaign {
  campaign_id: string;
  creator: string;
  amount: number;
  status: "locked" | "released";
  engagement: number;
  milestone_met: boolean;
}
