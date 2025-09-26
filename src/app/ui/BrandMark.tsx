"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

/* ---------- BrandLockup (internal) ---------- */
export type BrandLockupProps = {
  title: string;
  subtitle: string;
  className?: string;
};

export function BrandLockup({
  title,
  subtitle,
  className = "",
}: BrandLockupProps): React.JSX.Element {
  // Simplified static version to prevent hydration issues
  return (
    <div className={`flex flex-col justify-center break-words ${className}`}>
      <div className="font-heading-1 font-black leading-[1.05] text-gray-800 dark:text-gray-100 max-w-full break-words text-center">
        {title}
      </div>
      <div className="mt-[-2px] font-body-XS leading-[1.2] text-neutral-600 dark:text-neutral-300 max-w-full break-words text-center text-xs">
        {subtitle}
      </div>
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
  gapClassName = "gap-2", // konsisten default  
  title = "FLEMMO MUSIC",
  subtitle = "Global Universe Solution",
  logoSrc,
  logoAlt = "FMG Universe Logo",
  logoSize = 40,
  logoClassName = "rounded-md object-cover flex-shrink-0", // tambahkan shrink-0 konsisten
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
          className={`block h-[${logoSize}px] w-[${logoSize}px] ${logoClassName}`}
          priority={priority}
        />
      )}
      <BrandLockup
        title={title}
        subtitle={subtitle}
      />
    </div>
  );

  return href ? (
    <Link href={href} className="inline-flex">
      {content}
    </Link>
  ) : (
    content
  );
}
