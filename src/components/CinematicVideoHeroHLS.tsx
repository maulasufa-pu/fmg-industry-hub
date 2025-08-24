// src/components/CinematicVideoHeroHLS.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Volume2, VolumeX, ArrowRight } from "lucide-react";

type FrameShape = "keystone" | "octagon" | "hex" | "ticket" | "rounded";
type Align = "left" | "center" | "right";
type MobileCopyPos = "above" | "below";

type CTA = { label: string; href: string; newTab?: boolean; rel?: string };

type Props = {
  // Video
  m3u8?: string;
  mp4Fallback?: string;
  poster?: string;
  loop?: boolean;
  forceAspect?: number; // desktop ratio (auto if omitted, fallback 2.39)

  // Frame & layout
  className?: string;
  shape?: FrameShape;
  maxWidthClass?: string;

  // Copy
  kicker?: string;
  heading?: string;
  subheading?: string;
  align?: Align;
  ctaPrimary?: CTA;
  ctaSecondary?: CTA;
  credit?: string;

  // Behavior
  revealDelayMs?: number;        // desktop initial show duration (ms)
  showLightSweep?: boolean;
  mobileCopyPosition?: MobileCopyPos; // "above" | "below"
};

export default function CinematicVideoHeroHLS({
  m3u8 = "/videos/vaa/index.m3u8",
  mp4Fallback,
  poster,
  loop = true,
  forceAspect,

  className,
  shape = "rounded",
  maxWidthClass = "max-w-7xl",

  kicker = "FMG Universe • Custom Music",
  heading = "Let’s Create Your Music.",
  subheading = "Composition, recording, mixing, mastering, and distribution — plus anamorphic music videos.",
  align = "left",
  ctaPrimary = { label: "Start Your Project", href: "/contact" },
  ctaSecondary = { label: "Free Consultation", href: "/consult" },
  credit = "Viokichi — You Are Enough",

  revealDelayMs = 3000,
  showLightSweep = true,
  mobileCopyPosition = "below",
}: Props) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<import("hls.js").default | null>(null);

  // Parallax & tilt
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-1%", "1%"]);
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1.006, 1.0]);
  const mvX = useMotionValue(0.5);
  const mvY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mvY, [0, 1], [3.5, -3.5]), { stiffness: 150, damping: 20, mass: 0.35 });
  const rotateY = useSpring(useTransform(mvX, [0, 1], [-4.5, 4.5]), { stiffness: 150, damping: 20, mass: 0.35 });

  const [muted, setMuted] = useState(true);
  const [aspect, setAspect] = useState<number | null>(forceAspect ?? null); // desktop ratio
  const [showCopy, setShowCopy] = useState(true);     // desktop: visible first N ms
  const [hover, setHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);    // breakpoint watcher

  // Clip-path (prevent “cut bottom” with 99%)
  const clipMap: Record<Exclude<FrameShape, "rounded">, string> = {
    keystone: "polygon(8% 0%, 92% 0%, 100% 99%, 0% 99%)",
    octagon: "polygon(3% 0%, 97% 0%, 100% 12%, 100% 88%, 97% 99%, 3% 99%, 0% 88%, 0% 12%)",
    hex: "polygon(6% 0%, 94% 0%, 100% 50%, 94% 99%, 6% 99%, 0% 50%)",
    ticket: "polygon(0% 0%,100% 0%,100% 35%,95% 35%,95% 65%,100% 65%,100% 99%,0% 99%,0% 65%,5% 65%,5% 35%,0% 35%)",
  };
  const clipPath = shape === "rounded" ? undefined : clipMap[shape];
  const clipStyle = clipPath ? { clipPath } : undefined;
  const radiusClass = shape === "rounded" ? "rounded-[20px] md:rounded-[24px]" : "";

  // Breakpoint watcher (mobile = ≤767px)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setIsMobile(mq.matches);
    set(); // initial
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // Init playback + read aspect for desktop
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let cancelled = false;
    let localHls: import("hls.js").default | null = null;

    const onPause: EventListener = () => { if (document.visibilityState === "visible") void v.play(); };
    const onClick: EventListener = () => { void v.play(); };
    const onMeta = (): void => {
      if (forceAspect) return;
      const vw = v.videoWidth || 0, vh = v.videoHeight || 0;
      setAspect(vw > 0 && vh > 0 ? vw / vh : 2.39);
    };

    v.addEventListener("pause", onPause);
    v.addEventListener("click", onClick);
    v.addEventListener("loadedmetadata", onMeta);
    v.tabIndex = -1;

    (async () => {
      if (cancelled) return;
      if (m3u8) {
        if (v.canPlayType("application/vnd.apple.mpegurl")) {
          v.src = m3u8;
        } else {
          const Hls = (await import("hls.js")).default;
          if (Hls.isSupported()) {
            localHls = new Hls({ lowLatencyMode: false });
            hlsRef.current = localHls;
            localHls.loadSource(m3u8);
            localHls.attachMedia(v);
          } else if (mp4Fallback) {
            v.src = mp4Fallback;
          }
        }
      } else if (mp4Fallback) v.src = mp4Fallback;

      v.muted = true;
      void v.play();
    })();

    // desktop: hide copy after delay
    const timer = setTimeout(() => setShowCopy(false), revealDelayMs);

    return () => {
      clearTimeout(timer);
      cancelled = true;
      v.removeEventListener("pause", onPause);
      v.removeEventListener("click", onClick);
      v.removeEventListener("loadedmetadata", onMeta);
      try { localHls?.destroy(); } catch {}
      hlsRef.current = null;
    };
  }, [m3u8, mp4Fallback, forceAspect, revealDelayMs]);

  // Mute toggle (no restart)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (!muted) { v.volume = 0.9; void v.play(); }
  }, [muted]);

  // Mouse tilt
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mvX.set((e.clientX - r.left) / r.width);
    mvY.set((e.clientY - r.top) / r.height);
  };

  const aspectNumber = aspect ?? 2.39; // desktop fallback

  const alignCls =
    align === "center" ? "items-center text-center"
      : align === "right" ? "items-end text-right"
      : "items-start text-left";

  const Sweep: React.FC = () => (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
      <motion.span
        initial={{ x: "-120%" }}
        animate={{ x: "120%" }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 h-full w-[30%] bg-gradient-to-r from-transparent via-white/25 to-transparent dark:via-white/15"
        style={{ filter: "blur(6px)" }}
      />
    </span>
  );

  // Mobile CTA (outside video)
  const MobileCopy = (
    <div className="md:hidden mx-auto w-full max-w-prose px-1.5 mt-4">
      {kicker && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-neutral-900/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-900/80 ring-1 ring-neutral-900/10 backdrop-blur-sm dark:bg-white/10 dark:text-white/80 dark:ring-white/15">
          <span className="h-1 w-1 rounded-full bg-current/60" />
          {kicker}
        </div>
      )}
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">{heading}</h2>
      {subheading && (
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-700 dark:text-white/80">{subheading}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {ctaPrimary && (
          <a
            href={ctaPrimary.href}
            target={ctaPrimary.newTab ? "_blank" : undefined}
            rel={ctaPrimary.rel ?? (ctaPrimary.newTab ? "noopener noreferrer" : undefined)}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white px-4 py-2 text-sm font-medium ring-1 ring-black/10 transition hover:opacity-90 dark:bg-white dark:text-neutral-900 dark:ring-white/20"
          >
            {ctaPrimary.label} <ArrowRight className="h-4 w-4" />
          </a>
        )}
        {ctaSecondary && (
          <a
            href={ctaSecondary.href}
            target={ctaSecondary.newTab ? "_blank" : undefined}
            rel={ctaSecondary.rel ?? (ctaSecondary.newTab ? "noopener noreferrer" : undefined)}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900/5 px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-900/10 transition hover:bg-neutral-900/10 dark:bg-white/10 dark:text-white dark:ring-white/20 dark:hover:bg-white/20"
          >
            {ctaSecondary.label}
          </a>
        )}
      </div>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className={`relative w-full px-4 md:px-6 mt-12 md:mt-20 mb-10 md:mb-14 ${className ?? ""}`}
      aria-label="FMG Universe Music Video"
    >
      {/* Mobile copy ABOVE if chosen */}
      {mobileCopyPosition === "above" ? MobileCopy : null}

      <div className={`mx-auto w-full ${maxWidthClass}`}>
        <motion.div
          style={{ y, scale: parallaxScale, rotateX, rotateY }}
          onMouseMove={onMouseMove}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          className="relative"
        >
          {/* Outer container (not clipped) */}
          <div className="relative">
            {/* Masked video frame */}
            <div
              className={`relative ${radiusClass} overflow-hidden bg-neutral-100/10 ring-1 ring-neutral-900/10 shadow-xl shadow-black/10 dark:bg-black/80 dark:ring-white/10 dark:shadow-black/40`}
              style={clipStyle}
            >
              <div
                className="relative w-full"
                style={{
                  // Mobile square + fill; Desktop anamorphic + contain
                  aspectRatio: isMobile ? 1 : aspectNumber,
                  minHeight: isMobile ? "360px" : "320px",
                }}
              >
                <video
                  ref={videoRef}
                  className={`absolute inset-0 h-full w-full select-none ${isMobile ? "object-cover" : "object-contain"} bg-black`}
                  loop={loop}
                  autoPlay
                  playsInline
                  controls={false}
                  controlsList="nodownload noplaybackrate noremoteplayback"
                  disablePictureInPicture
                  poster={poster}
                  preload="auto"
                  crossOrigin="anonymous"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            </div>

            {/* Credit & Sound toggle OUTSIDE the mask (won’t be clipped) */}
            {credit && (
              <div className="absolute left-3 bottom-3 z-10">
                <span className="rounded-full bg-neutral-900/70 px-2.5 py-1 text-[11px] leading-none text-white ring-1 ring-black/20 backdrop-blur-sm dark:bg-white/15 dark:text-white dark:ring-white/20">
                  {credit}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Turn sound on" : "Turn sound off"}
              className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-neutral-900 ring-1 ring-black/10 backdrop-blur-md shadow-lg transition hover:bg-white dark:bg-zinc-900/80 dark:text-white dark:ring-white/15"
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            {/* DESKTOP CTA overlay — 3s then hide; reappear on hover */}
            <AnimatePresence>
              {!isMobile && (hover || showCopy) ? (
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className={`pointer-events-none absolute inset-0 hidden md:flex px-8 lg:px-12 ${alignCls}`}
                >
                  <div className="pointer-events-auto my-auto max-w-2xl lg:max-w-3xl">
                    {kicker && (
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85 ring-1 ring-white/15 backdrop-blur-sm dark:bg-white/10">
                        <span className="h-1 w-1 rounded-full bg-current/60" />
                        {kicker}
                      </div>
                    )}
                    <h2 className="relative text-3xl lg:text-5xl font-semibold leading-tight text-white">
                      <span className="relative inline-block">
                        {heading}
                        {showLightSweep ? <Sweep /> : null}
                      </span>
                    </h2>
                    {subheading && (
                      <p className="mt-3 text-base lg:text-lg text-white/85">{subheading}</p>
                    )}
                    <div className="mt-5 flex flex-wrap gap-3">
                      {ctaPrimary && (
                        <a
                          href={ctaPrimary.href}
                          target={ctaPrimary.newTab ? "_blank" : undefined}
                          rel={ctaPrimary.rel ?? (ctaPrimary.newTab ? "noopener noreferrer" : undefined)}
                          className="inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-black/10 backdrop-blur-sm transition hover:bg-white"
                        >
                          {ctaPrimary.label} <ArrowRight className="h-4 w-4" />
                        </a>
                      )}
                      {ctaSecondary && (
                        <a
                          href={ctaSecondary.href}
                          target={ctaSecondary.newTab ? "_blank" : undefined}
                          rel={ctaSecondary.rel ?? (ctaSecondary.newTab ? "noopener noreferrer" : undefined)}
                          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20"
                        >
                          {ctaSecondary.label}
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Mobile copy BELOW if chosen */}
      {mobileCopyPosition === "below" ? MobileCopy : null}
    </section>
  );
}
