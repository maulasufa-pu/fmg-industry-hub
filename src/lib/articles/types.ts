export type ArticleStatus = "draft" | "published" | "archived";
export type ArticleLocale = "id-ID" | "en-US";

export type ArticleDesign = {
  theme: "editorial" | "minimal" | "bold";
  accent: "violet" | "blue" | "emerald" | "rose" | "amber";
  heroStyle: "gradient" | "image" | "clean";
  bodyWidth: "compact" | "comfortable" | "wide";
  showToc: boolean;
};

type BaseBlock = { id: string };

export type ArticleBlock =
  | (BaseBlock & { type: "paragraph"; text: string; align: "left" | "center" })
  | (BaseBlock & { type: "heading"; text: string; level: 2 | 3 })
  | (BaseBlock & {
      type: "image";
      url: string;
      alt: string;
      caption: string;
      width: "content" | "wide" | "full";
    })
  | (BaseBlock & { type: "quote"; text: string; attribution: string })
  | (BaseBlock & { type: "list"; style: "bullet" | "number"; items: string[] })
  | (BaseBlock & {
      type: "callout";
      tone: "info" | "tip" | "warning";
      title: string;
      text: string;
    })
  | (BaseBlock & {
      type: "cta";
      heading: string;
      text: string;
      label: string;
      href: string;
      style: "primary" | "secondary";
    })
  | (BaseBlock & { type: "divider" });

export type ArticleRow = {
  id: string;
  slug: string;
  locale: ArticleLocale;
  path: string;
  title: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  keywords: string[];
  cover_image_url: string | null;
  cover_image_alt: string | null;
  content: ArticleBlock[];
  design: ArticleDesign;
  status: ArticleStatus;
  author_name: string;
  reading_minutes: number;
  is_featured: boolean;
  created_by: string | null;
  updated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleDraft = Pick<
  ArticleRow,
  | "slug"
  | "locale"
  | "title"
  | "excerpt"
  | "seo_title"
  | "seo_description"
  | "keywords"
  | "cover_image_url"
  | "cover_image_alt"
  | "content"
  | "design"
  | "status"
  | "author_name"
  | "reading_minutes"
  | "is_featured"
  | "published_at"
>;

export const DEFAULT_ARTICLE_DESIGN: ArticleDesign = {
  theme: "editorial",
  accent: "violet",
  heroStyle: "gradient",
  bodyWidth: "comfortable",
  showToc: true,
};

export const DEFAULT_ARTICLE_BLOCKS: ArticleBlock[] = [
  {
    id: "intro-heading",
    type: "heading",
    level: 2,
    text: "Mulai dari bagian terpenting",
  },
  {
    id: "intro-paragraph",
    type: "paragraph",
    align: "left",
    text: "Tulis pembuka yang langsung menjawab kebutuhan pembaca. Kamu bisa memindahkan, mendesain, atau menghapus blok ini.",
  },
];
