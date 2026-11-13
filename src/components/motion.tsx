import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export function useInView(options?: { threshold?: number; once?: boolean }) {
  const threshold = options?.threshold ?? 0.12;
  const once = options?.once ?? true;
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);

    const rect = node.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    if (inView) setVisible(true);

    return () => observer.disconnect();
  }, [threshold, once]);

  return { ref, visible };
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useInView({ threshold: 0.08, once: true });
  const style = delay > 0 ? ({ transitionDelay: `${delay}ms` } as CSSProperties) : undefined;

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      data-visible={visible ? "true" : "false"}
      style={style}
    >
      {children}
    </div>
  );
}

export function Parallax({
  children,
  className = "",
  factor = 0.08,
}: {
  children: ReactNode;
  className?: string;
  /** Scroll offset multiplier (desktop only). */
  factor?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const narrow = useMediaQuery("(max-width: 767px)");
  const enabled = !reduced && !narrow;

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;

    function update() {
      raf = 0;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const elementCenter = rect.top + rect.height / 2;
      const delta = (elementCenter - viewportCenter) * factor;
      el.style.transform = `translateY(${delta}px)`;
    }

    function onScroll() {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [enabled, factor]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={enabled ? { willChange: "transform" } : undefined}
    >
      {children}
    </div>
  );
}
