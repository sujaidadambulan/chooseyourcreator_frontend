import { ArrowRight, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, Logo } from "../components/ui";
import { Footer } from "../components/Footer";
import { Parallax, Reveal } from "../components/motion";
import { BRAND } from "../shared";

const platform = BRAND.name;

const brandSteps = [
  ["Discover", "Search creators by niche, platform, and following."],
  ["Invite", "Open a public brief or send a private invitation."],
  ["Agree", "Issue the campaign agreement and collect a signature."],
  ["Pay", "The initial amount is held until the work is approved."],
];

const creatorSteps = [
  ["Discover", "Browse open campaigns from brands."],
  ["Apply", "Send an application or accept a private invite."],
  ["Create", `Make the content and submit it in ${platform}.`],
  ["Get paid", "Request release of the held payment."],
];

const brandPoints = [
  ["Discover creators", "A marketplace of profiles, niches, and real follower counts."],
  ["Shape the brief", "Public campaigns or a private invitation to one creator."],
  ["Hold the payment", `The initial fee stays with ${platform} until delivery is approved.`],
  ["Keep the thread", "Messages stay attached to the campaign."],
];

const creatorPoints = [
  ["Find the right brief", "Filter campaigns by niche, platform, and budget range."],
  ["Own the agreement", "Read the PDF and sign with your name."],
  ["Submit the work", "Upload a file or share the live social link."],
  ["Request payment", "Ask for release once the brand approves."],
];

function LineArt({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 360 220" className="h-auto w-full" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      {children}
    </svg>
  );
}

function BrandGraphic() {
  return (
    <LineArt>
      <rect x="28" y="36" width="150" height="150" rx="18" />
      <rect x="46" y="58" width="46" height="46" rx="23" />
      <path d="M108 70h48M108 86h36" />
      <rect x="46" y="120" width="114" height="44" rx="12" />
      <path d="M62 142h70" />
      <rect x="198" y="28" width="134" height="164" rx="18" />
      <path d="M220 58h90M220 78h70" />
      <rect x="220" y="100" width="90" height="28" rx="14" />
      <circle cx="246" cy="154" r="10" />
      <path d="M264 154h40" />
    </LineArt>
  );
}

function CreatorGraphic() {
  return (
    <LineArt>
      <rect x="36" y="28" width="120" height="164" rx="22" />
      <circle cx="96" cy="78" r="22" />
      <path d="M70 126c8-16 44-16 52 0" />
      <rect x="58" y="146" width="76" height="22" rx="11" />
      <rect x="176" y="40" width="150" height="96" rx="16" />
      <path d="M196 72h110M196 92h80" />
      <circle cx="214" cy="164" r="16" />
      <path d="M242 164h70M242 180h48" />
    </LineArt>
  );
}

function FlowGraphic() {
  return (
    <LineArt>
      <circle cx="46" cy="110" r="22" />
      <path d="M78 110h36" />
      <rect x="122" y="86" width="48" height="48" rx="12" />
      <path d="M178 110h36" />
      <path d="M230 88l22 22-22 22" />
      <rect x="268" y="86" width="56" height="48" rx="24" />
    </LineArt>
  );
}

const navLinkClass = "interactive-link text-muted hover:text-ink";

