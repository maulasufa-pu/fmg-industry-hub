import {
  articleInputSchema,
  estimateReadingMinutes,
  slugifyArticleTitle,
  validateArticleForPublishing,
} from "@/lib/articles/schema";
import { DEFAULT_ARTICLE_DESIGN } from "@/lib/articles/types";

describe("article CMS", () => {
  it("creates clean SEO slugs from Indonesian titles", () => {
    expect(slugifyArticleTitle("Cara Bikin Lagu: Dari Ide ke Rilis!"))
      .toBe("cara-bikin-lagu-dari-ide-ke-rilis");
  });

  it("estimates reading time from article blocks", () => {
    const words = Array.from({ length: 221 }, () => "musik").join(" ");
    expect(estimateReadingMinutes([{ type: "paragraph", text: words }])).toBe(2);
  });

  it("allows incomplete drafts but protects publishing quality", () => {
    const parsed = articleInputSchema.parse({
      slug: "artikel-baru",
      locale: "id-ID",
      title: "Artikel baru",
      excerpt: "",
      seo_title: "Artikel baru",
      seo_description: "",
      keywords: [],
      cover_image_url: null,
      cover_image_alt: null,
      content: [],
      design: DEFAULT_ARTICLE_DESIGN,
      status: "draft",
      author_name: "FMG Universe Editorial",
      reading_minutes: 1,
      is_featured: false,
      published_at: null,
    });
    expect(validateArticleForPublishing(parsed)).toEqual(expect.arrayContaining([
      expect.stringContaining("Ringkasan"),
      expect.stringContaining("Deskripsi SEO"),
      expect.stringContaining("dua blok"),
    ]));
  });

  it("accepts a publication-ready article", () => {
    const parsed = articleInputSchema.parse({
      slug: "cara-menyusun-aransemen-lagu",
      locale: "id-ID",
      title: "Cara Menyusun Aransemen Lagu",
      excerpt: "Panduan praktis menyusun struktur, dinamika, dan instrumen agar sebuah lagu terasa utuh dan memiliki karakter yang kuat.",
      seo_title: "Cara Menyusun Aransemen Lagu",
      seo_description: "Pelajari cara menyusun aransemen lagu dari struktur, dinamika, hingga pemilihan instrumen agar karya terdengar utuh, kuat, dan siap diproduksi.",
      keywords: ["aransemen lagu", "produksi musik"],
      cover_image_url: null,
      cover_image_alt: null,
      content: [
        { id: "h", type: "heading", level: 2, text: "Mulai dari struktur" },
        { id: "p", type: "paragraph", align: "left", text: "Tentukan perjalanan emosi lagu sebelum memilih instrumen." },
      ],
      design: DEFAULT_ARTICLE_DESIGN,
      status: "published",
      author_name: "FMG Universe Editorial",
      reading_minutes: 1,
      is_featured: false,
      published_at: new Date().toISOString(),
    });
    expect(validateArticleForPublishing(parsed)).toEqual([]);
  });
});
