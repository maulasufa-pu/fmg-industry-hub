"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import { useReducedMotion, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  HeartHandshake,
  Lightbulb,
  LineChart,
  MapPin,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";


function useIsMobile(breakpoint = 768): boolean {
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

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function ParallaxField({ container }: { container: React.RefObject<HTMLDivElement | null> }) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ container: container as React.RefObject<HTMLElement> });

  const ySlow = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yMed  = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, -160]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {reduce || isMobile ? (
        <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/16 via-fuchsia-500/14 to-sky-500/10 sm:h-[36rem] sm:w-[36rem] sm:-top-40 sm:-left-32 blur-xl sm:blur-2xl" />
      ) : (
        <motion.div
          style={{ y: ySlow }}
          className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/16 via-fuchsia-500/14 to-sky-500/10 sm:h-[36rem] sm:w-[36rem] sm:-top-40 sm:-left-32 blur-xl sm:blur-2xl"
        />
      )}

      {reduce || isMobile ? (
        <div className="absolute -bottom-32 -right-20 h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-emerald-500/18 via-teal-400/14 to-cyan-400/10 sm:h-[34rem] sm:w-[34rem] sm:-bottom-40 sm:-right-24 blur-xl sm:blur-2xl" />
      ) : (
        <motion.div
          style={{ y: yMed }}
          className="absolute -bottom-32 -right-20 h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-emerald-500/18 via-teal-400/14 to-cyan-400/10 sm:h-[34rem] sm:w-[34rem] sm:-bottom-40 sm:-right-24 blur-xl sm:blur-2xl"
        />
      )}

      {!reduce && !isMobile && (
        <>
          <motion.div
            style={{ y: yFast }}
            animate={{ x: [0, 18, -18, 0], y: [0, -12, 12, 0], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-[8%] top-[25%] h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/50 via-fuchsia-400/45 to-amber-300/45 blur-lg"
          />
          <motion.div
            style={{ y: yMed }}
            animate={{ x: [0, -14, 14, 0], y: [0, 10, -10, 0], rotate: [0, -10, 10, 0] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
            className="absolute right-[12%] top-[60%] h-40 w-40 rounded-full bg-gradient-to-br from-sky-400/50 via-indigo-400/45 to-fuchsia-300/45 blur-xl"
          />
        </>
      )}
    </div>
  );
}

type Palette = "indigo" | "violet" | "emerald" | "amber";

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

  const y = useTransform(scrollYProgress, [0, 1], isMobile ? [0, 36 * depth] : [0, -72 * depth]);

  const map: Record<Palette, { a: string; b: string }> = {
    indigo: {
      a: "from-indigo-400/50 via-fuchsia-400/40 to-sky-300/40",
      b: "from-sky-400/40 via-cyan-300/32 to-indigo-300/32",
    },
    violet: {
      a: "from-violet-400/50 via-fuchsia-400/40 to-indigo-300/40",
      b: "from-rose-300/40 via-amber-300/32 to-violet-300/32",
    },
    emerald: {
      a: "from-emerald-400/50 via-teal-400/40 to-cyan-300/40",
      b: "from-lime-300/40 via-emerald-300/32 to-teal-300/32",
    },
    amber: {
      a: "from-amber-300/50 via-orange-300/40 to-rose-300/40",
      b: "from-fuchsia-300/40 via-rose-300/32 to-amber-300/32",
    },
  };

  const col = map[palette];

  return (
    <motion.div
      style={reduce ? undefined : { y, contain: "paint" as const }}
      className="relative z-0 mx-auto w-full max-w-[18rem] sm:max-w-xs will-change-transform"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-900/10 bg-white/70 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-black/0 to-black/0 dark:from-white/10 dark:to-transparent" />

        <motion.div
          aria-hidden
          animate={reduce ? undefined : { x: [0, 14, -14, 0], y: [0, -10, 10, 0], rotate: [0, 6, -6, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -left-12 -top-10 h-52 w-52 rounded-full bg-gradient-to-br ${col.a} blur-2xl`}
        />
        <motion.div
          aria-hidden
          animate={reduce ? undefined : { x: [0, -12, 12, 0], y: [0, 8, -8, 0], rotate: [0, -6, 6, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
          className={`absolute -bottom-14 -right-12 h-64 w-64 rounded-full bg-gradient-to-br ${col.b} blur-2xl`}
        />

        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_60%,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.02)_35%,transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.06)_35%,transparent_60%)]"
        />

        {OverlayIcon && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="rounded-2xl bg-neutral-900/10 p-3 backdrop-blur-md dark:bg-black/25">
              <OverlayIcon className="h-16 w-16 text-neutral-900 drop-shadow dark:h-20 dark:w-20 dark:text-white" />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute -inset-[1px] rounded-2xl ring-1 ring-neutral-900/10 dark:ring-white/15" />
      </div>
    </motion.div>
  );
}

type Team =
  | "Creative"
  | "Engineering"
  | "Data & AI"
  | "Operations"
  | "Marketing"
  | "Business";

type Location = "Remote" | "Jakarta, ID" | "Bandung, ID" | "Singapore";

type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Internship";

type Level = "Junior" | "Mid" | "Senior" | "Lead" | "Head";

type Role = {
  id: string;
  title: string;
  team: Team;
  level: Level;
  type: EmploymentType;
  location: Location;
  summary: string;
  tags: readonly string[];
};

const OPEN_ROLES: ReadonlyArray<Role> = [
  {
    id: "r1",
    title: "A&R Manager",
    team: "Creative",
    level: "Senior",
    type: "Full-time",
    location: "Jakarta, ID",
    summary:
      "Lead A&R scouting and pipeline across genres; craft briefs and decision logs; collaborate closely with Production & Publishing.",
    tags: ["Scouting", "A&R", "Talent"],
  },
  {
    id: "r2",
    title: "Music Producer",
    team: "Creative",
    level: "Mid",
    type: "Full-time",
    location: "Remote",
    summary:
      "End-to-end production from pre-pro to mastering. Comfortable with modern DAWs, metadata best practices, and cross-functional collaboration.",
    tags: ["Production", "DAW", "Mix/Master"],
  },
  {
    id: "r3",
    title: "Full-Stack Engineer (Next.js + Supabase)",
    team: "Engineering",
    level: "Senior",
    type: "Full-time",
    location: "Jakarta, ID",
    summary:
      "Build the FMG Universe platform (Next.js, Supabase, Tailwind) with a focus on reliability, RLS, performance, and developer experience.",
    tags: ["Next.js", "Supabase", "TypeScript"],
  },
  {
    id: "r4",
    title: "ML Engineer — Audio & Recommenders",
    team: "Data & AI",
    level: "Mid",
    type: "Full-time",
    location: "Remote",
    summary:
      "Research and ship models for audio understanding, similarity search, and talent scoring. Strong MLOps and rigorous evaluation.",
    tags: ["Python", "Embeddings", "Recsys"],
  },
  {
    id: "r5",
    title: "Data Analyst (Growth)",
    team: "Data & AI",
    level: "Junior",
    type: "Full-time",
    location: "Remote",
    summary:
      "Build growth dashboards, cohort analyses, and funnel insights across releases and campaigns. Strong SQL and clear communication.",
    tags: ["SQL", "Analytics", "Dashboards"],
  },
  {
    id: "r6",
    title: "Marketing Strategist — Music & Brands",
    team: "Marketing",
    level: "Senior",
    type: "Contract",
    location: "Jakarta, ID",
    summary:
      "Craft narratives, GTM, and brand/creator partnerships. Master modern channels with ethics and platform compliance.",
    tags: ["Strategy", "Partnerships", "GTM"],
  },
  {
    id: "r7",
    title: "Operations Specialist (Rights & Releases)",
    team: "Operations",
    level: "Mid",
    type: "Full-time",
    location: "Singapore",
    summary:
      "Manage release calendar, rights & splits, vendors, and reporting. Detail-oriented, systematic, and communicative.",
    tags: ["Ops", "Rights", "Releases"],
  },
  {
    id: "r8",
    title: "Business Development Manager",
    team: "Business",
    level: "Lead",
    type: "Full-time",
    location: "Jakarta, ID",
    summary:
      "Grow strategic partnerships, catalog, and revenue. Strong negotiation, pipeline management, and accurate forecasting.",
    tags: ["Deals", "Partnerships", "Revenue"],
  },
] as const;

function RoleCard({ role }: { role: Role }): React.JSX.Element {
  const href = `/careers/apply?role=${encodeURIComponent(slugify(role.title))}`;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-neutral-900/10 bg-white/70 p-4 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/5 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {role.title}
          </h4>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-700 dark:text-white/70">
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/5 px-2 py-1 dark:bg-white/10">
              <Users className="h-3.5 w-3.5" /> {role.team}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/5 px-2 py-1 dark:bg-white/10">
              <Briefcase className="h-3.5 w-3.5" /> {role.level} • {role.type}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900/5 px-2 py-1 dark:bg-white/10">
              <MapPin className="h-3.5 w-3.5" /> {role.location}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-900/10 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-100 dark:border-white/10 dark:bg-white/10 dark:text-white">
          <a href={href}>Apply</a>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-white/80">
        {role.summary}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {role.tags.map((t) => (
          <span
            key={t}
            className="rounded-full border border-neutral-900/10 bg-neutral-900/5 px-2 py-1 text-[11px] text-neutral-800 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="pointer-events-none absolute -inset-[1px] rounded-2xl ring-1 ring-neutral-900/10 group-hover:ring-neutral-900/20 dark:ring-white/15" />
    </div>
  );
}

type FilterState = {
  team: Team | "All";
  location: Location | "All";
  type: EmploymentType | "All";
  query: string;
};

const ALL_TEAMS: ReadonlyArray<Team | "All"> = [
  "All",
  "Creative",
  "Engineering",
  "Data & AI",
  "Operations",
  "Marketing",
  "Business",
] as const;

const ALL_LOCATIONS: ReadonlyArray<Location | "All"> = [
  "All",
  "Remote",
  "Jakarta, ID",
  "Bandung, ID",
  "Singapore",
] as const;

const ALL_TYPES: ReadonlyArray<EmploymentType | "All"> = [
  "All",
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
] as const;

function RolesFilter({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}): React.JSX.Element {
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-900/10 bg-white/70 p-3 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
      <label className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-900/10 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white">
        <Search className="h-4 w-4 opacity-70" />
        <input
          value={value.query}
          onChange={(e) => set("query", e.target.value)}
          placeholder="Search roles, skills, or tags…"
          className="w-full bg-transparent outline-none placeholder:text-neutral-400 dark:placeholder:text-white/50"
          aria-label="Search roles"
        />
      </label>

      {/* Team */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by team">
        {ALL_TEAMS.map((t) => {
          const active = value.team === t;
          return (
            <button
              key={t}
              onClick={() => set("team", t)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-neutral-900/10 bg-white/70 text-neutral-900 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by location">
        {ALL_LOCATIONS.map((l) => {
          const active = value.location === l;
          return (
            <button
              key={l}
              onClick={() => set("location", l)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-neutral-900/10 bg-white/70 text-neutral-900 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by employment type">
        {ALL_TYPES.map((t) => {
          const active = value.type === t;
          return (
            <button
              key={t}
              onClick={() => set("type", t)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                active
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-neutral-900/10 bg-white/70 text-neutral-900 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  isActive: boolean; 
};

const Slide = forwardRef<HTMLDivElement, SlideProps>(function Slide(
  { index, title, kicker, description, bullets, tint, cta, headIcon: HeadIcon, artDepth = 1, scrollContainer, isActive },
  ref
) {
  const reduce = useReducedMotion();
  return (
    <section
      ref={ref}
      id={`slide-${index}`}
      className="relative grid min-h-[100dvh] snap-start place-items-center px-4 py-16 sm:py-20 sm:px-8"
      role="region"
      aria-label={title}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={reduce ? undefined : isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.45 }}
        className="mx-auto w-full max-w-5xl"
      >
        <div className="relative mx-auto grid items-center gap-8 sm:gap-10 md:grid-cols-12">
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
                {bullets.map((b) => (
                  <li key={b} className="inline-flex items-start gap-3">
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
                <span className="text-xs">Section</span>
              </div>
            )}
          </div>

          <div className="md:col-span-5 md:mt-0 mt-1 relative z-0">
            <GradientArt
              palette={tint}
              container={scrollContainer}
              depth={artDepth}
              overlayIcon={HeadIcon}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
});

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
    <nav
      aria-label="Slide navigation"
      className="fixed inset-x-0 bottom-0 z-[90] md:hidden"
    >
      <div
        className="mx-auto w-fit max-w-full"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-4 mb-2 rounded-2xl bg-neutral-900/50 px-3 py-2 backdrop-blur-md ring-1 ring-black/10 dark:bg-black/40 dark:ring-white/10">
          <div className="flex items-center justify-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => {
              const active = i === activeIndex;
              return (
                <button
                  key={i}
                  onClick={() => onGo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={active ? "true" : undefined}
                  className="group relative h-4 w-4 shrink-0 sm:h-4 sm:w-4"
                >
                  <span
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[3px] rounded-full transition-[width,background-color,box-shadow] duration-300 ease-out
                      ${
                        active
                          ? "w-[30px] bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-300 shadow-[0_0_8px_rgba(99,102,241,0.45)]"
                          : "w-[10px] bg-neutral-300/80 dark:bg-white/60 group-hover:w-14 group-hover:bg-neutral-500/70 dark:group-hover:bg-white/80"
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

export default function CareersPage(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);

  const registerRef = (i: number) => (el: HTMLDivElement | null): void => {
    sectionRefs.current[i] = el;
  };

  const slides = useMemo(
    () => [
      {
        title: "Build the Operating System for Music",
        kicker: "Beyond Sound. Built-in Intelligence.",
        description:
          "FMG Universe is a global music company and platform unifying creation, talent, distribution, media, R&D, publishing, live, and education. We’re building one OS for music—helping artists, labels, and brands work smarter, ship faster, and compound value.",
        headIcon: Rocket,
        tint: "indigo" as const,
        artDepth: 0.9,
        cta: (
          <>
            <a
              href="#slide-1"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("slide-1")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
            >
              See open roles
            </a>
            <a
              href="/about"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-900/30 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-900/5 dark:border-white/40 dark:text-white dark:hover:bg-white/10"
            >
              About FMG
            </a>
          </>
        ),
      },
      {
        title: "Open Roles",
        kicker: "Team • Location • Type • Search",
        description:
          "We look for builders who love to ship. If you value high standards, cross-discipline collaboration, and ethical growth—this is your place.",
        headIcon: Briefcase,
        tint: "violet" as const,
        artDepth: 1.05,
      },
      {
        title: "Open Roles — Listings",
        kicker: "Browse all openings",
        description: "Scroll the list and apply in minutes.",
        headIcon: Briefcase,
        tint: "violet" as const,
        artDepth: 1.05,
      },
      {
        title: "Benefits & Perks",
        kicker: "Support to perform & grow",
        description:
          "We design a healthy, sustainable way of working—focused on impact, not aimless long hours.",
        headIcon: ShieldCheck,
        tint: "emerald" as const,
        artDepth: 1.0,
      },
      {
        title: "Life at FMG",
        kicker: "How we work & what we value",
        description:
          "Quality > quantity. Think clearly, execute simply, compound relentlessly. We’re honest with data and fair with people.",
        headIcon: Sparkles,
        tint: "amber" as const,
        artDepth: 1.05,
      },
      {
        title: "Hiring Process",
        kicker: "Transparent • Fast • Relevant",
        description:
          "A short process focused on the work that matters—not brainteasers.",
        headIcon: BadgeCheck,
        tint: "indigo" as const,
        artDepth: 0.9,
      },
    ],
    []
  );

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

  const jump = useCallback(
    (i: number) => {
      const last = slides.length;
      const idx = Math.max(0, Math.min(last, i));
      sectionRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [slides.length]
  );

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
  }, [active, jump]);

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
      window.setTimeout(() => {
        locked = false;
      }, 700);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [active, jump]);

  const [filter, setFilter] = useState<FilterState>({
    team: "All",
    location: "All",
    type: "All",
    query: "",
  });

  const filteredRoles = useMemo(() => {
    const q = filter.query.trim().toLowerCase();
    return OPEN_ROLES.filter((r) => {
      const okTeam = filter.team === "All" || r.team === filter.team;
      const okLoc = filter.location === "All" || r.location === filter.location;
      const okType = filter.type === "All" || r.type === filter.type;
      const okQuery =
        q.length === 0 ||
        r.title.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      return okTeam && okLoc && okType && okQuery;
    });
  }, [filter]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white">

      <ParallaxField container={containerRef} />
      <NavRail total={slides.length + 1} activeIndex={active} onGo={jump} />
      <MobileRail total={slides.length + 1} activeIndex={active} onGo={jump} />

      <div
        ref={containerRef}
        className="relative z-10 h-[100dvh] overflow-y-auto overscroll-y-contain scroll-smooth snap-y snap-mandatory pb-[84px] md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Slide
          ref={registerRef(0)}
          index={0}
          isActive={active === 0}
          title={slides[0].title}
          kicker={slides[0].kicker}
          description={slides[0].description}
          tint={slides[0].tint}
          headIcon={slides[0].headIcon}
          artDepth={slides[0].artDepth}
          cta={slides[0].cta}
          scrollContainer={containerRef}
        />

        <section
          ref={registerRef(1)}
          id="slide-1"
          className="relative grid min-h-[100dvh] snap-start place-items-center px-4 py-16 sm:py-20 sm:px-8"
          role="region"
          aria-label="Open Roles"
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={active === 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.45 }}
            className="mx-auto w-full max-w-5xl"
          >
            <div className="relative mx-auto grid items-start gap-8 sm:gap-10 md:grid-cols-12">
              <div className="relative z-10 md:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                  Team • Location • Type • Search
                </div>
                <h2 className="mt-4 text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl md:text-5xl dark:text-white">
                  Open Roles
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-700 sm:text-lg dark:text-white/85">
                  We’re hiring across Creative, Engineering, Data & AI, Operations, Marketing, and Business.
                </p>

                <div className="mt-6">
                  <RolesFilter value={filter} onChange={setFilter} />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#slide-2"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("slide-2")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                  >
                    View listings
                  </a>
                  <a
                    href="/careers/apply"
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-900/30 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-900/5 dark:border-white/40 dark:text-white dark:hover:bg-white/10"
                  >
                    General application
                  </a>
                </div>
              </div>

              <div className="md:col-span-5 md:mt-0 mt-1 relative z-0">
                <GradientArt
                  palette="violet"
                  container={containerRef}
                  depth={1.05}
                  overlayIcon={Briefcase}
                />
              </div>
            </div>
          </motion.div>
        </section>

        <section
          ref={registerRef(2)}
          id="slide-2"
          className="relative grid min-h-[100dvh] snap-start place-items-center px-4 py-16 sm:py-20 sm:px-8"
          role="region"
          aria-label="Open Roles — Listings"
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={active === 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.45 }}
            className="mx-auto w-full max-w-5xl"
          >
            <div className="relative mx-auto grid items-start gap-8 sm:gap-10 md:grid-cols-12">
              <div className="relative z-10 md:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                  All openings
                </div>
                <h2 className="mt-4 text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl md:text-5xl dark:text-white">
                  Listings
                </h2>
                <p className="mt-2 text-sm text-neutral-700 dark:text-white/80">
                  Showing {filteredRoles.length} role{filteredRoles.length === 1 ? "" : "s"}.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 max-h-[62vh] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {filteredRoles.length > 0 ? (
                    filteredRoles.map((role) => <RoleCard key={role.id} role={role} />)
                  ) : (
                    <div className="rounded-2xl border border-neutral-900/10 bg-white/70 p-6 text-sm text-neutral-700 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-white/80">
                      No results for the current filters. Try adjusting them or send a {" "}
                      <a href="/careers/apply" className="underline underline-offset-4">general application</a>.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="#slide-1"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("slide-1")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-900/30 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-900/5 dark:border-white/40 dark:text-white dark:hover:bg-white/10"
                  >
                    Adjust filters
                  </a>
                </div>
              </div>

              <div className="md:col-span-5 md:mt-0 mt-1 relative z-0">
                <GradientArt
                  palette="violet"
                  container={containerRef}
                  depth={1.05}
                  overlayIcon={Briefcase}
                />
              </div>
            </div>
          </motion.div>
        </section>

        <Slide
          ref={registerRef(3)}
          index={3}
          isActive={active === 3}
          title={slides[3].title}
          kicker={slides[3].kicker}
          description="A package designed to support high-quality work and life—without gimmicks."
          bullets={[
            "Health coverage & wellness stipend",
            "Flexible/remote-friendly, focused on outcomes",
            "Learning budget (courses, books, conferences)",
            "Equipment allowance & proper software stack",
            "Transparent compensation bands & reviews",
            "Human-friendly time-off policy",
          ]}
          tint="emerald"
          headIcon={ShieldCheck}
          artDepth={1.0}
          cta={
            <div className="inline-flex items-center gap-2 text-sm text-neutral-700 dark:text-white/80">
              <CheckCircle2 className="h-4 w-4" /> Equal Opportunity Employer
            </div>
          }
          scrollContainer={containerRef}
        />

        <section
          ref={registerRef(4)}
          id="slide-4"
          className="relative grid min-h-[100dvh] snap-start place-items-center px-4 py-16 sm:py-20 sm:px-8"
          role="region"
          aria-label="Life at FMG"
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={active === 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.45 }}
            className="mx-auto w-full max-w-5xl"
          >
            <div className="relative mx-auto grid items-center gap-8 sm:gap-10 md:grid-cols-12">
              <div className="relative z-10 md:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                  How we work & values
                </div>
                <h2 className="mt-4 text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl md:text-5xl dark:text-white">
                  Life at FMG
                </h2>
                <ul className="mt-6 grid gap-3 text-neutral-800 dark:text-white/90">
                  {[
                    { Icon: Lightbulb, text: "Clarity first — simple ideas, executed cleanly." },
                    { Icon: Zap, text: "Ship, measure, iterate — not guesswork without data." },
                    { Icon: HeartHandshake, text: "Kind & direct — honest with facts, respectful with people." },
                    { Icon: LineChart, text: "Compounding — learn from every release and campaign." },
                    { Icon: FileText, text: "Documentation — decisions and processes written clearly." },
                    { Icon: Building2, text: "Compliance — rights and obligations protected (rights, splits, vendors)." },
                  ].map(({ Icon, text }) => (
                    <li key={text} className="inline-flex items-start gap-3">
                      <Icon className="mt-[2px] h-4 w-4" />
                      <span className="text-[15px] leading-relaxed sm:text-[16px]">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-5 md:mt-0 mt-1 relative z-0">
                <GradientArt
                  palette="amber"
                  container={containerRef}
                  depth={1.05}
                  overlayIcon={Sparkles}
                />
              </div>
            </div>
          </motion.div>
        </section>

        <section
          ref={registerRef(5)}
          id="slide-5"
          className="relative grid min-h-[100dvh] snap-start place-items-center px-4 py-16 sm:py-20 sm:px-8"
          role="region"
          aria-label="Hiring Process"
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={active === 5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.45 }}
            className="mx-auto w-full max-w-5xl"
          >
            <div className="relative mx-auto grid items-center gap-8 sm:gap-10 md:grid-cols-12">
              <div className="relative z-10 md:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                  Transparent • Fast • Relevant
                </div>
                <h2 className="mt-4 text-3xl font-semibold leading-tight text-neutral-900 sm:text-4xl md:text-5xl dark:text-white">
                  Hiring Process
                </h2>
                <ol className="mt-6 grid gap-3 text-neutral-800 dark:text-white/90">
                  {[
                    { Icon: FileText, label: "Apply", desc: "CV/portfolio plus a few short questions." },
                    { Icon: Users, label: "Conversation", desc: "30–40 min on mission, experience, and expectations." },
                    { Icon: CalendarClock, label: "Practical Task", desc: "Role-relevant exercise. Reasonable time, clear brief." },
                    { Icon: BadgeCheck, label: "Panel Review", desc: "Transparent feedback; if it’s a match, we move to offer." },
                    { Icon: ShieldCheck, label: "Offer & Onboarding", desc: "Contract, tools, and a 30/60/90-day plan." },
                  ].map(({ Icon, label, desc }, i) => (
                    <li key={label} className="flex items-start gap-3">
                      <div className="mt-[2px] grid h-6 w-6 place-items-center rounded-full bg-neutral-900/10 dark:bg-white/10">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="font-medium">{i + 1}. {label}</div>
                        <div className="text-[15px] opacity-90">{desc}</div>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="/careers/apply"
                    className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                  >
                    Apply now
                  </a>
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-xl border border-neutral-900/30 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-900/5 dark:border-white/40 dark:text-white dark:hover:bg-white/10"
                  >
                    Ask about the process
                  </a>
                </div>
              </div>

              <div className="md:col-span-5 md:mt-0 mt-1 relative z-0">
                <GradientArt
                  palette="indigo"
                  container={containerRef}
                  depth={0.9}
                  overlayIcon={BadgeCheck}
                />
              </div>
            </div>
          </motion.div>
        </section>

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
            initial={{ opacity: 0, y: 18 }}
            animate={active === slides.length ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="text-3xl font-semibold sm:text-4xl md:text-5xl">
              Ready to build the future of music?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-neutral-700 dark:text-white/80">
              Apply to the role that fits you, or send a general application. We evaluate potential and grit—not just your CV.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/careers/apply"
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
              >
                Apply now
              </a>
              <a
                href="/talent"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-900/30 px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-900/5 dark:border-white/40 dark:text-white dark:hover:bg-white/10"
              >
                Explore FMG Talent
              </a>
            </div>
          </motion.div>
        </section>
      </div>

      <FloatArrows onPrev={() => jump(active - 1)} onNext={() => jump(active + 1)} />

      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent dark:from-neutral-950" />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-neutral-950" />
    </main>
  );
}
