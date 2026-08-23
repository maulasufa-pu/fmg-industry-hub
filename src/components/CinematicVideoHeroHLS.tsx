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
  useInView,
  useReducedMotion,
} from "framer-motion";
import { Volume2, VolumeX, ArrowRight } from "lucide-react";

type FrameShape = "keystone" | "octagon" | "hex" | "ticket" | "rounded";
type Align = "left" | "center" | "right";
type MobileCopyPos = "above" | "below";
type CTA = { label: string; href: string; newTab?: boolean; rel?: string };

type Props = {
  // HLS
  m3u8?: string;
  mp4Fallback?: string;
  mobileMp4?: string;
  poster?: string;

  // YouTube
  youtubeId?: string;
  youtubeUrl?: string;

  // Common
  loop?: boolean;
  forceAspect?: number;             // desktop ratio; default 2.39 (anamorphic)
  mobileZoom?: number;              // YT zoom khusus HP (cut letterbox). Default ~1.38

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
  revealDelayMs?: number;
  showLightSweep?: boolean;
  mobileCopyPosition?: MobileCopyPos;
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function extractYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input; // pure ID
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1) || null;
    const v = url.searchParams.get("v");
    if (v) return v;
    const m = url.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  } catch {}
  return null;
}

let youtubeApiPromise: Promise<any> | null = null;

function loadYouTubeAPI(): Promise<any> {
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return youtubeApiPromise;
}

