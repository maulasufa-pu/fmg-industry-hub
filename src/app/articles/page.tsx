import type { Metadata } from "next";

import ArticleIndexPage from "@/components/articles/ArticleIndexPage";
import { getPublishedArticles } from "@/lib/articles/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Music Arrangement & Production Articles | FMG Universe",
  description: "Practical articles on song arrangement, music production, recording, mixing, and bringing song ideas to life.",
  alternates: { canonical: "https://flemmomusic.com/articles", languages: { "en-US": "https://flemmomusic.com/articles", "id-ID": "https://flemmomusic.com/id/artikel", "x-default": "https://flemmomusic.com/articles" } },
};

export default async function EnglishArticleIndex() {
  return <ArticleIndexPage locale="en-US" articles={await getPublishedArticles("en-US")} />;
}
