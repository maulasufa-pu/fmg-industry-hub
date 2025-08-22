"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView, useMotionValue, useSpring, useTransform, useScroll, Variants } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { ArrowRight, Star, Check, CheckCircle2, Rocket, Music, ShieldCheck, Zap, Sparkles, PlayCircle, LineChart, Mic2 } from "lucide-react";
import { Users, Share2, Cpu, BookOpen, Calendar, GraduationCap, type LucideIcon } from "lucide-react";

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
function ParallaxRibbon() {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yRaw = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const y = useSpring(yRaw, { stiffness: 260, damping: 32, mass: 0.3 });

  return (
    <div ref={ref} className="relative z-10 mx-auto mt-16 w-full max-w-6xl">
      <motion.div
        style={{ y }}
        className="h-48 w-full rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 opacity-100 ring-1 ring-black/10 dark:ring-white/10 shadow-lg shadow-indigo-500/10 transform-gpu will-change-transform"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-black/5 ring-1 ring-black/10 dark:bg-white/5 dark:ring-white/10" />
    </div>
  );
}

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
 * Feature Card
 *************************/
function FeatureCard({ icon: Icon, title, desc }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; title: string; desc: string; }) {
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
        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          Learn more <ArrowRight className="h-3.5 w-3.5" />
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
export function PricingCard({
  name, price, features, cta, period = "single",
  accent = "indigo", badge,
  ctaHref, ctaTarget, ctaRel,
}: PricingCardProps) {
  // tint gradient per accent
  const tint =
    accent === "gold"
      ? "before:from-amber-400/55 before:to-yellow-500/35"
      : accent === "violet"
      ? "before:from-fuchsia-500/45 before:to-indigo-500/35"
      : "before:from-indigo-500/45 before:to-sky-500/30";

  // dot/check color per accent
  const dot =
    accent === "gold"
      ? "bg-amber-400 text-black"
      : accent === "violet"
      ? "bg-fuchsia-500 text-white"
      : "bg-indigo-600 text-white";

  return (
    <div
      className={[
        "relative overflow-hidden rounded-3xl border",
        "border-black/10 dark:border-white/10",
        // base surface (bukan hitam): sedikit translucent supaya tint terlihat
        "bg-white/80 dark:bg-black/40 backdrop-blur-sm",
        // tint layer di DALAM card agar tidak ada sisa div/transparan
        "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br",
        "before:mix-blend-multiply dark:before:mix-blend-screen",
        "before:opacity-30 dark:before:opacity-35",
        tint,
        "p-8 shadow-sm",
      ].join(" ")}
    >
      {/* badge: di dalam card, tidak terpotong */}
      {badge && (
        <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/20">
          {badge}
        </span>
      )}

      <h3 className="text-xl font-semibold">{name}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className="text-sm text-black/60 dark:text-white/60">/{period}</span>
      </div>

      {/* checklist selalu sejajar */}
      <ul className="mt-6 space-y-3 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 leading-6">
            <span className={`${dot} inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-[2px]`}>
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="text-black/80 dark:text-white/80">{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        <MagneticButton
          href={ctaHref}
          target={ctaTarget}
          rel={ctaRel}
          className="w-full justify-center"
        >
          {cta}
        </MagneticButton>
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
    <section className="relative overflow-hidden pt-24 sm:pt-20">
      {/* <Spotlight />  */}
      <Parallax speed={-0.03}>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_50%_-100px,rgba(79,70,229,0.15),transparent)]" />
      </Parallax>

      <motion.div initial="hidden" animate={controls} className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center">
          <Parallax speed={0.08}>
            <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Build Ecosystem • Spark Innovation • Make Collaboration</span>
            </motion.div>
          </Parallax>

          <Parallax speed={0.12}>
            <SplitHeadline text="Beyond Sound. Built-in Intelligence" />
          </Parallax>

          <Parallax speed={0.14}>
            <motion.p variants={fadeUp} custom={4} className="mt-5 max-w-2xl text-center text-balance text-base leading-relaxed text-black/70 dark:text-white/70">
              Flemo Music Global (FMG) Universe is a global music company and platform. <b>Beyond Sound. Built-in Intelligence.</b> We turn creativity into compounding value with one operating system for music—uniting creation, talent, distribution & media, R&D, publishing, live and education. Driven by technological innovation, we help artists, labels and brands scout smarter, produce faster, own rights, grow royalties, and scale catalogs into lasting equity.
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

          <ParallaxRibbon />
        </div>
      </motion.div>
    </section>
  );
}

