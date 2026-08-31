import type { Metadata } from "next";

import ArticleIndexPage from "@/components/articles/ArticleIndexPage";
import { getPublishedArticles } from "@/lib/articles/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Artikel Musik, Aransemen & Produksi | FMG Universe",
  description: "Panduan praktis aransemen lagu, produksi musik, rekaman, mixing, dan proses pembuatan lagu dari FMG Universe.",
  alternates: { canonical: "https://flemmomusic.com/id/artikel", languages: { "id-ID": "https://flemmomusic.com/id/artikel", "en-US": "https://flemmomusic.com/articles", "x-default": "https://flemmomusic.com/articles" } },
};

export default async function IndonesianArticleIndex() {
  return <ArticleIndexPage locale="id-ID" articles={await getPublishedArticles("id-ID")} />;
}
