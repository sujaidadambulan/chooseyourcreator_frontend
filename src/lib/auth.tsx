import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "./api";

export type SessionUser = {
  id: string;
  email: string | null;
  phone: string | null;
  role: "BRAND" | "CREATOR" | "ADMIN" | null;
  onboardingComplete: boolean;
  profileName: string | null;
  profileImage?: string | null;
};

type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function destinationFor(user: SessionUser) {
  if (user.role === "ADMIN") return "/admin";
  if (!user.role) return "/get-started";
  if (!user.onboardingComplete) return user.role === "BRAND" ? "/brand/onboarding" : "/creator/onboarding";
  return user.role === "BRAND" ? "/brand" : "/creator";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await api<{ user: SessionUser }>("/api/auth/me");
      setUser(data.user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null);
      else setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Pick up OAuth token/error that the backend passes back as query params after Google sign-in redirect
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get("token");
    const oauthError = params.get("error");

    if (oauthToken) {
      sessionStorage.setItem("cyc_token", oauthToken);
      // Clean the token from the URL without reloading the page
      params.delete("token");
      const newSearch = params.toString();
      const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }

    if (oauthError) {
      // Store the error so auth pages can display it
      sessionStorage.setItem("cyc_oauth_error", decodeURIComponent(oauthError));
      params.delete("error");
      const newSearch = params.toString();
      const cleanUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    }

    void refresh();
  }, []);

  return <AuthContext.Provider value={{ user, loading, refresh, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthProvider is missing");
  return value;
}

export function chosenRole(): "BRAND" | "CREATOR" | undefined {
  const role = sessionStorage.getItem("cyc_role");
  return role === "BRAND" || role === "CREATOR" ? role : undefined;
}

/** Reads and clears any OAuth error message stored after a failed Google sign-in */
export function popOAuthError(): string | null {
  const err = sessionStorage.getItem("cyc_oauth_error");
  if (err) sessionStorage.removeItem("cyc_oauth_error");
  return err;
}
