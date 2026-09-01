"use client";

import { CheckCircle2, CopyCheck, ExternalLink, Loader2, ShieldAlert, Trash2, X } from "lucide-react";
import { useState } from "react";

import type { DuplicateArticleGroup } from "@/lib/articles/deduplicate";

type ScanResponse = {
  groups?: DuplicateArticleGroup[];
  duplicateCount?: number;
  error?: string;
};

export default function ArticleDeduplicateAction({ onCleaned }: { onCleaned: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [groups, setGroups] = useState<DuplicateArticleGroup[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function scan() {
    setOpen(true);
    setLoading(true);
    setConfirming(false);
    setDeletedCount(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/articles/deduplicate", { cache: "no-store" });
      const payload = await response.json() as ScanResponse;
      if (!response.ok) throw new Error(payload.error || "Tidak dapat memeriksa artikel.");
      setGroups(payload.groups ?? []);
      setDuplicateCount(payload.duplicateCount ?? 0);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Tidak dapat memeriksa artikel.");
    } finally {
      setLoading(false);
    }
  }

  async function removeDuplicates() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setCleaning(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/articles/deduplicate", { method: "DELETE" });
      const payload = await response.json() as { deleted?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || "Duplikat tidak dapat dihapus.");
      setDeletedCount(payload.deleted ?? 0);
      setDuplicateCount(0);
      setGroups([]);
      setConfirming(false);
      onCleaned();
    } catch (cleanupError) {
      setError(cleanupError instanceof Error ? cleanupError.message : "Duplikat tidak dapat dihapus.");
    } finally {
      setCleaning(false);
    }
  }

  return <>
    <button type="button" onClick={() => void scan()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold transition hover:border-violet-400 dark:border-white/10 dark:bg-slate-800">
      <CopyCheck className="h-4 w-4" />Hapus duplikasi
    </button>

    {open ? <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !cleaning) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="duplicate-articles-title" className="flex max-h-[min(88vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white shadow-2xl dark:bg-slate-950">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-white/10 sm:p-6">
          <div><div className="text-xs font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">Published Articles</div><h2 id="duplicate-articles-title" className="mt-2 text-2xl font-black">Pemeriksaan duplikasi</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">Hanya artikel publish dengan bahasa, judul, dan isi yang sama yang dapat dihapus.</p></div>
          <button type="button" onClick={() => setOpen(false)} disabled={cleaning} aria-label="Tutup" className="rounded-full border border-slate-200 p-2 text-slate-500 dark:border-white/10"><X className="h-5 w-5" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? <div className="grid min-h-64 place-items-center gap-3 text-center"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /><p className="text-sm text-slate-500">Memeriksa seluruh artikel yang sudah publish…</p></div> : null}
          {!loading && error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"><div className="flex gap-3"><ShieldAlert className="h-5 w-5 shrink-0" /><span>{error}</span></div></div> : null}
          {!loading && !error && deletedCount !== null ? <div className="grid min-h-64 place-items-center text-center"><div><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" /><h3 className="mt-4 text-xl font-black">Pembersihan selesai</h3><p className="mt-2 text-sm text-slate-500">{deletedCount} artikel duplikat telah dihapus. Artikel utama tetap dipertahankan.</p></div></div> : null}
          {!loading && !error && deletedCount === null && groups.length === 0 ? <div className="grid min-h-64 place-items-center text-center"><div><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" /><h3 className="mt-4 text-xl font-black">Tidak ada duplikasi</h3><p className="mt-2 text-sm text-slate-500">Semua artikel publish memiliki judul atau isi yang berbeda.</p></div></div> : null}
          {!loading && !error && groups.length > 0 ? <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100"><strong>{duplicateCount} artikel duplikat</strong> ditemukan dalam {groups.length} kelompok. Periksa daftar berikut sebelum menghapus.</div>
            {groups.map((group) => <article key={group.id} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="border-b border-slate-200 bg-emerald-50 p-4 dark:border-white/10 dark:bg-emerald-500/10"><div className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Dipertahankan</div><div className="mt-1 flex items-start justify-between gap-3"><div><h3 className="font-black">{group.keep.title}</h3><p className="mt-1 break-all text-xs text-slate-500">{group.keep.path}</p></div><a href={group.keep.path} target="_blank" rel="noreferrer" aria-label={`Buka ${group.keep.title}`} className="rounded-lg border border-emerald-200 p-2 text-emerald-700 dark:border-emerald-400/20 dark:text-emerald-300"><ExternalLink className="h-4 w-4" /></a></div></div>
              <div className="divide-y divide-slate-100 dark:divide-white/5">{group.duplicates.map((article) => <div key={article.id} className="flex items-start gap-3 p-4"><Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" /><div className="min-w-0"><div className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-300">Akan dihapus</div><div className="mt-1 font-bold">{article.title}</div><div className="mt-1 break-all text-xs text-slate-500">{article.path}</div></div></div>)}</div>
            </article>)}
          </div> : null}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 dark:border-white/10 sm:flex-row sm:justify-end sm:p-5">
          <button type="button" onClick={() => setOpen(false)} disabled={cleaning} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold dark:border-white/10">Tutup</button>
          {!loading && groups.length > 0 ? <button type="button" onClick={() => void removeDuplicates()} disabled={cleaning} className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white transition ${confirming ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-950 dark:bg-violet-600"}`}>{cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{confirming ? `Konfirmasi hapus ${duplicateCount} artikel` : `Hapus ${duplicateCount} duplikat`}</button> : null}
        </footer>
      </section>
    </div> : null}
  </>;
}
