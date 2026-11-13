export type Creator = {
  id: string;
  name: string;
  profileImage?: string | null;
  bannerImage?: string | null;
  bio: string;
  city?: string | null;
  niche: string;
  socialPlatforms: string[];
  socialLinks: Record<string, string>;
  followerCounts: Record<string, number>;
  followerRanges?: Record<string, string>;
  totalFollowers: number;
  engagementRate?: number | null;
  pricing?: number | null;
};

export type Campaign = {
  id: string;
  title: string;
  productName: string;
  productDetails: string;
  description: string;
  campaignType: "PUBLIC" | "PRIVATE";
  niche: string;
  platform: string;
  platforms?: string[];
  priceRange?: string;
  estimatedPrice: number;
  creatorSlots: number;
  startDate?: string;
  endDate?: string;
  deliverables: string;
  requirements: string;
  instructions: string;
  performanceTerms: string;
  status: string;
  _count?: { applications?: number; collaborations?: number };
  applications?: Array<{ id: string; status: string; message: string; creator: Creator }>;
  invitations?: Array<{ id: string; status: string; creator: Creator }>;
  collaborations?: Array<{
    id: string;
    status: string;
    creatorId: string;
    creator: Creator;
    agreement?: { id: string; status: string } | null;
    submissions?: Submission[];
    review?: { id: string; rating: number; comment: string } | null;
  }>;
  payments?: Payment[];
};

export type Submission = {
  id: string;
  status: string;
  socialUrl?: string | null;
  contentKey?: string | null;
  notes: string;
  caption: string;
  changeRequestReason?: string | null;
  changeRequestedAt?: string | null;
};

export type Payment = {
  id: string;
  collaborationId: string;
  initialAmountPaise: number;
  initialStatus: string;
  creatorPaidAt?: string | null;
};

export const brandLinks = [
  { to: "/brand", label: "Creators" },
  { to: "/brand/campaigns", label: "Campaigns" },
  { to: "/brand/messages", label: "Messages" },
  { to: "/brand/payments", label: "Payments" },
  { to: "/brand/profile", label: "Profile" },
];

