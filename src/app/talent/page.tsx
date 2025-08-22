"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Brain,
  CalendarClock,
  LineChart,
  Mic2,
  Network,
  Rocket,
  Search,
  Share2,
  Stars,
  Users,
} from "lucide-react";

/*************************************************
 * FMG Universe — /talent
 * Scouting • A&R • Development • Management • Career Acceleration • Collaboration
 * - Fullpage vertical slides (scroll-snap)
 * - Right-side slim nav rail (desktop), bottom dots (mobile)
 * - Parallax gradient art + floating background objects
 * - No `any`, strict-friendly types
 *************************************************/

/* ---------- Top bar (optional) ---------- */
function TopBar(): React.JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex h-14 items-center justify-between px-4 sm:px-8">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-white backdrop-blur-md dark:bg-white/10">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-bold leading-none">
          FMG
        </span>
        <span className="text-xs tracking-wide opacity-90">Universe • Talent</span>
      </div>
      <div className="pointer-events-auto hidden sm:inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-[12px] text-white backdrop-blur-md dark:bg-white/10">
        <span className="opacity-80">Scroll</span>
        <ArrowDown className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

/* ---------- Global floating parallax background ---------- */
function ParallaxField({ container }: { container: React.RefObject<HTMLDivElement | null> }): React.JSX.Element {
  const { scrollYProgress } = useScroll({ container: container as React.RefObject<HTMLElement> });
  const ySlow = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const yMed = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, -220]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Soft radial washes */}
      <motion.div style={{ y: ySlow }} className="absolute -top-40 -left-32 h-[42rem] w-[42rem] rounded-full bg-gradient-to-br from-indigo-500/25 via-fuchsia-500/20 to-sky-500/15 blur-3xl" />
      <motion.div style={{ y: yMed }} className="absolute -bottom-40 -right-24 h-[38rem] w-[38rem] rounded-full bg-gradient-to-tr from-emerald-500/25 via-teal-400/20 to-cyan-400/10 blur-3xl" />

      {/* Floating nodes (continuous + parallax) */}
      <motion.div
        style={{ y: yFast }}
        animate={{ x: [0, 18, -18, 0], y: [0, -12, 12, 0], rotate: [0, 8, -8, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[8%] top-[25%] h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/70 via-fuchsia-400/60 to-amber-300/60 blur-xl"
      />
      <motion.div
        style={{ y: yMed }}
        animate={{ x: [0, -14, 14, 0], y: [0, 10, -10, 0], rotate: [0, -10, 10, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[12%] top-[60%] h-56 w-56 rounded-full bg-gradient-to-br from-sky-400/70 via-indigo-400/60 to-fuchsia-300/60 blur-2xl"
      />
      <motion.div
        style={{ y: ySlow }}
        animate={{ x: [0, 12, -12, 0], y: [0, -8, 8, 0], rotate: [0, 6, -6, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[65%] top-[15%] h-28 w-28 rounded-3xl bg-gradient-to-br from-amber-300/70 via-rose-300/60 to-lime-300/60 blur-lg"
      />
    </div>
  );
}

/* ---------- Gradient artwork for each slide ---------- */
function GradientArt({
  palette = "indigo",
  container,
  depth = 1,
  overlayIcon: OverlayIcon,
}: {
  palette?: "indigo" | "violet" | "emerald" | "amber";
  container: React.RefObject<HTMLDivElement | null>;
  depth?: number; // parallax intensity factor
  overlayIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}): React.JSX.Element {
  const { scrollYProgress } = useScroll({ container: container as React.RefObject<HTMLElement> });
  const y = useTransform(scrollYProgress, [0, 1], [0, depth * -120]);

  const colorMap: Record<string, { a: string; b: string; c: string }> = {
    indigo: {
      a: "from-indigo-400 via-fuchsia-400 to-sky-300",
      b: "from-sky-400 via-cyan-300 to-indigo-300",
      c: "from-fuchsia-400 via-rose-300 to-amber-300",
    },
    violet: {
      a: "from-violet-400 via-fuchsia-400 to-indigo-300",
      b: "from-rose-300 via-amber-300 to-violet-300",
      c: "from-sky-400 via-indigo-300 to-fuchsia-300",
    },
    emerald: {
      a: "from-emerald-400 via-teal-400 to-cyan-300",
      b: "from-lime-300 via-emerald-300 to-teal-300",
      c: "from-cyan-400 via-sky-300 to-emerald-300",
    },
    amber: {
      a: "from-amber-300 via-orange-300 to-rose-300",
      b: "from-fuchsia-300 via-rose-300 to-amber-300",
      c: "from-lime-300 via-amber-300 to-orange-300",
    },
  };

  const col = colorMap[palette];

  return (
    <motion.div style={{ y }} className="relative mx-auto aspect-square max-w-[16rem] sm:max-w-xs overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
      {/* Glass highlight */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-white/15 to-transparent" />

      {/* Animated blobs */}
      <motion.div
        animate={{ x: [0, 18, -18, 0], y: [0, -14, 14, 0], rotate: [0, 8, -8, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -left-10 -top-6 h-44 w-44 rounded-full bg-gradient-to-br ${col.a} blur-2xl opacity-90`}
      />
      <motion.div
        animate={{ x: [0, -16, 16, 0], y: [0, 12, -12, 0], rotate: [0, -10, 10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        className={`absolute -bottom-10 -right-8 h-56 w-56 rounded-full bg-gradient-to-br ${col.b} blur-2xl opacity-80`}
      />
      <motion.div
        animate={{ x: [0, 10, -10, 0], y: [0, 10, -10, 0], rotate: [0, 6, -6, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        className={`absolute left-10 top-12 h-28 w-28 rounded-3xl bg-gradient-to-br ${col.c} blur-lg opacity-90`}
      />

      {/* Icon overlay (white, thin) */}
      {OverlayIcon && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="rounded-xl bg-black/25 p-2 backdrop-blur">
            <OverlayIcon className="h-8 w-8 text-white" />
          </div>
        </div>
      )}

      {/* Border glow */}
      <div className="pointer-events-none absolute -inset-[1px] rounded-2xl ring-1 ring-white/15" />
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
  tint?: "indigo" | "violet" | "emerald" | "amber";
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
      className="relative grid min-h-screen snap-start place-items-center px-4 py-16 sm:py-20 sm:px-8"
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
        <div className="mx-auto grid items-center gap-10 sm:gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            {kicker && (
              <div className="inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                {kicker}
              </div>
            )}
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-5xl">{title}</h2>
            {description && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">{description}</p>
            )}
            {!!bullets?.length && (
              <ul className="mt-6 grid gap-2 text-white/90">
                {bullets.map((b, i) => (
                  <li key={i} className="inline-flex items-start gap-3">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-white/90" />
                    <span className="text-[15px] leading-relaxed sm:text-[16px]">{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {cta && <div className="mt-7 flex flex-wrap gap-3">{cta}</div>}
            {HeadIcon && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                <HeadIcon className="h-4 w-4" />
                <span className="text-xs">Pillar</span>
              </div>
            )}
          </div>

          <div className="md:col-span-5">
            <GradientArt palette={tint} container={scrollContainer} depth={artDepth} overlayIcon={HeadIcon} />
          </div>
        </div>
      </motion.div>
    </section>
  );
});

/* ---------- Right-side vertical nav (rail — desktop only) ---------- */
function NavRail({
  total,
  activeIndex,
  onGo,
}: {
  total: number;
  activeIndex: number;
  onGo: (i: number) => void;
}) {
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
                  ? "h-9 bg-gradient-to-b from-indigo-400 via-fuchsia-400 to-amber-300 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
                  : "h-5 bg-white/50 group-hover:h-6 group-hover:bg-white/80"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}

/* ---------- Bottom dots (mobile only) ---------- */
function MobileDots({ total, activeIndex, onGo }: { total: number; activeIndex: number; onGo: (i: number) => void }): React.JSX.Element {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] md:hidden">
      <div
        className="mx-auto w-full max-w-md"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-4 mb-2 flex items-center justify-center gap-2 rounded-2xl bg-black/40 px-3 py-2 backdrop-blur-md ring-1 ring-white/10">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => onGo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${activeIndex === i ? "w-8 bg-white" : "w-2.5 bg-white/55"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Arrows (desktop) ---------- */
function FloatArrows({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <div className="fixed right-3 sm:right-4 md:right-6 bottom-6 z-[70] hidden sm:flex flex-col gap-2">
      <button onClick={onPrev} className="group inline-flex items-center justify-center rounded-xl bg-white/80 px-3 py-2 text-neutral-900 shadow backdrop-blur supports-[backdrop-filter]:bg-white/70 hover:bg-white dark:bg-white/10 dark:text-white" aria-label="Previous slide">
        <ArrowUp className="h-4 w-4 transition-transform group-active:-translate-y-0.5" />
      </button>
      <button onClick={onNext} className="group inline-flex items-center justify-center rounded-xl bg-white/80 px-3 py-2 text-neutral-900 shadow backdrop-blur supports-[backdrop-filter]:bg-white/70 hover:bg-white dark:bg-white/10 dark:text-white" aria-label="Next slide">
        <ArrowDown className="h-4 w-4 transition-transform group-active:translate-y-0.5" />
      </button>
    </div>
  );
}

/* ---------- A&R mini pipeline (chips) ---------- */
function PipelineChips(): React.JSX.Element {
  const steps: ReadonlyArray<{ label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = [
    { label: "Discover", Icon: Search },
    { label: "Qualify", Icon: BadgeCheck },
    { label: "Develop", Icon: Brain },
    { label: "Release", Icon: CalendarClock },
    { label: "Grow", Icon: LineChart },
  ];
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {steps.map((s, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90">
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
          "Scouting, A&R pipelines, development, management and collaboration—one operating system for talent. We discover potential, shape artistry, and compound value across releases.",
        headIcon: Stars,
        tint: "indigo" as const,
        artDepth: 0.8,
        cta: (
          <>
            <a href="#slide-1" className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow hover:bg-neutral-100">Explore pillars</a>
            <a href="/talent/apply" className="inline-flex items-center justify-center rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Submit demo</a>
          </>
        ),
      },
      {
        title: "Scouting Intelligence",
        kicker: "Signals • Fit • Momentum",
        description:
          "We score prospects from socials, DSPs, UGC, and live circuits. Our scorecards blend qualitative A&R notes with quantitative growth signals for an unbiased view.",
        bullets: [
          "Multi-source discovery: TikTok/IG/YouTube • DSP analytics • live tips",
          "Similarity search to roster & market niches",
          "Readiness scoring: consistency, identity, live, brand fit",
          "Ethical intake: transparent feedback & next steps",
        ] as const,
        headIcon: Search,
        tint: "violet" as const,
        artDepth: 1.0,
        cta: <PipelineChips />,
      },
      {
        title: "A&R Pipelines",
        kicker: "From idea to release",
        description:
          "Stage-gated A&R with clear briefs, reference boards, and iterative sessions. Alignment on sound, story, and audience before greenlight.",
        bullets: [
          "Brief → Demo → Iterations → Pre-pro → Recording → Post",
          "Reference boards & moodmaps to lock creative north star",
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
          "Custom development sprints to sharpen craft and output. We coach vocals & writing, run co-write labs, and build content engines around authentic identity.",
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
          "360° management: calendars, budgets, rights, and reporting. Transparent splits, contracts, and post-release analytics to compound learning.",
        bullets: [
          "Release roadmap & OKRs per cycle",
          "Contracts & split sheets with audit trails",
          "Budgeting & vendor management",
          "Post-mortems: performance & LTV signals",
        ] as const,
        headIcon: Users,
        tint: "indigo" as const,
        artDepth: 0.9,
      },
      {
        title: "Career Acceleration",
        kicker: "Growth • Partnerships • Touring",
        description:
          "We plug artists into growth loops—PR, storytelling, partnerships, brand deals, and sustainable touring. Momentum without shortcuts.",
        bullets: [
          "Narrative PR & owned media flywheel",
          "Playlisting strategy that respects platform rules",
          "Brand & creator partnerships with clear value exchange",
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
          "Frictionless collaboration across writers, producers, and brands. Clear IP, version control, stems, and approvals—all logged.",
        bullets: [
          "Session planning & hold calendars",
          "Remote/IRL co-writes with secure file flows",
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

  /* Observer to track active slide */
  useEffect(() => {
    const nodes = sectionRefs.current.filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
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
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const jump = useCallback(
    (i: number) => {
      const last = slides.length; // +1 CTA slide di akhir
      const idx = Math.max(0, Math.min(last, i));
      sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [slides.length]
  );

  return (
    <main className="relative min-h-screen bg-neutral-950 text-white">
      {/* <TopBar /> */}

      {/* Global parallax & floating objects */}
      <ParallaxField container={containerRef} />

      {/* Right-side vertical nav (rail desktop) */}
      <NavRail total={slides.length + 1} activeIndex={active} onGo={jump} />

      {/* Bottom dots (mobile) */}
      <MobileDots total={slides.length + 1} activeIndex={active} onGo={jump} />

      {/* Scroll container */}
      <div
        ref={containerRef}
        className="h-screen snap-y snap-proximity md:snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth pb-[72px] md:pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

        {/* CTA / Closing slide */}
        <section ref={registerRef(slides.length)} className="relative grid min-h-screen snap-start place-items-center px-4 py-20 sm:py-24 sm:px-8">
          <div className="absolute inset-0 -z-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ duration: 0.8 }} className="absolute left-10 top-10 h-36 w-36 rounded-full bg-gradient-to-br from-fuchsia-400/40 via-rose-300/30 to-amber-300/30 blur-2xl" />
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute right-10 bottom-10 h-48 w-48 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-white/5 via-white/20 to-white/5 blur-xl" />
          </div>

          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.5 }} className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold sm:text-4xl md:text-5xl">Join the roster.</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Tell us about your artistry, vision, and goals—we'll review and respond. No shortcuts: ethics-first growth.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a href="/talent/apply" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow hover:bg-neutral-100">
                Submit demo
              </a>
              <a href="/contact" className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
                Talk to A&R
              </a>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Arrow helpers (desktop only) */}
      <FloatArrows onPrev={() => jump(active - 1)} onNext={() => jump(active + 1)} />

      {/* Edge fades */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-16 bg-gradient-to-b from-neutral-950 to-transparent" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-950 to-transparent" />
    </main>
  );
}
