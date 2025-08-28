"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { useReducedMotion, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Stars,
  Search,
  Network,
  Mic2,
  Users,
  Rocket,
  Share2,
} from "lucide-react";

/*************************************************
 * FMG Universe — /talent (Light + Dark friendly)
 * - Full-page vertical slides (scroll-snap, per-section paging)
 * - Parallax gradient art (mobile moves DOWN so it never covers text)
 * - Reduced-motion aware (no extra motion when prefers-reduced-motion)
 * - Right-side nav rail (desktop), bottom rail (mobile, thin colored)
 * - Palette and UI aligned with /creative
 *************************************************/

/* ---------- Utils ---------- */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint - 0.5}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

/* ---------- (Optional) Top bar ---------- */
function TopBar(): React.JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex h-14 items-center justify-between px-4 sm:px-8">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-neutral-900/60 px-3 py-1.5 text-white backdrop-blur-md dark:bg-white/10">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-bold leading-none">
          FMG
        </span>
        <span className="text-xs tracking-wide opacity-90">Universe • Talent</span>
      </div>
      <div className="pointer-events-auto hidden sm:inline-flex items-center gap-2 rounded-full bg-neutral-900/60 px-3 py-1.5 text-[12px] text-white backdrop-blur-md dark:bg-white/10">
        <span className="opacity-80">Scroll</span>
        <ArrowDown className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

