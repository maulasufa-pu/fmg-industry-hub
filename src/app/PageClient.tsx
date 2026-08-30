"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useInView, useMotionValue, useSpring, useTransform, useScroll, useReducedMotion, Variants } from "framer-motion";
import type { MotionValue } from "framer-motion";
// di baris import icon lucide, tambahkan MessageCircle
import { ArrowRight, Star, Check, CheckCircle2, Music, Sparkles, Mic2, MessageCircle } from "lucide-react";
import { Users, Share2, Cpu, BookOpen, Calendar, GraduationCap, type LucideIcon } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { siteConfig } from "@/lib/site";
import { compact } from "@/lib/arrays";
import Image from "next/image";
import dynamic from "next/dynamic";
import InnovationBadge from "./ui/InnovationBadge";
import type { PanInfo } from "framer-motion";
import { CurrencyDropdownAdvanced, type Currency } from "@/components/CurrencyDropdownAdvanced";
import { ARRANGEMENT_ORDER_PATH, ARRANGEMENT_PORTFOLIO_PATH } from "@/lib/arrangement";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import NewCustomerPromoCard from "@/components/public/NewCustomerPromoCard";
import PaymentMethodsShowcase from "@/components/payments/PaymentMethodsShowcase";
import FmgUniverseLogo from "@/components/brand/FmgUniverseLogo";
// import Hero from "./ui/main_container/hero";
/** urutan & “berat” ukuran: basic small, pro medium, ultimate large, custom largest */







type PlanKey = "basic" | "pro" | "ultimate" | "custom";

const CinematicVideoHeroHLS = dynamic(
  () => import("@/components/CinematicVideoHeroHLS"),
  { ssr: false },
);

function LazyCinematicVideoHero(): React.JSX.Element {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const shouldMount = useInView(ref, { margin: "200px 0px", once: true });

  return (
    <div ref={ref}>
      {shouldMount ? (
        <CinematicVideoHeroHLS
          shape="rounded"
          m3u8="/videos/hero/master.m3u8"
          mp4Fallback="/videos/hero/fallback.mp4"
          mobileMp4="/videos/hero/mobile.mp4"
          poster="/videos/hero/poster.webp"
          maxWidthClass="max-w-7xl"
        />
      ) : (
        <div className="mx-auto mt-12 mb-10 w-[calc(100%-2rem)] max-w-7xl overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br from-indigo-950 via-black to-violet-950 shadow-xl md:mt-20 md:mb-14 md:min-h-[320px] md:rounded-[24px]" aria-hidden>
          <div className="aspect-square animate-pulse-soft bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.28),transparent_55%)] md:aspect-[2.39/1]" />
        </div>
      )}
    </div>
  );
}
type Weight = 0 | 1 | 2 | 3;

type Plan = {
  key: PlanKey;
  weight: Weight;
  props: PricingCardProps;
};

type PricingCardProps = {
  name: string;
  priceUSDNumber: number;  // angka asli USD
  features: readonly string[];
  cta: string;
  period?: string;
  accent?: "indigo" | "violet" | "gold" | "spotify";
  badge?: string;
  ctaHref?: string;
  ctaTarget?: string;
  ctaRel?: string;
  loading?: boolean;
};