export function LandingPage() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex min-h-[3.75rem] max-w-6xl items-center justify-between px-5 py-2">
          <Link to="/" aria-label={`${BRAND.name} home`} className="logo-link shrink-0">
            <Logo variant="nav" />
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#how" className={navLinkClass}>How it works</a>
            <a href="#brands" className={navLinkClass}>For Brands</a>
            <a href="#creators" className={navLinkClass}>For Creators</a>
            <a href="#features" className={navLinkClass}>Features</a>
            <Link to="/sign-in" className={navLinkClass}>Sign in</Link>
            <Link to="/get-started"><Button>Get started</Button></Link>
          </nav>
          <button
            type="button"
            className="interactive-surface rounded-full border border-line p-2 md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {open ? (
          <div className="flex flex-col gap-3 border-t border-line px-5 py-4 text-sm md:hidden">
            <a href="#how" onClick={() => setOpen(false)}>How it works</a>
            <a href="#brands" onClick={() => setOpen(false)}>For Brands</a>
            <a href="#creators" onClick={() => setOpen(false)}>For Creators</a>
            <a href="#features" onClick={() => setOpen(false)}>Features</a>
            <Link to="/sign-in" onClick={() => setOpen(false)}>Sign in</Link>
            <Link to="/sign-up" onClick={() => setOpen(false)}>Sign up</Link>
          </div>
        ) : null}
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
        <Reveal>
          <p className="text-sm tracking-[0.18em] text-muted">BRANDS AND CREATORS</p>
          <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight md:text-6xl">
            Where brands and creators build better collaborations.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            {BRAND.name} helps brands discover creators and manage a collaboration from the first conversation through agreement, delivery, and payment.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Reveal delay={120}>
              <Link to="/get-started">
                <Button className="px-6 py-3">
                  Get started <ArrowRight size={16} />
                </Button>
              </Link>
            </Reveal>
            <Reveal delay={200}>
              <a href="#how">
                <Button variant="secondary" className="px-6 py-3">
                  Explore how it works
                </Button>
              </a>
            </Reveal>
          </div>
        </Reveal>
        <Parallax factor={0.06}>
          <Reveal delay={160}>
            <div className="interactive-surface rounded-[2rem] border border-line bg-soft p-6 text-ink">
              <FlowGraphic />
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs tracking-wide text-muted">
                <span>Discover</span>
                <span>Agree</span>
                <span>Complete</span>
              </div>
            </div>
          </Reveal>
        </Parallax>
      </section>

      <section id="how" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="text-3xl font-medium">How it works</h2>
          </Reveal>
          <div className="mt-12 grid gap-10 lg:grid-cols-2">
            <div>
              <Reveal delay={80}>
                <p className="text-sm tracking-[0.16em] text-muted">FOR BRANDS</p>
              </Reveal>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {brandSteps.map(([title, body], index) => (
                  <Reveal key={title} delay={index * 80}>
                    <article className="interactive-surface h-full rounded-3xl border border-line p-5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-sm">{index + 1}</span>
                      <h3 className="mt-4 font-medium">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
            <div>
              <Reveal delay={80}>
                <p className="text-sm tracking-[0.16em] text-muted">FOR CREATORS</p>
              </Reveal>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {creatorSteps.map(([title, body], index) => (
                  <Reveal key={title} delay={index * 80}>
                    <article className="interactive-surface h-full rounded-3xl border border-line bg-soft p-5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-sm">{index + 1}</span>
                      <h3 className="mt-4 font-medium">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="brands" className="border-t border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <Reveal>
            <div className="interactive-surface rounded-[2rem] border border-line p-6">
              <BrandGraphic />
            </div>
          </Reveal>
          <div>
            <Reveal>
              <h2 className="text-3xl font-medium">Built for brand teams</h2>
              <p className="mt-4 text-muted">Find a creator, agree the brief, and keep the initial payment held until the work is done.</p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {brandPoints.map(([title, body], index) => (
                <Reveal key={title} delay={index * 80}>
                  <article className="interactive-surface h-full rounded-3xl border border-line p-5">
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="creators" className="border-t border-line bg-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <Reveal>
              <h2 className="text-3xl font-medium">Built for creators</h2>
              <p className="mt-4 text-muted">Choose campaigns that fit your platforms, sign the agreement, and get the held payment released.</p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {creatorPoints.map(([title, body], index) => (
                <Reveal key={title} delay={index * 80}>
                  <article className="interactive-surface h-full rounded-3xl border border-line bg-white p-5">
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Reveal>
              <div className="interactive-surface rounded-[2rem] border border-line bg-white p-6">
                <CreatorGraphic />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <h2 className="text-3xl font-medium">Everything in one collaboration</h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["Creator discovery", "Search by niche, platform, and following."],
              ["Campaign marketplace", "Publish a brief creators can apply to."],
              ["Public and private", "Open the campaign, or invite one creator."],
              ["Messaging", "The conversation stays on the campaign."],
              ["Agreements", "Generate a PDF and collect a signature."],
              ["Payments", "Hold the initial amount. Release it after approval."],
            ].map(([title, body], index) => (
              <Reveal key={title} delay={index * 60}>
                <article className="interactive-surface h-full rounded-3xl border border-line p-6">
                  <h3 className="text-lg font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-5 py-24 text-center">
          <Reveal>
            <h2 className="text-4xl font-medium tracking-tight">Start collaborating with {BRAND.name}.</h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/get-started" onClick={() => sessionStorage.setItem("cyc_role", "CREATOR")}>
                <Button>Join as Creator</Button>
              </Link>
              <Link to="/get-started" onClick={() => sessionStorage.setItem("cyc_role", "BRAND")}>
                <Button variant="secondary">Join as Brand</Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
      <Footer />
    </div>
  );
}