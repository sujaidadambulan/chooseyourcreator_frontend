import {
  NICHES,
  PLATFORMS,
  PRICE_RANGES,
  effectiveAgreementStatusMeta,
  followerEstimateId,
  followerEstimateLabel,
  formatDate,
  formatInr,
  formatReferenceNumber,
  priceRangeLabel,
  resolveEffectiveAgreementStatus,
  statusLabel,
} from "../shared/index";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SocialAccounts, type SocialDraft } from "../components/SocialAccounts";
import { Avatar, Button, Card, ConfirmModal, EmptyState, ErrorState, Field, Notice, SelectInput, Spinner, StatusPill, TextArea, TextInput, Pagination } from "../components/ui";
import { api, apiUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { AgreementDocument, type FullAgreement } from "../components/AgreementDocument";
import { ProfileDetailsModal, type BrandDetailView, VerifiedBadge } from "../components/ProfileDetailsModal";
import { ImageCropModal } from "../components/ImageCropModal";
import { ShareButton } from "../components/ShareButton";
import { Camera } from "lucide-react";

type CampaignCard = {
  id: string;
  referenceNumber?: number;
  title: string;
  productName: string;
  niche: string;
  platform: string;
  platforms?: string[];
  priceRange?: string;
  estimatedPrice: number;
  description: string;
  hasApplied?: boolean;
  applicationStatus?: string | null;
  brand: {
    id?: string;
    companyName: string;
    companyLogo?: string | null;
    bannerImage?: string | null;
    websiteUrl?: string | null;
    niche?: string;
    businessDescription?: string;
    socialLinks?: Record<string, string>;
    isVerified?: boolean;
    employeeSize?: string;
    role?: string;
  };
};

function platformLabel(campaign: { platform: string; platforms?: string[] }) {
  return campaign.platforms?.length ? campaign.platforms.join(", ") : campaign.platform;
}

type CampaignDetail = CampaignCard & {
  productDetails: string;
  deliverables: string;
  requirements: string;
  instructions: string;
  performanceTerms: string;
  creatorSlots: number;
  platforms?: string[];
  priceRange?: string;
  status: string;
  campaignType: string;
  brand: {
    id?: string;
    companyName: string;
    companyLogo?: string | null;
    bannerImage?: string | null;
    businessDescription?: string;
    websiteUrl?: string | null;
    niche?: string;
    employeeSize?: string;
    role?: string;
    socialLinks?: Record<string, string>;
    isVerified?: boolean;
  };
  applications?: Array<{ id: string; status: string }>;
  invitations?: Array<{ id: string; status: string; message?: string | null }>;
  collaborations?: Array<{ id: string; status: string; agreement?: { id: string; status: string } | null }>;
};

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
  { to: "/creator", label: "Home" },
  { to: "/creator/messages", label: "Messages" },
  { to: "/creator/payments", label: "Payments" },
  { to: "/creator/work", label: "My Work" },
  { to: "/creator/profile", label: "Profile" },
];

const DRAFT_KEY = "cyc_creator_draft";

function emptySocial(): SocialDraft {
  return { platforms: [], links: {}, ranges: {} };
}

function socialFromProfile(profile: { socialPlatforms: string[]; socialLinks?: Record<string, string>; followerCounts?: Record<string, number>; followerRanges?: Record<string, string> }): SocialDraft {
  const platforms = profile.socialPlatforms.filter((item) => item !== "Other");
  const ranges: Record<string, string> = {};
  for (const platform of platforms) {
    ranges[platform] = profile.followerRanges?.[platform] || followerEstimateId(profile.followerCounts?.[platform]);
  }
  return { platforms, links: profile.socialLinks ?? {}, ranges };
}

function readDraft(): { form: { name: string; city: string; niche: string; bio: string }; social: SocialDraft } {
  const fallback = { form: { name: "", city: "", niche: "Lifestyle", bio: "" }, social: emptySocial() };
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { form?: typeof fallback.form; social?: SocialDraft };
    return {
      form: { ...fallback.form, ...parsed.form },
      social: { ...emptySocial(), ...parsed.social, ranges: parsed.social?.ranges ?? {} },
    };
  } catch {
    return fallback;
  }
}

function writeDraft(form: { name: string; city: string; niche: string; bio: string }, social: SocialDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, social }));
}

function validateCreatorInput(
  form: { name: string; city: string; niche: string; bio: string },
  social: SocialDraft
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Please enter your name.";
  if (!form.city.trim()) errors.city = "Please enter your city.";
  if (!form.niche.trim()) errors.niche = "Please select a niche.";
  if (!form.bio.trim()) errors.bio = "Please write a short bio.";

  const activePlatforms = social.platforms.filter((p) => p !== "Other");
  if (activePlatforms.length === 0) {
    errors.social = "Add at least one social media profile link.";
  } else {
    for (const p of activePlatforms) {
      const key = p.toLowerCase();
      const link = social.links[key]?.trim();
      if (!link) {
        errors[`social_${key}`] = "Add at least one social media profile link.";
      } else {
        try {
          const u = new URL(link);
          const h = u.hostname.replace(/^www\./, "").toLowerCase();
          if (p === "Instagram" && h !== "instagram.com") {
            errors[`social_${key}`] = "Enter a valid social media profile URL.";
          } else if (p === "YouTube" && h !== "youtube.com" && h !== "youtu.be") {
            errors[`social_${key}`] = "Enter a valid social media profile URL.";
          } else if (p === "Facebook" && h !== "facebook.com" && h !== "fb.com" && h !== "m.facebook.com") {
            errors[`social_${key}`] = "Enter a valid social media profile URL.";
          }
        } catch {
          errors[`social_${key}`] = "Enter a valid social media profile URL.";
        }
      }
    }
  }
  return errors;
}

export function CreatorOnboarding() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(params.get("socialError"));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [social, setSocial] = useState<SocialDraft>(() => readDraft().social);
  const [form, setForm] = useState(() => readDraft().form);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    writeDraft(form, social);
  }, [form, social]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const errors = validateCreatorInput(form, social);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      await api("/api/creator/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          city: form.city.trim(),
          niche: form.niche,
          bio: form.bio.trim(),
          socialPlatforms: social.platforms,
          socialLinks: social.links,
          followerRanges: social.ranges,
        }),
      });
      sessionStorage.removeItem(DRAFT_KEY);
      await refresh();
      navigate("/creator");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mx-auto max-w-xl space-y-4 px-5 py-16" onSubmit={(event) => void save(event)}>
      <h1 className="text-3xl font-medium">Set up your creator profile</h1>
      <Notice message={params.get("connected") ? `${params.get("connected")} connected.` : error} />
      <div>
        <Field label="Name *">
          <TextInput
            value={form.name}
            onChange={(event) => {
              setForm({ ...form, name: event.target.value });
              if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
            }}
            required
          />
        </Field>
        {fieldErrors.name ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
        ) : null}
      </div>
      <div>
        <Field label="City *">
          <TextInput
            value={form.city}
            onChange={(event) => {
              setForm({ ...form, city: event.target.value });
              if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: "" });
            }}
            required
          />
        </Field>
        {fieldErrors.city ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.city}</p>
        ) : null}
      </div>
      <div>
        <Field label="Niche *">
          <SelectInput
            value={form.niche}
            onChange={(event) => {
              setForm({ ...form, niche: event.target.value });
              if (fieldErrors.niche) setFieldErrors({ ...fieldErrors, niche: "" });
            }}
          >
            {NICHES.map((niche) => (
              <option key={niche}>{niche}</option>
            ))}
          </SelectInput>
        </Field>
        {fieldErrors.niche ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.niche}</p>
        ) : null}
      </div>
      <SocialAccounts
        value={social}
        errors={fieldErrors}
        onChange={(next) => {
          setSocial(next);
          writeDraft(form, next);
          if (fieldErrors.social) setFieldErrors({ ...fieldErrors, social: "" });
        }}
      />
      <div>
        <Field label="Bio *">
          <TextArea
            value={form.bio}
            onChange={(event) => {
              setForm({ ...form, bio: event.target.value });
              if (fieldErrors.bio) setFieldErrors({ ...fieldErrors, bio: "" });
            }}
            required
          />
        </Field>
        {fieldErrors.bio ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.bio}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

