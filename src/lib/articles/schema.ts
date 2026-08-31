import { z } from "zod";

const blockId = z.string().min(1).max(100);
const link = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value),
    "Link must be an internal path or an http(s) URL",
  );

const articleBlockSchema = z.discriminatedUnion("type", [
  z.object({ id: blockId, type: z.literal("paragraph"), text: z.string().max(12000), align: z.enum(["left", "center"]) }),
  z.object({ id: blockId, type: z.literal("heading"), text: z.string().max(300), level: z.union([z.literal(2), z.literal(3)]) }),
  z.object({ id: blockId, type: z.literal("image"), url: link, alt: z.string().max(300), caption: z.string().max(500), width: z.enum(["content", "wide", "full"]) }),
  z.object({ id: blockId, type: z.literal("quote"), text: z.string().max(3000), attribution: z.string().max(200) }),
  z.object({ id: blockId, type: z.literal("list"), style: z.enum(["bullet", "number"]), items: z.array(z.string().max(1000)).min(1).max(50) }),
  z.object({ id: blockId, type: z.literal("callout"), tone: z.enum(["info", "tip", "warning"]), title: z.string().max(200), text: z.string().max(3000) }),
  z.object({ id: blockId, type: z.literal("cta"), heading: z.string().max(200), text: z.string().max(1000), label: z.string().min(1).max(100), href: link, style: z.enum(["primary", "secondary"]) }),
  z.object({ id: blockId, type: z.literal("divider") }),
]);

export const articleInputSchema = z.object({
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  locale: z.enum(["id-ID", "en-US"]),
  title: z.string().trim().min(1).max(180),
  excerpt: z.string().trim().max(500),
  seo_title: z.string().trim().max(180),
  seo_description: z.string().trim().max(500),
  keywords: z.array(z.string().trim().min(1).max(80)).max(30),
  cover_image_url: link.nullable(),
  cover_image_alt: z.string().trim().max(300).nullable(),
  content: z.array(articleBlockSchema).max(200),
  design: z.object({
    theme: z.enum(["editorial", "minimal", "bold"]),
    accent: z.enum(["violet", "blue", "emerald", "rose", "amber"]),
    heroStyle: z.enum(["gradient", "image", "clean"]),
    bodyWidth: z.enum(["compact", "comfortable", "wide"]),
    showToc: z.boolean(),
  }),
  status: z.enum(["draft", "published", "archived"]),
  author_name: z.string().trim().min(1).max(120),
  reading_minutes: z.number().int().min(1).max(120),
  is_featured: z.boolean(),
  published_at: z.string().datetime({ offset: true }).nullable(),
});

export const createArticleSchema = articleInputSchema.pick({ locale: true }).extend({
  title: z.string().trim().min(1).max(180).default("Untitled article"),
});

export function slugifyArticleTitle(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150)
    .replace(/-+$/g, "");
  return slug || `article-${Date.now()}`;
}

export function estimateReadingMinutes(blocks: Array<{ type: string; text?: string; items?: string[]; heading?: string }>): number {
  const words = blocks
    .flatMap((block) => [block.text ?? "", block.heading ?? "", ...(block.items ?? [])])
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function validateArticleForPublishing(input: z.infer<typeof articleInputSchema>): string[] {
  const issues: string[] = [];
  if (input.excerpt.length < 50) issues.push("Ringkasan minimal 50 karakter sebelum diterbitkan");
  if ((input.seo_title || input.title).length > 70) issues.push("Judul SEO sebaiknya tidak lebih dari 70 karakter");
  if (input.seo_description.length < 100 || input.seo_description.length > 170) issues.push("Deskripsi SEO harus 100–170 karakter");
  if (input.content.length < 2) issues.push("Artikel minimal memiliki dua blok konten");
  for (const block of input.content) {
    if (block.type === "image" && (!block.url || !block.alt.trim())) issues.push("Setiap gambar harus memiliki file/URL dan teks alternatif");
    if (block.type === "heading" && !block.text.trim()) issues.push("Judul bagian tidak boleh kosong");
    if (block.type === "paragraph" && !block.text.trim()) issues.push("Paragraf kosong perlu diisi atau dihapus");
  }
  return [...new Set(issues)];
}
