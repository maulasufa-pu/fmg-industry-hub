"use client";

import { useState, type DragEvent } from "react";
import { AlertTriangle, CheckCircle2, Download, FileJson, FolderUp, Loader2, Upload, X } from "lucide-react";

import { ARTICLE_IMPORT_LIMIT, parseArticleImportText } from "@/lib/articles/transfer";

type ConflictMode = "copy" | "replace" | "skip";
type ImportResponse = {
  summary: { total: number; created: number; replaced: number; skipped: number; failed: number };
  results: Array<{ index: number; title: string; status: "created" | "replaced" | "skipped" | "failed"; message?: string }>;
};

function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ArticleTransferActions({ selectedIds, onImported }: { selectedIds: string[]; onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [conflict, setConflict] = useState<ConflictMode>("copy");
  const [preserveStatus, setPreserveStatus] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportResponse | null>(null);

  function addFiles(incoming: FileList | File[]) {
    const accepted = Array.from(incoming).filter((file) => /\.jsonl?$/i.test(file.name));
    if (accepted.length === 0) {
      setError("Pilih file .json atau .jsonl.");
      return;
    }
    setFiles((current) => {
      const seen = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
      return [...current, ...accepted.filter((file) => !seen.has(`${file.name}:${file.size}:${file.lastModified}`))];
    });
    setError(null);
    setReport(null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  }

  function exportArticles() {
    const query = selectedIds.length > 0 ? `?ids=${encodeURIComponent(selectedIds.join(","))}` : "";
    const anchor = document.createElement("a");
    anchor.href = `/api/admin/articles/export${query}`;
    anchor.download = "";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  async function importArticles() {
    if (files.length === 0) {
      setError("Tambahkan setidaknya satu file terlebih dahulu.");
      return;
    }
    setImporting(true);
    setError(null);
    setReport(null);
    try {
      const totalBytes = files.reduce((total, file) => total + file.size, 0);
      if (totalBytes > 4 * 1024 * 1024) throw new Error("Total file maksimal 4 MB per import.");

      const articles: unknown[] = [];
      for (const file of files) {
        if (file.size > 4 * 1024 * 1024) throw new Error(`${file.name} lebih besar dari batas 4 MB.`);
        articles.push(...parseArticleImportText(await file.text(), file.name));
      }
      if (articles.length > ARTICLE_IMPORT_LIMIT) throw new Error(`Maksimal ${ARTICLE_IMPORT_LIMIT} artikel per import.`);

      const response = await fetch("/api/admin/articles/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articles, conflict, preserveStatus }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Import artikel gagal.");
      setReport(payload);
      if (payload.summary.created > 0 || payload.summary.replaced > 0) onImported();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import artikel gagal.");
    } finally {
      setImporting(false);
    }
  }

  function resetAndClose() {
    if (importing) return;
    setOpen(false);
    setFiles([]);
    setError(null);
    setReport(null);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold transition hover:border-violet-400 dark:border-white/10 dark:bg-slate-800">
        <Upload className="h-4 w-4" />Import
      </button>
      <button type="button" onClick={exportArticles} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold transition hover:border-violet-400 dark:border-white/10 dark:bg-slate-800">
        <Download className="h-4 w-4" />{selectedIds.length > 0 ? `Export (${selectedIds.length})` : "Export all"}
      </button>

      {open ? <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="article-import-title" onMouseDown={(event) => { if (event.target === event.currentTarget) resetAndClose(); }}>
        <div className="my-auto w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/15 bg-white shadow-2xl dark:bg-slate-950">
          <header className="flex items-start gap-4 border-b border-slate-200 p-5 dark:border-white/10 sm:p-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><FolderUp className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><h2 id="article-import-title" className="text-xl font-black">Import articles</h2><p className="mt-1 text-sm leading-6 text-slate-500">Satu file, banyak file, batch dalam satu file, atau seluruh folder. Format yang diterima: JSON dan JSONL.</p></div>
            <button type="button" onClick={resetAndClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Tutup import"><X className="h-5 w-5" /></button>
          </header>

          <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6">
            <div onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50/70 p-6 text-center dark:border-violet-400/30 dark:bg-violet-500/10">
              <FileJson className="mx-auto h-8 w-8 text-violet-600 dark:text-violet-300" />
              <p className="mt-3 font-black">Tarik file atau folder ke sini</p>
              <p className="mt-1 text-sm text-slate-500">Setiap file boleh berisi satu artikel, array artikel, atau objek batch dengan field articles.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <label className="cursor-pointer rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white">Pilih file<input type="file" accept=".json,.jsonl,application/json" multiple className="sr-only" onChange={(event) => event.target.files && addFiles(event.target.files)} /></label>
                <label className="cursor-pointer rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-bold text-violet-800 dark:border-violet-400/30 dark:bg-slate-950 dark:text-violet-200">Upload folder<input ref={(element) => { if (element) { element.setAttribute("webkitdirectory", ""); element.setAttribute("directory", ""); } }} type="file" accept=".json,.jsonl,application/json" multiple className="sr-only" onChange={(event) => event.target.files && addFiles(event.target.files)} /></label>
              </div>
            </div>

            {files.length > 0 ? <div className="rounded-2xl border border-slate-200 dark:border-white/10"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10"><span className="text-sm font-black">{files.length} file dipilih</span><button type="button" onClick={() => setFiles([])} className="text-xs font-bold text-rose-600">Hapus semua</button></div><div className="max-h-40 divide-y divide-slate-100 overflow-y-auto dark:divide-white/5">{files.map((file) => <div key={`${file.name}:${file.lastModified}`} className="flex items-center gap-3 px-4 py-2.5 text-sm"><FileJson className="h-4 w-4 shrink-0 text-violet-500" /><span className="min-w-0 flex-1 truncate">{file.webkitRelativePath || file.name}</span><span className="text-xs text-slate-400">{fileSize(file.size)}</span></div>)}</div></div> : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Jika slug sudah ada</label><select value={conflict} onChange={(event) => setConflict(event.target.value as ConflictMode)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold dark:border-white/10 dark:bg-slate-900"><option value="copy">Buat sebagai salinan baru</option><option value="replace">Ganti artikel yang ada</option><option value="skip">Lewati artikel tersebut</option></select></div>
              <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 p-3 dark:border-white/10"><input type="checkbox" checked={preserveStatus} onChange={(event) => setPreserveStatus(event.target.checked)} className="h-4 w-4 accent-violet-600" /><span><span className="block text-sm font-bold">Pertahankan status publish</span><span className="block text-xs text-slate-500">Jika mati, semua artikel masuk sebagai draft.</span></span></label>
            </div>

            {error ? <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
            {report ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/10"><div className="flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-200"><CheckCircle2 className="h-5 w-5" />Import selesai</div><div className="mt-3 grid grid-cols-4 gap-2 text-center">{(["created", "replaced", "skipped", "failed"] as const).map((key) => <div key={key} className="rounded-xl bg-white/70 p-2 dark:bg-black/20"><div className="text-lg font-black">{report.summary[key]}</div><div className="text-[10px] uppercase tracking-wider text-slate-500">{key}</div></div>)}</div>{report.results.some((item) => item.status === "failed") ? <div className="mt-3 space-y-1 text-xs text-rose-700 dark:text-rose-200">{report.results.filter((item) => item.status === "failed").slice(0, 10).map((item) => <p key={item.index}><strong>{item.title}:</strong> {item.message}</p>)}</div> : null}</div> : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={resetAndClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold dark:border-white/10">{report ? "Selesai" : "Batal"}</button><button type="button" onClick={() => void importArticles()} disabled={importing || files.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-40 dark:bg-white dark:text-slate-950">{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Import {files.length > 0 ? `${files.length} file` : "articles"}</button></div>
          </div>
        </div>
      </div> : null}
    </>
  );
}
