import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 300;

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://flemmomusic.com"
).replace(/\/+$/, "");

type ChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

type SitemapPage = {
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
  alternatePath?: string;
  locale?: "en-US" | "id-ID";
  lastModified?: string | Date;
};

type PublishedSeoPage = {
  path: string;
  locale: "en-US" | "id-ID" | null;
  alternate_path: string | null;
  change_frequency: ChangeFrequency;
  priority: number;
  updated_at: string;
};

type PublishedArticle = {
  path: string;
  locale: "en-US" | "id-ID";
  updated_at: string;
};

const staticPages: SitemapPage[] = [
  { path: "/", changeFrequency: "weekly", priority: 1, alternatePath: "/id", locale: "en-US" },
  { path: "/id", changeFrequency: "weekly", priority: 1, alternatePath: "/", locale: "id-ID" },
  { path: "/arrangement", changeFrequency: "weekly", priority: 0.95, alternatePath: "/id/jasa-aransemen-lagu", locale: "en-US" },
  { path: "/id/jasa-aransemen-lagu", changeFrequency: "weekly", priority: 0.95, alternatePath: "/arrangement", locale: "id-ID" },
  { path: "/song-creation-service", changeFrequency: "weekly", priority: 0.9, alternatePath: "/id/jasa-pembuatan-lagu", locale: "en-US" },
  { path: "/id/jasa-pembuatan-lagu", changeFrequency: "weekly", priority: 0.9, alternatePath: "/song-creation-service", locale: "id-ID" },
  { path: "/learn/how-to-make-a-song", changeFrequency: "weekly", priority: 0.8, alternatePath: "/id/cara-bikin-lagu", locale: "en-US" },
  { path: "/id/cara-bikin-lagu", changeFrequency: "weekly", priority: 0.8, alternatePath: "/learn/how-to-make-a-song", locale: "id-ID" },
  { path: "/articles", changeFrequency: "weekly", priority: 0.8, alternatePath: "/id/artikel", locale: "en-US" },
  { path: "/id/artikel", changeFrequency: "weekly", priority: 0.8, alternatePath: "/articles", locale: "id-ID" },
  { path: "/id/biaya-pembuatan-lagu", changeFrequency: "weekly", priority: 0.8 },
  { path: "/id/cara-memilih-jasa-aransemen-lagu", changeFrequency: "weekly", priority: 0.8 },
  { path: "/id/jasa-editing-vokal", changeFrequency: "weekly", priority: 0.8 },
  { path: "/id/jasa-mixing-mastering-lagu", changeFrequency: "weekly", priority: 0.8 },
  { path: "/id/jasa-pembuatan-jingle", changeFrequency: "weekly", priority: 0.8 },
  { path: "/id/jasa-pembuatan-soundtrack", changeFrequency: "weekly", priority: 0.8 },
  { path: "/id/jasa-produksi-musik", changeFrequency: "weekly", priority: 0.8 },
  { path: "/id/perbedaan-komposer-arranger-produser-musik", changeFrequency: "weekly", priority: 0.75 },
  { path: "/id/perbedaan-mixing-dan-mastering", changeFrequency: "weekly", priority: 0.75 },
  { path: "/id/persiapan-rekaman-vokal", changeFrequency: "weekly", priority: 0.75 },
  { path: "/services", changeFrequency: "weekly", priority: 0.75, alternatePath: "/id/layanan", locale: "en-US" },
  { path: "/id/layanan", changeFrequency: "weekly", priority: 0.75, alternatePath: "/services", locale: "id-ID" },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.75, alternatePath: "/id/harga", locale: "en-US" },
  { path: "/id/harga", changeFrequency: "weekly", priority: 0.75, alternatePath: "/pricing", locale: "id-ID" },
  { path: "/portfolio", changeFrequency: "weekly", priority: 0.75, alternatePath: "/id/portofolio", locale: "en-US" },
  { path: "/id/portofolio", changeFrequency: "weekly", priority: 0.75, alternatePath: "/portfolio", locale: "id-ID" },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5, alternatePath: "/id/kontak", locale: "en-US" },
  { path: "/id/kontak", changeFrequency: "monthly", priority: 0.5, alternatePath: "/contact", locale: "id-ID" },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/academy", changeFrequency: "monthly", priority: 0.5 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.5 },
  { path: "/catalog", changeFrequency: "monthly", priority: 0.5 },
  { path: "/company", changeFrequency: "monthly", priority: 0.5 },
  { path: "/creative", changeFrequency: "monthly", priority: 0.5 },
  { path: "/event", changeFrequency: "monthly", priority: 0.5 },
  { path: "/help", changeFrequency: "monthly", priority: 0.5 },
  { path: "/labs", changeFrequency: "monthly", priority: 0.5 },
  { path: "/locations", changeFrequency: "monthly", priority: 0.5 },
  { path: "/media", changeFrequency: "monthly", priority: 0.5 },
  { path: "/partners", changeFrequency: "monthly", priority: 0.5 },
  { path: "/press", changeFrequency: "monthly", priority: 0.5 },
  { path: "/publishing", changeFrequency: "monthly", priority: 0.5 },
  { path: "/talent", changeFrequency: "monthly", priority: 0.5 },
  { path: "/tuneXpert", changeFrequency: "weekly", priority: 0.8 },
  { path: "/legal", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/cookies", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/dmca", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
];

