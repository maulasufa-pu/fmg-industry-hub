// src/components/Hero.tsx
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion, useAnimation, Variants, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Sparkles, PlayCircle } from "lucide-react";
import CinematicVideoHeroHLS from "@/components/CinematicVideoHeroHLS";

// ----- Animations -----
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.05 * i }
  }),
};

// Garis bawah dinamis di bawah headline
function KineticUnderline(): React.JSX.Element {
  return (
    <span className="relative mt-3 block h-[3px] w-[220px] max-w-[60vw] overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
      <span className="absolute inset-y-0 left-0 w-1/3 animate-[shimmer_1.8s_ease-in-out_infinite] rounded-full bg-black/50 dark:bg-white/60" />
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); opacity: .0; }
          30% { opacity: .7; }
          100% { transform: translateX(400%); opacity: 0; }
        }
      `}</style>
    </span>
  );
}

// Layer art sinematik di belakang judul (ring & flare monokrom)
function TitleArtLayer(): React.JSX.Element {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 120, damping: 16, mass: 0.25 });
  const ry = useSpring(useTransform(mx, [0, 1], [-8, 8]), { stiffness: 120, damping: 16, mass: 0.25 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = (): void => { mx.set(0.5); my.set(0.5); };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry }}
      className="pointer-events-none relative -z-10 mx-auto mt-2 h-28 w-full max-w-3xl"
      aria-hidden="true"
    >
      {/* Soft rings */}
      <div className="absolute left-1/2 top-1/2 h-24 w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-black/10 dark:ring-white/10" />
      <div className="absolute left-1/2 top-1/2 h-[88px] w-[65%] -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-black/10 dark:ring-white/10" />
      <div className="absolute left-1/2 top-1/2 h-16 w-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-black/10 dark:ring-white/10" />

      {/* Subtle flare */}
      <div className="absolute inset-0 rounded-[20px] bg-[radial-gradient(500px_120px_at_50%_60%,rgba(255,255,255,0.12),transparent)] dark:bg-[radial-gradient(500px_120px_at_50%_60%,rgba(255,255,255,0.10),transparent)]" />
    </motion.div>
  );
}

// NOTE: Ganti komponen ini sesuai path util kamu jika sudah ada.
function SplitHeadline({ text }: { text: string }): React.JSX.Element {
  return (
    <h1 className="text-center text-3xl font-extrabold leading-tight tracking-tight text-black dark:text-white sm:text-4xl md:text-5xl">
      {text}
    </h1>
  );
}

// NOTE: Ganti dengan komponen button milikmu (MagneticButton) bila ada.
function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
    >
      {children}
    </Link>
  );
}

export default function Hero(): React.JSX.Element {
  const controls = useAnimation();
  useEffect(() => { void controls.start("visible"); }, [controls]);

  return (
    <section className="relative overflow-hidden pt-12 sm:pt-14">
      {/* Background halus (no purple glow) */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_400px_at_50%_-120px,rgba(0,0,0,0.06),transparent)] dark:bg-[radial-gradient(900px_400px_at_50%_-120px,rgba(255,255,255,0.06),transparent)]" />

      <motion.div initial="hidden" animate={controls} className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center">
          {/* Badge kecil */}
          <motion.div
            variants={fadeUp}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40"
          >
            <Sparkles className="h-4 w-4" />
            <span>Build Ecosystem • Spark Innovation • Foster Collaboration</span>
          </motion.div>

          {/* Headline + Underline + Art */}
          <motion.div variants={fadeUp} custom={1} className="w-full">
            <SplitHeadline text="Beyond Sound. Built-in Intelligence." />
            <div className="flex justify-center">
              <KineticUnderline />
            </div>
            <TitleArtLayer />
          </motion.div>

          {/* Deskripsi */}
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-5 max-w-2xl text-center text-balance text-base leading-relaxed text-black dark:text-white"
          >
            <b>FMG Universe</b> is a creative-technology ecosystem born from <b>Flemmo Music Global (FMG) Publishing</b>.
            We’re building one integrated operating system for music—uniting creation, distribution & media, A&R,
            <b> AI R&amp;D</b>, publishing, live and education. We help artists, labels and brands scout smarter, produce
            faster, own rights, grow royalties, and scale catalogs into lasting equity.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* Ganti dengan <MagneticButton> kalau kamu sudah punya */}
            <PrimaryButton href="/client/dashboard">Start My Project</PrimaryButton>
            <Link
              href="#about"
              className="group inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-5 py-3 text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-black/40 dark:hover:bg-black"
            >
              <PlayCircle className="h-5 w-5" /> Learn about FMG
            </Link>
          </motion.div>

          {/* Cinematic Video (HLS) */}
          <div className="mt-10 w-full">
            <CinematicVideoHeroHLS
                shape="rounded"
                m3u8="/videos/vaa/index.m3u8"
                mp4Fallback="/videos/viokichi-you-are-enough-official-music-video-mv.mp4"
                poster="/images/hero-poster.jpg"
                maxWidthClass="max-w-7xl"
                kicker="FMG Universe • Custom Music"
                heading="Let’s Create Your Music."
                subheading="End-to-end production: composition, recording, mixing, mastering, and distribution — plus anamorphic music videos."
                ctaPrimary={{ label: "Start My Project", href: "/client/dashboard" }}
                ctaSecondary={{ label: "Free Consultation", href: "https://wa.me/6282298288188" }}
                credit="Viokichi — You Are Enough"
                revealDelayMs={3000}  // text appears after 3s
                />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
