"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Archive, Download, ExternalLink, FileText, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import ArticleTransferActions from "@/components/admin/articles/ArticleTransferActions";
import ArticleDeduplicateAction from "@/components/admin/articles/ArticleDeduplicateAction";
import type { ArticleLocale, ArticleStatus } from "@/lib/articles/types";

type ArticleSummary = {
  id: string;
  slug: string;
  locale: ArticleLocale;
  path: string;
  title: string;
  excerpt: string;
  status: ArticleStatus;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_STYLE: Record<ArticleStatus, string> = {
  draft: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  archived: "bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
};

export default function ArticleManager() {
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ArticleStatus>("all");
  const [locale, setLocale] = useState<ArticleLocale>("id-ID");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/articles", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load articles");
      setArticles(payload.articles);
      setSelectedIds((current) => new Set([...current].filter((id) => payload.articles.some((article: ArticleSummary) => article.id === id))));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load articles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesQuery = !needle || `${article.title} ${article.slug} ${article.excerpt}`.toLowerCase().includes(needle);
      return matchesQuery && (status === "all" || article.status === status);
    });
  }, [articles, query, status]);

  async function createArticle() {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: locale === "id-ID" ? "Artikel baru" : "New article", locale }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create article");
      router.push(`/admin/articles/${payload.article.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create article");
      setCreating(false);
    }
  }

  async function deleteArticle(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      window.setTimeout(() => setConfirmDeleteId((current) => current === id ? null : current), 4000);
      return;
    }
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to delete article");
      setArticles((current) => current.filter((article) => article.id !== id));
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      setConfirmDeleteId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete article");
    } finally {
      setDeletingId(null);
    }
  }

  const counts = {
    all: articles.length,
    published: articles.filter((article) => article.status === "published").length,
    draft: articles.filter((article) => article.status === "draft").length,
    archived: articles.filter((article) => article.status === "archived").length,
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((article) => selectedIds.has(article.id));

  function toggleSelection(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleFilteredSelection() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) filtered.forEach((article) => next.delete(article.id));
      else filtered.forEach((article) => next.add(article.id));
      return next;
    });
  }

  return (
    <section className="min-h-screen px-4 py-6 text-slate-950 dark:text-white sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[2rem] border border-black/5 bg-white p-6 shadow-xl shadow-slate-300/30 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">Content Management</div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Article Studio</h1>
              <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">Create SEO-ready articles with reusable blocks, visual layouts, drafts, and live publishing.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <ArticleTransferActions selectedIds={[...selectedIds]} onImported={() => void load()} />
              <ArticleDeduplicateAction onCleaned={() => void load()} />
              <select value={locale} onChange={(event) => setLocale(event.target.value as ArticleLocale)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold dark:border-white/10 dark:bg-slate-800">
                <option value="id-ID">Bahasa Indonesia</option><option value="en-US">English</option>
              </select>
              <button onClick={() => void createArticle()} disabled={creating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-slate-950">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}New article
              </button>
            </div>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["all", "published", "draft", "archived"] as const).map((key) => <button key={key} onClick={() => setStatus(key)} className={`rounded-2xl border p-4 text-left transition ${status === key ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10" : "border-black/5 bg-white hover:border-violet-300 dark:border-white/10 dark:bg-slate-900"}`}>
            <div className="text-2xl font-black">{counts[key]}</div><div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{key}</div>
          </button>)}
        </div>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-xl shadow-slate-300/20 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
          <div className="flex flex-col gap-3 border-b border-black/5 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:p-5"><label className="relative block min-w-0 flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, slug, or summary…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none transition focus:border-violet-500 dark:border-white/10 dark:bg-black/20" /></label><label className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold dark:border-white/10"><input type="checkbox" checked={allFilteredSelected} onChange={toggleFilteredSelection} className="h-4 w-4 accent-violet-600" />Pilih semua hasil</label>{selectedIds.size > 0 ? <button type="button" onClick={() => setSelectedIds(new Set())} className="text-xs font-bold text-violet-600">Batalkan {selectedIds.size} pilihan</button> : null}</div>
          {error ? <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">{error}</div> : null}
          {loading ? <div className="grid place-items-center p-20"><Loader2 className="h-7 w-7 animate-spin text-violet-500" /></div> : filtered.length === 0 ? <div className="grid place-items-center gap-3 p-20 text-center"><FileText className="h-10 w-10 text-slate-300" /><div><div className="font-bold">No articles found</div><div className="text-sm text-slate-500">Create a new article or change your filters.</div></div></div> : <div className="divide-y divide-black/5 dark:divide-white/10">
            {filtered.map((article) => <article key={article.id} className="group grid gap-4 p-5 transition hover:bg-slate-50 dark:hover:bg-white/[0.03] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex min-w-0 items-start gap-3"><input type="checkbox" checked={selectedIds.has(article.id)} onChange={() => toggleSelection(article.id)} className="mt-1 h-4 w-4 shrink-0 accent-violet-600" aria-label={`Pilih ${article.title}`} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${STATUS_STYLE[article.status]}`}>{article.status}</span><span className="text-xs font-semibold text-slate-400">{article.locale}</span>{article.is_featured ? <span className="text-xs font-bold text-violet-600">Featured</span> : null}</div><h2 className="mt-3 truncate text-lg font-bold sm:text-xl">{article.title}</h2><p className="mt-1 truncate text-sm text-slate-500">{article.path}</p><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{article.excerpt || "No summary yet."}</p><div className="mt-3 text-xs text-slate-400">Updated {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(article.updated_at))}</div></div></div>
              <div className="flex flex-wrap gap-2 lg:justify-end"><Link href={`/admin/articles/${article.id}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:border-violet-400 dark:border-white/10"><Pencil className="h-4 w-4" />Edit</Link><a href={`/api/admin/articles/export?ids=${article.id}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:border-violet-400 dark:border-white/10"><Download className="h-4 w-4" />Export</a>{article.status === "published" ? <a href={article.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold hover:border-violet-400 dark:border-white/10"><ExternalLink className="h-4 w-4" />View</a> : null}<button onClick={() => void deleteArticle(article.id)} disabled={deletingId === article.id} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${confirmDeleteId === article.id ? "bg-rose-600 text-white" : "border border-slate-200 text-rose-600 dark:border-white/10 dark:text-rose-300"}`}>{deletingId === article.id ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmDeleteId === article.id ? <Trash2 className="h-4 w-4" /> : <Archive className="h-4 w-4" />}{confirmDeleteId === article.id ? "Confirm delete" : "Delete"}</button></div>
            </article>)}
          </div>}
        </div>
      </div>
    </section>
  );
}