const PLANS: readonly Plan[] = [
  {
    key: "basic",
    weight: 0,
    props: {
      name: "Basic (Single)",
      priceUSDNumber: 700,
      cta: "Start My Project",
      ctaHref: ARRANGEMENT_ORDER_PATH,
      features: [
        "Original songwriting",
        "Arrangement & production",
        "Mixing & mastering",
        "Publisher-ready metadata",
      ],
      accent: "spotify",
    },
  },
  {
    key: "pro",
    weight: 1,
    props: {
      name: "Pro (Single)",
      priceUSDNumber: 1000,
      cta: "Start My Project",
      ctaHref: ARRANGEMENT_ORDER_PATH,
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
      priceUSDNumber: 2000,
      cta: "Start My Project",
      ctaHref: ARRANGEMENT_ORDER_PATH,
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
      priceUSDNumber: 0, // ditampilkan sebagai "Custom"
      period: "project",
      cta: "Start My Project",
      ctaHref: ARRANGEMENT_ORDER_PATH,
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

const staggerChildren: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

/*************************
 * Generic Parallax Wrapper (instant response + ease-out)
 *************************/ 
 type Axis = "y" | "x";
function Parallax({
  children,
  speed,            // legacy 0..1 (opsional)
  amount = 24,      // max jarak (px)
  axis = "y",
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  amount?: number;
  axis?: Axis;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // konversi speed (0..1) ke px jika diberikan
  const px = typeof speed === "number" ? Math.min(24, Math.max(6, speed * 120)) : amount;

  // 0 -> 0.5 -> 1  ==>  +px -> 0 -> -px
  const raw = useTransform(scrollYProgress, [0, 0.5, 1], [px, 0, -px]);
  const mv = useSpring(raw, { stiffness: 300, damping: 30, mass: 0.28 });
  const style: { y?: MotionValue<number>; x?: MotionValue<number> } | undefined = reduceMotion || !mounted
    ? undefined
    : axis === "y" ? { y: mv } : { x: mv };

  return (
    <motion.div
      ref={ref}
      initial={false}
      style={style}                         // SSR: style ada tapi nilainya stabil → aman
      className={cn("relative transform-gpu", className)}
    >
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
  const reduceMotion = useReducedMotion();

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduceMotion || window.matchMedia("(hover: none)").matches) return;
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

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.6, ease: "easeOut" },
  }),
};

function SplitHeadline({ text }: { text: string }) {
  const words = React.useMemo(() => text.split(" "), [text]);

  return (
    <h1 data-no-translate={text.includes("Beyond Sound") || text.includes("Aransemen Profesional") ? true : undefined} className="mx-auto max-w-5xl text-balance text-center text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
      {words.map((w, i) => (
        <React.Fragment key={`${w}-${i}`}>
          <motion.span
            className="inline-block"
            variants={wordVariants}
            custom={i}
            initial={false} // penting agar SSR & client snapshot sama
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
          >
            <span className="inline-block bg-gradient-to-br from-black via-indigo-700 to-indigo-400 bg-clip-text text-transparent dark:from-white dark:via-indigo-300 dark:to-indigo-500">
              {w}
            </span>
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
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
  const ref = React.useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { margin: "200px 0px" });
  const reduceMotion = useReducedMotion();
  const transition = { duration: 20_000 / speed, ease: "linear", repeat: Infinity } as const;
  return (
    <Parallax speed={0.04}>
      <div ref={ref} className="relative flex overflow-hidden">
        <motion.div
          className="flex min-w-max gap-12 pr-12 transform-gpu"
          animate={!reduceMotion && inView ? { x: ["0%", "-50%"] } : { x: "0%" }}
          transition={transition}
        >
          {[...items, ...items].map((it, i) => (
            <div key={i} className="flex items-center gap-3 text-black/60 dark:text-white/100">
              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 ring-1 ring-black/10 dark:bg-white/10 dark:ring-white/10">
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

        <p className="mt-3 text-sm leading-6 text-black/70 dark:text-white">{desc}</p>

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
  name, priceUSDNumber, features, cta, period = "single",
  accent = "indigo", badge,
  ctaHref, ctaTarget, ctaRel, loading,
  currency, rates,
}: PricingCardProps & { currency: Currency; rates: Record<string, number> }): React.JSX.Element {
  const tint =
    accent === "gold"
      ? "before:from-amber-400/45 before:to-yellow-500/90"
      : accent === "violet"
      ? "before:from-fuchsia-500/45 before:to-indigo-500/90"
      : accent === "spotify"
      ? "before:from-[#1DB954]/45 before:to-[#1DB954]/90"
      : "before:from-indigo-500/45 before:to-sky-500/90";

  const dot =
    accent === "gold"
      ? "bg-amber-400 text-black"
      : accent === "violet"
      ? "bg-fuchsia-500 text-white"
      : accent === "spotify"
      ? "bg-[#1DB954] text-white"
      : "bg-indigo-600 text-white";

  const badgeColor = /best\s*seller/i.test(badge ?? "")
    ? "bg-red-600"
    : "bg-indigo-600";

  const priceLabel =
    Number.isFinite(priceUSDNumber) && priceUSDNumber > 0
      ? formatPrice(priceUSDNumber, currency, rates)
      : "Custom";

  // Auto-resize font based on price length to keep it on single line
  const getPriceFontSize = (price: string) => { // Total character count including symbols
    const digitCount = price.replace(/[^\d]/g, '').length; // Count only digits
    
    // Mobile-first approach with aggressive scaling for very long prices
    if (digitCount <= 2) {
      // Very short prices (like $9, €5) - extra large fonts
      return "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl";
    } else if (digitCount <= 3) {
      // Short prices (like $29, €250) - large fonts
      return "text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl";
    } else if (digitCount <= 5) {
      // Medium prices (like $1,234, €9,999) - medium fonts  
      return "text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl";
    } else if (digitCount <= 7) {
      // Long prices (like $123,456, IDR 4,567,890) - smaller fonts
      return "text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl";
    } else if (digitCount <= 9) {
      // Very long prices (like IDR 15,750,000) - compact fonts
      return "text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl";
    } else {
      // Extra long prices - minimum readable but still prominent
      return "text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl";
    }
  };

  const priceFontClass = getPriceFontSize(priceLabel);

  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl border",
        "border-black/10 dark:border-white/10",
        "bg-white/80 dark:bg-black/40 backdrop-blur-sm",
        "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br",
        "before:mix-blend-multiply dark:before:mix-blend-screen before:opacity-30 dark:before:opacity-80",
        tint,
        "p-5 sm:p-6 lg:p-8",
        "h-full flex flex-col min-w-0 max-w-full shadow-sm",
      ].join(" ")}
    >
      {badge && (
        <span className={`absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full ${badgeColor} px-3 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/20`}>
          {badge}
        </span>
      )}

      <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold leading-tight break-words overflow-hidden text-ellipsis min-w-0">
        {name}
      </h3>

      {/* harga */}
      <div className="mt-2 flex flex-col gap-1 min-w-0">
        <div className="flex items-baseline gap-x-1 min-w-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-8 w-32 sm:h-10 sm:w-40 lg:h-12 lg:w-48 xl:h-14 xl:w-56 animate-pulse rounded-md bg-gray-300 dark:bg-gray-600"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite] rounded-md"></div>
              </div>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
            </div>
          ) : (
            <div className="flex items-baseline gap-x-1 min-w-0 flex-1 overflow-hidden">
              <span className={`${priceFontClass} font-extrabold leading-none whitespace-nowrap flex-shrink-0 max-w-full overflow-hidden text-ellipsis`}>
                {priceLabel}
              </span>
              <span className="text-base sm:text-lg lg:text-xl text-black/60 dark:text-white/60 whitespace-nowrap flex-shrink-0">
                /{period}
              </span>
            </div>
          )}
        </div>
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
            <span className="text-black/80 dark:text-white/100">{f}</span>
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
                     ring-1 ring:white/20 transition-transform hover:scale-[1.03]
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

function Hero({ mode }: { mode: "company" | "sales" }) {
  const { pick } = useLanguage();
  if (mode === "company") {
    return (
      <section className="relative overflow-hidden pt-12 sm:pt-12">
        <Parallax speed={-0.03}>
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_50%_-100px,rgba(79,70,229,0.15),transparent)]" />
        </Parallax>

        <motion.div initial={false} className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center">
            <InnovationBadge />
            <Parallax speed={0.12}>
              <SplitHeadline text="Beyond Sound. Built-in Intelligence." />
            </Parallax>
            <Parallax speed={0.13}>
              <motion.p variants={fadeUp} custom={3} initial={false} whileInView="visible" viewport={{ once: true }} className="mt-4 max-w-xl text-center text-balance text-lg font-medium leading-relaxed text-black dark:text-white">
                We help artists, creators, labels, and brands create, own, and grow lasting value in music.
              </motion.p>
            </Parallax>
            <Parallax speed={0.14}>
              <motion.p variants={fadeUp} custom={4} initial={false} whileInView="visible" viewport={{ once: true }} className="mt-5 max-w-3xl text-center text-balance text-base leading-relaxed text-black dark:text-white">
                <b>FMG Universe</b> is the creative-technology ecosystem of <b>Flemmo Music Global</b>, established in 2018 and expanded across music production, publishing, talent, media, live events, education, and technology. One connected universe for building work, rights, careers, and catalog value.
              </motion.p>
            </Parallax>

            <Parallax speed={0.15}>
              <motion.div variants={fadeUp} custom={5} initial={false} whileInView="visible" viewport={{ once: true }} className="mt-10 grid gap-8 text-center sm:grid-cols-2 sm:gap-12">
                <div>
                  <h2 className="text-2xl font-bold tracking-wide sm:text-3xl">Our Vision</h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-black/75 dark:text-white/75">Empowering the future of music through innovation, technology, and intelligence.</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-wide sm:text-3xl">Our Mission</h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-black/75 dark:text-white/75">To unite creativity and technology in one ecosystem—helping artists and brands create, own, and grow lasting value.</p>
                </div>
              </motion.div>
            </Parallax>

            <Parallax speed={0.16}>
              <motion.div variants={fadeUp} custom={6} initial={false} whileInView="visible" viewport={{ once: true }} className="mt-12 flex flex-wrap items-center justify-center gap-3">
                <MagneticButton href="/arrangement">Music Arrangement Service</MagneticButton>
                <Link href="/portfolio" className="group inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-black/40 dark:hover:bg-black">
                  <Music className="h-5 w-5" /> View Portfolio
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/about" className="group inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-black/40 dark:hover:bg-black">
                  About FMG Universe
                </Link>
              </motion.div>
            </Parallax>
            <LazyCinematicVideoHero />
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden pt-12 sm:pt-12">
      <Parallax speed={-0.03}>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_50%_-100px,rgba(79,70,229,0.15),transparent)]" />
      </Parallax>

      <motion.div initial={false} className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center">
          <InnovationBadge />

          <Parallax speed={0.12}>
            <SplitHeadline text={pick("Jasa Aransemen Profesional untuk Lagumu.", "Professional Music Arrangement for Your Song.")} />
          </Parallax>

          <Parallax speed={0.13}>
            <motion.p
              variants={fadeUp}
              custom={3}
              initial={false}
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-4 max-w-xl text-center text-balance text-lg font-medium leading-relaxed text-black dark:text-white"
            >
              Bring your melody, chords, or voice-note guidance. FMG turns it into a structured, production-ready arrangement.
            </motion.p>
          </Parallax>

          {/* Deskripsi */}
          <Parallax speed={0.14}>
            <motion.p
              variants={fadeUp}
              custom={4}
              initial={false}
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-5 max-w-2xl text-center text-balance text-base leading-relaxed text-black dark:text-white"
            >
              This is a paid arrangement service—not a song submission. Price, timeline, revisions, and final files follow the service or package you select and are confirmed before production starts.
            </motion.p>
          </Parallax>

          {/* CTA Buttons */}
          <Parallax speed={0.16}>
            <motion.div
              variants={fadeUp}
              custom={6}
              initial={false}
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-12 flex flex-wrap items-center justify-center gap-3"
            >
              <MagneticButton href={ARRANGEMENT_ORDER_PATH}>
                Order Music Arrangement
              </MagneticButton>
              <Link
                href={ARRANGEMENT_PORTFOLIO_PATH}
                className="group inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-black/40 dark:hover:bg-black"
              >
                <Music className="h-5 w-5" /> View Arrangement Work
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/services/inquiry"
                className="group inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-black/40 dark:hover:bg-black"
              >
                <MessageCircle className="h-5 w-5" /> Ask Before Ordering
              </Link>
            </motion.div>
          </Parallax>

          <LazyCinematicVideoHero />
        </div>
      </motion.div>
    </section>
  );
}


