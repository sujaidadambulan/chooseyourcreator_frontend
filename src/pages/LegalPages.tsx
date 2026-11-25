import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, Instagram, ExternalLink } from "lucide-react";
import { Logo, Button, Field, TextInput, Notice } from "../components/ui";
import { Reveal } from "../components/motion";
import { api } from "../lib/api";
import { Footer } from "../components/Footer";
import { BRAND } from "../shared";

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
    <LegalLayout title="Privacy Policy" subtitle="Last updated: November 2026">
      <p className="text-sm text-muted">
        This Privacy Policy describes how ChooseYourCreator ("we", "us", or "our") collects, uses, stores, and
        protects your information when you use our platform at{" "}
        <a
          href="https://chooseyourcreator.in"
          className="text-ink underline hover:no-underline"
          target="_blank"
          rel="noreferrer"
        >
          https://chooseyourcreator.in
        </a>
        .
      </p>

      <Section title="1. Information We Collect">
        <p>
          <strong>Account Information:</strong> When you create an account, we collect your name, email address,
          and phone number. Brands may provide their business name, niche, and business description. Creators may
          provide their bio, niche, city, and social media platform details.
        </p>
        <p>
          <strong>Profile Information:</strong> We collect profile photos, banner images, portfolio materials, and
          social media links that you upload or provide.
        </p>
        <p>
          <strong>Usage Data:</strong> We may collect information about how you use our platform, including pages
          visited and features used, to maintain and improve our services.
        </p>
        <p>
          <strong>Communications:</strong> Messages exchanged between brands and creators through our platform
          may be stored to facilitate collaborations and provide support.
        </p>
        <p>
          <strong>Transaction Information:</strong> When payments are made through our platform, we may collect
          transaction references, payment status, campaign payment details, and refund status. We do not intend to
          store full debit or credit card details on our servers.
        </p>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide, operate, and maintain ChooseYourCreator.</li>
          <li>Match brands with suitable content creators.</li>
          <li>Facilitate communication and campaign management.</li>
          <li>Process and track campaign payments and creator payouts through supported payment service providers.</li>
          <li>Send verification codes and account-related notifications.</li>
          <li>Improve our services and user experience.</li>
          <li>Respond to support requests and resolve disputes.</li>
          <li>Comply with applicable legal obligations.</li>
        </ul>
      </Section>

      <Section title="3. Information Sharing">
        <p>We do not sell or rent your personal information.</p>
        <p>
          <strong>Between Users:</strong> Limited profile information, such as name, niche, follower information,
          bio, and portfolio details, may be shared with brands or creators to facilitate collaborations. Contact
          details are not displayed publicly, although necessary information may be shared with the relevant party
          when required to complete a collaboration or payment.
        </p>
        <p>
          <strong>Payment Service Providers:</strong> Payment and transaction information may be shared with
          third-party payment service providers, such as Cashfree, when required to process payments, refunds,
          verification, or creator payouts. Such providers handle information under their own applicable privacy
          terms.
        </p>
        <p>
          <strong>Service Providers:</strong> We may share necessary information with trusted providers who help us
          operate our website, hosting, communications, and other platform services.
        </p>
        <p>
          <strong>Legal Requirements:</strong> We may disclose information where required by applicable law or a
          valid legal request.
        </p>
      </Section>

      <Section title="4. Data Storage and Security">
        <p>
          We use reasonable security measures to protect personal information, including encrypted connections
          (HTTPS) and appropriate safeguards for account credentials and platform data.
        </p>
        <p>
          No method of internet transmission or electronic storage is completely secure. We cannot guarantee
          absolute security.
        </p>
      </Section>

      <Section title="5. Cookies and Session Data">
        <p>
          ChooseYourCreator uses essential session cookies to maintain login sessions and support platform
          functionality. If additional cookies or analytics tools are introduced, this policy will be updated where
          necessary.
        </p>
      </Section>

      <Section title="6. Payments">
        <p>
          Payments made through ChooseYourCreator are processed using supported third-party payment service providers.
          These providers may collect and process payment information in accordance with their own privacy policies
          and security practices.
        </p>
        <p>
          We may retain transaction references, payment status, campaign payment records, refund information, and
          payout records for platform operations, customer support, dispute resolution, and legal or accounting
          requirements.
        </p>
        <p>
          ChooseYourCreator does not intend to store full card numbers, CVV numbers, or other sensitive card
          authentication credentials on its own servers.
        </p>
      </Section>

      <Section title="7. Your Privacy Rights">
        <p>
          Subject to applicable law, you may request access to your personal information, correction of inaccurate
          information, deletion of eligible personal information, or withdrawal of consent where applicable.
        </p>
        <p>
          To make a request, contact{" "}
          <a href="mailto:admin@chooseyourcreator.in" className="text-ink underline hover:no-underline">
            admin@chooseyourcreator.in
          </a>
          .
        </p>
      </Section>

      <Section title="8. Children's Privacy">
        <p>
          ChooseYourCreator is intended for individuals aged 18 and above. We do not knowingly collect personal
          information from individuals under 18. Please contact us if you believe a minor has provided personal
          information.
        </p>
      </Section>

      <Section title="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy when our services or practices change. Updated versions will be
          published on this page with a revised date. Where required, we will notify users of significant changes.
        </p>
      </Section>

      <Section title="10. Contact Us">
        <p>For privacy-related questions or requests, contact:</p>
        <div className="space-y-1 text-sm text-ink/80">
          <p>
            Email:{" "}
            <a href="mailto:admin@chooseyourcreator.in" className="text-ink underline hover:no-underline">
              admin@chooseyourcreator.in
            </a>
          </p>
          <p>
            Phone:{" "}
            <a href="tel:+918129747764" className="text-ink underline hover:no-underline">
              +91 81297 47764
            </a>
            ,{" "}
            <a href="tel:+917510750667" className="text-ink underline hover:no-underline">
              +91 75107 50667
            </a>
          </p>
          <p>
            Website:{" "}
            <a
              href="https://chooseyourcreator.in"
              className="text-ink underline hover:no-underline"
              target="_blank"
              rel="noreferrer"
            >
              https://chooseyourcreator.in
            </a>
          </p>
        </div>
      </Section>
    </LegalLayout>
  );
}

