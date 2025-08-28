"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView, useMotionValue, useSpring, useTransform, useScroll, Variants } from "framer-motion";
import type { MotionValue } from "framer-motion";
// di baris import icon lucide, tambahkan MessageCircle
import { ArrowRight, Star, Check, CheckCircle2, Rocket, Music, ShieldCheck, Zap, Sparkles, PlayCircle, LineChart, Mic2, MessageCircle } from "lucide-react";
import { Users, Share2, Cpu, BookOpen, Calendar, GraduationCap, type LucideIcon } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/lib/site";
import { compact } from "@/lib/arrays";

import type { PanInfo } from "framer-motion";
import CinematicVideoHeroHLS from "@/components/CinematicVideoHeroHLS";
// import Hero from "./ui/main_container/hero";
/** urutan & “berat” ukuran: basic kecil, pro sedang, ultimate besar, custom terbesar */
type PlanKey = "basic" | "pro" | "ultimate" | "custom";
type Weight = 0 | 1 | 2 | 3;

type Plan = {
  key: PlanKey;
  weight: Weight;
  props: PricingCardProps;
};

const PLANS: readonly Plan[] = [
  {
    key: "basic",
    weight: 0,
    props: {
      name: "Basic (Single)",
      price: "IDR 10.000.000",
      cta: "Start My Project",
      ctaHref: "/client/dashboard",
      features: [
        "Original songwriting",
        "Arrangement & production",
        "Mixing & mastering",
        "Publisher-ready metadata",
      ],
      accent: "indigo",
    },
  },
  {
    key: "pro",
    weight: 1,
    props: {
      name: "Pro (Single)",
      price: "IDR 15.000.000",
      cta: "Start My Project",
      ctaHref: "/client/dashboard",
      features: [
        "Everything in Basic +",
        "Multi-version deliverables (original/acoustic/remix/instrumental)",
        "Advanced music production",
        "Detailed mixing & mastering (stems, format targets)",
        "Vocal directing & coaching",
      ],
      accent: "violet",
      badge: "Best seller",
    },
  },
  {
    key: "ultimate",
    weight: 2,
    props: {
      name: "Ultimate (Single)",
      price: "IDR 30.000.000",
      cta: "Start My Project",
      ctaHref: "/client/dashboard",
      features: [
        "Everything in Basic & Pro +",
        "Music video direction & production",
        "Advanced production workflow (pre-pro → post)",
        "Focused creative direction & talent assets",
        "Release ops & distribution checks",
        "Priority support",
      ],
      accent: "gold",
    },
  },
  {
    key: "custom",
    weight: 3,
    props: {
      name: "Custom Plan",
      price: "Custom",
      period: "project",
      cta: "Start My Project",
      ctaHref: "/client/dashboard",
      features: [
        "Scope-based pricing",
        "Pick any combination of services",
        "Milestone plan & timeline",
        "Dedicated production manager",
      ],
      accent: "indigo",
    },
  },
];

const clamp = (n: number, min: number, max: number): number => Math.min(Math.max(n, min), max);
const mod = (n: number, m: number): number => ((n % m) + m) % m;

type Division = { icon: LucideIcon; title: string; desc: string };

const DIVISIONS: ReadonlyArray<Division> = [
  { icon: Sparkles, title: "Creative", desc: "Music Production, Studio & Recording, Sound Design, Audio Engineering" },
  { icon: Users, title: "Talent", desc: "Scouting talent development & management, A&R pipelines, career acceleration, and collaboration workflows." },
  { icon: Share2, title: "Media", desc: "Digital Content, Social Media & PR, Podcast & New Media, Media Partner & News, Digital Distribution." },
  { icon: Cpu, title: "Labs (AI/tuneXpert)", desc: "TuneXpert DAW-AI, A&R intelligence, analytics, predictions, and creator tools." },
  { icon: BookOpen, title: "Publishing", desc: "Music rights management, sync licensing, catalog reissues, publishing administration." },
  { icon: Calendar, title: "Event & Festival", desc: "Live shows, showcases, tour operations, and brand activations with measurable impact." },
  { icon: GraduationCap, title: "Academy", desc: "Training, mentorship, and industry-ready skills that ship real work and careers." },
];

/*************************
 * Data untuk Numbers
 *************************/
const STATS: ReadonlyArray<{ label: string; value: number }> = [
  { label: "Clients", value: 300 },
  { label: "Projects shipped", value: 1050 },
  { label: "Songs delivered", value: 1500 },
  { label: "On-time delivery (%)", value: 99 },
  { label: "Countries reached", value: 30 },
  { label: "DSPs & Platforms", value: 35 },
  { label: "Catalog managed (tracks)", value: 3000 },
  { label: "Avg. turnarounds (days)", value: 14 },
];

/*************************
 * Util: slug untuk DIVISIONS
 *************************/
const SPECIAL_SLUGS: Readonly<Record<string, string>> = {
  "Labs (AI/tuneXpert)": "labs",
  "Event & Festival": "event",
};
const slugFromDivisionTitle = (title: string): string =>
  SPECIAL_SLUGS[title] ??
  title
    .toLowerCase()
    .replace(/ *\([^)]*\) */g, "")     // buang isi dalam kurung
    .replace(/&/g, "and")              // & -> and (opsional)
    .replace(/[^a-z0-9]+/g, "-")       // selain alnum -> -
    .replace(/^-+|-+$/g, "");          // trim hyphen

type PricingCardProps = {
  name: string;
  price: string;
  features: readonly string[];
  cta: string;
  period?: string;
  accent?: "indigo" | "violet" | "gold";
  badge?: string;
  ctaHref?: string;      // ⬅️ baru
  ctaTarget?: string;    // ⬅️ baru
  ctaRel?: string;       // ⬅️ baru
};

/*************************
 * Tiny util
 *************************/
const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

/*************************
 * Shared animation variants
 *************************/
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: 0.06 * i, duration: 0.6, ease: "easeOut" } })
};

/*************************
 * Generic Parallax Wrapper (instant response + ease-out)
 *************************/
 type Axis = "y" | "x";
