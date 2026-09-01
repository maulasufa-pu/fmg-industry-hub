import type { ArticleBlock, ArticleLocale, ArticleStatus } from "@/lib/articles/types";

export type DuplicateArticleCandidate = {
  id: string;
  slug: string;
  locale: ArticleLocale;
  path: string;
  title: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  cover_image_url: string | null;
  content: ArticleBlock[];
  status: ArticleStatus;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DuplicateArticleSummary = Omit<DuplicateArticleCandidate, "content" | "seo_title" | "seo_description" | "cover_image_url">;

export type DuplicateArticleGroup = {
  id: string;
  locale: ArticleLocale;
  normalizedTitle: string;
  keep: DuplicateArticleSummary;
  duplicates: DuplicateArticleSummary[];
};

function normalizeText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("und");
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "id")
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, normalizeValue(nested)]),
    );
  }
  return typeof value === "string" ? normalizeText(value) : value;
}

function metadataScore(article: DuplicateArticleCandidate): number {
  return [article.excerpt, article.seo_title, article.seo_description, article.cover_image_url]
    .filter((value) => Boolean(value?.trim())).length;
}

function hasCopySuffix(slug: string): boolean {
  return /-(?:copy-)?\d+$/i.test(slug);
}

function compareKeepPriority(left: DuplicateArticleCandidate, right: DuplicateArticleCandidate): number {
  const slugDifference = Number(hasCopySuffix(left.slug)) - Number(hasCopySuffix(right.slug));
  if (slugDifference !== 0) return slugDifference;
  const featuredDifference = Number(right.is_featured) - Number(left.is_featured);
  if (featuredDifference !== 0) return featuredDifference;
  const metadataDifference = metadataScore(right) - metadataScore(left);
  if (metadataDifference !== 0) return metadataDifference;
  const leftDate = Date.parse(left.published_at ?? left.created_at);
  const rightDate = Date.parse(right.published_at ?? right.created_at);
  if (leftDate !== rightDate) return leftDate - rightDate;
  return left.id.localeCompare(right.id);
}

function toSummary(article: DuplicateArticleCandidate): DuplicateArticleSummary {
  const { content: _content, seo_title: _seoTitle, seo_description: _seoDescription, cover_image_url: _coverImage, ...summary } = article;
  return summary;
}

export function findPublishedArticleDuplicates(articles: DuplicateArticleCandidate[]): DuplicateArticleGroup[] {
  const candidates = articles.filter((article) => article.status === "published");
  const buckets = new Map<string, DuplicateArticleCandidate[]>();

  for (const article of candidates) {
    const normalizedTitle = normalizeText(article.title).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const normalizedContent = JSON.stringify(normalizeValue(article.content));
    const key = `${article.locale}\u0000${normalizedTitle}\u0000${normalizedContent}`;
    const current = buckets.get(key) ?? [];
    current.push(article);
    buckets.set(key, current);
  }

  return [...buckets.values()]
    .filter((group) => group.length > 1)
    .map((group) => {
      const ordered = [...group].sort(compareKeepPriority);
      const keep = ordered[0];
      return {
        id: keep.id,
        locale: keep.locale,
        normalizedTitle: normalizeText(keep.title),
        keep: toSummary(keep),
        duplicates: ordered.slice(1).map(toSummary),
      };
    })
    .sort((left, right) => left.keep.title.localeCompare(right.keep.title));
}
