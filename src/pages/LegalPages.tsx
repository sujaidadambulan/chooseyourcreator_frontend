import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, Instagram, ExternalLink } from "lucide-react";
import { Logo, Button, Field, TextInput, Notice } from "../components/ui";
import { Reveal } from "../components/motion";
import { api } from "../lib/api";
import { Footer } from "../components/Footer";

function LegalLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="logo-link">
            <Logo variant="nav" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/sign-in" className="text-muted hover:text-ink transition-colors">
              Sign in
            </Link>
            <Link
              to="/get-started"
              className="rounded-full bg-ink text-white px-4 py-1.5 text-sm hover:bg-ink/80 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <Reveal>
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-muted text-sm">{subtitle}</p>}
          </div>
          <div className="space-y-8 text-sm text-ink/85 leading-relaxed">{children}</div>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink mb-3">{title}</h2>
      <div className="text-sm text-ink/80 space-y-3 leading-relaxed">{children}</div>
    </section>
  );
}

// ─── Privacy Policy ───────────────────────────────────────────────────────────

export function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" subtitle="Last updated: November 2024">
      <p className="text-sm text-muted">
        This Privacy Policy describes how ChooseYourCreator ("we", "us", or "our") collects, uses, and
        protects your information when you use our platform.
      </p>

      <Section title="1. Information We Collect">
        <p>
          <strong>Account information:</strong> When you create an account, we collect your name,
          email address, and phone number. Brands additionally provide company name, niche, and
          business description. Creators provide their bio, niche, city, and social platform details.
        </p>
        <p>
          <strong>Profile information:</strong> Profile photos, banner images, and social media links
          you upload or provide.
        </p>
        <p>
          <strong>Usage data:</strong> We collect information about how you use our platform,
          including pages visited and features used, to improve our service.
        </p>
        <p>
          <strong>Communications:</strong> Messages exchanged between brands and creators on the
          platform are stored to facilitate collaborations.
        </p>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide, operate, and maintain the ChooseYourCreator platform</li>
          <li>Match brands with suitable content creators</li>
          <li>Facilitate communication between brands and creators</li>
          <li>Send you verification codes and account-related notifications</li>
          <li>Improve and personalize your experience on the platform</li>
          <li>Respond to your support requests and inquiries</li>
          <li>Comply with legal obligations</li>
        </ul>
      </Section>

      <Section title="3. Information Sharing">
        <p>We do not sell, rent, or trade your personal information to third parties.</p>
        <p>
          <strong>Between users:</strong> When a creator applies for a campaign or a brand invites a
          creator, limited profile information (name, niche, follower counts, bio) is shared with
          the other party to facilitate the collaboration. Contact details (phone number, email) are
          kept confidential and are never displayed publicly.
        </p>
        <p>
          <strong>Service providers:</strong> We may share your information with trusted service
          providers who assist us in operating our platform, subject to strict confidentiality
          obligations.
        </p>
      </Section>

      <Section title="4. Data Storage and Security">
        <p>
          Your data is stored on secure servers. We implement industry-standard security measures
          including encrypted connections (HTTPS), hashed passwords, and session-based authentication
          to protect your information.
        </p>
        <p>
          No method of transmission over the Internet is 100% secure. While we strive to protect
          your data, we cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="5. Cookies and Session Data">
        <p>
          ChooseYourCreator uses session cookies to keep you signed in and provide a seamless experience.
          We do not use tracking or advertising cookies. We do not use third-party analytics services
          that collect personal data.
        </p>
        <p>
          Session cookies are essential for the platform to function and cannot be disabled while
          using the service.
        </p>
      </Section>

      <Section title="6. Payments">
        <p>
          ChooseYourCreator does not process payments directly through the platform. Payment arrangements
          between brands and creators are facilitated manually (via UPI, bank transfer, or other
          methods agreed upon by both parties). We do not store payment card details or financial
          account information.
        </p>
      </Section>

      <Section title="7. Your Rights">
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your account and associated data</li>
          <li>Withdraw consent where processing is based on consent</li>
        </ul>
        <p>
          To exercise these rights, contact us at{" "}
          <a href="mailto:admin@chooseyourcreator.in" className="text-ink underline hover:no-underline">
            admin@chooseyourcreator.in
          </a>
          .
        </p>
      </Section>

      <Section title="8. Children's Privacy">
        <p>
          ChooseYourCreator is not intended for use by individuals under the age of 18. We do not
          knowingly collect personal information from minors. If you believe a minor has provided us
          with personal information, please contact us immediately.
        </p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify registered users of
          significant changes by email. Continued use of the platform after changes constitutes
          acceptance of the updated policy.
        </p>
      </Section>

      <Section title="10. Contact Us">
        <p>For privacy-related questions, contact us at:</p>
        <p>
          <a href="mailto:admin@chooseyourcreator.in" className="text-ink underline">
            admin@chooseyourcreator.in
          </a>
        </p>
      </Section>
    </LegalLayout>
  );
}

