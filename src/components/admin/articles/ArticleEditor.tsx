"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  GripVertical,
  Heading2,
  ImageIcon,
  LayoutTemplate,
  Link2,
  List,
  Loader2,
  MessageSquareQuote,
  Minus,
  Monitor,
  PanelTop,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Text,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import ArticleRenderer from "@/components/articles/ArticleRenderer";
import { estimateReadingMinutes, slugifyArticleTitle } from "@/lib/articles/schema";
import {
  DEFAULT_ARTICLE_DESIGN,
  type ArticleBlock,
  type ArticleDraft,
  type ArticleRow,
  type ArticleStatus,
} from "@/lib/articles/types";

type EditorTab = "content" | "seo" | "design";

const fieldClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-slate-950 dark:text-white";
const labelClass = "mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeBlock(type: ArticleBlock["type"]): ArticleBlock {
  const id = uid();
  if (type === "heading") return { id, type, level: 2, text: "Judul bagian" };
  if (type === "paragraph") return { id, type, align: "left", text: "Tulis isi artikel di sini." };
  if (type === "image") return { id, type, url: "", alt: "", caption: "", width: "content" };
  if (type === "quote") return { id, type, text: "Kutipan penting", attribution: "" };
  if (type === "list") return { id, type, style: "bullet", items: ["Poin pertama", "Poin kedua"] };
  if (type === "callout") return { id, type, tone: "tip", title: "Catatan", text: "Tambahkan informasi yang perlu diperhatikan." };
  if (type === "cta") return { id, type, heading: "Siap memulai project?", text: "Konsultasikan kebutuhan musikmu bersama tim FMG Universe.", label: "Mulai project", href: "/order", style: "primary" };
  return { id, type: "divider" };
}

const BLOCK_OPTIONS: Array<{ type: ArticleBlock["type"]; label: string; Icon: typeof Text }> = [
  { type: "paragraph", label: "Teks", Icon: Text },
  { type: "heading", label: "Judul", Icon: Heading2 },
  { type: "image", label: "Gambar", Icon: ImageIcon },
  { type: "quote", label: "Kutipan", Icon: MessageSquareQuote },
  { type: "list", label: "Daftar", Icon: List },
  { type: "callout", label: "Sorotan", Icon: AlertCircle },
  { type: "cta", label: "Tombol CTA", Icon: Link2 },
  { type: "divider", label: "Pemisah", Icon: Minus },
];

