import { FOLLOWER_ESTIMATES, PLATFORMS } from "../shared/index";
import { Field, SelectInput, TextInput } from "./ui";

export type SocialDraft = {
  platforms: string[];
  links: Record<string, string>;
  ranges: Record<string, string>;
};

const LINK_KEY: Record<string, string> = {
  Instagram: "instagram",
  YouTube: "youtube",
  Facebook: "facebook",
};

export function SocialAccounts({
  value,
  onChange,
  errors = {},
}: {
  value: SocialDraft;
  onChange: (next: SocialDraft) => void;
  errors?: Record<string, string>;
}) {
  function toggle(platform: string) {
    const selected = value.platforms.includes(platform);
    onChange({
      ...value,
      platforms: selected ? value.platforms.filter((item) => item !== platform) : [...value.platforms, platform],
    });
  }

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium">Social platforms *</legend>
        {errors.social ? (
          <p className="mt-1 text-xs text-rose-600 font-medium">{errors.social}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {PLATFORMS.filter((platform) => platform !== "Other").map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => toggle(platform)}
              className={`rounded-full border px-4 py-2 text-sm ${value.platforms.includes(platform) ? "border-ink bg-ink text-white" : "border-line"}`}
            >
              {platform}
            </button>
          ))}
        </div>
      </fieldset>
      {value.platforms.map((platform) => {
        const key = LINK_KEY[platform] ?? platform.toLowerCase();
        return (
          <div key={platform} className="space-y-3 rounded-3xl border border-line p-4">
            <p className="font-medium">{platform}</p>
            <div>
              <Field label="Profile URL *">
                <TextInput
                  placeholder={`https://${key}.com/yourname`}
                  value={value.links[key] ?? ""}
                  onChange={(event) => onChange({ ...value, links: { ...value.links, [key]: event.target.value } })}
                />
              </Field>
              {errors[`social_${key}`] ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors[`social_${key}`]}</p>
              ) : null}
            </div>
            <div>
              <Field label="Estimated followers">
                <SelectInput
                  value={value.ranges[platform] ?? ""}
                  onChange={(event) => onChange({ ...value, ranges: { ...value.ranges, [platform]: event.target.value } })}
                >
                  <option value="">Select a range</option>
                  {FOLLOWER_ESTIMATES.map((range) => (
                    <option key={range.id} value={range.id}>{range.label}</option>
                  ))}
                </SelectInput>
              </Field>
              {errors[`range_${platform}`] ? (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors[`range_${platform}`]}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
