"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useAnimation,
  useScroll,
  useSpring,
  useTransform,
  Variants,
} from "framer-motion";
import type { MotionValue } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Globe2,
  Music,
  Mic2,
  Zap,
  ShieldCheck,
  Building2,
  LineChart,
  Trophy,
  Users,
  Rocket,
  BookOpen,
  Star,
  Handshake,
  Newspaper,
  Briefcase,
} from "lucide-react";

/*************************
 * Utilities & shared styles
 *************************/
const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.6, ease: "easeOut" },
  }),
};

/*************************
 * Magnetic Button (same vibe)
 *************************/
function MagneticButton({
  children,
  href,
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const x = useSpring(0, { stiffness: 200, damping: 15 });
  const y = useSpring(0, { stiffness: 200, damping: 15 });

  const onMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set(relX * 0.25);
    y.set(relY * 0.25);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Btn = (
    <motion.button
      ref={ref}
      style={{ x, y }}
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
  if (href) return <Link href={href} className="inline-block">{Btn}</Link>;
  return Btn;
}

/*************************
 * Gentle Parallax wrapper (clamped, instant + ease-out)
 *************************/
function Parallax({
  children,
  amount = 12,
  axis = "y",
  className = "",
}: {
  children: React.ReactNode;
  amount?: number;
  axis?: "x" | "y";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const mvRaw = useTransform(scrollYProgress, [0, 0.5, 1], [amount, 0, -amount]);
  const mv = useSpring(mvRaw, { stiffness: 260, damping: 32, mass: 0.3 });
  const style: { y?: MotionValue<number>; x?: MotionValue<number> } =
    axis === "y" ? { y: mv } : { x: mv };
  return (
    <motion.div
      ref={ref}
      style={style}
      className={cn("transform-gpu will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}

/*************************
 * Split headline
 *************************/
function SplitHeadline({ text }: { text: string }) {
  return (
    <h1 className="mx-auto max-w-5xl text-balance text-center text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
      {text.split(" ").map((word, i) => (
        <motion.span
          key={`w-${i}`}
          className="inline-block"
          variants={fadeUp}
          custom={i}
        >
          <span className="mr-2 inline-block bg-gradient-to-br from-black via-indigo-700 to-indigo-400 bg-clip-text text-transparent dark:from-white dark:via-indigo-300 dark:to-indigo-500">
            {word}
          </span>
        </motion.span>
      ))}
    </h1>
  );
}

/*************************
 * Sticky quick facts (international pattern)
 *************************/
function QuickFacts() {
  const FACTS: { label: string; value: string }[] = [
    { label: "Founded", value: "2018" },
    { label: "HQ", value: "West Jakarta, Indonesia" },
    {
      label: "Services",
      value:
        "Music Production, Audio Engineering, Publishing, Distribution",
    },
    { label: "Focus", value: "Artist-first, global rollout" },
  ];
  return (
    <aside className="top-24 hidden h-max space-y-3 rounded-3xl border border-black/10 bg-white p-5 text-sm shadow-sm dark:border-white/10 dark:bg-black lg:sticky lg:block">
      <div className="mb-2 text-xs font-semibold tracking-wide text-black/60 dark:text-white/60">
        Quick facts
      </div>
      {FACTS.map((f, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="text-black/60 dark:text-white/60">{f.label}</span>
          <span className="font-medium">{f.value}</span>
        </div>
      ))}
      <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
      <div className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
        <ShieldCheck className="h-4 w-4" /> NDA available
      </div>
      <div className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
        <Rocket className="h-4 w-4" /> Global delivery
      </div>
    </aside>
  );
}

/*************************
 * Service Pillar card
 *************************/
function Pillar({
  icon: Icon,
  title,
  points,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  points: string[];
}) {
  return (
    <Parallax amount={10}>
      <div className="group rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:shadow-xl dark:border-white/10 dark:bg-black">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-600/10 p-3 ring-1 ring-indigo-600/20 dark:bg-indigo-400/10 dark:ring-indigo-400/20">
            <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <ul className="space-y-2 text-sm text-black/80 dark:text-white/80">
          {points.map((p, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </Parallax>
  );
}

/*************************
 * Founder (Alfath Flemmo)
 *************************/
function FounderCard() {
  return (
    <Parallax amount={12}>
      <div className="grid grid-cols-1 gap-6 overflow-hidden rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black sm:grid-cols-[220px_1fr]">
        {/* Foto Parallax */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
          <img
            src="/img/alfath-flemmo-founder-ceo-flemmo-music-global-publishing-fmg-universe.jpeg"
            alt="Alfath Flemmo - Founder & CEO Flemmo Music Global Publishing (FMG Universe)"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Konten teks */}
        <div>
          <h3 className="text-2xl font-bold">Alfath Flemmo</h3>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Founder & CEO — Flemmo Music Global (FMG) Universe
          </p>
          <ul className="mt-4 space-y-2 text-sm text-black/80 dark:text-white/80">
            <li className="flex items-start gap-2">
              <Star className="mt-0.5 h-4 w-4 text-indigo-600" /> Composer,
              songwriter, arranger, audio engineer, and digital music producer.
            </li>
            <li className="flex items-start gap-2">
              <Globe2 className="mt-0.5 h-4 w-4 text-indigo-600" /> Leads FMG
              Universe across publishing, distribution, licensing, and studio
              operations.
            </li>
            <li className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 text-indigo-600" /> Collaborates
              with indie artists, labels, and brands across markets.
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
              Jakarta-based
            </span>
            <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
              Pop • K-Pop • Lo-Fi • Piano
            </span>
            <span className="rounded-full bg-black/5 px-3 py-1 dark:bg-white/10">
              Publishing • Distribution • Licensing
            </span>
          </div>
        </div>
      </div>
    </Parallax>
  );
}

/*************************
 * Timeline
 *************************/
function TimelineItem({
  year,
  title,
  desc,
}: {
  year: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="relative pl-8">
      <span className="absolute left-0 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
        {year.slice(-2)}
      </span>
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-black/70 dark:text-white/70">{desc}</p>
    </li>
  );
}

/*************************
 * FAQ
 *************************/
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      onClick={() => setOpen((v) => !v)}
      className="cursor-pointer rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-black"
    >
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-semibold">{q}</h4>
        <ArrowRight
          className={cn("h-4 w-4 transition-transform", open && "rotate-90")}
        />
      </div>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="mt-3 text-sm text-black/70 dark:text-white/70">{a}</p>
      </motion.div>
    </motion.div>
  );
}

/*************************
 * Small components
 *************************/
function Value({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
}) {
  return (
    <Parallax amount={10}>
      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-600/10 p-3 ring-1 ring-indigo-600/20 dark:bg-indigo-400/10 dark:ring-indigo-400/20">
            <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-black/70 dark:text-white/70">{desc}</p>
      </div>
    </Parallax>
  );
}

/*************************
 * Page (Client)
 *************************/
export default function AboutClientV2() {
  const controls = useAnimation();
  useEffect(() => {
    controls.start("visible");
  }, [controls]);

  return (
    <main className="relative min-h-screen bg-white text-black antialiased dark:bg-black dark:text-white">
      {/* subtle noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[-1] opacity-[0.06] mix-blend-soft-light"
        aria-hidden
      >
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.80"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 sm:pt-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_50%_-100px,rgba(79,70,229,0.15),transparent)]" />
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center text-center">
            <Parallax amount={10}>
              <motion.div
                initial="hidden"
                animate={controls}
                variants={fadeUp}
                className="mb-3 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40"
              >
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span>Publisher • Label & Distributor • Recording Studio</span>
              </motion.div>
            </Parallax>
            <Parallax amount={14}>
              <SplitHeadline text="What is FMG Universe?" />
            </Parallax>
            <Parallax amount={16}>
              <motion.p
                variants={fadeUp}
                className="mt-4 max-w-3xl text-balance text-base leading-relaxed text-black/70 dark:text-white/70"
              >
                FMG Universe is a global music company and platform. <br />
                Beyond Sound. Built-in Intelligence. <br />
                <br />
                We turn creativity into compounding value with one operating
                system for music—uniting creation, talent, distribution & media,
                R&D, publishing, live and education. Driven by technological
                innovation, we help artists, labels and brands scout smarter,
                produce faster, own rights, grow royalties into lasting equity.
                <br />
                <br />
                In simple terms, FMG Universe is an all-in-one hub for the
                music business. Instead of using many separate services, artists
                and brands can create music, manage talent, release songs and
                videos, handle rights and royalties, and plan live or education
                programs in one place. With smart tools and clear workflows, we
                make the process faster, more transparent, and more
                profitable—so creative work builds long-term value.
              </motion.p>
            </Parallax>
          </div>
        </div>
      </section>

      {/* Content layout: sticky quick facts + long-form content */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-10 pt-16 text-black/70 dark:text-white/70 lg:grid-cols-[270px_1fr]">
        <QuickFacts />
        <article
          className="prose prose-zinc max-w-none dark:prose-invert
                      prose-headings:scroll-mt-20 prose-h2:font-semibold
                      prose-p:leading-relaxed prose-li:marker:text-indigo-500"
        >
          <h2>What is Flemmo Music Global (FMG)?</h2>
          <p className="py-3">
            <strong>Flemmo Music Global (powered by FMG Universe)</strong> is a
            professional music company that connects the creative and business
            sides of your career in one place. <em>Beyond Sound. Built-in
            Intelligence.</em> From first idea to global release and long-term
            growth, we provide a clear, reliable workflow so you can focus on
            making great music while we handle the rest.
          </p>
          <p>
            On the creative side, our team covers{" "}
            <strong>
              songwriting, composition, arranging, recording, mixing, mastering,
              and sound design
            </strong>
            —including music direction and audio post for film, ads, and games.
            On the business side, we manage{" "}
            <strong>
              publishing, copyright registration, licensing, and digital &
              physical distribution
            </strong>
            . We also run{" "}
            <strong>
              marketing, promotion, PR, artist branding, image and business
              development, partnerships, sponsorships, and monetization
            </strong>{" "}
            across streaming, social, sync, and live.
          </p>
          <p className="py-3">
            Because we operate on the FMG Universe platform—an “operating
            system” for music—we unite creation, talent, distribution &amp;
            media, R&amp;D, publishing, live, and education into one connected
            pipeline. That means smarter A&amp;R, faster production, transparent
            rights management, and stronger royalty growth. Whether you’re an
            independent artist, a label, or a brand, we help you succeed in
            local and international markets with world-class quality,
            predictable timelines, and data-driven decisions.
          </p>

          <ul>
            <li>
              <strong>End-to-end workflow:</strong> One partner from demo to
              release to growth.
            </li>
            <li>
              <strong>Rights &amp; royalties first:</strong> Clear ownership,
              accurate reporting, long-term value.
            </li>
            <li>
              <strong>Creative excellence:</strong> Experienced producers and
              engineers, pro-level delivery.
            </li>
            <li>
              <strong>Market reach:</strong> Global distribution, PR, and
              partnerships tailored to your goals.
            </li>
            <li>
              <strong>Scalable support:</strong> Flexible packages for singles,
              EPs, albums, and catalogs.
            </li>
          </ul>

          <div className="not-prose mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Pillar
              icon={Rocket}
              title="Distribution & Publishing"
              points={["DSP delivery & QC", "Registrations & splits", "Metadata & compliance"]}
            />
            <Pillar
              icon={Music}
              title="Studio & Creation"
              points={["Songwriting & arrangement", "Recording, mixing, mastering", "Remote & in-studio workflow"]}
            />
            <Pillar
              icon={ShieldCheck}
              title="Licensing & Rights"
              points={["Clearances & agreements", "Watermarking & audit logs", "Usage tracking"]}
            />
            <Pillar
              icon={LineChart}
              title="Portal & Insights"
              points={["Approvals & versioning", "Status & tasks", "Royalty snapshots"]}
            />
          </div>

          <h2 className="mt-12">Leadership</h2>
          <FounderCard />

          {/* 
          <h2 className="mt-12">Milestones</h2>
          <ol className="relative mx-auto max-w-3xl space-y-8 border-l border-black/10 pl-6 dark:border-white/10">
            <TimelineItem year="2020" title="Studio roots" desc="Songwriting and production for independent artists." />
            <TimelineItem year="2022" title="Publishing arm" desc="Launched FMG Publishing for registrations & splits." />
            <TimelineItem year="2023" title="Distribution" desc="Rolled out DSP delivery and quality control checks." />
            <TimelineItem year="2024" title="Licensing & portal" desc="Introduced licensing support and secure client portal." />
          </ol>
          */}

          <h2 className="mt-12">Global footprint</h2>
          <p>
            We collaborate with clients across Asia, North America, and Europe.
            Remote-first, with studio partners as needed.
          </p>
          <div className="not-prose mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              "Jakarta",
              "Singapore",
              "Seoul",
              "Tokyo",
              "Sydney",
              "Dubai",
              "London",
              "Los Angeles",
            ].map((c) => (
              <div
                key={c}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-black"
              >
                {c}
              </div>
            ))}
          </div>

          <h2 className="mt-12">Our principles</h2>
          <div className="not-prose grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Value
              icon={Users}
              title="Artist-first"
              desc="We align on vision, protect your rights, and put the song first."
            />
            <Value
              icon={ShieldCheck}
              title="Trust & safety"
              desc="Granular permissions, watermarking, and audit trails by default."
            />
            <Value
              icon={BookOpen}
              title="Clarity"
              desc="Clear scopes, version history, and structured feedback to move fast."
            />
            <Value
              icon={Rocket}
              title="Delivery"
              desc="Radio-ready mixes and DSP-compliant masters, on schedule."
            />
            <Value
              icon={Handshake}
              title="Partnership"
              desc="Long-term support across releases, not just single projects."
            />
            <Value
              icon={LineChart}
              title="Results"
              desc="From traction snapshots to payout projections, we measure what matters."
            />
          </div>

          <h2 className="mt-12">Press & partners</h2>
          <div className="not-prose grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              "Billboard",
              "Spotify",
              "Apple Music",
              "YouTube Music",
              "TikTok",
              "Instagram",
              "X",
              "SoundCloud",
            ].map((b) => (
              <div
                key={b}
                className="flex h-20 items-center justify-center rounded-2xl border border-black/10 bg-white text-sm font-medium dark:border-white/10 dark:bg-black"
              >
                {b}
              </div>
            ))}
          </div>

          <h2 className="mt-12">FAQ</h2>
          <div className="not-prose grid grid-cols-1 gap-4 md:grid-cols-2">
            <FAQItem
              q="How long does it take to finish a song?"
              a="Depends on complexity. Typically 7–21 days from brief to final master. Rush orders possible — contact us for available slots."
            />
            <FAQItem
              q="Can you help distribute to Spotify/Apple Music?"
              a="Yes. We prepare metadata, ISRC/UPC, QC, and deliver to DSPs. Optional pitching based on release plan."
            />
            <FAQItem
              q="Do you accept revisions?"
              a="Yes, we include several reasonable rounds of revisions per phase. Details are listed in the proposal."
            />
            <FAQItem
              q="Can you work remotely?"
              a="Yes. The entire process can be managed via our portal: upload brief, timecoded comments, version approvals, and final delivery."
            />
          </div>

          <div className="not-prose mt-16 rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-black">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="text-pretty text-2xl font-bold sm:text-3xl">
                  Work with FMG Universe
                </h3>
                <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                  Share your references, timeline, and deliverables — we’ll
                  craft a tailored proposal.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <MagneticButton href="#">Upload brief</MagneticButton>
                <Link
                  href="#"
                  className="inline-flex items-center gap-2 rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                >
                  Book a call <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </article>
      </section>

      {/* Footer (light) — hapus bila sudah pakai global Footer dari layout */}
      {/* <footer className="border-t border-black/10 py-10 text-sm dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="text-black/60 dark:text-white/60">
            © {new Date().getFullYear()} FMGIHub / Flemmo Studio
          </div>
          <div className="flex gap-6 text-black/60 dark:text-white/60">
            <Link href="/">Home</Link>
            <Link href="/services">Services</Link>
            <Link href="/about">About</Link>
          </div>
        </div>
      </footer> */}
    </main>
  );
}