function ArrangementSalesIntro() {
  const facts = [
    ["Price", "Shown from the service catalog"],
    ["Timeline", "Confirmed for your project scope"],
    ["Revisions", "Defined before production starts"],
    ["Final delivery", "Listed in the approved scope"],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
      <div className="grid gap-8 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6 shadow-xl shadow-violet-500/10 dark:border-violet-900 dark:from-violet-950/35 dark:via-black dark:to-indigo-950/35 sm:p-9 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">A service for song owners</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Three steps. One clear arrangement order.</h2>
          <ol className="mt-6 space-y-4">{["Send your song brief and accessible guidance links.","Approve the confirmed scope, timing, and IDR invoice.","Review previews in the client portal and receive final files."].map((item,index)=><li key={item} className="flex items-start gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-600 text-sm font-bold text-white">{index+1}</span><span className="pt-0.5 leading-6">{item}</span></li>)}</ol>
          <div className="mt-7 flex flex-wrap gap-3"><Link href={ARRANGEMENT_ORDER_PATH} className="rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700">Order arrangement</Link><Link href="/services/inquiry" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold hover:bg-white dark:border-white/20 dark:hover:bg-white/10">Ask without an account</Link></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">{facts.map(([label,value])=><div key={label} className="rounded-2xl border border-black/5 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5"><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 font-bold">{value}</p></div>)}<div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:col-span-2 dark:border-emerald-900 dark:bg-emerald-950/30"><p className="font-semibold">Ownership is stated before work starts.</p><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Ordering arrangement does not transfer your composition to FMG. Credits, licenses, session assets, and delivery rights follow the approved scope and terms.</p></div></div>
      </div>
    </section>
  );
}


/*************************
 * Features — mobile 1-row infinite (sentinels) + desktop grid
 * Auto-slide pause 10s setelah scroll manual
 *************************/
function Features() {
  const COUNT = DIVISIONS.length;

  const railRef = React.useRef<HTMLDivElement | null>(null);
  const carouselInView = useInView(railRef, { margin: "200px 0px" });
  const reduceMotion = useReducedMotion();
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
    if (!carouselInView || reduceMotion) return;
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
  }, [carouselInView, reduceMotion, scrollToIndex]);

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
          <motion.p variants={fadeUp} custom={1} className="mt-2 text-black/70 dark:text-white">
            End-to-end capabilities for modern music workflows.
          </motion.p>
          <motion.div
            variants={fadeUp}
            custom={2}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800"
          >
            <Star className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm text-indigo-700 dark:text-indigo-300">
              Want to see our work?{" "}
              <Link href="/portfolio" className="font-semibold underline underline-offset-2 hover:text-indigo-900 dark:hover:text-indigo-100">
                Check our Portfolio
              </Link>
            </span>
          </motion.div>
        </motion.div>
      </Parallax>

      <Parallax speed={0.08}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          className="mt-10 overflow-hidden rounded-3xl border border-violet-200/80 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-xl shadow-violet-500/10 dark:border-violet-800/70 dark:from-indigo-950/50 dark:via-black dark:to-violet-950/50 sm:p-8"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
                <Music className="h-4 w-4" /> Professional Service
              </div>
              <h3 className="mt-4 text-2xl font-bold sm:text-3xl">Music Arrangement for Your Song</h3>
              <p className="mt-3 max-w-2xl leading-relaxed text-black/70 dark:text-white/75">
                Already have a melody, chords, or a guidance recording? We turn your musical idea into a structured arrangement built around your brief, genre, and references.
              </p>
              <p className="mt-3 text-sm font-medium text-violet-800 dark:text-violet-200">
                This is a paid arrangement service. FMG does not buy, scout, or acquire your song through this order.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <MagneticButton href={ARRANGEMENT_ORDER_PATH}>Order Music Arrangement</MagneticButton>
                <Link
                  href={ARRANGEMENT_PORTFOLIO_PATH}
                  className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold transition hover:bg-white dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/50"
                >
                  View Arrangement Work <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                "Choose Arrangement in the service catalog",
                "Add your brief and shareable guidance links",
                "Review the price and payment plan before submitting",
                "Track the request, invoice, and project in your client portal",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white/75 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </Parallax>

      {/* MOBILE carousel */}
      <Parallax speed={0.08}>
        <div
          className="mt-12 sm:hidden relative"
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
              flex gap-4 overflow-x-auto overflow-y-visible scroll-smooth
              snap-x snap-mandatory
              [scrollbar-width:none] [-ms-overflow-style:none]
              px-2 py-3
            "
            style={{ WebkitOverflowScrolling: "touch", overflowY: "visible" }}
          >
            <style>{`[data-hide-scrollbar]::-webkit-scrollbar{display:none}`}</style>
            {DIVISIONS.map((d, i) => {
              const href = `/${slugFromDivisionTitle(d.title)}`;
              return (
                <div key={d.title} className="snap-center shrink-0 w-[88%]">
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
              <div key={d.title} className={cn("transform-gpu", wingShift, centerLastClass)}>
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
 * Portfolio Showcase Preview
 *************************/
function PortfolioShowcase() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4"
          >
            <Music className="h-4 w-4" />
            Our Work
          </motion.div>
          <motion.h2 
            variants={fadeUp}
            custom={1}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent"
          >
            Featured Portfolio
          </motion.h2>
          <motion.p 
            variants={fadeUp}
            custom={2}
            className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Discover our latest releases and productions. From pop to EDM, jazz to orchestral arrangements.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {/* Portfolio Preview Cards */}
          {[
            {
              title: "Latest Releases",
              desc: "New music from our talented artists",
              icon: Music,
              gradient: "from-pink-500 to-rose-500"
            },
            {
              title: "Production Work",
              desc: "Behind the scenes of our projects",
              icon: Mic2,
              gradient: "from-purple-500 to-indigo-500"
            },
            {
              title: "Artist Collaborations",
              desc: "Working with amazing talents",
              icon: Users,
              gradient: "from-blue-500 to-cyan-500"
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              custom={idx}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 p-6 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-xl"
            >
              <div className={`absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br ${item.gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity`} />
              <div className="relative">
                <div className={`flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} text-white mb-4 shadow-lg`}>
                  <item.icon className="w-7 h-7" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA to Full Portfolio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Link
            href="/portfolio"
            className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300"
          >
            <Music className="h-5 w-5" />
            Explore Full Portfolio
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            View all our projects, releases, and collaborations
          </p>
        </motion.div>
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
        <div className="mx-auto mt-5 w-full max-w-6xl py-5">
            <MarqueeRow
              speed={60}
              items={["Custom Songwriting","Arrangement & Production","Recording Studio","Mixing & Mastering","Music Publishing","Label & Distribution","Licensing & Rights","Client Portal & Analytics"]}
            />
          </div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-3xl text-center">
          <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">What is Flemmo Music Global?</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-black/70 dark:text-white">
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

function Testimonials() {
  const items = React.useMemo(() => [
    { quote:"The team quickly grasped the song’s direction. Communication was clear, and the final result still feels like me.", name:"Viokichi", role:"Artist — Pop/R&B" },
    { quote:"My bossa nova single went from the first idea to release without hassle. Administration and delivery to DSPs were handled smoothly.", name:"Amandha Ayu", role:"Artist — Jazz/Bossa Nova" },
    { quote:"Arrangement, tracking, through to release—everything in one workflow. Progress was always clear and on schedule.", name:"Nannouz", role:"Artist — Pop, Orchestra, Jazz, Rock" },
    { quote:"Cross-language project ran smoothly. Technical direction was precise, distribution was fast, and the result was professional.", name:"Adilisius", role:"Artist — Pop/EDM" },
    { quote:"They turned a rough idea into a record. Stems were organized, milestones were clear, and mix notes were laser-specific.", name:"BesThree", role:"Artist — Pop/EDM" },
    { quote:"One workspace for creative in the music industry—clear notes, fast decisions, release-ready delivery", name:"Anthem Boys", role:"Artist — Pop/EDM" },
  ], []);
  const COUNT = items.length;
  const extended = React.useMemo(() => [items[COUNT - 1], ...items, items[0]], [items, COUNT]);

  const railRef = React.useRef<HTMLDivElement | null>(null);
  const carouselInView = useInView(railRef, { margin: "200px 0px" });
  const reduceMotion = useReducedMotion();
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
    if (!carouselInView || reduceMotion) return;
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
  }, [carouselInView, reduceMotion, scrollToIndex]);

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
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-black/70 dark:text-white">
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
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from:white to-transparent dark:from-black" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from:white to-transparent dark:from-black" />

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
            role="region"
            tabIndex={0}
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

function ArtworkSlider({ artworks }: { artworks: string[] }) {
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const pausedRef = React.useRef(false);
  const resumeAtRef = React.useRef(0);
  const carouselInView = useInView(railRef, { margin: "200px 0px" });
  const reduceMotion = useReducedMotion();

  const requestPause = React.useCallback((ms = 10000) => {
    resumeAtRef.current = Date.now() + ms;
  }, []);
  const setPaused = (v: boolean) => { pausedRef.current = v; };

  // Gandakan item supaya "tak terbatas"
  const showcaseArtworks = React.useMemo(() => artworks.slice(0, 12), [artworks]);
  const LOOP = 3;
  const repeated = React.useMemo(
    () => Array.from({ length: LOOP }, () => showcaseArtworks).flat(),
    [showcaseArtworks]
  );

  // waktu mount, scroll ke tengah (supaya ada ruang kiri-kanan)
  React.useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const childWidth = rail.firstElementChild?.clientWidth ?? 0;
    const gap = 16; // sesuai Tailwind gap-4
    const itemWidth = childWidth + gap;
    rail.scrollLeft = (repeated.length / 2) * itemWidth;
  }, [repeated.length]);

  // auto scroll step
  React.useEffect(() => {
    if (!carouselInView || reduceMotion) return;
    let timer: number;
    const tick = () => {
      const now = Date.now();
      if (!pausedRef.current && now >= resumeAtRef.current) {
        const rail = railRef.current;
        if (rail) rail.scrollBy({ left: 280, behavior: "smooth" });
      }
      timer = window.setTimeout(tick, 3000);
    };
    timer = window.setTimeout(tick, 3000);
    return () => window.clearTimeout(timer);
  }, [carouselInView, reduceMotion]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.h2
          variants={fadeUp}
          className="text-3xl font-bold sm:text-4xl"
        >
          Our Released Works
        </motion.h2>
        <motion.p
          variants={fadeUp}
          custom={1}
          className="mt-3 text-black/70 dark:text-white"
        >
          Explore a showcase of singles and projects crafted and released
          through FMG Universe.
        </motion.p>
      </motion.div>

      <div
        className="mt-12 relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => {
          setPaused(false);
          requestPause(10000);
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from:white to-transparent dark:from-black" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from:white to-transparent dark:from-black" />

        <div
          ref={railRef}
          className="
            flex gap-4 overflow-x-auto scroll-smooth
            snap-x snap-mandatory
            [scrollbar-width:none] [-ms-overflow-style:none]
            px-1
          "
          style={{ WebkitOverflowScrolling: "touch" }}
          role="region"
          tabIndex={0}
          aria-label="Artwork carousel"
        >
          <style>{`[data-hide-scrollbar]::-webkit-scrollbar{display:none}`}</style>
          {repeated.map((src, i) => (
            <div
              key={i}
              className="snap-center shrink-0 w-[260px] h-[260px] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"
            >
              <Image
                src={src}
                alt={`Artwork ${(i % Math.max(showcaseArtworks.length, 1)) + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
                width={260}
                height={260}
                sizes="260px"
              />
            </div>
          ))}
        </div>
      </div>

      {/* CTA to Portfolio */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="text-center mt-12"
      >
        <Link
          href="/portfolio"
          className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300"
        >
          <Music className="h-5 w-5" />
          Open Full Portfolio
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Discover all our releases, productions & collaborations
        </p>
      </motion.div>
    </section>
  )
}

function Pricing3DCarousel({
  currency,
  rates,
  loading,
}: {
  currency: Currency;
  rates: Record<string, number>;
  loading?: boolean;
}): React.JSX.Element {
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

  const [ariaMsg, setAriaMsg] = React.useState("");
  React.useEffect(() => {
    const plan = PLANS[active]?.props;
    // Safety check: ensure rates object is valid before using
    if (plan && rates && typeof rates === 'object') {
      setAriaMsg(`${plan.name} — ${Number.isFinite(plan.priceUSDNumber) && plan.priceUSDNumber > 0 ? formatPrice(plan.priceUSDNumber, currency, rates) : "Custom"}`);
    }
  }, [active, currency, rates]);

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
        className="relative h-[450px] sm:h-[500px] md:h-[560px] lg:h-[600px] xl:h-[620px] select-none"
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
                <div className="relative">
                  {isActive && (
                    <>
                      <div className="pointer-events-none absolute inset-0 z-0 rounded-3xl bg-white dark:bg-black" />
                      <motion.div
                        className="pointer-events-none absolute -inset-3 z-[1] rounded-[28px]
                                   bg-gradient-to-r from-indigo-500/35 via-violet-500/25 to-fuchsia-500/35 blur-xl"
                        initial={{ opacity: 0.0, scale: 0.98 }}
                        animate={{ opacity: 0.2, scale: 1.0 }}
                        transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.55 }}
                      />
                      <div className="pointer-events-none absolute inset-0 z-[2] rounded-3xl ring-1 ring-black/10 dark:ring-white/10" />
                    </>
                  )}

                  <div className={isActive ? "relative z-10" : undefined}>
                    <PricingCard {...p.props} currency={currency} rates={rates} loading={loading} />
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
function Pricing({
  currency,
  rates,
  onCurrencyChange,
  loading,
  error,
  lastUpdated,
}: {
  currency: Currency;
  rates: Record<string, number>;
  onCurrencyChange: (c: Currency) => void;
  loading?: boolean;
  error?: string | null;
  lastUpdated?: string | null;
}): React.JSX.Element {
  return (
    <section id="pricing" className="relative mx-auto w-full max-w-none py-12 md:py-16 lg:py-20">
      <Parallax speed={0.06}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-3xl px-4 text-center">
          <motion.h2 variants={fadeUp} className="text-pretty text-3xl font-bold sm:text-4xl">
            Pricing &amp; Packages
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-2 text-black/70 dark:text-white">
            Swipe to view packages. The active selection is always centered.
          </motion.p>
        </motion.div>
      </Parallax>

      {/* Currency selector - moved outside Parallax to avoid stacking context issues */}
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={fadeUp} 
        custom={2} 
        className="mt-6 space-y-3 mx-auto max-w-3xl px-4 text-center"
      >
        <div className="flex flex-col items-center gap-3">
          <label className="text-sm font-medium text-black/70 dark:text-white/70">
            Select Currency:
          </label>
          <CurrencyDropdownAdvanced
            value={currency}
            onChange={onCurrencyChange}
            loading={loading}
            className="mx-auto"
            variant="default"
          />
        </div>
        
        {/* Status indicators */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
            Updating exchange rates...
          </div>
        )}
        
        {error && (
          <div className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            ⚠️ Using cached rates: {error}
          </div>
        )}
        
        {!loading && !error && lastUpdated && (
          <div className="text-xs text-green-600 dark:text-green-400">
            ✅ Live rates (updated {new Date(lastUpdated).toLocaleTimeString()})
          </div>
        )}
      </motion.div>

      <Parallax speed={0.1}>
        <Pricing3DCarousel currency={currency} rates={rates} loading={loading} />
      </Parallax>
      <div className="mx-auto mt-10 max-w-7xl px-4">
        <PaymentMethodsShowcase compact />
      </div>
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
        {/* Kolom teks CTA */}
        <div>
          <h3 className="text-pretty text-3xl font-bold sm:text-4xl">
            Ready to make your next release?
          </h3>
          <p className="mt-3 text-black/70 dark:text-white">
            Tell us your vision — we&#39;ll craft the sound and handle publishing & distribution.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <MagneticButton href={ARRANGEMENT_ORDER_PATH}>Order Music Arrangement</MagneticButton>
            <Link
              href="https://wa.me/6282298288188"
              className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            >
              Talk with us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Kolom gambar */}
        <Parallax speed={0.12}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-black/10 shadow-xl dark:border-white/10"
          >
            <Image
              src="/img/alfath-flemmo-founder-ceo-flemmo-music-global-publishing-fmg-universe.jpeg"
              alt="Alfath Flemmo - Founder & CEO Flemmo Music Global Publishing (FMG Universe)"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute bottom-2 left-2/3 translate-x-[-40px] rounded-lg bg-black/50 px-2 py-1 text-center text-[9px] sm:text-sm font-medium text-white backdrop-blur-md shadow-md">
              <p>Alfath Flemmo</p>
              <p className="text-[8px] sm:text-xs font-normal">Founder and CEO</p>
              <p className="text-[8px] sm:text-xs font-normal">PT. Flemmo Music Global</p>
              <p className="text-[8px] sm:text-xs font-light opacity-90">(FMG Universe)</p>
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

export default function LandingPage({ mode = "company" }: { mode?: "company" | "sales" }) {
  const {
    currency,
    setCurrency,
    rates,
    loading: ratesLoading,
    error: ratesError,
    lastUpdated,
  } = useCurrency();

  const [artworks, setArtworks] = React.useState<string[]>([]);

  React.useEffect(() => {
    const controller = new AbortController();
    const loadArtworks = () => {
      fetch("/api/artworks", { signal: controller.signal })
        .then((res) => res.json())
        .then((data: string[]) => setArtworks(data.slice(0, 12)))
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setArtworks([]);
          }
        });
    };
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(loadArtworks, { timeout: 2500 })
      : window.setTimeout(loadArtworks, 1200);

    return () => {
      controller.abort();
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, []);

  // const artworks = getArtworks();
  const sameAs = compact([
    siteConfig.social.website,
    siteConfig.social.instagram,
    siteConfig.social.youtube,
    siteConfig.social.linkedin,
    siteConfig.social.tiktok,
  ]);

  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    sameAs, // sekarang pasti string[]
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
  };

  const arrangementService = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${siteConfig.url}/arrangement#service`,
    name: "Professional music arrangement service",
    serviceType: "Music arrangement and production",
    description: "Online music arrangement for artists and songwriters, with clear scope, revisions, deliverables, and ownership terms.",
    url: `${siteConfig.url}/arrangement`,
    inLanguage: "en-US",
    provider: { "@type": "Organization", "@id": `${siteConfig.url}/#organization`, name: siteConfig.name, url: siteConfig.url },
    areaServed: ["Indonesia", "Worldwide"],
    availableChannel: { "@type": "ServiceChannel", serviceUrl: `${siteConfig.url}${ARRANGEMENT_ORDER_PATH}` },
  };

  return (
    <main data-performance-page className="relative min-h-screen bg-white text-black antialiased dark:bg-black dark:text-white">
      {/* subtle noise overlay */}
      <div className="pointer-events-none fixed inset-0 z-[-1] hidden opacity-[0.045] mix-blend-soft-light md:block" aria-hidden>
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      <Hero mode={mode} />
      {mode === "sales" && <ArrangementSalesIntro />}
      {mode === "company" && <AboutFMG />}
      {mode === "company" && <Features />}
      <PortfolioShowcase />
      <Testimonials />
      {mode === "sales" && <Pricing
        currency={currency} 
        rates={rates} 
        onCurrencyChange={setCurrency}
        loading={ratesLoading}
        error={ratesError}
        lastUpdated={lastUpdated}
      />}
      {mode === "sales" && <NewCustomerPromoCard />}
      <ArtworkSlider artworks={artworks} />
      {mode === "sales" && <CTA />}
      {/* <Footer /> */}
      <JsonLd id="org" data={org} />
      <JsonLd id="website" data={website} />
      {mode === "sales" && <JsonLd id="arrangement-service" data={arrangementService} />}
      {mode === "company" && <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
        <h2 className="mb-6 text-center text-xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-100 sm:mb-10 sm:text-2xl">
          FMG Universe Brand Lockups
        </h2>

        <div className="grid gap-6 sm:gap-8">
          {/* 1) FMG Universe */}
          <div className="grid items-center gap-4 rounded-3xl border border-black/10 bg-gradient-to-br from-white to-neutral-50 p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:from-zinc-950 dark:to-black sm:grid-cols-[208px_1fr] sm:gap-6 sm:p-6">
            <div
              className="relative mx-auto aspect-[3/2] w-44 overflow-hidden rounded-2xl bg-white ring-1 ring-black/10 dark:bg-black dark:ring-white/10 sm:mx-0 sm:w-48"
            >
              <FmgUniverseLogo
                alt="FMG Universe logo"
                fill
                className="rounded-2xl object-contain"
                sizes="(max-width: 640px) 11rem, 12rem"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-pretty text-3xl font-bold sm:text-4xl">
                FMG Universe
              </h3>
            </div>
          </div>

          {/* 2) PT. Flemmo Music Global FMG Publishing */}
          <div className="grid items-center gap-4 rounded-3xl border border-black/10 bg-gradient-to-br from-white to-neutral-50 p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:from-zinc-950 dark:to-black sm:grid-cols-[132px_1fr] sm:gap-6 sm:p-6">
            <div
              className="relative mx-auto aspect-square w-28 overflow-hidden rounded-2xl p-2 ring-1 ring:black/10 sm:mx-0 sm:w-32
                        [background:linear-gradient(135deg,_#0b0b0b_0%_50%,_#ffffff_50%_100%)]
                        dark:[background:linear-gradient(135deg,_#0b0b0b_0%_50%,_#f5f5f5_50%_100%)]"
            >
              <Image
                src="/logo/Flemmo-Music-Global-FMG-Publishing-logo.jpg"
                alt="FMG Publishing logo"
                fill
                className="rounded-2xl object-contain"
                sizes="(max-width: 640px) 7rem, 8rem"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-pretty text-3xl font-bold sm:text-4xl">
                PT. Flemmo Music Global FMG Publishing
              </h3>
            </div>
          </div>

          {/* 3) Flemmo Enterprise Music (FEM) */}
          <div className="grid items-center gap-4 rounded-3xl border border-black/10 bg-gradient-to-br from:white to-neutral-50 p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:from-zinc-950 dark:to-black sm:grid-cols-[132px_1fr] sm:gap-6 sm:p-6">
            <div
              className="relative mx-auto aspect-square w-28 overflow-hidden rounded-2xl p-2 ring-1 ring-black/10 sm:mx-0 sm:w-32
                        [background:linear-gradient(135deg,_#0b0b0b_0%_50%,_#ffffff_50%_100%)]
                        dark:[background:linear-gradient(135deg,_#0b0b0b_0%_50%,_#f5f5f5_50%_100%)]"
            >
              <Image
                src="/logo/Flemmo-Enterprise-Music-FEM-logo.jpg"
                alt="Flemmo Enterprise Music logo"
                fill
                className="rounded-2xl object-contain"
                sizes="(max-width: 640px) 7rem, 8rem"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-pretty text-3xl font-bold sm:text-4xl">
                Flemmo Enterprise Music (FEM)
              </h3>
            </div>
          </div>
        </div>
      </div>}

    </main>
  );
}

function formatPrice(usd: number, currency: Currency, rates: Record<string, number>) {
  // Safety check: ensure rates object exists and has the currency
  if (!rates || typeof rates !== 'object') {
    //console.warn("Invalid rates object, using fallback");
    return "Custom"; // Return custom for invalid rates
  }
  
  const rate = rates[currency];
  if (!rate || typeof rate !== 'number') {
    //console.warn(`Rate not found for currency: ${currency}`);
    return "Custom";
  }
  
  const value = usd * rate;
  
  // Determine appropriate decimal places based on currency and value
  let maximumFractionDigits = 0;
  let minimumFractionDigits = 0;
  
  switch (currency) {
    case 'USD':
    case 'EUR':
    case 'GBP':
    case 'AUD':
    case 'CAD':
    case 'SGD':
      // Major currencies: show decimals for values under 10, none for larger values
      if (value < 10) {
        maximumFractionDigits = 2;
        minimumFractionDigits = 2;
      }
      break;
    case 'JPY':
    case 'KRW':
    case 'IDR':
    case 'VND':
      // Currencies typically without decimals
      maximumFractionDigits = 0;
      minimumFractionDigits = 0;
      break;
    case 'INR':
    case 'PHP':
    case 'THB':
    case 'MYR':
      // Asian currencies: show decimals for smaller values
      if (value < 100) {
        maximumFractionDigits = 2;
        minimumFractionDigits = 0;
      }
      break;
    default:
      // Default: no decimals for large numbers, 2 decimals for small numbers
      if (value < 10) {
        maximumFractionDigits = 2;
        minimumFractionDigits = 2;
      }
  }
  
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(value);
  } catch (error) {
    //console.error(`Error formatting price for ${currency}:`, error);
    return `${value.toFixed(maximumFractionDigits)} ${currency}`;
  }
}
