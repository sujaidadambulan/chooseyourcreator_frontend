import { Link } from "react-router-dom";
import { Instagram, Mail, Phone } from "lucide-react";
import { BRAND } from "../shared";
import { Logo } from "./ui";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col items-start sm:col-span-2 lg:col-span-1">
            <Link to="/" className="logo-link mb-3">
              <Logo variant="footer" />
            </Link>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              {BRAND.name} connects content creators and brands to build authentic collaborations and campaigns.
            </p>
            <a
              href="https://www.instagram.com/chooseyourcreator"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors"
            >
              <Instagram size={16} className="text-rose-500" />
              @chooseyourcreator
            </a>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Platform</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/get-started" className="text-ink/80 hover:text-ink transition-colors">
                  Get started
                </Link>
              </li>
              <li>
                <Link to="/sign-in" className="text-ink/80 hover:text-ink transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/sign-up" className="text-ink/80 hover:text-ink transition-colors">
                  Create account
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/privacy-policy" className="text-ink/80 hover:text-ink transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="text-ink/80 hover:text-ink transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-ink/80 hover:text-ink transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${BRAND.adminEmail}`}
                  className="inline-flex items-center gap-2 text-ink/80 hover:text-ink transition-colors"
                >
                  <Mail size={14} className="shrink-0" />
                  {BRAND.adminEmail}
                </a>
              </li>
              <li>
                <a
                  href="tel:+918129747764"
                  className="inline-flex items-center gap-2 text-ink/80 hover:text-ink transition-colors"
                >
                  <Phone size={14} className="shrink-0" />
                  +91 81297 47764
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/chooseyourcreator"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-ink/80 hover:text-ink transition-colors"
                >
                  <Instagram size={14} className="shrink-0 text-rose-500" />
                  @chooseyourcreator
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
          <p>
            &copy; {year} {BRAND.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-ink transition-colors">
              Privacy
            </Link>
            <Link to="/terms-and-conditions" className="hover:text-ink transition-colors">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-ink transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
