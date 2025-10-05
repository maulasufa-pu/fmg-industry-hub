// src/app/admin/projects/[id]/components/tabs/ReferencesTab.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import type { ReferenceLinkRow, ProjectSummary } from "../../types";
import { getSupabaseClient } from "@/lib/supabase/client";

interface ReferencesTabProps {
  project: ProjectSummary;
  links: ReferenceLinkRow[] | null;
  setLinks: React.Dispatch<React.SetStateAction<ReferenceLinkRow[] | null>>;
}

const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  try { new URL(trimmed); return trimmed; } catch { return `https://${trimmed}`; }
};
const isValidHttpUrl = (value: string): boolean => {
  try { const u = new URL(value); return u.protocol === "http:" || u.protocol === "https:"; }
  catch { return false; }
};

type SpotifyType = "track" | "album" | "playlist" | "episode" | "show";
const parseTimeToSeconds = (t: string): number => {
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (!m) return 0;
  return (Number(m[1] ?? 0) * 3600) + (Number(m[2] ?? 0) * 60) + Number(m[3] ?? 0);
};
const parseYouTube = (u: URL): { id: string; start?: number } | null => {
  const host = u.hostname.replace(/^www\./, "");
  let id = "";
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0] ?? "";
  else if (host.endsWith("youtube.com")) {
    if (u.pathname.startsWith("/watch")) id = u.searchParams.get("v") ?? "";
    else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] ?? "";
    else if (u.pathname.startsWith("/live/")) id = u.pathname.split("/")[2] ?? "";
    else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] ?? "";
  }
  if (!id) return null;
  const t = u.searchParams.get("t") ?? u.searchParams.get("start");
  const start = t ? parseTimeToSeconds(t) : undefined;
  return { id, start };
};
const renderEmbed = (rawUrl: string): React.JSX.Element | null => {
  const normalized = normalizeUrl(rawUrl);
  let u: URL; try { u = new URL(normalized); } catch { return null; }
  const host = u.hostname.replace(/^www\./, "");

  // YouTube
  const yt = parseYouTube(u);
  if (yt) {
    const src = `https://www.youtube.com/embed/${yt.id}${yt.start ? `?start=${yt.start}` : ""}`;
    return (
      <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16 / 9" }}>
        <iframe
          src={src}
          className="absolute inset-0 h-full w-full"
          loading="lazy"
          title="YouTube embed"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }
  if (host.endsWith("spotify.com") || host.endsWith("open.spotify.com")) {
    const parts = u.pathname.split("/").filter(Boolean);
    const candidate = (parts[0] ?? "") as SpotifyType;
    const valid: readonly SpotifyType[] = ["track", "album", "playlist", "episode", "show"] as const;
    const isValid = (t: string): t is SpotifyType => (valid as readonly string[]).includes(t);
    if (isValid(candidate) && parts[1]) {
      const type = candidate; const id = parts[1];
      const src = `https://open.spotify.com/embed/${type}/${id}`;
      const height = type === "episode" || type === "show" ? 232 : 152;
      return <iframe src={src} className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-lg" height={height} loading="lazy" title="Spotify embed" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />;
    }
  }
  if (host.endsWith("soundcloud.com")) {
    const src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(u.toString())}&auto_play=false`;
    return <iframe src={src} className="w-full rounded-xl" height={166} loading="lazy" title="SoundCloud embed" allow="autoplay" />;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const seg = u.pathname.split("/").filter(Boolean);
    const id = seg.find((s) => /^\d+$/.test(s));
    if (id) {
      const src = `https://player.vimeo.com/video/${id}`;
      return (
        <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16 / 9" }}>
          <iframe src={src} className="absolute inset-0 h-full w-full" loading="lazy" title="Vimeo embed" allow="autoplay; fullscreen; picture-in-picture; clipboard-write" allowFullScreen />
        </div>
      );
    }
  }
  if (host.endsWith("music.apple.com")) {
    const src = `https://embed.music.apple.com${u.pathname}${u.search}`;
    return (
      <iframe
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        frameBorder={0}
        height={175}
        style={{ width: "100%", overflow: "hidden", borderRadius: "0.75rem" }}
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        src={src}
        title="Apple Music embed"
      />
    );
  }
  return null;
};

