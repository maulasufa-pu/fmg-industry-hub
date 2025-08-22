"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  GraduationCap,
  BookOpen,
  Users,
  Briefcase,
  CalendarClock,
  Rocket,
  Stars,
} from "lucide-react";

/*************************************************
 * FMG Universe — /academy
 * Training • Mentorship • Industry-ready skills that ship real work & careers
 * - Fullpage vertical slides (scroll-snap)
 * - Right-side slim nav rail (desktop), bottom dots (mobile)
 * - Parallax gradient art + floating background objects
 * - Strict-friendly types; no `any`
 *************************************************/

/* ---------- Top bar (optional) ---------- */
function TopBar(): React.JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex h-14 items-center justify-between px-4 sm:px-8">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-white backdrop-blur-md dark:bg-white/10">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-[11px] font-bold leading-none">
          FMG
        </span>
        <span className="text-xs tracking-wide opacity-90">Universe • Academy</span>
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
                <span className="text-xs">Program</span>
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

/* ---------- Bottom dots (mobile only) ---------- */
function MobileDots({ total, activeIndex, onGo }: { total: number; activeIndex: number; onGo: (i: number) => void }): React.JSX.Element {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] md:hidden">
      <div className="mx-auto w-full max-w-md" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
        <div className="mx-4 mb-2 flex items-center justify-center gap-2 rounded-2xl bg-black/40 px-3 py-2 backdrop-blur-md ring-1 ring-white/10">
          {Array.from({ length: total }).map((_, i) => (
            <button key={i} onClick={() => onGo(i)} aria-label={`Go to slide ${i + 1}`} className={`h-1.5 rounded-full transition-all ${activeIndex === i ? "w-8 bg-white" : "w-2.5 bg-white/55"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Right-side vertical nav (rail — desktop only) ---------- */
function NavRail({ total, activeIndex, onGo }: { total: number; activeIndex: number; onGo: (i: number) => void }): React.JSX.Element {
  return (
    <nav aria-label="Slide navigation" className="fixed right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-[70] hidden md:flex flex-col items-center gap-2 sm:gap-2.5">
      {Array.from({ length: total }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <button key={i} onClick={() => onGo(i)} aria-label={`Go to slide ${i + 1}`} aria-current={active ? "true" : undefined} className="group relative">
            <span className={`block w-[3px] rounded-full transition-all duration-300 ease-out ${active ? "h-9 bg-gradient-to-b from-indigo-400 via-fuchsia-400 to-amber-300 shadow-[0_0_12px_rgba(99,102,241,0.6)]" : "h-5 bg-white/50 group-hover:h-6 group-hover:bg-white/80"}`} />
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
      <button onClick={onPrev} className="group inline-flex items-center justify-center rounded-xl bg-white/80 px-3 py-2 text-neutral-900 shadow backdrop-blur supports-[backdrop-filter]:bg-white/70 hover:bg-white dark:bg-white/10 dark:text-white" aria-label="Previous slide">
        <ArrowUp className="h-4 w-4 transition-transform group-active:-translate-y-0.5" />
      </button>
      <button onClick={onNext} className="group inline-flex items-center justify-center rounded-xl bg-white/80 px-3 py-2 text-neutral-900 shadow backdrop-blur supports-[backdrop-filter]:bg-white/70 hover:bg-white dark:bg-white/10 dark:text-white" aria-label="Next slide">
        <ArrowDown className="h-4 w-4 transition-transform group-active:translate-y-0.5" />
      </button>
    </div>
  );
}

/* ---------- Track chips (optional visual aid) ---------- */
function TrackChips(): React.JSX.Element {
  const tracks: ReadonlyArray<{ label: string }> = [
    { label: "Songwriting" },
    { label: "Production" },
    { label: "A&R" },
    { label: "Publishing" },
    { label: "Marketing" },
    { label: "Live/Stage" },
  ];
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tracks.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/90">
          {t.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- Page ---------- */
export default function AcademyPage(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);

  const registerRef = (i: number) => (el: HTMLDivElement | null): void => {
    sectionRefs.current[i] = el;
  };

  const slides = useMemo(
    () => [
      {
        title: "FMG Academy",
        kicker: "Learn • Mentor • Ship",
        description:
          "Training, mentorship, and industry‑ready skills. We ship real work and real careers — with standards that match the FMG roster.",
        headIcon: GraduationCap,
        tint: "indigo" as const,
        artDepth: 0.85,
        cta: (
          <>
            <a href="#slide-1" className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow hover:bg-neutral-100">Explore programs</a>
            <a href="/academy/apply" className="inline-flex items-center justify-center rounded-xl border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Apply now</a>
          </>
        ),
      },
      {
        title: "Training Tracks",
        kicker: "Songwriting • Production • A&R • Publishing • Marketing",
        description:
          "Modular curriculum with weekly milestones, critiques, and deliverables. Learn by doing — guided by practitioners.",
        bullets: [
          "Weekly briefs & graded deliverables",
          "Reference boards & technique labs",
          "Tooling: DAW workflows, metadata, distro",
          "Peer review & instructor feedback",
        ] as const,
        headIcon: BookOpen,
        tint: "violet" as const,
        artDepth: 1.05,
        cta: <TrackChips />,
      },
      {
        title: "Mentorship",
        kicker: "1:1 • Pods • Office Hours",
        description:
          "Senior producers, writers, and managers give direct critique and career direction. No fluff — honest notes that level you up.",
        bullets: [
          "Monthly 1:1s with mentors",
          "Cohort pods & live crit sessions",
          "Office hours & async feedback",
          "Guest mentors from FMG Universe",
        ] as const,
        headIcon: Users,
        tint: "emerald" as const,
        artDepth: 1.1,
      },
      {
        title: "Industry Projects",
        kicker: "Briefs • Deadlines • Credits",
        description:
          "Ship real work: pitch for FMG units, brand briefs, and sync‑ready cues. Build portfolio pieces that actually count.",
        bullets: [
          "Live briefs from FMG Creative & Publishing",
          "Release sprints with QA & version control",
          "Credits & metadata hygiene",
          "Showcase & portfolio reviews",
        ] as const,
        headIcon: Rocket,
        tint: "amber" as const,
        artDepth: 1.0,
      },
      {
        title: "Career Readiness",
        kicker: "Portfolio • Network • Opportunities",
        description:
          "Turn outputs into outcomes — portfolios, interviews, internships, and gigs through the FMG network.",
        bullets: [
          "Portfolio & reel coaching",
          "Interview prep & mock panels",
          "Partner internships & gigs",
          "Alumni community & ongoing support",
        ] as const,
        headIcon: Briefcase,
        tint: "indigo" as const,
        artDepth: 0.95,
      },
      {
        title: "Cohorts & Admissions",
        kicker: "Schedules • Scholarships • Requirements",
        description:
          "Rolling admissions with cohort intakes. Scholarships available; we value potential and grit.",
        bullets: [
          "Quarterly cohorts & part‑time options",
          "Scholarships & need‑based aid",
          "Prereqs: basic DAW literacy (or prep course)",
          "Time commitment: 6–10 hrs/week",
        ] as const,
        headIcon: CalendarClock,
        tint: "violet" as const,
        artDepth: 1.05,
        cta: (
          <a href="/academy/apply" className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow hover:bg-neutral-100">Start your application</a>
        ),
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
  }, [active]);

  const jump = useCallback(
    (i: number) => {
      const last = slides.length; // +1 CTA slide di akhir
      const idx = Math.max(0, Math.min(last, i));
      sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [slides.length]
  );

  return (
    <main className="relative min-h-screen bg-neutral-950 text-white overflow-hidden">
      {/* <TopBar /> */}

      {/* Global parallax & floating objects */}
      <ParallaxField container={containerRef} />

      {/* Right-side vertical nav (desktop) */}
      <NavRail total={slides.length + 1} activeIndex={active} onGo={jump} />

      {/* Bottom dots (mobile) */}
      <MobileDots total={slides.length + 1} activeIndex={active} onGo={jump} />

      {/* Scroll container */}
      <div
        ref={containerRef}
        className="relative z-10 h-screen snap-y snap-proximity md:snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth pb-[72px] md:pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            <h2 className="text-3xl font-semibold sm:text-4xl md:text-5xl">Level up at FMG Academy.</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">Join a cohort, find mentors, and ship work that opens doors. We invest in potential and craft.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a href="/academy/apply" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow hover:bg-neutral-100">Apply today</a>
              <a href="/contact" className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Talk to admissions</a>
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
