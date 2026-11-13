import { useEffect, useState } from "react";
import { X, ExternalLink, Globe, MessageSquare, Instagram, Youtube, Facebook, MapPin, Hash, CheckCircle2, Phone, Mail, Star, Sparkles } from "lucide-react";
import { Avatar, Button } from "./ui";
import { formatFollowerCount, followerEstimateLabel, formatReferenceNumber, priceRangeLabel, formatDate } from "../shared/index";
import { Link } from "react-router-dom";
import { api, apiUrl } from "../lib/api";

function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }
  return apiUrl(`/api/files/${path}`);
}

type CreatorReviewItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  brandName: string;
  brandLogo?: string | null;
  campaignTitle: string;
};

export type BrandDetailView = {
  id?: string;
  referenceNumber?: number;
  companyName: string;
  companyLogo?: string | null;
  bannerImage?: string | null;
  websiteUrl?: string | null;
  niche?: string;
  employeeSize?: string;
  role?: string;
  businessDescription?: string;
  socialLinks?: Record<string, string>;
  isVerified?: boolean;
  email?: string | null;
  phone?: string | null;
  campaigns?: Array<{
    id: string;
    referenceNumber?: number;
    title: string;
    productName?: string;
    niche?: string;
    platform?: string;
    platforms?: string[];
    priceRange?: string;
    estimatedPrice?: number;
    creatorSlots?: number;
    endDate?: string;
  }>;
};

export type CreatorDetailView = {
  id?: string;
  referenceNumber?: number;
  name: string;
  profileImage?: string | null;
  bannerImage?: string | null;
  bio?: string;
  city?: string | null;
  niche?: string;
  totalFollowers?: number;
  socialPlatforms?: string[];
  socialLinks?: Record<string, string>;
  followerCounts?: Record<string, number>;
  followerRanges?: Record<string, string>;
  isVerified?: boolean;
  email?: string | null;
  phone?: string | null;
};

