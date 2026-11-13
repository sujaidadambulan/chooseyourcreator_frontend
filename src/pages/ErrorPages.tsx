import { AlertCircle, Home, LogIn, RefreshCw, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Logo } from "../components/ui";
import { Reveal } from "../components/motion";

function ErrorShell({
  code,
  title,
  description,
  children,
  icon,
}: {
  code?: string;
  title: string;
  description: string;
  children?: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
      <Link to="/" className="logo-link mb-8 block w-fit" aria-label="Home">
        <Logo variant="auth" />
      </Link>
      <Reveal>
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-soft text-ink"
          aria-hidden
        >
          {icon}
        </div>
        {code ? (
          <p className="text-sm font-semibold uppercase tracking-widest text-muted">{code}</p>
        ) : null}
        <h1 className="mt-2 text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
        {children ? <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">{children}</div> : null}
      </Reveal>
    </div>
  );
}

export function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <ErrorShell
      code="404"
      title="Page not found"
      description={
        pathname && pathname !== "/"
          ? `We don't have a page at "${pathname}". It may have moved or the link is outdated.`
          : "We couldn't find that page. It may have moved or the link is outdated."
      }
      icon={<SearchX className="h-8 w-8" strokeWidth={1.5} />}
    >
      <Link to="/" className="w-full sm:w-auto">
        <Button type="button" className="w-full">
          <Home className="h-4 w-4" />
          Back to home
        </Button>
      </Link>
      <Link to="/sign-in" className="w-full sm:w-auto">
        <Button variant="secondary" type="button" className="w-full">
          <LogIn className="h-4 w-4" />
          Sign in
        </Button>
      </Link>
    </ErrorShell>
  );
}

export function AppErrorPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const message = params.get("message")?.trim() || "Something unexpected happened. Please try again.";
  const from = params.get("from")?.trim();

  return (
    <ErrorShell
      code="Error"
      title="Something went wrong"
      description={message}
      icon={<AlertCircle className="h-8 w-8" strokeWidth={1.5} />}
    >
      <Button
        type="button"
        className="w-full sm:w-auto"
        onClick={() => (from ? navigate(from) : navigate(0))}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
      <Link to="/" className="w-full sm:w-auto">
        <Button variant="secondary" type="button" className="w-full">
          Back to home
        </Button>
      </Link>
    </ErrorShell>
  );
}
