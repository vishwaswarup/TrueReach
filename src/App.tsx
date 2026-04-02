import React, { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Bell, 
  HelpCircle, 
  ShieldCheck, 
  AtSign,
  Activity,
  Wallet,
  TrendingUp, 
  CheckCircle2, 
  Hourglass, 
  ArrowRight, 
  AlertTriangle,
  BarChart3,
  Settings,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface InfluencerData {
  score: number;
  risk_level: string;
  flags: string[];
  ai_summary: string;
  pricing_insight: string;
  comment_analysis: {
    is_bot_like: boolean;
    confidence: "High" | "Medium" | "Low";
    explanation: string;
    source: "gemini" | "rule-based";
  };
  score_breakdown: Array<{
    factor: string;
    impact: number;
  }>;
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

interface CampaignState {
  campaign_id: string | null;
  status: string;
  amount: number;
  engagement: number;
  milestone_met: boolean;
}

interface CampaignData {
  username: string;
  budget: number;
  expected_engagement: number;
}

interface CleanAudienceSimulation {
  new_score: number;
  new_price: number;
  improvement: {
    score_increase: number;
    price_increase: number;
  };
}

type SystemState = "ANALYSIS_COMPLETE" | "CAMPAIGN_ACTIVE" | "ENGAGEMENT_VERIFIED" | "PAYMENT_RELEASED";
type ActionState = "idle" | "locking" | "verifying" | "releasing";

const initialCampaignState: CampaignState = {
  campaign_id: null,
  status: "none",
  amount: 0,
  engagement: 0,
  milestone_met: false,
};

const initialCampaignData: CampaignData = {
  username: "",
  budget: 0,
  expected_engagement: 0,
};

export default function App() {
  const [campaignStarted, setCampaignStarted] = useState(false);
  const [campaignData, setCampaignData] = useState<CampaignData>(initialCampaignData);
  const [data, setData] = useState<InfluencerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignState>(initialCampaignState);
  const [systemState, setSystemState] = useState<SystemState>("ANALYSIS_COMPLETE");
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [cleanAudienceSimulation, setCleanAudienceSimulation] = useState<CleanAudienceSimulation | null>(null);
  const [simulatingCleanAudience, setSimulatingCleanAudience] = useState(false);

  const analyzeInfluencer = async (creator: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analyze/${creator}`);
      if (!response.ok) throw new Error("Creator not found");
      const result = await response.json();
      setData(result);
      setCampaign(initialCampaignState);
      setSystemState("ANALYSIS_COMPLETE");
      setActionState("idle");
      setCleanAudienceSimulation(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startCampaign = async () => {
    if (!data) return false;
    try {
      const response = await fetch("/api/campaign/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: campaignData.username,
          amount: campaignData.budget > 0 ? campaignData.budget : data.pricing.recommended_price,
        }),
      });
      const result = await response.json();
      setCampaign((prev) => ({
        ...prev,
        campaign_id: result.campaign_id,
        status: result.status,
        amount: result.amount,
      }));
      return true;
    } catch (err) {
      console.error("Failed to start campaign", err);
      return false;
    }
  };

  const simulateEngagement = async () => {
    if (!campaign.campaign_id) return false;
    try {
      const response = await fetch("/api/campaign/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaign.campaign_id, engagement: 1200 }),
      });
      const result = await response.json();
      setCampaign((prev) => ({
        ...prev,
        engagement: result.engagement,
        milestone_met: result.milestone_met,
      }));
      return true;
    } catch (err) {
      console.error("Failed to simulate engagement", err);
      return false;
    }
  };

  const releasePayment = async () => {
    if (!campaign.campaign_id) return false;
    try {
      const response = await fetch("/api/campaign/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaign.campaign_id }),
      });
      const result = await response.json();
      setCampaign((prev) => ({
        ...prev,
        status: result.status,
      }));
      return true;
    } catch (err) {
      console.error("Failed to release payment", err);
      return false;
    }
  };

  const handleCampaignEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUsername = campaignData.username.trim().replace(/^@+/, "").toLowerCase();
    if (!normalizedUsername) {
      return;
    }

    setCampaignData((prev) => ({
      ...prev,
      username: normalizedUsername,
    }));
    setCampaignStarted(true);
  };

  useEffect(() => {
    if (!campaignStarted) return;
    const campaignUsername = campaignData.username.trim();
    if (!campaignUsername) return;

    analyzeInfluencer(campaignUsername);
  }, [campaignStarted, campaignData]);

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const waitRandom = (minMs: number, maxMs: number) => wait(minMs + Math.floor(Math.random() * (maxMs - minMs + 1)));

  const handleLockFunds = async () => {
    if (actionState !== "idle") return;
    setActionState("locking");
    try {
      await waitRandom(800, 1400);
      const success = await startCampaign();
      if (success) {
        setSystemState("CAMPAIGN_ACTIVE");
      }
    } finally {
      setActionState("idle");
    }
  };

  const handleVerifyEngagement = async () => {
    if (actionState !== "idle") return;
    setActionState("verifying");
    try {
      await waitRandom(1000, 2000);
      const success = await simulateEngagement();
      if (success) {
        setSystemState("ENGAGEMENT_VERIFIED");
      }
    } finally {
      setActionState("idle");
    }
  };

  const handleReleasePayment = async () => {
    if (actionState !== "idle") return;
    setActionState("releasing");
    try {
      await waitRandom(1000, 2000);
      const success = await releasePayment();
      if (success) {
        setSystemState("PAYMENT_RELEASED");
      }
    } finally {
      setActionState("idle");
    }
  };

  const handleCleanAudienceSimulation = async () => {
    if (!data || simulatingCleanAudience) return;
    setSimulatingCleanAudience(true);
    try {
      const response = await fetch("/simulate/clean-audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creator: campaignData.username }),
      });
      if (!response.ok) {
        throw new Error("Simulation failed");
      }
      const result = await response.json();
      setCleanAudienceSimulation(result);
    } catch (err) {
      console.error("Failed to simulate clean audience", err);
    } finally {
      setSimulatingCleanAudience(false);
    }
  };

  const handleResetSimulation = () => {
    setCleanAudienceSimulation(null);
  };

  const handleNewCampaign = () => {
    setCampaignStarted(false);
    setCampaignData(initialCampaignData);
    setData(null);
    setLoading(false);
    setError(null);
    setCampaign(initialCampaignState);
    setSystemState("ANALYSIS_COMPLETE");
    setActionState("idle");
    setCleanAudienceSimulation(null);
    setSimulatingCleanAudience(false);
  };

  const formatDelta = (value: number) => `${value >= 0 ? "+" : ""}${value}`;

  const systemStatusLabel: Record<SystemState, string> = {
    ANALYSIS_COMPLETE: "Analysis Complete",
    CAMPAIGN_ACTIVE: "Campaign Active",
    ENGAGEMENT_VERIFIED: "Engagement Verified",
    PAYMENT_RELEASED: "Payment Released",
  };

  const isCampaignActive = systemState !== "ANALYSIS_COMPLETE";
  const isEngagementVerified = systemState === "ENGAGEMENT_VERIFIED" || systemState === "PAYMENT_RELEASED";
  const isPaymentReleased = systemState === "PAYMENT_RELEASED";
  const isActionLoading = actionState !== "idle";
  const isLocking = actionState === "locking";
  const isVerifying = actionState === "verifying";
  const isReleasing = actionState === "releasing";
  const hasCampaignData = campaignStarted && campaignData.username.trim().length > 0;

  if (!hasCampaignData) {
    return (
      <CampaignEntryPage
        campaignData={campaignData}
        setCampaignData={setCampaignData}
        onSubmit={handleCampaignEntrySubmit}
      />
    );
  }

  return (
    <div className="h-screen bg-[#0a0e13] text-[#dae6fa] flex flex-col overflow-hidden">
      <TopBrandBar />

      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="h-full w-64 bg-[#0e141b] border-r border-[#3d4958]/10 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#c5c7c8] flex items-center justify-center">
            <ShieldCheck className="text-[#0a0e13] w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-widest text-[#c5c7c8] uppercase leading-none">Campaign Console</h1>
            <p className="text-[10px] font-bold text-[#9facbe] tracking-widest uppercase mt-1">Influencer Audit</p>
          </div>
        </div>
        
        <nav className="mt-8 flex-1">
          <ul className="space-y-1">
            <SidebarLink icon={<LayoutDashboard size={18} />} label="Dashboard" active />
            <SidebarLink icon={<BarChart3 size={18} />} label="Analyze" />
            <SidebarLink icon={<TrendingUp size={18} />} label="Campaigns" />
            <SidebarLink icon={<Settings size={18} />} label="Settings" />
            <SidebarLink icon={<MessageSquare size={18} />} label="Support" />
          </ul>
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-[#121a23] p-4 flex items-center gap-3">
            <img 
              src="https://picsum.photos/seed/admin/100/100" 
              alt="Admin" 
              className="w-10 h-10 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-[#dae6fa] truncate">Admin Terminal</p>
              <p className="text-[10px] text-[#9facbe] truncate">Session: #TR-9902</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="flex justify-between items-center px-8 w-full border-b border-[#3d4958]/15 h-16 bg-[#0a0e13] shrink-0">
          <div className="flex items-center gap-8">
            <span className="font-medium text-xs tracking-wider uppercase text-[#c5c7c8] border-b-2 border-[#06b77f] h-16 flex items-center">Audit View</span>
            <span className="font-medium text-xs tracking-wider uppercase text-[#9facbe] hover:text-[#06b77f] transition-opacity duration-100 h-16 flex items-center cursor-pointer">Live Feed</span>
            <span className="font-medium text-xs tracking-wider uppercase text-[#9facbe] hover:text-[#06b77f] transition-opacity duration-100 h-16 flex items-center cursor-pointer">History</span>
          </div>
          
          <div className="flex items-center gap-6">
            <button
              onClick={handleNewCampaign}
              className="border border-[#3d4958]/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9facbe] hover:text-[#dae6fa] hover:border-[#06b77f]/40 transition-colors"
            >
              New Campaign
            </button>
            <div className="flex items-center gap-4 text-[#9facbe]">
              <button className="hover:text-[#06b77f]"><Bell size={18} /></button>
              <button className="hover:text-[#06b77f]"><HelpCircle size={18} /></button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel */}
          <section className="w-[55%] border-r border-[#3d4958]/10 overflow-y-auto no-scrollbar p-8 bg-[#0a0e13]">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center space-y-4"
                >
                  <div className="w-12 h-12 border-4 border-[#06b77f] border-t-transparent animate-spin"></div>
                  <p className="text-xs font-black tracking-widest uppercase text-[#9facbe]">Analyzing Creator Data...</p>
                </motion.div>
              ) : error ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center space-y-4"
                >
                  <AlertTriangle className="text-[#ff716a] w-12 h-12" />
                  <p className="text-xs font-black tracking-widest uppercase text-[#ff716a]">{error}</p>
                  <button 
                    onClick={() => analyzeInfluencer(campaignData.username)}
                    className="text-[10px] font-bold text-[#9facbe] underline uppercase"
                  >
                    Retry Analysis
                  </button>
                </motion.div>
              ) : data && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Profile Header */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="flex gap-6 items-center">
                      <div className="w-20 h-20 bg-[#1a2735] flex items-center justify-center p-1 border border-[#3d4958]/20">
                        <img 
                          src={`https://picsum.photos/seed/${campaignData.username}/200/200`} 
                          alt={campaignData.username} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-[#06b77f]/10 text-[#06b77f] text-[9px] px-2 py-0.5 font-bold border border-[#06b77f]/20 uppercase tracking-widest">Campaign Analysis</span>
                          <span className="bg-[#06b77f]/10 text-[#06b77f] text-[10px] px-2 py-0.5 font-bold border border-[#06b77f]/20">VERIFIED</span>
                          <SystemStateBadge state={systemState} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tighter text-[#dae6fa] mt-2">Campaign: @{campaignData.username.toUpperCase()}</h2>
                        <p className="text-[#9facbe] text-sm tracking-tight mt-1">
                          Budget: <span className="text-[#dae6fa] font-bold">₹{campaignData.budget.toLocaleString()}</span>
                        </p>
                        <p className="text-[#9facbe] text-sm tracking-tight mt-1">
                          System State: <span className="text-[#dae6fa] font-bold">{systemStatusLabel[systemState]}</span> (Timestamp: {new Date().toLocaleDateString()} / {new Date().toLocaleTimeString()} UTC)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Authenticity Score */}
                  <div className="bg-[#0e141b] p-8 mb-6 border border-[#3d4958]/10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                        <p className="text-[10px] font-black tracking-[0.2em] text-[#9facbe] uppercase mb-3">Authenticity Score</p>
                        <div className="flex items-baseline gap-3">
                          <span className="text-7xl font-black text-[#dae6fa] leading-none tracking-tighter">{data.score}</span>
                          <span className="text-xl font-bold text-[#9facbe]">/100</span>
                        </div>
                        <div className="mt-4">
                          <span className={`inline-flex items-center px-3 py-1 text-[10px] font-black tracking-widest uppercase border ${
                            data.risk_level === "Low Risk" ? "bg-[#006947]/20 text-[#06b77f] border-[#06b77f]/30" :
                            data.risk_level === "Moderate Risk" ? "bg-[#ff716a]/10 text-[#ff716a] border-[#ff716a]/30" :
                            "bg-[#ee7d77]/10 text-[#ee7d77] border-[#ee7d77]/30"
                          }`}>
                            {data.risk_level}
                          </span>
                        </div>
                      </div>
                      <div className="md:text-right max-w-[240px]">
                        <p className="text-xs text-[#9facbe] leading-relaxed">
                          {data.score > 80 ? "Profile shows high integrity markers. Audience growth aligns with industry standards." : "Deviations detected in growth trajectory and engagement density. Manual audit recommended."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <ScoreBreakdown breakdown={data.score_breakdown} />

                  <div className="mb-8 bg-[#0e141b] border border-[#1f2937] p-4">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-[#9facbe] uppercase mb-3">AI Insights</h3>
                    <p className="text-xs leading-relaxed text-[#dae6fa]">{data.ai_summary}</p>
                  </div>

                  <div className="mb-8 bg-[#0e141b] border border-[#1f2937] p-4">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-[#9facbe] uppercase mb-3">Comment Quality Analysis</h3>
                    <p className="text-xs leading-relaxed text-[#dae6fa]">{data.comment_analysis.explanation}</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#9facbe]">
                      <span className={data.comment_analysis.is_bot_like ? "text-[#ff716a]" : "text-[#06b77f]"}>
                        {data.comment_analysis.is_bot_like ? "Bot-like" : "Organic"}
                      </span>
                      <span>Confidence: {data.comment_analysis.confidence}</span>
                    </div>
                  </div>

                  {/* Risk Inventory */}
                  <div className="mb-10">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-[#9facbe] uppercase mb-4">Risk Inventory</h3>
                    <div className="space-y-2">
                      {data.flags.length > 0 ? data.flags.map((flag, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-[#16202c] border-l-2 border-[#ff716a]">
                          <AlertTriangle size={14} className="text-[#ff716a] shrink-0" />
                          <span className="text-xs font-bold text-[#dae6fa]">{flag}</span>
                          <span className="ml-auto tabular-nums text-[#9facbe] text-[10px] uppercase font-bold tracking-wider">Detected</span>
                        </div>
                      )) : (
                        <div className="flex items-center gap-4 p-3 bg-[#16202c] border-l-2 border-[#06b77f]">
                          <CheckCircle2 size={14} className="text-[#06b77f] shrink-0" />
                          <span className="text-xs font-bold text-[#dae6fa]">No major risk flags detected</span>
                          <span className="ml-auto tabular-nums text-[#9facbe] text-[10px] uppercase font-bold tracking-wider">Verified</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <AudienceBreakdown data={data.metrics} />

                  <CreatorMetrics data={data.metrics} commentAnalysis={data.comment_analysis} />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Right Panel */}
          <section className="w-[45%] bg-[#0e141b] overflow-y-auto no-scrollbar p-8">
            {data && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Pricing Section */}
                <div className="mb-10">
                  <h3 className="text-[10px] font-black tracking-[0.2em] text-[#9facbe] uppercase mb-6">Market Valuation</h3>
                  <div className="grid grid-cols-2 gap-px bg-[#3d4958]/20 border border-[#3d4958]/20 overflow-hidden">
                    <div className="bg-[#0a0e13] p-5 flex flex-col justify-between min-w-0">
                      <div>
                        <p className="text-[9px] font-bold text-[#9facbe] uppercase tracking-widest mb-2">Claimed Price</p>
                        <p className="text-2xl font-black text-[#dae6fa] tabular-nums truncate">₹{data.pricing.claimed_price.toLocaleString()}</p>
                      </div>
                      <p className="text-[9px] text-[#9facbe] mt-4 uppercase font-bold">Standard Rate</p>
                    </div>
                    <div className="bg-[#0a0e13] p-5 flex flex-col justify-between min-w-0">
                      <div>
                        <p className="text-[9px] font-bold text-[#9facbe] uppercase tracking-widest mb-2">Fair Value</p>
                        <p className="text-2xl font-black text-[#06b77f] tabular-nums truncate">₹{data.pricing.recommended_price.toLocaleString()}</p>
                      </div>
                      <p className="text-[9px] text-[#9facbe] mt-4 uppercase font-bold">Audit Recommendation</p>
                    </div>
                  </div>
                  <div className={`mt-4 p-4 border flex items-center justify-between ${
                    data.pricing.overpriced_percentage > 0 
                      ? "bg-[#ff716a]/10 border-[#ff716a]/20 text-[#ff716a]" 
                      : "bg-[#06b77f]/10 border-[#06b77f]/20 text-[#06b77f]"
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {data.pricing.overpriced_percentage > 0 ? `OVERPRICED BY ${data.pricing.overpriced_percentage}%` : "FAIRLY PRICED"}
                    </span>
                    <TrendingUp size={16} />
                  </div>

                  <div className="mt-4 border border-[#1f2937] bg-[#0a0e13] p-4">
                    <h4 className="text-[9px] font-black text-[#9facbe] tracking-[0.2em] uppercase mb-2">Pricing Insight</h4>
                    <p className="text-xs leading-relaxed text-[#dae6fa]">{data.pricing_insight}</p>
                  </div>

                  <button
                    onClick={handleCleanAudienceSimulation}
                    disabled={simulatingCleanAudience}
                    className={`mt-4 w-full py-3 border text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                      simulatingCleanAudience
                        ? "border-[#3d4958]/30 text-[#9facbe] bg-[#0a0e13]/80 cursor-wait"
                        : "border-[#3d4958]/40 text-[#c5c7c8] bg-[#0a0e13] hover:border-[#06b77f]/50 hover:text-[#06b77f]"
                    }`}
                  >
                    {simulatingCleanAudience ? "Simulating..." : "Simulate Clean Audience"}
                  </button>

                  {cleanAudienceSimulation && (
                    <div className="mt-4 border border-[#1f2937] bg-[#0a0e13] p-4">
                      <h4 className="text-[9px] font-black text-[#9facbe] tracking-[0.2em] uppercase mb-3">What-if Simulation</h4>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-[#dae6fa]">
                          Score: {data.score} -&gt; {cleanAudienceSimulation.new_score}
                          <span className="ml-2 text-[#06b77f]">({formatDelta(cleanAudienceSimulation.improvement.score_increase)})</span>
                        </p>
                        <p className="text-xs font-bold text-[#dae6fa]">
                          Price: ₹{data.pricing.recommended_price.toLocaleString()} -&gt; ₹{cleanAudienceSimulation.new_price.toLocaleString()}
                          <span className="ml-2 text-[#06b77f]">({formatDelta(cleanAudienceSimulation.improvement.price_increase)})</span>
                        </p>
                      </div>
                      <button
                        onClick={handleResetSimulation}
                        className="mt-4 border border-[#3d4958]/40 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#9facbe] hover:text-[#dae6fa] hover:border-[#9facbe]/40 transition-colors"
                      >
                        Reset Simulation
                      </button>
                    </div>
                  )}
                </div>

                {/* Campaign Section */}
                <div className="mb-10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-[#9facbe] uppercase">Campaign Execution</h3>
                    <span className="text-[9px] font-bold text-[#9facbe] tracking-widest">ID: {campaign.campaign_id || "PENDING"}</span>
                  </div>

                  <div className="mb-4 text-[10px] text-[#9facbe] uppercase tracking-wider space-y-1">
                    <p>Budget: ₹{campaignData.budget.toLocaleString()}</p>
                    {campaignData.expected_engagement > 0 && (
                      <p>Expected Engagement: {campaignData.expected_engagement.toLocaleString()}</p>
                    )}
                  </div>
                  
                  <CampaignProgress systemState={systemState} />
                </div>

                <p className="text-[10px] text-[#9facbe] text-center tracking-wide">
                  Payment is released only after verified engagement thresholds are met.
                </p>

                {/* Action Button */}
                {systemState === "ANALYSIS_COMPLETE" && (
                  <button 
                    onClick={handleLockFunds}
                    disabled={isActionLoading}
                    className={`w-full bg-[#c5c7c8] py-6 flex items-center justify-center gap-4 transition-colors group ${
                      isActionLoading ? "cursor-wait opacity-80" : "hover:bg-[#b7b9ba]"
                    }`}
                  >
                    <span className="text-sm font-black text-[#3e4142] uppercase tracking-widest">
                      {isLocking ? "Locking funds..." : "Lock Escrow Payment"}
                    </span>
                    {!isLocking && <ArrowRight className="text-[#3e4142] group-hover:translate-x-1 transition-transform" />}
                  </button>
                )}
                {systemState === "CAMPAIGN_ACTIVE" && (
                  <button 
                    onClick={handleVerifyEngagement}
                    disabled={isActionLoading}
                    className={`w-full bg-[#c5c7c8] py-6 flex items-center justify-center gap-4 transition-colors group ${
                      isActionLoading ? "cursor-wait opacity-80" : "hover:bg-[#b7b9ba]"
                    }`}
                  >
                    <span className="text-sm font-black text-[#3e4142] uppercase tracking-widest">
                      {isVerifying ? "Verifying engagement..." : "Simulate Engagement"}
                    </span>
                    {!isVerifying && <ArrowRight className="text-[#3e4142] group-hover:translate-x-1 transition-transform" />}
                  </button>
                )}
                {systemState === "ENGAGEMENT_VERIFIED" && (
                  <button 
                    onClick={handleReleasePayment}
                    disabled={isActionLoading}
                    className={`w-full bg-[#c5c7c8] py-6 flex items-center justify-center gap-4 transition-colors group ${
                      isActionLoading ? "cursor-wait opacity-80" : "hover:bg-[#b7b9ba]"
                    }`}
                  >
                    <span className="text-sm font-black text-[#3e4142] uppercase tracking-widest">
                      {isReleasing ? "Releasing payment..." : "Release Escrow Payment"}
                    </span>
                    {!isReleasing && <ArrowRight className="text-[#3e4142] group-hover:translate-x-1 transition-transform" />}
                  </button>
                )}
                {systemState === "PAYMENT_RELEASED" && (
                  <button 
                    disabled
                    className="w-full py-6 flex items-center justify-center gap-4 bg-[#06b77f]/20 text-[#06b77f] cursor-default"
                  >
                    <span className="text-sm font-black uppercase tracking-widest">Payment Released</span>
                  </button>
                )}

                <div className="mt-12 bg-[#0a0e13] border-t-2 border-[#06b77f]/40 p-6">
                  <h4 className="text-[10px] font-black text-[#dae6fa] tracking-widest uppercase mb-4">Historical Trust Index</h4>
                  <div className="flex items-end gap-1 h-24 mb-4">
                    {[40, 60, 45, 80, 95, 30, 50].map((h, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 transition-all duration-1000 ${
                          i === 4 ? "bg-[#06b77f]" : i === 5 ? "bg-[#ff716a]" : "bg-[#3d4958]/20"
                        }`} 
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-[10px] leading-relaxed text-[#9facbe] font-medium">
                    The score is determined by cross-referencing global engagement benchmarks with individual account history over a 90-day window.
                  </p>
                </div>
              </motion.div>
            )}
          </section>
        </div>
      </main>
      </div>
    </div>
  );
}

function CampaignEntryPage({
  campaignData,
  setCampaignData,
  onSubmit,
}: {
  campaignData: CampaignData;
  setCampaignData: React.Dispatch<React.SetStateAction<CampaignData>>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070c12] text-[#dce7f8]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,183,127,0.16),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,16,24,0.22)_0%,rgba(7,12,18,0.95)_70%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl rounded-xl border border-[#1f2b38] bg-[#121922]/84 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-center gap-2 text-[#3ae0b1]">
              <ShieldCheck size={20} />
              <h1 className="text-3xl font-black tracking-wide">TrueReach</h1>
            </div>
            <p className="mb-8 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-[#a9bbd0]">Verify Influence. Protect Campaigns.</p>
            <h2 className="mb-6 text-center text-sm font-black uppercase tracking-[0.2em] text-[#c7d6e6]">Start New Campaign</h2>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label htmlFor="campaign-username" className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-[#b8c7d8]">
                  Influencer Username
                </label>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f8093]" />
                  <input
                    id="campaign-username"
                    type="text"
                    placeholder="@username"
                    value={campaignData.username}
                    required
                    onChange={(e) => setCampaignData((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full rounded-md border border-[#344556]/45 bg-[#2a3440]/75 py-3 pl-11 pr-4 text-sm text-[#e3edf8] placeholder:text-[#8798aa] focus:border-[#06b77f]/70 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="campaign-budget" className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-[#b8c7d8]">
                  Campaign Budget
                </label>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f8093]" />
                  <input
                    id="campaign-budget"
                    type="number"
                    min={1}
                    required
                    value={campaignData.budget || ""}
                    onChange={(e) => setCampaignData((prev) => ({ ...prev, budget: Number(e.target.value) || 0 }))}
                    className="w-full rounded-md border border-[#344556]/45 bg-[#2a3440]/75 py-3 pl-11 pr-4 text-sm text-[#e3edf8] placeholder:text-[#8798aa] focus:border-[#06b77f]/70 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="campaign-expected-engagement" className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-[#b8c7d8]">
                  Expected Engagement (Optional)
                </label>
                <div className="relative">
                  <Activity className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6f8093]" />
                  <input
                    id="campaign-expected-engagement"
                    type="number"
                    min={0}
                    placeholder="e.g. 4.5"
                    value={campaignData.expected_engagement || ""}
                    onChange={(e) => setCampaignData((prev) => ({ ...prev, expected_engagement: Number(e.target.value) || 0 }))}
                    className="w-full rounded-md border border-[#344556]/45 bg-[#2a3440]/75 py-3 pl-11 pr-4 text-sm text-[#e3edf8] placeholder:text-[#8798aa] focus:border-[#06b77f]/70 focus:outline-none"
                  />
                </div>
                <p className="mt-2 text-[10px] text-[#8e9dad]">Optional field to benchmark performance.</p>
              </div>

              <button
                type="submit"
                className="mt-3 w-full rounded-md bg-[#d9dbe0] py-4 text-sm font-black uppercase tracking-widest text-[#2e3238] transition-colors hover:bg-[#c9cbd1]"
              >
                Analyze Campaign
              </button>
            </form>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between gap-6 text-[#9caec1]">
          <p className="hidden text-xs italic md:block">"Precision is the only protection in an era of synthetic influence."</p>
          <div className="rounded-xl border border-[#2a3746] bg-[#1b2530]/85 px-4 py-3 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7adfbf]">System Status</p>
            <p className="text-xs font-semibold text-[#c7d6e6]">Global Creator Network Live - 2.4M Profiles</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBrandBar() {
  return (
    <header className="sticky top-0 z-[80] w-full border-b border-[#3d4958]/20 bg-[#0e141b]/82 backdrop-blur-sm px-6 py-3 shrink-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#06b77f]/35" />
      <div className="grid grid-cols-3 items-center relative">
        <div aria-hidden="true" />
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-black tracking-wide text-[#06b77f] drop-shadow-[0_0_4px_rgba(6,183,127,0.2)]">TrueReach</h1>
          <p className="text-[10px] uppercase tracking-widest text-[#9facbe] mt-1">Verify Influence. Protect Campaigns.</p>
        </div>
        <div aria-hidden="true" />
      </div>
    </header>
  );
}

function SidebarLink({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <li>
      <a 
        href="#" 
        className={`flex items-center gap-3 px-6 py-4 transition-colors duration-150 font-bold text-sm uppercase tracking-tight ${
          active 
            ? "bg-[#1e2d3e] text-[#c5c7c8] border-l-4 border-[#06b77f]" 
            : "text-[#9facbe] hover:bg-[#121a23]"
        }`}
      >
        {icon}
        <span>{label}</span>
      </a>
    </li>
  );
}

function ScoreBreakdown({ breakdown }: { breakdown: InfluencerData["score_breakdown"] }) {

  return (
    <div className="mb-8">
      <h3 className="text-[10px] font-black tracking-[0.2em] text-[#9facbe] uppercase mb-4">Why This Score</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {breakdown.length > 0 ? (
          breakdown.map((item) => (
            <div
              key={item.factor}
              className="flex items-center justify-between px-3 py-2 bg-[#0e141b] border border-[#1f2937]"
            >
              <span className="text-[9px] font-bold text-[#dae6fa] uppercase tracking-widest">
                {item.factor}
              </span>
              <span className="text-[10px] font-black text-[#ff716a]">{item.impact}</span>
            </div>
          ))
        ) : (
          <div className="col-span-2 md:col-span-4 flex items-center justify-between px-3 py-2 bg-[#0e141b] border border-[#1f2937]">
            <span className="text-[9px] font-bold text-[#dae6fa] uppercase tracking-widest">No penalties applied</span>
            <CheckCircle2 size={14} className="text-[#06b77f]" />
          </div>
        )}
      </div>
    </div>
  );
}

function AudienceBreakdown({ data }: { data: InfluencerData["metrics"] }) {
  const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));
  const suspicious = clampPercent(data.fake_followers);
  const inactive = clampPercent(Math.max(0, (2 - data.engagement_rate) * 8));
  const real = clampPercent(100 - suspicious - inactive);

  return (
    <div className="mt-10">
      <h3 className="text-[10px] font-black tracking-[0.2em] text-[#9facbe] uppercase mb-6">Audience Composition</h3>
      <div className="bg-[#0e141b] h-10 flex relative overflow-hidden border border-[#3d4958]/10">
        <div
          className="bg-[#06b77f] h-full transition-all duration-1000"
          style={{ width: `${real}%` }}
        />
        <div
          className="bg-[#ff716a] h-full transition-all duration-1000"
          style={{ width: `${suspicious}%` }}
        />
        <div
          className="bg-[#3d4958]/40 h-full transition-all duration-1000"
          style={{ width: `${inactive}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-3 text-[9px] font-bold text-[#9facbe] tracking-widest uppercase gap-2">
        <span className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-[#06b77f]"></div>
          Real Audience: {real}%
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-[#ff716a]"></div>
          Suspicious: {suspicious}%
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-[#3d4958]/60"></div>
          Inactive: {inactive}%
        </span>
      </div>
    </div>
  );
}

function CreatorMetrics({
  data,
  commentAnalysis,
}: {
  data: InfluencerData["metrics"];
  commentAnalysis: InfluencerData["comment_analysis"];
}) {
  const engagementRisk = data.engagement_rate < 2;
  const fakeFollowerRisk = data.fake_followers > 30;
  const growthRisk = data.growth_spike;
  const commentRisk = commentAnalysis.is_bot_like;

  const metrics = [
    {
      label: "Followers",
      value: data.followers.toLocaleString(),
    },
    {
      label: "Engagement Rate",
      value: `${data.engagement_rate}%`,
      warn: engagementRisk,
    },
    {
      label: "Fake Followers",
      value: `${data.fake_followers}%`,
      warn: fakeFollowerRisk,
    },
    {
      label: "Growth Spike",
      value: growthRisk ? "Yes" : "No",
      warn: growthRisk,
    },
    {
      label: "Comment Quality",
      value: commentRisk ? "Bot-like" : "Organic",
      warn: commentRisk,
    },
  ];

  return (
    <div className="mt-10">
      <h3 className="text-[10px] font-black tracking-[0.2em] text-[#9facbe] uppercase mb-4">Creator Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-[#0e141b] border border-[#1f2937] p-3">
            <p className="text-[9px] font-bold text-[#9facbe] uppercase tracking-widest">
              {metric.label}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-black text-[#dae6fa]">{metric.value}</span>
              {metric.warn && <AlertTriangle size={12} className="text-[#ff716a]" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignProgress({ systemState }: { systemState: SystemState }) {
  const steps = [
    { key: "init", label: "Campaign Initialized" },
    { key: "engagement", label: "Engagement Verified" },
    { key: "release", label: "Payment Released" },
  ];

  const statuses: Array<CampaignStepStatus> = (() => {
    switch (systemState) {
      case "ANALYSIS_COMPLETE":
        return ["inactive", "inactive", "inactive"];
      case "CAMPAIGN_ACTIVE":
        return ["completed", "in-progress", "inactive"];
      case "ENGAGEMENT_VERIFIED":
        return ["completed", "completed", "in-progress"];
      case "PAYMENT_RELEASED":
        return ["completed", "completed", "completed"];
      default:
        return ["inactive", "inactive", "inactive"];
    }
  })();

  const statusLabels: Record<CampaignStepStatus, string> = {
    inactive: "Pending",
    "in-progress": "In Progress",
    completed: "Completed",
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <CampaignStep
          key={step.key}
          label={step.label}
          status={statuses[index]}
          statusLabel={statusLabels[statuses[index]]}
        />
      ))}
    </div>
  );
}

function SystemStateBadge({ state }: { state: SystemState }) {
  const labelMap: Record<SystemState, string> = {
    ANALYSIS_COMPLETE: "Analysis Complete",
    CAMPAIGN_ACTIVE: "Campaign Active",
    ENGAGEMENT_VERIFIED: "Engagement Verified",
    PAYMENT_RELEASED: "Payment Released",
  };

  const badgeClasses: Record<SystemState, string> = {
    ANALYSIS_COMPLETE: "bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/30",
    CAMPAIGN_ACTIVE: "bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30",
    ENGAGEMENT_VERIFIED: "bg-[#06b77f]/15 text-[#06b77f] border-[#06b77f]/30",
    PAYMENT_RELEASED: "bg-[#06b77f]/15 text-[#06b77f] border-[#06b77f]/30",
  };

  return (
    <span className={`text-[10px] px-2 py-0.5 font-bold border uppercase tracking-widest ${badgeClasses[state]}`}>
      {labelMap[state]}
    </span>
  );
}

type CampaignStepStatus = "inactive" | "in-progress" | "completed";

function CampaignStep({ 
  label, 
  status,
  statusLabel,
}: { 
  label: string;
  status: CampaignStepStatus;
  statusLabel: string;
}) {
  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  return (
    <div className={`flex items-center gap-4 p-4 border transition-all duration-300 ${
      isCompleted ? "bg-[#0a0e13] border-[#3d4958]/10" : 
      isInProgress ? "bg-[#1e2d3e] border-[#06b77f]/30" : 
      "bg-[#0a0e13] border-[#3d4958]/5 opacity-50"
    }`}>
      {isCompleted ? (
        <CheckCircle2 className="text-[#06b77f]" size={20} />
      ) : isInProgress ? (
        <Hourglass className="text-[#9facbe] animate-pulse" size={20} />
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-[#3d4958]/20"></div>
      )}
      <div className="flex flex-col">
        <span className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? "text-[#dae6fa]" : "text-[#9facbe]"}`}>
          {label}
        </span>
      </div>
      <span className="ml-auto text-[10px] tabular-nums text-[#9facbe]">{statusLabel}</span>
    </div>
  );
}