type InvitationItem = {
  id: string;
  status: string;
  message?: string | null;
  createdAt: string;
  campaign: {
    id: string;
    title: string;
    productName?: string;
    niche?: string;
    platform?: string;
    platforms?: string[];
    priceRange?: string;
    estimatedPrice?: number;
    deliverables?: string;
    brand: {
      id?: string;
      companyName: string;
      companyLogo?: string | null;
      isVerified?: boolean;
    };
  };
};

export function CreatorHome() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<BrandDetailView | null>(null);
  const [page, setPage] = useState(1);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [invitationNotice, setInvitationNotice] = useState<string | null>(null);
  const pageSize = 8;

  const campaigns = useQuery({
    queryKey: ["public-campaigns", q, niche, platform, priceRange],
    queryFn: () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (niche) params.set("niche", niche);
      if (platform) params.set("platform", platform);
      if (priceRange) params.set("priceRange", priceRange);
      return api<{ campaigns: CampaignCard[] }>(`/api/creator/campaigns?${params.toString()}`);
    },
  });
  const invitations = useQuery({
    queryKey: ["invitations"],
    queryFn: () => api<{ invitations: InvitationItem[] }>("/api/invitations"),
  });

  async function handleInvitationResponse(invitationId: string, status: "ACCEPTED" | "REJECTED") {
    setRespondingId(invitationId);
    setInvitationNotice(null);
    try {
      await api(`/api/invitations/${invitationId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (status === "ACCEPTED") {
        setInvitationNotice("Invitation accepted! This campaign is now active under your collaborations.");
      } else {
        setInvitationNotice("Invitation declined.");
      }
      await queryClient.invalidateQueries({ queryKey: ["invitations"] });
      await queryClient.invalidateQueries({ queryKey: ["work"] });
    } catch (err) {
      setInvitationNotice(err instanceof Error ? err.message : "Failed to update invitation");
    } finally {
      setRespondingId(null);
    }
  }

  const allCampaigns = campaigns.data?.campaigns ?? [];
  const totalPages = Math.max(1, Math.ceil(allCampaigns.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedCampaigns = allCampaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-medium">Discover campaigns</h1>
        <p className="mt-2 text-muted">Browse verified campaigns, review deliverables, and apply directly.</p>
      </div>

      {(invitations.data?.invitations.length ?? 0) > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">Private Campaign Invitations</h2>
            <span className="text-xs text-muted">Direct brand invitations reserved for you</span>
          </div>
          {invitationNotice && <Notice message={invitationNotice} />}
          <div className="grid gap-3 sm:grid-cols-2">
            {invitations.data?.invitations.map((invitation) => {
              const isPending = invitation.status === "SENT" || invitation.status === "VIEWED";
              return (
                <Card key={invitation.id} className="border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-900">{invitation.campaign.brand.companyName}</p>
                          <VerifiedBadge isVerified={invitation.campaign.brand.isVerified} size="sm" />
                        </div>
                        <h3 className="mt-1 text-base font-bold text-ink">{invitation.campaign.title}</h3>
                      </div>
                      <StatusPill status={invitation.status} />
                    </div>

                    {invitation.message && (
                      <p className="mt-2 text-xs text-muted italic bg-white/80 rounded-lg p-2 border border-line/60">
                        "{invitation.message}"
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      {invitation.campaign.niche && (
                        <span className="rounded-full bg-soft px-2.5 py-0.5 text-ink font-medium">{invitation.campaign.niche}</span>
                      )}
                      <span className="font-mono font-semibold text-emerald-700">
                        {priceRangeLabel(invitation.campaign.priceRange, invitation.campaign.estimatedPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3 gap-2">
                    <Link to={`/creator/campaigns/${invitation.campaign.id}`}>
                      <Button variant="ghost" className="text-xs">View Details →</Button>
                    </Link>
                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          className="text-xs !py-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
                          disabled={respondingId === invitation.id}
                          onClick={() => void handleInvitationResponse(invitation.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          className="text-xs !py-1.5"
                          disabled={respondingId === invitation.id}
                          onClick={() => void handleInvitationResponse(invitation.id, "ACCEPTED")}
                        >
                          {respondingId === invitation.id ? "Accepting..." : "Accept"}
                        </Button>
                      </div>
                    ) : invitation.status === "ACCEPTED" ? (
                      <Link to="/creator/work">
                        <Button variant="secondary" className="text-xs">Go to My Work →</Button>
                      </Link>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <TextInput
          placeholder="Search"
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
          value={priceRange}
          onChange={(event) => {
            setPriceRange(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Any budget</option>
          {PRICE_RANGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </SelectInput>
      </div>

      {campaigns.isLoading ? <Spinner /> : null}
      {campaigns.isError ? <ErrorState message="Could not load campaigns." onRetry={() => void campaigns.refetch()} /> : null}
      {campaigns.data && campaigns.data.campaigns.length === 0 ? <EmptyState title="No campaigns available." /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {paginatedCampaigns.map((campaign) => (
          <Card key={campaign.id} className="flex flex-col justify-between hover:border-ink/40 transition-all">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedBrand(campaign.brand)}
                    className="text-sm font-semibold text-muted hover:text-ink hover:underline cursor-pointer transition-colors text-left"
                  >
                    {campaign.brand.companyName}
                  </button>
                  <VerifiedBadge isVerified={campaign.brand.isVerified} size="sm" />
                </div>

                {campaign.hasApplied ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] px-2.5 py-0.5 font-bold shrink-0">
                    <span>Applied ✓</span>
                    {campaign.applicationStatus && campaign.applicationStatus !== "PENDING" && (
                      <span className="text-[10px] font-normal text-emerald-700">({campaign.applicationStatus.toLowerCase()})</span>
                    )}
                  </span>
                ) : null}
              </div>

              {campaign.referenceNumber != null && (
                <p className="mt-1 font-mono text-xs font-semibold text-amber-800">
                  {formatReferenceNumber("campaign", campaign.referenceNumber)}
                </p>
              )}

              <h2 className="mt-1 text-lg font-medium text-ink">{campaign.title}</h2>
              <p className="mt-2 text-sm text-ink/80">{campaign.productName} · {campaign.niche} · {platformLabel(campaign)}</p>
              <p className="mt-1 text-sm font-semibold text-ink font-mono">{priceRangeLabel(campaign.priceRange, campaign.estimatedPrice)}</p>
              <p className="mt-3 text-sm text-muted line-clamp-2">{campaign.description}</p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3">
              <Link to={`/creator/campaigns/${campaign.id}`}>
                <Button variant={campaign.hasApplied ? "secondary" : "primary"} className="text-xs">
                  {campaign.hasApplied ? "View application" : "View campaign"}
                </Button>
              </Link>
              <ShareButton
                size="sm"
                variant="ghost"
                url={`${typeof window !== "undefined" ? window.location.origin : ""}/creator/campaigns/${campaign.id}`}
                title={`ChooseYourCreator Campaign: ${campaign.title}`}
              />
            </div>
          </Card>
        ))}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />

      {/* Brand Profile Details Modal */}
      {selectedBrand ? (
        <ProfileDetailsModal
          type="BRAND"
          brand={selectedBrand}
          onClose={() => setSelectedBrand(null)}
        />
      ) : null}
    </div>
  );
}

export function CreatorCampaignDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandDetailView | null>(null);

  const query = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => api<{ campaign: CampaignDetail }>(`/api/campaigns/${id}`),
  });

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) return <ErrorState message="This campaign is not available." />;
  const campaign = query.data.campaign;
  const application = campaign.applications?.[0];
  const invitation = campaign.invitations?.[0];
  const collaboration = campaign.collaborations?.[0];

  async function apply() {
    try {
      await api(`/api/campaigns/${campaign.id}/apply`, { method: "POST", body: JSON.stringify({ message }) });
      setNotice("Application sent.");
      await queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not apply");
    }
  }

  async function respond(status: "ACCEPTED" | "REJECTED" | "VIEWED") {
    if (!invitation) return;
    try {
      await api(`/api/invitations/${invitation.id}`, { method: "PUT", body: JSON.stringify({ status }) });
      await queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not update the invitation");
    }
  }

  return (
    <div className="space-y-6">
      {/* Brand Header Link */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setSelectedBrand(campaign.brand)}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink cursor-pointer group"
        >
          <span className="group-hover:underline text-ink font-semibold">{campaign.brand.companyName}</span>
          <VerifiedBadge isVerified={campaign.brand.isVerified} size="sm" />
          <span className="text-xs text-muted">· View Brand Profile →</span>
        </button>

        <ShareButton
          title={`Join campaign: ${campaign.title}`}
          url={typeof window !== "undefined" ? window.location.href : ""}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          {campaign.referenceNumber != null && (
            <p className="font-mono text-xs font-semibold text-amber-800">
              {formatReferenceNumber("campaign", campaign.referenceNumber)}
            </p>
          )}
          <h1 className="text-3xl font-medium">{campaign.title}</h1>
          <p className="text-sm text-muted">{campaign.productName} · {campaign.niche} · {platformLabel(campaign)}</p>
        </div>
        <StatusPill status={campaign.status} />
      </div>

      <Notice message={notice} />
      <p className="text-ink/90 leading-relaxed whitespace-pre-wrap">{campaign.description}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Product</p>
          <p className="mt-2 text-base font-semibold">{campaign.productName}</p>
          <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{campaign.productDetails}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Compensation & Budget</p>
          <p className="mt-2 text-xl font-bold font-mono text-emerald-700">
            {priceRangeLabel(campaign.priceRange, campaign.estimatedPrice)}
          </p>
          <p className="mt-1 text-xs text-muted whitespace-pre-wrap">{campaign.performanceTerms || "Fixed collaboration budget."}</p>
        </Card>
      </div>

      <Card className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Campaign Requirements & Scope</h3>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div><span className="font-medium text-ink">Deliverables: </span><p className="mt-0.5 text-muted">{campaign.deliverables}</p></div>
          <div><span className="font-medium text-ink">Creative Guidelines: </span><p className="mt-0.5 text-muted">{campaign.requirements}</p></div>
          <div><span className="font-medium text-ink">Platforms: </span><span className="text-muted">{platformLabel(campaign)}</span></div>
          <div>
            <span className="font-medium text-ink">Creator Slots: </span>
            <span className="text-muted">
              {campaign.creatorSlots > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {campaign.creatorSlots} open {campaign.creatorSlots === 1 ? "slot" : "slots"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  All slots filled
                </span>
              )}
            </span>
          </div>
        </div>
        {campaign.instructions ? (
          <div className="border-t border-line/60 pt-2 text-sm">
            <span className="font-medium text-ink">Instructions: </span>
            <p className="mt-0.5 text-xs text-muted">{campaign.instructions}</p>
          </div>
        ) : null}
      </Card>

      {campaign.campaignType === "PUBLIC" && !application ? (
        campaign.creatorSlots > 0 ? (
          <div className="space-y-3 rounded-2xl border border-line bg-soft/30 p-5">
            <h3 className="text-sm font-semibold">Apply to this campaign</h3>
            <TextArea placeholder="Introduce yourself and share ideas for this brand collaboration..." value={message} onChange={(event) => setMessage(event.target.value)} />
            <Button onClick={() => void apply()}>Submit Application</Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-line/70 bg-soft/30 p-5 text-center text-sm text-muted">
            <p className="font-medium text-ink">Applications Closed</p>
            <p className="text-xs mt-1">All creator slots for this campaign have been filled.</p>
          </div>
        )
      ) : null}

      {application ? (
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-soft/40 p-4">
          <span className="text-sm font-medium">Your Application Status:</span>
          <StatusPill status={application.status} />
        </div>
      ) : null}

      {invitation && (invitation.status === "SENT" || invitation.status === "VIEWED") ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-indigo-950">You're invited to this private campaign!</h3>
            <StatusPill status={invitation.status} />
          </div>
          {invitation.message && (
            <p className="text-xs text-muted italic bg-white/80 rounded-lg p-3 border border-line/60">
              "{invitation.message}"
            </p>
          )}
          <p className="text-xs text-indigo-900/80">
            {campaign.brand.companyName} selected and invited you directly to collaborate on this campaign. Accept the invitation to proceed with normal campaign collaboration and agreement.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Button onClick={() => void respond("ACCEPTED")}>Accept invitation</Button>
            <Button variant="secondary" onClick={() => void respond("REJECTED")}>Reject</Button>
          </div>
        </div>
      ) : invitation && invitation.status === "ACCEPTED" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-2">
          <p className="text-sm font-bold text-emerald-950">✓ Invitation Accepted</p>
          <p className="text-xs text-emerald-900/80">
            You have accepted the invitation for this campaign. You can now message the brand to finalize the agreement and start working on deliverables.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Link to="/creator/work"><Button variant="secondary" className="text-xs">Go to My Work →</Button></Link>
            <Link to="/creator/messages"><Button variant="primary" className="text-xs">Message Brand</Button></Link>
          </div>
        </div>
      ) : null}

      {collaboration?.agreement ? (
        <Link to={`/creator/agreements/${collaboration.agreement.id}`}><Button variant="secondary">View agreement</Button></Link>
      ) : null}

      {/* Only show message button when creator has a valid collaboration status */}
      {collaboration &&
        ["ACCEPTED", "INVITED", "AGREEMENT_PENDING", "PAYMENT_PENDING", "ACTIVE", "CONTENT_SUBMITTED", "PAYMENT_REQUESTED", "COMPLETED"].includes(collaboration.status) ? (
        <Link to="/creator/messages"><Button variant="ghost">Message brand</Button></Link>
      ) : application?.status === "ACCEPTED" || invitation?.status === "SENT" || invitation?.status === "VIEWED" || invitation?.status === "ACCEPTED" ? (
        <Link to="/creator/messages"><Button variant="ghost">Message brand</Button></Link>
      ) : null}

      {/* Brand Profile Details Modal */}
      {selectedBrand ? (
        <ProfileDetailsModal
          type="BRAND"
          brand={selectedBrand}
          onClose={() => setSelectedBrand(null)}
        />
      ) : null}
    </div>
  );
}

type WorkCategory = "ALL" | "ACCEPTED" | "PENDING" | "STARTED" | "REJECTED" | "COMPLETED";

function resolveWorkCategory(status: string): "PENDING" | "ACCEPTED" | "STARTED" | "REJECTED" | "COMPLETED" {
  switch (status) {
    case "APPLIED":
    case "INVITED":
      return "PENDING";
    case "ACCEPTED":
    case "AGREEMENT_PENDING":
    case "PAYMENT_PENDING":
      return "ACCEPTED";
    case "ACTIVE":
    case "CONTENT_SUBMITTED":
    case "PAYMENT_REQUESTED":
      return "STARTED";
    case "REJECTED":
    case "WITHDRAWN":
      return "REJECTED";
    case "COMPLETED":
    case "EXPIRED":
      return "COMPLETED";
    default:
      return "PENDING";
  }
}

export function WorkCategoryBadge({ status }: { status: string }) {
  const category = resolveWorkCategory(status);
  const styles: Record<typeof category, { badge: string; dot: string; label: string }> = {
    PENDING: {
      badge: "border-amber-300 bg-amber-50 text-amber-800",
      dot: "bg-amber-500",
      label: statusLabel(status),
    },
    ACCEPTED: {
      badge: "border-blue-300 bg-blue-50 text-blue-800",
      dot: "bg-blue-500",
      label: statusLabel(status),
    },
    STARTED: {
      badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
      dot: "bg-emerald-500",
      label: status === "ACTIVE" ? "Started / Active" : statusLabel(status),
    },
    REJECTED: {
      badge: "border-rose-300 bg-rose-50 text-rose-800",
      dot: "bg-rose-500",
      label: statusLabel(status),
    },
    COMPLETED: {
      badge: "border-neutral-300 bg-neutral-100 text-neutral-700",
      dot: "bg-neutral-500",
      label: statusLabel(status),
    },
  };
  const current = styles[category];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${current.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}

export function CreatorWork() {
  const [filter, setFilter] = useState<WorkCategory>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const query = useQuery({
    queryKey: ["work"],
    queryFn: () =>
      api<{
        work: Array<{
          id: string;
          status: string;
          campaignId: string;
          campaign: {
            id: string;
            title: string;
            productName: string;
            startDate: string;
            endDate: string;
            estimatedPrice: number;
            brand: { companyName: string; companyLogo?: string | null };
          };
          agreement?: { id: string; status: string } | null;
        }>;
      }>("/api/creator/work"),
  });

  if (query.isLoading) return <Spinner />;
  if (query.isError) return <ErrorState message="Could not load your work." onRetry={() => void query.refetch()} />;

  const allWork = query.data?.work ?? [];

  const counts: Record<WorkCategory, number> = {
    ALL: allWork.length,
    ACCEPTED: allWork.filter((item) => resolveWorkCategory(item.status) === "ACCEPTED").length,
    PENDING: allWork.filter((item) => resolveWorkCategory(item.status) === "PENDING").length,
    STARTED: allWork.filter((item) => resolveWorkCategory(item.status) === "STARTED").length,
    REJECTED: allWork.filter((item) => resolveWorkCategory(item.status) === "REJECTED").length,
    COMPLETED: allWork.filter((item) => resolveWorkCategory(item.status) === "COMPLETED").length,
  };

  const filtered = allWork.filter((item) => {
    if (filter !== "ALL" && resolveWorkCategory(item.status) !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = item.campaign.title.toLowerCase().includes(q);
      const matchBrand = item.campaign.brand.companyName.toLowerCase().includes(q);
      const matchProduct = item.campaign.productName.toLowerCase().includes(q);
      if (!matchTitle && !matchBrand && !matchProduct) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedWork = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const filterTabs: Array<{ id: WorkCategory; label: string }> = [
    { id: "ALL", label: "All" },
    { id: "ACCEPTED", label: "Accepted" },
    { id: "PENDING", label: "Pending" },
    { id: "STARTED", label: "Started" },
    { id: "REJECTED", label: "Rejected" },
    { id: "COMPLETED", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium">My Work</h1>
          <p className="mt-1 text-sm text-muted">
            Track your campaign collaborations from application to completion.
          </p>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
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
                    : "border border-line/60 bg-soft/70 text-muted hover:bg-soft hover:text-ink"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
                    active ? "bg-white/20 text-white" : "border border-line/40 bg-white text-muted"
                  }`}
                >
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

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

      {/* Work List */}
      {allWork.length === 0 ? (
        <EmptyState
          title="No campaigns yet."
          body="Apply to a public campaign or accept an invitation to get started."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matching work items."
          body={
            search
              ? `No campaigns match "${search}" in the selected filter.`
              : `There are currently no campaigns categorized as ${filter.toLowerCase()}.`
          }
        />
      ) : (
        <div className="space-y-4">
          {paginatedWork.map((item) => (
            <Link key={item.id} to={`/creator/work/${item.id}`} className="block group">
              <Card className="transition hover:border-ink/40">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted">{item.campaign.brand.companyName}</p>
                    <h2 className="text-lg font-medium group-hover:underline">{item.campaign.title}</h2>
                    <p className="text-sm text-muted">
                      {item.campaign.productName} · {formatInr(item.campaign.estimatedPrice)}
                    </p>
                    {item.campaign.endDate ? (
                      <p className="text-xs text-muted">
                        Valid: {formatDate(item.campaign.startDate)} – {formatDate(item.campaign.endDate)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <WorkCategoryBadge status={item.status} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

export function CreatorWorkDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [socialUrl, setSocialUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const query = useQuery({
    queryKey: ["work"],
    queryFn: () =>
      api<{
        work: Array<{
          id: string;
          status: string;
          campaignId: string;
          campaign: {
            id: string;
            title: string;
            productName: string;
            productDetails: string;
            description: string;
            deliverables: string;
            requirements: string;
            instructions: string;
            performanceTerms: string;
            startDate: string;
            endDate: string;
            estimatedPrice: number;
            brand: { companyName: string; companyLogo?: string | null; websiteUrl?: string | null };
          };
          agreement?: {
            id: string;
            status: string;
            performanceTiers?: Array<{ views: number; amount: number; label?: string }>;
            agreementData?: {
              performanceTiers?: Array<{ views: number; amount: number; label?: string }>;
            };
          } | null;
          payments?: Array<{
            id: string;
            type: "INITIAL_HELD" | "PERFORMANCE_DIRECT";
            amount: number;
            initialStatus?: string | null;
            performanceStatus?: string | null;
          }>;
          submissions: Array<{ id: string; status: string; socialUrl?: string | null; caption?: string; submittedAt: string; changeRequestReason?: string | null }>;
        }>;
      }>("/api/creator/work"),
  });

  const item = query.data?.work.find((entry) => entry.id === id);

  if (query.isLoading) return <Spinner />;
  if (!item) return <ErrorState message="This collaboration was not found." />;

  const category = resolveWorkCategory(item.status);
  const isStarted = category === "STARTED";

  async function doSubmit() {
    setNotice(null);
    setSubmitting(true);
    const body = new FormData();
    body.set("campaignId", item!.campaign.id);
    body.set("socialUrl", socialUrl);
    body.set("notes", notes);
    body.set("caption", caption);
    if (file) body.set("file", file);
    try {
      await api("/api/submissions", { method: "POST", body });
      setNotice("Work submitted successfully for brand review.");
      setSocialUrl("");
      setNotes("");
      setCaption("");
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ["work"] });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/creator/work" className="text-xs text-muted hover:underline">
          ← Back to My Work
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-sm text-muted">{item.campaign.brand.companyName}</p>
          <h1 className="mt-1 text-3xl font-medium">{item.campaign.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {item.campaign.productName} · {formatInr(item.campaign.estimatedPrice)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WorkCategoryBadge status={item.status} />
        </div>
      </div>

      <Notice message={notice} />

      {/* Gated Workspace Views */}
      {isStarted ? (
        /* Full Active Workspace for Started State */
        <div className="space-y-6">
          {/* Campaign Details */}
          <Card className="space-y-3">
            <h2 className="text-lg font-medium">Campaign Overview</h2>
            {item.campaign.description ? (
              <p className="text-sm leading-relaxed">{item.campaign.description}</p>
            ) : null}
            <div className="grid gap-3 pt-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted">Campaign validity:</span>
                <p className="font-medium">
                  {formatDate(item.campaign.startDate)} – {formatDate(item.campaign.endDate)}
                </p>
              </div>
              <div>
                <span className="text-muted">Product details:</span>
                <p className="font-medium">{item.campaign.productDetails || item.campaign.productName}</p>
              </div>
              <div>
                <span className="text-muted">Agreed deliverables:</span>
                <p className="font-medium whitespace-pre-wrap">{item.campaign.deliverables}</p>
              </div>
              <div>
                <span className="text-muted">Requirements:</span>
                <p className="font-medium whitespace-pre-wrap">{item.campaign.requirements}</p>
              </div>
              {item.campaign.instructions ? (
                <div className="sm:col-span-2">
                  <span className="text-muted">Additional instructions:</span>
                  <p className="font-medium whitespace-pre-wrap">{item.campaign.instructions}</p>
                </div>
              ) : null}
            </div>
          </Card>

          {/* Agreed Payment & Agreement Details */}
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <div>
                <h2 className="text-lg font-medium">Payment & Agreement</h2>
                <p className="text-xs text-muted">Agreed terms for this collaboration</p>
              </div>
              <div className="flex items-center gap-2">
                {item.agreement ? (
                  <Link to={`/creator/agreements/${item.agreement.id}`}>
                    <Button variant="secondary" className="text-xs">
                      View Signed Agreement
                    </Button>
                  </Link>
                ) : null}
                <Link to="/creator/payments">
                  <Button variant="secondary" className="text-xs">
                    View Payments Page
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-soft/40 p-4 space-y-1">
                <span className="text-xs text-muted">Agreed Payment (Held in Escrow)</span>
                <p className="text-xl font-semibold">
                  {formatInr(item.campaign.estimatedPrice)}
                </p>
                <p className="text-xs text-muted">
                  Payment will be released by admin after brand approves your work.
                </p>
              </div>
          </Card>

          {/* Content Submission Actions */}
          <Card className="space-y-4">
            <h2 className="text-lg font-medium">Submit Deliverable Work</h2>
            <p className="text-xs text-muted">
              Submit your published post URL, draft caption, notes, and media files for brand approval.
            </p>
            <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); setConfirmSubmit(true); }}>
              <Field label="Social Post URL (Instagram / Facebook / YouTube)">
                <TextInput
                  placeholder="https://instagram.com/p/... or https://facebook.com/..."
                  value={socialUrl}
                  onChange={(event) => setSocialUrl(event.target.value)}
                />
              </Field>
              <Field label="Caption">
                <TextArea
                  placeholder="The caption used with the collaboration post"
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                />
              </Field>
              <Field label="Submission notes">
                <TextArea
                  placeholder="Notes or metrics for the brand"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </Field>
              <Field label="Media file (Optional proof or video)">
                <TextInput
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </Field>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting Work…" : "Submit Work for Review"}
              </Button>
            </form>

            {item.submissions.length > 0 ? (
              <div className="border-t border-line pt-3 space-y-2">
                <p className="text-xs font-semibold text-muted uppercase">Past Submissions</p>
                <div className="space-y-2">
                  {item.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-line p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">Submitted on {formatDate(sub.submittedAt)}</p>
                        <StatusPill status={sub.status} />
                      </div>
                      {sub.socialUrl ? (
                        <a href={sub.socialUrl} target="_blank" rel="noreferrer" className="text-muted underline block truncate">
                          {sub.socialUrl}
                        </a>
                      ) : null}
                      {sub.status === "CHANGES_REQUESTED" && sub.changeRequestReason ? (
                        <div className="mt-1.5 rounded-lg bg-amber-50 border border-amber-200 p-2">
                          <p className="font-semibold text-amber-700 mb-0.5">Change reason from brand:</p>
                          <p className="text-amber-900 whitespace-pre-wrap">{sub.changeRequestReason}</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      ) : (
        /* Concise Summary for Non-Started States */
        <div className="space-y-4">
          <Card className="space-y-4">
            <h2 className="text-lg font-medium">Collaboration Status</h2>
            <div className="rounded-2xl border border-line bg-soft/50 p-4">
              {category === "PENDING" ? (
                <p className="text-sm text-amber-900">
                  ⏳ <strong>Pending Review:</strong> Your application or invitation for this campaign is currently pending. The active workspace and content submission tools will become available once the collaboration has been agreed and started.
                </p>
              ) : category === "ACCEPTED" ? (
                <p className="text-sm text-blue-900">
                  ✓ <strong>Application Accepted:</strong> The brand has accepted your application! Complete the agreement and payment setup to start the collaboration and activate your submission workspace.
                </p>
              ) : category === "REJECTED" ? (
                <p className="text-sm text-rose-900">
                  ✕ <strong>Collaboration Concluded:</strong> This application or invitation was not proceeded with.
                </p>
              ) : (
                <p className="text-sm text-neutral-800">
                  ✓ <strong>Completed Collaboration:</strong> This campaign collaboration has concluded. You can review your signed agreement and financial history below.
                </p>
              )}
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="text-muted">Campaign:</span>
                <p className="font-medium">{item.campaign.title}</p>
              </div>
              <div>
                <span className="text-muted">Brand:</span>
                <p className="font-medium">{item.campaign.brand.companyName}</p>
              </div>
              <div>
                <span className="text-muted">Product:</span>
                <p className="font-medium">{item.campaign.productName}</p>
              </div>
              <div>
                <span className="text-muted">Estimated budget:</span>
                <p className="font-medium">{formatInr(item.campaign.estimatedPrice)}</p>
              </div>
            </div>

            {/* Preserved access to signed agreements & payments */}
            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
              {item.agreement ? (
                <Link to={`/creator/agreements/${item.agreement.id}`}>
                  <Button variant="secondary" className="text-xs">
                    View Agreement
                  </Button>
                </Link>
              ) : null}
              <Link to="/creator/payments">
                <Button variant="secondary" className="text-xs">
                  View Payments History
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {/* Submit Work Confirm */}
      <ConfirmModal
        isOpen={confirmSubmit}
        title="Confirm Work Submission"
        message={`Are you sure you want to submit your work for brand review? Make sure your post URL, caption, and any attachments are correct before submitting.`}
        confirmText="Yes, Submit Work"
        variant="primary"
        loading={submitting}
        onCancel={() => setConfirmSubmit(false)}
        onConfirm={() => {
          setConfirmSubmit(false);
          void doSubmit();
        }}
      />
    </div>
  );
}

type PaymentRecord = {
  id: string;
  campaignId: string;
  creatorId: string;
  brandId: string;
  type: "INITIAL_HELD" | "PERFORMANCE_DIRECT";
  amount: number;
  currency: string;
  initialStatus?: "PENDING" | "HELD" | "RELEASE_REQUESTED" | "RELEASED" | "FAILED" | "REFUNDED" | null;
  performanceStatus?: "PENDING" | "PAID_DIRECTLY" | null;
  createdAt: string;
  creatorName?: string;
  agreementStatus?: string | null;
  collaborationStatus?: string | null;
  submissionApproved?: boolean;
  canRequestRelease?: boolean;
  releaseIneligibilityReason?: string | null;
  campaign?: {
    id: string;
    title: string;
    status: string;
    endDate?: string | null;
    brand?: { id: string; companyName: string };
  };
};

export function CreatorPayments() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [requestingPerfId, setRequestingPerfId] = useState<string | null>(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<string, boolean>>({});

  const query = useQuery({
    queryKey: ["payments"],
    queryFn: () => api<{ payments: PaymentRecord[] }>("/api/payments"),
  });

  if (query.isLoading) return <Spinner />;
  if (query.isError) return <ErrorState message="Could not load payments." onRetry={() => void query.refetch()} />;

  const payments = query.data?.payments ?? [];

  // Group payments by campaign
  const campaignMap = new Map<
    string,
    {
      campaignId: string;
      campaignTitle: string;
      brandName: string;
      campaignStatus: string;
      campaignEndDate?: string | null;
      agreementStatus?: string | null;
      collaborationStatus?: string | null;
      payments: PaymentRecord[];
      initialPayment?: PaymentRecord;
      performancePayment?: PaymentRecord;
      totalAgreed: number;
    }
  >();

  for (const payment of payments) {
    const cId = payment.campaignId;
    if (!campaignMap.has(cId)) {
      campaignMap.set(cId, {
        campaignId: cId,
        campaignTitle: payment.campaign?.title ?? "Campaign",
        brandName: payment.campaign?.brand?.companyName ?? "Brand",
        campaignStatus: payment.campaign?.status ?? "OPEN",
        campaignEndDate: payment.campaign?.endDate,
        agreementStatus: payment.agreementStatus,
        collaborationStatus: payment.collaborationStatus,
        payments: [],
        totalAgreed: 0,
      });
    }
    const group = campaignMap.get(cId)!;
    group.payments.push(payment);
    group.totalAgreed += payment.amount;
    if (payment.type === "INITIAL_HELD") {
      group.initialPayment = payment;
    } else if (payment.type === "PERFORMANCE_DIRECT") {
      group.performancePayment = payment;
    }
  }

  const campaignGroups = Array.from(campaignMap.values());

  function toggleExpand(campaignId: string) {
    setExpandedCampaigns((prev) => ({ ...prev, [campaignId]: !prev[campaignId] }));
  }

  async function requestRelease(paymentId: string) {
    setNotice(null);
    setRequestingId(paymentId);
    try {
      await api(`/api/payments/${paymentId}/request-release`, { method: "POST" });
      setNotice("Payment release requested successfully. Brand will review and release funds.");
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not request payment release");
    } finally {
      setRequestingId(null);
    }
  }

  async function requestPerformance(paymentId: string) {
    setNotice(null);
    setRequestingPerfId(paymentId);
    try {
      await api(`/api/payments/${paymentId}/request-performance`, { method: "POST" });
      setNotice("Performance bonus request sent! The brand has been notified to settle the bonus directly.");
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not request performance bonus");
    } finally {
      setRequestingPerfId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium">Earnings &amp; Payments</h1>
        <p className="mt-1 text-sm text-muted">
          Track campaign escrow holdings, request payment releases, and monitor direct performance bonuses.
        </p>
      </div>

      <Notice message={notice} />

      {campaignGroups.length === 0 ? (
        <EmptyState
          title="No payment records yet."
          body="When you sign campaign agreements with brands, payment records and escrow tracking will appear here organized by campaign."
        />
      ) : (
        <div className="space-y-4">
          {campaignGroups.map((group) => {
            const isExpanded = expandedCampaigns[group.campaignId] ?? true;
            const init = group.initialPayment;
            const perf = group.performancePayment;

            const effectiveAgreement = resolveEffectiveAgreementStatus({
              agreementStatus: group.agreementStatus,
              collaborationStatus: group.collaborationStatus,
              initialPaymentStatus: init?.initialStatus,
              campaignStatus: group.campaignStatus,
              campaignEndDate: group.campaignEndDate,
            });
            const agreementMeta = effectiveAgreementStatusMeta(effectiveAgreement);

            // Compute overall payment status summary
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
              summaryLabel = "Awaiting brand deposit";
              summaryClass = "bg-amber-50 text-amber-800 border-amber-300";
            } else if (init?.initialStatus === "REFUNDED") {
              summaryLabel = "Refunded";
              summaryClass = "bg-rose-50 text-rose-800 border-rose-300";
            }

            return (
              <Card key={group.campaignId} className="space-y-4">
                {/* Campaign Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-medium">{group.campaignTitle}</h2>
                      <StatusPill status={group.campaignStatus} />
                    </div>
                    <p className="text-sm text-muted">
                      Brand: <span className="font-medium text-ink">{group.brandName}</span>
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
                    <span className="text-xs text-muted">Total Agreed Collaboration Payment:</span>
                    <p className="text-xl font-semibold text-ink">{formatInr(group.totalAgreed)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(group.campaignId)}
                    className="text-xs font-medium text-ink underline hover:opacity-75 cursor-pointer"
                  >
                    {isExpanded ? "Hide payment breakdown ↑" : "View payment breakdown ↓"}
                  </button>
                </div>

                {/* Expanded Payment Details Section */}
                {isExpanded ? (
                  <div className="space-y-3 border-t border-line pt-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">
                      Campaign Payments Breakdown
                    </p>

                    {/* 1. Initial Held Payment */}
                    {init ? (
                      <div className="rounded-2xl border border-line bg-soft/30 p-4 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink">Initial Payment (Escrow Held)</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-soft border border-line text-muted">
                                {init.currency}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted">
                              Held securely by ChooseYourCreator. No platform fee deducted. Released upon approved deliverable.
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-semibold">{formatInr(init.amount)}</span>
                            <div>
                              <StatusPill status={init.initialStatus || "PENDING"} />
                            </div>
                          </div>
                        </div>

                        {/* Status tracker & Action */}
                        <div className="border-t border-line/60 pt-3">
                          {init.initialStatus === "HELD" ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-emerald-700 font-medium">
                                  ✓ Funds secured in holding
                                </span>
                                {init.canRequestRelease ? (
                                  <Button
                                    onClick={() => void requestRelease(init.id)}
                                    disabled={requestingId === init.id}
                                    className="text-xs py-1.5 px-3 bg-ink hover:opacity-90"
                                  >
                                    {requestingId === init.id ? "Submitting Request…" : "Request Payment Release"}
                                  </Button>
                                ) : (
                                  <Button disabled className="text-xs py-1.5 px-3 opacity-50 cursor-not-allowed">
                                    Request Payment
                                  </Button>
                                )}
                              </div>
                              {init.releaseIneligibilityReason ? (
                                <p className="text-xs text-muted bg-soft/70 px-3 py-2 rounded-xl border border-line/60">
                                  ℹ️ <span className="font-medium">Why can&apos;t I request yet?</span> {init.releaseIneligibilityReason}
                                </p>
                              ) : (
                                <p className="text-xs text-emerald-800">
                                  ✓ Content submission approved! You are eligible to request release of these funds.
                                </p>
                              )}
                            </div>
                          ) : init.initialStatus === "RELEASE_REQUESTED" ? (
                            <div className="flex items-center justify-between bg-amber-50/80 border border-amber-200/60 p-3 rounded-xl text-amber-900 text-xs">
                              <div>
                                <p className="font-medium">Release request pending brand review</p>
                                <p className="text-amber-800/80 mt-0.5">
                                  You requested release of {formatInr(init.amount)}. The brand has been notified to complete the release.
                                </p>
                              </div>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                Processing
                              </span>
                            </div>
                          ) : init.initialStatus === "RELEASED" ? (
                            <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200/60 p-3 rounded-xl text-emerald-900 text-xs">
                              <p className="font-medium">✓ Payment released to your account</p>
                              <span className="text-[11px] text-emerald-700">Completed</span>
                            </div>
                          ) : init.initialStatus === "PENDING" ? (
                            <p className="text-xs text-muted bg-soft/70 px-3 py-2 rounded-xl border border-line/60">
                              ⏳ The brand has signed but not yet deposited the initial holding amount. You will be notified when funds are secured.
                            </p>
                          ) : (
                            <p className="text-xs text-muted">
                              Status: {init.initialStatus ? statusLabel(init.initialStatus) : "Pending"}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* 2. Direct Performance Bonus Payment */}
                    {perf ? (
                      <div className="rounded-2xl border border-line bg-soft/30 p-4 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink">Performance Bonus (Direct Payment)</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-soft border border-line text-muted">
                                {perf.currency}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-muted">
                              Paid directly by the brand to your account based on view/engagement milestones. Not held by ChooseYourCreator.
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-lg font-semibold">{formatInr(perf.amount)}</span>
                            <div>
                              <StatusPill status={perf.performanceStatus || "PENDING"} />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-line/60 pt-2 text-xs text-muted">
                          {perf.performanceStatus === "PAID_DIRECTLY" ? (
                            <p className="text-emerald-700 font-medium">✓ The brand has marked this performance payment as transferred directly.</p>
                          ) : init?.initialStatus === "RELEASED" ? (
                            <div className="flex items-center justify-between gap-3">
                              <p>Initial payment released. You can now notify the brand to settle the performance bonus.</p>
                              <Button
                                onClick={() => void requestPerformance(perf.id)}
                                disabled={requestingPerfId === perf.id}
                                className="text-xs py-1.5 px-3 shrink-0"
                              >
                                {requestingPerfId === perf.id ? "Requesting…" : "Request Performance Bonus"}
                              </Button>
                            </div>
                          ) : (
                            <p>Direct settlement between brand and creator once agreed view targets are achieved and initial payment is released.</p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AgreementPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [signing, setSigning] = useState(false);
  const query = useQuery({
    queryKey: ["agreement", id],
    queryFn: () => api<{ agreement: FullAgreement }>(`/api/agreements/${id}`),
  });

  if (query.isLoading) return <Spinner />;
  if (query.isError || !query.data) return <ErrorState message="Agreement not found." />;
  const agreement = query.data.agreement;

  async function handleCreatorSign(signatureName: string) {
    setSigning(true);
    try {
      await api(`/api/agreements/${agreement.id}/sign`, {
        method: "POST",
        body: JSON.stringify({ signatureName, consent: true }),
      });
      await query.refetch();
    } finally {
      setSigning(false);
    }
  }

  async function handleBrandSign(brandSignatureName: string) {
    setSigning(true);
    try {
      await api(`/api/agreements/${agreement.id}/brand-sign`, {
        method: "POST",
        body: JSON.stringify({ brandSignatureName }),
      });
      await query.refetch();
    } finally {
      setSigning(false);
    }
  }

  return (
    <AgreementDocument
      agreement={agreement}
      userRole={user?.role}
      onCreatorSign={handleCreatorSign}
      onBrandSign={handleBrandSign}
      signing={signing}
    />
  );
}

export function CreatorProfilePage() {
  const [params] = useSearchParams();
  const query = useQuery({
    queryKey: ["creator-profile"],
    queryFn: () =>
      api<{
        profile: {
          name: string;
          bio: string;
          city?: string;
          niche: string;
          profileImage?: string | null;
          bannerImage?: string | null;
          socialPlatforms: string[];
          socialLinks: Record<string, string>;
          followerCounts: Record<string, number>;
          followerRanges?: Record<string, string>;
        };
      }>("/api/creator/profile"),
  });
  const { refresh } = useAuth();
  const connected = params.get("connected");
  const socialError = params.get("socialError");
  const [editing, setEditing] = useState(Boolean(connected || socialError));
  const [notice, setNotice] = useState<string | null>(connected ? `${connected} connected.` : socialError);
  const [social, setSocial] = useState<SocialDraft | null>(null);
  const [form, setForm] = useState({ name: "", city: "", niche: "Lifestyle", bio: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);

  useEffect(() => {
    const profile = query.data?.profile;
    if (!profile || !editing || social) return;
    setForm({ name: profile.name, city: profile.city ?? "", niche: profile.niche, bio: profile.bio });
    setSocial(socialFromProfile(profile));
  }, [editing, query.data, social]);

  if (query.isLoading) return <Spinner />;
  if (!query.data?.profile) return <ErrorState message="Profile not found." />;
  const profile = query.data.profile;

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) {
      setAvatarCropFile(file);
      setAvatarCropOpen(true);
    }
  }

  async function uploadAvatarFile(file: File) {
    setUploadingAvatar(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api("/api/creator/avatar", { method: "POST", body: formData });
      setNotice("Profile photo updated.");
      await refresh();
      await query.refetch();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api("/api/creator/banner", { method: "POST", body: formData });
      setNotice("Cover banner updated.");
      await refresh();
      await query.refetch();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  }

  function beginEdit() {
    setForm({ name: profile.name, city: profile.city ?? "", niche: profile.niche, bio: profile.bio });
    setSocial(socialFromProfile(profile));
    setFieldErrors({});
    setEditing(true);
  }

  if (!editing) {
    const bannerUrl = profile.bannerImage ? apiUrl(`/api/files/${profile.bannerImage}`) : null;

    const cropModal = (
      <ImageCropModal
        open={avatarCropOpen}
        file={avatarCropFile}
        title="Crop profile photo"
        aspect={1}
        outputSize={{ width: 512, height: 512 }}
        onClose={() => {
          setAvatarCropOpen(false);
          setAvatarCropFile(null);
        }}
        onConfirm={(file) => void uploadAvatarFile(file)}
      />
    );

    return (
      <>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Cover Banner */}
        <div className="relative h-44 w-full rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-neutral-900 overflow-hidden shadow-xs border border-line">
          {bannerUrl ? (
            <img src={bannerUrl} alt="Cover Banner" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/40">
              <span className="text-xs font-medium">Add a cover banner to stand out</span>
            </div>
          )}
          <label className="absolute right-3.5 bottom-3.5 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white hover:bg-black/80 transition-colors cursor-pointer">
            <Camera size={13} />
            <span>{uploadingBanner ? "Uploading..." : "Change banner"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleBannerUpload(e)} />
          </label>
        </div>

        {/* Profile Card Header */}
        <div className="relative flex items-end justify-between gap-4 -mt-12 px-3">
          <div className="flex items-end gap-4">
            <div className="relative group">
              <div className="rounded-2xl border-4 border-white shadow-md bg-white overflow-hidden">
                <Avatar name={profile.name} image={profile.profileImage} size="h-20 w-20" />
              </div>
              <label className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={16} />
                <span className="text-[10px] font-medium mt-0.5">{uploadingAvatar ? "..." : "Edit photo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
              </label>
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-ink">{profile.name}</h1>
              <p className="text-xs text-muted">{profile.niche}{profile.city ? ` · ${profile.city}` : ""}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={beginEdit} className="text-xs">Edit Details</Button>
        </div>

        <Notice message={notice} />
        <p className="max-w-xl leading-7 text-sm text-ink/90 whitespace-pre-wrap">{profile.bio}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          {profile.socialPlatforms.filter((platform) => platform !== "Other").map((platform) => {
            const link = profile.socialLinks?.[platform.toLowerCase()];
            return (
              <Card key={platform}>
                {link ? (
                  <a className="text-sm underline font-medium" href={link} target="_blank" rel="noreferrer">{platform}</a>
                ) : (
                  <p className="text-sm text-muted">{platform}</p>
                )}
                <p className="mt-2 text-2xl font-bold text-ink font-mono">{followerEstimateLabel(profile.followerRanges?.[platform], profile.followerCounts?.[platform])}</p>
                <p className="text-xs text-muted">estimated followers</p>
              </Card>
            );
          })}
        </div>
      </div>
      {cropModal}
      </>
    );
  }

  return (
    <>
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Edit profile</h1>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
      </div>

      <Notice message={notice} />

      {/* Image Upload Quick Section */}
      <Card className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Photos & Media</h3>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <Avatar name={profile.name} image={profile.profileImage} size="h-14 w-14" />
            <div>
              <label className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-soft cursor-pointer">
                <Camera size={13} />
                <span>{uploadingAvatar ? "Uploading..." : "Change profile photo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
              </label>
              <p className="text-[10px] text-muted mt-1">Square JPG, PNG, or WebP</p>
            </div>
          </div>

          <div>
            <label className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-soft cursor-pointer">
              <Camera size={13} />
              <span>{uploadingBanner ? "Uploading..." : "Change cover banner"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => void handleBannerUpload(e)} />
            </label>
            <p className="text-[10px] text-muted mt-1">Wide landscape header image</p>
          </div>
        </div>
      </Card>

      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        if (!social) return;
        const errors = validateCreatorInput(form, social);
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          return;
        }
        setFieldErrors({});
        void api("/api/creator/profile", {
          method: "PUT",
          body: JSON.stringify({
            name: form.name.trim(),
            city: form.city.trim(),
            niche: form.niche,
            bio: form.bio.trim(),
            socialPlatforms: social.platforms,
            socialLinks: social.links,
            followerRanges: social.ranges,
          }),
        }).then(async () => {
          setNotice("Profile updated successfully.");
          setEditing(false);
          await refresh();
          await query.refetch();
        }).catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Could not save"));
      }}>
        <div>
          <Field label="Name *">
            <TextInput
              value={form.name}
              onChange={(event) => {
                setForm({ ...form, name: event.target.value });
                if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
              }}
              required
            />
          </Field>
          {fieldErrors.name ? (
            <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
          ) : null}
        </div>
        <div>
          <Field label="City *">
            <TextInput
              value={form.city}
              onChange={(event) => {
                setForm({ ...form, city: event.target.value });
                if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: "" });
              }}
              required
            />
          </Field>
          {fieldErrors.city ? (
            <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.city}</p>
          ) : null}
        </div>
        <div>
          <Field label="Niche *">
            <SelectInput
              value={form.niche}
              onChange={(event) => {
                setForm({ ...form, niche: event.target.value });
                if (fieldErrors.niche) setFieldErrors({ ...fieldErrors, niche: "" });
              }}
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
        <div>
          <Field label="Bio *">
            <TextArea
              value={form.bio}
              onChange={(event) => {
                setForm({ ...form, bio: event.target.value });
                if (fieldErrors.bio) setFieldErrors({ ...fieldErrors, bio: "" });
              }}
              required
            />
          </Field>
          {fieldErrors.bio ? (
            <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.bio}</p>
          ) : null}
        </div>
        {social ? (
          <SocialAccounts
            value={social}
            errors={fieldErrors}
            onChange={(next) => {
              setSocial(next);
              if (fieldErrors.social) setFieldErrors({ ...fieldErrors, social: "" });
            }}
          />
        ) : null}
        <Button type="submit">Save profile</Button>
      </form>
    </div>
    <ImageCropModal
      open={avatarCropOpen}
      file={avatarCropFile}
      title="Crop profile photo"
      aspect={1}
      outputSize={{ width: 512, height: 512 }}
      onClose={() => {
        setAvatarCropOpen(false);
        setAvatarCropFile(null);
      }}
      onConfirm={(file) => void uploadAvatarFile(file)}
    />
    </>
  );
}
