import {
  BRAND_ROLES,
  EMPLOYEE_SIZES,
  FOLLOWER_RANGES,
  NICHES,
  PLATFORMS,
  PRICE_RANGES,
  effectiveAgreementStatusMeta,
  followerEstimateLabel,
  formatDate,
  formatFollowerCount,
  formatInr,
  formatReferenceNumber,
  priceRangeLabel,
  resolveEffectiveAgreementStatus,
} from "../shared/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Avatar, Button, Card, EmptyState, ErrorState, Field, Notice, SelectInput, Spinner, StatusPill, TextArea, TextInput, Pagination, ConfirmModal, PromptModal } from "../components/ui";
import { api, ApiError, apiUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { EditCampaignModal } from "../components/EditCampaignModal";
import { ProfileDetailsModal, type CreatorDetailView, VerifiedBadge } from "../components/ProfileDetailsModal";
import { ImageCropModal } from "../components/ImageCropModal";
import { ShareButton } from "../components/ShareButton";
import { Edit, Trash2, Camera, Sparkles, X } from "lucide-react";

type Creator = {
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
  isVerified?: boolean;
};

type Campaign = {
  id: string;
  referenceNumber?: number;
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

type Submission = { id: string; status: string; socialUrl?: string | null; contentKey?: string | null; notes: string; caption: string; changeRequestReason?: string | null; changeRequestedAt?: string | null };
type Payment = {
  id: string;
  type: string;
  amount: number;
  initialStatus?: string | null;
  performanceStatus?: string | null;
  creatorId: string;
  creatorName?: string;
  campaign?: { id?: string; title: string; status?: string; endDate?: string | null };
  campaignId?: string;
  createdAt: string;
  agreementId?: string | null;
  performanceTiers?: Array<{ views: number; amount: number; label?: string }>;
  agreementStatus?: string | null;
  collaborationStatus?: string | null;
  submissionApproved?: boolean;
  canRequestRelease?: boolean;
  releaseIneligibilityReason?: string | null;
  collaborationId?: string | null;
  hasReviewed?: boolean;
};

const brandLinks = [
  { to: "/brand", label: "Home" },
  { to: "/brand/messages", label: "Messages" },
  { to: "/brand/campaigns", label: "Campaigns" },
  { to: "/brand/payments", label: "Payments" },
  { to: "/brand/profile", label: "Profile" },
];

export { brandLinks };

export function BrandOnboarding() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    niche: "Fitness",
    employeeSize: "1-10",
    platforms: ["Instagram"] as string[],
    role: "Founder",
    companyName: "",
    websiteUrl: "",
    businessDescription: "",
    instagram: "",
    youtube: "",
    facebook: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function togglePlatform(platform: string) {
    setForm((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform],
    }));
  }

  function validateStep1() {
    const errors: Record<string, string> = {};
    if (!form.companyName.trim()) {
      errors.companyName = "Please enter your company name.";
    }
    if (!form.niche.trim()) {
      errors.niche = "Please select your business niche.";
    }
    if (!form.businessDescription.trim()) {
      errors.businessDescription = "Please add a short business description.";
    }
    if (form.websiteUrl.trim()) {
      try {
        const u = new URL(form.websiteUrl.trim());
        if (!["http:", "https:"].includes(u.protocol)) {
          errors.websiteUrl = "Enter a valid website URL or leave this field empty.";
        }
      } catch {
        errors.websiteUrl = "Enter a valid website URL or leave this field empty.";
      }
    }
    const hasSocial = Boolean(form.instagram.trim() || form.youtube.trim() || form.facebook.trim());
    if (!hasSocial) {
      errors.social = "Add at least one social media profile link.";
    } else {
      if (form.instagram.trim()) {
        try {
          const u = new URL(form.instagram.trim());
          if (u.hostname.replace(/^www\./, "").toLowerCase() !== "instagram.com") {
            errors.instagram = "Enter a valid Instagram profile URL.";
          }
        } catch {
          errors.instagram = "Enter a valid Instagram profile URL.";
        }
      }
      if (form.youtube.trim()) {
        try {
          const u = new URL(form.youtube.trim());
          const h = u.hostname.replace(/^www\./, "").toLowerCase();
          if (h !== "youtube.com" && h !== "youtu.be") {
            errors.youtube = "Enter a valid YouTube profile URL.";
          }
        } catch {
          errors.youtube = "Enter a valid YouTube profile URL.";
        }
      }
      if (form.facebook.trim()) {
        try {
          const u = new URL(form.facebook.trim());
          const h = u.hostname.replace(/^www\./, "").toLowerCase();
          if (h !== "facebook.com" && h !== "fb.com" && h !== "m.facebook.com") {
            errors.facebook = "Enter a valid Facebook profile URL.";
          }
        } catch {
          errors.facebook = "Enter a valid Facebook profile URL.";
        }
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!validateStep1()) return;

    try {
      await api("/api/brand/profile", {
        method: "PUT",
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          websiteUrl: form.websiteUrl.trim() || undefined,
          niche: form.niche,
          employeeSize: form.employeeSize,
          role: form.role,
          businessDescription: form.businessDescription.trim(),
          socialLinks: {
            platforms: form.platforms.join(", "),
            instagram: form.instagram.trim() || undefined,
            youtube: form.youtube.trim() || undefined,
            facebook: form.facebook.trim() || undefined,
          },
        }),
      });
      await refresh();
      navigate("/brand");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the profile");
    }
  }

  return (
    <div className="mx-auto max-w-xl px-5 py-16">
      <h1 className="text-3xl font-medium">{step === 0 ? "Tell us about the company" : "Set up the brand profile"}</h1>
      <form className="mt-8 space-y-4" onSubmit={step === 0 ? (event) => { event.preventDefault(); setStep(1); } : (event) => void save(event)}>
        <Notice message={error} />
        {step === 0 ? (
          <>
            <Field label="Niche">
              <SelectInput value={form.niche} onChange={(event) => setForm({ ...form, niche: event.target.value })}>
                {NICHES.map((niche) => <option key={niche}>{niche}</option>)}
              </SelectInput>
            </Field>
            <Field label="Company size">
              <SelectInput value={form.employeeSize} onChange={(event) => setForm({ ...form, employeeSize: event.target.value })}>
                {EMPLOYEE_SIZES.map((size) => <option key={size}>{size}</option>)}
              </SelectInput>
            </Field>
            <fieldset>
              <legend className="text-sm font-medium">Platforms you want content for</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {PLATFORMS.filter((p) => p !== "Other").map((platform) => (
                  <button key={platform} type="button" onClick={() => togglePlatform(platform)} className={`rounded-full border px-4 py-2 text-sm ${form.platforms.includes(platform) ? "border-ink bg-ink text-white" : "border-line"}`}>
                    {platform}
                  </button>
                ))}
              </div>
            </fieldset>
            <Field label="Your role">
              <SelectInput value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {BRAND_ROLES.map((role) => <option key={role}>{role}</option>)}
              </SelectInput>
            </Field>
            <Button type="submit">Continue</Button>
          </>
        ) : (
          <>
            <div>
              <Field label="Company name *">
                <TextInput
                  value={form.companyName}
                  onChange={(event) => {
                    setForm({ ...form, companyName: event.target.value });
                    if (fieldErrors.companyName) setFieldErrors({ ...fieldErrors, companyName: "" });
                  }}
                  required
                />
              </Field>
              {fieldErrors.companyName ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.companyName}</p>
              ) : null}
            </div>
            <div>
              <Field label="Website (Optional)">
                <TextInput
                  placeholder="https://example.com"
                  value={form.websiteUrl}
                  onChange={(event) => {
                    setForm({ ...form, websiteUrl: event.target.value });
                    if (fieldErrors.websiteUrl) setFieldErrors({ ...fieldErrors, websiteUrl: "" });
                  }}
                />
              </Field>
              {fieldErrors.websiteUrl ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.websiteUrl}</p>
              ) : null}
            </div>
            <div>
              <Field label="Description *">
                <TextArea
                  value={form.businessDescription}
                  onChange={(event) => {
                    setForm({ ...form, businessDescription: event.target.value });
                    if (fieldErrors.businessDescription) setFieldErrors({ ...fieldErrors, businessDescription: "" });
                  }}
                  required
                />
              </Field>
              {fieldErrors.businessDescription ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.businessDescription}</p>
              ) : null}
            </div>
            {fieldErrors.social ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 font-medium">
                {fieldErrors.social}
              </p>
            ) : null}
            <div>
              <Field label="Instagram profile link">
                <TextInput
                  placeholder="https://instagram.com/yourbrand"
                  value={form.instagram}
                  onChange={(event) => {
                    setForm({ ...form, instagram: event.target.value });
                    if (fieldErrors.instagram) setFieldErrors({ ...fieldErrors, instagram: "" });
                    if (fieldErrors.social) setFieldErrors({ ...fieldErrors, social: "" });
                  }}
                />
              </Field>
              {fieldErrors.instagram ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.instagram}</p>
              ) : null}
            </div>
            <div>
              <Field label="YouTube profile link">
                <TextInput
                  placeholder="https://youtube.com/@yourbrand"
                  value={form.youtube}
                  onChange={(event) => {
                    setForm({ ...form, youtube: event.target.value });
                    if (fieldErrors.youtube) setFieldErrors({ ...fieldErrors, youtube: "" });
                    if (fieldErrors.social) setFieldErrors({ ...fieldErrors, social: "" });
                  }}
                />
              </Field>
              {fieldErrors.youtube ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.youtube}</p>
              ) : null}
            </div>
            <div>
              <Field label="Facebook profile link">
                <TextInput
                  placeholder="https://facebook.com/yourbrand"
                  value={form.facebook}
                  onChange={(event) => {
                    setForm({ ...form, facebook: event.target.value });
                    if (fieldErrors.facebook) setFieldErrors({ ...fieldErrors, facebook: "" });
                    if (fieldErrors.social) setFieldErrors({ ...fieldErrors, social: "" });
                  }}
                />
              </Field>
              {fieldErrors.facebook ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.facebook}</p>
              ) : null}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(0)}>Previous</Button>
              <Button type="submit">Save and continue</Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

