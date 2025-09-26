// src/app/admin/projects/[id]/components/tabs/PublishingTab.tsx
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  ChangeEvent,
} from "react";
import { motion } from "framer-motion";
import type { ProjectSummary } from "../../types";
import type { UserRole } from "@/lib/roles";
import { getSupabaseClient } from "@/lib/supabase/client";

/** ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */
interface PublishingTabProps {
  project: ProjectSummary;
  /** sent automatically from ProjectControlsSection via cloneElement */
  roleStatus?: UserRole;
  /** legacy fallback (optional) */
  isClient?: boolean;
}

type Split = { party: string; percentage: number };

// ✅ Add/check type & default (place at top of file, before component). 
// If already exists, leave it — don't duplicate.

type DSP = "spotify" | "appleMusic" | "youtubeMusic" | "deezer" | "tiktok" | "instagram";
type DSPStatus = "pending" | "submitted" | "live" | "rejected" | "takedown";
type PlatformState = { status: DSPStatus; url: string | null };
type PlatformStatuses = Record<DSP, PlatformState>;

const DEFAULT_PLATFORMS: PlatformStatuses = {
  spotify: { status: "pending", url: null },
  appleMusic: { status: "pending", url: null },
  youtubeMusic: { status: "pending", url: null },
  deezer: { status: "pending", url: null },
  tiktok: { status: "pending", url: null },
  instagram: { status: "pending", url: null },
};

/** DB Row for publishing columns in `projects` table (nullable in DB) */
type ProjectPublishingDB = {
  project_id: string;
  isrc: string | null;
  upc: string | null;
  release_date: string | null;
  explicit: boolean | null;
  label_name: string | null;
  copyright_c: string | null;
  copyright_p: string | null;
  language: string | null;
  primary_genre: string | null;
  sub_genre: string | null;
  artwork_path: string | null;
  artwork_url: string | null;
  royalty_splits: Split[] | null;
  /** JSONB (recommended to add this column in projects): platform_statuses JSONB */
  platform_statuses: PlatformStatuses | null;
};

/** Update payload type to Supabase (can be null/undefined) */
type ProjectPublishingUpdate = Partial<ProjectPublishingDB>;

/** Form type (always string for controlled input) */
type PublishingFields = {
  isrc: string;
  upc: string;
  release_date: string; // YYYY-MM-DD
  explicit: boolean;
  label_name: string;
  copyright_c: string;
  copyright_p: string;
  language: string;
  primary_genre: string;
  sub_genre: string;
  artwork_path: string | null;
  artwork_url: string | null;
  royalty_splits: Split[];
  platform_statuses: PlatformStatuses;
};

/** Roles allowed to edit. Fallback: if roleStatus not available => UI editable (RLS server-side still protects writes). */
const STAFF_ROLES: ReadonlyArray<UserRole> = [
  "owner",
  "admin",
  "anr",
  "producer",
  "composer",
  "engineer",
  "publisher",
] as const;

/** ------------------------------------------------------------------
 * UI helpers (tema ala desain kamu sebelumnya)
 * ------------------------------------------------------------------ */
const inputCls =
  "w-full rounded-xl border border-gray-300/80 dark:border-gray-700/70 " +
  "bg-white/70 dark:bg-gray-800/70 px-3 py-2 outline-none " +
  "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow";

