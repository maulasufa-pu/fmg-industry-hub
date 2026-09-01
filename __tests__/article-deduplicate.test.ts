import { findPublishedArticleDuplicates, type DuplicateArticleCandidate } from "@/lib/articles/deduplicate";

function article(overrides: Partial<DuplicateArticleCandidate>): DuplicateArticleCandidate {
  return {
    id: "one",
    slug: "jasa-aransemen-lagu",
    locale: "id-ID",
    path: "/id/artikel/jasa-aransemen-lagu",
    title: "Jasa Aransemen Lagu",
    excerpt: "Ringkasan",
    seo_title: "Jasa Aransemen Lagu",
    seo_description: "Deskripsi",
    cover_image_url: null,
    content: [{ id: "block-one", type: "paragraph", align: "left", text: "Isi artikel yang sama." }],
    status: "published",
    is_featured: false,
    published_at: "2026-08-01T00:00:00.000Z",
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("published article deduplication", () => {
  it("groups semantically identical published articles and keeps the canonical slug", () => {
    const groups = findPublishedArticleDuplicates([
      article({ id: "copy", slug: "jasa-aransemen-lagu-2", content: [{ id: "different-id", type: "paragraph", align: "left", text: "  ISI artikel yang sama. " }] }),
      article({ id: "canonical" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].keep.id).toBe("canonical");
    expect(groups[0].duplicates.map((item) => item.id)).toEqual(["copy"]);
  });

  it("does not group a different language, different content, or draft", () => {
    const groups = findPublishedArticleDuplicates([
      article({ id: "base" }),
      article({ id: "english", locale: "en-US" }),
      article({ id: "different", content: [{ id: "x", type: "paragraph", align: "left", text: "Isi berbeda." }] }),
      article({ id: "draft", status: "draft" }),
    ]);

    expect(groups).toHaveLength(0);
  });
});
