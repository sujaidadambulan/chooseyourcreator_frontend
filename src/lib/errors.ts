import { ApiError } from "./api";

/** User-safe message from failed API calls. */
export function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return err.message || "Please check your input and try again.";
      case 401:
        return err.message || "Email or password is incorrect.";
      case 403:
        return err.message || "You don't have permission to do that.";
      case 404:
        return err.message || "We couldn't find what you're looking for.";
      case 409:
        return err.message || "This account or resource already exists.";
      case 429:
        return err.message || "Too many attempts. Please wait a moment and try again.";
      case 500:
        return err.message || "Something went wrong on our side. Please try again in a moment.";
      default:
        return err.message || "Something went wrong. Please try again.";
    }
  }
  if (err instanceof TypeError && /fetch|network/i.test(err.message)) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

/** Read `?error=` from the URL once (e.g. Google OAuth redirect). */
export function consumeUrlError(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const message = params.get("error")?.trim();
  if (!message) return null;
  params.delete("error");
  const rest = params.toString();
  const next = `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", next);
  return message;
}
