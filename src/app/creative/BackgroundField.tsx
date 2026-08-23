"use client";

import * as React from "react";
import { type RefObject, useEffect, useMemo, useRef } from "react";

type BackgroundFieldProps = {

  container?: RefObject<HTMLElement | null>;
  count?: number;
  intensity?: number;
};

type Item = {
  id: string;
  x: number; 
  y: number; 
  size: number; 
  depth: number; 
  kind: "circle" | "triangle" | "square" | "hex" | "note" | "play" | "wave";
  rot: number; 
  dur: number; 
  delay: number; 
  hue: number; 
  sat: number; 
  light: number; 
};

export function BackgroundField({
  container,
  count = 18,
  intensity = 0.6,
}: BackgroundFieldProps) {
  const items = useMemo<Item[]>(() => {
    const kinds: Item["kind"][] = [
      "circle",
      "triangle",
      "square",
      "hex",
      "note",
      "play",
      "wave",
    ];
    return Array.from({ length: count }).map((_, i) => {
      const k = kinds[Math.floor(Math.random() * kinds.length)];
      const size = Math.round(28 + Math.random() * 72); 
      return {
        id: `fx-${i}`,
        x: Math.random(),
        y: Math.random(),
        size,
        depth: 0.25 + Math.random() * 0.75, 
        kind: k,
        rot: Math.random() * 360,
        dur: 7 + Math.random() * 10, 
        delay: Math.random() * 6, 
        hue: Math.floor(Math.random() * 360),
        sat: 68 + Math.random() * 20, 
        light: 52 + Math.random() * 14, 
      };
    });
  }, [count]);

  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const mouse = useRef({ x: 0, y: 0 }); 
  const scrollTopRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {

    const onPointer = (e: PointerEvent) => {
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      mouse.current.x = e.clientX / vw - 0.5;
      mouse.current.y = e.clientY / vh - 0.5;
    };

    const onScroll = () => {
      const st = container?.current
        ? container.current.scrollTop
        : window.scrollY || (document.documentElement?.scrollTop ?? 0);
      scrollTopRef.current = st;
    };

    const scrollTarget = container?.current ?? window;
    window.addEventListener("pointermove", onPointer, { passive: true });
    scrollTarget.addEventListener("scroll", onScroll, { passive: true });

    onScroll(); 

    const tick = () => {
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const st = scrollTopRef.current;

      items.forEach((it) => {
        const node = nodeRefs.current[it.id];
        if (!node) return;

        const px = (mx * 60 + (st * 0.02)) * (it.depth * intensity);
        const py = (my * 60 + (st * 0.06)) * (it.depth * intensity);

        node.style.transform = `translate3d(calc(${it.x * 100}% - ${it.size / 2}px + ${px}px), calc(${it.y * 100}% - ${it.size / 2}px + ${py}px), 0) rotate(${it.rot}deg)`;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      scrollTarget.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [container, intensity, items]);

  return (
    <>
      <style>{`
        @keyframes bg-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes bg-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-0"
        style={{ opacity: 0.22 }}
      >
        <div className="absolute inset-0">
          {items.map((it) => (
            <div
              key={it.id}             
              ref={(el) => void (nodeRefs.current[it.id] = el)}
              className="absolute will-change-transform"
              style={{
                width: it.size,
                height: it.size,
                filter: "blur(0px)",
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  animation: `bg-float ${it.dur}s ease-in-out ${it.delay}s infinite`,
                }}
              >
                {renderShape(it)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function renderShape(it: Item) {
  const c1 = `hsl(${it.hue} ${it.sat}% ${it.light}%)`;
  const c2 = `hsl(${(it.hue + 40) % 360} ${Math.min(95, it.sat + 6)}% ${Math.max(
    40,
    it.light - 6
  )}%)`;

  const gid = `g-${it.id}`;

  switch (it.kind) {
    case "circle":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <radialGradient id={gid} cx="30%" cy="30%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill={`url(#${gid})`} />
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="88" height="88" rx="16" fill={`url(#${gid})`} />
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          <path d="M50 6 L94 88 H6 Z" fill={`url(#${gid})`} />
        </svg>
      );
    case "hex":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          <path
            d="M50 4 L90 27 L90 73 L50 96 L10 73 L10 27 Z"
            fill={`url(#${gid})`}
          />
        </svg>
      );
    case "note":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          <path
            d="M66 10 v45.5c0 7.5-6.4 13.5-14.2 13.5S37.6 63 37.6 55.5 44 42 51.8 42c3.7 0 7 1.2 9.6 3.1V22l-22 6.2V57.5c0 7.5-6.4 13.5-14.2 13.5S11 65 11 57.5 17.4 44 25.2 44c3.7 0 7 1.2 9.6 3.1V25l31.2-8.8z"
            fill={`url(#${gid})`}
            opacity={0.9}
          />
        </svg>
      );
    case "play":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="48" fill={`url(#${gid})`} opacity={0.35} />
          <path d="M40 30 L75 50 L40 70 Z" fill={`url(#${gid})`} />
        </svg>
      );
    case "wave":
    default:
      return (
        <svg viewBox="0 0 120 100" className="w-full h-full">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          <path
            d="
            M0,60 
            C10,20 20,20 30,60
            S50,100 60,60
            S80,20 90,60
            S110,100 120,60"
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth="10"
            strokeLinecap="round"
            opacity={0.9}
          />
        </svg>
      );
  }
}
