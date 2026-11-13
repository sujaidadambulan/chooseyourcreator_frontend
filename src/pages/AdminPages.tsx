import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  FileText,
  BarChart3,
  Phone,
  ShieldCheck,
  Search,
  CheckCircle2,
  Layers,
  LogOut,
  CreditCard,
  X,
} from "lucide-react";
import { Avatar, Button, Card, ErrorState, Spinner, StatusPill, Logo, Pagination, ConfirmModal } from "../components/ui";
import { ProfileDetailsModal, VerifiedBadge, type BrandDetailView, type CreatorDetailView } from "../components/ProfileDetailsModal";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate, formatInr, formatReferenceNumber, priceRangeLabel } from "../shared/index";

type AdminStats = {
  totalUsers: number;
  totalBrands: number;
  totalCreators: number;
  totalCampaigns: number;
  openCampaigns: number;
  totalAgreements: number;
  activeAgreements: number;
  totalEscrowPaise: number;
};

type AdminUser = {
  id: string;
  email: string | null;
  phone: string | null;
  role: "BRAND" | "CREATOR" | "ADMIN" | null;
  isBlocked?: boolean;
  createdAt: string;
  brandProfile?: {
    id: string;
    referenceNumber?: number;
    companyName: string;
    companyLogo?: string | null;
    bannerImage?: string | null;
    websiteUrl?: string | null;
    niche: string;
    employeeSize: string;
    isVerified?: boolean;
    onboardingComplete: boolean;
  } | null;
  creatorProfile?: {
    id: string;
    referenceNumber?: number;
    name: string;
    profileImage?: string | null;
    bannerImage?: string | null;
    city?: string | null;
    niche: string;
    totalFollowers: number;
    socialPlatforms: string[];
    isVerified?: boolean;
    onboardingComplete: boolean;
  } | null;
};

type AdminCampaign = {
  id: string;
  referenceNumber: number;
  title: string;
  productName: string;
  productDetails?: string;
  description?: string;
  deliverables?: string;
  requirements?: string;
  instructions?: string;
  performanceTerms?: string;
  campaignType: string;
  niche: string;
  platform: string;
  platforms: string[];
  priceRange?: string;
  estimatedPrice: number;
  creatorSlots: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  brand: {
    id: string;
    referenceNumber?: number;
    companyName: string;
    companyLogo?: string | null;
    isVerified?: boolean;
  };
  _count: {
    applications: number;
    collaborations: number;
    agreements: number;
  };
};

type AdminAgreement = {
  id: string;
  campaignId: string;
  brandId: string;
  creatorId: string;
  status: string;
  campaignStartDate?: string | null;
  campaignEndDate?: string | null;
  brandSignedAt?: string | null;
  brandSignatureName?: string | null;
  creatorSignedAt?: string | null;
  creatorSignatureName?: string | null;
  agreementData?: Record<string, unknown>;
  createdAt: string;
  campaign: {
    id: string;
    referenceNumber: number;
    title: string;
    brand: { id: string; referenceNumber?: number; companyName: string; companyLogo?: string | null; isVerified?: boolean };
  };
  collaboration: {
    id: string;
    status: string;
    creator: { id: string; referenceNumber?: number; name: string; profileImage?: string | null; niche?: string; isVerified?: boolean };
  };
};

type AdminPayment = {
  id: string;
  campaignId: string;
  creatorId: string;
  brandId: string;
  amount: number;
  type: string;
  initialStatus: string;
  offlineReference?: string | null;
  verifiedByAdminAt?: string | null;
  disbursedByAdminAt?: string | null;
  createdAt: string;
  campaign?: {
    id: string;
    title: string;
    referenceNumber: number;
    brand?: { id: string; companyName: string; referenceNumber?: number };
  };
  creator?: {
    id: string;
    name: string;
    referenceNumber?: number;
  };
};

