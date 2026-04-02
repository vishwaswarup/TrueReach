import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";

function createFetchResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

function createDeferred<T>() {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
}

async function submitCampaignEntry(user: ReturnType<typeof userEvent.setup>, username = "virat_kohli", budget = "50000") {
  const usernameInput = await screen.findByPlaceholderText("@username");
  await user.clear(usernameInput);
  await user.type(usernameInput, username);

  const budgetInput = screen.getByLabelText(/Campaign Budget/i);
  await user.clear(budgetInput);
  await user.type(budgetInput, budget);

  await user.click(screen.getByRole("button", { name: /Analyze Campaign/i }));
}

describe("App UI", () => {
  it("renders the default analysis on load", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (typeof input === "string" && input.startsWith("/api/analyze")) {
        return createFetchResponse({
          score: 100,
          risk_level: "Low Risk",
          flags: [],
          ai_summary: "Audience quality appears strong with stable engagement and acceptable pricing.",
          pricing_insight: "Pricing appears fair relative to audience quality and benchmarked rates.",
          comment_analysis: {
            is_bot_like: false,
            confidence: "High",
            explanation: "20% comments are repetitive and show moderate diversity",
            source: "rule-based",
          },
          score_breakdown: [],
          metrics: {
            followers: 250000,
            engagement_rate: 4.2,
            fake_followers: 8,
            growth_spike: false,
            repetitive_comments: false,
          },
          pricing: { claimed_price: 120000, recommended_price: 125000, overpriced_percentage: -4 },
        });
      }
      return createFetchResponse({}, false, 404);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    const user = userEvent.setup();

    expect(await screen.findByText(/Start New Campaign/i)).toBeInTheDocument();
    await submitCampaignEntry(user);

    expect(await screen.findByText(/Authenticity Score/i)).toBeInTheDocument();
    expect(await screen.findByText(/@VIRAT_KOHLI/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows the loading state while analysis is pending", async () => {
    const deferred = createDeferred<Response>();
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (typeof input === "string" && input.startsWith("/api/analyze")) {
        return deferred.promise;
      }
      return createFetchResponse({}, false, 404);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    const user = userEvent.setup();

    await submitCampaignEntry(user);

    expect(await screen.findByText(/Analyzing Creator Data/i)).toBeInTheDocument();

    deferred.resolve(
      new Response(
        JSON.stringify({
          score: 100,
          risk_level: "Low Risk",
          flags: [],
          ai_summary: "Audience quality appears strong with stable engagement and acceptable pricing.",
          pricing_insight: "Pricing appears fair relative to audience quality and benchmarked rates.",
          comment_analysis: {
            is_bot_like: false,
            confidence: "High",
            explanation: "20% comments are repetitive and show moderate diversity",
            source: "rule-based",
          },
          score_breakdown: [],
          metrics: {
            followers: 250000,
            engagement_rate: 4.2,
            fake_followers: 8,
            growth_spike: false,
            repetitive_comments: false,
          },
          pricing: { claimed_price: 120000, recommended_price: 125000, overpriced_percentage: -4 },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    expect(await screen.findByText(/@VIRAT_KOHLI/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("handles a successful campaign-driven flow", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === "string" && input.startsWith("/api/analyze")) {
        return createFetchResponse({
          score: 10,
          risk_level: "High Risk",
          flags: ["Low engagement rate detected"],
          ai_summary: "Audience quality is weak and this collaboration should be milestone-based.",
          pricing_insight: "The influencer appears overpriced given current engagement and authenticity signals.",
          comment_analysis: {
            is_bot_like: true,
            confidence: "High",
            explanation: "60% comments are repetitive and likely bot-generated",
            source: "rule-based",
          },
          score_breakdown: [
            { factor: "Fake Followers", impact: -17.5 },
            { factor: "Low Engagement", impact: -5 },
          ],
          metrics: {
            followers: 100000,
            engagement_rate: 1.5,
            fake_followers: 35,
            growth_spike: true,
            repetitive_comments: true,
          },
          pricing: { claimed_price: 50000, recommended_price: 5000, overpriced_percentage: 90 },
        });
      }
      if (input === "/api/campaign/start") {
        return createFetchResponse({ campaign_id: "CAMP555", status: "locked", amount: 5000 });
      }
      if (input === "/api/campaign/engagement") {
        return createFetchResponse({ campaign_id: "CAMP555", engagement: 1200, milestone_met: true });
      }
      if (input === "/api/campaign/release") {
        return createFetchResponse({ status: "released" });
      }
      return createFetchResponse({}, false, 404);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    const user = userEvent.setup();

    await submitCampaignEntry(user, "raj_fitness");

    expect(await screen.findByText(/@RAJ_FITNESS/i)).toBeInTheDocument();

    const startButton = await screen.findByRole("button", { name: /Lock Escrow Payment/i });
    await user.click(startButton);

    expect(await screen.findByText(/ID: CAMP555/i, {}, { timeout: 4000 })).toBeInTheDocument();

    const simulateButton = await screen.findByRole("button", { name: /Simulate Engagement/i }, { timeout: 4000 });
    await user.click(simulateButton);

    const releaseButton = await screen.findByRole("button", { name: /Release Escrow Payment/i }, { timeout: 4000 });
    await user.click(releaseButton);

    await waitFor(() => {
      expect(screen.getByText(/Payment Released/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    vi.unstubAllGlobals();
  });

  it("shows release action only after engagement verification", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (typeof input === "string" && input.startsWith("/api/analyze")) {
        return createFetchResponse({
          score: 10,
          risk_level: "High Risk",
          flags: ["Low engagement rate detected"],
          ai_summary: "Audience quality is weak and this collaboration should be milestone-based.",
          pricing_insight: "The influencer appears overpriced given current engagement and authenticity signals.",
          comment_analysis: {
            is_bot_like: true,
            confidence: "High",
            explanation: "60% comments are repetitive and likely bot-generated",
            source: "rule-based",
          },
          score_breakdown: [
            { factor: "Fake Followers", impact: -17.5 },
            { factor: "Low Engagement", impact: -5 },
          ],
          metrics: {
            followers: 100000,
            engagement_rate: 1.5,
            fake_followers: 35,
            growth_spike: true,
            repetitive_comments: true,
          },
          pricing: { claimed_price: 50000, recommended_price: 5000, overpriced_percentage: 90 },
        });
      }
      if (input === "/api/campaign/start") {
        return createFetchResponse({ campaign_id: "CAMP777", status: "locked", amount: 5000 });
      }
      if (input === "/api/campaign/engagement") {
        return createFetchResponse({ campaign_id: "CAMP777", engagement: 1200, milestone_met: true });
      }
      return createFetchResponse({}, false, 404);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    const user = userEvent.setup();

    await submitCampaignEntry(user, "raj_fitness");

    const startButton = await screen.findByRole("button", { name: /Lock Escrow Payment/i });
    await user.click(startButton);

    expect(screen.queryByRole("button", { name: /Release Escrow Payment/i })).not.toBeInTheDocument();

    const simulateButton = await screen.findByRole("button", { name: /Simulate Engagement/i }, { timeout: 4000 });
    await user.click(simulateButton);

    expect(await screen.findByRole("button", { name: /Release Escrow Payment/i }, { timeout: 4000 })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("returns to campaign entry when starting a new campaign", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (typeof input === "string" && input.startsWith("/api/analyze")) {
        return createFetchResponse({
          score: 96,
          risk_level: "Low Risk",
          flags: [],
          ai_summary: "Audience quality appears strong with stable engagement and acceptable pricing.",
          pricing_insight: "Pricing appears fair relative to audience quality and benchmarked rates.",
          comment_analysis: {
            is_bot_like: false,
            confidence: "High",
            explanation: "20% comments are repetitive and show moderate diversity",
            source: "rule-based",
          },
          score_breakdown: [],
          metrics: {
            followers: 250000,
            engagement_rate: 4.2,
            fake_followers: 8,
            growth_spike: false,
            repetitive_comments: false,
          },
          pricing: { claimed_price: 120000, recommended_price: 125000, overpriced_percentage: -4 },
        });
      }
      return createFetchResponse({}, false, 404);
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    const user = userEvent.setup();

    await submitCampaignEntry(user, "raj_fitness", "60000");
    expect(await screen.findByText(/Authenticity Score/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /New Campaign/i }));

    expect(await screen.findByText(/Start New Campaign/i)).toBeInTheDocument();
    expect((await screen.findByPlaceholderText("@username") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/Campaign Budget/i) as HTMLInputElement).value).toBe("");

    vi.unstubAllGlobals();
  });

  it("shows an error state for an unknown creator", async () => {
    const fetchMock = vi.fn(() => createFetchResponse({ error: "Creator not found" }, false, 404));
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    const user = userEvent.setup();

    await submitCampaignEntry(user);

    expect(await screen.findByText(/Creator not found/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
