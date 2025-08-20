"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView, useMotionValue, useSpring, useTransform, useScroll, Variants } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { ArrowRight, Star, Rocket, Music, ShieldCheck, Zap, Sparkles, PlayCircle, LineChart, Mic2 } from "lucide-react";

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
function MagneticButton({ children, href, className = "" }: { children: React.ReactNode; href?: string; className?: string }) {
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

  if (href) return (
    <Link href={href} className="inline-block">
      {Btn}
    </Link>
  );
  return Btn;
}

/*************************
 * Spotlight following cursor (background layer)
 *************************/
function Spotlight() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <Parallax speed={-0.02}>
      <div ref={ref} className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -inset-40 rounded-full opacity-30 blur-3xl transition-transform duration-300 will-change-transform"
          style={{
            background: "radial-gradient(600px 600px at var(--x) var(--y), rgba(99,102,241,.6), transparent 50%)",
            transform: `translate3d(${pos.x - 300}px, ${pos.y - 300}px, 0)`,
            // @ts-expect-error CSS var for visual only
            "--x": `${pos.x}px`,
            "--y": `${pos.y}px`
          }}
        />
      </div>
    </Parallax>
  );
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
function PricingCard({ name, price, features, cta, period = "project" }: { name: string; price: string; features: readonly string[]; cta: string; period?: string }) {
  return (
    <Parallax speed={0.08}>
      <motion.div variants={fadeUp} className="flex flex-col rounded-3xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black">
        <h3 className="text-xl font-semibold">{name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold">{price}</span>
          <span className="text-sm text-black/60 dark:text-white/60">/{period}</span>
        </div>
        <ul className="mt-6 space-y-3 text-sm">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2"><span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white"><Checkmark /></span><span className="text-black/80 dark:text-white/80">{f}</span></li>
          ))}
        </ul>
        <div className="mt-8">
          <MagneticButton href="#cta" className="w-full justify-center">{cta}</MagneticButton>
        </div>
      </motion.div>
    </Parallax>
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
    <section className="relative overflow-hidden pt-24 sm:pt-28">
      <Spotlight />
      <Parallax speed={-0.03}>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_50%_-100px,rgba(79,70,229,0.15),transparent)]" />
      </Parallax>

      <motion.div initial="hidden" animate={controls} className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center">
          <Parallax speed={0.08}>
            <motion.div variants={fadeUp} className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>New: FMGIH — your song production & label partner</span>
            </motion.div>
          </Parallax>

          <Parallax speed={0.12}>
            <SplitHeadline text="Write. Produce. Publish." />
          </Parallax>

          <Parallax speed={0.14}>
            <motion.p variants={fadeUp} custom={4} className="mt-5 max-w-2xl text-center text-balance text-base leading-relaxed text-black/70 dark:text-white/70">
              Flemmo Music Global (FMG) — a publisher, label & distributor/aggregator, and recording studio — delivers custom songwriting, arrangement, recording, mixing & mastering, publishing, distribution, and licensing in one modern hub.
            </motion.p>
          </Parallax>

          <Parallax speed={0.16}>
            <motion.div variants={fadeUp} custom={5} className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton href="#cta">Get a quote</MagneticButton>
              <Link href="#about" className="group inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-black/40 dark:hover:bg-black">
                <PlayCircle className="h-5 w-5" /> Learn about FMG
              </Link>
            </motion.div>
          </Parallax>

          <ParallaxRibbon />

          <div className="mx-auto mt-14 w-full max-w-6xl">
            <MarqueeRow
              speed={60}
              items={["Custom Songwriting","Arrangement & Production","Recording Studio","Mixing & Mastering","Music Publishing","Label & Distribution","Licensing & Rights","Client Portal & Analytics"]}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/*************************
 * Features Section (services)
 *************************/
