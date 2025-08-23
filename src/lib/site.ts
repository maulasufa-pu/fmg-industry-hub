// Strict types, no `any`
export type Social = {
  twitter?: `@${string}`;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
  website?: string;
};

export type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  url: string;             // absolute, no trailing slash
  localeDefault: string;   // e.g. "id-ID"
  locales?: readonly string[];
  social: Social;
};

const APP_URL = (() => {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try { return new URL(raw).origin; } catch { return "http://localhost:3000"; }
})();

export const siteConfig: SiteConfig = {
  name: "FMG Universe",
  tagline: "Beyond Sound. Built-in Intelligence.",
  description:
    "FMG Universe adalah perusahaan & platform musik global: creation, distribution, publishing, media, R&D, live, academy — digerakkan inovasi teknologi.",
  url: APP_URL,
  localeDefault: "id-ID",
  locales: ["id-ID", "en-US"] as const,
  social: {
    twitter: "@fmg_universe",
    instagram: "https://instagram.com/fmg_universe",
    youtube: "https://youtube.com/@fmg_universe",
    website: APP_URL,
  },
};
