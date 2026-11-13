import { Building2, UserRound, ArrowLeft, Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, Logo, Notice, TextInput } from "../components/ui";
import { Reveal } from "../components/motion";
import { api, apiUrl, ApiError } from "../lib/api";
import { consumeUrlError, formatApiError } from "../lib/errors";
import { chosenRole, destinationFor, popOAuthError, useAuth, type SessionUser } from "../lib/auth";

function AuthFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <Link to="/" className="logo-link mb-10 mx-auto block w-fit">
        <Logo variant="auth" />
      </Link>
      <Reveal>
        <h1 className="text-center text-2xl font-medium">{title}</h1>
        {subtitle && <p className="mt-2 text-center text-sm text-muted">{subtitle}</p>}
        <div className="mt-8 space-y-4">{children}</div>
      </Reveal>
    </div>
  );
}

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = (value + "      ").slice(0, 6).split("");

  function handleChange(idx: number, raw: string) {
    const stripped = raw.replace(/\D/g, "").slice(0, 6 - idx);
    const arr = digits.map((d) => (d === " " ? "" : d));
    for (let i = 0; i < stripped.length; i++) arr[idx + i] = stripped[i];
    const next = arr.join("").replace(/ /g, "").padEnd(6, " ").slice(0, 6).trimEnd();
    onChange(next);
    const nextIdx = Math.min(5, idx + Math.max(1, stripped.length));
    refs.current[nextIdx]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx].trim()) {
      e.preventDefault();
      if (idx > 0) {
        const arr = digits.map((d) => (d === " " ? "" : d));
        arr[idx - 1] = "";
        onChange(arr.join("").trimEnd());
        refs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={d.trim()}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-12 h-14 text-center text-xl font-bold rounded-2xl border border-line bg-white focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all disabled:opacity-50"
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ─── Resend Countdown ─────────────────────────────────────────────────────────

function ResendButton({ onResend, disabled }: { onResend: () => Promise<void>; disabled?: boolean }) {
  const [countdown, setCountdown] = useState(60);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleResend() {
    setSending(true);
    setError(null);
    try {
      await onResend();
      setCountdown(60);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="text-center space-y-1">
      {error && <Notice message={error} variant="error" title="Could not resend" />}
      {countdown > 0 ? (
        <p className="text-sm text-muted">
          Resend code in <span className="font-semibold text-ink">{countdown}s</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={sending || disabled}
          className="text-sm font-medium text-ink hover:underline disabled:opacity-50 cursor-pointer"
        >
          {sending ? "Sending…" : "Resend code"}
        </button>
      )}
    </div>
  );
}

// ─── Email OTP Screen (Signup) ────────────────────────────────────────────────

function SignupOtpScreen({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function resendOtp() {
    await api<{ ok: boolean }>("/api/auth/email/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email, type: "SIGNUP" }),
    });
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (code.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      const data = await api<{ user: SessionUser; token?: string }>("/api/auth/email/verify-signup", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      if (data.token) sessionStorage.setItem("cyc_token", data.token);
      setUser(data.user);
      navigate(destinationFor(data.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <AuthFrame title="Verify your email" subtitle={`We sent a 6-digit code to ${email}`}>
      <div className="flex items-center justify-center">
        <div className="rounded-full bg-soft p-4">
          <Mail size={28} className="text-ink" />
        </div>
      </div>
      <form className="space-y-5" onSubmit={(e) => void handleVerify(e)}>
        <Notice message={error} variant="error" />
        <OtpInput value={code} onChange={setCode} disabled={verifying} />
        <Button className="w-full" type="submit" disabled={verifying || code.length < 6}>
          {verifying ? "Verifying…" : "Verify email"}
        </Button>
      </form>
      <ResendButton onResend={resendOtp} disabled={verifying} />
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mx-auto cursor-pointer"
      >
        <ArrowLeft size={14} /> Change email or go back
      </button>
    </AuthFrame>
  );
}

// ─── Forgot Password OTP Screen ───────────────────────────────────────────────

function ResetOtpScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submittingReset, setSubmittingReset] = useState(false);

  async function resendOtp() {
    await api<{ ok: boolean }>("/api/auth/email/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email, type: "RESET" }),
    });
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (code.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      const data = await api<{ ok: boolean; resetToken: string }>("/api/auth/email/verify-reset-otp", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      setResetToken(data.resetToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 5) {
      setError("Password must be at least 5 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setSubmittingReset(true);
    try {
      await api("/api/auth/email/reset-password", {
        method: "POST",
        body: JSON.stringify({ resetToken, password: newPassword, confirmPassword }),
      });
      navigate("/sign-in?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setSubmittingReset(false);
    }
  }

  if (resetToken) {
    return (
      <AuthFrame title="Create new password" subtitle="Enter your new password below">
        <form className="space-y-4" onSubmit={(e) => void handleResetPassword(e)}>
          <Notice message={error} variant="error" />
          <div>
            <Field label="New password">
              <div className="relative">
                <TextInput
                  type={showPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={5}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            {newPassword.length > 0 && newPassword.length < 5 && (
              <p className="mt-1 text-xs text-rose-600 font-medium">
                Password must be at least 5 characters
              </p>
            )}
          </div>
          <Field label="Confirm password">
            <TextInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Field>
          {confirmPassword.length > 0 && confirmPassword !== newPassword && (
            <p className="text-xs text-rose-600 font-medium">Passwords do not match</p>
          )}
          <Button
            className="w-full"
            type="submit"
            disabled={submittingReset || newPassword.length < 5 || newPassword !== confirmPassword}
          >
            {submittingReset ? "Updating…" : "Update password"}
          </Button>
        </form>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Enter the code" subtitle={`We sent a reset code to ${email}`}>
      <div className="flex items-center justify-center">
        <div className="rounded-full bg-soft p-4">
          <KeyRound size={28} className="text-ink" />
        </div>
      </div>
      <form className="space-y-5" onSubmit={(e) => void handleVerifyOtp(e)}>
        <Notice message={error} variant="error" />
        <OtpInput value={code} onChange={setCode} disabled={verifying} />
        <Button className="w-full" type="submit" disabled={verifying || code.length < 6}>
          {verifying ? "Verifying…" : "Verify code"}
        </Button>
      </form>
      <ResendButton onResend={resendOtp} disabled={verifying} />
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mx-auto cursor-pointer"
      >
        <ArrowLeft size={14} /> Use a different email
      </button>
    </AuthFrame>
  );
}

// ─── Role Page ────────────────────────────────────────────────────────────────

export function RolePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(role: "BRAND" | "CREATOR") {
    if (user && !user.role) {
      setSubmitting(true);
      setError(null);
      try {
        const data = await api<{ user: SessionUser }>("/api/auth/role", {
          method: "POST",
          body: JSON.stringify({ role }),
        });
        setUser(data.user);
        navigate(destinationFor(data.user));
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to select role");
      } finally {
        setSubmitting(false);
      }
    }
    sessionStorage.setItem("cyc_role", role);
    navigate("/sign-up");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 py-16">
      <Link to="/" className="logo-link mb-2 block w-fit">
        <Logo variant="auth" />
      </Link>
      <Reveal>
        <p className="mt-10 text-center text-lg text-muted">Choose how you want to get started.</p>
        {error ? <div className="mt-4 w-full"><Notice message={error} variant="error" /></div> : null}
        <div className="mt-10 grid w-full gap-5 md:grid-cols-2">
          <article className="interactive-surface rounded-3xl border border-line p-8 text-center">
            <UserRound className="mx-auto" strokeWidth={1.5} />
            <h2 className="mt-6 text-2xl font-medium">Creator</h2>
            <p className="mt-2 text-sm text-muted">Showcase your work and connect with brands.</p>
            <Button className="mt-8 w-full" disabled={submitting} onClick={() => void choose("CREATOR")}>
              {submitting ? "Saving..." : "Continue as Creator →"}
            </Button>
          </article>
          <article className="interactive-surface rounded-3xl border border-line p-8 text-center">
            <Building2 className="mx-auto" strokeWidth={1.5} />
            <h2 className="mt-6 text-2xl font-medium">Brand</h2>
            <p className="mt-2 text-sm text-muted">Discover creators and build collaborations.</p>
            <Button className="mt-8 w-full" disabled={submitting} onClick={() => void choose("BRAND")}>
              {submitting ? "Saving..." : "Continue as Brand →"}
            </Button>
          </article>
        </div>
        <Link to="/sign-in" className="mt-8 block text-center text-sm text-muted interactive-link">
          Already have an account? Sign in
        </Link>
      </Reveal>
    </div>
  );
}

// ─── Sign Up Page ─────────────────────────────────────────────────────────────

export function SignUpPage() {
  const navigate = useNavigate();
  const { setUser: _setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const role = chosenRole();

  useEffect(() => {
    const urlErr = consumeUrlError();
    const oauthErr = popOAuthError();
    if (urlErr) setError(urlErr);
    else if (oauthErr) setError(oauthErr);
  }, []);

  const passwordError =
    passwordTouched && password.length < 5
      ? "Password must be at least 5 characters long."
      : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPasswordTouched(true);
    setPhoneTouched(true);
    if (password.length < 5) return;
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (/@gmial\.com$/i.test(normalizedEmail)) {
      setError("Did you mean gmail.com? Check your email spelling and try again.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api<{ ok: boolean; email: string }>("/api/auth/email/send-verification", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail, phone: phone.trim(), password, role }),
      });
      setOtpSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(`${formatApiError(err)} Try signing in instead, or use a different email or phone number.`);
      } else if (err instanceof ApiError && err.status === 500) {
        setError(
          "We couldn't send the verification email. Check the email address, try Google sign-in, or contact support if this continues.",
        );
      } else {
        setError(formatApiError(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (otpSent) {
    return (
      <SignupOtpScreen
        email={email.trim()}
        onBack={() => setOtpSent(false)}
      />
    );
  }

  return (
    <AuthFrame title="Create your account">
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <Notice message={error} variant="error" title="Sign up couldn't continue" />
        <Field label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <div>
          <Field label="Phone number">
            <TextInput
              type="tel"
              placeholder="e.g. 98765 43210"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                if (!phoneTouched) setPhoneTouched(true);
              }}
              onBlur={() => setPhoneTouched(true)}
              required
            />
          </Field>
          <p className="mt-1 text-xs text-muted">
            Kept confidential for account verification. Never displayed publicly.
          </p>
        </div>
        <div>
          <Field label="Password">
            <TextInput
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (!passwordTouched) setPasswordTouched(true);
              }}
              onBlur={() => setPasswordTouched(true)}
              minLength={5}
              required
            />
          </Field>
          {passwordError ? (
            <p className="mt-1 text-xs text-rose-600 font-medium" role="alert">
              {passwordError}
            </p>
          ) : null}
        </div>
        <Button className="w-full" type="submit" disabled={submitting || password.length < 5}>
          {submitting ? "Sending verification code…" : "Continue"}
        </Button>
      </form>
      <div className="space-y-3">
        <Button
          variant="secondary"
          className="w-full"
          type="button"
          onClick={() => {
            window.location.href = apiUrl(`/api/auth/google${role ? `?role=${role}` : ""}`);
          }}
        >
          Continue with Google
        </Button>
        <Button variant="secondary" className="w-full" type="button" onClick={() => navigate("/phone")}>
          Continue with phone
        </Button>
      </div>
      <p className="text-center text-sm text-muted">
        <Link to="/sign-in">Sign in</Link>
      </p>
    </AuthFrame>
  );
}

// ─── Sign In Page ─────────────────────────────────────────────────────────────

export function SignInPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const urlErr = consumeUrlError();
    const oauthErr = popOAuthError();
    if (urlErr) setError(urlErr);
    else if (oauthErr) setError(oauthErr);
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") setResetSuccess(true);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const data = await api<{ user: SessionUser; token?: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (data.token) sessionStorage.setItem("cyc_token", data.token);
      setUser(data.user);
      navigate(destinationFor(data.user));
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  return (
    <AuthFrame title="Sign in">
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        {resetSuccess && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium">
            ✅ Password updated successfully. Sign in with your new password.
          </div>
        )}
        <Notice message={error} variant="error" title="Sign in failed" />
        <Field label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        <Button className="w-full" type="submit">Sign in</Button>
      </form>
      <Button
        variant="secondary"
        className="w-full"
        type="button"
        onClick={() => { window.location.href = apiUrl("/api/auth/google"); }}
      >
        Continue with Google
      </Button>
      <p className="text-center text-sm">
        <Link to="/forgot-password">Forgot password</Link>
      </p>
      <Link to="/get-started" className="block text-center text-sm text-muted">
        Create an account
      </Link>
    </AuthFrame>
  );
}

// ─── Forgot Password Page ─────────────────────────────────────────────────────

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSending(true);
    try {
      await api<{ ok: boolean }>("/api/auth/email/send-reset-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset code");
    } finally {
      setSending(false);
    }
  }

  if (otpSent) {
    return <ResetOtpScreen email={email} onBack={() => setOtpSent(false)} />;
  }

  return (
    <AuthFrame
      title="Reset your password"
      subtitle="Enter your email and we'll send you a verification code"
    >
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <Notice message={error} variant="error" />
        <Field label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Button className="w-full" type="submit" disabled={sending}>
          {sending ? "Sending code…" : "Send reset code"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted">
        <Link to="/sign-in">Back to sign in</Link>
      </p>
    </AuthFrame>
  );
}

// ─── Reset Password Page (token-based, legacy) ────────────────────────────────

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      navigate("/sign-in");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the password");
    }
  }

  return (
    <AuthFrame title="Choose a new password">
      <form className="space-y-4" onSubmit={(event) => void submit(event)}>
        <Notice message={error} variant="error" />
        <div>
          <Field label="New password">
            <TextInput
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={5}
              required
            />
          </Field>
          {password.length > 0 && password.length < 5 ? (
            <p className="mt-1 text-xs text-rose-600 font-medium" role="alert">
              Password must be at least 5 characters long.
            </p>
          ) : null}
        </div>
        <Button className="w-full" type="submit" disabled={password.length < 5}>
          Update password
        </Button>
      </form>
    </AuthFrame>
  );
}

// ─── Phone Page ───────────────────────────────────────────────────────────────

export function PhonePage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const data = await api<{ devCode?: string }>("/api/auth/phone/send", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setSent(true);
      setDevCode(data.devCode ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code");
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const data = await api<{ user: SessionUser; token?: string }>("/api/auth/phone/verify", {
        method: "POST",
        body: JSON.stringify({ phone, code, role: chosenRole() }),
      });
      if (data.token) sessionStorage.setItem("cyc_token", data.token);
      setUser(data.user);
      navigate(destinationFor(data.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the code");
    }
  }

  return (
    <AuthFrame title="Continue with phone">
          <Notice message={error} variant="error" />
      {!sent ? (
        <form className="space-y-4" onSubmit={(event) => void send(event)}>
          <Field label="Mobile number">
            <TextInput
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="9876543210"
              required
            />
          </Field>
          <Button className="w-full" type="submit">Send code</Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={(event) => void verify(event)}>
          {devCode ? <Notice message={`Development code: ${devCode}`} /> : null}
          <Field label="6-digit code">
            <TextInput
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </Field>
          <Button className="w-full" type="submit">Verify</Button>
        </form>
      )}
    </AuthFrame>
  );
}
