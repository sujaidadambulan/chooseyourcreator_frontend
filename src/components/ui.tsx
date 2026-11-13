import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api, apiUrl } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Footer } from "./Footer";
import { BRAND } from "../shared";

export function Logo({
  className = "",
  variant = "nav",
}: {
  className?: string;
  variant?: "nav" | "auth" | "footer" | "compact";
}) {
  return (
    <span
      className={`logo-frame logo-frame--${variant} ${className}`}
      role="img"
      aria-label={BRAND.name}
    >
      <img src={BRAND.logoPath} alt="" aria-hidden draggable={false} className="logo-frame__img" />
    </span>
  );
}

function resolveAvatarSrc(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/")) {
    return image;
  }
  return apiUrl(`/api/files/${image}`);
}

export function Avatar({
  image,
  name,
  size = "md",
  shape = "circle",
}: {
  image?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | string;
  shape?: "circle" | "square";
}) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = typeof size === "string" && !["sm", "md", "lg"].includes(size)
    ? size
    : {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-16 w-16 text-lg",
    }[size as "sm" | "md" | "lg"];

  const radiusClass = shape === "square" ? "rounded-2xl" : (sizeClasses.includes("rounded-") ? "" : "rounded-full");

  const initials = name
    ?.split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  if (image && !imageError) {
    return (
      <img
        src={resolveAvatarSrc(image)}
        alt={name || "Profile"}
        className={`${sizeClasses} ${radiusClass} object-cover bg-soft border border-line`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className={`${sizeClasses} ${radiusClass} bg-soft border border-line flex items-center justify-center font-medium text-muted`}>
      {initials}
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary: "bg-ink text-white hover:opacity-90 hover:shadow-md",
    secondary: "border border-line bg-white text-ink hover:bg-soft",
    ghost: "text-ink hover:bg-soft",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition duration-200 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${styles} ${className}`}
      {...props}
    />
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 hover:border-ink/20 focus:border-ink ${props.className ?? ""}`}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 hover:border-ink/20 focus:border-ink ${props.className ?? ""}`}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 hover:border-ink/20 focus:border-ink ${props.className ?? ""}`}
    />
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`interactive-surface rounded-3xl border border-line bg-white p-6 ${className}`}>
      {children}
    </div>
  );
}

export function Notice({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="rounded-2xl border border-line bg-soft px-4 py-3 text-sm">{message}</p>;
}

export function Loader({ variant = "inline" }: { variant?: "inline" | "screen" }) {
  const shell =
    variant === "screen"
      ? "loader-screen flex min-h-screen flex-col items-center justify-center gap-5"
      : "flex justify-center py-24";

  return (
    <div className={shell} role="status" aria-label="Loading">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="loader-ring" aria-hidden="true" />
        <div className="loader-mark relative z-10">
          <Logo variant="compact" />
        </div>
      </div>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        <span className="loader-dot" />
        <span className="loader-dot" />
        <span className="loader-dot" />
      </div>
    </div>
  );
}

export function Spinner() {
  return <Loader variant="inline" />;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-line px-6 py-16 text-center">
      <p className="text-lg">{title}</p>
      {body ? <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-3xl border border-line px-6 py-16 text-center">
      <p>{message}</p>
      {onRetry ? (
        <Button className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const label = status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return <span className="rounded-full border border-line px-3 py-1 text-xs tracking-wide">{label}</span>;
}

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    if (hasUnsavedChanges) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);
}

export function BackButton({
  to,
  label = "Back",
  hasUnsavedChanges = false,
  className = "",
}: {
  to?: string;
  label?: string;
  hasUnsavedChanges?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmLeave) return;
    }
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      <span>{label}</span>
    </button>
  );
}

type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
};