/*************************
 * Features Section (services)
 *************************/
// function Features() {
//   return (
//     <section id="features" className="relative mx-auto max-w-6xl px-4 py-20">
//       <Parallax speed={0.06}>
//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }} className="mx-auto max-w-3xl text-center">
//           <motion.h2 variants={fadeUp} className="text-pretty text-3xl font-bold sm:text-4xl">A full-service studio & publisher</motion.h2>
//           <motion.p variants={fadeUp} custom={1} className="mt-3 text-black/70 dark:text-white/70">From brief to release, FMGIH powers every step with a single, secure client portal.</motion.p>
//         </motion.div>
//       </Parallax>

//       <Parallax speed={0.1}>
//         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }} className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//           <FeatureCard icon={Music} title="Songwriting & Production" desc="Original songs tailored to your story: topline, lyrics, arrangement, and full production." />
//           <FeatureCard icon={Mic2} title="Recording & Editing" desc="High‑quality tracking, vocal comping, tuning, timing, and editing for pristine takes." />
//           <FeatureCard icon={Zap} title="Mixing & Mastering" desc="Radio‑ready mixes and transparent masters optimized for every DSP." />
//           <FeatureCard icon={Rocket} title="Publishing & Distribution" desc="Register works, manage splits, and deliver to Spotify, Apple Music, and more." />
//           <FeatureCard icon={ShieldCheck} title="Licensing & Rights" desc="Clearances, watermarking, and audit trails to protect and monetize your catalog." />
//           <FeatureCard icon={LineChart} title="Client Portal & Analytics" desc="Approve drafts, track status, and view royalty insights — all in one place." />
//         </motion.div>
//       </Parallax>
//     </section>
//   );
// }

function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-4 py-10">
      <Parallax speed={0.06}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.h2 variants={fadeUp} className="text-pretty text-3xl font-bold sm:text-4xl">
            Seven divisions, one operating system
          </motion.h2>
          {/* <motion.p variants={fadeUp} custom={1} className="mt-3 text-black/70 dark:text-white/70">
            FMG Universe unites in a single secure client portal.
          </motion.p> */}
        </motion.div>
      </Parallax>

      <Parallax speed={0.1}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="mt-12 grid grid-cols-1 gap-y-8 gap-x-4 sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-3 lg:gap-x-5 pb-8 lg:pb-16"
        >
          {DIVISIONS.map((d, i, arr) => {
            const isLast = i === arr.length - 1;
            const colLg = i % 3;                // 0 kiri, 1 tengah, 2 kanan
            const centerLast = isLast && arr.length % 3 === 1;

            // turunkan hanya kiri/kanan (tanpa bikin jarak kosong)
            const wingShift =
              !centerLast && (colLg === 0 || colLg === 2) ? "lg:translate-y-16 xl:translate-y-24" : "";

            const centerLastClass = centerLast ? "lg:col-start-2" : "";

            return (
              <div
                key={d.title}
                className={`transform-gpu will-change-transform ${wingShift} ${centerLastClass}`}
              >
                <FeatureCard icon={d.icon} title={d.title} desc={d.desc} />
              </div>
            );
          })}
        </motion.div>
      </Parallax>
    </section>
  );
}

/*************************
 * Numbers / Social Proof
 *************************/
