// src/app/admin/projects/[id]/components/tabs/DraftsTab.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

import type { DraftRow, RevisionRow } from "../../types";
import type { UserRole } from "@/lib/roles";
import WaveformPlayer from "../WaveformPlayer";

interface DraftsTabProps {
  drafts: DraftRow[] | null;
  revisions: RevisionRow[] | null;
  roleStatus?: UserRole;
  isClient?: boolean;
}

const extractName = (url: string) => {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean);
    const file = seg[seg.length - 1] ?? url;
    return decodeURIComponent(file).replace(/\.[a-z0-9]+$/i, "");
  } catch {
    const file = url.split("/").pop() ?? url;
    return decodeURIComponent(file).replace(/\.[a-z0-9]+$/i, "");
  }
};

const AnimatedCard = ({
  title,
  children,
  className = "",
  gradient = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}) => {
  return (
    <motion.section
      className={`relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 dark:shadow-black/30 ${
        gradient
          ? "bg-gradient-to-br from-white via-blue-50/90 to-purple-50/80 dark:from-slate-900/95 dark:via-blue-900/30 dark:to-purple-900/30"
          : "bg-white/95 dark:bg-slate-900/95"
      } ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
    >
      <div className="relative z-10 p-8">
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 dark:from-slate-100 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {title}
          </h3>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {children}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default function DraftsTab({
  drafts,
  revisions,
  roleStatus,
  isClient = false,
}: DraftsTabProps) {
  const asArr = <T,>(v: T[] | null | undefined): T[] => v ?? [];
  
  const supabase = useMemo(() => getSupabaseClient(), []);
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  type ProfileMinimal = { main_role: string | null; staff_role: UserRole[] | null };
  type ProjectOwner = { client_id: string | null };

  const [viewerRole, setViewerRole] = useState<UserRole | "client" | "guest">("guest");

  const effectiveRole: UserRole | "client" | "guest" = viewerRole;

  const canUploadMusic =
    effectiveRole === "composer" || effectiveRole === "producer" || effectiveRole === "owner";

  const canUploadMix =
    effectiveRole === "engineer" || effectiveRole === "owner";

  const canRequestRevision =
    effectiveRole === "client" || effectiveRole === "anr" || effectiveRole === "owner";

  const canWriteNotes = effectiveRole === "anr";

  const USER_ROLES = ["owner","admin","anr","producer","composer","engineer","publisher"] as const;
  const USER_ROLE_SET: ReadonlySet<string> = new Set(USER_ROLES as readonly string[]);
  const isUserRole = (r: unknown): r is UserRole =>
    typeof r === "string" && USER_ROLE_SET.has(r);

  const MANAGE_SET: ReadonlySet<UserRole> = new Set<UserRole>([
    "owner","admin","producer","composer","engineer",
  ]);

  const canManageDrafts =
    isUserRole(effectiveRole) && MANAGE_SET.has(effectiveRole);


  useEffect(() => {
    let off = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!off) setViewerRole("guest"); return; }

      const [{ data: prof }, { data: proj }] = await Promise.all([
        supabase.from("profiles")
          .select("main_role,staff_role")
          .eq("id", user.id)
          .single<ProfileMinimal>(),
        supabase.from("project_summary")
          .select("client_id")
          .eq("project_id", projectId)
          .single<ProjectOwner>(),
      ]);

      if (off) return;

      const staff = (prof?.staff_role ?? []) as UserRole[];
      const mainRole = prof?.main_role ?? null;
      const isOwnerClient = proj?.client_id === user.id;

      const staffPriority = staff.find(r =>
        ["owner","admin","anr","producer","composer","engineer","publisher"].includes(r)
      );

      if (staffPriority) setViewerRole(staffPriority);
      else if (isOwnerClient || mainRole === "client") setViewerRole("client");
      else setViewerRole("guest");
    })().catch(() => { if (!off) setViewerRole("guest"); });

    return () => { off = true; };
  }, [projectId, supabase]);

  const [localDrafts, setLocalDrafts] = useState<DraftRow[] | null>(drafts ?? null);
  const [localRevisions, setLocalRevisions] = useState<RevisionRow[] | null>(revisions ?? null);

  useEffect(() => { if (drafts !== undefined) setLocalDrafts(drafts); }, [drafts]);
  useEffect(() => { if (revisions !== undefined) setLocalRevisions(revisions); }, [revisions]);

  useEffect(() => {
    let off = false;
    if (localDrafts !== null) return; 
    (async () => {
      const { data, error } = await supabase
        .from("drafts")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (off) return;
      setLocalDrafts(error ? [] : (data ?? []));
    })();
    return () => { off = true; };
  }, [localDrafts, projectId, supabase]);

  useEffect(() => {
    let off = false;
    if (localRevisions !== null) return;
    (async () => {
      const { data } = await supabase
        .from("revisions")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (!off) setLocalRevisions(data ?? []);
    })();
    return () => { off = true; };
  }, [localRevisions, projectId, supabase]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const parseStorageRef = (urlOrPath: string) => {
    if (!urlOrPath) return null;
    if (!urlOrPath.startsWith("http")) return { bucket: "drafts", path: urlOrPath };
    try {
      const u = new URL(urlOrPath);
      const m = u.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
      if (!m) return null;
      return { bucket: m[1], path: decodeURIComponent(m[2].split("?")[0]) };
    } catch { return null; }
  };

  const deleteDraft = async (draft: DraftRow) => {
    if (!canManageDrafts) {
      alert("Kamu tidak memiliki izin menghapus draft.");
      return;
    }
    if (!confirm("Hapus draft ini?")) return;
    setDeletingId(draft.draft_id);
    try {
      const ref = parseStorageRef(draft.file_path) ?? { bucket: "drafts", path: draft.file_path };
      const toRemove = [ref.path, `${ref.path}.peaks.json`];

      const { error: rmErr } = await supabase.storage.from(ref.bucket).remove(toRemove);
      if (rmErr && !String(rmErr.message || "").toLowerCase().includes("not found")) {
        throw rmErr;
      }

      const { error: dbErr } = await supabase
        .from("drafts")
        .delete()
        .eq("draft_id", draft.draft_id)
        .eq("project_id", projectId);

      if (dbErr) throw dbErr;

      setLocalDrafts(prev => asArr(prev).filter(d => d.draft_id !== draft.draft_id));
    } catch (e: any) {
      alert(e?.message || "Gagal menghapus draft");
    } finally {
      setDeletingId(null);
    }
  };

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  type DraftCategory = "composition" | "arrangement" | "production" | "mixing" | "mastering";

  const splitName = (name: string): { base: string; ext: string } => {
    const justName = name.split(/[/\\]/).pop() ?? name;
    const dot = justName.lastIndexOf(".");
    if (dot <= 0) return { base: justName, ext: "" };
    return { base: justName.slice(0, dot), ext: justName.slice(dot + 1) };
  };

  const sanitizeBase = (base: string): string => {
    const noDiacritics = base.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    return noDiacritics
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_")
      .slice(0, 64);
  };

  const safeUUID = (): string =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const handleUpload = async (file: File | null, category: DraftCategory) => {
    try {
      setUploadErr(null);
      if (!file) { setUploadErr("Pilih file .wav terlebih dahulu."); return; }

      const { base, ext } = splitName(file.name);
      const extLower = ext.toLowerCase();
      if (extLower !== "wav") { setUploadErr("File harus .wav"); return; }

      setUploading(true);

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      const newVersion =
        (localDrafts?.reduce((mx, d) => Math.max(mx, Number(d.version || 0)), 0) || 0) + 1;

      const draftId = safeUUID();

      const safeBase = sanitizeBase(base);
      const originalSafeName = `${safeBase}.wav`;

      let path = `${projectId}/${category}/${originalSafeName}`;

      const tryUpload = async (p: string) => {
        const { error } = await supabase.storage
          .from("drafts")
          .upload(p, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || "audio/wav",
          });
        return error;
      };

      let upErr = await tryUpload(path);

      if (upErr && (upErr as { statusCode?: number }).statusCode === 409) {
        const withVersion = `${safeBase}_v${String(newVersion).padStart(2, "0")}.wav`;
        path = `${projectId}/${category}/${withVersion}`;
        upErr = await tryUpload(path);
      }

      if (upErr) throw upErr;

      const { data: ins, error: insErr } = await supabase
        .from("drafts")
        .insert({
          draft_id: draftId,
          project_id: projectId,
          version: newVersion,
          category,
          file_path: path,     
          uploaded_by: userId,
        })
        .select("*")
        .single();

      if (insErr) throw insErr;

      setLocalDrafts(prev => [...asArr(prev), ins as DraftRow]);

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal upload draft";
      setUploadErr(msg);
    } finally {
      setUploading(false);
    }
  };

  const [revLoading, setRevLoading] = useState<string | null>(null);
  const [revErr, setRevErr] = useState<string | null>(null);
  const [revTextByDraft, setRevTextByDraft] = useState<Record<string, string>>({});

  const submitRevision = async (draftId: string) => {
    try {
      setRevErr(null); setRevLoading(draftId);
      const reason = (revTextByDraft[draftId] || "").trim();
      if (!reason) { setRevErr("Tulis catatan/alasan revisi terlebih dahulu."); return; }

      const { data: auth } = await supabase.auth.getUser();
      const requested_by = auth.user?.id ?? null;

      const { data: ins, error } = await supabase
        .from("revisions")
        .insert({ project_id: projectId, draft_id: draftId, reason, requested_by })
        .select("*")
        .single();
      if (error) throw error;

      setLocalRevisions(prev => [
        ...asArr(prev),
        { ...(ins as RevisionRow), revision_id: (ins as any)?.revision_id ?? `rev_${Date.now()}` },
      ]);
      setRevTextByDraft(m => ({ ...m, [draftId]: "" }));
    } catch (e: any) {
      setRevErr(e?.message || "Gagal mengirim revisi");
    } finally {
      setRevLoading(null);
    }
  };

  const UploadWidget = ({
    label,
    allowedCategories,
  }: {
    label: string;
    allowedCategories: DraftCategory[];
  }) => {
    const [file, setFile] = useState<File | null>(null);
    const [cat, setCat] = useState<DraftCategory>(allowedCategories[0]);

    return (
      <AnimatedCard title={label} gradient>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">Kategori</label>
            <div className="relative mt-1">
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value as DraftCategory)}
                className="appearance-none w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
              >
                {allowedCategories.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z" /></svg>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">File</label>
            <input
              type="file"
              accept=".wav,audio/wav"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-slate-700 dark:text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-800/60 file:transition-colors cursor-pointer"
            />
          </div>

          <motion.button
            onClick={() => handleUpload(file, cat)}
            disabled={uploading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-600 dark:to-indigo-600 text-white font-semibold shadow-lg shadow-purple-500/25 dark:shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-500/30 dark:hover:shadow-purple-600/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </motion.button>

          {uploadErr && <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">{uploadErr}</div>}
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Only .wav files will be saved per-project as <b className="text-slate-700 dark:text-slate-300">drafts</b>.</div>
        </div>
      </AnimatedCard>
    );
  };

  return (
    <motion.div
      data-role={effectiveRole}
      className={`grid grid-cols-1 gap-6 ${canUploadMusic || canUploadMix ? "lg:grid-cols-2" : ""}`}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
    >
      {canUploadMusic && (
        <UploadWidget label="🎵 Upload Music Draft (.wav)" allowedCategories={["composition","arrangement","production"]} />
      )}
      {canUploadMix && (
        <UploadWidget label="🎚️ Upload Mixing/Mastering Draft (.wav)" allowedCategories={["mixing","mastering"]} />
      )}

      <AnimatedCard title="🔄 Drafts" gradient className="lg:col-span-2">
        {localDrafts === null ? (
          <motion.div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading drafts…
          </motion.div>
        ) : localDrafts.length ? (
          <motion.ul className="space-y-3 text-sm">
            {localDrafts
              .slice()
              .sort((a, b) => Number(a.version) - Number(b.version))
              .map((d, index) => {
                const list = (localRevisions ?? []).filter((r) => r.draft_id === d.draft_id);
                return (
                  <motion.li
                    key={d.draft_id}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800/90 dark:to-slate-900/60 p-4 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * index }}
                    whileHover={{ scale: 1.01, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {extractName(d.file_path)}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">
                            {((d as any).category
                              ? ((d as any).category as string).charAt(0).toUpperCase() + ((d as any).category as string).slice(1)
                              : "Draft")}
                          </span>
                          {" • "}v{d.version}
                          {" • "}
                          {d.created_at ? new Date(d.created_at).toLocaleString("id-ID") : "-"}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {canManageDrafts && (
                          <motion.button
                            onClick={() => deleteDraft(d)}
                            disabled={deletingId === d.draft_id}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium
                                      bg-red-600 dark:bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-red-500/25 dark:shadow-red-600/30 transition-all duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {deletingId === d.draft_id ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin">
                                  <path fill="currentColor" d="M12 2v2a8 8 0 1 1-8 8H2a10 10 0 1 0 10-10z"/>
                                </svg>
                                Menghapus…
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24">
                                  <path fill="currentColor" d="M6 7h12l-1 13H7L6 7zm3-3h6l1 2H8l1-2z"/>
                                </svg>
                                Delete
                              </>
                            )}
                          </motion.button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <WaveformPlayer src={d.file_path} title={`Draft v${d.version}`} />
                    </div>

                    {canRequestRevision && (
                      <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-600 p-3 bg-white/80 dark:bg-slate-800/60 backdrop-blur-sm">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                          <span className="text-sm">{effectiveRole === "anr" ? "📝" : "🔄"}</span>
                          {effectiveRole === "anr" ? "Catatan / Alasan Revisi (ANR)" : "Request Revisi"}
                        </label>
                        <textarea
                          className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-400 dark:focus:border-blue-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          rows={3}
                          placeholder={effectiveRole === "anr" ? "Write notes / revision instructions for this draft…" : "Write revision request for this draft…"}
                          value={revTextByDraft[d.draft_id] ?? ""}
                          onChange={(e) => setRevTextByDraft((m) => ({ ...m, [d.draft_id]: e.target.value }))}
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <motion.button
                            onClick={() => submitRevision(d.draft_id)}
                            disabled={revLoading === d.draft_id}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-600 dark:to-teal-600 text-white text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 dark:shadow-emerald-600/30 transition-all duration-200"
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          >
                            {revLoading === d.draft_id ? "Mengirim…" : "Kirim Revisi"}
                          </motion.button>
                          {revErr && <div className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-2 py-1">{revErr}</div>}
                        </div>
                      </div>
                    )}
                  </motion.li>
                );
              })}
          </motion.ul>
        ) : (
          <motion.div className="text-sm text-slate-500 dark:text-slate-400 text-center py-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-200/50 dark:border-slate-700/50" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <div className="text-2xl mb-2">📋</div>
            <div className="font-medium">Belum ada draft.</div>
            <div className="text-xs mt-1 text-slate-400 dark:text-slate-500">Upload file .wav pertama untuk memulai</div>
          </motion.div>
        )}
      </AnimatedCard>

      {canWriteNotes && false && (
        <AnimatedCard title="📝 ANR Notes" gradient>
          <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">(Coming soon)</span>
            </div>
          </div>
        </AnimatedCard>
      )}
    </motion.div>
  );
}
