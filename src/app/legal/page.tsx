"use client";

import React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  Cookie,
  FileWarning,
  ChevronRight,
} from "lucide-react";

/*************************************************
 * FMG Universe — /legal (Light + Dark friendly)
 * - Not a slide page. Professional single-page layout
 * - Hero with gradient art, then policy cards
 * - Parallax gradient background (reduced‑motion aware)
 * - Modern, clean, accessible
 *************************************************/

/* ---------- Utils ---------- */
function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint - 0.5}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

type Palette = "indigo" | "violet" | "emerald" | "amber";

/* ---------- Global floating parallax background ---------- */
function ParallaxField({ container }: { container: React.RefObject<HTMLDivElement | null> }) {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ container: container as unknown as React.RefObject<HTMLElement> });

  const ySlow = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yMed  = useTransform(scrollYProgress, [0, 1], [0, -120]);

  const MotionA: any = reduce || isMobile ? "div" : motion.div;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <MotionA
        style={reduce || isMobile ? undefined : { y: ySlow }}
        className="absolute -top-24 -left-28 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500/16 via-fuchsia-500/14 to-sky-500/10 sm:h-[36rem] sm:w-[36rem] sm:-top-32 sm:-left-36 blur-2xl"
      />
      <MotionA
        style={reduce || isMobile ? undefined : { y: yMed }}
        className="absolute -bottom-24 -right-24 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-emerald-500/18 via-teal-400/14 to-cyan-400/10 sm:h-[34rem] sm:w-[34rem] sm:-bottom-36 sm:-right-36 blur-2xl"
      />
    </div>
  );
}

/* ---------- Gradient artwork (compact) ---------- */
function GradientArt({ palette = "indigo" as Palette }): React.JSX.Element {
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const MotionA: any = reduce || isMobile ? "div" : motion.div;

  const colors: Record<Palette, { a: string; b: string }> = {
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

  return (
    <div className="relative z-0 mx-auto w-full max-w-[18rem]">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-900/10 bg-white/70 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
        <MotionA
          aria-hidden
          animate={reduce || isMobile ? undefined : { x: [0, 18, -18, 0], y: [0, -12, 12, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute -left-12 -top-10 h-52 w-52 rounded-full bg-gradient-to-br ${colors[palette].a} blur-2xl`}
        />
        <MotionA
          aria-hidden
          animate={reduce || isMobile ? undefined : { x: [0, -12, 12, 0], y: [0, 10, -10, 0], rotate: [0, -6, 6, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
          className={`absolute -bottom-14 -right-12 h-64 w-64 rounded-full bg-gradient-to-br ${colors[palette].b} blur-2xl`}
        />
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_50%_60%,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.02)_35%,transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_60%,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.06)_35%,transparent_60%)]"
        />
        <div className="pointer-events-none absolute -inset-[1px] rounded-2xl ring-1 ring-neutral-900/10 dark:ring-white/15" />
      </div>
    </div>
  );
}

/* ---------- Policy Card ---------- */
function PolicyCard({
  label,
  href,
  description,
  Icon,
}: {
  label: string;
  href: string;
  description: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}): React.JSX.Element {
  return (
    <a
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-neutral-900/10 bg-white/70 p-5 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/10 dark:bg-white/5 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-900/5 text-neutral-900 dark:bg-white/10 dark:text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-neutral-900 dark:text-white">{label}</h3>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-60 transition group-hover:translate-x-0.5" />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-white/80">{description}</p>
        </div>
      </div>
      <div className="pointer-events-none absolute -inset-[1px] rounded-2xl ring-1 ring-neutral-900/10 group-hover:ring-neutral-900/20 dark:ring-white/15" />
    </a>
  );
}

/* ---------- Page ---------- */
export default function LegalPage(): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const policies = [
    {
      label: "Terms",
      href: "/legal/terms",
      description: "Your agreement with FMG Universe — acceptable use, rights, and responsibilities.",
      Icon: FileText,
    },
    {
      label: "Privacy",
      href: "/legal/privacy",
      description: "How we collect, use, and protect your data. Your controls and choices.",
      Icon: ShieldCheck,
    },
    {
      label: "Cookies",
      href: "/legal/cookies",
      description: "Technologies we use (cookies & similar) and how you can manage preferences.",
      Icon: Cookie,
    },
    {
      label: "DMCA",
      href: "/legal/dmca",
      description: "Report copyright infringement and learn about our takedown process.",
      Icon: FileWarning,
    },
  ] as const;

  return (
    <main ref={containerRef} className="relative min-h-screen overflow-hidden bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white">
      {/* Background */}
      <ParallaxField container={containerRef} />

      {/* Top edge fade */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent dark:from-neutral-950" />

      {/* Content */}
      <div className="relative z-10">
        {/* Hero */}
        <section className="px-4 pt-16 pb-10 sm:px-8 sm:pt-20 md:pt-24">
          <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-white backdrop-blur dark:bg-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                Policies • Rights • Compliance
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">Legal</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-700 sm:text-lg dark:text-white/85">
                Clear, fair, and human. Below are the core policies that govern how FMG Universe works with
                artists, brands, partners, and our audience.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/contact?topic=legal"
                  className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-neutral-800 dark:bg-white dark:text-neutral-900"
                >
                  Contact Legal
                </a>
                <a
                  href="/legal/privacy"
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-900/30 px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-900/5 dark:border-white/40 dark:text-white dark:hover:bg-white/10"
                >
                  Data & privacy requests
                </a>
              </div>
            </div>
            <div className="md:col-span-5">
              <GradientArt palette="indigo" />
            </div>
          </div>
        </section>

        {/* Principles */}
        <section className="px-4 py-4 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap gap-2">
              {["Clarity", "Security", "Control", "Compliance", "Accountability"].map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900/10 bg-neutral-900/5 px-3 py-1 text-xs text-neutral-900/90 dark:border-white/10 dark:bg-white/5 dark:text-white/90"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Policies Grid */}
        <section className="px-4 pb-20 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {policies.map((p) => (
                <PolicyCard key={p.label} label={p.label} href={p.href} description={p.description} Icon={p.Icon} />
              ))}
            </div>

            {/* Footer callout */}
            <div className="mt-8 rounded-2xl border border-neutral-900/10 bg-white/70 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">
              <p className="text-sm text-neutral-700 dark:text-white/80">
                Looking for specific clauses or obligations? Start with <a href="/legal/terms" className="underline underline-offset-4">Terms</a>,
                review our <a href="/legal/privacy" className="underline underline-offset-4">Privacy</a> practices, see how we use <a href="/legal/cookies" className="underline underline-offset-4">Cookies</a>,
                or submit a claim via <a href="/legal/dmca" className="underline underline-offset-4">DMCA</a>.
              </p>
              <p className="mt-2 text-xs text-neutral-500 dark:text-white/60">
                This page summarizes our key policies. If anything here conflicts with the full text in each policy, the policy document controls.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom edge fade */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-neutral-950" />
    </main>
  );
}
