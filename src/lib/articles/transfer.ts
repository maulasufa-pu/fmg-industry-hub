import type { ArticleDraft, ArticleRow } from "@/lib/articles/types";

export const ARTICLE_TRANSFER_VERSION = 1;
export const ARTICLE_IMPORT_LIMIT = 200;

export type ArticleTransferDocument = {
  format: "fmg-article-batch";
  version: number;
  exported_at: string;
  articles: ArticleDraft[];
};

export type ArticleImportInspection = {
  kind: "single" | "batch" | "jsonl";
  articles: unknown[];
};

export function toArticleDraft(article: ArticleRow): ArticleDraft {
  return {
    slug: article.slug,
    locale: article.locale,
    title: article.title,
    excerpt: article.excerpt,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
    keywords: article.keywords,
    cover_image_url: article.cover_image_url,
    cover_image_alt: article.cover_image_alt,
    content: article.content,
    design: article.design,
    status: article.status,
    author_name: article.author_name,
    reading_minutes: article.reading_minutes,
    is_featured: article.is_featured,
    published_at: article.published_at,
  };
}

export function createArticleTransferDocument(articles: ArticleDraft[]): ArticleTransferDocument {
  return {
    format: "fmg-article-batch",
    version: ARTICLE_TRANSFER_VERSION,
    exported_at: new Date().toISOString(),
    articles,
  };
}

export function unwrapArticleImport(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && "articles" in value) {
    const articles = (value as { articles?: unknown }).articles;
    if (!Array.isArray(articles)) throw new Error("Field articles harus berupa array.");
    return articles;
  }
  if (value && typeof value === "object") return [value];
  throw new Error("Isi file bukan artikel atau batch artikel yang valid.");
}

export function inspectArticleImportText(text: string, filename = "article.json"): ArticleImportInspection {
  const trimmed = text.trim();
  if (!trimmed) throw new Error(`${filename} kosong.`);

  if (filename.toLowerCase().endsWith(".jsonl")) {
    const articles = trimmed.split(/\r?\n/).flatMap((line, index) => {
      try {
        return unwrapArticleImport(JSON.parse(line));
      } catch (error) {
        const message = error instanceof Error ? error.message : "JSON tidak valid";
        throw new Error(`${filename}, baris ${index + 1}: ${message}`);
      }
    });
    return { kind: "jsonl", articles };
  }

  try {
    const value: unknown = JSON.parse(trimmed);
    const articles = unwrapArticleImport(value);
    const isBatch = Array.isArray(value) || Boolean(value && typeof value === "object" && "articles" in value);
    return { kind: isBatch ? "batch" : "single", articles };
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON tidak valid";
    throw new Error(`${filename}: ${message}`);
  }
}

export function parseArticleImportText(text: string, filename = "article.json"): unknown[] {
  return inspectArticleImportText(text, filename).articles;
}
