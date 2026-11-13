export type PerformancePaymentRequest = {
  id: string;
  agreementId: string;
  campaignId: string;
  creatorId: string;
  brandId: string;
  tierIndex: number;
  viewsTarget: number;
  amount: number;
  currentViews: number;
  proofUrl?: string | null;
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};

export const creatorLinks = [
  { to: "/creator", label: "Campaigns" },
  { to: "/creator/work", label: "Work" },
  { to: "/creator/messages", label: "Messages" },
  { to: "/creator/payments", label: "Payments" },
  { to: "/creator/profile", label: "Profile" },
];

