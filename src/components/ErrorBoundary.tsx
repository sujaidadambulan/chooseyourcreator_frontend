import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, Logo } from "./ui";
import { AlertCircle, Home } from "lucide-react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
          <Link to="/" className="logo-link mb-8 block w-fit">
            <Logo variant="auth" />
          </Link>
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700">
            <AlertCircle className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold">This page hit a snag</h1>
          <p className="mt-3 text-sm text-muted">
            An unexpected error occurred in the app. Refresh the page or return home and try again.
          </p>
          <pre className="mt-4 max-w-full overflow-x-auto rounded-2xl border border-line bg-soft px-4 py-3 text-left text-xs text-muted">
            {this.state.error.message}
          </pre>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => this.setState({ error: null }, () => window.location.reload())}>
              Reload page
            </Button>
            <Link to="/">
              <Button variant="secondary" type="button">
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