const ReferenceItem = memo(function ReferenceItem({
  row,
  onDelete,
  onSaveNote,
  deleting,
}: {
  row: ReferenceLinkRow;
  onDelete: (id: string) => void;
  onSaveNote: (id: string, value: string) => Promise<void>;
  deleting: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localNote, setLocalNote] = useState<string>(row.note ?? "");
  const [saving, setSaving] = useState(false);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isEditing) setLocalNote(row.note ?? "");
  }, [row.note, isEditing]);

  useEffect(() => {
    if (isEditing) {
      const t = setTimeout(() => {
        const el = textRef.current; el?.focus();
        if (el) { const len = el.value.length; try { el.setSelectionRange(len, len); } catch {} }
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  const handleSave = async () => {
    setSaving(true);
    try { await onSaveNote(row.id, localNote); setIsEditing(false); }
    finally { setSaving(false); }
  };

  return (
    <li className="rounded-xl">
      <div className="mb-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="bg-blue-50/90 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
          {row.created_at ? new Date(row.created_at).toLocaleString("en-US") : ""}
        </span>
      </div>

      <div className="group relative">
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
          {deleting ? (
            <span className="text-[11px] px-2 py-1 rounded-full bg-white/90 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 shadow-md border border-slate-200 dark:border-slate-700">Deleting…</span>
          ) : (
            <>
              <button
                type="button"
                className="text-[11px] px-2 py-1 rounded-full bg-white/90 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-200"
                onClick={() => setIsEditing(true)}
              >
                {row.note ? "Edit note" : "Add note"}
              </button>
              <button
                type="button"
                className="text-[11px] px-2 py-1 rounded-full bg-white/90 dark:bg-slate-900/80 text-red-600 dark:text-red-400 shadow-md border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-lg transition-all duration-200"
                onClick={() => onDelete(row.id)}
              >
                Delete
              </button>
            </>
          )}
        </div>

        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-blue-400/0 group-hover:ring-blue-400/40 transition" />

        <div className="w-full">
          {renderEmbed(row.url) ?? (
            <a
              href={normalizeUrl(row.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full aspect-[16/9] rounded-xl border-2 border-slate-200 dark:border-slate-600
                         bg-gradient-to-r from-blue-50/90 to-purple-50/90 dark:from-blue-900/30 dark:to-purple-900/30
                         grid place-content-center font-medium text-blue-600 hover:text-purple-600
                         dark:text-blue-400 dark:hover:text-purple-400 shadow-sm hover:shadow-md transition-all duration-200"
            >
              🌐 {row.url}
            </a>
          )}
        </div>
      </div>

      <div className="mt-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={textRef}
              rows={3}
              value={localNote}
              onChange={(e) => setLocalNote(e.target.value)}
              className="w-full resize-y rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white/95 dark:bg-slate-800/95 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
              placeholder="Write a note here…"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white px-4 py-2 font-medium shadow-lg shadow-blue-500/25 dark:shadow-blue-400/20 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 font-medium border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : row.note ? (
          <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 bg-slate-50/90 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-600 rounded-lg p-3 whitespace-pre-wrap shadow-sm">
            📝 {row.note}
          </p>
        ) : null}
      </div>
    </li>
  );
});

export default function ReferencesTab(
  { project, links, setLinks }: ReferencesTabProps
): React.JSX.Element {
  const supabase = getSupabaseClient();

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    const fetchLinks = async () => {
      if (links !== null) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("reference_links")
        .select("*")
        .eq("project_id", project.project_id)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        if (error) {
          setLinks([]);
          //console.error("[ReferencesTab] load error:", error);
        } else {
          setLinks(data as ReferenceLinkRow[]);
        }
        setLoading(false);
      }
    };
    void fetchLinks();

    const channel = supabase
      .channel(`reference_links:project:${project.project_id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reference_links", filter: `project_id=eq.${project.project_id}` },
        (payload) => {
          setLinks((prev) => {
            const prevArr = prev ?? [];
            if (payload.eventType === "INSERT") {
              const row = payload.new as ReferenceLinkRow;
              if (prevArr.some((r) => r.id === row.id)) return prevArr;
              return [row, ...prevArr];
            }
            if (payload.eventType === "DELETE") {
              const row = payload.old as ReferenceLinkRow;
              return prevArr.filter((r) => r.id !== row.id);
            }
            if (payload.eventType === "UPDATE") {
              const row = payload.new as ReferenceLinkRow;
              return prevArr.map((r) => (r.id === row.id ? row : r));
            }
            return prevArr;
          });
        }
      )
      .subscribe();

    return () => { cancelled = true; void supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.project_id, supabase]);

  const renderLinks = useMemo<ReferenceLinkRow[]>(() => {
    if (links === null) return [];
    const arr = links.slice();
    arr.sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });
    return arr;
  }, [links]);

  const addReference = useCallback(async (url: string, note: string) => {
    const normalized = normalizeUrl(url);
    if (!isValidHttpUrl(normalized)) { alert("Invalid URL."); return; }
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in.");

      const { data, error } = await supabase
        .from("reference_links")
        .insert({
          project_id: project.project_id,
          url: normalized,
          note: note.trim() ? note.trim() : null,
          created_by: userId,
        })
        .select("*")
        .single();

      if (error) throw error;
      setLinks((prev) => [data as ReferenceLinkRow, ...(prev ?? [])]);
    } catch (err) {
      //console.error("[ReferencesTab] add error:", err);
      alert("Failed to add link. Check RLS or policies.");
    }
  }, [project.project_id, setLinks, supabase]);

  const handleDeleteReference = useCallback(async (id: string) => {
    setDeleting((d) => ({ ...d, [id]: true }));
    let backup: ReferenceLinkRow[] | null = null;
    setLinks((prev) => { backup = prev ? [...prev] : []; return prev ? prev.filter((l) => l.id !== id) : prev; });
    try {
      const { error } = await supabase.from("reference_links").delete().eq("id", id).eq("project_id", project.project_id);
      if (error) throw error;
    } catch (err) {
      setLinks(backup);
      //console.error("[ReferencesTab] delete error:", err);
      alert("Failed to delete link. Check RLS or policies.");
    } finally {
      setDeleting((d) => { const { [id]: _removed, ...rest } = d; return rest; });
    }
  }, [project.project_id, setLinks, supabase]);

  const handleSaveNote = useCallback(async (id: string, value: string) => {
    const { data, error } = await supabase
      .from("reference_links")
      .update({ note: value })
      .eq("id", id)
      .eq("project_id", project.project_id)
      .select("*")
      .single();
    if (error) throw error;
    setLinks((prev) => (prev ? prev.map((r) => (r.id === id ? (data as ReferenceLinkRow) : r)) : prev));
  }, [project.project_id, setLinks, supabase]);

  const AddReferenceTile = React.memo(function AddReferenceTile({
    onAdd,
  }: { onAdd: (url: string, note: string) => Promise<void> | void; }) {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState("");
    const [note, setNote] = useState("");
    const [adding, setAdding] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (open) {
        const t = setTimeout(() => inputRef.current?.focus(), 0);
        return () => clearTimeout(t);
      }
    }, [open]);

    const handleSubmit = async () => {
      setAdding(true);
      try {
        await onAdd(url, note);
        setUrl(""); setNote(""); setOpen(false);
      } finally { setAdding(false); }
    };

    return (
      <div className="w-full">
        <div className="h-7 mb-2" />
        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Add Reference"
            className="group relative block w-full overflow-hidden rounded-3xl border-2 border-blue-400/60 aspect-[16/9]
                       bg-gradient-to-b from-transparent to-blue-500/5 hover:from-blue-500/10 hover:to-blue-500/20"
          >
            <div className="absolute inset-0 rounded-3xl ring-2 ring-blue-400/0 group-hover:ring-blue-400/60 transition pointer-events-none" />
            <div className="grid h-full place-content-center">
              <div className="text-6xl leading-none text-blue-500">+</div>
            </div>
          </button>
        ) : (
          <div className="rounded-3xl border-2 border-blue-400/60 p-4 bg-gradient-to-b from-transparent to-blue-500/5 min-h[260px] md:min-h-[260px]">
            <div className="text-sm text-slate-600 dark:text-slate-300 space-y-3">
              <div className="font-semibold text-slate-800 dark:text-slate-100">➕ Add Reference</div>

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">URL</label>
              <input
                ref={inputRef}
                type="url"
                inputMode="url"
                placeholder="https://example.com/reference..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white/95 dark:bg-slate-800/95 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
              />

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Notes (optional)</label>
              <textarea
                rows={3}
                placeholder="Write a short note…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full resize-y rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white/95 dark:bg-slate-800/95 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-medium shadow-lg shadow-blue-500/25 dark:shadow-blue-400/20 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                  disabled={adding || url.trim().length === 0}
                >
                  {adding ? "Adding…" : "Add Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="relative overflow-hidden rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 dark:shadow-black/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm col-span-1 lg:col-span-2">
        <div className="relative z-10 p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 dark:from-slate-100 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              🔗 References Feed
            </h3>
          </div>

          {loading || links === null ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">Loading…</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {renderLinks.length === 0 ? (
                <li key="add-empty"><AddReferenceTile onAdd={addReference} /></li>
              ) : (
                <>
                  <ReferenceItem
                    key={renderLinks[0].id}
                    row={renderLinks[0]}
                    onDelete={handleDeleteReference}
                    onSaveNote={handleSaveNote}
                    deleting={!!deleting[renderLinks[0].id]}
                  />
                  <li key="add-tile"><AddReferenceTile onAdd={addReference} /></li>
                  {renderLinks.slice(1).map((r) => (
                    <ReferenceItem
                      key={r.id}
                      row={r}
                      onDelete={handleDeleteReference}
                      onSaveNote={handleSaveNote}
                      deleting={!!deleting[r.id]}
                    />
                  ))}
                </>
              )}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