export function VerifiedBadge({ isVerified, size = "md" }: { isVerified?: boolean; size?: "sm" | "md" }) {
  if (!isVerified) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full ${
        size === "sm" ? "px-1.5 py-0.2 text-[10px]" : "px-2 py-0.5 text-xs"
      }`}
      title="Verified Account"
    >
      <CheckCircle2 size={size === "sm" ? 11 : 13} className="text-emerald-600 fill-emerald-100" />
      <span>Verified</span>
    </span>
  );
}

export function ProfileDetailsModal({
  type,
  brand,
  creator,
  onClose,
  onMessage,
  showAdminReference = false,
  showPhoneInAdmin = false,
}: {
  type: "BRAND" | "CREATOR";
  brand?: BrandDetailView | null;
  creator?: CreatorDetailView | null;
  onClose: () => void;
  onMessage?: () => void;
  showAdminReference?: boolean;
  showPhoneInAdmin?: boolean;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const [reviews, setReviews] = useState<CreatorReviewItem[]>([]);

  useEffect(() => {
    if (type === "CREATOR" && creator?.id) {
      api<{ reviews: CreatorReviewItem[] }>(`/api/creators/${creator.id}/reviews`)
        .then((res) => setReviews(res.reviews || []))
        .catch(() => setReviews([]));
    }
  }, [type, creator?.id]);

  if (type === "BRAND" && brand) {
    const social = brand.socialLinks || {};
    const bannerUrl = resolveMediaUrl(brand.bannerImage);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <div
          role="dialog"
          aria-modal="true"
          className="relative flex w-full max-w-xl max-h-[min(90vh,680px)] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl"
        >
          {/* Banner */}
          <div className="relative h-32 sm:h-36 shrink-0 overflow-hidden bg-slate-900">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Cover Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="relative h-full w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="flex items-center gap-2 text-xs font-medium text-white/50 tracking-wide">
                  <Sparkles size={14} className="text-white/60" />
                  <span>ChooseYourCreator</span>
                </div>
              </div>
            )}
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-xs hover:bg-black/70 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Header below banner: square avatar overlapping banner on left, title & badges beside it */}
          <div className="relative border-b border-line bg-white px-6 pb-4 sm:px-7">
            <div className="flex items-center gap-4">
              <div className="-mt-12 sm:-mt-14 relative shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md w-20 h-20">
                <Avatar name={brand.companyName} image={brand.companyLogo} size="h-full w-full" shape="square" />
              </div>
              <div className="min-w-0 flex-1 pt-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-ink truncate">{brand.companyName}</h2>
                  <VerifiedBadge isVerified={brand.isVerified} />
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  {brand.niche && (
                    <span className="rounded-full border border-line bg-white px-3 py-0.5 font-medium text-ink shadow-2xs">
                      {brand.niche}
                    </span>
                  )}
                  {brand.employeeSize && (
                    <span className="rounded-full border border-line bg-white px-3 py-0.5 text-muted shadow-2xs">
                      {brand.employeeSize} employees
                    </span>
                  )}
                  {brand.role && (
                    <span className="rounded-full border border-line bg-white px-3 py-0.5 text-muted shadow-2xs">
                      {brand.role}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {showAdminReference && brand.referenceNumber != null && (
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-amber-800">
                <Hash size={12} />
                <span>{formatReferenceNumber("brand", brand.referenceNumber)}</span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Admin-only contact info */}
            {showPhoneInAdmin && (brand.phone || brand.email) && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                <span className="font-semibold text-emerald-900 uppercase tracking-wider text-[11px]">
                  Contact Information (Admin Eyes Only)
                </span>
                <div className="grid grid-cols-2 gap-3 text-emerald-950 font-mono">
                  {brand.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-700 shrink-0" />
                      <span>{brand.phone}</span>
                    </div>
                  )}
                  {brand.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="text-emerald-700 shrink-0" />
                      <span>{brand.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {brand.businessDescription && (
              <div className="space-y-1.5">
                <span className="font-semibold text-muted uppercase tracking-wider text-[11px]">
                  About the Brand
                </span>
                <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">{brand.businessDescription}</p>
              </div>
            )}

            {brand.websiteUrl && (
              <div className="space-y-1.5">
                <span className="font-semibold text-muted uppercase tracking-wider text-[11px]">
                  Website
                </span>
                <div>
                  <a
                    href={brand.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-ink hover:underline text-xs"
                  >
                    <Globe size={13} className="text-muted" />
                    <span>{brand.websiteUrl}</span>
                    <ExternalLink size={10} className="text-muted" />
                  </a>
                </div>
              </div>
            )}

            {Object.keys(social).some((k) => social[k]) && (
              <div className="space-y-2">
                <span className="font-semibold text-muted uppercase tracking-wider text-[11px]">
                  Official Channels
                </span>
                <div className="flex flex-wrap gap-2">
                  {social.instagram && (
                    <a href={social.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium hover:bg-soft transition-colors shadow-2xs">
                      <Instagram size={13} className="text-rose-600" /> Instagram <ExternalLink size={10} className="text-muted" />
                    </a>
                  )}
                  {social.youtube && (
                    <a href={social.youtube} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium hover:bg-soft transition-colors shadow-2xs">
                      <Youtube size={13} className="text-red-600" /> YouTube <ExternalLink size={10} className="text-muted" />
                    </a>
                  )}
                  {social.facebook && (
                    <a href={social.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium hover:bg-soft transition-colors shadow-2xs">
                      <Facebook size={13} className="text-blue-600" /> Facebook <ExternalLink size={10} className="text-muted" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {brand.campaigns && brand.campaigns.length > 0 && (
              <div className="space-y-2">
                <span className="font-semibold text-muted uppercase tracking-wider text-[11px]">
                  Active Campaigns ({brand.campaigns.length})
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {brand.campaigns.map((c) => (
                    <Link
                      key={c.id}
                      to={`/creator/campaigns/${c.id}`}
                      onClick={onClose}
                      className="rounded-2xl border border-line p-3 hover:border-ink/50 hover:bg-soft/40 transition-colors bg-white shadow-2xs"
                    >
                      {c.referenceNumber != null && (
                        <p className="font-mono text-[10px] font-semibold text-muted mb-0.5">
                          {formatReferenceNumber("campaign", c.referenceNumber)}
                        </p>
                      )}
                      <p className="font-medium text-sm text-ink line-clamp-1">{c.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {priceRangeLabel(c.priceRange, c.estimatedPrice)} · {c.platforms?.join(", ") || c.platform || "Social"}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-line px-6 py-4 flex items-center justify-between bg-white">
            {onMessage ? (
              <Button onClick={onMessage} className="inline-flex items-center gap-1.5 text-xs py-2 px-4">
                <MessageSquare size={13} />
                <span>Message</span>
              </Button>
            ) : <div />}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line bg-white hover:bg-soft px-5 py-2 text-xs font-medium text-ink shadow-2xs cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (type === "CREATOR" && creator) {
    const social = creator.socialLinks || {};
    const followerCounts = creator.followerCounts || {};
    const platforms = (creator.socialPlatforms ?? []).filter((p) => p !== "Other");
    const bannerUrl = resolveMediaUrl(creator.bannerImage);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
        <div
          role="dialog"
          aria-modal="true"
          className="relative flex w-full max-w-xl max-h-[min(90vh,680px)] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl"
        >
          {/* Banner */}
          <div className="relative h-32 sm:h-36 shrink-0 overflow-hidden bg-slate-900">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Cover Banner" className="h-full w-full object-cover" />
            ) : (
              <div className="relative h-full w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="flex items-center gap-2 text-xs font-medium text-white/50 tracking-wide">
                  <Sparkles size={14} className="text-white/60" />
                  <span>ChooseYourCreator Creator</span>
                </div>
              </div>
            )}
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-xs hover:bg-black/70 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Header below banner: square avatar overlapping banner on left, title & badges beside it */}
          <div className="relative border-b border-line bg-white px-6 pb-4 sm:px-7">
            <div className="flex items-center gap-4">
              <div className="-mt-12 sm:-mt-14 relative shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md w-20 h-20">
                <Avatar name={creator.name} image={creator.profileImage} size="h-full w-full" shape="square" />
              </div>
              <div className="min-w-0 flex-1 pt-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-ink truncate">{creator.name}</h2>
                  <VerifiedBadge isVerified={creator.isVerified} />
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  {creator.niche && (
                    <span className="rounded-full border border-line bg-white px-3 py-0.5 font-medium text-ink shadow-2xs">
                      {creator.niche}
                    </span>
                  )}
                  {creator.city && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-0.5 text-muted shadow-2xs">
                      <MapPin size={11} className="shrink-0" /> {creator.city}
                    </span>
                  )}
                  {creator.totalFollowers ? (
                    <span className="rounded-full border border-line bg-white px-3 py-0.5 font-semibold text-ink shadow-2xs">
                      {formatFollowerCount(creator.totalFollowers)} reach
                    </span>
                  ) : null}
                  {reviews.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 shadow-2xs">
                      <Star size={11} className="fill-amber-500 text-amber-500" />
                      <span>{(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}</span>
                      <span className="text-[10px] text-amber-600 font-normal">({reviews.length})</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {showAdminReference && creator.referenceNumber != null && (
              <div className="pt-2 flex items-center gap-1.5 text-xs font-mono text-amber-800">
                <Hash size={12} />
                <span>{formatReferenceNumber("creator", creator.referenceNumber)}</span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Admin-only contact info */}
            {showPhoneInAdmin && (creator.phone || creator.email) && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2">
                <span className="font-semibold text-emerald-900 uppercase tracking-wider text-[11px]">
                  Contact Information (Admin Eyes Only)
                </span>
                <div className="grid grid-cols-2 gap-3 text-emerald-950 font-mono">
                  {creator.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-700 shrink-0" />
                      <span>{creator.phone}</span>
                    </div>
                  )}
                  {creator.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={13} className="text-emerald-700 shrink-0" />
                      <span>{creator.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {creator.bio && (
              <div className="space-y-1.5">
                <span className="font-semibold text-muted uppercase tracking-wider text-[11px]">
                  About the Creator
                </span>
                <p className="text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">{creator.bio}</p>
              </div>
            )}

            {platforms.length > 0 && (
              <div className="space-y-2">
                <span className="font-semibold text-muted uppercase tracking-wider text-[11px]">
                  Audience & Platforms
                </span>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {platforms.map((platform) => {
                    const key = platform.toLowerCase();
                    const link = social[key] || social[platform];
                    const count = followerCounts[platform] ?? followerCounts[key];
                    const range = creator.followerRanges?.[platform] ?? creator.followerRanges?.[key];
                    return (
                      <div key={platform} className="rounded-2xl border border-line bg-white p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted">
                          <span>{platform}</span>
                          {link && (
                            <a href={link} target="_blank" rel="noreferrer" className="text-ink hover:underline shrink-0 inline-flex items-center gap-1">
                              <span>Profile</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                        <p className="mt-1 text-lg font-bold text-ink font-mono">
                          {count != null || range ? followerEstimateLabel(range, count) : "—"}
                        </p>
                        <p className="text-[10px] text-muted">estimated followers</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Brand Reviews */}
            {reviews.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-line">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-muted uppercase tracking-wider text-[11px]">
                    Brand Reviews ({reviews.length})
                  </span>
                  <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    ★ {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} / 5.0
                  </span>
                </div>
                <div className="space-y-2">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="rounded-2xl border border-line bg-soft/30 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={rev.brandName} image={rev.brandLogo} size="h-6 w-6" shape="square" />
                          <span className="font-semibold text-ink text-xs">{rev.brandName}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-600 text-xs font-semibold">
                          {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                        </div>
                      </div>
                      {rev.comment ? (
                        <p className="text-xs text-ink/90 italic">"{rev.comment}"</p>
                      ) : null}
                      <p className="text-[10px] text-muted">
                        Campaign: {rev.campaignTitle} · {formatDate(rev.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-line px-6 py-4 flex items-center justify-between bg-white">
            {onMessage ? (
              <Button onClick={onMessage} className="inline-flex items-center gap-1.5 text-xs py-2 px-4">
                <MessageSquare size={13} />
                <span>Message</span>
              </Button>
            ) : <div />}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-line bg-white hover:bg-soft px-5 py-2 text-xs font-medium text-ink shadow-2xs cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
