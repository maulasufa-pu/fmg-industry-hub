import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://flemmomusic.com"
).replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  const isPreviewDomain = /vercel\.app$/i.test(new URL(SITE_URL).hostname);

  return {
    rules: isPreviewDomain
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/" },
    host: SITE_URL,
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
