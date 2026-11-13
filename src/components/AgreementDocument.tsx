import { useState, type FormEvent } from "react";
import { CheckCircle2, Download, FileText, ShieldCheck } from "lucide-react";
import { BRAND, formatInr, formatDate } from "../shared/index";
import { Button, Field, Notice, StatusPill, TextInput } from "./ui";
import { ShareButton } from "./ShareButton";
import { apiUrl } from "../lib/api";

export type AgreementData = {
  companyName?: string;
  companyInfo?: string;
  creatorName?: string;
  campaignName?: string;
  productName?: string;
  productDetails?: string;
  startDate?: string;
  endDate?: string;
  deliverables?: string;
  platform?: string;
  contentRequirements?: string;
  initialPayment?: string;
  initialPaymentPaise?: number;
  performanceAmountPaise?: number;
  performanceTerms?: string;
  performanceTiers?: Array<{ views: number; amount: number; label?: string }>;
  additionalConditions?: string;
  brandSignedAt?: string;
  brandSignatureName?: string;
  creatorSignatureName?: string;
  creatorSignedAt?: string;
};

export type FullAgreement = {
  id: string;
  campaignId: string;
  brandId: string;
  creatorId: string;
  status: string;
  campaignStartDate?: string | null;
  campaignEndDate?: string | null;
  creatorSignedAt?: string | null;
  creatorSignatureName?: string | null;
  brandSignedAt?: string | null;
  brandSignatureName?: string | null;
  agreementData: AgreementData | Record<string, unknown>;
  pdfKey?: string | null;
  signedPdfKey?: string | null;
  campaign?: {
    id: string;
    title: string;
    platform?: string;
    brand?: { companyName: string; companyLogo?: string | null };
  };
  collaboration?: {
    creator?: { name: string; profileImage?: string | null; niche?: string };
  };
};

