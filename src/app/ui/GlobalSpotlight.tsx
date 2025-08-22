// src/components/GlobalSpotlight.tsx
"use client";

import { useEffect, useRef } from "react";

export default function GlobalSpotlight() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const setPos = (x: number, y: number) => {
      el.style.setProperty("--spot-x", `${x}px`);
      el.style.setProperty("--spot-y", `${y}px`);
    };

    // posisi awal: tengah layar
    const onResize = () => setPos(window.innerWidth / 2, window.innerHeight / 2);

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setPos(x, y));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    onResize();

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      // di atas konten tapi tidak mengganggu klik
      className="pointer-events-none fixed inset-0 z-[60] mix-blend-screen"
      style={{
        // Glow utama (violet)
        background:
          "radial-gradient(650px 650px at var(--spot-x) var(--spot-y), rgba(99,102,241,0.35), transparent 55%)",
        // Tambah dimensi (fuchsia) — opsional, hapus jika terlalu ramai
        // background:
        //   `radial-gradient(650px 650px at var(--spot-x) var(--spot-y), rgba(99,102,241,0.30), transparent 55%),
        //    radial-gradient(900px 900px at calc(var(--spot-x) + 80px) calc(var(--spot-y) + 60px), rgba(236,72,153,0.18), transparent 60%)`,
        filter: "blur(0px)", // biar soft setelah mix-blend
      }}
    />
  );
}
