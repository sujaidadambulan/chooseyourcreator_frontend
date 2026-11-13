import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { NICHES, PLATFORMS, PRICE_RANGES } from "../shared/index";
import { Button, Field, Notice, SelectInput, TextArea, TextInput } from "./ui";
import { api } from "../lib/api";

export type EditableCampaign = {
  id: string;
  title: string;
  productName: string;
  productDetails: string;
  description: string;
  campaignType: string;
  niche: string;
  platform?: string;
  platforms?: string[];
  priceRange?: string;
  estimatedPrice?: number;
  creatorSlots: number;
  startDate?: string;
  endDate?: string;
  deliverables: string;
  requirements: string;
  instructions?: string;
  performanceTerms?: string;
  status?: string;
};

export function EditCampaignModal({
  campaign,
  isOpen,
  onClose,
  onSuccess,
}: {
  campaign: EditableCampaign;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    title: campaign.title || "",
    productName: campaign.productName || "",
    productDetails: campaign.productDetails || "",
    description: campaign.description || "",
    campaignType: (campaign.campaignType as "PUBLIC" | "PRIVATE") || "PUBLIC",
    niche: campaign.niche || "Fitness",
    platforms: (campaign.platforms?.length ? campaign.platforms : [campaign.platform || "Instagram"]) as string[],
    priceRange: campaign.priceRange || "under-10k",
    creatorSlots: campaign.creatorSlots || 1,
    deliverables: campaign.deliverables || "",
    requirements: campaign.requirements || "",
    instructions: campaign.instructions || "",
    performanceTerms: campaign.performanceTerms || "",
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function togglePlatform(p: string) {
    setForm((current) => ({
      ...current,
      platforms: current.platforms.includes(p)
        ? current.platforms.filter((x) => x !== p)
        : [...current.platforms, p],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Please enter a campaign title.");
      return;
    }
    if (!form.productName.trim()) {
      setError("Please enter a product name.");
      return;
    }
    if (form.platforms.length === 0) {
      setError("Please select at least one social media platform.");
      return;
    }
    if (form.creatorSlots < 1) {
      setError("Creator slots must be at least 1.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await api(`/api/campaigns/${campaign.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: form.title.trim(),
          productName: form.productName.trim(),
          productDetails: form.productDetails.trim(),
          description: form.description.trim(),
          campaignType: form.campaignType,
          niche: form.niche,
          platforms: form.platforms,
          priceRange: form.priceRange,
          creatorSlots: Number(form.creatorSlots),
          deliverables: form.deliverables.trim(),
          requirements: form.requirements.trim(),
          instructions: form.instructions.trim(),
          performanceTerms: form.performanceTerms.trim(),
        }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update campaign");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-line bg-white p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 className="text-xl font-medium text-ink">Edit Campaign</h2>
            <p className="text-xs text-muted">Update details, deliverables, or creator slots</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-soft hover:text-ink cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-5 space-y-4">
          <Notice message={error} />

          <Field label="Campaign Title *">
            <TextInput
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Product Name *">
              <TextInput
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                required
              />
            </Field>

            <Field label="Niche">
              <SelectInput
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
              >
                {NICHES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-2">
              Campaign Visibility
            </label>
            <div className="flex gap-3">
              {(["PUBLIC", "PRIVATE"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, campaignType: type })}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    form.campaignType === type
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-muted hover:border-ink/50"
                  }`}
                >
                  {type === "PUBLIC" ? "🌐 Public" : "🔒 Private (Invite Only)"}
                </button>
              ))}
            </div>
          </div>

          <Field label="Product Details">
            <TextArea
              rows={2}
              value={form.productDetails}
              onChange={(e) => setForm({ ...form, productDetails: e.target.value })}
            />
          </Field>

          <Field label="Campaign Overview / Description">
            <TextArea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted block mb-2">
              Target Platforms *
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = form.platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`rounded-full px-3.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                      active
                        ? "bg-ink text-white border-ink"
                        : "bg-white text-muted border-line hover:border-ink/50"
                    }`}
                  >
                    {p} {active ? "✓" : "+"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Budget Range">
              <SelectInput
                value={form.priceRange}
                onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
              >
                {PRICE_RANGES.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Creator Slots">
              <TextInput
                type="number"
                min={1}
                max={50}
                value={form.creatorSlots}
                onChange={(e) => setForm({ ...form, creatorSlots: Number(e.target.value) })}
                required
              />
            </Field>
          </div>

          <Field label="Required Deliverables *">
            <TextArea
              rows={2}
              value={form.deliverables}
              onChange={(e) => setForm({ ...form, deliverables: e.target.value })}
              placeholder="e.g. 1 Instagram Reel + 2 Stories"
              required
            />
          </Field>

          <Field label="Creative Requirements & Guidelines *">
            <TextArea
              rows={2}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              placeholder="Key message, brand mentions, dos and don'ts"
              required
            />
          </Field>

          <Field label="Additional Instructions (Optional)">
            <TextArea
              rows={2}
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving changes..." : "Save Campaign"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