export default function CinematicVideoHeroHLS({
  // HLS
  m3u8 = "/videos/hero/master.m3u8",
  mp4Fallback = "/videos/hero/fallback.mp4",
  mobileMp4 = "/videos/hero/mobile.mp4",
  poster = "/videos/hero/poster.webp",

  // YouTube
  youtubeId,
  youtubeUrl,

  // Common
  loop = true,
  forceAspect,                       // if undefined -> default anamorphic 2.39
  mobileZoom = 1.38,                 // ← zoom YT di HP biar 1:1 full tanpa bar

  className,
  shape = "rounded",
  maxWidthClass = "max-w-7xl",

  kicker = "FMG Universe • Custom Music",
  heading = "Let’s Create Music.",
  subheading = "Composition, recording, mixing, mastering, and distribution — plus anamorphic music videos.",
  align = "left",
  ctaPrimary = { label: "Start My Project", href: "/contact" },
  ctaSecondary = { label: "Free Consultation", href: "https://wa.me/6282298288188" },
  credit = "Viokichi — You Are Enough",

  revealDelayMs = 3000,
  showLightSweep = true,
  mobileCopyPosition = "below",
}: Props) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const isNearViewport = useInView(sectionRef, { margin: "200px 0px", once: true });
  const isVisible = useInView(sectionRef, { margin: "-10% 0px" });
  const reduceMotion = useReducedMotion();
  const visibleRef = useRef(false);

  useEffect(() => {
    visibleRef.current = isVisible;
  }, [isVisible]);

  // ----- mode detection
  const ytId = extractYouTubeId(youtubeId || youtubeUrl);
  const useYouTube = Boolean(ytId);

  // refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<import("hls.js").default | null>(null);

  const ytBoxRef = useRef<HTMLDivElement | null>(null); // wrapper (absolute, overflow-hidden)
  const ytPlayerRef = useRef<any | null>(null);

  // parallax & tilt
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-1%", "1%"]);
  const parallaxScale = useTransform(scrollYProgress, [0, 1], [1.006, 1.0]);
  const mvX = useMotionValue(0.5);
  const mvY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mvY, [0, 1], [3.5, -3.5]), { stiffness: 150, damping: 20, mass: 0.35 });
  const rotateY = useSpring(useTransform(mvX, [0, 1], [-4.5, 4.5]), { stiffness: 150, damping: 20, mass: 0.35 });

  // state
  const [muted, setMuted] = useState(true);
  const [aspect, setAspect] = useState<number | null>(forceAspect ?? 2.39); // desktop ratio -> anamorphic default
  const [showCopy, setShowCopy] = useState(true);
  const [hover, setHover] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // clip-path
  const clipMap: Record<Exclude<FrameShape, "rounded">, string> = {
    keystone: "polygon(8% 0%, 92% 0%, 100% 99%, 0% 99%)",
    octagon: "polygon(3% 0%, 97% 0%, 100% 12%, 100% 88%, 97% 99%, 3% 99%, 0% 88%, 0% 12%)",
    hex: "polygon(6% 0%, 94% 0%, 100% 50%, 94% 99%, 6% 99%, 0% 50%)",
    ticket: "polygon(0% 0%,100% 0%,100% 35%,95% 35%,95% 65%,100% 65%,100% 99%,0% 99%,0% 65%,5% 65%,5% 35%,0% 35%)",
  };
  const clipPath = shape === "rounded" ? undefined : clipMap[shape];
  const clipStyle = clipPath ? { clipPath } : undefined;
  const radiusClass = shape === "rounded" ? "rounded-[20px] md:rounded-[24px]" : "";

  // mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // ------- HLS init (only if NOT YouTube)
  useEffect(() => {
    if (!isNearViewport) return;
    if (useYouTube) {
      const t = setTimeout(() => setShowCopy(false), revealDelayMs);
      return () => clearTimeout(t);
    }

    const v = videoRef.current;
    if (!v) return;
    let cancelled = false;
    let localHls: import("hls.js").default | null = null;

    const onPause: EventListener = () => {
      if (document.visibilityState === "visible" && visibleRef.current) void v.play();
    };
    const onClick: EventListener = () => { void v.play(); };
    const onMeta = (): void => {
      if (forceAspect) return; // pakai forceAspect jika ada
      const vw = v.videoWidth || 0, vh = v.videoHeight || 0;
      if (vw > 0 && vh > 0) setAspect(vw / vh);
    };

    v.addEventListener("pause", onPause);
    v.addEventListener("click", onClick);
    v.addEventListener("loadedmetadata", onMeta);
    v.tabIndex = -1;

    (async () => {
      if (cancelled) return;
      const prefersMobileAsset = window.matchMedia("(max-width: 767px)").matches;
      const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

      if ((prefersMobileAsset || saveData) && mobileMp4) {
        v.src = mobileMp4;
      } else if (m3u8) {
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
      } else if (mp4Fallback) {
        v.src = mp4Fallback;
      }

      v.muted = true;
      void v.play().catch(() => {});
    })();

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
  }, [isNearViewport, useYouTube, m3u8, mp4Fallback, mobileMp4, forceAspect, revealDelayMs]);

  // ------- YouTube init (only if YouTube)
  useEffect(() => {
    if (!isNearViewport || !useYouTube || !ytId) return;
    let destroyed = false;
    let resizeHandler: (() => void) | null = null;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let copyTimer: ReturnType<typeof setTimeout> | null = null;

    const styleYouTubeIframe = () => {
      const iframe = ytBoxRef.current?.querySelector("iframe") as HTMLIFrameElement | null;
      if (!iframe) return;

      const sourceRatio = 16 / 9;
      const isPhone = window.matchMedia("(max-width: 767px)").matches;
      const containerRatio = isPhone ? 1 : (forceAspect ?? 2.39);
      const zoom = isPhone ? mobileZoom : 1;

      Object.assign(iframe.style, {
        position: "absolute",
        top: "50%",
        left: "50%",
        border: "0",
        transformOrigin: "center center",
      } as CSSStyleDeclaration);

      if (containerRatio > sourceRatio) {
        iframe.style.width = "100%";
        iframe.style.height = `${(containerRatio / sourceRatio) * 100}%`;
      } else {
        iframe.style.height = "100%";
        iframe.style.width = `${(sourceRatio / containerRatio) * 100}%`;
      }
      iframe.style.transform = `translate(-50%, -50%) scale(${zoom})`;
    };

    (async () => {
      const YT = await loadYouTubeAPI();
      if (destroyed || !ytBoxRef.current) return;

      ytPlayerRef.current = new YT.Player(ytBoxRef.current, {
        width: "100%",
        height: "100%",
        videoId: ytId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          mute: 1,                // autoplay mulus
          controls: 0,            // MATIKAN controls native
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          modestbranding: 1,
          loop: loop ? 1 : 0,
          playlist: loop ? ytId : undefined,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
          enablejsapi: 1,
          fs: 0,
          disablekb: 1,
        },
        events: {
          onReady: (e: any) => {
            try {
              e.target.mute();
              if (visibleRef.current) e.target.playVideo();
              else e.target.pauseVideo();
            } catch {}
            styleYouTubeIframe();
            settleTimer = setTimeout(styleYouTubeIframe, 150);
          },
        },
      });

      // sembunyikan copy setelah delay
      copyTimer = setTimeout(() => setShowCopy(false), revealDelayMs);

      resizeHandler = styleYouTubeIframe;
      window.addEventListener("resize", resizeHandler, { passive: true });
      window.addEventListener("orientationchange", resizeHandler, { passive: true });
    })();

    return () => {
      destroyed = true;
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
        window.removeEventListener("orientationchange", resizeHandler);
      }
      if (settleTimer) clearTimeout(settleTimer);
      if (copyTimer) clearTimeout(copyTimer);
      try {
        const p = ytPlayerRef.current;
        p?.destroy?.();
      } catch {}
      ytPlayerRef.current = null;
    };
  }, [isNearViewport, useYouTube, ytId, loop, revealDelayMs, forceAspect, mobileZoom]);

  useEffect(() => {
    if (!isNearViewport) return;
    const syncPlayback = () => {
      if (useYouTube) {
        const player = ytPlayerRef.current;
        try {
          if (isVisible && !document.hidden) player?.playVideo?.();
          else player?.pauseVideo?.();
        } catch {}
        return;
      }

      const video = videoRef.current;
      if (!video) return;
      if (isVisible && !document.hidden) void video.play().catch(() => {});
      else video.pause();
    };

    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => document.removeEventListener("visibilitychange", syncPlayback);
  }, [isNearViewport, isVisible, useYouTube]);

  // ----- mute toggle (HLS & YouTube)
  useEffect(() => {
    if (!useYouTube) {
      const v = videoRef.current;
      if (!v) return;
      v.muted = muted;
      if (!muted) { v.volume = 0.9; void v.play(); }
      return;
    }
    const p = ytPlayerRef.current;
    if (!p || !p.getPlayerState) return;
    try {
      if (muted) p.mute();
      else { p.unMute(); p.setVolume(90); p.playVideo?.(); }
    } catch {}
  }, [muted, useYouTube]);

  // mouse tilt
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduceMotion || isMobile || window.matchMedia("(hover: none)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    mvX.set((e.clientX - r.left) / r.width);
    mvY.set((e.clientY - r.top) / r.height);
  }; // mobile 1:1, desktop anamorphic

  const alignCls =
    align === "center" ? "items-center text-center"
      : align === "right" ? "items-end text-right"
      : "items-start text-left";

  const Sweep: React.FC = () => (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-md">
      <motion.span
        initial={{ x: "-120%" }}
        animate={{ x: "120%" }}
        transition={{ duration: 2.6, repeat: reduceMotion ? 0 : Infinity, ease: "easeInOut" }}
        className="absolute top-0 h-full w-[30%] bg-gradient-to-r from-transparent via-white/25 to-transparent dark:via-white/15"
        style={{ filter: "blur(6px)" }}
      />
    </span>
  );

  // mobile copy
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
      aria-label="FMG Universe Video"
    >
      {mobileCopyPosition === "above" ? MobileCopy : null}

      <div className={`mx-auto w-full ${maxWidthClass}`}>
        <motion.div
          style={reduceMotion ? undefined : { y, scale: parallaxScale, rotateX, rotateY }}
          onMouseMove={onMouseMove}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
          className="relative group"
        >
          <div className="relative">
            {/* masked frame */}
            <div
              className={`relative ${radiusClass} overflow-hidden bg-neutral-100/10 ring-1 ring-neutral-900/10 shadow-xl shadow-black/10 dark:bg-black/80 dark:ring-white/10 dark:shadow-black/40`}
              style={clipStyle}
            >
              <div
                className="relative w-full"
                style={{
                  aspectRatio: isMobile ? 1 : (forceAspect ?? aspect ?? 2.39), // HP 1:1, desktop anamorphic
                  minHeight: isMobile ? undefined : "320px",                    // no minHeight on mobile
                }}
              >
                {useYouTube ? (
                  <div
                    ref={ytBoxRef}
                    className="absolute inset-0 h-full w-full bg-black overflow-hidden"
                    style={!isNearViewport && ytId ? {
                      backgroundImage: `url(https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg)`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    } : undefined}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    className={`absolute inset-0 h-full w-full ${
                      isMobile ? "object-cover" : "object-contain"
                    } select-none bg-black`}
                    loop={loop}
                    autoPlay
                    playsInline
                    controls={false}
                    controlsList="nodownload noplaybackrate noremoteplayback"
                    disablePictureInPicture
                    poster={poster}
                    preload="metadata"
                    crossOrigin="anonymous"
                    onContextMenu={(e) => e.preventDefault()}
                    onError={() => {
                      if (mp4Fallback && videoRef.current) {
                        // console.warn("[video] native error, fallback MP4");
                        videoRef.current.src = mp4Fallback;
                        videoRef.current.load();
                        videoRef.current.muted = true;
                        void videoRef.current.play().catch(() => {});
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* credit */}
            {credit && (
              <div className="absolute left-3 bottom-3 z-10">
                <span className="rounded-full bg-neutral-900/70 px-2.5 py-1 text-[11px] leading-none text-white ring-1 ring-black/20 backdrop-blur-sm dark:bg-white/15 dark:text-white dark:ring-white/20">
                  {credit}
                </span>
              </div>
            )}

            {/* custom sound toggle */}
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Turn sound on" : "Turn sound off"}
              className="
                absolute right-3 bottom-3 z-10
                flex h-10 w-10 items-center justify-center
                rounded-full bg-white/85 text-neutral-900 ring-1 ring-black/10
                backdrop-blur-md shadow-lg
                transition-transform duration-200
                md:group-hover:-translate-y-8
                hover:bg-white
                dark:bg-zinc-900/80 dark:text-white dark:ring-white/15
              "
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            {/* desktop CTA overlay */}
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
                        {showLightSweep && isVisible && !reduceMotion ? <Sweep /> : null}
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

      {mobileCopyPosition === "below" ? MobileCopy : null}
    </section>
  );
}