function NotificationBell() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ notifications: AppNotification[]; unreadCount: number }>("/api/notifications"),
    refetchInterval: 30000, // poll every 30s
  });

  const unreadCount = query.data?.unreadCount ?? 0;
  const notifications = query.data?.notifications ?? [];

  // Close drawer on outside click
  useEffect(() => {
    function handler(event: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setDrawerOpen(false);
      }
    }
    if (drawerOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  async function markRead(notification: AppNotification) {
    if (!notification.read) {
      await api(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    if (notification.link) {
      setDrawerOpen(false);
      navigate(notification.link);
    }
  }

  async function markAllRead() {
    await api("/api/notifications/read-all", { method: "POST" });
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const notifTypeIcon: Record<string, string> = {
    APPLICATION: "📋",
    INVITATION: "✉️",
    MESSAGE: "💬",
    AGREEMENT: "📄",
    SUBMISSION: "📤",
    PAYMENT: "💰",
    SYSTEM: "🔔",
  };

  return (
    <div className="relative" ref={drawerRef}>
      <button
        id="notification-bell"
        type="button"
        aria-label="Notifications"
        onClick={() => setDrawerOpen((prev) => !prev)}
        className="relative flex items-center justify-center rounded-full border border-line bg-white p-2.5 text-ink transition hover:bg-soft"
      >
        {/* Bell SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {/* Dropdown Drawer */}
      {drawerOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-3xl border border-line bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">
              Notifications
              {unreadCount > 0 ? (
                <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-medium text-white">
                  {unreadCount} new
                </span>
              ) : null}
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs text-muted underline hover:text-ink cursor-pointer"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-muted">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => void markRead(notif)}
                  className={`w-full px-4 py-3 text-left transition hover:bg-soft ${!notif.read ? "border-l-2 border-ink" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-base" aria-hidden>
                      {notifTypeIcon[notif.type] ?? "🔔"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold ${!notif.read ? "text-ink" : "text-muted"}`}>
                        {notif.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">{notif.message}</p>
                    </div>
                    {!notif.read ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink" />
                    ) : null}
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 ? (
            <div className="border-t border-line px-4 py-2 text-center">
              <p className="text-xs text-muted">Last {notifications.length} notifications</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function Shell({ links, children }: { links: { to: string; label: string }[]; children: ReactNode }) {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);

  async function signOut() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    }
    sessionStorage.removeItem("cyc_token");
    localStorage.removeItem("cyc_token");
    setUser(null);
    window.location.assign("/");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex min-h-[3.75rem] max-w-6xl items-center justify-between gap-4 px-5 py-2">
          <Link to={links[0]?.to ?? "/"} aria-label={`${BRAND.name} home`} className="logo-link shrink-0">
            <Logo variant="nav" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm transition-colors duration-200 ${isActive ? "bg-ink text-white" : "text-ink hover:bg-soft"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {user ? (
              <Link
                to={user.role === "BRAND" ? "/brand/profile" : "/creator/profile"}
                title={user.profileName ?? "Profile"}
                className="transition hover:opacity-80"
              >
                <Avatar name={user.profileName ?? "User"} image={user.profileImage} size="h-9 w-9" />
              </Link>
            ) : null}
            <button className="rounded-full border border-line px-3 py-2 text-sm md:hidden" onClick={() => setOpen((value) => !value)}>
              Menu
            </button>
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </div>
        {open ? (
          <div className="flex flex-col gap-1 px-5 pb-4 md:hidden">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end onClick={() => setOpen(false)} className="rounded-2xl px-3 py-2 text-sm hover:bg-soft">
                {link.label}
              </NavLink>
            ))}
          </div>
        ) : null}
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
      <Footer />
    </div>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-line/70 pt-4 px-2 text-xs text-muted">
      <span>
        Page <strong className="text-ink">{currentPage}</strong> of <strong className="text-ink">{totalPages}</strong>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-soft disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((page, idx, arr) => {
            const prev = arr[idx - 1];
            const showEllipsis = prev && page - prev > 1;
            return (
              <div key={page} className="flex items-center">
                {showEllipsis && <span className="px-1 text-muted">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`h-7 w-7 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    currentPage === page
                      ? "bg-ink text-white"
                      : "border border-line bg-white text-ink hover:bg-soft"
                  }`}
                >
                  {page}
                </button>
              </div>
            );
          })}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-soft disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading} className="text-xs">
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`text-xs ${variant === "danger" ? "!bg-rose-600 hover:!bg-rose-700 text-white" : ""}`}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PromptModal({
  isOpen,
  title,
  description,
  label,
  placeholder,
  submitText = "Submit",
  loading = false,
  onSubmit,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  submitText?: string;
  loading?: boolean;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        {description && <p className="text-xs text-muted leading-relaxed">{description}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (val.trim()) onSubmit(val.trim());
          }}
          className="space-y-4"
        >
          <Field label={label}>
            <TextInput
              autoFocus
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={placeholder}
              required
            />
          </Field>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button variant="secondary" type="button" onClick={onCancel} disabled={loading} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !val.trim()} className="text-xs">
              {loading ? "Saving..." : submitText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}



// ─── Change Password Card (OTP-based, for profile pages) ─────────────────────

export function ChangePasswordCard() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [code, setCode] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function resetAll() {
    setOpen(false);
    setSent(false);
    setDone(false);
    setCode("");
    setNewPw("");
    setConfirmPw("");
    setError(null);
    setCountdown(0);
  }

  async function sendOtp() {
    setError(null);
    setSending(true);
    try {
      await api<{ ok: boolean }>("/api/auth/email/send-change-password-otp", { method: "POST" });
      setCode("");
      setSent(true);
      setCountdown(60);
      // focus first OTP box
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setSending(false);
    }
  }

  async function resendOtp() {
    setError(null);
    setSending(true);
    try {
      await api<{ ok: boolean }>("/api/auth/email/send-change-password-otp", { method: "POST" });
      setCode("");
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    } finally {
      setSending(false);
    }
  }

  const digits = (code + "      ").slice(0, 6).split("");

  function handleDigit(idx: number, raw: string) {
    const stripped = raw.replace(/\D/g, "").slice(0, 6 - idx);
    const arr = digits.map((d) => (d === " " ? "" : d));
    for (let i = 0; i < stripped.length; i++) arr[idx + i] = stripped[i];
    const next = arr.join("").replace(/ /g, "").padEnd(6, " ").slice(0, 6).trimEnd();
    setCode(next);
    const nextIdx = Math.min(5, idx + Math.max(1, stripped.length));
    otpRefs.current[nextIdx]?.focus();
  }

  function handleDigitKey(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx].trim()) {
      e.preventDefault();
      if (idx > 0) {
        const arr = digits.map((d) => (d === " " ? "" : d));
        arr[idx - 1] = "";
        setCode(arr.join("").trimEnd());
        otpRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus();
    else if (e.key === "ArrowRight" && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.replace(/\s/g, "");
    if (cleanCode.length < 6) { setError("Enter all 6 digits of the verification code"); return; }
    if (newPw.length < 5) { setError("Password must be at least 5 characters"); return; }
    if (newPw !== confirmPw) { setError("Passwords do not match"); return; }
    setError(null);
    setSubmitting(true);
    try {
      await api("/api/auth/email/change-password", {
        method: "POST",
        body: JSON.stringify({ code: cleanCode, password: newPw, confirmPassword: confirmPw }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Done state ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-base">✓</div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Password updated</p>
            <p className="mt-0.5 text-xs text-emerald-700">You've been signed out of all other sessions.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Collapsed / idle state ──────────────────────────────────────────────────
  if (!open) {
    return (
      <div className="rounded-2xl border border-line bg-white px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">Password</p>
          <p className="text-xs text-muted mt-0.5">Change your account password</p>
        </div>
        <Button variant="secondary" className="text-xs shrink-0" onClick={() => { setOpen(true); void sendOtp(); }}>
          Change password
        </Button>
      </div>
    );
  }

  // ── Expanded form ───────────────────────────────────────────────────────────
  const codeComplete = code.replace(/\s/g, "").length === 6;
  const canSubmit = codeComplete && newPw.length >= 5 && newPw === confirmPw;

  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-ink">Change Password</p>
          <p className="text-xs text-muted mt-0.5">
            {sending ? "Sending code to your email…" : sent ? "Enter the code from your email and set a new password" : "Sending…"}
          </p>
        </div>
        <button type="button" onClick={resetAll} className="text-xs text-muted hover:text-ink transition-colors cursor-pointer shrink-0">
          Cancel
        </button>
      </div>

      <div className="px-5 py-5 space-y-5">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={(e) => void handleSubmit(e)}>
          {/* OTP Row */}
          <div>
            <p className="text-xs font-medium text-ink mb-3">Verification code</p>
            <div className="flex items-center gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={d.trim()}
                  disabled={submitting || !sent}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKey(i, e)}
                  onFocus={(e) => e.target.select()}
                  className="w-10 h-12 text-center text-lg font-bold rounded-xl border border-line bg-white focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all disabled:opacity-40"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
              <div className="ml-2 text-xs text-muted">
                {countdown > 0 ? (
                  <span>Resend in <strong className="text-ink">{countdown}s</strong></span>
                ) : (
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void resendOtp()}
                    className="font-medium text-ink hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    {sending ? "Sending…" : "Resend"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-line" />

          {/* New password */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">New password</label>
              <div className="relative">
                <TextInput
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Minimum 5 characters"
                  minLength={5}
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink cursor-pointer"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              {newPw.length > 0 && newPw.length < 5 && (
                <p className="mt-1 text-xs text-rose-600">At least 5 characters required</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">Confirm new password</label>
              <TextInput
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter new password"
                disabled={submitting}
                required
              />
              {confirmPw.length > 0 && confirmPw !== newPw && (
                <p className="mt-1 text-xs text-rose-600">Passwords do not match</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !canSubmit || !sent}
          >
            {submitting ? "Updating password…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
