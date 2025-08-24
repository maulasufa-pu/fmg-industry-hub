// components/brand/BrandMark.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

/* ---------- BrandLockup (internal, tetap diexport jika perlu) ---------- */
export type BrandLockupProps = {
  title: string;
  subtitle: string;
  className?: string;
  subtitleBasePx?: number; // default 14
  subtitleMinPx?: number;  // default 10
  subtitleMaxPx?: number;  // default 48
};

export function BrandLockup({
  title,
  subtitle,
  className = "",
  subtitleBasePx = 14,
  subtitleMinPx = 10,
  subtitleMaxPx = 48,
}: BrandLockupProps): React.JSX.Element {
  const titleRef = React.useRef<HTMLDivElement | null>(null);
  const measureRef = React.useRef<HTMLDivElement | null>(null);
  const [subSize, setSubSize] = React.useState<number | null>(null);

  const recalc = React.useCallback(() => {
    const t = titleRef.current;
    const m = measureRef.current;
    if (!t || !m) return;
    const target = t.getBoundingClientRect().width;
    m.style.fontSize = `${subtitleBasePx}px`;
    const natural = m.getBoundingClientRect().width;
    if (target > 0 && natural > 0) {
      const next = Math.min(subtitleMaxPx, Math.max(subtitleMinPx, (target / natural) * subtitleBasePx));
      setSubSize(next);
    }
  }, [subtitleBasePx, subtitleMinPx, subtitleMaxPx]);

  React.useLayoutEffect(() => {
    recalc();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => recalc()) : null;
    if (ro && titleRef.current) ro.observe(titleRef.current);
    // font ready
    (document as any).fonts?.ready?.then?.(() => recalc());
    const onResize = () => recalc();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, [recalc]);

  type VarStyle = React.CSSProperties & { ["--sub-fs"]?: string };
  const subStyle: VarStyle = {
    ["--sub-fs"]: subSize ? `${subSize}px` : undefined,
    opacity: subSize ? 1 : 0,
  };

  return (
    <div className={`relative grid content-center ${className}`}>
      {/* Title */}
      <div
        ref={titleRef}
        className="font-heading-1 font-black leading-[1.05] text-gray-800 dark:text-gray-100 whitespace-nowrap"
        style={{ fontWeight: 700 }}
      >
        {title}
      </div>

      {/* Hidden measure */}
      <div
        ref={measureRef}
        className="absolute -z-10 invisible pointer-events-none select-none whitespace-nowrap font-body-XS"
      >
        {subtitle}
      </div>

      {/* Subtitle */}
      <div
        className="mt-[-2px] font-body-XS leading-[1] text-neutral-600 dark:text-neutral-300 whitespace-nowrap brand-subtitle"
        style={subStyle}
      >
        {subtitle}
      </div>

      <style jsx>{`
        .brand-subtitle {
          font-size: var(--sub-fs, 12px) !important;
        }
      `}</style>
    </div>
  );
}

/* ---------- BrandMark (logo + lockup) ---------- */
export type BrandMarkProps = {
  href?: string | null;                // kalau diisi -> dibungkus Link
  className?: string;                  // kelas wrapper luar
  gapClassName?: string;               // gap antar logo & text (default gap-1.5)
  title?: string;
  subtitle?: string;

  // Logo
  logoSrc?: string;
  logoAlt?: string;
  logoSize?: number;                   // px (dipakai untuk width/height Image)
  logoClassName?: string;
  priority?: boolean;

  // Lockup sizing
  subtitleBasePx?: number;
  subtitleMinPx?: number;
  subtitleMaxPx?: number;
};

export default function BrandMark({
  href = null,
  className = "",
  gapClassName = "gap-1.5",
  title = "FLEMMO MUSIC",
  subtitle = "Global Universe Solution",
  logoSrc = "/logo/FMG-Universe-Flemmo-Music-Global.png",
  logoAlt = "FMG Universe Logo",
  logoSize = 40, // 40px ≈ h-10 w-10
  logoClassName = "rounded-md object-cover",
  priority = true,
  subtitleBasePx = 10,
  subtitleMinPx = 1,
  subtitleMaxPx = 11,
}: BrandMarkProps): React.JSX.Element {
  const content = (
    <div className={`flex items-center ${gapClassName} ${className}`}>
      <Image
        src={logoSrc}
        alt={logoAlt}
        width={logoSize}
        height={logoSize}
        className={`block h-[${logoSize}px] w-[${logoSize}px] ${logoClassName}`}
        priority={priority}
      />
      <BrandLockup
        title={title}
        subtitle={subtitle}
        subtitleBasePx={subtitleBasePx}
        subtitleMinPx={subtitleMinPx}
        subtitleMaxPx={subtitleMaxPx}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {content}
      </Link>
    );
  }
  return content;
}