function SortableBlock({
  block,
  onChange,
  onRemove,
  onDuplicate,
  onUpload,
}: {
  block: ArticleBlock;
  onChange: (block: ArticleBlock) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onUpload: (file: File) => Promise<string>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const option = BLOCK_OPTIONS.find((item) => item.type === block.type)!;
  const Icon = option.Icon;

  async function uploadImage(file?: File) {
    if (!file || block.type !== "image") return;
    setUploading(true);
    try {
      const url = await onUpload(file);
      onChange({ ...block, url });
    } finally {
      setUploading(false);
    }
  }

  return (
    <article ref={setNodeRef} style={style} className={`rounded-2xl border bg-white shadow-sm transition dark:bg-slate-900 ${isDragging ? "z-20 border-violet-500 opacity-80 shadow-2xl" : "border-slate-200 dark:border-white/10"}`}>
      <header className="flex items-center gap-2 border-b border-slate-100 p-3 dark:border-white/10">
        <button type="button" {...attributes} {...listeners} className="cursor-grab rounded-lg p-2 text-slate-400 hover:bg-slate-100 active:cursor-grabbing dark:hover:bg-white/10" aria-label={`Pindahkan blok ${option.label}`}><GripVertical className="h-4 w-4" /></button>
        <Icon className="h-4 w-4 text-violet-600 dark:text-violet-300" />
        <button type="button" onClick={() => setExpanded((value) => !value)} className="flex flex-1 items-center justify-between text-left text-sm font-bold">
          {option.label}<ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
        </button>
        <button type="button" onClick={onDuplicate} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white" aria-label="Duplikasi blok"><Copy className="h-4 w-4" /></button>
        <button type="button" onClick={onRemove} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" aria-label="Hapus blok"><Trash2 className="h-4 w-4" /></button>
      </header>
      {expanded ? <div className="space-y-4 p-4">
        {block.type === "heading" ? <><textarea value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} rows={2} className={fieldClass} aria-label="Judul bagian" /><select value={block.level} onChange={(event) => onChange({ ...block, level: Number(event.target.value) as 2 | 3 })} className={fieldClass}><option value={2}>Heading 2 — bagian utama</option><option value={3}>Heading 3 — subbagian</option></select></> : null}
        {block.type === "paragraph" ? <><textarea value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} rows={7} className={fieldClass} aria-label="Isi paragraf" /><select value={block.align} onChange={(event) => onChange({ ...block, align: event.target.value as "left" | "center" })} className={fieldClass}><option value="left">Rata kiri</option><option value="center">Rata tengah</option></select></> : null}
        {block.type === "image" ? <><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><input value={block.url} onChange={(event) => onChange({ ...block, url: event.target.value })} placeholder="URL gambar atau unggah file" className={fieldClass} /><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Unggah<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" onChange={(event) => void uploadImage(event.target.files?.[0])} /></label></div><input value={block.alt} onChange={(event) => onChange({ ...block, alt: event.target.value })} placeholder="Teks alternatif gambar (wajib untuk SEO)" className={fieldClass} /><input value={block.caption} onChange={(event) => onChange({ ...block, caption: event.target.value })} placeholder="Keterangan gambar (opsional)" className={fieldClass} /><select value={block.width} onChange={(event) => onChange({ ...block, width: event.target.value as "content" | "wide" | "full" })} className={fieldClass}><option value="content">Lebar konten</option><option value="wide">Lebih lebar</option><option value="full">Lebar penuh</option></select></> : null}
        {block.type === "quote" ? <><textarea value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} rows={4} className={fieldClass} placeholder="Isi kutipan" /><input value={block.attribution} onChange={(event) => onChange({ ...block, attribution: event.target.value })} className={fieldClass} placeholder="Nama sumber (opsional)" /></> : null}
        {block.type === "list" ? <><select value={block.style} onChange={(event) => onChange({ ...block, style: event.target.value as "bullet" | "number" })} className={fieldClass}><option value="bullet">Daftar poin</option><option value="number">Daftar bernomor</option></select><textarea value={block.items.join("\n")} onChange={(event) => onChange({ ...block, items: event.target.value.split("\n") })} rows={6} className={fieldClass} aria-label="Isi daftar" /><p className="text-xs text-slate-500">Satu poin per baris.</p></> : null}
        {block.type === "callout" ? <><select value={block.tone} onChange={(event) => onChange({ ...block, tone: event.target.value as "info" | "tip" | "warning" })} className={fieldClass}><option value="info">Informasi</option><option value="tip">Tips</option><option value="warning">Peringatan</option></select><input value={block.title} onChange={(event) => onChange({ ...block, title: event.target.value })} className={fieldClass} placeholder="Judul sorotan" /><textarea value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} rows={4} className={fieldClass} placeholder="Isi sorotan" /></> : null}
        {block.type === "cta" ? <><input value={block.heading} onChange={(event) => onChange({ ...block, heading: event.target.value })} className={fieldClass} placeholder="Judul ajakan" /><textarea value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} rows={3} className={fieldClass} placeholder="Penjelasan singkat" /><div className="grid gap-3 sm:grid-cols-2"><input value={block.label} onChange={(event) => onChange({ ...block, label: event.target.value })} className={fieldClass} placeholder="Teks tombol" /><input value={block.href} onChange={(event) => onChange({ ...block, href: event.target.value })} className={fieldClass} placeholder="/order atau https://..." /></div><select value={block.style} onChange={(event) => onChange({ ...block, style: event.target.value as "primary" | "secondary" })} className={fieldClass}><option value="primary">Tombol utama</option><option value="secondary">Tombol sekunder</option></select></> : null}
        {block.type === "divider" ? <p className="text-sm text-slate-500">Pemisah visual antarbab. Tidak memerlukan pengaturan.</p> : null}
      </div> : null}
    </article>
  );
}

