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
  localeDefault: string;   // e.g. "en-US"
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
    "FMG Universe is a global music company & platform—uniting creation, distribution, publishing, media, R&D, live, and education. We help artists, labels, and brands produce faster, grow royalties, and scale catalogs with technology.",
  url: APP_URL,
  localeDefault: "en-US",
  locales: ["en-US", "id-ID"] as const, // English default, Indonesian secondary
  social: {
    twitter: "@fmg_universe",
    instagram: "https://instagram.com/fmg_universe",
    youtube: "https://youtube.com/@fmg_universe",
    website: APP_URL,
  },
};
