import { GoogleGenAI } from "@google/genai";
import { DEFAULT_MOCK_COMMENTS, analyze_comments } from "./logic";
import { CommentQualityAnalysis, InfluencerProfile } from "./types";

export interface AISummaryInput {
  profile: InfluencerProfile;
  score: number;
  recommended_price: number;
  claimed_price: number;
}

interface PricingInsightInput {
  profile: InfluencerProfile;
  recommended_price: number;
  claimed_price: number;
}

interface ParsedGeminiCommentAnalysis {
  is_bot_like: boolean;
  confidence: "High" | "Medium" | "Low";
  explanation: string;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

async function generateGeminiText(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    const text = response.text?.trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

function buildPrompt(input: AISummaryInput) {
  const { profile, score, recommended_price, claimed_price } = input;
  return `Analyze this influencer profile:

Followers: ${profile.followers}
Engagement Rate: ${profile.engagement_rate}%
Fake Followers: ${profile.fake_followers}%
Growth Spike: ${profile.growth_spike}
Repetitive Comments: ${profile.repetitive_comments}
Authenticity Score: ${score}
Claimed Price: ${claimed_price}
Recommended Price: ${recommended_price}

Write a short professional audit summary (2-3 sentences) explaining audience quality, authenticity, and whether the influencer is worth collaborating with.`;
}

function buildFallbackSummary(input: AISummaryInput) {
  const { profile, score, recommended_price, claimed_price } = input;
  const quality =
    profile.fake_followers > 30 || profile.engagement_rate < 2
      ? "audience quality appears weak"
      : profile.fake_followers > 15
        ? "audience quality appears mixed"
        : "audience quality appears credible";

  const pricingDelta = claimed_price - recommended_price;
  const pricingNote =
    pricingDelta > 0
      ? `The claimed price is above the recommended value by approximately Rs ${pricingDelta.toLocaleString()}.`
      : "The claimed price is aligned with or below the recommended value.";

  const recommendation =
    score >= 75
      ? "This profile can be considered for collaboration with standard monitoring."
      : score >= 50
        ? "This profile may be considered with tighter KPI tracking and milestone-based payments."
        : "This profile should be approached cautiously until audience authenticity improves.";

  return `Based on the current metrics, ${quality} and the authenticity score is ${score}. ${pricingNote} ${recommendation}`;
}

function buildPricingPrompt(input: PricingInsightInput) {
  const { profile, recommended_price, claimed_price } = input;
  return `Analyze this influencer's pricing:

Followers: ${profile.followers}
Engagement Rate: ${profile.engagement_rate}%
Fake Followers: ${profile.fake_followers}%
Claimed Price: ${claimed_price}
Recommended Price: ${recommended_price}

Explain whether this influencer is overpriced or fairly priced. Give a short professional justification (1-2 sentences).`;
}

function buildFallbackPricingInsight(input: PricingInsightInput) {
  const { profile, recommended_price, claimed_price } = input;
  const delta = claimed_price - recommended_price;
  const overpriced = claimed_price > recommended_price;
  const base = overpriced
    ? `The creator appears overpriced by approximately Rs ${delta.toLocaleString()} compared with the model-based recommendation.`
    : "The claimed price is aligned with or below the model-based recommendation.";

  const quality = profile.fake_followers > 30 || profile.engagement_rate < 2
    ? "Given current audience quality signals, proceed only with strict KPI-based terms."
    : "Current audience quality supports standard commercial collaboration terms.";

  return `${base} ${quality}`;
}

function buildCommentQualityPrompt(comments: string[]) {
  return `Analyze the following comments and determine whether the engagement appears organic or bot-like. Briefly explain your reasoning.

Comments:
${comments.join("\n")}

Return ONLY valid JSON in this exact format:
{
  "is_bot_like": true,
  "confidence": "High",
  "explanation": "short explanation"
}`;
}

function parseGeminiCommentAnalysis(text: string): ParsedGeminiCommentAnalysis | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[0]);
    const isValidConfidence = parsed.confidence === "High"
      || parsed.confidence === "Medium"
      || parsed.confidence === "Low";
    if (typeof parsed.is_bot_like !== "boolean" || !isValidConfidence || typeof parsed.explanation !== "string") {
      return null;
    }

    return {
      is_bot_like: parsed.is_bot_like,
      confidence: parsed.confidence,
      explanation: parsed.explanation.trim(),
    };
  } catch {
    return null;
  }
}

export async function generateAuditSummary(input: AISummaryInput): Promise<string> {
  const summary = await generateGeminiText(buildPrompt(input));
  return summary ?? buildFallbackSummary(input);
}

export async function generatePricingInsight(input: PricingInsightInput): Promise<string> {
  const insight = await generateGeminiText(buildPricingPrompt(input));
  return insight ?? buildFallbackPricingInsight(input);
}

export async function generateCommentQualityAnalysis(comments?: string[]): Promise<CommentQualityAnalysis> {
  const sourceComments = comments && comments.length > 0 ? comments : DEFAULT_MOCK_COMMENTS;
  const fallback = analyze_comments(sourceComments);
  const responseText = await generateGeminiText(buildCommentQualityPrompt(sourceComments));
  if (!responseText) {
    return fallback;
  }

  const parsed = parseGeminiCommentAnalysis(responseText);
  if (!parsed) {
    return fallback;
  }

  return {
    ...fallback,
    is_bot_like: parsed.is_bot_like,
    confidence: parsed.confidence,
    explanation: parsed.explanation,
    bot_like_comments: parsed.is_bot_like,
    insight: parsed.explanation,
    source: "gemini",
  };
}
