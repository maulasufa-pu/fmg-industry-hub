"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Parallax } from "react-scroll-parallax";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.2 },
  }),
};

export default function ArtworkSlider({ artworks }: { artworks: string[] }) {
  const COUNT = artworks.length;
  const extended = React.useMemo(
    () => [artworks[COUNT - 1], ...artworks, artworks[0]],
    [artworks, COUNT]
  );
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
      timer = window.setTimeout(tick, 1000);
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
            role="region"
            tabIndex={0}
            aria-label="Artwork carousel"
          >
            <style>{`[data-hide-scrollbar]::-webkit-scrollbar{display:none}`}</style>
            {extended.map((src, i) => (
              <div key={i} className="snap-center shrink-0 w-[260px] h-[260px] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <Image src={src} alt={`Artwork ${i}`} width={260} height={260} sizes="260px" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </Parallax>
    </section>
  );
}
