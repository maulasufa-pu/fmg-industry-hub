import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { ArticleLocale, ArticleRow } from "./types";

function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
      },
    },
  );
}

export async function getPublishedArticle(
  locale: ArticleLocale,
  slug: string,
): Promise<ArticleRow | null> {
  const { data, error } = await publicClient()
    .from("articles")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[articles] Unable to load published article", error.message);
    return null;
  }
  return (data as ArticleRow | null) ?? null;
}

export async function getPublishedArticles(
  locale: ArticleLocale,
): Promise<ArticleRow[]> {
  const { data, error } = await publicClient()
    .from("articles")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[articles] Unable to load article index", error.message);
    return [];
  }
  return (data as ArticleRow[] | null) ?? [];
}
