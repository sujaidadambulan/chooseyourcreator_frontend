import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader, Notice } from "../components/ui";
import { api } from "../lib/api";
import { destinationFor, persistAuthToken, type SessionUser, useAuth } from "../lib/auth";

/** OAuth return URL — avoids server 404 on deep paths before the SPA loads. */
export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token")?.trim();
    const nextPath = params.get("next")?.trim();
    const oauthError = params.get("error")?.trim();

    if (oauthError) {
      navigate(`/sign-in?error=${encodeURIComponent(oauthError)}`, { replace: true });
      return;
    }

    if (!token) {
      setError("Sign-in did not return a session. Try again.");
      return;
    }

    persistAuthToken(token);

    void (async () => {
      try {
        const data = await api<{ user: SessionUser }>("/api/auth/me");
        setUser(data.user);
        const target =
          nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
            ? nextPath
            : destinationFor(data.user);
        navigate(target, { replace: true });
      } catch {
        setError("We could not complete sign-in. Your session may have expired — try again.");
      }
    })();
  }, [navigate, params]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-5 py-16">
        <Notice message={error} variant="error" title="Sign-in incomplete" />
        <button
          type="button"
          className="text-sm font-medium text-ink underline"
          onClick={() => navigate("/sign-in", { replace: true })}
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return <Loader variant="screen" />;
}