// ─── Terms & Conditions ───────────────────────────────────────────────────────

export function TermsPage() {
  return (
    <LegalLayout title="Terms &amp; Conditions" subtitle="Last updated: November 2024">
      <p className="text-sm text-muted">
        Please read these Terms and Conditions carefully before using the ChooseYourCreator platform. By
        accessing or using our service, you agree to be bound by these terms.
      </p>

      <Section title="1. About ChooseYourCreator">
        <p>
          ChooseYourCreator is an early-stage startup operating as a platform that connects content
          creators with brands for collaboration purposes. ChooseYourCreator is not currently registered
          as a legal entity. These terms represent our commitment to users while the platform is in
          development.
        </p>
      </Section>

      <Section title="2. Acceptance of Terms">
        <p>
          By creating an account or using the ChooseYourCreator platform, you agree to these Terms and
          Conditions and our Privacy Policy. If you do not agree, please do not use our platform.
        </p>
        <p>You must be at least 18 years old to use ChooseYourCreator.</p>
      </Section>

      <Section title="3. User Accounts">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials. You
          agree to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide accurate and truthful information when creating your profile</li>
          <li>Keep your contact information up to date</li>
          <li>Not share your account with others</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
        </ul>
      </Section>

      <Section title="4. Brand Responsibilities">
        <p>Brands using ChooseYourCreator agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Post accurate campaign details including deliverables, timelines, and payment amounts</li>
          <li>Treat creators respectfully and professionally</li>
          <li>Honor payment commitments made to creators upon accepting their collaboration</li>
          <li>Not misrepresent their brand, products, or campaign requirements</li>
        </ul>
      </Section>

      <Section title="5. Creator Responsibilities">
        <p>Creators using ChooseYourCreator agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide accurate information about their audience size and social media reach</li>
          <li>Deliver campaign content as agreed within the specified timeline</li>
          <li>
            Disclose sponsored content in accordance with applicable advertising regulations
          </li>
          <li>Not misrepresent their follower counts or engagement metrics</li>
        </ul>
      </Section>

      <Section title="6. Payments">
        <p>
          ChooseYourCreator does not process or handle payments between brands and creators. All payment
          arrangements are made directly between the parties involved. ChooseYourCreator provides tools to
          track and document payment agreements, but is not a party to any financial transaction.
        </p>
        <p>
          ChooseYourCreator is not responsible for payment disputes between brands and creators. We
          strongly encourage both parties to agree on clear payment terms before beginning any
          collaboration.
        </p>
      </Section>

      <Section title="7. Content and Intellectual Property">
        <p>
          By uploading content to ChooseYourCreator (profile photos, banner images, portfolio work), you
          grant ChooseYourCreator a non-exclusive, royalty-free license to display that content on the
          platform.
        </p>
        <p>
          You retain ownership of your content. You represent that you have the right to upload and
          share any content you post on our platform.
        </p>
        <p>
          Campaign content created by creators for brands remains subject to any intellectual
          property agreements made between the brand and creator directly.
        </p>
      </Section>

      <Section title="8. Prohibited Conduct">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Post false, misleading, or fraudulent information</li>
          <li>Harass, threaten, or abuse other users</li>
          <li>Attempt to gain unauthorized access to the platform or other users' accounts</li>
          <li>Use the platform to promote illegal activities</li>
          <li>Create multiple accounts to circumvent suspensions or restrictions</li>
        </ul>
      </Section>

      <Section title="9. Platform Availability">
        <p>
          As an early-stage platform, ChooseYourCreator may experience downtime, bugs, or service
          interruptions. We do not guarantee uninterrupted access to the platform. We reserve the
          right to modify, suspend, or discontinue any part of the service at any time.
        </p>
      </Section>

      <Section title="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, ChooseYourCreator shall not be liable for any
          indirect, incidental, special, or consequential damages arising from your use of the
          platform, including but not limited to disputes between brands and creators, failed
          collaborations, or payment disagreements.
        </p>
      </Section>

      <Section title="11. Account Termination">
        <p>
          ChooseYourCreator reserves the right to suspend or terminate accounts that violate these terms.
          If your account is suspended, you may contact us to appeal the decision.
        </p>
        <p>
          You may delete your account at any time by contacting us at{" "}
          <a href="mailto:admin@chooseyourcreator.in" className="text-ink underline">
            admin@chooseyourcreator.in
          </a>
          .
        </p>
      </Section>

      <Section title="12. Changes to Terms">
        <p>
          We may update these terms from time to time. We will notify registered users of significant
          changes via email. Continued use of the platform constitutes acceptance of updated terms.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          For questions about these Terms, contact us at{" "}
          <a href="mailto:admin@chooseyourcreator.in" className="text-ink underline">
            admin@chooseyourcreator.in
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}

// ─── Contact Page ─────────────────────────────────────────────────────────────

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    setError(null);
    setSending(true);
    try {
      await api("/api/contact", {
        method: "POST",
        body: JSON.stringify({ name, email, subject, message }),
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send message. Please email us directly."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-line sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="logo-link">
            <Logo variant="nav" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/sign-in" className="text-muted hover:text-ink transition-colors">
              Sign in
            </Link>
            <Link
              to="/get-started"
              className="rounded-full bg-ink text-white px-4 py-1.5 text-sm hover:bg-ink/80 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <Reveal>
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-ink">Contact Us</h1>
            <p className="mt-2 text-muted">
              We'd love to hear from you. Reach out for any questions, support, or feedback.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
          {/* Contact cards */}
          <div className="space-y-5">
            <a
              href="mailto:admin@chooseyourcreator.in"
              className="flex items-start gap-4 rounded-3xl border border-line p-6 hover:border-ink/30 hover:bg-soft/40 transition-colors group"
            >
              <div className="rounded-2xl bg-soft p-3 group-hover:bg-ink/5 transition-colors">
                <Mail size={22} className="text-ink" />
              </div>
              <div>
                <p className="font-semibold text-ink">Email</p>
                <p className="text-sm text-muted mt-0.5">admin@chooseyourcreator.in</p>
                <p className="text-xs text-muted mt-2">We respond within 1–2 business days</p>
              </div>
            </a>

            <a
              href="tel:+918129747764"
              className="flex items-start gap-4 rounded-3xl border border-line p-6 hover:border-ink/30 hover:bg-soft/40 transition-colors group"
            >
              <div className="rounded-2xl bg-soft p-3 group-hover:bg-ink/5 transition-colors">
                <Phone size={22} className="text-ink" />
              </div>
              <div>
                <p className="font-semibold text-ink">Phone</p>
                <p className="text-sm text-muted mt-0.5">+91 81297 47764</p>
                <p className="text-xs text-muted mt-2">Monday – Saturday, 10 AM – 6 PM IST</p>
              </div>
            </a>

            <a
              href="https://www.instagram.com/chooseyourcreator"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-4 rounded-3xl border border-line p-6 hover:border-ink/30 hover:bg-soft/40 transition-colors group"
            >
              <div className="rounded-2xl bg-soft p-3 group-hover:bg-ink/5 transition-colors">
                <Instagram size={22} className="text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-ink">Instagram</p>
                <p className="text-sm text-muted mt-0.5">@chooseyourcreator</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-muted">Follow us</span>
                  <ExternalLink size={10} className="text-muted" />
                </div>
              </div>
            </a>
          </div>

          {/* Contact form */}
          <div className="rounded-3xl border border-line p-8">
            <h2 className="text-lg font-semibold text-ink mb-6">Send a message</h2>
            {success ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-6 text-center">
                <p className="text-2xl mb-2">✅</p>
                <p className="font-semibold text-emerald-800">Message sent!</p>
                <p className="text-sm text-emerald-700 mt-1">
                  We'll get back to you at {email} within 1–2 business days.
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
                <Notice message={error} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Your name *">
                    <TextInput
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Email address *">
                    <TextInput
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                </div>
                <Field label="Subject">
                  <TextInput
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Campaign question, Account issue…"
                  />
                </Field>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Message *</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    required
                    className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm focus:outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all resize-none"
                    placeholder="Tell us how we can help…"
                  />
                </div>
                <Button className="w-full" type="submit" disabled={sending}>
                  {sending ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}
          </div>
        </div>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