function Numbers() {
  return (
    <section className="relative border-y border-black/10 bg-gradient-to-b from-white to-indigo-50/40 py-16 dark:border-white/10 dark:from-black dark:to-indigo-950/20">
      <Parallax speed={0.03}>
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-pretty text-3xl font-bold sm:text-4xl">Numbers that matter</h2>
          <p className="mt-2 text-black/70 dark:text-white/70">
            Proof of scale, reliability, and global reach.
          </p>
        </div>
      </Parallax>

      <Parallax speed={0.05}>
        <div className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-6 px-4 sm:grid-cols-3 lg:grid-cols-4">
          <Stat label="Clients" value={300}/>
          <Stat label="Projects shipped" value={1050} />
          <Stat label="Songs delivered" value={1500} />
          <Stat label="On-time delivery (%)" value={99} />

          <Stat label="Countries reached" value={30} />
          <Stat label="DSPs & Platforms" value={35} />
          <Stat label="Catalog managed (tracks)" value={3000} />
          <Stat label="Avg. turnarounds (days)" value={14} />
        </div>
      </Parallax>
    </section>
  );
}

/*************************
 * About FMG
 *************************/
function AboutFMG() {
  return (
    <section id="about" className="relative mx-auto max-w-6xl px-4 py-5">
      <Parallax speed={0.06}>
        <div className="mx-auto mt-14 w-full max-w-6xl py-10">
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
function Testimonials() {
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

      <Parallax speed={0.08}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Testimonial
            quote="The team quickly grasped the song’s direction. Communication was clear, and the final result still feels like me."
            name="Viokichi"
            role="Artist — Pop/R&B"
          />
          <Testimonial
            quote="My bossa nova single went from demo to release without hassle. Administration and delivery to DSPs were handled smoothly."
            name="Amandha Ayu"
            role="Artist — Jazz/Bossa Nova"
          />
          <Testimonial
            quote="Arrangement, tracking, through to release—everything in one workflow. Progress was always clear and on schedule."
            name="Nannouz"
            role="Artist — Pop, Orchestra, Jazz, Rock"
          />
          <Testimonial
            quote="Cross-language project ran smoothly. Technical direction was precise, distribution was fast, and the result was professional."
            name="Adilisius"
            role="Artist — Pop/ED<"
          />
          <Testimonial
            quote="They turned a rough idea into a record. Stems were organized, milestones were clear, and mix notes were laser-specific."
            name="BesThree"
            role="Artist — Pop/EDM"
          />

          <Testimonial
            quote="One workspace for creative in the music industry—clear notes, fast decisions, release-ready delivery"
            name="Anthem Boys"
            role="Artist — Pop/EDM"
          />
        </motion.div>
      </Parallax>
    </section>
  );
}


/*************************
 * Pricing
 *************************/
function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-4 py-20">
      <Parallax speed={0.06}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.h2 variants={fadeUp} className="text-pretty text-3xl font-bold sm:text-4xl">
            Pricing & Packages
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-2 text-black/70 dark:text-white/70">
            Choose a package or request a custom quote.
          </motion.p>
        </motion.div>
      </Parallax>

      <Parallax speed={0.1}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 items-start"  // ⬅️ here
        >
          <PricingCard
            name="Standard (Single)"
            price="IDR 10.000.000"
            cta="Start My Project"
            ctaHref="/client/dashboard"
            features={[
              "Original songwriting",
              "Arrangement & production",
              "Mixing & mastering",
              "Publisher-ready metadata",
            ]}
            accent="indigo"
          />

          <PricingCard
            name="Pro (Single)"
            price="IDR 15.000.000"
            cta="Start My Project"
            ctaHref="/client/dashboard"
            features={[
              "Everything in Standard +",
              "Multi-version deliverables (original/acoustic/remix/instrumental)",
              "Advanced music production",
              "Detailed mixing & mastering (stems, format targets)",
              "Vocal directing & coaching",
            ]}
            accent="violet"
            badge="Best seller"
          />

          <PricingCard
            name="Ultimate (Single)"
            price="IDR 30.000.000"
            cta="Start My Project"
            ctaHref="/client/dashboard"
            features={[
              "Everything in Standard & Pro +",
              "Music video direction & production",
              "Advanced production workflow (pre-pro → post)",
              "Focused creative direction & talent assets",
              "Release ops & distribution checks",
              "Priority support",
            ]}
            accent="gold"
          />
        </motion.div>
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
      <CTA />
      {/* <Footer /> */}
    </main>
  );
}
