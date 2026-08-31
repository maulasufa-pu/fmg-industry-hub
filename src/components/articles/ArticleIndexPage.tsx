import { ArrowRight, CalendarDays, Clock3, Newspaper } from "lucide-react";
import Link from "next/link";

import type { ArticleLocale, ArticleRow } from "@/lib/articles/types";

export default function ArticleIndexPage({ articles, locale }: { articles: ArticleRow[]; locale: ArticleLocale }) {
  const isId = locale === "id-ID";
  return (
    <main className="-mx-4 min-h-screen bg-white px-5 py-16 text-slate-950 dark:bg-black dark:text-white sm:-mx-6 sm:px-8 lg:-mx-8 lg:px-12 lg:py-24">
      <header className="mx-auto max-w-7xl">
        <div className="text-sm font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">FMG Universe Editorial</div>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-6xl">{isId ? "Wawasan musik yang bisa langsung kamu gunakan." : "Music insights you can put to work."}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">{isId ? "Panduan praktis tentang aransemen, produksi musik, rekaman, dan cara membawa ide lagu menjadi karya yang utuh." : "Practical guidance on arrangement, music production, recording, and turning a song idea into a complete work."}</p>
      </header>

      <section className="mx-auto mt-14 grid max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <article key={article.id} className={`group overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-lg shadow-black/5 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900 ${article.is_featured ? "md:col-span-2" : ""}`}>
            {article.cover_image_url ? <div className="aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.cover_image_url} alt={article.cover_image_alt || article.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            </div> : <div className="grid aspect-[16/9] place-items-center bg-gradient-to-br from-violet-100 to-fuchsia-50 dark:from-violet-950 dark:to-slate-950"><Newspaper className="h-12 w-12 text-violet-400" /></div>}
            <div className="p-6 sm:p-7"><div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", { dateStyle: "medium" }).format(new Date(article.published_at || article.updated_at))}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{article.reading_minutes} {isId ? "menit" : "min"}</span></div><h2 className="mt-4 text-2xl font-black tracking-tight">{article.title}</h2><p className="mt-3 line-clamp-3 leading-7 text-slate-600 dark:text-slate-300">{article.excerpt}</p><Link href={article.path} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-violet-700 dark:text-violet-300">{isId ? "Baca artikel" : "Read article"}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link></div>
          </article>
        ))}
      </section>
      {articles.length === 0 ? <div className="mx-auto mt-14 max-w-7xl rounded-[2rem] border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-white/15">{isId ? "Artikel baru sedang disiapkan." : "New articles are being prepared."}</div> : null}
    </main>
  );
}