export default function ArticleEditor({ articleId }: { articleId: string }) {
  const [article, setArticle] = useState<ArticleRow | null>(null);
  const [tab, setTab] = useState<EditorTab>("content");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(`/api/admin/articles/${articleId}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Artikel tidak dapat dimuat.");
        setArticle(payload.article);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Artikel tidak dapat dimuat.");
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId]);

  function update(patch: Partial<ArticleRow>) {
    setArticle((current) => current ? { ...current, ...patch } : current);
    setDirty(true);
    setSuccess(null);
  }

  function updateBlock(nextBlock: ArticleBlock) {
    if (!article) return;
    update({ content: article.content.map((block) => block.id === nextBlock.id ? nextBlock : block) });
  }

  function addBlock(type: ArticleBlock["type"]) {
    if (!article) return;
    update({ content: [...article.content, makeBlock(type)] });
  }

  function onDragEnd(event: DragEndEvent) {
    if (!article || !event.over || event.active.id === event.over.id) return;
    const oldIndex = article.content.findIndex((block) => block.id === event.active.id);
    const newIndex = article.content.findIndex((block) => block.id === event.over!.id);
    update({ content: arrayMove(article.content, oldIndex, newIndex) });
  }

  async function upload(file: File): Promise<string> {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/article-media", { method: "POST", body });
    const payload = await response.json();
    if (!response.ok) {
      const message = payload.error || "Gambar gagal diunggah.";
      setError(message);
      throw new Error(message);
    }
    return payload.url;
  }

  async function uploadCover(file?: File) {
    if (!file) return;
    try {
      const url = await upload(file);
      update({ cover_image_url: url });
    } catch { /* message is shown by upload */ }
  }

  const draft = useMemo<ArticleDraft | null>(() => article ? {
    slug: article.slug,
    locale: article.locale,
    title: article.title,
    excerpt: article.excerpt,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
    keywords: article.keywords,
    cover_image_url: article.cover_image_url,
    cover_image_alt: article.cover_image_alt,
    content: article.content,
    design: article.design || DEFAULT_ARTICLE_DESIGN,
    status: article.status,
    author_name: article.author_name,
    reading_minutes: estimateReadingMinutes(article.content),
    is_featured: article.is_featured,
    published_at: article.published_at,
  } : null, [article]);

  async function save(statusOverride?: ArticleStatus) {
    if (!article || !draft) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const targetStatus = statusOverride ?? article.status;
    try {
      const response = await fetch(`/api/admin/articles/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, status: targetStatus }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Artikel gagal disimpan.");
      setArticle(payload.article);
      setDirty(false);
      setSuccess(targetStatus === "published" ? "Artikel sudah diterbitkan." : "Perubahan sudah disimpan.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Artikel gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (loading) return <div className="grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>;
  if (!article || !draft) return <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">{error || "Artikel tidak ditemukan."}</div>;

  const titleLimit = (article.seo_title || article.title).length;
  const descriptionLimit = (article.seo_description || article.excerpt).length;

  return (
    <section className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/95 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3">
          <Link href="/admin/articles" className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5" aria-label="Kembali"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{article.title}</div><div className="text-xs text-slate-500">{dirty ? "Ada perubahan yang belum disimpan" : "Semua perubahan tersimpan"}</div></div>
          <button type="button" onClick={() => setPreview((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold dark:border-white/10"><Monitor className="h-4 w-4" />{preview ? "Tutup preview" : "Preview"}</button>
          <button type="button" onClick={() => void save()} disabled={saving || !dirty} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold disabled:opacity-40 dark:border-white/10">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Simpan</button>
          <button type="button" onClick={() => void save("published")} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 disabled:opacity-50"><Send className="h-4 w-4" />{article.status === "published" ? "Perbarui" : "Terbitkan"}</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,720px)_minmax(380px,1fr)]">
        <main className="min-w-0">
          {error ? <div className="mb-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div> : null}
          {success ? <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200"><Check className="h-4 w-4" />{success}{article.status === "published" ? <a href={article.path} target="_blank" rel="noopener noreferrer" className="ml-auto font-bold underline">Lihat halaman</a> : null}</div> : null}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <label className={labelClass}>Judul artikel</label><textarea value={article.title} onChange={(event) => update({ title: event.target.value })} rows={2} className="w-full resize-none bg-transparent text-3xl font-black leading-tight outline-none sm:text-4xl" />
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_180px]"><div><label className={labelClass}>Slug URL</label><div className="flex gap-2"><input value={article.slug} onChange={(event) => update({ slug: slugifyArticleTitle(event.target.value) })} className={fieldClass} /><button type="button" onClick={() => update({ slug: slugifyArticleTitle(article.title) })} className="rounded-xl border border-slate-200 px-3 text-xs font-bold dark:border-white/10">Buat otomatis</button></div></div><div><label className={labelClass}>Bahasa</label><select value={article.locale} onChange={(event) => update({ locale: event.target.value as ArticleRow["locale"] })} className={fieldClass}><option value="id-ID">Indonesia</option><option value="en-US">English</option></select></div></div>
            <div className="mt-4"><label className={labelClass}>Ringkasan</label><textarea value={article.excerpt} onChange={(event) => update({ excerpt: event.target.value })} rows={3} maxLength={500} className={fieldClass} placeholder="Ringkasan singkat yang membuat pembaca ingin lanjut membaca." /><div className="mt-1 text-right text-xs text-slate-400">{article.excerpt.length}/500</div></div>
          </div>

          <nav className="mt-5 grid grid-cols-3 rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-white/10 dark:bg-slate-900">
            {([{ id: "content", label: "Konten", Icon: LayoutTemplate }, { id: "seo", label: "SEO", Icon: Search }, { id: "design", label: "Desain", Icon: Sparkles }] as const).map(({ id, label, Icon }) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${tab === id ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5"}`}><Icon className="h-4 w-4" />{label}</button>)}
          </nav>

          {tab === "content" ? <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900"><div className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Tambah blok</div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{BLOCK_OPTIONS.map(({ type, label, Icon }) => <button key={type} type="button" onClick={() => addBlock(type)} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-left text-sm font-bold transition hover:border-violet-400 hover:bg-violet-50 dark:border-white/10 dark:hover:bg-violet-500/10"><Icon className="h-4 w-4 text-violet-600" />{label}</button>)}</div></div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}><SortableContext items={article.content.map((block) => block.id)} strategy={verticalListSortingStrategy}><div className="space-y-3">{article.content.map((block) => <SortableBlock key={block.id} block={block} onChange={updateBlock} onRemove={() => update({ content: article.content.filter((item) => item.id !== block.id) })} onDuplicate={() => { const copy = { ...block, id: uid() } as ArticleBlock; const index = article.content.findIndex((item) => item.id === block.id); update({ content: [...article.content.slice(0, index + 1), copy, ...article.content.slice(index + 1)] }); }} onUpload={upload} />)}</div></SortableContext></DndContext>
            {article.content.length === 0 ? <button type="button" onClick={() => addBlock("paragraph")} className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-slate-500 hover:border-violet-400 hover:text-violet-600 dark:border-white/15"><Plus className="h-7 w-7" /><span className="font-bold">Tambahkan blok pertama</span></button> : null}
          </div> : null}

          {tab === "seo" ? <div className="mt-5 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div><label className={labelClass}>Judul Google</label><input value={article.seo_title} onChange={(event) => update({ seo_title: event.target.value })} maxLength={180} className={fieldClass} placeholder={article.title} /><p className={`mt-2 text-xs ${titleLimit > 60 ? "text-amber-600" : "text-slate-500"}`}>{titleLimit}/60 karakter yang disarankan</p></div>
            <div><label className={labelClass}>Deskripsi Google</label><textarea value={article.seo_description} onChange={(event) => update({ seo_description: event.target.value })} rows={4} maxLength={500} className={fieldClass} placeholder={article.excerpt} /><p className={`mt-2 text-xs ${descriptionLimit > 160 ? "text-amber-600" : "text-slate-500"}`}>{descriptionLimit}/160 karakter yang disarankan</p></div>
            <div><label className={labelClass}>Kata kunci</label><input value={article.keywords.join(", ")} onChange={(event) => update({ keywords: event.target.value.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 30) })} className={fieldClass} placeholder="jasa aransemen lagu, produksi musik" /><p className="mt-2 text-xs text-slate-500">Pisahkan dengan koma. Gunakan istilah yang benar-benar dibahas dalam artikel.</p></div>
            <div className="rounded-2xl border border-slate-200 p-5 dark:border-white/10"><div className="text-xs text-emerald-700 dark:text-emerald-400">flemmomusic.com{article.locale === "id-ID" ? "/id/artikel/" : "/articles/"}{article.slug}</div><div className="mt-2 text-xl text-blue-700 dark:text-blue-400">{article.seo_title || article.title}</div><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{article.seo_description || article.excerpt || "Deskripsi artikel akan muncul di sini."}</p></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><label className={labelClass}>Nama penulis</label><input value={article.author_name} onChange={(event) => update({ author_name: event.target.value })} className={fieldClass} /></div><label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 p-3 dark:border-white/10"><input type="checkbox" checked={article.is_featured} onChange={(event) => update({ is_featured: event.target.checked })} className="h-4 w-4 accent-violet-600" /><span className="text-sm font-bold">Tampilkan sebagai artikel unggulan</span></label></div>
          </div> : null}

          {tab === "design" ? <div className="mt-5 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900 sm:p-6">
            <div><label className={labelClass}>Cover artikel</label><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><input value={article.cover_image_url || ""} onChange={(event) => update({ cover_image_url: event.target.value || null })} className={fieldClass} placeholder="URL gambar cover" /><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950"><Upload className="h-4 w-4" />Unggah<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" onChange={(event) => void uploadCover(event.target.files?.[0])} /></label></div><input value={article.cover_image_alt || ""} onChange={(event) => update({ cover_image_alt: event.target.value || null })} className={`${fieldClass} mt-3`} placeholder="Deskripsi cover untuk aksesibilitas dan SEO" /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div><label className={labelClass}>Gaya visual</label><select value={article.design.theme} onChange={(event) => update({ design: { ...article.design, theme: event.target.value as ArticleRow["design"]["theme"] } })} className={fieldClass}><option value="editorial">Editorial</option><option value="minimal">Minimal</option><option value="bold">Bold</option></select></div><div><label className={labelClass}>Hero</label><select value={article.design.heroStyle} onChange={(event) => update({ design: { ...article.design, heroStyle: event.target.value as ArticleRow["design"]["heroStyle"] } })} className={fieldClass}><option value="gradient">Gradient</option><option value="image">Fokus gambar</option><option value="clean">Bersih</option></select></div><div><label className={labelClass}>Lebar isi</label><select value={article.design.bodyWidth} onChange={(event) => update({ design: { ...article.design, bodyWidth: event.target.value as ArticleRow["design"]["bodyWidth"] } })} className={fieldClass}><option value="compact">Ringkas</option><option value="comfortable">Nyaman</option><option value="wide">Lebar</option></select></div><div><label className={labelClass}>Warna aksen</label><select value={article.design.accent} onChange={(event) => update({ design: { ...article.design, accent: event.target.value as ArticleRow["design"]["accent"] } })} className={fieldClass}><option value="violet">Violet</option><option value="blue">Biru</option><option value="emerald">Hijau</option><option value="rose">Merah muda</option><option value="amber">Amber</option></select></div></div>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-white/10"><span><span className="block text-sm font-bold">Daftar isi otomatis</span><span className="mt-1 block text-xs text-slate-500">Dibuat dari semua Heading 2 dan Heading 3.</span></span><input type="checkbox" checked={article.design.showToc} onChange={(event) => update({ design: { ...article.design, showToc: event.target.checked } })} className="h-5 w-5 accent-violet-600" /></label>
          </div> : null}
        </main>

        <aside className={`${preview ? "fixed inset-0 z-40 overflow-y-auto bg-white p-4 dark:bg-black sm:p-8 xl:static xl:z-auto xl:max-h-[calc(100vh-7rem)] xl:rounded-2xl xl:border xl:border-slate-200 xl:p-0 xl:dark:border-white/10" : "hidden xl:block"}`}>
          {preview ? <button type="button" onClick={() => setPreview(false)} className="fixed right-5 top-5 z-50 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-xl dark:bg-white dark:text-slate-950 xl:hidden">Tutup preview</button> : null}
          <div className="border-b border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900"><div className="flex items-center gap-2 text-sm font-bold"><PanelTop className="h-4 w-4 text-violet-500" />Preview langsung</div><p className="mt-1 text-xs text-slate-500">Tampilan isi artikel saat diterbitkan.</p></div>
          <div className="overflow-y-auto bg-white px-5 py-10 dark:bg-black sm:px-8 xl:max-h-[calc(100vh-12rem)]"><div className="mx-auto mb-10 max-w-3xl"><div className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">FMG Universe Editorial</div><h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">{article.title}</h1><p className="mt-4 leading-7 text-slate-500">{article.excerpt}</p>{article.cover_image_url ? <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.cover_image_url} alt={article.cover_image_alt || article.title} className="mt-7 max-h-80 w-full rounded-2xl object-cover" />
          </> : null}</div><ArticleRenderer blocks={article.content} design={article.design} /></div>
        </aside>
      </div>
    </section>
  );
}
