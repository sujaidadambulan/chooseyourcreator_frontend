import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { BRAND } from "../shared";
import { Button } from "./ui";

export function ShareButton({
  title = `Check this out on ${BRAND.name}`,
  text = "",
  url,
  variant = "secondary",
  size = "md",
  className = "",
  label = "Share",
}: {
  title?: string;
  text?: string;
  url?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const targetUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  async function handleShare() {
    // If mobile share is supported, try native share first
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url: targetUrl,
        });
        return;
      } catch (err) {
        // Fallback to copy modal if dismissed or failed
        if ((err as Error).name === "AbortError") return;
      }
    }
    // Fallback: Copy to clipboard and toggle visual indicator
    await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShowModal(true);
    }
  }

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        variant={variant}
        onClick={() => void handleShare()}
        className={`inline-flex items-center gap-1.5 transition-all ${className} ${
          copied ? "!border-emerald-500 !text-emerald-700 bg-emerald-50" : ""
        }`}
      >
        {copied ? (
          <>
            <Check size={size === "sm" ? 14 : 16} className="text-emerald-600 animate-in zoom-in-50" />
            <span>Copied link!</span>
          </>
        ) : (
          <>
            <Share2 size={size === "sm" ? 14 : 16} />
            <span>{label}</span>
          </>
        )}
      </Button>

      {/* Manual copy modal fallback */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl animate-in zoom-in-95">
            <h3 className="text-lg font-medium">Share link</h3>
            <p className="mt-1 text-sm text-muted">Copy this direct link to share with anyone:</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-soft/50 p-2 text-xs">
              <input
                readOnly
                value={targetUrl}
                className="w-full bg-transparent outline-none font-mono text-ink select-all"
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={() => void copyLink()}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1 text-white hover:bg-ink/90 cursor-pointer"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
