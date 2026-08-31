import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react";

import { JsonLd } from "@/components/JsonLd";
import type { ArticleRow } from "@/lib/articles/types";
import ArticleRenderer, { headingAnchor } from "./ArticleRenderer";

const ACCENT_BG = {
  violet: "from-violet-100 via-white to-fuchsia-100 dark:from-violet-950 dark:via-black dark:to-fuchsia-950",
  blue: "from-blue-100 via-white to-cyan-100 dark:from-blue-950 dark:via-black dark:to-cyan-950",
  emerald: "from-emerald-100 via-white to-teal-100 dark:from-emerald-950 dark:via-black dark:to-teal-950",
  rose: "from-rose-100 via-white to-orange-100 dark:from-rose-950 dark:via-black dark:to-orange-950",
  amber: "from-amber-100 via-white to-orange-100 dark:from-amber-950 dark:via-black dark:to-orange-950",
};

export default function PublicArticlePage({ article }: { article: ArticleRow }) {
  const isId = article.locale === "id-ID";
  const headings = article.content
    .map((block, index) => block.type === "heading" ? { id: headingAnchor(block.text, index), text: block.text, level: block.level } : null)
    .filter((heading): heading is NonNullable<typeof heading> => Boolean(heading));
  const publishedDate = article.published_at ?? article.updated_at;
  const siteUrl = "https://flemmomusic.com";
  const canonical = `${siteUrl}${article.path}`;
  const isBold = article.design.theme === "bold";
  const isMinimal = article.design.theme === "minimal";
  const imageHero = article.design.heroStyle === "image" && Boolean(article.cover_image_url);
  const heroBackground = article.design.heroStyle === "clean"
    ? "bg-white dark:bg-black"
    : `bg-gradient-to-br ${ACCENT_BG[article.design.accent]}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.seo_title || article.title,
    description: article.seo_description || article.excerpt,
    datePublished: publishedDate,
    dateModified: article.updated_at,
    inLanguage: article.locale,
    author: { "@type": "Organization", name: article.author_name },
    publisher: { "@type": "Organization", name: "FMG Universe", url: siteUrl },
    mainEntityOfPage: canonical,
    ...(article.cover_image_url ? { image: article.cover_image_url } : {}),
  };

  return (
    <article className="-mx-4 min-h-screen bg-white text-slate-950 dark:bg-black dark:text-white sm:-mx-6 lg:-mx-8">
      <JsonLd id={`article-${article.id}`} data={schema} />
      <header className={`relative overflow-hidden ${heroBackground} px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:px-12`}>
        {imageHero ? <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.cover_image_url!} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </> : null}
        {!isMinimal && !imageHero ? <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(100,116,139,.22)_1px,transparent_0)] [background-size:28px_28px]" /> : null}
        <div className="relative mx-auto max-w-5xl">
          <Link href={isId ? "/id/artikel" : "/articles"} className={`inline-flex items-center gap-2 text-sm font-semibold transition ${imageHero ? "text-white/75 hover:text-white" : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"}`}>
            <ArrowLeft className="h-4 w-4" /> {isId ? "Kembali" : "Back"}
          </Link>
          <div className="mt-12 max-w-4xl">
            <div className="text-sm font-black uppercase tracking-[0.22em] text-violet-700 dark:text-violet-300">FMG Universe Editorial</div>
            <h1 className={`mt-5 font-black leading-[1.04] tracking-[-0.045em] ${imageHero ? "text-white" : ""} ${isBold ? "text-5xl sm:text-7xl lg:text-8xl" : isMinimal ? "text-4xl sm:text-5xl lg:text-6xl" : "text-4xl sm:text-6xl lg:text-7xl"}`}>{article.title}</h1>
            <p className={`mt-6 max-w-3xl text-lg leading-8 sm:text-xl ${imageHero ? "text-white/80" : "text-slate-600 dark:text-slate-300"}`}>{article.excerpt}</p>
            <div className={`mt-8 flex flex-wrap items-center gap-4 text-sm font-medium ${imageHero ? "text-white/65" : "text-slate-500 dark:text-slate-400"}`}>
              <span>{article.author_name}</span><span aria-hidden="true">•</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", { dateStyle: "long" }).format(new Date(publishedDate))}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" />{article.reading_minutes} {isId ? "menit baca" : "min read"}</span>
            </div>
          </div>
          {article.cover_image_url && !imageHero ? <div className={`mt-12 overflow-hidden border border-black/10 bg-slate-100 shadow-2xl dark:border-white/10 dark:bg-slate-900 ${isMinimal ? "rounded-xl" : isBold ? "rounded-none" : "rounded-[2rem]"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.cover_image_url} alt={article.cover_image_alt || article.title} className="max-h-[680px] w-full object-cover" />
          </div> : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-12 lg:py-24">
        {article.design.showToc && headings.length > 1 ? <aside className="hidden lg:block"><nav className="sticky top-24 rounded-2xl border border-black/10 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5" aria-label={isId ? "Daftar isi" : "Table of contents"}>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{isId ? "Daftar isi" : "Contents"}</div>
          <ol className="mt-4 space-y-3">{headings.map((heading) => <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}><a href={`#${heading.id}`} className="text-sm leading-5 text-slate-600 transition hover:text-violet-700 dark:text-slate-300 dark:hover:text-violet-300">{heading.text}</a></li>)}</ol>
        </nav></aside> : <div className="hidden lg:block" />}
        <ArticleRenderer blocks={article.content} design={article.design} />
      </div>
    </article>
  );
}