export function AgreementDocument({
  agreement,
  userRole,
  onCreatorSign,
  onBrandSign,
  signing,
}: {
  agreement: FullAgreement;
  userRole?: "BRAND" | "CREATOR" | "ADMIN" | null;
  onCreatorSign?: (signatureName: string) => Promise<void>;
  onBrandSign?: (brandSignatureName: string) => Promise<void>;
  signing?: boolean;
}) {
  const data = (agreement.agreementData || {}) as AgreementData;

  const [creatorNameInput, setCreatorNameInput] = useState("");
  const [creatorConsent, setCreatorConsent] = useState(false);
  const [brandNameInput, setBrandNameInput] = useState(data.brandSignatureName || data.companyName || "");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const brandName = data.companyName || agreement.campaign?.brand?.companyName || "Brand Partner";
  const creatorName = data.creatorName || agreement.collaboration?.creator?.name || "Creator";
  const campaignTitle = data.campaignName || agreement.campaign?.title || "Campaign";

  const brandSigned = Boolean(agreement.brandSignedAt || data.brandSignedAt);
  const brandSignName = agreement.brandSignatureName || data.brandSignatureName || brandName;
  const brandSignDate = agreement.brandSignedAt ? formatDate(agreement.brandSignedAt) : data.brandSignedAt || "Signed on creation";

  const creatorSigned = Boolean(agreement.creatorSignedAt || data.creatorSignedAt);
  const creatorSignName = agreement.creatorSignatureName || data.creatorSignatureName;
  const creatorSignDate = agreement.creatorSignedAt ? formatDate(agreement.creatorSignedAt) : data.creatorSignedAt;

  const canCreatorSign = userRole === "CREATOR" && !creatorSigned && (agreement.status === "SENT" || agreement.status === "VIEWED");
  const canBrandSign = userRole === "BRAND" && !brandSigned;

  async function handleCreatorSubmit(e: FormEvent) {
    e.preventDefault();
    if (!creatorConsent) {
      setErrorNotice("Please confirm your consent to legally sign this agreement.");
      return;
    }
    if (!creatorNameInput.trim()) {
      setErrorNotice("Please type your legal full name.");
      return;
    }
    setErrorNotice(null);
    try {
      if (onCreatorSign) await onCreatorSign(creatorNameInput.trim());
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : "Failed to sign agreement");
    }
  }

  async function handleBrandSubmit(e: FormEvent) {
    e.preventDefault();
    if (!brandNameInput.trim()) {
      setErrorNotice("Please enter authorized signatory name.");
      return;
    }
    setErrorNotice(null);
    try {
      if (onBrandSign) await onBrandSign(brandNameInput.trim());
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : "Failed to sign agreement");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/80 p-4 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <FileText className="text-muted" size={20} />
          <div>
            <span className="text-xs font-mono text-muted uppercase tracking-wider">Agreement Ref: {agreement.id.slice(0, 10)}</span>
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-ink">{campaignTitle}</h2>
              <StatusPill status={agreement.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton
            label="Share"
            size="sm"
            title={`Collaboration Agreement for ${campaignTitle}`}
          />
          <a
            href={apiUrl(`/api/agreements/${agreement.id}/pdf`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5"
          >
            <Button variant="secondary" className="!py-1.5 !px-3 text-xs">
              <Download size={14} />
              <span>Download PDF</span>
            </Button>
          </a>
        </div>
      </div>

      <Notice message={errorNotice} />

      {/* Main Legal Agreement Document Paper */}
      <div className="rounded-3xl border border-line/80 bg-white p-8 md:p-12 shadow-sm space-y-8 font-sans">
        {/* Document Header */}
        <div className="border-b border-line pb-6 text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-soft px-3.5 py-1 text-xs font-medium text-muted">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>{BRAND.name} Verified Contract</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-medium tracking-tight text-ink">
            Influencer Collaboration Agreement
          </h1>
          <p className="text-xs text-muted max-w-md mx-auto">
            This legally binding agreement sets forth the mutual terms, deliverables, and performance covenants between Brand and Creator.
          </p>
        </div>

        {/* Parties Two-Column Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line/60 bg-soft/30 p-5 space-y-1">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Party A (The Brand)</span>
            <h3 className="text-base font-semibold text-ink">{brandName}</h3>
            {data.companyInfo ? <p className="text-xs text-muted line-clamp-2">{data.companyInfo}</p> : null}
            <div className="pt-2 text-xs text-muted">
              <span>Authorized Signatory: </span>
              <span className="font-medium text-ink">{brandSignName}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-line/60 bg-soft/30 p-5 space-y-1">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Party B (The Creator)</span>
            <h3 className="text-base font-semibold text-ink">{creatorName}</h3>
            <p className="text-xs text-muted">Platform: {data.platform || "Social Media"}</p>
            <div className="pt-2 text-xs text-muted">
              <span>Designated Signatory: </span>
              <span className="font-medium text-ink">{creatorSignName || creatorName}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Campaign Scope & Deliverables */}
        <div className="space-y-3 border-t border-line/60 pt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">1. Scope of Work & Deliverables</h4>
          <div className="rounded-2xl border border-line/70 bg-soft/20 p-4 space-y-2 text-sm">
            <div>
              <span className="font-medium text-ink">Product / Campaign: </span>
              <span className="text-ink">{data.productName ? `${data.productName} — ` : ""}{campaignTitle}</span>
            </div>
            {data.productDetails && (
              <p className="text-xs text-muted leading-relaxed">
                <span className="font-medium text-ink">Product Details: </span>{data.productDetails}
              </p>
            )}
            <div className="border-t border-line/40 pt-2">
              <span className="font-medium text-ink">Required Deliverables: </span>
              <p className="mt-1 text-sm text-ink whitespace-pre-wrap">{data.deliverables || "As specified in campaign guidelines."}</p>
            </div>
            {data.contentRequirements && (
              <div className="border-t border-line/40 pt-2">
                <span className="font-medium text-ink">Content & Creative Guidelines: </span>
                <p className="mt-1 text-xs text-muted whitespace-pre-wrap">{data.contentRequirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Compensation & Escrow Terms */}
        <div className="space-y-3 border-t border-line/60 pt-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">2. Financial Terms & Escrow Protection</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-line/70 bg-emerald-50/40 p-4 space-y-1">
              <span className="text-xs text-emerald-800 font-medium">Guaranteed Initial Payment</span>
              <div className="text-xl font-bold text-emerald-950 font-mono">
                {data.initialPaymentPaise ? formatInr(data.initialPaymentPaise) : data.initialPayment || "To be specified"}
              </div>
              <p className="text-[11px] text-emerald-800/80">
                Secured in escrow before content production and released upon brand approval.
              </p>
            </div>

            <div className="rounded-2xl border border-line/70 bg-soft/40 p-4 space-y-1">
              <span className="text-xs text-muted font-medium">Timeline & Validity</span>
              <div className="text-sm font-medium text-ink">
                {data.startDate || "Start Date"} — {data.endDate || "End Date"}
              </div>
              <p className="text-[11px] text-muted">
                Deliverables must be submitted before the designated campaign end date.
              </p>
            </div>
          </div>

          {/* Performance Bonus Tiers if present */}
          {(data.performanceTiers && data.performanceTiers.length > 0) || data.performanceTerms ? (
            <div className="rounded-2xl border border-line/70 bg-soft/20 p-4 space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Performance Incentive Tiers</span>
              {data.performanceTerms && (
                <p className="text-xs text-muted">{data.performanceTerms}</p>
              )}
              {data.performanceTiers && data.performanceTiers.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-line text-muted">
                        <th className="py-1.5 font-medium">Milestone / Views Target</th>
                        <th className="py-1.5 font-medium text-right">Incentive Payout</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/40">
                      {data.performanceTiers.map((tier, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 font-medium text-ink">
                            {tier.label || `Tier ${idx + 1}`}: {tier.views.toLocaleString("en-IN")} views
                          </td>
                          <td className="py-1.5 font-mono text-emerald-700 font-semibold text-right">
                            {formatInr(tier.amount * 100)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Section 3: Standard Terms & Conditions */}
        <div className="space-y-2 border-t border-line/60 pt-6 text-xs text-muted leading-relaxed">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">3. Legal Provisions</h4>
          <p>
            <strong>Intellectual Property:</strong> Creator grants Brand non-exclusive digital rights to repost and promote the agreed deliverables across brand social channels.
          </p>
          <p>
            <strong>Professional Compliance:</strong> Creator agrees to adhere to ASCI disclosure guidelines (e.g., #ad, #collab) and maintain campaign authenticity.
          </p>
          {data.additionalConditions ? (
            <p>
              <strong>Special Conditions: </strong>{data.additionalConditions}
            </p>
          ) : null}
        </div>

        {/* Dual Signatures Block */}
        <div className="border-t-2 border-dashed border-line pt-8 space-y-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted text-center">
            Signatures of Authorized Parties
          </h4>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Brand Signature Box */}
            <div className="rounded-2xl border border-line bg-soft/30 p-5 flex flex-col justify-between min-h-[170px]">
              <div>
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Brand Authorized Signatory</span>
                <p className="mt-1 text-sm font-medium text-ink">{brandName}</p>
              </div>

              {brandSigned ? (
                <div className="mt-4 pt-3 border-t border-line/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 size={15} />
                    <span>Signed Digitally</span>
                  </div>
                  <div className="font-serif italic text-lg text-ink/90">{brandSignName}</div>
                  <p className="text-[10px] text-muted font-mono">{brandSignDate}</p>
                </div>
              ) : canBrandSign ? (
                <form className="mt-4 space-y-2" onSubmit={(e) => void handleBrandSubmit(e)}>
                  <TextInput
                    placeholder="Type brand signatory name"
                    value={brandNameInput}
                    onChange={(e) => setBrandNameInput(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={signing} className="w-full text-xs !py-1.5">
                    {signing ? "Signing..." : "Sign as Brand Representative"}
                  </Button>
                </form>
              ) : (
                <div className="mt-4 pt-3 border-t border-line/60 text-xs text-muted italic">
                  Pending brand authorized signature
                </div>
              )}
            </div>

            {/* Creator Signature Box */}
            <div className="rounded-2xl border border-line bg-soft/30 p-5 flex flex-col justify-between min-h-[170px]">
              <div>
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Creator Signature</span>
                <p className="mt-1 text-sm font-medium text-ink">{creatorName}</p>
              </div>

              {creatorSigned ? (
                <div className="mt-4 pt-3 border-t border-line/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 size={15} />
                    <span>Signed Digitally</span>
                  </div>
                  <div className="font-serif italic text-lg text-ink/90">{creatorSignName}</div>
                  <p className="text-[10px] text-muted font-mono">{creatorSignDate}</p>
                </div>
              ) : canCreatorSign ? (
                <form className="mt-4 space-y-3" onSubmit={(e) => void handleCreatorSubmit(e)}>
                  <Field label="Type your legal name to sign">
                    <TextInput
                      placeholder="e.g. Full Legal Name"
                      value={creatorNameInput}
                      onChange={(e) => setCreatorNameInput(e.target.value)}
                      required
                    />
                  </Field>
                  <label className="flex items-start gap-2 text-xs text-ink/90 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={creatorConsent}
                      onChange={(e) => setCreatorConsent(e.target.checked)}
                      className="mt-0.5 rounded border-line"
                    />
                    <span>I confirm I have reviewed and agree to the campaign requirements and legal terms.</span>
                  </label>
                  <Button type="submit" disabled={signing} className="w-full">
                    {signing ? "Signing..." : "Sign agreement →"}
                  </Button>
                </form>
              ) : (
                <div className="mt-4 pt-3 border-t border-line/60 text-xs text-muted italic">
                  Pending creator signature
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
