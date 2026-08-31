import {
  createArticleTransferDocument,
  parseArticleImportText,
  unwrapArticleImport,
} from "@/lib/articles/transfer";
import { DEFAULT_ARTICLE_DESIGN, type ArticleDraft } from "@/lib/articles/types";

const draft: ArticleDraft = {
  slug: "contoh-artikel",
  locale: "id-ID",
  title: "Contoh Artikel",
  excerpt: "Ringkasan",
  seo_title: "Contoh Artikel",
  seo_description: "Deskripsi",
  keywords: ["musik"],
  cover_image_url: null,
  cover_image_alt: null,
  content: [{ id: "p1", type: "paragraph", text: "Isi artikel", align: "left" }],
  design: DEFAULT_ARTICLE_DESIGN,
  status: "draft",
  author_name: "FMG Universe Editorial",
  reading_minutes: 1,
  is_featured: false,
  published_at: null,
};

describe("article transfer format", () => {
  it("creates and unwraps an FMG batch document", () => {
    const document = createArticleTransferDocument([draft, { ...draft, slug: "kedua" }]);
    expect(document.format).toBe("fmg-article-batch");
    expect(unwrapArticleImport(document)).toHaveLength(2);
  });

  it("accepts a single article JSON file", () => {
    expect(parseArticleImportText(JSON.stringify(draft), "single.json")).toEqual([draft]);
  });

  it("accepts arrays, batch files, and JSONL", () => {
    expect(parseArticleImportText(JSON.stringify([draft, draft]), "many.json")).toHaveLength(2);
    expect(parseArticleImportText(JSON.stringify({ articles: [draft] }), "batch.json")).toHaveLength(1);
    expect(parseArticleImportText(`${JSON.stringify(draft)}\n${JSON.stringify(draft)}`, "folder.jsonl")).toHaveLength(2);
  });

  it("reports the filename and JSONL line when parsing fails", () => {
    expect(() => parseArticleImportText(`${JSON.stringify(draft)}\n{bad`, "broken.jsonl")).toThrow("broken.jsonl, baris 2");
  });
});