/* ---------- Global floating parallax background (match /creative) ---------- */
function ParallaxField({ container }: { container: React.RefObject<HTMLDivElement | null> }): React.JSX.Element {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ container: container as React.RefObject<HTMLElement> });

  const ySlow = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yMed = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, -160]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Soft radial washes (same as /creative, different palette from /academy) */}
      <motion.div
        style={reduce ? undefined : { y: ySlow }}
        className="absolute -top-32 -left-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-400/18 via-orange-300/14 to-lime-300/12 sm:h-[38rem] sm:w-[38rem] sm:-top-40 sm:-left-32 blur-2xl"
      />
      <motion.div
        style={reduce ? undefined : { y: yMed }}
        className="absolute -bottom-36 -right-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-cyan-400/18 via-sky-300/14 to-indigo-300/12 sm:h-[36rem] sm:w-[36rem] sm:-bottom-44 sm:-right-28 blur-2xl"
      />

      {/* Floating gradient orbs (continuous + parallax) */}
      {!reduce && !isMobile && (
        <>
          <motion.div
            style={{ y: yFast }}
            animate={{ x: [0, 18, -18, 0], y: [0, -12, 12, 0], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[10%] top-[22%] h-36 w-36 rounded-full bg-gradient-to-br from-teal-400/45 via-cyan-300/40 to-emerald-300/40 blur-lg"
          />
          <motion.div
            style={{ y: yMed }}
            animate={{ x: [0, -14, 14, 0], y: [0, 10, -10, 0], rotate: [0, -10, 10, 0] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[12%] top-[60%] h-48 w-48 rounded-full bg-gradient-to-br from-amber-300/45 via-rose-300/40 to-fuchsia-300/40 blur-xl"
          />
        </>
      )}
    </div>
  );
}

type Palette = "indigo" | "violet" | "emerald" | "amber";

/* ---------- Gradient artwork for each slide (palette & behavior match /creative) ---------- */
function GradientArt({
  palette = "indigo",
  container,
  depth = 1,
  overlayIcon: OverlayIcon,
}: {
  palette?: Palette;
  container: React.RefObject<HTMLDivElement | null>;
  depth?: number;
  overlayIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}): React.JSX.Element {
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ container: container as React.RefObject<HTMLElement> });

  // Parallax: desktop moves up (-y), mobile moves down (+y) so it never covers text
  const y = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 36 * depth] : [0, -72 * depth]);

  // Palette aligned with /creative
  const map: Record<Palette, { a: string; b: string }> = {
    indigo: {
      a: "from-indigo-300/55 via-cyan-300/45 to-violet-300/45",
      b: "from-fuchsia-300/45 via-sky-300/40 to-rose-300/40",
    },
    violet: {
      a: "from-violet-300/55 via-rose-300/45 to-amber-300/45",
      b: "from-indigo-300/45 via-fuchsia-300/40 to-sky-300/40",
    },
    emerald: {
      a: "from-emerald-300/55 via-teal-300/45 to-cyan-300/45",
      b: "from-lime-300/45 via-emerald-300/40 to-teal-300/40",
    },
    amber: {
      a: "from-amber-300/55 via-orange-300/45 to-rose-300/45",
      b: "from-lime-300/45 via-amber-300/40 to-fuchsia-300/40",
    },
  };

  const col = map[palette];

  return (
    <motion.div
      style={reduce ? undefined : { y, contain: "paint" }}
      className="relative z-0 mx-auto w-full max-w-[16rem] sm:max-w-xs will-change-transform"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-900/10 bg-white/70 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        {/* Soft highlight */}
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-black/0 to-black/0 dark:from-white/10 dark:to-transparent" />

        {/* Animated blobs */}
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { x: [0, 16, -16, 0], y: [0, -12, 12, 0], rotate: [0, 6, -6, 0] }}
          transition={reduce ? undefined : { duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -left-10 -top-8 h-48 w-48 rounded-full bg-gradient-to-br ${col.a} blur-2xl`}
        />
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { x: [0, -14, 14, 0], y: [0, 10, -10, 0], rotate: [0, -8, 8, 0] }}
          transition={reduce ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
          className={`absolute -bottom-12 -right-10 h-60 w-60 rounded-full bg-gradient-to-br ${col.b} blur-2xl`}
        />

        {/* Center radial */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_60%,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.02)_35%,transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.06)_35%,transparent_60%)]"
        />

        {/* Icon overlay (size/style matches /creative) */}
        {OverlayIcon && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="rounded-2xl bg-neutral-900/10 p-2.5 backdrop-blur-md dark:bg-black/25">
              <OverlayIcon className="h-10 w-10 text-neutral-900 drop-shadow dark:h-12 dark:w-12 dark:text-white" />
            </div>
          </div>
        )}

        {/* Border glow */}
        <div className="pointer-events-none absolute -inset-[1px] rounded-2xl ring-1 ring-neutral-900/10 dark:ring-white/15" />
      </div>
    </motion.div>
  );
}

/* ---------- Slide ---------- */
type SlideProps = {
  index: number;
  title: string;
  kicker?: string;
  description?: string;
  bullets?: readonly string[];
  tint?: Palette;
  cta?: React.ReactNode;
  headIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  artDepth?: number;
  scrollContainer: React.RefObject<HTMLDivElement | null>;
};

const Slide = forwardRef<HTMLDivElement, SlideProps>(function Slide(
  { index, title, kicker, description, bullets, tint, cta, headIcon: HeadIcon, artDepth = 1, scrollContainer },
  ref
) {
  return (
    <section
      ref={ref}
      id={`slide-${index}`}
      className="relative grid min-h-[100dvh] snap-start place-items-center px-4 py-16 sm:py-20 sm:px-8"
      role="region"
      aria-label={title}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 0.55 }}
        className="mx-auto w-full max-w-5xl"
      >
        <div className="relative mx-auto grid items-center gap-8 sm:gap-10 md:grid-cols-12">
          {/* TEXT */}
          <div className="relative z-10 md:col-span-7">
            {kicker && (
              <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10 dark:text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                {kicker}
              </div>
            )}
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl md:text-5xl dark:text-white">
              {title}
            </h2>
            {description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-700 sm:text-lg dark:text-white/85">
                {description}
              </p>
            )}
            {!!bullets?.length && (
              <ul className="mt-6 grid gap-2 text-neutral-800 dark:text-white/90">
                {bullets.map((b, i) => (
                  <li key={i} className="inline-flex items-start gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900/90 dark:bg-white/90" />
                    <span className="text-[15px] leading-relaxed sm:text-[16px]">{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {cta && <div className="mt-7 flex flex-wrap gap-3">{cta}</div>}
            {HeadIcon && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-900/10 bg-neutral-900/5 px-3 py-1 text-neutral-800 dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                <HeadIcon className="h-4 w-4" />
                <span className="text-xs">Pillar</span>
              </div>
            )}
          </div>

          {/* ART */}
          <div className="md:col-span-5 md:mt-0 mt-1 relative z-0">
            <GradientArt palette={tint} container={scrollContainer} depth={artDepth} overlayIcon={HeadIcon} />
          </div>
        </div>
      </motion.div>
    </section>
  );
});

/* ---------- Bottom rail (mobile) — thin, colored (match /creative) ---------- */
function MobileRail({
  total,
  activeIndex,
  onGo,
}: {
  total: number;
  activeIndex: number;
  onGo: (i: number) => void;
}) {
  return (
    <nav aria-label="Slide navigation" className="fixed inset-x-0 bottom-0 z-[90] md:hidden">
      <div className="mx-auto w-fit max-w-full" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        <div className="mx-4 mb-2 rounded-2xl bg-neutral-900/50 px-3 py-2 backdrop-blur-md ring-1 ring-black/10 dark:bg-black/40 dark:ring-white/10">
          <div className="flex items-center justify-center gap-0">
            {Array.from({ length: total }).map((_, i) => {
              const active = i === activeIndex;
              return (
                <button
                  key={i}
                  onClick={() => onGo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={active ? "true" : undefined}
                  className={`relative h-4 shrink-0 transition-[width,margin] duration-300 ease-out ${active ? "w-[38px] mx-1.5" : "w-[20px] mx-[2px] group"}`}
                >
                  <span
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[3px] rounded-full transition-[width,background-color,box-shadow] duration-300 ease-out
                    ${
                      active
                        ? "w-[30px] bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-300 shadow-[0_0_8px_rgba(99,102,241,0.45)]"
                        : "w-[10px] bg-neutral-300/80 dark:bg-white/60 group-hover:w-[14px] group-hover:bg-neutral-500/70 dark:group-hover:bg-white/80"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ---------- Right-side vertical nav (desktop only) ---------- */
function NavRail({
  total,
  activeIndex,
  onGo,
}: {
  total: number;
  activeIndex: number;
  onGo: (i: number) => void;
}): React.JSX.Element {
  return (
    <nav
      aria-label="Slide navigation"
      className="fixed right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-[70] hidden md:flex flex-col items-center gap-2 sm:gap-2.5"
    >
      {Array.from({ length: total }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={i}
            onClick={() => onGo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={active ? "true" : undefined}
            className="group relative"
          >
            <span
              className={`block w-[3px] rounded-full transition-all duration-300 ease-out ${
                active
                  ? "h-9 bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-amber-300 shadow-[0_0_10px_rgba(99,102,241,0.45)]"
                  : "h-5 bg-neutral-900/40 group-hover:h-6 group-hover:bg-neutral-900/70 dark:bg-white/50 dark:group-hover:bg-white/80"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}

/* ---------- Arrows (desktop) ---------- */
function FloatArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="fixed right-3 sm:right-4 md:right-6 bottom-6 z-[70] hidden sm:flex flex-col gap-2">
      <button
        onClick={onPrev}
        className="group inline-flex items-center justify-center rounded-xl border border-neutral-900/10 bg-white/80 px-3 py-2 text-neutral-900 shadow backdrop-blur supports-[backdrop-filter]:bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
        aria-label="Previous slide"
      >
        <ArrowUp className="h-4 w-4 transition-transform group-active:-translate-y-0.5" />
      </button>
      <button
        onClick={onNext}
        className="group inline-flex items-center justify-center rounded-xl border border-neutral-900/10 bg-white/80 px-3 py-2 text-neutral-900 shadow backdrop-blur supports-[backdrop-filter]:bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
        aria-label="Next slide"
      >
        <ArrowDown className="h-4 w-4 transition-transform group-active:translate-y-0.5" />
      </button>
    </div>
  );
}