function absoluteUrl(path: string) {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

function toSitemapEntry(page: SitemapPage): MetadataRoute.Sitemap[number] {
  const ownLocale = page.locale;
  const alternateLocale = ownLocale === "id-ID" ? "en-US" : "id-ID";
  const englishPath = ownLocale === "id-ID" ? page.alternatePath : page.path;

  return {
    url: absoluteUrl(page.path),
    ...(page.lastModified ? { lastModified: page.lastModified } : {}),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    ...(page.alternatePath && ownLocale
      ? {
          alternates: {
            languages: {
              [ownLocale]: absoluteUrl(page.path),
              [alternateLocale]: absoluteUrl(page.alternatePath),
              "x-default": absoluteUrl(englishPath ?? page.path),
            },
          },
        }
      : {}),
  };
}

async function getPublishedSeoPages(): Promise<SitemapPage[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("seo_pages")
      .select(
        "path, locale, alternate_path, change_frequency, priority, updated_at",
      )
      .eq("is_published", true);

    if (error) {
      console.error("[sitemap] Failed to load published SEO pages:", error.message);
      return [];
    }

    return ((data ?? []) as PublishedSeoPage[]).map((page) => ({
      path: page.path,
      locale: page.locale ?? undefined,
      alternatePath: page.alternate_path ?? undefined,
      changeFrequency: page.change_frequency,
      priority: Number(page.priority),
      lastModified: page.updated_at,
    }));
  } catch (error) {
    console.error("[sitemap] Supabase request failed:", error);
    return [];
  }
}

async function getPublishedArticles(): Promise<SitemapPage[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("articles")
      .select("path, locale, updated_at")
      .eq("status", "published");

    if (error) {
      console.error("[sitemap] Failed to load published articles:", error.message);
      return [];
    }

    return ((data ?? []) as PublishedArticle[]).map((article) => ({
      path: article.path,
      locale: article.locale,
      changeFrequency: "weekly",
      priority: 0.8,
      lastModified: article.updated_at,
    }));
  } catch (error) {
    console.error("[sitemap] Article request failed:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [publishedSeoPages, publishedArticles] = await Promise.all([
    getPublishedSeoPages(),
    getPublishedArticles(),
  ]);
  const uniquePages = new Map<string, SitemapPage>();

  for (const page of [...staticPages, ...publishedSeoPages, ...publishedArticles]) {
    uniquePages.set(page.path, page);
  }

  return [...uniquePages.values()]
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(toSitemapEntry);
}
