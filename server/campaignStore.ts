import { Campaign } from "./types";

export interface CampaignStore {
  startCampaign: (creator: string, amount: number, generateId: () => string) => Campaign;
  getCampaign: (campaignId: string) => Campaign | undefined;
  recordEngagement: (campaignId: string, engagement: number) => Campaign | undefined;
  releaseCampaign: (campaignId: string) => Campaign | undefined;
  reset: () => void;
}

export function createCampaignStore(): CampaignStore {
  const campaigns = new Map<string, Campaign>();

  return {
    startCampaign(creator, amount, generateId) {
      const campaignId = generateId();
      const campaign: Campaign = {
        campaign_id: campaignId,
        creator,
        amount,
        status: "locked",
        engagement: 0,
        milestone_met: false,
      };
      campaigns.set(campaignId, campaign);
      return campaign;
    },
    getCampaign(campaignId) {
      return campaigns.get(campaignId);
    },
    recordEngagement(campaignId, engagement) {
      const campaign = campaigns.get(campaignId);
      if (!campaign) {
        return undefined;
      }
      campaign.engagement = engagement;
      if (engagement >= 1000) {
        campaign.milestone_met = true;
      }
      return campaign;
    },
    releaseCampaign(campaignId) {
      const campaign = campaigns.get(campaignId);
      if (!campaign) {
        return undefined;
      }
      if (campaign.milestone_met) {
        campaign.status = "released";
      }
      return campaign;
    },
    reset() {
      campaigns.clear();
    },
  };
}