export function BrandHome() {
  const [q, setQ] = useState("");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("");
  const [range, setRange] = useState("any");
  const [selectedCreator, setSelectedCreator] = useState<CreatorDetailView | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const selected = FOLLOWER_RANGES.find((item) => item.id === range) ?? FOLLOWER_RANGES[0];
  const query = useQuery({
    queryKey: ["creators", q, niche, platform, range],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (niche) params.set("niche", niche);
      if (platform) params.set("platform", platform);
      if (selected.id !== "any") {
        if (selected.min != null) params.set("minFollowers", String(selected.min));
        if (selected.max != null) params.set("maxFollowers", String(selected.max));
      }
      return api<{ creators: Creator[] }>(`/api/brand/creators?${params.toString()}`);
    },
  });

  const allCreators = query.data?.creators ?? [];
  const totalPages = Math.max(1, Math.ceil(allCreators.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedCreators = allCreators.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium">Discover creators</h1>
        <p className="mt-2 text-muted">Search by name, niche, platform, or following.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <TextInput
          placeholder="Search by name"
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
        <SelectInput
          value={niche}
          onChange={(event) => {
            setNiche(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All niches</option>
          {NICHES.map((item) => <option key={item}>{item}</option>)}
        </SelectInput>
        <SelectInput
          value={platform}
          onChange={(event) => {
            setPlatform(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All platforms</option>
          {PLATFORMS.map((item) => <option key={item}>{item}</option>)}
        </SelectInput>
        <SelectInput
          value={range}
          onChange={(event) => {
            setRange(event.target.value);
            setPage(1);
          }}
        >
          {FOLLOWER_RANGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </SelectInput>
      </div>
      {query.isLoading ? <Spinner /> : null}
      {query.isError ? <ErrorState message={query.error instanceof Error ? query.error.message : "Could not load creators"} onRetry={() => void query.refetch()} /> : null}
      {query.data && query.data.creators.length === 0 ? <EmptyState title="No creators found." body="Try a different name, niche, or follower range." /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {paginatedCreators.map((creator) => (
          <Card key={creator.id}>
            <div className="flex items-start gap-4">
              <Avatar name={creator.name} image={creator.profileImage} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h2 className="text-lg font-medium truncate">{creator.name}</h2>
                    <VerifiedBadge isVerified={creator.isVerified} size="sm" />
                  </div>
                  <span className="shrink-0 rounded border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-xs font-mono font-medium text-neutral-800">
                    {followerEstimateLabel(undefined, creator.totalFollowers)} followers
                  </span>
                </div>
                <p className="text-sm text-muted">{creator.niche} · {creator.city}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted">{creator.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {creator.socialPlatforms.map((platform) => {
                const count =
                  creator.followerCounts?.[platform] ??
                  creator.followerCounts?.[platform.toLowerCase()];
                return (
                  <span
                    key={platform}
                    className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-neutral-700"
                  >
                    <span className="font-medium">{platform}</span>
                    <span className="text-muted">
                      · {followerEstimateLabel(creator.followerRanges?.[platform] ?? creator.followerRanges?.[platform.toLowerCase()], count)}
                    </span>
                  </span>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setSelectedCreator({
                    id: creator.id,
                    name: creator.name,
                    profileImage: creator.profileImage,
                    bannerImage: creator.bannerImage,
                    bio: creator.bio,
                    city: creator.city,
                    niche: creator.niche,
                    totalFollowers: creator.totalFollowers,
                    socialPlatforms: creator.socialPlatforms,
                    socialLinks: creator.socialLinks,
                    followerCounts: creator.followerCounts,
                    followerRanges: creator.followerRanges,
                    isVerified: creator.isVerified,
                  })
                }
              >
                View profile
              </Button>
              <Link to={`/brand/creators/${creator.id}`} className="text-xs text-muted underline hover:text-ink">
                Invite to campaign →
              </Link>
            </div>
          </Card>
        ))}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
      {selectedCreator ? (
        <ProfileDetailsModal type="CREATOR" creator={selectedCreator} onClose={() => setSelectedCreator(null)} />
      ) : null}
    </div>
  );
}

export function CreatorProfilePage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [campaignId, setCampaignId] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const creator = useQuery({
    queryKey: ["creator", id],
    queryFn: () => api<{ creator: Creator }>(`/api/brand/creators/${id}`),
  });
  const campaigns = useQuery({
    queryKey: ["brand-campaigns"],
    queryFn: () => api<{ campaigns: Campaign[] }>("/api/campaigns"),
  });
  const invite = useMutation({
    mutationFn: () => api(`/api/campaigns/${campaignId}/invite`, { method: "POST", body: JSON.stringify({ creatorId: id, message }) }),
    onSuccess: async () => {
      setNotice("Invitation sent.");
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => setNotice(error instanceof Error ? error.message : "Could not send the invitation"),
  });
  if (creator.isLoading) return <Spinner />;
  if (creator.isError || !creator.data) return <ErrorState message="Creator not found." />;
  const profile = creator.data.creator;
  const privateCampaigns = campaigns.data?.campaigns.filter((item) => item.campaignType === "PRIVATE" && item.status === "OPEN") ?? [];
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-5">
        <Avatar name={profile.name} image={profile.profileImage} size="h-20 w-20" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-medium">{profile.name}</h1>
            <VerifiedBadge isVerified={profile.isVerified} />
            <span className="rounded border border-neutral-300 bg-neutral-100 px-2.5 py-1 text-xs font-mono font-medium text-neutral-800">
              {followerEstimateLabel(undefined, profile.totalFollowers)} followers
            </span>
          </div>
          <p className="text-muted mt-1">{profile.niche} · {profile.city}</p>
        </div>
      </div>
      <p className="max-w-2xl">{profile.bio}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.socialPlatforms.filter((platform) => platform !== "Other").map((platform) => {
          const link = profile.socialLinks?.[platform.toLowerCase()];
          const count =
            profile.followerCounts?.[platform] ??
            profile.followerCounts?.[platform.toLowerCase()];
          return (
            <Card key={platform}>
              {link ? (
                <a className="text-sm underline" href={link} target="_blank" rel="noreferrer">{platform}</a>
              ) : (
                <p className="text-sm text-muted">{platform}</p>
              )}
              <p className="mt-2 text-2xl font-mono">
                {followerEstimateLabel(profile.followerRanges?.[platform] ?? profile.followerRanges?.[platform.toLowerCase()], count)}
              </p>
              <p className="text-xs text-muted">
                {count != null ? `estimated followers (${formatFollowerCount(count)} exact)` : "estimated followers"}
              </p>
            </Card>
          );
        })}
      </div>
      <Card>
        <h2 className="text-lg font-medium">Invite to a private campaign</h2>
        <div className="mt-4 space-y-3">
          <Notice message={notice} />
          {privateCampaigns.length === 0 ? <p className="text-sm text-muted">Create a private campaign before sending an invitation.</p> : null}
          <SelectInput value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
            <option value="">Select a campaign</option>
            {privateCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}
          </SelectInput>
          <TextArea placeholder="Add a note" value={message} onChange={(event) => setMessage(event.target.value)} />
          <Button disabled={!campaignId || invite.isPending} onClick={() => invite.mutate()}>Send invitation</Button>
        </div>
      </Card>
    </div>
  );
}

type CampaignFilterCategory = "all" | "active" | "inactive" | "expired" | "closed" | "cancelled";

export function BrandCampaigns() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["brand-campaigns"], queryFn: () => api<{ campaigns: Campaign[] }>("/api/campaigns") });
  const [filter, setFilter] = useState<CampaignFilterCategory>("all");
  const [search, setSearch] = useState("");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  async function confirmDelete() {
    if (!deletingCampaign) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api(`/api/campaigns/${deletingCampaign.id}`, { method: "DELETE" });
      setDeletingCampaign(null);
      await queryClient.invalidateQueries({ queryKey: ["brand-campaigns"] });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete campaign");
    } finally {
      setDeleting(false);
    }
  }

  if (query.isLoading) return <Spinner />;
  if (query.isError) return <ErrorState message="Could not load campaigns." onRetry={() => void query.refetch()} />;

  const campaigns = query.data?.campaigns ?? [];
  const now = Date.now();

  function isExpired(c: Campaign) {
    if (c.status === "EXPIRED") return true;
    if (c.endDate && new Date(c.endDate).getTime() < now && c.status !== "CLOSED" && c.status !== "CANCELLED") {
      return true;
    }
    return false;
  }

  function isActive(c: Campaign) {
    return c.status === "OPEN" && !isExpired(c);
  }

  function isInactive(c: Campaign) {
    return c.status === "DRAFT";
  }

  // Pre-calculate category counts
  const counts = {
    all: campaigns.length,
    active: campaigns.filter(isActive).length,
    inactive: campaigns.filter(isInactive).length,
    expired: campaigns.filter(isExpired).length,
    closed: campaigns.filter((c) => c.status === "CLOSED").length,
    cancelled: campaigns.filter((c) => c.status === "CANCELLED").length,
  };

  // Filter list
  const filtered = campaigns.filter((campaign) => {
    // Category filter
    let matchesCategory = true;
    if (filter === "active") matchesCategory = isActive(campaign);
    else if (filter === "inactive") matchesCategory = isInactive(campaign);
    else if (filter === "expired") matchesCategory = isExpired(campaign);
    else if (filter === "closed") matchesCategory = campaign.status === "CLOSED";
    else if (filter === "cancelled") matchesCategory = campaign.status === "CANCELLED";

    if (!matchesCategory) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSearch =
        campaign.title.toLowerCase().includes(q) ||
        campaign.productName.toLowerCase().includes(q) ||
        campaign.description.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedCampaigns = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const filterTabs: Array<{ id: CampaignFilterCategory; label: string; count: number }> = [
    { id: "all", label: "All campaigns", count: counts.all },
    { id: "active", label: "Active", count: counts.active },
    { id: "inactive", label: "Inactive / Drafts", count: counts.inactive },
    { id: "expired", label: "Expired", count: counts.expired },
    ...(counts.closed > 0 ? [{ id: "closed" as const, label: "Completed", count: counts.closed }] : []),
    ...(counts.cancelled > 0 ? [{ id: "cancelled" as const, label: "Cancelled", count: counts.cancelled }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium">Campaigns</h1>
          <p className="mt-1 text-sm text-muted">Manage your collaboration campaigns, review applications, and track active deals.</p>
        </div>
        <Link to="/brand/campaigns/new">
          <Button>+ Create campaign</Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {filterTabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setFilter(tab.id);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-ink text-white"
                      : "bg-soft/70 text-muted hover:bg-soft hover:text-ink border border-line/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                      active ? "bg-white/20 text-white" : "bg-white text-muted border border-line/40"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="w-full sm:w-64">
            <TextInput
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet."
          body="Create your first campaign to begin receiving creator applications."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching campaigns found."
          body={
            search
              ? `No campaigns match "${search}" in the ${filter} category.`
              : `There are currently no campaigns categorized as ${filter}.`
          }
        />
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedCampaigns.map((campaign) => {
              const expired = isExpired(campaign);

              return (
                <div key={campaign.id} className="relative group block">
                  <Card className="transition-all hover:border-ink/40">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <Link to={`/brand/campaigns/${campaign.id}`} className="space-y-1.5 flex-1 min-w-[240px]">
                        {campaign.referenceNumber != null && (
                          <p className="font-mono text-xs font-semibold text-amber-800">
                            {formatReferenceNumber("campaign", campaign.referenceNumber)}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-medium group-hover:underline text-ink">{campaign.title}</h3>
                          <span className="text-xs text-muted uppercase tracking-wider px-2 py-0.5 rounded-full bg-soft border border-line">
                            {campaign.campaignType.toLowerCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted">
                          {campaign.productName} · {(campaign.platforms?.length ? campaign.platforms.join(", ") : campaign.platform)} · {priceRangeLabel(campaign.priceRange, campaign.estimatedPrice)}
                        </p>
                        {campaign.endDate ? (
                          <p className="text-xs text-muted">
                            Ends: {formatDate(campaign.endDate)}
                            {expired ? <span className="ml-1.5 text-rose-600 font-medium">(Expired)</span> : null}
                          </p>
                        ) : null}
                      </Link>

                      <div className="flex flex-wrap items-center gap-2">
                        {campaign._count?.applications ? (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-soft border border-line font-medium text-ink">
                            {campaign._count.applications} {campaign._count.applications === 1 ? "applicant" : "applicants"}
                          </span>
                        ) : null}
                        <StatusPill status={expired && campaign.status === "OPEN" ? "EXPIRED" : campaign.status} />

                        {/* Action buttons: Edit, Delete, Share */}
                        <div className="flex items-center gap-1 pl-2 border-l border-line/60">
                          <ShareButton
                            size="sm"
                            variant="ghost"
                            url={`${typeof window !== "undefined" ? window.location.origin : ""}/brand/campaigns/${campaign.id}`}
                            title={`ChooseYourCreator Campaign: ${campaign.title}`}
                          />
                          <button
                            type="button"
                            onClick={() => setEditingCampaign(campaign)}
                            className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-ink transition-colors cursor-pointer"
                            title="Edit campaign"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCampaign(campaign)}
                            className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete campaign"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <EditCampaignModal
          campaign={editingCampaign}
          isOpen={Boolean(editingCampaign)}
          onClose={() => setEditingCampaign(null)}
          onSuccess={() => void query.refetch()}
        />
      )}

      {/* Delete Campaign Confirmation Modal */}
      {deletingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-medium text-ink">Delete Campaign</h3>
            <Notice message={deleteError} />
            <p className="text-sm text-muted">
              Are you sure you want to delete <span className="font-semibold text-ink">"{deletingCampaign.title}"</span>? This will permanently remove the campaign and any pending creator applications.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setDeletingCampaign(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => void confirmDelete()}
                disabled={deleting}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                {deleting ? "Deleting..." : "Delete Campaign"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CampaignForm() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    productName: "",
    productDetails: "",
    description: "",
    campaignType: "PUBLIC",
    niche: "Fitness",
    platforms: ["Instagram"] as string[],
    priceRange: "10k-20k",
    creatorSlots: "1",
    deliverables: "",
    requirements: "",
    instructions: "",
    performanceTerms: "",
  });

  async function submit(publish: boolean) {
    setError(null);
    if (form.platforms.length === 0) {
      setError("Choose at least one platform");
      return;
    }
    const slots = Number(form.creatorSlots);
    if (!Number.isInteger(slots) || slots < 1) {
      setError("Enter at least one creator slot");
      return;
    }
    setPending(true);
    try {
      const data = await api<{ campaign: Campaign }>("/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          creatorSlots: slots,
          publish,
        }),
      });
      if (publish && data.campaign.status !== "OPEN") {
        setError("The campaign was saved, but it did not publish.");
        setPending(false);
        return;
      }
      navigate(`/brand/campaigns/${data.campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the campaign");
      setPending(false);
    }
  }

  return (
    <form className="mx-auto max-w-2xl space-y-4" onSubmit={(event) => { event.preventDefault(); void submit(true); }}>
      <h1 className="text-3xl font-medium">Create campaign</h1>
      <Notice message={error} />
      <Field label="Title"><TextInput value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></Field>
      <Field label="Product name"><TextInput value={form.productName} onChange={(event) => setForm({ ...form, productName: event.target.value })} required /></Field>
      <Field label="Product details"><TextArea value={form.productDetails} onChange={(event) => setForm({ ...form, productDetails: event.target.value })} required /></Field>
      <Field label="Description (Optional)"><TextArea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Visibility">
          <SelectInput value={form.campaignType} onChange={(event) => setForm({ ...form, campaignType: event.target.value })}>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </SelectInput>
        </Field>
        <Field label="Niche">
          <SelectInput value={form.niche} onChange={(event) => setForm({ ...form, niche: event.target.value })}>
            {NICHES.map((niche) => <option key={niche}>{niche}</option>)}
          </SelectInput>
        </Field>
        <Field label="Budget">
          <SelectInput value={form.priceRange} onChange={(event) => setForm({ ...form, priceRange: event.target.value })}>
            {PRICE_RANGES.map((range) => <option key={range.id} value={range.id}>{range.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Creator slots"><TextInput type="number" min="1" value={form.creatorSlots} onChange={(event) => setForm({ ...form, creatorSlots: event.target.value })} required /></Field>
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Platforms</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {PLATFORMS.filter((platform) => platform !== "Other").map((platform) => {
            const selected = form.platforms.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                onClick={() => setForm({
                  ...form,
                  platforms: selected ? form.platforms.filter((item) => item !== platform) : [...form.platforms, platform],
                })}
                className={`rounded-full border px-4 py-2 text-sm ${selected ? "border-ink bg-ink text-white" : "border-line"}`}
              >
                {platform}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Field label="Deliverables"><TextArea value={form.deliverables} onChange={(event) => setForm({ ...form, deliverables: event.target.value })} required /></Field>
      <Field label="Requirements"><TextArea value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} required /></Field>
      <Field label="Additional instructions (Optional)"><TextArea value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} /></Field>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Publishing…" : "Publish"}</Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => void submit(false)}>Save draft</Button>
      </div>
    </form>
  );
}

export function BrandCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [changeReasonModal, setChangeReasonModal] = useState<{ submissionId: string } | null>(null);
  const [changeReason, setChangeReason] = useState("");
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<CreatorDetailView | null>(null);
  const [reviewModal, setReviewModal] = useState<{ collaborationId: string; creatorName: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const query = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => api<{ campaign: Campaign }>(`/api/campaigns/${id}`),
  });

  function creatorToModalView(creator: Creator): CreatorDetailView {
    return {
      id: creator.id,
      name: creator.name,
      profileImage: creator.profileImage,
      bannerImage: creator.bannerImage,
      bio: creator.bio,
      city: creator.city,
      niche: creator.niche,
      totalFollowers: creator.totalFollowers,
      socialPlatforms: creator.socialPlatforms,
      socialLinks: creator.socialLinks,
      followerCounts: creator.followerCounts,
      followerRanges: creator.followerRanges,
      isVerified: creator.isVerified,
    };
  }

  async function submitReview() {
    if (!reviewModal) return;
    setReviewSubmitting(true);
    setNotice(null);
    try {
      await api(`/api/collaborations/${reviewModal.collaborationId}/review`, {
        method: "POST",
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() }),
      });
      setReviewModal(null);
      setReviewComment("");
      setReviewRating(5);
      setNotice("Review saved.");
      await queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function act(path: string, body?: unknown) {
    setNotice(null);
    try {
      await api(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      await queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      await queryClient.invalidateQueries({ queryKey: ["brand-campaigns"] });
      setNotice(path.endsWith("/publish") ? "Campaign published." : "Saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update the campaign");
    }
  }

  async function confirmDelete(campaign: Campaign) {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
      setDeletingCampaign(null);
      await queryClient.invalidateQueries({ queryKey: ["brand-campaigns"] });
      navigate("/brand/campaigns");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete campaign");
    } finally {
      setDeleting(false);
    }
  }

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) return <ErrorState message="Could not load this campaign." />;
  const campaign = query.data.campaign;
  const visibleCollaborations = (campaign.collaborations ?? []).filter(
    (c) => !["APPLIED", "INVITED", "REJECTED", "WITHDRAWN", "EXPIRED"].includes(c.status),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {campaign.referenceNumber != null && (
            <p className="font-mono text-xs font-semibold text-amber-800">
              {formatReferenceNumber("campaign", campaign.referenceNumber)}
            </p>
          )}
          <h1 className="text-3xl font-medium">{campaign.title}</h1>
          <p className="text-muted">{campaign.productName} · {campaign.campaignType.toLowerCase()} · {priceRangeLabel(campaign.priceRange, campaign.estimatedPrice)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={campaign.status} />
          <div className="flex items-center gap-1 pl-2 border-l border-line/60">
            <ShareButton
              size="sm"
              variant="ghost"
              url={`${typeof window !== "undefined" ? window.location.origin : ""}/brand/campaigns/${campaign.id}`}
              title={`ChooseYourCreator Campaign: ${campaign.title}`}
            />
            <button
              type="button"
              onClick={() => setEditingCampaign(campaign)}
              className="rounded-lg p-1.5 text-muted hover:bg-soft hover:text-ink transition-colors cursor-pointer"
              title="Edit campaign"
            >
              <Edit size={16} />
            </button>
            <button
              type="button"
              onClick={() => setDeletingCampaign(campaign)}
              className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
              title="Delete campaign"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
      <Notice message={notice} />

      {/* Campaign Details Card */}
      <Card>
        <h2 className="text-lg font-medium">Campaign Details</h2>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="font-medium text-muted">Description</p>
            <p className="mt-1 whitespace-pre-wrap">{campaign.description}</p>
          </div>
          <div>
            <p className="font-medium text-muted">Product & Details</p>
            <p className="mt-1 font-medium">{campaign.productName}</p>
            <p className="text-muted whitespace-pre-wrap">{campaign.productDetails}</p>
          </div>
          <div>
            <p className="font-medium text-muted">Platforms & Slots</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                campaign.creatorSlots > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${campaign.creatorSlots > 0 ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                {campaign.creatorSlots > 0 ? `${campaign.creatorSlots} open slots` : "All slots filled"}
              </span>
              <span className="text-muted text-xs">· {(campaign.platforms?.length ? campaign.platforms.join(", ") : campaign.platform)}</span>
            </div>
          </div>
          <div>
            <p className="font-medium text-muted">Estimated Budget</p>
            <p className="mt-1 font-medium">{priceRangeLabel(campaign.priceRange, campaign.estimatedPrice)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="font-medium text-muted">Deliverables</p>
            <p className="mt-1 whitespace-pre-wrap">{campaign.deliverables}</p>
          </div>
          <div className="md:col-span-2">
            <p className="font-medium text-muted">Requirements</p>
            <p className="mt-1 whitespace-pre-wrap">{campaign.requirements}</p>
          </div>
          {campaign.instructions ? (
            <div className="md:col-span-2">
              <p className="font-medium text-muted">Additional Instructions</p>
              <p className="mt-1 whitespace-pre-wrap">{campaign.instructions}</p>
            </div>
          ) : null}
          {campaign.performanceTerms ? (
            <div className="md:col-span-2 rounded-xl bg-soft/50 p-3">
              <p className="font-medium text-muted">Performance Payment Guidelines</p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{campaign.performanceTerms}</p>
            </div>
          ) : null}
        </div>
      </Card>

      <div className="flex gap-3">
        {campaign.status === "DRAFT" || campaign.status === "EXPIRED" ? <Button type="button" onClick={() => void act(`/api/campaigns/${campaign.id}/publish`)}>Publish</Button> : null}
        {campaign.status === "DRAFT" || campaign.status === "OPEN" ? <Button type="button" variant="secondary" onClick={() => void act(`/api/campaigns/${campaign.id}/cancel`)}>Cancel</Button> : null}
      </div>

      {/* Applications */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Applications</h2>
        {(campaign.applications ?? []).length === 0 ? <EmptyState title="No applications yet." /> : null}
        {(campaign.applications ?? []).map((application) => {
          const creator = application.creator;
          return (
            <Card key={application.id} className="space-y-3">
              <div className="flex items-start justify-between gap-4 border-b border-line/50 pb-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar name={creator.name} image={creator.profileImage} size="h-14 w-14" />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{creator.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {creator.city ? <span className="inline-flex items-center gap-0.5">📍 {creator.city}</span> : null}
                      {creator.niche ? (
                        <span className="rounded-full border border-line bg-soft/50 px-2 py-0.5 text-ink">{creator.niche}</span>
                      ) : null}
                      {creator.totalFollowers > 0 ? (
                        <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] font-medium">
                          {followerEstimateLabel(undefined, creator.totalFollowers)} followers
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusPill status={application.status} />
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs !py-1 !px-2.5"
                    onClick={() => setSelectedCreator(creatorToModalView(creator))}
                  >
                    View profile
                  </Button>
                </div>
              </div>

              {/* Bio */}
              {creator.bio ? (
                <p className="mt-3 text-sm text-muted line-clamp-2">{creator.bio}</p>
              ) : null}

              {/* Application message */}
              {application.message ? (
                <div className="mt-3 rounded-2xl bg-soft/60 p-3 text-sm">
                  <p className="font-medium text-muted text-xs mb-1">Application message</p>
                  <p className="whitespace-pre-wrap">{application.message}</p>
                </div>
              ) : null}

              {/* Social platforms & followers */}
              {(creator.socialPlatforms ?? []).length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {creator.socialPlatforms.map((platform) => {
                    const count = (creator.followerCounts as Record<string, number>)?.[platform];
                    const link = (creator.socialLinks as Record<string, string>)?.[platform];
                    return (
                      <a
                        key={platform}
                        href={link || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs ${link ? "hover:bg-soft cursor-pointer" : "cursor-default"}`}
                      >
                        <span className="font-medium">{platform}</span>
                        {count != null ? (
                          <span className="text-muted">{followerEstimateLabel(undefined, count)}</span>
                        ) : null}
                      </a>
                    );
                  })}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {application.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <Button onClick={() => void api(`/api/applications/${application.id}`, { method: "PUT", body: JSON.stringify({ status: "ACCEPTED" }) }).then(() => queryClient.invalidateQueries({ queryKey: ["campaign", id] })).catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Could not accept"))}>Accept</Button>
                    <Button variant="secondary" onClick={() => void api(`/api/applications/${application.id}`, { method: "PUT", body: JSON.stringify({ status: "REJECTED" }) }).then(() => queryClient.invalidateQueries({ queryKey: ["campaign", id] }))}>Reject</Button>
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })}
      </section>


      {/* Active Collaborations — with Message button */}
      {visibleCollaborations.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-medium">Collaborations</h2>
          <p className="text-sm text-muted -mt-1">Creators appear here after you accept their application or invitation.</p>
          {visibleCollaborations.map((collab) => (
            <Card key={collab.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{collab.creator.name}</p>
                    <VerifiedBadge isVerified={collab.creator.isVerified} size="sm" />
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs !py-0 !px-1.5 h-auto underline"
                      onClick={() => setSelectedCreator(creatorToModalView(collab.creator))}
                    >
                      View profile
                    </Button>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusPill status={collab.status} />
                    {collab.creator.totalFollowers > 0 ? (
                      <span className="text-xs text-muted">
                        {followerEstimateLabel(undefined, collab.creator.totalFollowers)} followers
                      </span>
                    ) : null}
                    {collab.status === "AGREEMENT_PENDING" ? (
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Agreement needed — click Message to create
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {collab.agreement ? (
                    <a
                      href={apiUrl(`/api/agreements/${collab.agreement.id}/pdf`)}
                      className="text-sm underline text-muted hover:text-ink mr-2"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Agreement PDF
                    </a>
                  ) : null}
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const res = await api<{ conversationId: string }>("/api/conversations/find-or-create", {
                          method: "POST",
                          body: JSON.stringify({ campaignId: campaign.id, creatorId: collab.creatorId }),
                        });
                        navigate(`/brand/messages/${res.conversationId}`);
                      } catch {
                        navigate("/brand/messages");
                      }
                    }}
                  >
                    {collab.status === "AGREEMENT_PENDING" ? "Message & Create Agreement" : "Message"}
                  </Button>
                </div>
              </div>
              {collab.status === "COMPLETED" ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
                  {collab.review ? (
                    <p className="text-sm text-muted">
                      Your rating: <span className="text-ink font-medium">{"★".repeat(collab.review.rating)}{"☆".repeat(5 - collab.review.rating)}</span>
                      {collab.review.comment ? <span className="ml-2">— {collab.review.comment}</span> : null}
                    </p>
                  ) : (
                    <Button
                      variant="secondary"
                      className="text-xs"
                      onClick={() => setReviewModal({ collaborationId: collab.id, creatorName: collab.creator.name })}
                    >
                      Rate this creator
                    </Button>
                  )}
                </div>
              ) : null}
            </Card>
          ))}
        </section>
      ) : null}

      {/* Submissions */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium">Submissions</h2>
        {(campaign.collaborations ?? []).flatMap((item) => item.submissions ?? []).length === 0 ? <EmptyState title="No submissions yet." /> : null}
        {(campaign.collaborations ?? []).flatMap((item) => (item.submissions ?? []).map((submission) => ({ ...submission, creatorName: item.creator.name }))).map((submission) => (
          <Card key={submission.id}>
            <div className="flex items-center justify-between">
              <p className="font-medium">{submission.creatorName}</p>
              <StatusPill status={submission.status} />
            </div>
            {submission.socialUrl ? <a className="mt-2 block text-sm underline" href={submission.socialUrl} target="_blank" rel="noreferrer">{submission.socialUrl}</a> : null}
            {submission.contentKey ? <a className="mt-2 block text-sm underline" href={apiUrl(`/api/files/${submission.contentKey}`)}>View file</a> : null}
            <p className="mt-2 text-sm text-muted">{submission.notes}</p>
            {submission.status === "CHANGES_REQUESTED" && submission.changeRequestReason ? (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs font-medium text-amber-700 mb-1">Change request reason</p>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{submission.changeRequestReason}</p>
              </div>
            ) : null}
            {submission.status === "SUBMITTED" ? (
              <div className="mt-4 flex gap-2">
                <Button onClick={() => void api(`/api/submissions/${submission.id}/review`, { method: "POST", body: JSON.stringify({ decision: "APPROVED" }) }).then(() => queryClient.invalidateQueries({ queryKey: ["campaign", id] }))}>Approve</Button>
                <Button variant="secondary" onClick={() => { setChangeReason(""); setChangeReasonModal({ submissionId: submission.id }); }}>Request changes</Button>
              </div>
            ) : null}
          </Card>
        ))}
        {/* Change Request Reason Modal */}
        {changeReasonModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={(e) => { if (e.target === e.currentTarget) setChangeReasonModal(null); }}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-medium mb-2">Request content changes</h3>
              <p className="text-sm text-muted mb-4">Tell the creator what needs to be changed. They will see this reason.</p>
              <textarea
                className="w-full rounded-xl border border-line p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-ink/20"
                placeholder="e.g. Please include the product code and remove the background music..."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
              />
              <div className="mt-4 flex gap-3">
                <Button onClick={() => void (async () => {
                  await api(`/api/submissions/${changeReasonModal.submissionId}/review`, {
                    method: "POST",
                    body: JSON.stringify({ decision: "CHANGES_REQUESTED", changeRequestReason: changeReason.trim() || undefined }),
                  });
                  setChangeReasonModal(null);
                  await queryClient.invalidateQueries({ queryKey: ["campaign", id] });
                })()}>Send request</Button>
                <Button variant="secondary" onClick={() => setChangeReasonModal(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {selectedCreator ? (
        <ProfileDetailsModal
          type="CREATOR"
          creator={selectedCreator}
          onClose={() => setSelectedCreator(null)}
        />
      ) : null}

      {reviewModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs" onClick={(e) => { if (e.target === e.currentTarget && !reviewSubmitting) setReviewModal(null); }}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-medium">Rate {reviewModal.creatorName}</h3>
            <p className="text-sm text-muted">Share how this collaboration went (visible only to your brand).</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`text-2xl cursor-pointer ${star <= reviewRating ? "text-amber-500" : "text-line"}`}
                  onClick={() => setReviewRating(star)}
                  aria-label={`${star} stars`}
                >
                  ★
                </button>
              ))}
            </div>
            <Field label="Comments (optional)">
              <TextArea rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="What went well?" />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReviewModal(null)} disabled={reviewSubmitting}>Cancel</Button>
              <Button onClick={() => void submitReview()} disabled={reviewSubmitting}>
                {reviewSubmitting ? "Saving…" : "Submit review"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <EditCampaignModal
          campaign={editingCampaign}
          isOpen={Boolean(editingCampaign)}
          onClose={() => setEditingCampaign(null)}
          onSuccess={() => void query.refetch()}
        />
      )}

      {/* Delete Campaign Confirmation Modal */}
      {deletingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-medium text-ink">Delete Campaign</h3>
            <Notice message={deleteError} />
            <p className="text-sm text-muted">
              Are you sure you want to delete <span className="font-semibold text-ink">&quot;{deletingCampaign.title}&quot;</span>? This will permanently remove the campaign and any pending creator applications.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setDeletingCampaign(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => void confirmDelete(deletingCampaign)}
                disabled={deleting}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                {deleting ? "Deleting..." : "Delete Campaign"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type CampaignPaymentGroup = {
  key: string;
  campaignId: string;
  campaignTitle: string;
  campaignStatus: string;
  campaignEndDate?: string | null;
  creatorId: string;
  creatorName: string;
  agreementId?: string | null;
  performanceTiers?: Array<{ views: number; amount: number; label?: string }>;
  agreementStatus?: string | null;
  collaborationStatus?: string | null;
  collaborationId?: string | null;
  hasReviewed?: boolean;
  initialPayment?: Payment;
  performancePayment?: Payment;
  totalAgreed: number;
  createdAt: string;
};

export function BrandPayments() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["payments"], queryFn: () => api<{ payments: Payment[] }>("/api/payments") });
  const [notice, setNotice] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [payPromptPayment, setPayPromptPayment] = useState<Payment | null>(null);
  const [releaseConfirmPayment, setReleaseConfirmPayment] = useState<Payment | null>(null);
  const [reviewModal, setReviewModal] = useState<{ collaborationId: string; creatorName: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const pageSize = 6;

  function toggleExpand(key: string) {
    setExpandedCampaigns((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function submitOfflinePay(payment: Payment, offlineRef: string) {
    if (!offlineRef || !offlineRef.trim()) return;

    setNotice(null);
    setPayingId(payment.id);
    try {
      await api<{ payment: Payment; message?: string }>("/api/payments/initial", {
        method: "POST",
        body: JSON.stringify({ paymentId: payment.id, offlineReference: offlineRef.trim() }),
      });
      setPayPromptPayment(null);
      setNotice(`Payment reference recorded. Admin has been notified to verify your offline deposit.`);
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Payment processing failed");
    } finally {
      setPayingId(null);
    }
  }

  async function submitAuthorizeRelease(payment: Payment) {
    setNotice(null);
    setReleasingId(payment.id);
    try {
      await api(`/api/payments/${payment.id}/release`, { method: "POST" });
      setReleaseConfirmPayment(null);
      setNotice(`Release authorized! Admin will now disburse ${formatInr(payment.amount)} directly to the creator.`);
      await queryClient.invalidateQueries({ queryKey: ["payments"] });

      if (payment.collaborationId && !payment.hasReviewed) {
        setReviewModal({
          collaborationId: payment.collaborationId,
          creatorName: payment.creatorName || "the creator",
        });
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not release payment");
    } finally {
      setReleasingId(null);
    }
  }

  async function submitReview() {
    if (!reviewModal) return;
    setReviewSubmitting(true);
    setNotice(null);
    try {
      await api(`/api/collaborations/${reviewModal.collaborationId}/review`, {
        method: "POST",
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim() }),
      });
      setReviewModal(null);
      setReviewComment("");
      setReviewRating(5);
      setNotice("Review submitted successfully! It will now appear on the creator's profile.");
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not submit review");
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (query.isLoading) return <Spinner />;
  if (query.isError) return <ErrorState message="Could not load payments." onRetry={() => void query.refetch()} />;

  const payments = query.data?.payments ?? [];
  const campaignMap = new Map<string, CampaignPaymentGroup>();

  for (const payment of payments) {
    const cId = payment.campaignId || payment.campaign?.id || "campaign";
    const groupKey = `${cId}_${payment.creatorId}`;
    const existing = campaignMap.get(groupKey);

    const group: CampaignPaymentGroup = existing ?? {
      key: groupKey,
      campaignId: cId,
      campaignTitle: payment.campaign?.title ?? "Campaign",
      campaignStatus: payment.campaign?.status ?? "ACTIVE",
      campaignEndDate: payment.campaign?.endDate,
      creatorId: payment.creatorId,
      creatorName: payment.creatorName || "Creator",
      agreementId: payment.agreementId ?? null,
      performanceTiers: payment.performanceTiers ?? [],
      agreementStatus: payment.agreementStatus,
      collaborationStatus: payment.collaborationStatus,
      totalAgreed: 0,
      createdAt: payment.createdAt,
    };

    if (payment.type === "INITIAL_HELD") {
      group.initialPayment = payment;
      group.totalAgreed += payment.amount;
    } else if (payment.type === "PERFORMANCE_DIRECT") {
      group.performancePayment = payment;
      group.totalAgreed += payment.amount;
    } else {
      group.totalAgreed += payment.amount;
    }

    if (payment.agreementId) group.agreementId = payment.agreementId;
    if (payment.performanceTiers && payment.performanceTiers.length > 0) group.performanceTiers = payment.performanceTiers;
    if (payment.agreementStatus) group.agreementStatus = payment.agreementStatus;
    if (payment.collaborationStatus) group.collaborationStatus = payment.collaborationStatus;
    if (payment.collaborationId) group.collaborationId = payment.collaborationId;
    if (payment.hasReviewed !== undefined) group.hasReviewed = payment.hasReviewed;
    if (payment.creatorName) group.creatorName = payment.creatorName;

    campaignMap.set(groupKey, group);
  }

  const campaignGroups = Array.from(campaignMap.values());
  const totalPages = Math.max(1, Math.ceil(campaignGroups.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedGroups = campaignGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium">Payments</h1>
        <p className="mt-1 text-sm text-muted">
          Manage secured escrow holdings and fund disbursements organized by campaign.
        </p>
      </div>

      {/* GPay / Offline Payment Info Banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-amber-900">📱 Offline Payment Details</p>
          <p className="text-xs text-amber-800">
            Transfer your campaign payment to this account, then click "Pay Now" and enter your UPI reference number.
          </p>
          <div className="mt-2 grid gap-1 text-xs font-mono text-amber-950">
            <span>GPay / UPI: <strong>+91 81297 47764</strong></span>
            <span>Account Name: <strong>Najmudheen PK</strong></span>
          </div>
        </div>
      </div>

      <Notice message={notice} />

      {campaignGroups.length === 0 ? (
        <EmptyState
          title="No payment records yet."
          body="When you sign campaign agreements with creators, payment escrow records will appear here organized by campaign."
        />
      ) : (
        <div className="space-y-4">
          {paginatedGroups.map((group) => {
            const isExpanded = expandedCampaigns[group.key] ?? true;
            const init = group.initialPayment;

            const effectiveAgreement = resolveEffectiveAgreementStatus({
              agreementStatus: group.agreementStatus,
              collaborationStatus: group.collaborationStatus,
              initialPaymentStatus: init?.initialStatus,
              campaignStatus: group.campaignStatus,
              campaignEndDate: group.campaignEndDate,
            });
            const agreementMeta = effectiveAgreementStatusMeta(effectiveAgreement);

            let summaryLabel = "Pending";
            let summaryClass = "bg-neutral-100 text-neutral-700 border-neutral-300";
            if (init?.initialStatus === "RELEASED") {
              summaryLabel = "Released";
              summaryClass = "bg-emerald-50 text-emerald-800 border-emerald-300";
            } else if (init?.initialStatus === "RELEASE_REQUESTED") {
              summaryLabel = "Release requested";
              summaryClass = "bg-amber-50 text-amber-800 border-amber-300";
            } else if (init?.initialStatus === "HELD") {
              summaryLabel = "Secured in holding";
              summaryClass = "bg-emerald-50 text-emerald-800 border-emerald-300";
            } else if (init?.initialStatus === "PENDING") {
              summaryLabel = "Awaiting deposit";
              summaryClass = "bg-amber-50 text-amber-800 border-amber-300";
            } else if (init?.initialStatus === "REFUNDED") {
              summaryLabel = "Refunded";
              summaryClass = "bg-rose-50 text-rose-800 border-rose-300";
            }

            return (
              <Card key={group.key} className="space-y-4">
                {/* Campaign Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-medium">{group.campaignTitle}</h2>
                      <StatusPill status={group.campaignStatus} />
                    </div>
                    <p className="text-sm text-muted">
                      Creator: <Link to={`/brand/creators/${group.creatorId}`} className="font-medium text-ink underline hover:opacity-80">{group.creatorName}</Link>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Agreement Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${agreementMeta.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${agreementMeta.dotClass}`} />
                      <span>Agreement: {agreementMeta.label}</span>
                    </span>

                    {/* Overall Payment Summary */}
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${summaryClass}`}>
                      {summaryLabel}
                    </span>
                  </div>
                </div>

                {/* Summary Figures & Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div>
                    <span className="text-xs text-muted">Agreed Initial Collaboration Escrow:</span>
                    <p className="text-xl font-semibold text-ink">{formatInr(init?.amount ?? 0)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(group.key)}
                    className="text-xs font-medium text-ink underline hover:opacity-75 cursor-pointer"
                  >
                    {isExpanded ? "Hide payment breakdown ↑" : "View payment breakdown ↓"}
                  </button>
                </div>

                {/* Expanded Payment Details Section */}
                {isExpanded ? (
                  <div className="space-y-3 border-t border-line pt-4">
                    {/* Item 1: Initial Payment (Held by Platform) */}
                    {init ? (
                      <div className="rounded-xl border border-line p-4 space-y-3 bg-neutral-50/50">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">1. Initial Payment (ChooseYourCreator Holding)</span>
                              <StatusPill status={init.initialStatus || init.type} />
                            </div>
                            <p className="mt-0.5 text-xs text-muted">
                              Agreed initial fee deposited by brand into secure escrow before work starts.
                            </p>
                          </div>
                          <span className="text-base font-semibold">{formatInr(init.amount)}</span>
                        </div>

                        <div className="pt-1">
                          {init.initialStatus === "PENDING" || init.initialStatus === "FAILED" ? (
                            <div className="space-y-2">
                              <p className="text-xs text-muted">
                                Transfer {formatInr(init.amount)} directly to escrow account outside the platform, then mark as paid with your transaction reference.
                              </p>
                              <Button
                                onClick={() => setPayPromptPayment(init)}
                                disabled={payingId === init.id}
                              >
                                {payingId === init.id ? "Recording payment..." : `Mark Paid Outside Platform (${formatInr(init.amount)})`}
                              </Button>
                            </div>
                          ) : null}

                          {init.initialStatus === "PAYMENT_SUBMITTED" ? (
                            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
                              <p className="font-semibold">⏳ Awaiting Admin Verification</p>
                              <p>You marked this payment as transferred offline. Admin will verify the deposit to secure it in escrow.</p>
                            </div>
                          ) : null}

                          {init.initialStatus === "HELD" ? (
                            <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-3 text-xs text-emerald-900 space-y-1">
                              <p className="font-semibold">✓ Funds Secured in Escrow</p>
                              <p>Verified by admin. Creator can request release after their submission is approved.</p>
                            </div>
                          ) : null}

                          {init.initialStatus === "RELEASE_REQUESTED" ? (
                            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                              <p className="text-xs text-amber-900 font-medium">
                                Creator has requested release of {formatInr(init.amount)}. Content submission is approved.
                              </p>
                              <Button
                                onClick={() => setReleaseConfirmPayment(init)}
                                disabled={releasingId === init.id}
                              >
                                {releasingId === init.id ? "Authorizing..." : `Approve & Authorize Admin Payout (${formatInr(init.amount)})`}
                              </Button>
                            </div>
                          ) : null}

                          {init.initialStatus === "RELEASE_AUTHORIZED" ? (
                            <div className="rounded-lg border border-purple-300 bg-purple-50 p-3 text-xs text-purple-900 space-y-1">
                              <p className="font-semibold">✓ Release Authorized by Brand</p>
                              <p>Admin has been instructed to manually disburse {formatInr(init.amount)} to the creator.</p>
                            </div>
                          ) : null}

                          {init.initialStatus === "RELEASED" ? (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800">
                              ✓ Funds released to creator on {formatDate(init.createdAt)}.
                            </div>
                          ) : null}

                          {(init.initialStatus === "RELEASED" || init.initialStatus === "RELEASE_AUTHORIZED") && group.collaborationId && !group.hasReviewed ? (
                            <div className="pt-2">
                              <Button
                                variant="secondary"
                                className="text-xs inline-flex items-center gap-1.5 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                onClick={() => setReviewModal({ collaborationId: group.collaborationId!, creatorName: group.creatorName })}
                              >
                                <span>★</span>
                                <span>Rate & Review {group.creatorName}</span>
                              </Button>
                            </div>
                          ) : group.hasReviewed ? (
                            <p className="pt-1 text-xs text-emerald-700 font-medium">✓ You submitted a review for this creator</p>
                          ) : null}

                          {init.initialStatus === "REFUNDED" ? (
                            <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-800">
                              Payment was refunded.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            );
          })}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Offline Escrow Payment Reference Modal */}
      <PromptModal
        isOpen={Boolean(payPromptPayment)}
        title="Submit Offline Escrow Deposit"
        description={
          payPromptPayment
            ? `Please transfer ${formatInr(payPromptPayment.amount)} to the account below, then enter your transaction reference (UPI UTR or Bank transfer ref). Admin will verify the deposit and secure it in Escrow.\n\n📱 GPay / UPI: +91 81297 47764\n👤 Account Name: Najmudheen PK`
            : ""
        }
        label="Payment Reference / UPI UTR"
        placeholder="e.g. 408219481029 or UPI-TXNID"
        submitText="Submit Reference"
        loading={payingId !== null}
        onCancel={() => setPayPromptPayment(null)}
        onSubmit={(val) => {
          if (payPromptPayment) void submitOfflinePay(payPromptPayment, val);
        }}
      />

      {/* Authorize Fund Release Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(releaseConfirmPayment)}
        title="Authorize Fund Release"
        message={
          releaseConfirmPayment
            ? `Approve content deliverables and authorize Admin to disburse ${formatInr(releaseConfirmPayment.amount)} directly to ${releaseConfirmPayment.creatorName || "the creator"}?`
            : ""
        }
        confirmText="Authorize Release"
        variant="primary"
        loading={releasingId !== null}
        onCancel={() => setReleaseConfirmPayment(null)}
        onConfirm={() => {
          if (releaseConfirmPayment) void submitAuthorizeRelease(releaseConfirmPayment);
        }}
      />

      {/* Creator Review Modal */}
      {reviewModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">Rate & Review {reviewModal.creatorName}</h3>
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="text-muted hover:text-ink cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-muted">
              Share your experience collaborating with {reviewModal.creatorName}. Your review will be featured on their public profile!
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Rating</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 text-2xl transition hover:scale-110 cursor-pointer"
                  >
                    <span className={star <= reviewRating ? "text-amber-500" : "text-neutral-300"}>★</span>
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-ink">{reviewRating} / 5 stars</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-ink">Review Comment</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Write a few words about their communication, content quality, and delivery..."
                rows={3}
                className="w-full rounded-xl border border-line p-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-ink"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setReviewModal(null)} disabled={reviewSubmitting}>
                Skip for now
              </Button>
              <Button variant="primary" onClick={submitReview} disabled={reviewSubmitting}>
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


export function BrandProfilePage() {
  const { refresh } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["brand-profile"],
    queryFn: () =>
      api<{
        profile: {
          companyName: string;
          websiteUrl?: string;
          niche: string;
          employeeSize: string;
          role: string;
          businessDescription: string;
          socialLinks: Record<string, string>;
          companyLogo?: string | null;
          bannerImage?: string | null;
        };
      }>("/api/brand/profile"),
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [logoCropFile, setLogoCropFile] = useState<File | null>(null);
  const [logoCropOpen, setLogoCropOpen] = useState(false);

  async function uploadImage(file: File, endpoint: string, setter: (v: boolean) => void) {
    setter(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api(endpoint, { method: "POST", body: formData });
      await queryClient.invalidateQueries({ queryKey: ["brand-profile"] });
      await refresh();
      setNotice("Image updated.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setter(false);
    }
  }

  if (query.isLoading) return <Spinner />;
  if (!query.data?.profile) return <ErrorState message="Profile not found." />;
  const profile = query.data.profile;

  if (!editing) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Cover Banner */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border border-line" style={{ height: 180 }}>
          {profile.bannerImage ? (
            <img src={apiUrl(`/api/files/${profile.bannerImage}`)} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted text-sm select-none">
              <Sparkles size={18} className="mr-2 opacity-40" /> No cover banner — upload one below
            </div>
          )}
          <label className="absolute bottom-3 right-3 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white hover:bg-black/80 transition-colors">
            {uploadingBanner ? "Uploading…" : (<><Camera size={12} /> Change banner</>)}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploadingBanner}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadImage(file, "/api/brand/banner", setUploadingBanner);
              }}
            />
          </label>
        </div>

        {/* Logo + Name row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                name={profile.companyName}
                image={profile.companyLogo ? apiUrl(`/api/files/${profile.companyLogo}`) : undefined}
                size="h-16 w-16"
              />
              <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-ink text-white shadow hover:opacity-80 transition-opacity">
                {uploadingLogo ? "…" : <Camera size={12} />}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploadingLogo}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) {
                      setLogoCropFile(file);
                      setLogoCropOpen(true);
                    }
                  }}
                />
              </label>
            </div>
            <div>
              <h1 className="text-3xl font-medium">{profile.companyName}</h1>
              <p className="text-muted">{profile.niche} · {profile.employeeSize} people · {profile.role}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
        </div>

        <Notice message={notice} />
        <p className="max-w-xl leading-7">{profile.businessDescription}</p>
        {profile.websiteUrl ? (
          <a href={profile.websiteUrl} target="_blank" rel="noreferrer" className="text-sm underline text-muted hover:text-ink">
            {profile.websiteUrl}
          </a>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-3">
          {(["instagram", "youtube", "facebook"] as const)
            .filter((key) => profile.socialLinks?.[key])
            .map((key) => (
              <Card key={key}>
                <a className="text-sm underline" href={profile.socialLinks[key]} target="_blank" rel="noreferrer">
                  {key === "instagram" ? "Instagram" : key === "youtube" ? "YouTube" : "Facebook"}
                </a>
              </Card>
            ))}
        </div>
        <ImageCropModal
          open={logoCropOpen}
          file={logoCropFile}
          title="Crop company logo"
          aspect={1}
          outputSize={{ width: 512, height: 512 }}
          onClose={() => {
            setLogoCropOpen(false);
            setLogoCropFile(null);
          }}
          onConfirm={(file) => void uploadImage(file, "/api/brand/logo", setUploadingLogo)}
        />
      </div>
    );
  }
  return (
    <ProfileEditor
      title="Edit brand profile"
      initial={profile}
      notice={notice}
      onCancel={() => setEditing(false)}
      onSave={async (body) => {
        await api("/api/brand/profile", { method: "PUT", body: JSON.stringify(body) });
        await refresh();
        await query.refetch();
        setNotice("Profile updated.");
        setEditing(false);
      }}
    />
  );
}

function ProfileEditor({
  title,
  initial,
  notice,
  onSave,
  onCancel,
}: {
  title: string;
  initial: { companyName: string; websiteUrl?: string | null; niche: string; employeeSize: string; role: string; businessDescription: string; socialLinks: Record<string, string> };
  notice: string | null;
  onSave: (body: unknown) => Promise<void>;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    companyName: initial.companyName,
    websiteUrl: initial.websiteUrl ?? "",
    niche: initial.niche,
    employeeSize: initial.employeeSize,
    role: initial.role,
    businessDescription: initial.businessDescription,
    instagram: initial.socialLinks?.instagram ?? "",
    youtube: initial.socialLinks?.youtube ?? "",
    facebook: initial.socialLinks?.facebook ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.companyName.trim()) errors.companyName = "Please enter your company name.";
    if (!form.niche.trim()) errors.niche = "Please select your business niche.";
    if (!form.businessDescription.trim()) errors.businessDescription = "Please add a short description.";
    if (form.websiteUrl.trim()) {
      try {
        const u = new URL(form.websiteUrl.trim());
        if (!["http:", "https:"].includes(u.protocol)) {
          errors.websiteUrl = "Enter a valid website URL or leave this field empty.";
        }
      } catch {
        errors.websiteUrl = "Enter a valid website URL or leave this field empty.";
      }
    }
    const hasSocial = Boolean(form.instagram.trim() || form.youtube.trim() || form.facebook.trim());
    if (!hasSocial) {
      errors.social = "Add at least one social media profile link.";
    } else {
      if (form.instagram.trim()) {
        try {
          const u = new URL(form.instagram.trim());
          if (u.hostname.replace(/^www\./, "").toLowerCase() !== "instagram.com") {
            errors.instagram = "Enter a valid Instagram profile URL.";
          }
        } catch {
          errors.instagram = "Enter a valid Instagram profile URL.";
        }
      }
      if (form.youtube.trim()) {
        try {
          const u = new URL(form.youtube.trim());
          const h = u.hostname.replace(/^www\./, "").toLowerCase();
          if (h !== "youtube.com" && h !== "youtu.be") {
            errors.youtube = "Enter a valid YouTube profile URL.";
          }
        } catch {
          errors.youtube = "Enter a valid YouTube profile URL.";
        }
      }
      if (form.facebook.trim()) {
        try {
          const u = new URL(form.facebook.trim());
          const h = u.hostname.replace(/^www\./, "").toLowerCase();
          if (h !== "facebook.com" && h !== "fb.com" && h !== "m.facebook.com") {
            errors.facebook = "Enter a valid Facebook profile URL.";
          }
        } catch {
          errors.facebook = "Enter a valid Facebook profile URL.";
        }
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  return (
    <form
      className="mx-auto max-w-xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        if (!validate()) return;
        void onSave({
          companyName: form.companyName.trim(),
          websiteUrl: form.websiteUrl.trim() || undefined,
          niche: form.niche,
          employeeSize: form.employeeSize,
          role: form.role,
          businessDescription: form.businessDescription.trim(),
          socialLinks: {
            ...initial.socialLinks,
            instagram: form.instagram.trim() || undefined,
            youtube: form.youtube.trim() || undefined,
            facebook: form.facebook.trim() || undefined,
          },
        }).catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not save"));
      }}
    >
      <h1 className="text-3xl font-medium">{title}</h1>
      <Notice message={error || notice} />
      <div>
        <Field label="Company name *">
          <TextInput
            value={form.companyName}
            onChange={(event) => {
              setForm({ ...form, companyName: event.target.value });
              if (fieldErrors.companyName) setFieldErrors({ ...fieldErrors, companyName: "" });
            }}
            required
          />
        </Field>
        {fieldErrors.companyName ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.companyName}</p>
        ) : null}
      </div>
      <div>
        <Field label="Website (Optional)">
          <TextInput
            placeholder="https://example.com"
            value={form.websiteUrl}
            onChange={(event) => {
              setForm({ ...form, websiteUrl: event.target.value });
              if (fieldErrors.websiteUrl) setFieldErrors({ ...fieldErrors, websiteUrl: "" });
            }}
          />
        </Field>
        {fieldErrors.websiteUrl ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.websiteUrl}</p>
        ) : null}
      </div>
      <div>
        <Field label="Niche *">
          <SelectInput
            value={form.niche}
            onChange={(event) => setForm({ ...form, niche: event.target.value })}
          >
            {NICHES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </SelectInput>
        </Field>
        {fieldErrors.niche ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.niche}</p>
        ) : null}
      </div>
      <Field label="Company size">
        <SelectInput
          value={form.employeeSize}
          onChange={(event) => setForm({ ...form, employeeSize: event.target.value })}
        >
          {EMPLOYEE_SIZES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Role">
        <SelectInput value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
          {BRAND_ROLES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </SelectInput>
      </Field>
      <div>
        <Field label="Description *">
          <TextArea
            value={form.businessDescription}
            onChange={(event) => {
              setForm({ ...form, businessDescription: event.target.value });
              if (fieldErrors.businessDescription) setFieldErrors({ ...fieldErrors, businessDescription: "" });
            }}
            required
          />
        </Field>
        {fieldErrors.businessDescription ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.businessDescription}</p>
        ) : null}
      </div>
      {fieldErrors.social ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 font-medium">
          {fieldErrors.social}
        </p>
      ) : null}
      <div>
        <Field label="Instagram profile link">
          <TextInput
            placeholder="https://instagram.com/yourbrand"
            value={form.instagram}
            onChange={(event) => {
              setForm({ ...form, instagram: event.target.value });
              if (fieldErrors.instagram) setFieldErrors({ ...fieldErrors, instagram: "" });
              if (fieldErrors.social) setFieldErrors({ ...fieldErrors, social: "" });
            }}
          />
        </Field>
        {fieldErrors.instagram ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.instagram}</p>
        ) : null}
      </div>
      <div>
        <Field label="YouTube profile link">
          <TextInput
            placeholder="https://youtube.com/@yourbrand"
            value={form.youtube}
            onChange={(event) => {
              setForm({ ...form, youtube: event.target.value });
              if (fieldErrors.youtube) setFieldErrors({ ...fieldErrors, youtube: "" });
              if (fieldErrors.social) setFieldErrors({ ...fieldErrors, social: "" });
            }}
          />
        </Field>
        {fieldErrors.youtube ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.youtube}</p>
        ) : null}
      </div>
      <div>
        <Field label="Facebook profile link">
          <TextInput
            placeholder="https://facebook.com/yourbrand"
            value={form.facebook}
            onChange={(event) => {
              setForm({ ...form, facebook: event.target.value });
              if (fieldErrors.facebook) setFieldErrors({ ...fieldErrors, facebook: "" });
              if (fieldErrors.social) setFieldErrors({ ...fieldErrors, social: "" });
            }}
          />
        </Field>
        {fieldErrors.facebook ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.facebook}</p>
        ) : null}
      </div>
      <div className="flex gap-3">
        <Button type="submit">Save profile</Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