/* ---------- (Optional) A&R pipeline chips (extra content) ---------- */
function PipelineChips(): React.JSX.Element {
  const steps: ReadonlyArray<{ label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = [
    { label: "Discover", Icon: Search },
    { label: "Qualify", Icon: Stars },
    { label: "Develop", Icon: Mic2 },
    { label: "Release", Icon: Network },
    { label: "Grow", Icon: Users },
  ];
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {steps.map((s, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900/10 bg-neutral-900/5 px-3 py-1 text-xs text-neutral-900/90 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
        >
          <s.Icon className="h-3.5 w-3.5" /> {s.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- Page ---------- */
export default function TalentPage(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);

  const registerRef = (i: number) => (el: HTMLDivElement | null): void => {
    sectionRefs.current[i] = el;
  };

  const slides = useMemo(
    () => [
      {
        title: "FMG Talent",
        kicker: "Beyond Sound. Built-in Intelligence.",
        description:
          "Scouting, A&R pipelines, development, management, and collaboration—one operating system for talent. We spot potential, shape artistry, and compound value across releases.",
        headIcon: Stars,
        tint: "indigo" as const,
        artDepth: 0.85,
        cta: (
          <>
            <a
              href="#slide-1"
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              Explore pillars
            </a>
            <a
              href="/talent/apply"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-900/30 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-900/5 dark:border-white/40 dark:text-white dark:hover:bg-white/10"
            >
              Submit demo
            </a>
          </>
        ),
      },
      {
        title: "Scouting Intelligence",
        kicker: "Signals • Fit • Momentum",
        description:
          "We assess prospects from socials, DSPs, UGC, and live circuits. The scorecard blends qualitative A&R notes with quantitative growth signals for a fair view.",
        bullets: [
          "Multi-source discovery: TikTok/IG/YouTube • DSP analytics • live tips",
          "Similarity search with roster & niche markets",
          "Readiness scoring: consistency, identity, live, brand fit",
          "Ethical intake: transparent feedback & next steps",
        ] as const,
        headIcon: Search,
        tint: "violet" as const,
        artDepth: 1.05,
        cta: <PipelineChips />,
      },
      {
        title: "A&R Pipelines",
        kicker: "From idea to release",
        description:
          "Stage-gated A&R with clear briefs, reference boards, and iterative sessions. We align on sound, story, and audience before greenlighting.",
        bullets: [
          "Brief → Demo → Iterations → Pre-pro → Recording → Post",
          "Reference boards & mood maps for a creative north star",
          "Weekly check-ins, versioning, and decision logs",
          "Go/No-Go gates tied to milestones & budget",
        ] as const,
        headIcon: Network,
        tint: "emerald" as const,
        artDepth: 1.1,
      },
      {
        title: "Development Tracks",
        kicker: "Vocal • Writing • Performance • Content",
        description:
          "Custom development sprints to sharpen craft and output. Vocal & writing coaching, co-write labs, and an authentic content engine.",
        bullets: [
          "Vocal coaching & ear training—goal-based",
          "Songwriting labs & topline camps",
          "Performance readiness: stagecraft & MD",
          "Content calendars with creative toolkits",
        ] as const,
        headIcon: Mic2,
        tint: "amber" as const,
        artDepth: 1.0,
      },
      {
        title: "Management Operations",
        kicker: "Rights • Releases • Ops",
        description:
          "360° management: calendars, budgets, rights, and reporting. Transparent splits, contracts, and post-release analytics for compounding learnings.",
        bullets: [
          "Release roadmap & OKRs per cycle",
          "Contracts & split sheets with audit trails",
          "Budgeting & vendor management",
          "Post-mortems: performance & LTV signals",
        ] as const,
        headIcon: Users,
        tint: "indigo" as const,
        artDepth: 0.95,
      },
      {
        title: "Career Acceleration",
        kicker: "Growth • Partnerships • Touring",
        description:
          "We plug artists into growth loops—PR, storytelling, partnerships, brand deals, and sustainable touring.",
        bullets: [
          "Narrative PR & owned media flywheel",
          "Playlisting strategy compliant with platform rules",
          "Brand & creator partnerships with clear value",
          "Tour mapping: markets, timing, unit economics",
        ] as const,
        headIcon: Rocket,
        tint: "violet" as const,
        artDepth: 1.05,
      },
      {
        title: "Collaboration Workflows",
        kicker: "Co-writes • Sessions • Approvals",
        description:
          "Frictionless collaboration across writers, producers, and brands. Clear IP, version control, stems, and approvals—all tracked.",
        bullets: [
          "Session planning & hold calendars",
          "Co-writes remote/IRL with secure file flows",
          "Versioning: stems, alt mixes, vocal comps",
          "Approvals & usage tracking for sync & campaigns",
        ] as const,
        headIcon: Share2,
        tint: "emerald" as const,
        artDepth: 1.15,
      },
    ],
    []
  );

  /* Track active slide */
  useEffect(() => {
    const nodes = sectionRefs.current.filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const idx = nodes.indexOf(visible[0].target as HTMLElement);
          if (idx !== -1) setActive(idx);
        }
      },
      { root: containerRef.current, threshold: [0.5, 0.7, 0.9] }
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  /* Keyboard ↑/↓ (desktop) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        jump(active + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        jump(active - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const jump = useCallback(
    (i: number) => {
      const last = slides.length; // +1 CTA slide
      const idx = Math.max(0, Math.min(last, i));
      sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [slides.length]
  );

  /* Desktop wheel → page-by-page (smooth, throttled) */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouch) return;

    let locked = false;
    let accum = 0;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (locked) return;
      accum += e.deltaY;
      const THRESH = 60;
      if (Math.abs(accum) < THRESH) return;

      locked = true;
      const dir = accum > 0 ? 1 : -1;
      accum = 0;
      jump(active + dir);
      setTimeout(() => {
        locked = false;
      }, 700);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as unknown as EventListener);
  }, [active, jump]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white">
      {/* <TopBar /> */}

      {/* Global parallax & floating objects */}
      <ParallaxField container={containerRef} />

      {/* Right-side vertical nav (desktop) */}
      <NavRail total={slides.length + 1} activeIndex={active} onGo={jump} />

      {/* Bottom rail (mobile) — thin, colored */}
      <MobileRail total={slides.length + 1} activeIndex={active} onGo={jump} />

      {/* Scroll container (aligned with /creative) */}
      <div
        ref={containerRef}
        className="relative z-10 h-[100dvh] overflow-y-auto overscroll-y-contain scroll-smooth snap-y snap-mandatory pb-[84px] md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <Slide
            key={i}
            ref={registerRef(i)}
            index={i}
            title={s.title}
            kicker={s.kicker}
            description={s.description}
            bullets={s.bullets}
            tint={s.tint}
            cta={s.cta}
            headIcon={s.headIcon}
            artDepth={s.artDepth}
            scrollContainer={containerRef}
          />
        ))}

        {/* CTA / Closing slide (aligned with /creative) */}
        <section
          ref={registerRef(slides.length)}
          className="relative grid min-h-[100dvh] snap-start place-items-center px-4 pt-12 pb-28 sm:pt-16 sm:pb-24 sm:px-8"
        >
          <div className="absolute inset-0 -z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.45 }}
              transition={{ duration: 0.8 }}
              className="absolute left-10 top-10 h-36 w-36 rounded-full bg-gradient-to-br from-fuchsia-400/30 via-rose-300/25 to-amber-300/25 blur-2xl"
            />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute right-10 bottom-10 h-48 w-48 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-black/5 via-black/10 to-black/5 blur-xl dark:from-white/5 dark:via-white/20 dark:to-white/5"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="text-3xl font-semibold sm:text-4xl md:text-5xl">Join the roster.</h2>
            <p className="mx-auto mt-3 max-w-xl text-neutral-700 dark:text-white/80">
              Tell us about your artistry, vision, and goals—we’ll review and respond. No shortcuts: ethical growth.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/talent/apply"
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
              >
                Submit demo
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-900/30 px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-900/5 dark:border-white/40 dark:text-white dark:hover:bg-white/10"
              >
                Talk to A&amp;R
              </a>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Arrow helpers (desktop only) */}
      <FloatArrows onPrev={() => jump(active - 1)} onNext={() => jump(active + 1)} />

      {/* Edge fades (light & dark) */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent dark:from-neutral-950" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-neutral-950" />
    </main>
  );
}
