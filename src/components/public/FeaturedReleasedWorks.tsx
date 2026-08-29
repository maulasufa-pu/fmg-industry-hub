import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, Play } from "lucide-react";

import { loadFeaturedWorks } from "@/lib/public-sales-data";

function safeArtwork(url: string | null): string {
  if (!url) return "/logo/FMG-Universe-Flemmo-Music-Global.png";
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const allowed = ["i.scdn.co", "is1-ssl.mzstatic.com", "is2-ssl.mzstatic.com", "is3-ssl.mzstatic.com", "is4-ssl.mzstatic.com", "is5-ssl.mzstatic.com"];
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "";
    return allowed.includes(hostname) || hostname === supabaseHost ? url : "/logo/FMG-Universe-Flemmo-Music-Global.png";
  } catch {
    return "/logo/FMG-Universe-Flemmo-Music-Global.png";
  }
}

export default async function FeaturedReleasedWorks({ language }: { language: "en" | "id" }) {
  const works = await loadFeaturedWorks(6);
  const isId = language === "id";
  const portfolioHref = isId ? "/id/portofolio" : "/portfolio";

  return (
    <section className="mx-auto max-w-6xl px-5 py-16" aria-labelledby={`${language}-works-heading`}>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            {isId ? "Portofolio pilihan" : "Featured portfolio"}
          </p>
          <h2 id={`${language}-works-heading`} className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            {isId ? "Karya yang sudah kami rilis." : "Our released works."}
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">
            {isId ? "Dengarkan langsung hasil produksi dan aransemen yang sudah tersedia di platform musik." : "Listen to arrangement and production work already available on major music platforms."}
          </p>
        </div>
        <Link href={portfolioHref} className="inline-flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-300">
          {isId ? "Lihat seluruh portofolio" : "Explore all work"} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {works.length ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {works.map((work) => {
            const listenUrl = work.spotifyUrl || work.youtubeUrl || work.appleMusicUrl;
            return (
              <article key={work.id} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.03]">
                <div className="relative aspect-square overflow-hidden bg-slate-950">
                  <Image src={safeArtwork(work.artworkUrl)} alt={`${work.songTitle} — ${work.artist}`} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                  {listenUrl && <div className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/30"><span className="grid h-12 w-12 place-items-center rounded-full bg-white text-black opacity-0 shadow-lg transition group-hover:opacity-100"><Play className="h-5 w-5 fill-current" /></span></div>}
                </div>
                <div className="p-5">
                  {work.genre && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">{work.genre}</p>}
                  <h3 className="mt-2 text-xl font-bold">{work.songTitle}</h3>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{work.artist}</p>
                  {listenUrl ? (
                    <a href={listenUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-300">
                      {isId ? "Dengarkan" : "Listen now"} <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link href={portfolioHref} className="mt-4 inline-flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-300">
                      {isId ? "Lihat detail" : "View details"} <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-slate-200 p-7 dark:border-white/10">
          <p className="text-lg font-semibold">{isId ? "Portofolio lengkap tersedia di halaman karya kami." : "Explore the complete catalog on our portfolio page."}</p>
          <Link href={portfolioHref} className="mt-4 inline-flex items-center gap-2 font-semibold text-violet-600 dark:text-violet-300">
            {isId ? "Buka portofolio" : "Open portfolio"} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