export function AdminDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"overview" | "users" | "campaigns" | "agreements" | "funds">("users");
  
  // Filters for users
  const [userRoleFilter, setUserRoleFilter] = useState<"ALL" | "BRAND" | "CREATOR" | "ADMIN">("ALL");
  const [verificationFilter, setVerificationFilter] = useState<"ALL" | "VERIFIED" | "UNVERIFIED">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [campaignSearch, setCampaignSearch] = useState("");
  const [agreementSearch, setAgreementSearch] = useState("");

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [agreementsPage, setAgreementsPage] = useState(1);
  const [fundsPage, setFundsPage] = useState(1);
  const PAGE_SIZE = 12;

  // Modals
  const [profileModal, setProfileModal] = useState<
    | { type: "BRAND"; brand: BrandDetailView }
    | { type: "CREATOR"; creator: CreatorDetailView }
    | null
  >(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [viewCampaignModal, setViewCampaignModal] = useState<AdminCampaign | null>(null);
  const [viewAgreementModal, setViewAgreementModal] = useState<AdminAgreement | null>(null);

  // Custom Confirmation Dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
    variant?: "primary" | "danger";
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: async () => {},
  });
  const [actionLoading, setActionLoading] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api<{ stats: AdminStats }>("/api/admin/overview"),
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users", userRoleFilter, verificationFilter, statusFilter, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (userRoleFilter !== "ALL") params.set("role", userRoleFilter);
      if (verificationFilter !== "ALL") params.set("verification", verificationFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      return api<{ users: AdminUser[] }>(`/api/admin/users?${params.toString()}`);
    },
  });

  const campaignsQuery = useQuery({
    queryKey: ["admin-campaigns", campaignSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (campaignSearch.trim()) params.set("search", campaignSearch.trim());
      const q = params.toString();
      return api<{ campaigns: AdminCampaign[] }>(`/api/admin/campaigns${q ? `?${q}` : ""}`);
    },
    enabled: tab === "campaigns",
  });

  const agreementsQuery = useQuery({
    queryKey: ["admin-agreements", agreementSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (agreementSearch.trim()) params.set("search", agreementSearch.trim());
      const q = params.toString();
      return api<{ agreements: AdminAgreement[] }>(`/api/admin/agreements${q ? `?${q}` : ""}`);
    },
    enabled: tab === "agreements",
  });

  const paymentsQuery = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => api<{ payments: AdminPayment[] }>("/api/admin/payments"),
    enabled: tab === "funds",
  });

  function triggerConfirm(title: string, message: string, action: () => Promise<void>, variant: "primary" | "danger" = "primary") {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      action,
      variant,
    });
  }

  async function handleConfirmExecute() {
    setActionLoading(true);
    try {
      await confirmDialog.action();
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    } catch {
      // Handled in individual action
    } finally {
      setActionLoading(false);
    }
  }

  function handleToggleVerify(u: AdminUser) {
    const isVerified = Boolean(u.brandProfile?.isVerified || u.creatorProfile?.isVerified);
    const name = u.brandProfile?.companyName || u.creatorProfile?.name || u.email || "this user";
    triggerConfirm(
      `${isVerified ? "Revoke Verification" : "Verify Account"}`,
      `Are you sure you want to ${isVerified ? "remove the verification badge from" : "grant a verified badge to"} ${name}?`,
      async () => {
        await api(`/api/admin/users/${u.id}/verify`, { method: "POST" });
        await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      },
      isVerified ? "danger" : "primary"
    );
  }

  function handleToggleBlock(u: AdminUser) {
    const isCurrentlyBlocked = Boolean(u.isBlocked);
    const actionWord = isCurrentlyBlocked ? "Unblock" : "Block";
    triggerConfirm(
      `${actionWord} User Account`,
      `Are you sure you want to ${actionWord.toLowerCase()} ${u.email || "this user"}? ${
        isCurrentlyBlocked
          ? "They will regain full access to their account."
          : "They will be immediately suspended and prevented from performing any actions."
      }`,
      async () => {
        await api(`/api/admin/users/${u.id}/block`, { method: "POST" });
        await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      },
      isCurrentlyBlocked ? "primary" : "danger"
    );
  }

  function handleConfirmDeposit(paymentId: string) {
    triggerConfirm(
      "Confirm Offline Deposit",
      "Confirm that this offline transfer has been received in the bank/UPI account and secure it in Escrow?",
      async () => {
        await api(`/api/admin/payments/${paymentId}/confirm-deposit`, { method: "POST" });
        await queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
        await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      }
    );
  }

  function handleConfirmDisbursal(paymentId: string) {
    triggerConfirm(
      "Confirm Payout Disbursal to Creator",
      "Confirm that you have manually transferred the funds to the creator and mark this payment as RELEASED?",
      async () => {
        await api(`/api/admin/payments/${paymentId}/confirm-disbursal`, { method: "POST" });
        await queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
        await queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      }
    );
  }

  async function openBrandProfile(brandId: string) {
    setProfileLoading(true);
    try {
      const data = await api<{
        brand: BrandDetailView & {
          businessDescription?: string;
          role?: string;
          socialLinks?: Record<string, string>;
          isVerified?: boolean;
          email?: string | null;
          phone?: string | null;
        };
      }>(`/api/admin/brands/${brandId}`);
      const b = data.brand;
      setProfileModal({
        type: "BRAND",
        brand: {
          id: b.id,
          referenceNumber: b.referenceNumber,
          companyName: b.companyName,
          companyLogo: b.companyLogo,
          bannerImage: b.bannerImage,
          websiteUrl: b.websiteUrl,
          niche: b.niche,
          employeeSize: b.employeeSize,
          role: b.role,
          businessDescription: b.businessDescription,
          socialLinks: b.socialLinks,
          isVerified: b.isVerified,
          email: b.email,
          phone: b.phone,
        },
      });
    } catch {
      // Fallback
    } finally {
      setProfileLoading(false);
    }
  }

  async function openCreatorProfile(creatorId: string) {
    setProfileLoading(true);
    try {
      const data = await api<{
        creator: CreatorDetailView & {
          bio?: string;
          socialPlatforms?: string[];
          socialLinks?: Record<string, string>;
          followerCounts?: Record<string, number>;
          followerRanges?: Record<string, string>;
          isVerified?: boolean;
          email?: string | null;
          phone?: string | null;
        };
      }>(`/api/admin/creators/${creatorId}`);
      const c = data.creator;
      setProfileModal({
        type: "CREATOR",
        creator: {
          id: c.id,
          referenceNumber: c.referenceNumber,
          name: c.name,
          profileImage: c.profileImage,
          bannerImage: c.bannerImage,
          bio: c.bio,
          city: c.city,
          niche: c.niche,
          totalFollowers: c.totalFollowers,
          socialPlatforms: c.socialPlatforms,
          socialLinks: c.socialLinks,
          followerCounts: c.followerCounts,
          followerRanges: c.followerRanges,
          isVerified: c.isVerified,
          email: c.email,
          phone: c.phone,
        },
      });
    } catch {
      // Fallback
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleSignOut() {
    await api("/api/auth/logout", { method: "POST" });
    window.location.href = "/sign-in";
  }

  const stats = overviewQuery.data?.stats;

  // Pagination computations
  const allUsers = usersQuery.data?.users ?? [];
  const paginatedUsers = allUsers.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE);
  const totalUserPages = Math.ceil(allUsers.length / PAGE_SIZE);

  const allCampaigns = campaignsQuery.data?.campaigns ?? [];
  const paginatedCampaigns = allCampaigns.slice((campaignsPage - 1) * PAGE_SIZE, campaignsPage * PAGE_SIZE);
  const totalCampaignPages = Math.ceil(allCampaigns.length / PAGE_SIZE);

  const allAgreements = agreementsQuery.data?.agreements ?? [];
  const paginatedAgreements = allAgreements.slice((agreementsPage - 1) * PAGE_SIZE, agreementsPage * PAGE_SIZE);
  const totalAgreementPages = Math.ceil(allAgreements.length / PAGE_SIZE);

  const allPayments = paymentsQuery.data?.payments ?? [];
  const paginatedPayments = allPayments.slice((fundsPage - 1) * PAGE_SIZE, fundsPage * PAGE_SIZE);
  const totalPaymentPages = Math.ceil(allPayments.length / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-soft/30 text-ink">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 px-6 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo variant="nav" />
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold text-white tracking-wider">
              ADMIN CONSOLE
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 rounded-full border border-line bg-soft/50 px-3 py-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="font-medium text-ink">{user?.email || "Super Admin"}</span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px] font-bold">
                ROOT
              </span>
            </div>
            <Button variant="ghost" onClick={() => void handleSignOut()} className="text-xs !py-1 !px-2.5">
              <LogOut size={13} />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "overview", label: "Overview & Analytics", icon: BarChart3 },
              { id: "users", label: "Users & Accounts", icon: Users },
              { id: "funds", label: "Fund Control System", icon: CreditCard },
              { id: "campaigns", label: "All Campaigns", icon: Layers },
              { id: "agreements", label: "Agreements & Contracts", icon: FileText },
            ].map((item) => {
              const active = tab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id as typeof tab)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-ink text-white shadow-xs"
                      : "bg-white text-muted hover:bg-soft hover:text-ink border border-line"
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {(tab === "users" || tab === "campaigns" || tab === "agreements") && (
            <div className="w-full sm:w-80">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder={
                    tab === "users"
                      ? "Search name, email, phone, reference..."
                      : tab === "campaigns"
                        ? "Search campaign, brand, ref..."
                        : "Search contract, brand, creator..."
                  }
                  value={tab === "users" ? searchQuery : tab === "campaigns" ? campaignSearch : agreementSearch}
                  onChange={(e) => {
                    if (tab === "users") {
                      setSearchQuery(e.target.value);
                      setUsersPage(1);
                    } else if (tab === "campaigns") {
                      setCampaignSearch(e.target.value);
                      setCampaignsPage(1);
                    } else {
                      setAgreementSearch(e.target.value);
                      setAgreementsPage(1);
                    }
                  }}
                  className="w-full rounded-xl border border-line bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-ink shadow-2xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Overview */}
        {tab === "overview" && (
          <div className="space-y-6">
            {overviewQuery.isLoading ? <Spinner /> : null}
            {stats && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="space-y-1 border-line bg-white">
                  <div className="flex items-center justify-between text-muted text-xs">
                    <span>Total Registered Users</span>
                    <Users size={16} />
                  </div>
                  <div className="text-2xl font-bold text-ink">{stats.totalUsers}</div>
                  <p className="text-[11px] text-muted">
                    {stats.totalBrands} Brands · {stats.totalCreators} Creators
                  </p>
                </Card>

                <Card className="space-y-1 border-line bg-white">
                  <div className="flex items-center justify-between text-muted text-xs">
                    <span>Campaigns Created</span>
                    <Layers size={16} />
                  </div>
                  <div className="text-2xl font-bold text-ink">{stats.totalCampaigns}</div>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    {stats.openCampaigns} Open / Accepting Creators
                  </p>
                </Card>

                <Card className="space-y-1 border-line bg-white">
                  <div className="flex items-center justify-between text-muted text-xs">
                    <span>Signed Agreements</span>
                    <FileText size={16} />
                  </div>
                  <div className="text-2xl font-bold text-ink">{stats.totalAgreements}</div>
                  <p className="text-[11px] text-muted">
                    {stats.activeAgreements} Currently Active / Completed
                  </p>
                </Card>

                <Card className="space-y-1 border-line bg-emerald-50/50 border-emerald-200">
                  <div className="flex items-center justify-between text-emerald-800 text-xs">
                    <span>Escrow Funds Secured</span>
                    <ShieldCheck size={16} className="text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-950 font-mono">
                    {formatInr(stats.totalEscrowPaise)}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Guaranteed creator milestone safety
                  </p>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Users & Phone Numbers & Verification & Block */}
        {tab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-line">
              {/* Role filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted uppercase mr-1">Role:</span>
                {(["ALL", "BRAND", "CREATOR", "ADMIN"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setUserRoleFilter(r);
                      setUsersPage(1);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                      userRoleFilter === r
                        ? "bg-ink text-white"
                        : "border border-line bg-soft/50 text-muted hover:bg-soft"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Verification filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted uppercase mr-1">Badge:</span>
                {(["ALL", "VERIFIED", "UNVERIFIED"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setVerificationFilter(v);
                      setUsersPage(1);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                      verificationFilter === v
                        ? "bg-ink text-white"
                        : "border border-line bg-soft/50 text-muted hover:bg-soft"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-muted uppercase mr-1">Status:</span>
                {(["ALL", "ACTIVE", "BLOCKED"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatusFilter(s);
                      setUsersPage(1);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                      statusFilter === s
                        ? "bg-ink text-white"
                        : "border border-line bg-soft/50 text-muted hover:bg-soft"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {usersQuery.isLoading ? <Spinner /> : null}
            {usersQuery.isError ? <ErrorState message="Could not load users." /> : null}

            {usersQuery.data && (
              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-line bg-soft/40 text-muted uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4 font-semibold">User / Profile</th>
                        <th className="py-3 px-4 font-semibold">Role</th>
                        <th className="py-3 px-4 font-semibold">Email</th>
                        <th className="py-3 px-4 font-semibold text-emerald-800">Phone (Admin Only)</th>
                        <th className="py-3 px-4 font-semibold">Verification</th>
                        <th className="py-3 px-4 font-semibold">Account Status</th>
                        <th className="py-3 px-4 font-semibold">Joined</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-muted">
                            No users matched your search criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((u) => {
                          const profileName =
                            u.brandProfile?.companyName ||
                            u.creatorProfile?.name ||
                            u.email?.split("@")[0] ||
                            "Unnamed";
                          const profileImage =
                            u.brandProfile?.companyLogo || u.creatorProfile?.profileImage || null;
                          const isVerified = Boolean(
                            u.brandProfile?.isVerified || u.creatorProfile?.isVerified
                          );
                          const isBlocked = Boolean(u.isBlocked);

                          return (
                            <tr key={u.id} className="hover:bg-soft/30 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <Avatar name={profileName} image={profileImage} size="h-9 w-9" />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-semibold text-ink text-sm">{profileName}</p>
                                      {isVerified && <VerifiedBadge isVerified size="sm" />}
                                    </div>
                                    {u.brandProfile?.referenceNumber != null ? (
                                      <p className="text-[11px] font-mono text-amber-800">
                                        {formatReferenceNumber("brand", u.brandProfile.referenceNumber)}
                                      </p>
                                    ) : u.creatorProfile?.referenceNumber != null ? (
                                      <p className="text-[11px] font-mono text-amber-800">
                                        {formatReferenceNumber("creator", u.creatorProfile.referenceNumber)}
                                      </p>
                                    ) : (
                                      <p className="text-[11px] text-muted font-mono">{u.id.slice(0, 10)}</p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                                    u.role === "BRAND"
                                      ? "bg-purple-50 text-purple-800 border border-purple-200"
                                      : u.role === "CREATOR"
                                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  }`}
                                >
                                  {u.role || "PENDING"}
                                </span>
                              </td>

                              <td className="py-3 px-4 font-mono text-muted">{u.email || "—"}</td>

                              {/* Phone number field - Strictly Admin only */}
                              <td className="py-3 px-4 font-mono font-semibold bg-emerald-50/40 text-emerald-950 border-x border-emerald-200">
                                <div className="flex items-center gap-1.5">
                                  <Phone size={12} className="text-emerald-700 shrink-0" />
                                  <span>{u.phone || "Not provided"}</span>
                                </div>
                              </td>

                              {/* Verification Toggle */}
                              <td className="py-3 px-4">
                                {(u.brandProfile || u.creatorProfile) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVerify(u)}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer transition-all border ${
                                      isVerified
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                                        : "bg-soft text-muted border-line hover:text-ink hover:border-ink/40"
                                    }`}
                                  >
                                    <CheckCircle2 size={12} className={isVerified ? "text-emerald-600" : "text-muted"} />
                                    <span>{isVerified ? "Verified" : "Unverified"}</span>
                                  </button>
                                ) : (
                                  <span className="text-muted text-[11px]">—</span>
                                )}
                              </td>

                              {/* Blocked Status */}
                              <td className="py-3 px-4">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    isBlocked
                                      ? "bg-rose-50 text-rose-800 border border-rose-300 font-bold"
                                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  }`}
                                >
                                  {isBlocked ? "Suspended" : "Active"}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-muted">{formatDate(u.createdAt)}</td>

                              {/* Action buttons */}
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  {u.brandProfile ? (
                                    <Button
                                      variant="secondary"
                                      className="text-[10px] !py-1 !px-2"
                                      disabled={profileLoading}
                                      onClick={() => void openBrandProfile(u.brandProfile!.id)}
                                    >
                                      View
                                    </Button>
                                  ) : u.creatorProfile ? (
                                    <Button
                                      variant="secondary"
                                      className="text-[10px] !py-1 !px-2"
                                      disabled={profileLoading}
                                      onClick={() => void openCreatorProfile(u.creatorProfile!.id)}
                                    >
                                      View
                                    </Button>
                                  ) : null}

                                  {u.role !== "ADMIN" && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleBlock(u)}
                                      className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-colors cursor-pointer border ${
                                        isBlocked
                                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                          : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                                      }`}
                                    >
                                      {isBlocked ? "Unblock" : "Block"}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4">
                  <Pagination
                    currentPage={usersPage}
                    totalPages={totalUserPages}
                    onPageChange={setUsersPage}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Fund Control System */}
        {tab === "funds" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-line bg-white p-5 space-y-1">
              <h2 className="text-base font-semibold text-ink">Offline Escrow & Fund Management System</h2>
              <p className="text-xs text-muted leading-relaxed max-w-3xl">
                Brands make payments outside the platform (UPI / Bank Transfer) and mark their payment as submitted.
                Admin verifies the offline deposit to secure funds in escrow. Once deliverables are approved by the brand,
                the admin manually sends money to the creator and confirms the disbursal here.
              </p>
            </div>

            {paymentsQuery.isLoading ? <Spinner /> : null}
            {paymentsQuery.isError ? <ErrorState message="Could not load payments." /> : null}

            {paymentsQuery.data && (
              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-soft/40 text-muted uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Campaign & Ref</th>
                      <th className="py-3 px-4 font-semibold">Brand Partner</th>
                      <th className="py-3 px-4 font-semibold">Creator</th>
                      <th className="py-3 px-4 font-semibold">Amount</th>
                      <th className="py-3 px-4 font-semibold">Offline Ref / Details</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {paginatedPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted">
                          No payments recorded in the system yet.
                        </td>
                      </tr>
                    ) : (
                      paginatedPayments.map((p) => {
                        const isAwaitingDeposit = p.initialStatus === "PAYMENT_SUBMITTED";
                        const isAwaitingDisbursal = p.initialStatus === "RELEASE_AUTHORIZED";

                        return (
                          <tr key={p.id} className="hover:bg-soft/30 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-semibold text-ink">{p.campaign?.title || "Campaign"}</p>
                              {p.campaign?.referenceNumber != null && (
                                <p className="font-mono text-[10px] text-amber-800">
                                  {formatReferenceNumber("campaign", p.campaign.referenceNumber)}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium text-ink">
                              {p.campaign?.brand?.companyName || "Brand"}
                            </td>
                            <td className="py-3 px-4 font-medium text-ink">
                              {p.creator?.name || "Creator"}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-sm text-ink">
                              {formatInr(p.amount)}
                            </td>
                            <td className="py-3 px-4 text-xs text-muted font-mono">
                              {p.offlineReference || "—"}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  p.initialStatus === "HELD"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                                    : p.initialStatus === "RELEASED"
                                    ? "bg-blue-50 text-blue-800 border border-blue-300"
                                    : p.initialStatus === "PAYMENT_SUBMITTED"
                                    ? "bg-amber-50 text-amber-900 border border-amber-300 font-bold animate-pulse"
                                    : p.initialStatus === "RELEASE_AUTHORIZED"
                                    ? "bg-purple-50 text-purple-900 border border-purple-300 font-bold"
                                    : "bg-soft text-muted border border-line"
                                }`}
                              >
                                {p.initialStatus === "PAYMENT_SUBMITTED"
                                  ? "Awaiting Admin Verification"
                                  : p.initialStatus === "RELEASE_AUTHORIZED"
                                  ? "Ready for Creator Disbursal"
                                  : p.initialStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isAwaitingDeposit && (
                                <Button
                                  onClick={() => handleConfirmDeposit(p.id)}
                                  className="text-xs !py-1 !px-2.5 bg-emerald-700 hover:bg-emerald-800"
                                >
                                  Verify & Hold in Escrow
                                </Button>
                              )}
                              {isAwaitingDisbursal && (
                                <Button
                                  onClick={() => handleConfirmDisbursal(p.id)}
                                  className="text-xs !py-1 !px-2.5 bg-purple-700 hover:bg-purple-800"
                                >
                                  Confirm Sent to Creator
                                </Button>
                              )}
                              {!isAwaitingDeposit && !isAwaitingDisbursal && (
                                <span className="text-muted text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div className="p-4">
                  <Pagination
                    currentPage={fundsPage}
                    totalPages={totalPaymentPages}
                    onPageChange={setFundsPage}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Campaigns */}
        {tab === "campaigns" && (
          <div className="space-y-4">
            {campaignsQuery.isLoading ? <Spinner /> : null}
            {campaignsQuery.isError ? <ErrorState message="Could not load campaigns." /> : null}
            {campaignsQuery.data && (
              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-soft/40 text-muted uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Campaign</th>
                      <th className="py-3 px-4 font-semibold">Ref #</th>
                      <th className="py-3 px-4 font-semibold">Brand</th>
                      <th className="py-3 px-4 font-semibold">Budget</th>
                      <th className="py-3 px-4 font-semibold">Slots</th>
                      <th className="py-3 px-4 font-semibold">Activity</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {paginatedCampaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-soft/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-ink text-sm">{c.title}</p>
                          <p className="text-muted text-[11px]">
                            {c.productName} · {c.niche} · {c.platform}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] font-semibold text-amber-900 whitespace-nowrap">
                          {formatReferenceNumber("campaign", c.referenceNumber)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="font-medium text-ink underline hover:no-underline cursor-pointer"
                              onClick={() => void openBrandProfile(c.brand.id)}
                            >
                              {c.brand.companyName}
                            </button>
                            <VerifiedBadge isVerified={c.brand.isVerified} size="sm" />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono">{priceRangeLabel(c.priceRange, c.estimatedPrice)}</td>
                        <td className="py-3 px-4">{c.creatorSlots} slots</td>
                        <td className="py-3 px-4 text-muted">
                          {c._count.applications} applications · {c._count.collaborations} active
                        </td>
                        <td className="py-3 px-4">
                          <StatusPill status={c.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="secondary"
                            className="text-[10px] !py-1 !px-2"
                            onClick={() => setViewCampaignModal(c)}
                          >
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="p-4">
                  <Pagination
                    currentPage={campaignsPage}
                    totalPages={totalCampaignPages}
                    onPageChange={setCampaignsPage}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Agreements */}
        {tab === "agreements" && (
          <div className="space-y-4">
            {agreementsQuery.isLoading ? <Spinner /> : null}
            {agreementsQuery.isError ? <ErrorState message="Could not load agreements." /> : null}
            {agreementsQuery.data && (
              <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line bg-soft/40 text-muted uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Campaign Title</th>
                      <th className="py-3 px-4 font-semibold">Brand Partner</th>
                      <th className="py-3 px-4 font-semibold">Creator</th>
                      <th className="py-3 px-4 font-semibold">Brand Sign</th>
                      <th className="py-3 px-4 font-semibold">Creator Sign</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Contract</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {paginatedAgreements.map((a) => (
                      <tr key={a.id} className="hover:bg-soft/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-ink">{a.campaign.title}</p>
                          <p className="font-mono text-[10px] text-amber-800">
                            {formatReferenceNumber("campaign", a.campaign.referenceNumber)}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="underline hover:no-underline cursor-pointer"
                              onClick={() => void openBrandProfile(a.brandId)}
                            >
                              {a.campaign.brand.companyName}
                            </button>
                            <VerifiedBadge isVerified={a.campaign.brand.isVerified} size="sm" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="font-medium text-ink underline hover:no-underline cursor-pointer"
                              onClick={() => void openCreatorProfile(a.creatorId)}
                            >
                              {a.collaboration.creator.name}
                            </button>
                            <VerifiedBadge isVerified={a.collaboration.creator.isVerified} size="sm" />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {a.brandSignedAt ? (
                            <span className="text-emerald-700 flex items-center gap-1 font-medium">
                              <CheckCircle2 size={13} />
                              <span>{a.brandSignatureName || "Signed"}</span>
                            </span>
                          ) : (
                            <span className="text-muted italic">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {a.creatorSignedAt ? (
                            <span className="text-emerald-700 flex items-center gap-1 font-medium">
                              <CheckCircle2 size={13} />
                              <span>{a.creatorSignatureName || "Signed"}</span>
                            </span>
                          ) : (
                            <span className="text-muted italic">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusPill status={a.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="secondary"
                            className="text-[10px] !py-1 !px-2"
                            onClick={() => setViewAgreementModal(a)}
                          >
                            View Contract
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="p-4">
                  <Pagination
                    currentPage={agreementsPage}
                    totalPages={totalAgreementPages}
                    onPageChange={setAgreementsPage}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Inspect Campaign Modal */}
      {viewCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl">
            <div className="border-b border-line p-5 flex items-center justify-between bg-soft/30">
              <div>
                <p className="font-mono text-xs text-amber-800 font-semibold">
                  {formatReferenceNumber("campaign", viewCampaignModal.referenceNumber)}
                </p>
                <h3 className="text-lg font-bold text-ink">{viewCampaignModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewCampaignModal(null)}
                className="rounded-full p-1.5 hover:bg-soft text-muted hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-muted uppercase">Brand Partner:</span>
                  <p className="font-medium text-ink text-sm mt-0.5">{viewCampaignModal.brand.companyName}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted uppercase">Budget Range:</span>
                  <p className="font-medium text-ink text-sm mt-0.5">
                    {priceRangeLabel(viewCampaignModal.priceRange, viewCampaignModal.estimatedPrice)}
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-muted uppercase">Platforms:</span>
                  <p className="mt-0.5">{viewCampaignModal.platforms?.join(", ") || viewCampaignModal.platform}</p>
                </div>
                <div>
                  <span className="font-semibold text-muted uppercase">Creator Slots:</span>
                  <p className="mt-0.5">{viewCampaignModal.creatorSlots} total slots</p>
                </div>
              </div>

              {viewCampaignModal.description && (
                <div>
                  <span className="font-semibold text-muted uppercase">Description:</span>
                  <p className="mt-1 text-ink whitespace-pre-wrap">{viewCampaignModal.description}</p>
                </div>
              )}

              {viewCampaignModal.deliverables && (
                <div>
                  <span className="font-semibold text-muted uppercase">Deliverables:</span>
                  <p className="mt-1 text-ink whitespace-pre-wrap">{viewCampaignModal.deliverables}</p>
                </div>
              )}

              {viewCampaignModal.requirements && (
                <div>
                  <span className="font-semibold text-muted uppercase">Requirements:</span>
                  <p className="mt-1 text-ink whitespace-pre-wrap">{viewCampaignModal.requirements}</p>
                </div>
              )}
            </div>

            <div className="border-t border-line p-4 flex justify-end bg-soft/20">
              <Button variant="secondary" onClick={() => setViewCampaignModal(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Agreement Modal */}
      {viewAgreementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl">
            <div className="border-b border-line p-5 flex items-center justify-between bg-soft/30">
              <div>
                <p className="font-mono text-xs text-amber-800 font-semibold">
                  Contract: {formatReferenceNumber("campaign", viewAgreementModal.campaign.referenceNumber)}
                </p>
                <h3 className="text-lg font-bold text-ink">{viewAgreementModal.campaign.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewAgreementModal(null)}
                className="rounded-full p-1.5 hover:bg-soft text-muted hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-line p-3">
                  <span className="text-[10px] font-semibold text-muted uppercase">Brand Partner</span>
                  <p className="font-bold text-sm text-ink mt-0.5">{viewAgreementModal.campaign.brand.companyName}</p>
                  <p className="text-[11px] text-muted mt-1">
                    Signature: {viewAgreementModal.brandSignatureName || "Pending"}
                  </p>
                  <p className="text-[10px] text-muted">
                    Signed at: {viewAgreementModal.brandSignedAt ? formatDate(viewAgreementModal.brandSignedAt) : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-line p-3">
                  <span className="text-[10px] font-semibold text-muted uppercase">Creator Partner</span>
                  <p className="font-bold text-sm text-ink mt-0.5">{viewAgreementModal.collaboration.creator.name}</p>
                  <p className="text-[11px] text-muted mt-1">
                    Signature: {viewAgreementModal.creatorSignatureName || "Pending"}
                  </p>
                  <p className="text-[10px] text-muted">
                    Signed at: {viewAgreementModal.creatorSignedAt ? formatDate(viewAgreementModal.creatorSignedAt) : "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-line p-3 space-y-2">
                <span className="font-semibold text-muted uppercase">Agreement Status:</span>
                <div className="flex items-center gap-2">
                  <StatusPill status={viewAgreementModal.status} />
                  <span className="text-muted">Created on {formatDate(viewAgreementModal.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-line p-4 flex justify-end bg-soft/20">
              <Button variant="secondary" onClick={() => setViewAgreementModal(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        loading={actionLoading}
        onConfirm={() => void handleConfirmExecute()}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {profileModal?.type === "BRAND" ? (
        <ProfileDetailsModal
          type="BRAND"
          brand={profileModal.brand}
          showAdminReference
          showPhoneInAdmin
          onClose={() => setProfileModal(null)}
        />
      ) : null}
      {profileModal?.type === "CREATOR" ? (
        <ProfileDetailsModal
          type="CREATOR"
          creator={profileModal.creator}
          showAdminReference
          showPhoneInAdmin
          onClose={() => setProfileModal(null)}
        />
      ) : null}
    </div>
  );
}
