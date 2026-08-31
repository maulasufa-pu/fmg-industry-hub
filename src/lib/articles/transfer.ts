import { DEFAULT_ARTICLE_DESIGN, type ArticleDraft, type ArticleRow } from "@/lib/articles/types";

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

const ACCENT_ALIASES: Record<string, ArticleDraft["design"]["accent"]> = {
  purple: "violet",
  indigo: "violet",
  slate: "violet",
  stone: "violet",
  zinc: "violet",
  cyan: "blue",
  sky: "blue",
  teal: "emerald",
  green: "emerald",
  lime: "emerald",
  red: "rose",
  pink: "rose",
  orange: "amber",
  yellow: "amber",
  gold: "amber",
};

const ACCENT_RGB: Record<ArticleDraft["design"]["accent"], readonly [number, number, number]> = {
  violet: [124, 58, 237],
  blue: [37, 99, 235],
  emerald: [5, 150, 105],
  rose: [225, 29, 72],
  amber: [217, 119, 6],
};

function nearestAccentFromHex(value: string): ArticleDraft["design"]["accent"] | null {
  const compact = /^#([0-9a-f]{3})$/i.exec(value)?.[1];
  const expanded = compact ? compact.split("").map((digit) => digit + digit).join("") : /^#([0-9a-f]{6})$/i.exec(value)?.[1];
  if (!expanded) return null;
  const rgb: [number, number, number] = [0, 2, 4].map((index) => Number.parseInt(expanded.slice(index, index + 2), 16)) as [number, number, number];
  return (Object.entries(ACCENT_RGB) as Array<[ArticleDraft["design"]["accent"], readonly [number, number, number]]>).reduce((closest, [accent, target]) => {
    const distance = rgb.reduce((sum, channel, index) => sum + (channel - target[index]) ** 2, 0);
    return distance < closest.distance ? { accent, distance } : closest;
  }, { accent: DEFAULT_ARTICLE_DESIGN.accent, distance: Number.POSITIVE_INFINITY }).accent;
}

export function normalizeArticleImportCandidate(candidate: unknown): unknown {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return candidate;
  const article = candidate as Record<string, unknown>;
  const sourceDesign = article.design && typeof article.design === "object" && !Array.isArray(article.design)
    ? article.design as Record<string, unknown>
    : {};
  const rawAccent = typeof sourceDesign.accent === "string" ? sourceDesign.accent.toLowerCase().trim() : "";
  const allowedAccents: ArticleDraft["design"]["accent"][] = ["violet", "blue", "emerald", "rose", "amber"];
  const accent = allowedAccents.includes(rawAccent as ArticleDraft["design"]["accent"])
    ? rawAccent as ArticleDraft["design"]["accent"]
    : ACCENT_ALIASES[rawAccent] ?? nearestAccentFromHex(rawAccent) ?? DEFAULT_ARTICLE_DESIGN.accent;
  const themes: ArticleDraft["design"]["theme"][] = ["editorial", "minimal", "bold"];
  const heroStyles: ArticleDraft["design"]["heroStyle"][] = ["gradient", "image", "clean"];
  const bodyWidths: ArticleDraft["design"]["bodyWidth"][] = ["compact", "comfortable", "wide"];

  return {
    ...article,
    design: {
      theme: themes.includes(sourceDesign.theme as ArticleDraft["design"]["theme"])
        ? sourceDesign.theme
        : DEFAULT_ARTICLE_DESIGN.theme,
      accent,
      heroStyle: heroStyles.includes(sourceDesign.heroStyle as ArticleDraft["design"]["heroStyle"])
        ? sourceDesign.heroStyle
        : DEFAULT_ARTICLE_DESIGN.heroStyle,
      bodyWidth: bodyWidths.includes(sourceDesign.bodyWidth as ArticleDraft["design"]["bodyWidth"])
        ? sourceDesign.bodyWidth
        : DEFAULT_ARTICLE_DESIGN.bodyWidth,
      showToc: typeof sourceDesign.showToc === "boolean" ? sourceDesign.showToc : DEFAULT_ARTICLE_DESIGN.showToc,
    },
  };
}