function Parallax({
  children,
  speed,            // legacy: 0..1 (tetap didukung)
  amount = 24,      // jarak maksimum (px)
  axis = "y",
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;   // kalau diisi (0..1) => dikonversi ke px dan di-clamp
  amount?: number;  // jarak maksimum (px)
  axis?: Axis;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  // Back-compat: speed (0..1) -> px, di-clamp agar aman
  const px = typeof speed === "number" ? Math.min(24, Math.max(6, speed * 120)) : amount;

  // 0 -> 0.5 -> 1  ==>  +px -> 0 -> -px (tengah layar netral)
  const mvRaw = useTransform(scrollYProgress, [0, 0.5, 1], [px, 0, -px]);
  const mv = useSpring(mvRaw, { stiffness: 300, damping: 30, mass: 0.28 });
  const style: { y?: MotionValue<number>; x?: MotionValue<number> } = axis === "y" ? { y: mv } : { x: mv };

  return (
    <motion.div ref={ref} style={style} className={cn("transform-gpu will-change-transform", className)}>
      {children}
    </motion.div>
  );
}


/*************************
 * Magnetic Button
 *************************/
function MagneticButton({
  children,
  href,
  className = "",
  target,
  rel,
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
  target?: React.HTMLAttributeAnchorTarget; // <— baru
  rel?: string;                             // <— baru
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 100, damping: 30 });
  const ySpring = useSpring(y, { stiffness: 100, damping: 30 });

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * 0.25);
    y.set(relY * 0.25);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  const Btn = (
    <motion.button
      ref={ref}
      style={{ x: xSpring, y: ySpring }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold",
        "bg-black text-white dark:bg-white dark:text-black",
        "shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-colors",
        "hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 hover:text-white",
        className
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100 dark:bg-black/10" />
    </motion.button>
  );

  if (href) {
    const isExternal = /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
    return isExternal ? (
      <a
        href={href}
        target={target}
        rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
        className="inline-block"
      >
        {Btn}
      </a>
    ) : (
      <Link
        href={href}
        prefetch={false}
        className="inline-block"
        {...(target ? { target } : {})}
        {...(rel ? { rel } : {})}
      >
        {Btn}
      </Link>
    );
  }
  return Btn;
}

/*************************
 * Split text for hero headline
 *************************/
function SplitHeadline({ text }: { text: string }) {
  return (
    <h1 className="mx-auto max-w-5xl text-balance text-center text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
      {text.split(" ").map((word, i) => (
        <motion.span key={`w-${i}`} className="inline-block" variants={fadeUp} custom={i}>
          <span className="mr-2 inline-block bg-gradient-to-br from-black via-indigo-700 to-indigo-400 bg-clip-text text-transparent dark:from-white dark:via-indigo-300 dark:to-indigo-500">
            {word}
          </span>
        </motion.span>
      ))}
    </h1>
  );
}

/*************************
 * Parallax ribbon (mid layer)
 *************************/
// function ParallaxRibbon() {
//   const ref = useRef<HTMLDivElement | null>(null);
//   const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
//   const yRaw = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
//   const y = useSpring(yRaw, { stiffness: 260, damping: 32, mass: 0.3 });

//   return (
//     <div ref={ref} className="relative z-10 mx-auto mt-16 w-full max-w-6xl">
//       <motion.div
//         style={{ y }}
//         className="h-48 w-full rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 opacity-100 ring-1 ring-black/10 dark:ring-white/10 shadow-lg shadow-indigo-500/10 transform-gpu will-change-transform"
//       />
//       <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-black/5 ring-1 ring-black/10 dark:bg-white/5 dark:ring-white/10" />
//     </div>
//   );
// }

/*************************
 * Marquee (keywords)
 *************************/
function MarqueeRow({ items, speed = 50 }: { items: ReadonlyArray<React.ReactNode>; speed?: number }) {
  const transition = { duration: 20_000 / speed, ease: "linear", repeat: Infinity } as const;
  return (
    <Parallax speed={0.04}>
      <div className="relative flex overflow-hidden">
        <motion.div className="flex min-w-max gap-12 pr-12" animate={{ x: ["0%", "-50%"] }} transition={transition}>
          {[...items, ...items].map((it, i) => (
            <div key={i} className="flex items-center gap-3 text-black/60 dark:text-white/60">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/5 ring-1 ring-black/10 dark:bg-white/10 dark:ring-white/10">
                <Star className="h-4 w-4" />
              </div>
              <div className="text-sm font-medium tracking-wide">{it}</div>
            </div>
          ))}
        </motion.div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent dark:from-black" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent dark:from-black" />
      </div>
    </Parallax>
  );
}

/*************************
 * Stat Counter
 *************************/
function Stat({ label, value }: { label: string; value: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { margin: "-20% 0px -20% 0px", once: true });
  const mv = useMotionValue(0);
  const val = useSpring(mv, { stiffness: 120, damping: 20 });
  useEffect(() => { if (inView) mv.set(value); }, [inView, mv, value]);
  const rounded = useTransform(val, (v) => Math.round(v).toString());
  return (
    <Parallax speed={0.06}>
      <div ref={ref} className="rounded-2xl bg-white/70 p-6 text-center shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-black/30 dark:ring-white/10">
        <motion.div className="text-4xl font-extrabold tracking-tight" aria-label={`${value}`}>{rounded}</motion.div>
        <div className="mt-1 text-sm text-black/60 dark:text-white/60">{label}</div>
      </div>
    </Parallax>
  );
}

/*************************
 * Feature Card (UPDATED)
 *************************/
