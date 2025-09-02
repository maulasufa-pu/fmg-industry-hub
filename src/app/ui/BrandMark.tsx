// components/brand/BrandMark.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

/* ---------- BrandLockup (internal) ---------- */
export type BrandLockupProps = {
  title: string;
  subtitle: string;
  className?: string;
  subtitleBasePx?: number;
  subtitleMinPx?: number;
  subtitleMaxPx?: number;
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
    if (!titleRef.current || !measureRef.current) return;
    const target = titleRef.current.getBoundingClientRect().width;
    measureRef.current.style.fontSize = `${subtitleBasePx}px`;
    const natural = measureRef.current.getBoundingClientRect().width;
    if (target > 0 && natural > 0) {
      const next = Math.min(
        subtitleMaxPx,
        Math.max(subtitleMinPx, (target / natural) * subtitleBasePx)
      );
      setSubSize(next);
    }
  }, [subtitleBasePx, subtitleMinPx, subtitleMaxPx]);

  React.useLayoutEffect(() => {
    recalc();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => recalc()) : null;
    if (ro && titleRef.current) ro.observe(titleRef.current);
    (document as any).fonts?.ready?.then?.(() => recalc());
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("resize", recalc);
      ro?.disconnect();
    };
  }, [recalc]);

  return (
    <div className={`relative grid content-center justify-items-center ${className}`}>
      <div
        ref={titleRef}
        className="font-heading-1 font-black leading-[1.05] text-gray-800 dark:text-gray-100 max-w-full break-words text-center"
      >
        {title}
      </div>
      <div
        ref={measureRef}
        className="absolute -z-10 invisible pointer-events-none select-none whitespace-nowrap font-body-XS"
      >
        {subtitle}
      </div>
      <div
        className="mt-[-2px] font-body-XS leading-[1.2] text-neutral-600 dark:text-neutral-300 max-w-full break-words text-center brand-subtitle w-full"
        style={{ ["--sub-fs" as any]: subSize ? `${subSize}px` : undefined, opacity: subSize ? 1 : 0 }}
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
  href?: string | null;
  className?: string;
  gapClassName?: string;
  title?: string;
  subtitle?: string;
  logoSrc?: string;
  logoAlt?: string;
  logoSize?: number;
  logoClassName?: string;
  priority?: boolean;
  subtitleBasePx?: number;
  subtitleMinPx?: number;
  subtitleMaxPx?: number;
};

export default function BrandMark({
  href = null,
  className = "",
  gapClassName = "gap-2",
  title = "FLEMMO MUSIC",
  subtitle = "Global Universe Solution",
  logoSrc,
  logoAlt = "FMG Universe Logo",
  logoSize = 40,
  logoClassName = "rounded-md object-cover",
  priority = true,
  subtitleBasePx = 10,
  subtitleMinPx = 1,
  subtitleMaxPx = 11,
}: BrandMarkProps): React.JSX.Element {
  const content = (
    <div className={`flex items-center ${gapClassName} ${className}`}>
      {logoSrc && logoSrc.trim() !== "" && (
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={logoSize}
          height={logoSize}
          className={`block h-[${logoSize}px] w-[${logoSize}px] ${logoClassName} flex-shrink-0`}
          priority={priority}
        />
      )}
      <div className="flex flex-col justify-center break-words">
        <BrandLockup
          title={title}
          subtitle={subtitle}
          subtitleBasePx={subtitleBasePx}
          subtitleMinPx={subtitleMinPx}
          subtitleMaxPx={subtitleMaxPx}
        />
      </div>
    </div>
  );

  return href ? <Link href={href} className="inline-flex">{content}</Link> : content;
}