// ─── Terms & Conditions ───────────────────────────────────────────────────────

export function TermsPage() {
  return (
    <LegalLayout title="Terms &amp; Conditions" subtitle="Last updated: November 2026">
      <p className="text-sm text-muted">
        Please read these Terms and Conditions carefully before using ChooseYourCreator. By accessing or using our
        platform, you agree to these terms and our Privacy Policy.
      </p>

      <Section title="1. About ChooseYourCreator">
        <p>
          ChooseYourCreator is an early-stage online platform that connects brands with content creators for
          promotional collaborations and campaigns. The platform facilitates campaign discovery, communication,
          payments, and campaign management.
        </p>
        <p>
          ChooseYourCreator is currently operated by an individual and is not represented as a registered Private
          Limited Company or LLP. The operator's applicable legal details will be provided where required.
        </p>
      </Section>

      <Section title="2. Acceptance and Eligibility">
        <p>
          By creating an account or using ChooseYourCreator, you agree to these Terms and our Privacy Policy. Users
          must be at least 18 years old. You must provide accurate information and have the authority to act on behalf
          of any business you represent.
        </p>
      </Section>

      <Section title="3. User Accounts">
        <p>
          You are responsible for maintaining the confidentiality of your login credentials and for activity under
          your account. You agree to provide accurate information, keep your details updated, avoid sharing your
          account, and notify us of unauthorized access.
        </p>
      </Section>

      <Section title="4. Brand Responsibilities">
        <p>Brands agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide accurate campaign briefs, deliverables, timelines, and product information.</li>
          <li>Make campaign payments through the available payment methods on the platform.</li>
          <li>Provide clear and reasonable feedback within the agreed campaign requirements.</li>
          <li>Review submitted content within a reasonable time.</li>
          <li>Treat creators respectfully and professionally.</li>
          <li>Avoid misleading campaign requirements or unlawful promotional activities.</li>
        </ul>
      </Section>

      <Section title="5. Creator Responsibilities">
        <p>Creators agree to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide accurate profile, audience, and social media information.</li>
          <li>Complete accepted campaign deliverables within the agreed timeline.</li>
          <li>Follow the campaign brief and agreed content requirements.</li>
          <li>Ensure that submitted content does not infringe third-party rights.</li>
          <li>Disclose sponsored content in accordance with applicable advertising requirements.</li>
          <li>Avoid false follower counts, engagement figures, or performance claims.</li>
        </ul>
      </Section>

      <Section title="6. Payments and Creator Payouts">
        <p>
          Brands make campaign payments to ChooseYourCreator through the payment methods and payment service
          providers supported on the platform.
        </p>
        <p>
          ChooseYourCreator facilitates the payment process and arranges creator payouts according to the applicable
          campaign terms and completion status.
        </p>
        <p>
          Creator payouts are subject to campaign completion, verification, applicable payment-provider procedures, and
          any required KYC checks.
        </p>
        <p>
          ChooseYourCreator may charge a platform commission or service fee, which will be communicated to the relevant
          users before payment where applicable.
        </p>
        <p>
          Payment processing and payout timelines may depend on the payment provider, banks, verification
          requirements, and other applicable procedures.
        </p>
      </Section>

      <Section title="7. Content Revisions">
        <p>
          Brands are entitled to a maximum of three rounds of content revisions per campaign. Revision requests must
          remain within the original campaign brief and agreed deliverables. No additional revision rounds are included
          or permitted through the standard campaign arrangement.
        </p>
      </Section>

      <Section title="8. Refunds and Cancellations">
        <p>
          If a creator does not complete the agreed campaign deliverables, the brand is eligible for a 100% refund of
          the campaign payment, subject to verification of the campaign status.
        </p>
        <p>
          Campaign cancellation and refund requests will be handled according to our{" "}
          <Link to="/refund-policy" className="text-ink underline hover:no-underline">
            Refund &amp; Cancellation Policy
          </Link>
          , which forms part of these Terms.
        </p>
      </Section>

      <Section title="9. Content and Intellectual Property">
        <p>
          Users retain ownership of content they upload, subject to rights held by third parties. By uploading
          profile images, portfolio materials, or other content, users grant ChooseYourCreator a non-exclusive licence
          to display that material as necessary to operate and promote the platform.
        </p>
        <p>
          Ownership and permitted use of campaign content must be agreed between the brand and creator. Neither party
          should assume that content ownership automatically transfers unless agreed in writing.
        </p>
      </Section>

      <Section title="10. Prohibited Conduct">
        <p>Users must not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide false, misleading, or fraudulent information.</li>
          <li>Harass, threaten, or abuse other users.</li>
          <li>Attempt unauthorized access to accounts or platform systems.</li>
          <li>Use the platform for unlawful activities.</li>
          <li>Manipulate campaign records, payments, or engagement statistics.</li>
          <li>Infringe intellectual property or third-party rights.</li>
        </ul>
      </Section>

      <Section title="11. Platform Availability">
        <p>
          ChooseYourCreator is an early-stage service. We may experience downtime, bugs, maintenance periods, or
          interruptions. We will make reasonable efforts to maintain the service but do not guarantee uninterrupted
          availability.
        </p>
      </Section>

      <Section title="12. Limitation of Liability">
        <p>
          To the extent permitted by applicable law, ChooseYourCreator is not responsible for indirect or consequential
          losses arising from platform use, user conduct, social media platform changes, or disagreements between
          brands and creators. Nothing in these Terms excludes liability that cannot legally be excluded.
        </p>
      </Section>

      <Section title="13. Account Suspension and Termination">
        <p>
          We may restrict or suspend accounts that violate these Terms, engage in fraudulent activity, or create risks
          for other users or the platform. Users may request account deletion by contacting our support team, subject
          to applicable legal and transaction-record retention requirements.
        </p>
      </Section>

      <Section title="14. Changes to These Terms">
        <p>
          We may update these Terms when our platform or services change. Updated versions will be published on our
          website with a revised date. Where required, users will be notified of significant changes.
        </p>
      </Section>

      <Section title="15. Contact Us">
        <p>For questions or assistance, contact:</p>
        <div className="space-y-1 text-sm text-ink/80">
          <p>
            Email:{" "}
            <a href="mailto:admin@chooseyourcreator.in" className="text-ink underline hover:no-underline">
              admin@chooseyourcreator.in
            </a>
          </p>
          <p>
            Phone:{" "}
            <a href="tel:+918129747764" className="text-ink underline hover:no-underline">
              +91 81297 47764
            </a>
            ,{" "}
            <a href="tel:+917510750667" className="text-ink underline hover:no-underline">
              +91 75107 50667
            </a>
          </p>
          <p>
            Website:{" "}
            <a
              href="https://chooseyourcreator.in"
              className="text-ink underline hover:no-underline"
              target="_blank"
              rel="noreferrer"
            >
              https://chooseyourcreator.in
            </a>
          </p>
        </div>
      </Section>
    </LegalLayout>
  );
}