function FeatureCard({
  icon: Icon,
  title,
  desc,
  href,                           // ⬅️ NEW
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
  href: string;                   // ⬅️ NEW
}): React.JSX.Element {
  return (
    <Parallax speed={0.08}>
      <motion.div
        variants={fadeUp}
        className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:shadow-xl dark:border-white/10 dark:bg-black"
      >
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl transition-opacity group-hover:opacity-100" />
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-600/10 p-3 ring-1 ring-indigo-600/20 dark:bg-indigo-400/10 dark:ring-indigo-400/20">
            <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <p className="mt-3 text-sm leading-6 text-black/70 dark:text-white/70">{desc}</p>

        {/* Hanya area "Learn more" yang bisa diklik, sesuai permintaan */}
        <div className="mt-4">
          <Link
            href={href}
            prefetch
            aria-label={`Learn more about ${title}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Learn more <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.div>
    </Parallax>
  );
}

/*************************
 * Testimonial Card
 *************************/
function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <Parallax speed={0.06}>
      <motion.figure variants={fadeUp} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <blockquote className="text-balance text-lg leading-relaxed">“{quote}”</blockquote>
        <figcaption className="mt-4 text-sm text-black/60 dark:text-white/60">{name} – {role}</figcaption>
      </motion.figure>
    </Parallax>
  );
}

/*************************
 * Pricing (service packages)
 *************************/
function PricingCard({
  name, price, features, cta, period = "single",
  accent = "indigo", badge,
  ctaHref, ctaTarget, ctaRel,
}: PricingCardProps): React.JSX.Element {
  const tint =
    accent === "gold"
      ? "before:from-amber-400/55 before:to-yellow-500/35"
      : accent === "violet"
      ? "before:from-fuchsia-500/45 before:to-indigo-500/35"
      : "before:from-indigo-500/45 before:to-sky-500/30";

  const dot =
    accent === "gold" ? "bg-amber-400 text-black"
    : accent === "violet" ? "bg-fuchsia-500 text-white"
    : "bg-indigo-600 text-white";

  const badgeColor = /best\s*seller/i.test(badge ?? "") ? "bg-red-600" : "bg-indigo-600";

  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl border",
        "border-black/10 dark:border-white/10",
        "bg-white/80 dark:bg-black/40 backdrop-blur-sm",
        "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br",
        "before:mix-blend-multiply dark:before:mix-blend-screen before:opacity-30 dark:before:opacity-35",
        tint,
        // === penting: kartu lega & fleksibel ===
        "p-6 sm:p-7 lg:p-8",
        "h-full flex flex-col min-w-0 shadow-sm",
      ].join(" ")}
    >
      {badge && (
        <span className={`absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full ${badgeColor} px-3 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/20`}>
          {badge}
        </span>
      )}

      <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold leading-tight break-words">
        {name}
      </h3>

      {/* harga: bisa wrap saat sempit */}
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
        <span className="text-[34px] sm:text-4xl lg:text-5xl font-extrabold leading-none">
          {price}
        </span>
        <span className="text-sm text-black/60 dark:text-white/60 whitespace-nowrap">/{period}</span>
      </div>

      <ul className="mt-6 space-y-3 text-[13.5px] sm:text-sm lg:text-[15px]">
        {features.map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-3 leading-relaxed break-words [overflow-wrap:anywhere] [hyphens:auto]"
          >
            <span className={`${dot} inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-[2px]`}>
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="text-black/80 dark:text-white/80">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA di bawah */}
      <div className="mt-8 flex items-center gap-2">
        <MagneticButton
          href={ctaHref}
          target={ctaTarget}
          rel={ctaRel}
          className="w-full justify-center"
        >
          {cta}
        </MagneticButton>

        <a
          href="https://wa.me/6282298288188?text=Halo%2C%20saya%20dapat%20informasi%20dari%20website%20FMG%20Universe%2C%20ingin%20order%20jasa%20musik."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full
                     bg-emerald-500 text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                     ring-1 ring-white/20 transition-transform hover:scale-[1.03]
                     dark:bg-emerald-600"
          aria-label="Chat via WhatsApp"
          title="Chat via WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="sr-only">WhatsApp</span>
        </a>
      </div>
    </div>
  );
}

function Checkmark() { return (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);} 

/*************************
 * Hero Section
 *************************/
function Hero() {
  const controls = useAnimation();
  useEffect(() => { controls.start("visible"); }, [controls]);

  return (
    <section className="relative overflow-hidden pt-12 sm:pt-12">
      {/* <Spotlight />  */}
      <Parallax speed={-0.03}>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_50%_-100px,rgba(79,70,229,0.15),transparent)]" />
      </Parallax>

      <motion.div initial="hidden" animate={controls} className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center">
          <Parallax speed={0.08}>
            <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 text-xs shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Build Ecosystem • Spark Innovation • Foster Collaboration</span>
            </motion.div>
          </Parallax>

          <Parallax speed={0.12}>
            <SplitHeadline text="Beyond Sound. Built-in Intelligence." />
          </Parallax>

          <Parallax speed={0.14}>
            <motion.p variants={fadeUp} custom={4} className="mt-5 max-w-2xl text-center text-balance text-base leading-relaxed text-black/100 dark:text-white/100">
              <b>FMG Universe</b> is a creative-technology ecosystem and solution born from <b>Flemmo Music Global (FMG) 
              Publishing</b> and evolved into a holding that spans music, technology, and digital innovation. <b>Beyond Sound. 
              Built-in Intelligence</b>. We’re building one integrated operating system for music, rights-first, 
              advanced technology platform that unites songwriting, composition, end-to-end music production (A-Z: Recording, Studio, Sound Design, Mixing and Mastering), audio-visual content creation (film, video, and sound) talent, distribution & media , artist & repertoire (A&R),  
              <b> AI research & development (R&D)</b>, publishing, live event, music academy, and musician community development—with worldwide collaboration as the connective layer. 
              By embedding intelligence into real workflows, <b>we help artists, labels, and brands</b> to scout smarter, produce faster, 
              own rights, grow royalties, and scale catalogs into lasting equity—ready for shaping positive impact for the next generation in the future.
            </motion.p>
          </Parallax>

          <Parallax speed={0.16}>
            <motion.div variants={fadeUp} custom={5} className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton href="/client/dashboard">Start My Project</MagneticButton>
              <Link href="#about" className="group inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-black/40 dark:hover:bg-black">
                <PlayCircle className="h-5 w-5" /> Learn about FMG
              </Link>
            </motion.div>
          </Parallax>

          {/* <ParallaxRibbon /> */}
          <CinematicVideoHeroHLS
            shape="rounded"
            // m3u8="/videos/vaa/index.m3u8"
            // mp4Fallback="/videos/viokichi-you-are-enough-official-music-video-mv.mp4"
            youtubeUrl="https://youtu.be/3zI-HFaUevg"
            // poster="/images/hero-poster.jpg"
            maxWidthClass="max-w-7xl" // opsional: ubah lebar
          />
        </div>
      </motion.div>
    </section>
  );
}

/*************************
 * Features — mobile 1-row infinite (sentinels) + desktop grid
 * Auto-slide pause 10s setelah scroll manual
 *************************/
function Features() {
  const COUNT = DIVISIONS.length;
  const extended = React.useMemo(
    () => [DIVISIONS[COUNT - 1], ...DIVISIONS, DIVISIONS[0]],
    []
  );

  const railRef = React.useRef<HTMLDivElement | null>(null);
  const pausedRef = React.useRef(false);          // pause karena hover/touch
  const idxRef = React.useRef(1);                 // index extended, mulai dari item "real" pertama
  const scrollEndTimer = React.useRef<number | null>(null);

  // === NEW: kontrol pause 10 detik setelah interaksi manual ===
  const resumeAtRef = React.useRef(0);            // epoch ms kapan auto boleh jalan lagi
  const autoGuardUntilRef = React.useRef(0);      // epoch ms: abaikan onScroll sampai waktu ini (programmatic)
  const requestPause = React.useCallback((ms = 10000) => {
    resumeAtRef.current = Date.now() + ms;
  }, []);

  const setPaused = (v: boolean) => { pausedRef.current = v; };

  const targetLeft = (rail: HTMLDivElement, child: HTMLElement) =>
    child.offsetLeft - (rail.clientWidth - child.offsetWidth) / 2;

  const scrollToIndex = React.useCallback((i: number, smooth = true) => {
    const rail = railRef.current;
    if (!rail) return;
    const child = rail.children[i] as HTMLElement | undefined;
    if (!child) return;

    // tandai scroll programmatic (abaikan onScroll selama durasi animasi)
    autoGuardUntilRef.current = Date.now() + (smooth ? 650 : 60);

    rail.scrollTo({ left: targetLeft(rail, child), behavior: smooth ? "smooth" : "auto" });
    idxRef.current = i;
  }, []);

  const jumpToIndex = React.useCallback((i: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const child = rail.children[i] as HTMLElement | undefined;
    if (!child) return;

    const prevSnap = rail.style.scrollSnapType;
    rail.style.scrollSnapType = "none";
    rail.style.setProperty("scroll-behavior", "auto");

    // tetap guard sebentar supaya onScroll dari jump tidak dihitung manual
    autoGuardUntilRef.current = Date.now() + 80;

    rail.scrollLeft = targetLeft(rail, child);
    idxRef.current = i;

    requestAnimationFrame(() => {
      rail.style.scrollSnapType = prevSnap || "";
      rail.style.removeProperty("scroll-behavior");
    });
  }, []);

  React.useEffect(() => {
    const t = window.setTimeout(() => jumpToIndex(1), 0);
    return () => window.clearTimeout(t);
  }, [jumpToIndex]);

  // === Auto-step tiap 3s, tapi hormati pause hover/touch & pause 10s manual ===
  React.useEffect(() => {
    let timer: number;
    const tick = () => {
      const now = Date.now();
      // jalanin step hanya kalau tidak hover/touch pause dan sudah lewat resumeAt
      if (!pausedRef.current && now >= resumeAtRef.current) {
        scrollToIndex(idxRef.current + 1, true);
      }
      timer = window.setTimeout(tick, 3000);
    };
    timer = window.setTimeout(tick, 3000);
    return () => window.clearTimeout(timer);
  }, [scrollToIndex]);

  const onScroll = React.useCallback(() => {
    if (scrollEndTimer.current) window.clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = window.setTimeout(() => {
      const rail = railRef.current;
      if (!rail) return;

      // cari child terdekat ke pusat viewport
      const center = rail.scrollLeft + rail.clientWidth / 2;
      let nearest = 0;
      let best = Number.POSITIVE_INFINITY;
      for (let i = 0; i < rail.children.length; i++) {
        const el = rail.children[i] as HTMLElement;
        const elCenter = el.offsetLeft + el.offsetWidth / 2;
        const diff = Math.abs(elCenter - center);
        if (diff < best) { best = diff; nearest = i; }
      }
      idxRef.current = nearest;

      // sentinel jump (programmatic, jadi guarded)
      if (nearest === 0) {
        jumpToIndex(COUNT);
      } else if (nearest === COUNT + 1) {
        jumpToIndex(1);
      }

      // === NEW: kalau ini scroll manual (di luar guard), pause 10s ===
      if (Date.now() > autoGuardUntilRef.current) {
        requestPause(10000);
      }
    }, 120) as unknown as number;
  }, [COUNT, jumpToIndex, requestPause]);

  // re-layout saat resize
  React.useEffect(() => {
    const onResize = () => jumpToIndex(idxRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [jumpToIndex]);

  return (
    <section id="features" className="relative mx-auto max-w-6xl px-4 py-10">
      <Parallax speed={0.1}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">Explore our divisions</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-2 text-black/70 dark:text-white/70">
            End-to-end capabilities for modern music workflows.
          </motion.p>
        </motion.div>
      </Parallax>

      {/* MOBILE carousel */}
      <Parallax speed={0.08}>
        <div
          className="mt-12 sm:hidden relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => { setPaused(false); requestPause(10000); }}  // <-- NEW: setelah lepas sentuh, pause 10s
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent dark:from-black" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent dark:from-black" />

          <div
            ref={railRef}
            onScroll={onScroll}
            className="
              flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth
              snap-x snap-mandatory
              [scrollbar-width:none] [-ms-overflow-style:none]
              px-2 py-3
            "
            style={{ WebkitOverflowScrolling: "touch", overflowY: "visible" }}
          >
            <style>{`[data-hide-scrollbar]::-webkit-scrollbar{display:none}`}</style>
            {extended.map((d, i) => {
              const href = `/${slugFromDivisionTitle(d.title)}`;
              return (
                <div key={`${d.title}-${i}`} className="snap-center shrink-0 w-[88%]">
                  <FeatureCard icon={d.icon} title={d.title} desc={d.desc} href={href} />
                </div>
              );
            })}
          </div>
        </div>
      </Parallax>

      {/* DESKTOP/TABLET grid tetap */}
      <Parallax speed={0.1}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="mt-12 hidden grid-cols-1 gap-y-8 gap-x-4 sm:grid sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-3 lg:gap-x-5 pb-8 lg:pb-16"
        >
          {DIVISIONS.map((d, i, arr) => {
            const isLast = i === arr.length - 1;
            const colLg = i % 3;
            const centerLast = isLast && arr.length % 3 === 1;
            const wingShift = !centerLast && (colLg === 0 || colLg === 2) ? "lg:translate-y-16 xl:translate-y-24" : "";
            const centerLastClass = centerLast ? "lg:col-start-2" : "";
            const href = `/${slugFromDivisionTitle(d.title)}`;
            return (
              <div key={d.title} className={`transform-gpu will-change-transform ${wingShift} ${centerLastClass}`}>
                <FeatureCard icon={d.icon} title={d.title} desc={d.desc} href={href} />
              </div>
            );
          })}
        </motion.div>
      </Parallax>
    </section>
  );
}


/*************************
 * Numbers / Social Proof (REPLACED)
 *************************/
function Numbers() {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLUListElement | null>(null);
  const [paused, setPaused] = React.useState(false);

  // auto-scroll (idle)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reduce) return;

    const el = viewportRef.current;
    const list = contentRef.current;
    if (!el || !list) return;

    let raf: number | null = null;
    let last = performance.now();
    const speedPxPerMs = 0.08; // ~80px/s

    const tick = (now: number) => {
      if (!el || !list) return;
      const dt = now - last;
      last = now;

      if (!paused) {
        const half = list.scrollWidth / 2; // karena kita render 2x
        el.scrollLeft += speedPxPerMs * dt;
        // loop mulus
        if (el.scrollLeft >= half) el.scrollLeft -= half;
        if (el.scrollLeft < 0) el.scrollLeft += half;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    const onVis = () => { if (document.hidden) setPaused(true); };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [paused]);

  return (
    <section className="relative border-y border-black/10 bg-gradient-to-b from-white to-indigo-50/40 py-15 dark:border-white/10 dark:from-black dark:to-indigo-950/20">
      <Parallax speed={0.03}>
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-pretty text-3xl font-bold sm:text-4xl">Numbers that matter</h2>
          <p className="mt-2 text-black/70 dark:text-white/70">Proof of scale, reliability, and global reach.</p>
        </div>
      </Parallax>

      <div
        ref={viewportRef}
        className="relative mx-auto mt-10 w-full max-w-6xl overflow-x-auto px-4 [scrollbar-width:none] [-ms-overflow-style:none]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        aria-label="FMG key numbers carousel"
      >
        {/* hide scrollbar in webkit */}
        <style>{`
          [data-hide-scrollbar]::-webkit-scrollbar { display: none; }
        `}</style>

        {/* kiri/kanan fade */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-white to-transparent dark:from-black" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent dark:from-black" />

        <ul
          ref={contentRef}
          data-hide-scrollbar
          className="flex select-none gap-6 py-1"
          role="list"
        >
          {/* render 2x untuk loop mulus */}
          {[...STATS, ...STATS].map((s, i) => (
            <li key={`${s.label}-${i}`} className="min-w-[220px] sm:min-w-[240px] lg:min-w-[260px]">
              <Stat label={s.label} value={s.value} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/*************************
 * About FMG
 *************************/
function AboutFMG() {
  return (
    <section id="about" className="relative mx-auto max-w-6xl px-4">
      <Parallax speed={0.06}>
        <div className="mx-auto mt-5 w-full max-w-6xl py-10">
            <MarqueeRow
              speed={60}
              items={["Custom Songwriting","Arrangement & Production","Recording Studio","Mixing & Mastering","Music Publishing","Label & Distribution","Licensing & Rights","Client Portal & Analytics"]}
            />
          </div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-3xl text-center">
          <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">What is Flemmo Music Global?</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-black/70 dark:text-white/70">
            Flemmo Music Global (powered by FMG Universe) is a professional music company providing comprehensive services across the creative and business spectrum. 
            Our expertise spans songwriting, composition, arranging, recording, mixing, mastering, and sound design, as well as publishing, copyright management, licensing, 
            digital and physical distribution, marketing, promotion, public relations, artist branding, image development, business development, partnerships, sponsorships, and monetization.
            <br /><br />We serve artists, musicians, and labels, seeking success in both local and international music industries.
          </motion.p>
        </motion.div>
      </Parallax>
    </section>
  );
}

/*************************
 * Testimonials
 *************************/
/*************************
 * Testimonials — infinite loop (2 sentinels), 1-row mobile
 * - Swipe-able
 * - Auto step tiap 3s (pause saat interaksi)
 * - Tanpa "balik ke tengah" yang kelihatan
 *************************/
function Testimonials() {
  const items = [
    { quote:"The team quickly grasped the song’s direction. Communication was clear, and the final result still feels like me.", name:"Viokichi", role:"Artist — Pop/R&B" },
    { quote:"My bossa nova single went from demo to release without hassle. Administration and delivery to DSPs were handled smoothly.", name:"Amandha Ayu", role:"Artist — Jazz/Bossa Nova" },
    { quote:"Arrangement, tracking, through to release—everything in one workflow. Progress was always clear and on schedule.", name:"Nannouz", role:"Artist — Pop, Orchestra, Jazz, Rock" },
    { quote:"Cross-language project ran smoothly. Technical direction was precise, distribution was fast, and the result was professional.", name:"Adilisius", role:"Artist — Pop/EDM" },
    { quote:"They turned a rough idea into a record. Stems were organized, milestones were clear, and mix notes were laser-specific.", name:"BesThree", role:"Artist — Pop/EDM" },
    { quote:"One workspace for creative in the music industry—clear notes, fast decisions, release-ready delivery", name:"Anthem Boys", role:"Artist — Pop/EDM" },
  ];
  const COUNT = items.length;
  const extended = React.useMemo(() => [items[COUNT - 1], ...items, items[0]], [items, COUNT]);

  const railRef = React.useRef<HTMLDivElement | null>(null);
  const pausedRef = React.useRef(false);
  const idxRef = React.useRef(1);
  const scrollEndTimer = React.useRef<number | null>(null);

  const resumeAtRef = React.useRef(0);
  const autoGuardUntilRef = React.useRef(0);
  const requestPause = React.useCallback((ms = 10000) => {
    resumeAtRef.current = Date.now() + ms;
  }, []);
  const setPaused = (v: boolean) => { pausedRef.current = v; };

  const targetLeft = (rail: HTMLDivElement, child: HTMLElement) =>
    child.offsetLeft - (rail.clientWidth - child.offsetWidth) / 2;

  const scrollToIndex = React.useCallback((i: number, smooth = true) => {
    const rail = railRef.current;
    if (!rail) return;
    const child = rail.children[i] as HTMLElement | undefined;
    if (!child) return;
    autoGuardUntilRef.current = Date.now() + (smooth ? 650 : 60);
    rail.scrollTo({ left: targetLeft(rail, child), behavior: smooth ? "smooth" : "auto" });
    idxRef.current = i;
  }, []);

  const jumpToIndex = React.useCallback((i: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const child = rail.children[i] as HTMLElement | undefined;
    if (!child) return;
    const restore = rail.style.scrollSnapType;
    rail.style.scrollSnapType = "none";
    rail.style.setProperty("scroll-behavior", "auto");
    autoGuardUntilRef.current = Date.now() + 80;
    rail.scrollLeft = targetLeft(rail, child);
    idxRef.current = i;
    requestAnimationFrame(() => {
      rail.style.scrollSnapType = restore || "";
      rail.style.removeProperty("scroll-behavior");
    });
  }, []);

  React.useEffect(() => {
    const t = window.setTimeout(() => jumpToIndex(1), 0);
    return () => window.clearTimeout(t);
  }, [jumpToIndex]);

  React.useEffect(() => {
    let timer: number;
    const tick = () => {
      const now = Date.now();
      if (!pausedRef.current && now >= resumeAtRef.current) {
        scrollToIndex(idxRef.current + 1, true);
      }
      timer = window.setTimeout(tick, 3000);
    };
    timer = window.setTimeout(tick, 3000);
    return () => window.clearTimeout(timer);
  }, [scrollToIndex]);

  const onScroll = React.useCallback(() => {
    if (scrollEndTimer.current) window.clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = window.setTimeout(() => {
      const rail = railRef.current;
      if (!rail) return;
      const center = rail.scrollLeft + rail.clientWidth / 2;
      let nearest = 0, best = Number.POSITIVE_INFINITY;
      for (let i = 0; i < rail.children.length; i++) {
        const el = rail.children[i] as HTMLElement;
        const elCenter = el.offsetLeft + el.offsetWidth / 2;
        const diff = Math.abs(elCenter - center);
        if (diff < best) { best = diff; nearest = i; }
      }
      idxRef.current = nearest;
      if (nearest === 0) jumpToIndex(COUNT);
      else if (nearest === COUNT + 1) jumpToIndex(1);

      if (Date.now() > autoGuardUntilRef.current) {
        requestPause(10000);
      }
    }, 120) as unknown as number;
  }, [COUNT, jumpToIndex, requestPause]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Parallax speed={0.06}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-3xl text-center">
          <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">
            Artists, labels & brands choose FMG Universe
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-black/70 dark:text-white/70">
            Real feedback. Measurable outcomes.
          </motion.p>
        </motion.div>
      </Parallax>

      {/* MOBILE: 1 row, swipe, infinite */}
      <Parallax speed={0.08}>
        <div
          className="mt-12 sm:hidden relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => { setPaused(false); requestPause(10000); }}  // <-- NEW
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent dark:from-black" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent dark:from-black" />

          <div
            ref={railRef}
            onScroll={onScroll}
            className="
              flex gap-4 overflow-x-auto scroll-smooth
              snap-x snap-mandatory
              [scrollbar-width:none] [-ms-overflow-style:none]
              px-1
            "
            style={{ WebkitOverflowScrolling: "touch" }}
            aria-label="Testimonials carousel"
          >
            <style>{`[data-hide-scrollbar]::-webkit-scrollbar{display:none}`}</style>
            {extended.map((t, i) => (
              <div key={i} className="snap-center shrink-0 w-[88%]">
                <Testimonial quote={t.quote} name={t.name} role={t.role} />
              </div>
            ))}
          </div>
        </div>
      </Parallax>

      {/* DESKTOP/TABLET: grid */}
      <Parallax speed={0.08}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-12 hidden grid-cols-1 gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((t, i) => (
            <Testimonial key={i} quote={t.quote} name={t.name} role={t.role} />
          ))}
        </motion.div>
      </Parallax>
    </section>
  );
}


/** offset circular terpendek dari i ke center */
function circularOffset(i: number, center: number, len: number): number {
  const raw = i - center;
  const pos = mod(raw, len);
  return pos > len / 2 ? pos - len : pos; // range kira2 (-len/2 .. +len/2]
}

const SPRING = { type: "spring", stiffness: 240, damping: 28, mass: 0.65 } as const;
// sebaran slot – boleh kamu tweak 0.26 -> 0.28 kalau mau lebih jauh
const slotGap = (w: number) => Math.max(200, Math.min(360, Math.round(w * 0.26)));

function scaleFor(offset: number, weight: 0 | 1 | 2 | 3) {
  if (offset === 0) return 1.0;
  if (offset === -1) return Math.max(0.86 - weight * 0.02, 0.80);
  if (offset === -2) return 0.78;
  if (offset === 1)  return Math.min(1.10 + weight * 0.02, 1.18);
  if (offset === 2)  return Math.min(1.16 + weight * 0.04, 1.26);
  return 0.7;
}

function ArtworkSlider() {
  const artworks = [
    "/images/artwork1.jpg",
    "/images/artwork2.jpg",
    "/images/artwork3.jpg",
    "/images/artwork4.jpg",
    "/images/artwork5.jpg",
  ];
  const COUNT = artworks.length;
  const extended = React.useMemo(() => [artworks[COUNT - 1], ...artworks, artworks[0]], [artworks, COUNT]);

  const railRef = React.useRef<HTMLDivElement | null>(null);
  const pausedRef = React.useRef(false);
  const idxRef = React.useRef(1);
  const scrollEndTimer = React.useRef<number | null>(null);
  const resumeAtRef = React.useRef(0);
  const autoGuardUntilRef = React.useRef(0);

  const requestPause = React.useCallback((ms = 10000) => {
    resumeAtRef.current = Date.now() + ms;
  }, []);
  const setPaused = (v: boolean) => { pausedRef.current = v; };

  const targetLeft = (rail: HTMLDivElement, child: HTMLElement) =>
    child.offsetLeft - (rail.clientWidth - child.offsetWidth) / 2;

  const scrollToIndex = React.useCallback((i: number, smooth = true) => {
    const rail = railRef.current;
    if (!rail) return;
    const child = rail.children[i] as HTMLElement | undefined;
    if (!child) return;
    autoGuardUntilRef.current = Date.now() + (smooth ? 650 : 60);
    rail.scrollTo({ left: targetLeft(rail, child), behavior: smooth ? "smooth" : "auto" });
    idxRef.current = i;
  }, []);

  const jumpToIndex = React.useCallback((i: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const child = rail.children[i] as HTMLElement | undefined;
    if (!child) return;
    const restore = rail.style.scrollSnapType;
    rail.style.scrollSnapType = "none";
    rail.style.setProperty("scroll-behavior", "auto");
    autoGuardUntilRef.current = Date.now() + 80;
    rail.scrollLeft = targetLeft(rail, child);
    idxRef.current = i;
    requestAnimationFrame(() => {
      rail.style.scrollSnapType = restore || "";
      rail.style.removeProperty("scroll-behavior");
    });
  }, []);

  React.useEffect(() => {
    const t = window.setTimeout(() => jumpToIndex(1), 0);
    return () => window.clearTimeout(t);
  }, [jumpToIndex]);

  React.useEffect(() => {
    let timer: number;
    const tick = () => {
      const now = Date.now();
      if (!pausedRef.current && now >= resumeAtRef.current) {
        scrollToIndex(idxRef.current + 1, true);
      }
      timer = window.setTimeout(tick, 3000);
    };
    timer = window.setTimeout(tick, 3000);
    return () => window.clearTimeout(timer);
  }, [scrollToIndex]);

  const onScroll = React.useCallback(() => {
    if (scrollEndTimer.current) window.clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = window.setTimeout(() => {
      const rail = railRef.current;
      if (!rail) return;
      const center = rail.scrollLeft + rail.clientWidth / 2;
      let nearest = 0, best = Number.POSITIVE_INFINITY;
      for (let i = 0; i < rail.children.length; i++) {
        const el = rail.children[i] as HTMLElement;
        const elCenter = el.offsetLeft + el.offsetWidth / 2;
        const diff = Math.abs(elCenter - center);
        if (diff < best) { best = diff; nearest = i; }
      }
      idxRef.current = nearest;
      if (nearest === 0) jumpToIndex(COUNT);
      else if (nearest === COUNT + 1) jumpToIndex(1);
      if (Date.now() > autoGuardUntilRef.current) requestPause(10000);
    }, 120) as unknown as number;
  }, [COUNT, jumpToIndex, requestPause]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <Parallax speed={0.06}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-3xl text-center">
          <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">
            Our Released Works
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-black/70 dark:text-white/70">
            Explore a showcase of singles and projects crafted and released through FMG Universe.
          </motion.p>
        </motion.div>
      </Parallax>

      <Parallax speed={0.08}>
        <div
          className="mt-12 relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => { setPaused(false); requestPause(10000); }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent dark:from-black" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent dark:from-black" />

          <div
            ref={railRef}
            onScroll={onScroll}
            className="
              flex gap-4 overflow-x-auto scroll-smooth
              snap-x snap-mandatory
              [scrollbar-width:none] [-ms-overflow-style:none]
              px-1
            "
            style={{ WebkitOverflowScrolling: "touch" }}
            aria-label="Artwork carousel"
          >
            <style>{`[data-hide-scrollbar]::-webkit-scrollbar{display:none}`}</style>
            {extended.map((src, i) => (
              <div key={i} className="snap-center shrink-0 w-[260px] h-[260px] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <img src={src} alt={`Artwork ${i}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </Parallax>
    </section>
  );
}


function Pricing3DCarousel(): React.JSX.Element {
  const [active, setActive] = React.useState<number>(1); // mulai dari "Pro"
  const wrapNext = React.useCallback(() => setActive(i => ((i + 1) % PLANS.length + PLANS.length) % PLANS.length), []);
  const wrapPrev = React.useCallback(() => setActive(i => ((i - 1) % PLANS.length + PLANS.length) % PLANS.length), []);

  // ukuran container -> jarak slot
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((e) => setWidth(Math.round(e[0].contentRect.width)));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  // snap ulang ke center tiap lebar berubah / orientation berubah
  React.useEffect(() => {
    const recenter = () => requestAnimationFrame(() => setActive(a => a));
    recenter();
    window.addEventListener("orientationchange", recenter);
    return () => window.removeEventListener("orientationchange", recenter);
  }, [width]);

  const onDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dx = info.offset.x;
    if (dx > 60) wrapPrev();
    else if (dx < -60) wrapNext();
  };
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX > 4) wrapNext();
      if (e.deltaX < -4) wrapPrev();
    }
  };
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") wrapNext();
      if (e.key === "ArrowLeft")  wrapPrev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [wrapNext, wrapPrev]);

  const g = slotGap(width);

  /* ===== ARIA live: umumkan paket aktif ===== */
  const [ariaMsg, setAriaMsg] = React.useState("");
  React.useEffect(() => {
    const plan = PLANS[active]?.props;
    if (plan) setAriaMsg(`${plan.name} — ${plan.price}`);
  }, [active]);

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6" onWheel={onWheel}>
      {/* dots */}
      <div className="mb-4 flex items-center justify-center gap-2">
        {PLANS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Go to plan ${i + 1}`}
            className={["h-2.5 rounded-full transition-all", i === active ? "w-6 bg-indigo-500" : "w-2.5 bg-black/20 dark:bg-white/20"].join(" ")}
          />
        ))}
      </div>

      {/* ARIA live region (visually hidden) */}
      <div aria-live="polite" role="status" className="sr-only">{ariaMsg}</div>

      <div
        ref={ref}
        className="relative h-[560px] sm:h-[580px] md:h-[600px] lg:h-[620px] select-none"
        style={{ perspective: "1200px" }}
      >
        <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={onDragEnd} className="absolute inset-0">
          {PLANS.map((p, i) => {
            // offset circular dari aktif (-2..+2)
            const raw = i - active;
            const len = PLANS.length;
            const pos = ((raw % len) + len) % len;
            const off = pos > len / 2 ? pos - len : pos;

            const x = off * g;
            const scale = scaleFor(off as -2 | -1 | 0 | 1 | 2, p.weight);
            const rotateY = -10 * off;
            const zIndex = 50 + (3 - Math.abs(off)) * 10 + p.weight;

            // non-aktif: transparan + blur; aktif: solid
            const blur = off === 0 ? 0 : Math.abs(off) === 1 ? 6 : 10;
            const opacity = off === 0 ? 1 : 0.9;
            const isActive = off === 0;

            return (
              <motion.div
                key={p.key}
                className="absolute left-1/2 top-1/2 w-[min(88vw,460px)] -translate-x-1/2 -translate-y-1/2 will-change-transform"
                style={{ transformStyle: "preserve-3d", zIndex, pointerEvents: Math.abs(off) <= 1 ? "auto" : "none", filter: `blur(${blur}px)` }}
                animate={{ x, scale, rotateY, opacity }}
                transition={SPRING}
              >
                {/* ===== layer solid + glow untuk kartu aktif ===== */}
                <div className="relative">
                  {isActive && (
                    <>
                      {/* solid filler supaya benar2 tidak tembus */}
                      <div className="pointer-events-none absolute inset-0 z-0 rounded-3xl bg-white dark:bg-black" />
                      {/* glow halus (ring gradient) */}
                      <motion.div
                        className="pointer-events-none absolute -inset-3 z-[1] rounded-[28px]
                                   bg-gradient-to-r from-indigo-500/35 via-violet-500/25 to-fuchsia-500/35 blur-xl"
                        initial={{ opacity: 0.0, scale: 0.98 }}
                        animate={{ opacity: 0.2, scale: 1.0 }}
                        transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.55 }}
                      />
                      {/* ring tipis agar crisp */}
                      <div className="pointer-events-none absolute inset-0 z-[2] rounded-3xl ring-1 ring-black/10 dark:ring-white/10" />
                    </>
                  )}

                  {/* kartu di atas semuanya */}
                  <div className={isActive ? "relative z-10" : undefined}>
                    <PricingCard {...p.props} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* panah */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
          <button
            aria-label="Previous"
            onClick={wrapPrev}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/70 text-black backdrop-blur hover:opacity-90 dark:border-white/10 dark:bg-white/10 dark:text-white"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={wrapNext}
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/70 text-black backdrop-blur hover:opacity-90 dark:border-white/10 dark:bg-white/10 dark:text-white"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
 * Section wrapper
 * ========================= */
function Pricing(): React.JSX.Element {
  return (
    <section id="pricing" className="relative mx-auto w-full max-w-none py-8">
      <Parallax speed={0.06}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-3xl px-4 text-center">
          <motion.h2 variants={fadeUp} className="text-pretty text-3xl font-bold sm:text-4xl">
            Pricing &amp; Packages
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-2 text-black/70 dark:text-white/70">
            Swipe to view packages. The active selection is always centered.
          </motion.p>
        </motion.div>
      </Parallax>

      <Parallax speed={0.1}>
        <Pricing3DCarousel />
      </Parallax>
    </section>
  );
}

/*************************
 * CTA
 *************************/
function CTA() {
  return (
    <section id="cta" className="relative overflow-hidden py-10">
      <Parallax speed={-0.04}>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_400px_at_50%_10%,rgba(99,102,241,0.2),transparent)]" />
      </Parallax>
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2">
        <Parallax speed={0.06}>
          <div>
            <h3 className="text-pretty text-3xl font-bold sm:text-4xl">Ready to make your next release?</h3>
            <p className="mt-3 text-black/70 dark:text-white/70">Tell us your vision — we&#39;ll craft the sound and handle publishing & distribution.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <MagneticButton href="/client/dashboard">Start My Project</MagneticButton>
              <Link href="https://wa.me/6282298288188" className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5">
                Talk with us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Parallax>
        <Parallax speed={0.12}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-xl dark:border-white/10"
          >
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-20">
              {[...Array(72)].map((_, i) => (
                <div key={i} className="border border-white/10" />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-2xl bg-white/10 px-4 py-2 text-xs text-white backdrop-blur-md">Secure portfolio preview</div>
            </div>
          </motion.div>
        </Parallax>
      </div>
    </section>
  );
}

/*************************
 * Page Component
 *************************/
export default function LandingPage() {
  const sameAs = compact([
    siteConfig.social.website,
    siteConfig.social.instagram,
    siteConfig.social.youtube,
    siteConfig.social.linkedin,
    siteConfig.social.tiktok,
    siteConfig.social.twitter, // opsional
  ]);

  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/apple-touch-icon.png`,
    sameAs, // sekarang pasti string[]
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteConfig.url,
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="relative min-h-screen bg-white text-black antialiased dark:bg-black dark:text-white">
      {/* subtle noise overlay */}
      <div className="pointer-events-none fixed inset-0 z-[-1] opacity-[0.06] mix-blend-soft-light" aria-hidden>
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      <Hero />
      <AboutFMG />
      <Features />
      <Numbers />
      
      <Testimonials />
      <Pricing />
      <ArtworkSlider />   {/* <— baru ditambahkan di sini */}
      <CTA />
      {/* <Footer /> */}
      <JsonLd id="org" data={org} />
      <JsonLd id="website" data={website} />
    </main>
  );
}
