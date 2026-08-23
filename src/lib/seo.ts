import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

type SeoInput = {
  title?: string;
  description?: string;
  path?: `/${string}`;
  image?: string;
  noIndex?: boolean;
};

const abs = (p: string): string => (p.startsWith("http") ? p : `${siteConfig.url}${p}`);

export function seo(input: SeoInput = {}): Metadata {
  const t = input.title ?? `${siteConfig.name} — ${siteConfig.tagline}`;
  const d = input.description ?? siteConfig.description;
  const p = input.path ?? "/";
  const img = abs(input.image ?? "/og-default.jpg");

  return {
    title: { absolute: t },
    description: d,
    alternates: { canonical: p, languages: { "id-ID": p, "x-default": p } },
    openGraph: {
      type: "website",
      url: abs(p),
      siteName: siteConfig.name,
      title: t,
      description: d,
      images: [{ url: img, width: 1200, height: 630, alt: siteConfig.name }],
      locale: siteConfig.localeDefault,
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.social.twitter,
      creator: siteConfig.social.twitter,
      title: t,
      description: d,
      images: [img],
    },
    robots: input.noIndex || /^(\/admin|\/client|\/auth|\/profile|\/login|\/signup|\/forgot-password|\/payments)/.test(p) ? { index: false, follow: false } : undefined,
  };
}