const Field = ({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
      {label} {required && <span className="text-rose-500">*</span>}
    </span>
    <div className="mt-1">{children}</div>
  </label>
);

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
      <div className="relative z-10 p-6 md:p-8">
        <motion.div
          className="mb-4 md:mb-6 flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
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

/** ------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------ */

const DSPS: Array<{ key: DSP; label: string; emoji: string }> = [
  { key: "spotify", label: "Spotify", emoji: "🎵" },
  { key: "appleMusic", label: "Apple Music", emoji: "🍎" },
  { key: "youtubeMusic", label: "YouTube Music", emoji: "▶️" },
  { key: "deezer", label: "Deezer", emoji: "🎧" },
  { key: "tiktok", label: "TikTok", emoji: "🎬" },
  { key: "instagram", label: "Instagram", emoji: "📸" },
];

const STATUS_BADGE: Record<
  DSPStatus,
  { text: string; cls: string }
> = {
  pending: {
    text: "Pending",
    cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  },
  submitted: {
    text: "Submitted",
    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  live: {
    text: "Live",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  rejected: {
    text: "Rejected",
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
  takedown: {
    text: "Takedown",
    cls: "bg-gray-200 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300",
  },
};

/** ------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------ */
export default function PublishingTab({
  project,
  roleStatus,
  isClient = false,
}: PublishingTabProps) {
  // Fallback: bila roleStatus tidak ada => editable
  const canEdit = useMemo(
    () => (roleStatus ? STAFF_ROLES.includes(roleStatus) : true),
    [roleStatus]
  );
  const isClientView = isClient ? true : !canEdit;

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [form, setForm] = useState<PublishingFields>({
    isrc: "",
    upc: "",
    release_date: "",
    explicit: false,
    label_name: "",
    copyright_c: "",
    copyright_p: "",
    language: "",
    primary_genre: "",
    sub_genre: "",
    artwork_path: null,
    artwork_url: null,
    royalty_splits: [],
    platform_statuses: DEFAULT_PLATFORMS, // ⬅️ penting
  });

  /** Load existing publishing fields from DB */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      const supabase = getSupabaseClient();

      const cols = [
        "project_id",
        "isrc",
        "upc",
        "release_date",
        "explicit",
        "label_name",
        "copyright_c",
        "copyright_p",
        "language",
        "primary_genre",
        "sub_genre",
        "artwork_path",
        "artwork_url",
        "royalty_splits",
        "platform_statuses",
      ].join(",");

      // di dalam useEffect load data, ganti blok fetch-nya:
      const { data, error } = await supabase
        .from("projects")
        .select(cols)
        .eq("project_id", project.project_id)
        .maybeSingle();

      if (!alive) return;

      if (error || !data) {
        setErr(error?.message ?? "Failed to load publishing data.");
        setLoading(false);
        return;
      }

      // ⬇️ Avoid direct cast to target type (TS2352). Cast via unknown after guard.
      const row = data as unknown as ProjectPublishingDB;

      setForm({
        isrc: row.isrc ?? "",
        upc: row.upc ?? "",
        release_date: row.release_date ?? "",
        explicit: !!row.explicit,
        label_name: row.label_name ?? "",
        copyright_c: row.copyright_c ?? "",
        copyright_p: row.copyright_p ?? "",
        language: row.language ?? "",
        primary_genre: row.primary_genre ?? "",
        sub_genre: row.sub_genre ?? "",
        artwork_path: row.artwork_path ?? null,
        artwork_url: row.artwork_url ?? null,
        royalty_splits: Array.isArray(row.royalty_splits) ? row.royalty_splits : [],
        platform_statuses: row.platform_statuses
          ? { ...DEFAULT_PLATFORMS, ...row.platform_statuses } // safe merge
          : DEFAULT_PLATFORMS, // fallback if column doesn't exist yet/still null
      });

      setLoading(false);

    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.project_id]);

  /** Handlers: form umum */
  const onChangeText =
    (key: keyof PublishingFields) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setForm((prev) => ({ ...prev, [key]: v }));
    };

  const onChangeBool =
    (key: keyof PublishingFields) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.checked }));
    };

  /** Royalty Splits */
  const totalSplit = useMemo(
    () =>
      form.royalty_splits.reduce(
        (acc, s) => acc + (Number.isFinite(s.percentage) ? s.percentage : 0),
        0
      ),
    [form.royalty_splits]
  );

  const addSplit = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      royalty_splits: [...prev.royalty_splits, { party: "", percentage: 0 }],
    }));
  }, []);

  const updateSplit = useCallback((idx: number, patch: Partial<Split>) => {
    setForm((prev) => {
      const next = prev.royalty_splits.map((s, i) =>
        i === idx ? { ...s, ...patch } : s
      );
      return { ...prev, royalty_splits: next };
    });
  }, []);

  const removeSplit = useCallback((idx: number) => {
    setForm((prev) => {
      const next = prev.royalty_splits.filter((_, i) => i !== idx);
      return { ...prev, royalty_splits: next };
    });
  }, []);

  /** Artwork upload */
  const onUploadArtwork = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setErr(null);
      setOk(null);
      const supabase = getSupabaseClient();

      const ext = file.name.split(".").pop() ?? "png";
      const path = `artworks/${project.project_id}/cover_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("artworks")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });
      if (upErr) {
        setErr(upErr.message ?? "Failed to upload artwork.");
        return;
      }

      const { data: pub } = supabase.storage.from("artworks").getPublicUrl(path);
      const url = pub?.publicUrl ?? null;

      setForm((prev) => ({
        ...prev,
        artwork_path: path,
        artwork_url: url,
      }));
      setOk("Artwork uploaded.");
    },
    [project.project_id]
  );

  /** Platform status handlers */
  const setDSPStatus = useCallback(
    (key: DSP, status: DSPStatus) => {
      setForm((prev) => ({
        ...prev,
        platform_statuses: {
          ...prev.platform_statuses,
          [key]: { ...prev.platform_statuses[key], status },
        },
      }));
    },
    []
  );

  const setDSPUrl = useCallback((key: DSP, url: string) => {
    setForm((prev) => ({
      ...prev,
      platform_statuses: {
        ...prev.platform_statuses,
        [key]: { ...prev.platform_statuses[key], url: url || null },
      },
    }));
  }, []);

  /** Validasi & Save */
  const validate = useCallback((): string | null => {
    if (!form.isrc.trim()) return "ISRC is required.";
    if (!form.release_date.trim()) return "Release Date is required.";
    if (totalSplit > 100.0001)
      return "Total Royalty Share cannot exceed 100%.";
    if (form.royalty_splits.some((s) => s.percentage < 0))
      return "Percentage cannot be negative.";
    return null;
  }, [form.isrc, form.release_date, form.royalty_splits, totalSplit]);

  const onSave = useCallback(async () => {
    setErr(null);
    setOk(null);
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setSaving(true);
    const supabase = getSupabaseClient();

    const payload: ProjectPublishingUpdate = {
      isrc: form.isrc || null,
      upc: form.upc || null,
      release_date: form.release_date || null,
      explicit: form.explicit,
      label_name: form.label_name || null,
      copyright_c: form.copyright_c || null,
      copyright_p: form.copyright_p || null,
      language: form.language || null,
      primary_genre: form.primary_genre || null,
      sub_genre: form.sub_genre || null,
      artwork_path: form.artwork_path,
      artwork_url: form.artwork_url,
      royalty_splits: form.royalty_splits,
      platform_statuses: form.platform_statuses, // ⬅️ save platform status (JSONB)
    };

    const { error } = await supabase
      .from("projects")
      .update(payload)
      .eq("project_id", project.project_id);

    setSaving(false);
    if (error) {
      setErr(
        error.message ??
          "Failed to save. (If error column 'platform_statuses', add that JSONB column to projects table.)"
      );
    } else {
      setOk("Saved.");
    }
  }, [form, project.project_id, validate]);

  /** ------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------ */
  return (
    <motion.div
      data-role={roleStatus || (isClientView ? "client" : "staff")}
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* LEFT: Publishing Form */}
      <AnimatedCard title="📑 Publishing Data" gradient className="lg:col-span-5">
        {loading ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading…</div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="ISRC" required>
                <input
                  type="text"
                  className={inputCls}
                  value={form.isrc}
                  onChange={onChangeText("isrc")}
                  disabled={isClientView}
                  placeholder="ID-ABC-25-00001"
                  autoComplete="off"
                />
              </Field>

              <Field label="UPC / EAN">
                <input
                  type="text"
                  className={inputCls}
                  value={form.upc}
                  onChange={onChangeText("upc")}
                  disabled={isClientView}
                  placeholder="123456789012"
                  autoComplete="off"
                />
              </Field>

              <Field label="Release Date" required>
                <input
                  type="date"
                  className={inputCls}
                  value={form.release_date}
                  onChange={onChangeText("release_date")}
                  disabled={isClientView}
                />
              </Field>

              <Field label="Explicit">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={form.explicit}
                    onChange={onChangeBool("explicit")}
                    disabled={isClientView}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    Mark explicit
                  </span>
                </label>
              </Field>

              <Field label="Label / Imprint">
                <input
                  type="text"
                  className={inputCls}
                  value={form.label_name}
                  onChange={onChangeText("label_name")}
                  disabled={isClientView}
                  placeholder="Flemmo Studio"
                />
              </Field>

              <Field label="Language">
                <input
                  type="text"
                  className={inputCls}
                  value={form.language}
                  onChange={onChangeText("language")}
                  disabled={isClientView}
                  placeholder="id / en / etc."
                />
              </Field>

              <Field label="Primary Genre">
                <input
                  type="text"
                  className={inputCls}
                  value={form.primary_genre}
                  onChange={onChangeText("primary_genre")}
                  disabled={isClientView}
                  placeholder="Pop"
                />
              </Field>

              <Field label="Sub Genre">
                <input
                  type="text"
                  className={inputCls}
                  value={form.sub_genre}
                  onChange={onChangeText("sub_genre")}
                  disabled={isClientView}
                  placeholder="Indie Pop"
                />
              </Field>

              <Field label="© C-Line (Copyright)">
                <input
                  type="text"
                  className={inputCls}
                  value={form.copyright_c}
                  onChange={onChangeText("copyright_c")}
                  disabled={isClientView}
                  placeholder="© 2025 Flemmo Music Global"
                />
              </Field>

              <Field label="℗ P-Line (Phonographic)">
                <input
                  type="text"
                  className={inputCls}
                  value={form.copyright_p}
                  onChange={onChangeText("copyright_p")}
                  disabled={isClientView}
                  placeholder="℗ 2025 Flemmo Music Global"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Artwork">
                <div className="flex items-center gap-4">
                  {form.artwork_url ? (
                    <img
                      src={form.artwork_url}
                      alt="Artwork"
                      className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 grid place-items-center text-xs text-gray-500">
                      no image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onUploadArtwork}
                    disabled={isClientView}
                    className="text-sm"
                    aria-label="Upload artwork"
                  />
                </div>
              </Field>

              <Field label="Royalty Share (total ≤ 100%)">
                <div className="space-y-2">
                  {form.royalty_splits.map((s, i) => (
                    <div key={`split-${i}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Party name / account"
                        className={inputCls}
                        value={s.party}
                        onChange={(e) => updateSplit(i, { party: e.target.value })}
                        disabled={isClientView}
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        placeholder="%"
                        className="w-28 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                        value={Number.isFinite(s.percentage) ? s.percentage : 0}
                        onChange={(e) =>
                          updateSplit(i, {
                            percentage: Math.max(
                              0,
                              Math.min(100, Number(e.target.value) || 0)
                            ),
                          })
                        }
                        disabled={isClientView}
                      />
                      {!isClientView && (
                        <button
                          type="button"
                          onClick={() => removeSplit(i)}
                          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          aria-label="remove split"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {!isClientView && (
                    <button
                      type="button"
                      onClick={addSplit}
                      className="mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
                    >
                      + Add split
                    </button>
                  )}

                  {/* Progress total split */}
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-2 ${
                        totalSplit > 100 ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(totalSplit, 100)}%` }}
                    />
                  </div>

                  <div
                    className={`text-xs ${
                      totalSplit > 100
                        ? "text-rose-500"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Total: {totalSplit.toFixed(2)}%
                  </div>
                </div>
              </Field>
            </div>

            {/* Sticky save bar */}
            {!isClientView && (
              <div
                className="sticky bottom-0 -mx-6 md:-mx-8 mt-4 border-t border-gray-200/80 dark:border-gray-700/70
                  bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60
                  dark:supports-[backdrop-filter]:bg-gray-900/60 px-6 md:px-8 py-3
                  flex items-center justify-between rounded-b-3xl"
              >
                <div className="text-xs">
                  {err ? (
                    <span className="text-rose-500">{err}</span>
                  ) : ok ? (
                    <span className="text-emerald-600">{ok}</span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">
                      Ensure all fields are valid.
                    </span>
                  )}
                </div>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            )}

            {isClientView && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Only authorized staff can modify publishing data.
              </div>
            )}
          </div>
        )}
      </AnimatedCard>

      {/* MIDDLE: Status Platform */}
      <AnimatedCard title="📚 Publishing Status" gradient className="lg:col-span-4">
        <div className="space-y-4">
          {/* Status ringkas project */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-700/50">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              📊 Current Status
            </h4>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {project.status === "published" ? "Published ✅" : "Not Published Yet ⏳"}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Stage: {project.stage || "Unknown"}
            </p>
          </div>

          {/* Grid per-platform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DSPS.map(({ key, label, emoji }, idx) => {
              const st = form.platform_statuses[key];
              const badge = STATUS_BADGE[st.status];
              return (
                <motion.div
                  key={key}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      <span className="mr-1">{emoji}</span>
                      {label}
                    </div>
                    <span className={`text-[11px] px-2 py-1 rounded-full ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <select
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 px-2 py-2 text-sm"
                      value={st.status}
                      onChange={(e) => setDSPStatus(key, e.target.value as DSPStatus)}
                      disabled={isClientView}
                    >
                      <option value="pending">Pending</option>
                      <option value="submitted">Submitted</option>
                      <option value="live">Live</option>
                      <option value="rejected">Rejected</option>
                      <option value="takedown">Takedown</option>
                    </select>

                    <input
                      type="url"
                      placeholder="Release URL (optional)"
                      className={inputCls}
                      value={st.url ?? ""}
                      onChange={(e) => setDSPUrl(key, e.target.value)}
                      disabled={isClientView}
                    />

                    {st.url ? (
                      <a
                        href={st.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Open link →
                      </a>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </AnimatedCard>

      {/* RIGHT: Artwork Preview */}
      <AnimatedCard title="🖼️ Artwork Preview" gradient className="lg:col-span-3">
        <div className="grid place-items-center">
          {form.artwork_url ? (
            <img
              src={form.artwork_url}
              alt="Artwork"
              className="w-64 h-64 object-cover rounded-2xl border border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-64 h-64 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 grid place-items-center text-sm text-gray-500">
              Artwork not uploaded yet
            </div>
          )}
        </div>
      </AnimatedCard>

      {/* BOTTOM: Distribution Actions (staff only) */}
      {!isClientView && (
        <AnimatedCard
          title="🔄 Distribution Actions"
          gradient
          className="lg:col-span-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { action: "Submit to Distributors", icon: "📤", color: "from-blue-500 to-indigo-600" },
              { action: "Generate ISRC Codes", icon: "🔢", color: "from-green-500 to-emerald-600" },
              { action: "Upload Artwork", icon: "🎨", color: "from-purple-500 to-pink-600" },
              { action: "Set Release Date", icon: "📅", color: "from-orange-500 to-red-600" },
            ].map((item, index) => (
              <motion.button
                key={item.action}
                className={`w-full p-3 rounded-xl bg-gradient-to-r ${item.color} text-white font-medium shadow hover:shadow-lg transition-all`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>{item.icon}</span>
                  {item.action}
                </span>
              </motion.button>
            ))}
          </div>
        </AnimatedCard>
      )}

      {/* Analytics (selalu tampil) */}
      <AnimatedCard title="📈 Analytics & Performance" gradient className="lg:col-span-12">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-4">📊</div>
          <p>Performance analytics will appear after track is published.</p>
          <p className="text-xs mt-2">
            Including streaming numbers, revenue tracking, and platform performance.
          </p>
        </div>
      </AnimatedCard>
    </motion.div>
  );
}
