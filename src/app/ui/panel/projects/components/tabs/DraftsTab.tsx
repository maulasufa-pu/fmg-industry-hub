// src/app/admin/projects/[id]/components/tabs/DraftsTab.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

import type { DraftRow, RevisionRow } from "../../types";
import type { UserRole } from "@/lib/roles";

interface DraftsTabProps {
  drafts: DraftRow[] | null;
  revisions: RevisionRow[] | null;
  /** di-inject oleh ProjectControlsSection.cloneElement */
  roleStatus?: UserRole;
  /** legacy fallback */
  isClient?: boolean;
}

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
      className={`relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-gray-800/25 ${
        gradient
          ? "bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"
          : "bg-white dark:bg-gray-900"
      } ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{
        scale: 1.01,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      }}
    >
      <div className="relative z-10 p-8">
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
            {title}
          </h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
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
  const supabase = useMemo(() => getSupabaseClient(), []);
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  // ——— role gating ———
  const effectiveRole: UserRole | "client" =
    roleStatus ?? (isClient ? "client" : "guest");

  const canUploadMusic =
    effectiveRole === "composer" || effectiveRole === "producer" || effectiveRole === "owner";
  const canUploadMix =
    effectiveRole === "engineer" || effectiveRole === "owner";
  const canRequestRevision =
    effectiveRole === "client" || effectiveRole === "anr" || effectiveRole === "owner";
  const canWriteNotes = effectiveRole === "anr";

  // local mirror supaya UI langsung ter-update setelah upload / request
  const [localDrafts, setLocalDrafts] = useState<DraftRow[]>(drafts ?? []);
  const [localRevisions, setLocalRevisions] = useState<RevisionRow[]>(
    revisions ?? []
  );

  useEffect(() => {
    if (drafts) setLocalDrafts(drafts);
  }, [drafts]);
  useEffect(() => {
    if (revisions) setLocalRevisions(revisions);
  }, [revisions]);

  // ——— upload state ———
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const handleUpload = async (
    file: File | null,
    category: "music" | "mixing"
  ) => {
    try {
      setUploadErr(null);
      if (!file) {
        setUploadErr("Pilih file .wav terlebih dahulu.");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "wav") {
        setUploadErr("File harus .wav");
        return;
      }

      setUploading(true);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      const ts = Date.now();
      const safeName = file.name.replace(/[^\w.-]+/g, "_");
      const path = `${projectId}/${category}/${ts}_${safeName}`;

      // upload ke storage bucket "drafts"
      const { error: upErr } = await supabase.storage
        .from("drafts")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: "audio/wav, audio/mp3, audio/m4a, audio/ogg, audio/flac",
        });
      if (upErr) throw upErr;

      // ambil public URL
      const { data: pub } = supabase.storage.from("drafts").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      // versi = max versi + 1
      const newVersion =
        (localDrafts?.reduce((mx, d) => Math.max(mx, Number(d.version || 0)), 0) ||
          0) + 1;

      // insert ke table drafts
      const { data: ins, error: insErr } = await supabase
        .from("drafts")
        .insert({
          project_id: projectId,
          version: newVersion,
          category, // string kolom opsional—hapus jika tabel tidak punya kolom ini
          file_path: publicUrl,
          uploaded_by: userId,
        })
        .select("*")
        .single();

      if (insErr) throw insErr;

      // update UI
      setLocalDrafts((prev) => [
        ...prev,
        {
          ...(ins as DraftRow),
          // fallback kalau tipe lokal tidak cocok:
          draft_id:
            (ins as any)?.draft_id ??
            (globalThis.crypto as any)?.randomUUID?.() ??
            `draft_${ts}`,
        },
      ]);
    } catch (e: any) {
      setUploadErr(e?.message || "Gagal upload draft");
    } finally {
      setUploading(false);
    }
  };

  // ——— revision request state ———
  const [revLoading, setRevLoading] = useState<string | null>(null);
  const [revErr, setRevErr] = useState<string | null>(null);
  const [revTextByDraft, setRevTextByDraft] = useState<Record<string, string>>(
    {}
  );

  const submitRevision = async (draftId: string) => {
    try {
      setRevErr(null);
      setRevLoading(draftId);

      const reason = (revTextByDraft[draftId] || "").trim();
      if (!reason) {
        setRevErr("Tulis catatan/alasan revisi terlebih dahulu.");
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      const requested_by = auth.user?.id ?? null;

      const { data: ins, error } = await supabase
        .from("revisions")
        .insert({
          project_id: projectId,
          draft_id: draftId,
          reason,
          requested_by,
        })
        .select("*")
        .single();

      if (error) throw error;

      setLocalRevisions((prev) => [
        ...prev,
        {
          ...(ins as RevisionRow),
          revision_id:
            (ins as any)?.revision_id ??
            (globalThis.crypto as any)?.randomUUID?.() ??
            `rev_${Date.now()}`,
        },
      ]);
      setRevTextByDraft((m) => ({ ...m, [draftId]: "" }));
    } catch (e: any) {
      setRevErr(e?.message || "Gagal mengirim revisi");
    } finally {
      setRevLoading(null);
    }
  };

  // ——— upload widget (role-based) ———
  const UploadWidget = ({
    label,
    category,
  }: {
    label: string;
    category: "music" | "mixing";
  }) => {
    const [file, setFile] = useState<File | null>(null);
    return (
      <AnimatedCard title={label} gradient>
        <div className="space-y-3">
          <input
            type="file"
            accept=".wav,audio/wav"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-700 dark:text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-slate-800 dark:file:text-slate-100"
          />
          <motion.button
            onClick={() => handleUpload(file, category)}
            disabled={uploading}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow hover:shadow-lg disabled:opacity-60"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </motion.button>
          {uploadErr && (
            <div className="text-xs text-red-600 dark:text-red-400">{uploadErr}</div>
          )}
          <div className="text-[11px] text-slate-500">
            Only .wav, .mp3, .flac, .m4a files will be saved per-project as <b>drafts</b>.
          </div>
        </div>
      </AnimatedCard>
    );
  };

  return (
    <motion.div
      data-role={effectiveRole}
      className={`grid grid-cols-1 gap-6 ${
        canUploadMusic || canUploadMix ? "lg:grid-cols-2" : ""
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Upload panels (role based) */}
      {canUploadMusic && (
        <UploadWidget label="🎵 Upload Music Draft (.wav)" category="music" />
      )}
      {canUploadMix && (
        <UploadWidget
          label="🎚️ Upload Mixing/Mastering Draft (.wav)"
          category="mixing"
        />
      )}

      {/* Draft list */}
      <AnimatedCard title="🔄 Drafts" gradient className="lg:col-span-2">
        {localDrafts === null ? (
          <motion.div
            className="text-sm text-gray-500 dark:text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            Loading drafts…
          </motion.div>
        ) : localDrafts.length ? (
          <motion.ul className="space-y-3 text-sm">
            {localDrafts
              .slice()
              .sort((a, b) => Number(a.version) - Number(b.version))
              .map((d, index) => {
                const list = (localRevisions ?? []).filter(
                  (r) => r.draft_id === d.draft_id
                );
                return (
                  <motion.li
                    key={d.draft_id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 shadow"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    whileHover={{
                      scale: 1.01,
                      boxShadow:
                        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <motion.span
                        className="font-medium text-gray-800 dark:text-gray-100 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-lg"
                        whileHover={{ scale: 1.1 }}
                      >
                        v{d.version}
                      </motion.span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>
                          {d.created_at
                            ? new Date(d.created_at).toLocaleString("id-ID")
                            : "-"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 break-all text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      {d.file_path}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <motion.a
                        href={d.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border px-3 py-2 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        🔗 Open
                      </motion.a>
                    </div>

                    {/* Permintaan revisi: untuk client & ANR */}
                    {canRequestRevision && (
                      <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white/70 dark:bg-slate-900/50">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {effectiveRole === "anr"
                            ? "Catatan / Alasan Revisi (ANR)"
                            : "Request Revisi"}
                        </label>
                        <textarea
                          className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm"
                          rows={3}
                          placeholder={
                            effectiveRole === "anr"
                              ? "Tulis catatan / instruksi revisi untuk draft ini…"
                              : "Tulis permintaan revisi untuk draft ini…"
                          }
                          value={revTextByDraft[d.draft_id] ?? ""}
                          onChange={(e) =>
                            setRevTextByDraft((m) => ({
                              ...m,
                              [d.draft_id]: e.target.value,
                            }))
                          }
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <motion.button
                            onClick={() => submitRevision(d.draft_id)}
                            disabled={revLoading === d.draft_id}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold disabled:opacity-60"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {revLoading === d.draft_id
                              ? "Mengirim…"
                              : "Kirim Revisi"}
                          </motion.button>
                          {revErr && (
                            <div className="text-[11px] text-red-600 dark:text-red-400">
                              {revErr}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Riwayat revisi */}
                    {list.length > 0 && (
                      <motion.div
                        className="mt-3 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-3 border border-yellow-200 dark:border-yellow-700/50"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ delay: 0.2 + 0.05 * index }}
                      >
                        <div className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1">
                          📝 Revision History
                        </div>
                        <motion.ul className="space-y-1">
                          {list.map((rv, rvIndex) => (
                            <motion.li
                              key={rv.revision_id}
                              className="text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 p-2 rounded-md"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + 0.05 * rvIndex }}
                            >
                              <span className="font-medium">
                                {rv.requested_by ?? "Unknown"}
                              </span>{" "}
                              — {rv.reason ?? "-"}
                              <span className="ml-2 text-[11px] text-gray-400 dark:text-gray-500">
                                {rv.created_at
                                  ? new Date(rv.created_at).toLocaleString("id-ID")
                                  : ""}
                              </span>
                            </motion.li>
                          ))}
                        </motion.ul>
                      </motion.div>
                    )}
                  </motion.li>
                );
              })}
          </motion.ul>
        ) : (
          <motion.div
            className="text-sm text-gray-500 dark:text-gray-400 text-center py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            📋 Belum ada draft.
          </motion.div>
        )}
      </AnimatedCard>

      {/* Catatan internal khusus ANR (opsional). 
          Kalau kamu ingin catatan terpisah dari request revisi, implementasi endpoint sendiri.
          Untuk sekarang, ANR menulis catatan lewat “Catatan / Alasan Revisi” di atas. */}
      {canWriteNotes && false && (
        <AnimatedCard title="📝 ANR Notes" gradient>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            (Coming soon)
          </div>
        </AnimatedCard>
      )}
    </motion.div>
  );
}
