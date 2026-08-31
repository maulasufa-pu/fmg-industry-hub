import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PublicArticlePage from "@/components/articles/PublicArticlePage";
import { getPublishedArticle } from "@/lib/articles/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle("en-US", slug);
  if (!article) return { title: "Article not found", robots: { index: false, follow: false } };

  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt;
  return {
    title,
    description,
    keywords: article.keywords,
    alternates: { canonical: article.path },
    openGraph: {
      type: "article",
      title,
      description,
      url: article.path,
      locale: "en_US",
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      authors: [article.author_name],
      images: article.cover_image_url ? [{ url: article.cover_image_url, alt: article.cover_image_alt || article.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.cover_image_url ? [article.cover_image_url] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const article = await getPublishedArticle("en-US", slug);
  if (!article) notFound();
  return <PublicArticlePage article={article} />;
}