function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-4 py-20">
      <Parallax speed={0.06}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }} className="mx-auto max-w-3xl text-center">
          <motion.h2 variants={fadeUp} className="text-pretty text-3xl font-bold sm:text-4xl">A full-service studio & publisher</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-black/70 dark:text-white/70">From brief to release, FMGIH powers every step with a single, secure client portal.</motion.p>
        </motion.div>
      </Parallax>

      <Parallax speed={0.1}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-10%" }} className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={Music} title="Songwriting & Production" desc="Original songs tailored to your story: topline, lyrics, arrangement, and full production." />
          <FeatureCard icon={Mic2} title="Recording & Editing" desc="High‑quality tracking, vocal comping, tuning, timing, and editing for pristine takes." />
          <FeatureCard icon={Zap} title="Mixing & Mastering" desc="Radio‑ready mixes and transparent masters optimized for every DSP." />
          <FeatureCard icon={Rocket} title="Publishing & Distribution" desc="Register works, manage splits, and deliver to Spotify, Apple Music, and more." />
          <FeatureCard icon={ShieldCheck} title="Licensing & Rights" desc="Clearances, watermarking, and audit trails to protect and monetize your catalog." />
          <FeatureCard icon={LineChart} title="Client Portal & Analytics" desc="Approve drafts, track status, and view royalty insights — all in one place." />
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
      <Parallax speed={0.05}>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 sm:grid-cols-3">
          <Stat label="Clients" value={320} />
          <Stat label="Songs delivered" value={1500} />
          <Stat label="Avg. faster release" value={37} />
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
    <section id="about" className="relative mx-auto max-w-6xl px-4 py-20">
      <Parallax speed={0.06}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-3xl text-center">
          <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">What is Flemmo Music Global?</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-black/70 dark:text-white/70">
            Flemmo Music Global (FMG) is a music publisher, label & distributor/aggregator, and recording studio. We provide
            end‑to‑end services: custom songwriting, arrangement & production, recording, mixing & mastering, publishing
            administration, distribution to DSPs, and licensing support.
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
          <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">Artists & teams love FMGIH</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-black/70 dark:text-white/70">From indie creators to labels.</motion.p>
        </motion.div>
      </Parallax>

      <Parallax speed={0.08}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Testimonial quote="The revision flow cut our turnaround time in half." name="Ayla L." role="Producer" />
          <Testimonial quote="Distribution checks save us hours every release." name="Marcus V." role="Label Ops" />
          <Testimonial quote="Feels like DMs for music — fast, tidy, and secure." name="Kaito R." role="Engineer" />
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
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto max-w-3xl text-center">
          <motion.h2 variants={fadeUp} className="text-3xl font-bold sm:text-4xl">Service packages</motion.h2>
          <motion.p variants={fadeUp} custom={1} className="mt-3 text-black/70 dark:text-white/70">Choose a package or request a custom quote.</motion.p>
        </motion.div>
      </Parallax>

      <Parallax speed={0.1}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <PricingCard name="Single Song" price="Custom" cta="Get a quote" period="project" features={["Original songwriting","Arrangement & production","Mixing & mastering","Publisher‑ready metadata"]} />
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-tr from-indigo-500/20 to-fuchsia-500/20 blur-2xl" />
            <PricingCard name="Pro (EP/Album)" price="Custom" cta="Get a quote" period="project" features={["Multi‑track bundle","Project portal & approvals","Version history","Distribution checks"]} />
          </div>
          <PricingCard name="Studio / Label" price="Custom" cta="Talk to us" period="project" features={["Custom scope","Roles & permissions","Publishing & licensing support","Priority support"]} />
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
    <section id="cta" className="relative overflow-hidden py-20">
      <Parallax speed={-0.04}>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_400px_at_50%_10%,rgba(99,102,241,0.2),transparent)]" />
      </Parallax>
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2">
        <Parallax speed={0.06}>
          <div>
            <h3 className="text-pretty text-3xl font-bold sm:text-4xl">Ready to make your next release?</h3>
            <p className="mt-3 text-black/70 dark:text-white/70">Tell us your vision — we&#39;ll craft the sound and handle publishing & distribution.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <MagneticButton href="#">Get a quote</MagneticButton>
              <Link href="#" className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5">
                Book a call <ArrowRight className="h-4 w-4" />
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
 * Footer
 *************************/
function Footer() {
  return (
    <footer className="border-t border-black/10 py-10 text-sm dark:border-white/10">
      <Parallax speed={0.03}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="text-black/60 dark:text-white/60">© {new Date().getFullYear()} Flemmo Music Global Industry Hub (FMGIH).</div>
          <div className="flex gap-6 text-black/60 dark:text-white/60">
            <Link href="/about">About</Link>
            <Link href="#features">Services</Link>
            <Link href="#pricing">Packages</Link>
          </div>
        </div>
      </Parallax>
    </footer>
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

      <nav className="sticky top-0 z-40 border-b border-black/10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-white/10 dark:bg-black/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="#" className="flex items-center gap-2 font-semibold">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-600 to-fuchsia-600" />
            {/* <span>FMGIH · Flemmo Studio</span> */}
            <div className="inline-flex flex-col items-end justify-center relative flex-[0_0_auto]">
          <div 
            className="relative w-fit mt-[-1.00px] font-heading-4 font-[number:var(--heading-4-font-weight)] text-gray-800 dark:text-gray-100 dark:text-gray-100 text-[length:var(--heading-4-font-size)] tracking-[var(--heading-4-letter-spacing)] leading-[var(--heading-4-line-height)] whitespace-nowrap [font-style:var(--heading-4-font-style)]"
          >
            Flemmo Music
          </div>

          <div 
            className="relative w-fit -mt-1 font-body-XS font-[number:var(--body-XS-font-weight)] text-neutral-600 dark:text-neutral-200 dark:text-gray-200 text-[length:var(--body-XS-font-size)] tracking-[var(--body-XS-letter-spacing)] leading-[var(--body-XS-line-height)] whitespace-nowrap [font-style:var(--body-XS-font-style)]"
          >
            Industry Hub
          </div>
        </div>
          </Link>
          <div className="hidden items-center gap-6 text-sm sm:flex">
            <Link href="#about" className="opacity-80 hover:opacity-100">About</Link>
            <Link href="#features" className="opacity-80 hover:opacity-100">Services</Link>
            <Link href="#pricing" className="opacity-80 hover:opacity-100">Packages</Link>
            <MagneticButton href="#cta" className="px-4 py-2">Get a quote</MagneticButton>
          </div>
        </div>
      </nav>

      <Hero />
      <Features />
      <Numbers />
      <AboutFMG />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