// ─── Refund & Cancellation Policy ─────────────────────────────────────────────

export function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund &amp; Cancellation Policy" subtitle="Last updated: November 2026">
      <p className="text-sm text-muted">
        ChooseYourCreator aims to provide a fair and transparent collaboration experience for brands and creators.
      </p>

      <Section title="1. Campaign Completion and Refunds">
        <p>
          If a creator does not complete the agreed campaign deliverables, the brand is eligible for a 100% refund of
          the campaign payment. Refund eligibility will be verified by reviewing the campaign details and its
          completion status.
        </p>
      </Section>

      <Section title="2. Content Revisions">
        <p>
          Brands are entitled to a maximum of three rounds of content revisions for each campaign. Revision requests
          must relate to the original campaign brief and agreed deliverables. Additional revision rounds are not
          permitted.
        </p>
      </Section>

      <Section title="3. Campaign Cancellation">
        <p>
          Brands may submit a cancellation request through ChooseYourCreator. Refund eligibility will be determined
          according to the campaign status and the terms of this policy. If the campaign is not completed as agreed,
          the brand is eligible for a full refund.
        </p>
      </Section>

      <Section title="4. Refund Processing">
        <p>
          Approved refunds will be initiated through the original payment method wherever supported. The time taken
          for the refund to appear in the brand's account depends on the payment provider and the bank.
        </p>
      </Section>

      <Section title="5. How to Request a Refund">
        <p>
          Brands can contact our support team at{" "}
          <a href="mailto:admin@chooseyourcreator.in" className="text-ink underline hover:no-underline">
            admin@chooseyourcreator.in
          </a>{" "}
          with their campaign details and payment reference. Our team will review the request and communicate the
          outcome.
        </p>
      </Section>

      <Section title="6. Contact Us">
        <p>For questions or assistance regarding refunds and cancellations, contact:</p>
        <div className="space-y-1 text-sm text-ink/80">
          <p>
            Email:{" "}
            <a href="mailto:admin@chooseyourcreator.in" className="text-ink underline hover:no-underline">
              admin@chooseyourcreator.in
            </a>
          </p>
          <p>
            Phone:{" "}
            <a href="tel:+918129747764" className="text-ink underline hover:no-underline">
              +91 81297 47764
            </a>
            ,{" "}
            <a href="tel:+917510750667" className="text-ink underline hover:no-underline">
              +91 75107 50667
            </a>
          </p>
          <p>
            Website:{" "}
            <a
              href="https://chooseyourcreator.in"
              className="text-ink underline hover:no-underline"
              target="_blank"
              rel="noreferrer"
            >
              https://chooseyourcreator.in
            </a>
          </p>
        </div>
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

            <div className="flex items-start gap-4 rounded-3xl border border-line p-6 hover:border-ink/30 hover:bg-soft/40 transition-colors group">
              <div className="rounded-2xl bg-soft p-3 group-hover:bg-ink/5 transition-colors">
                <Phone size={22} className="text-ink" />
              </div>
              <div>
                <p className="font-semibold text-ink">Phone</p>
                <div className="text-sm text-muted mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <a href="tel:+918129747764" className="hover:text-ink transition-colors">
                    +91 81297 47764
                  </a>
                  <span>/</span>
                  <a href="tel:+917510750667" className="hover:text-ink transition-colors">
                    +91 75107 50667
                  </a>
                </div>
                <p className="text-xs text-muted mt-2">Monday – Saturday, 10 AM – 6 PM IST</p>
              </div>
            </div>

            <a
              href={BRAND.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-4 rounded-3xl border border-line p-6 hover:border-ink/30 hover:bg-soft/40 transition-colors group"
            >
              <div className="rounded-2xl bg-soft p-3 group-hover:bg-ink/5 transition-colors">
                <Instagram size={22} className="text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-ink">Instagram</p>
                <p className="text-sm text-muted mt-0.5">@{BRAND.instagramHandle}</p>
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
