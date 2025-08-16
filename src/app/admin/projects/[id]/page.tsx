// src/app/admin/projects/[id]/page.tsx
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";

type ProjectStatus =
  | "pending"
  | "in_progress"
  | "revision"
  | "approved"
  | "published"
  | "archived"
  | "cancelled";

/** Disesuaikan dengan alur bisnis */
type ProjectStage =
  | "request_review"        // request baru masuk, menunggu verifikasi admin
  | "awaiting_payment"      // menunggu pembayaran klien
  | "assign_team"           // assign A&R/Engineer/Composer/Producer/Sound Designer
  | "draft1_work"           // pengerjaan draft 1
  | "draft1_review"         // review draft 1 oleh client + QC A&R
  | "finalization"          // finalisasi mixing/mastering
  | "metadata"              // pengisian metadata
  | "agreement"             // penandatanganan agreement/kontrak
  | "publishing"            // kirim ke distributor & proses rilis
  | "post_release";         // monitoring setelah rilis

type ProjectSummary = {
  id: string;
  project_name: string;
  artist_name: string | null;
  album_title: string | null;
  genre: string | null;
  sub_genre: string | null;
  description: string | null;
  payment_plan: string | null;
  start_date: string | null;
  deadline: string | null;
  delivery_format: string | null;
  nda_required: boolean | null;
  preferred_engineer_id: string | null;
  preferred_engineer_name: string | null;
  stage: ProjectStage | string | null;
  status: ProjectStatus;
  progress_percent: number | null;
  budget_amount: number | null;
  budget_currency: string | null;
  assigned_pic: string | null;
  engineer_name: string | null;
  anr_name: string | null;
  latest_update: string | null;
};

type DraftRow = {
  draft_id: string;
  project_id: string;
  file_path: string;
  uploaded_by: string | null;
  version: number;
  created_at: string | null;
};

type RevisionRow = {
  revision_id: string;
  draft_id: string;
  requested_by: string | null;
  reason: string | null;
  created_at: string | null;
};

type DiscussionMessage = {
  id: string;
  project_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
};

type MeetingRow = {
  id: string;
  project_id: string;
  title: string;
  start_at: string; // ISO
  duration_min: number;
  link: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

type ReferenceLinkRow = {
  id: string;
  project_id: string;
  url: string;
  created_at: string | null;
};

const Card: React.FC<React.PropsWithChildren<{ title: string; right?: React.ReactNode }>> = ({
  title,
  right,
  children,
}) => (
  <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {right}
    </div>
    {children}
  </section>
);

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
    {children}
  </span>
);

const ProgressBar = ({ value = 0 }: { value?: number | null }) => {
  const pct = Math.max(0, Math.min(100, Number(value ?? 0)));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
      <div className="h-full bg-blue-600 transition-[width] duration-500 ease-in-out" style={{ width: `${pct}%` }} />
    </div>
  );
};

export default function AdminProjectDetailPage(): React.JSX.Element {
  useFocusWarmAuth();

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(() => getSupabaseClient(), []);

  // ---- data states
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[] | null>(null);
  const [revisions, setRevisions] = useState<RevisionRow[] | null>(null);
  const [links, setLinks] = useState<ReferenceLinkRow[] | null>(null);
  const [messages, setMessages] = useState<DiscussionMessage[] | null>(null);
  const [meetings, setMeetings] = useState<MeetingRow[] | null>(null);

  // ---- admin controls local form
  const [edit, setEdit] = useState({
    project_name: "",
    artist_name: "",
    album_title: "",
    genre: "",
    sub_genre: "",
    payment_plan: "" as string,
    start_date: "" as string,
    deadline: "" as string,
    delivery_format: "",
    nda_required: false,
    preferred_engineer_id: "" as string,
    preferred_engineer_name: "" as string,
    stage: "" as string,
    status: "pending" as ProjectStatus,
    progress_percent: 0,
    budget_amount: "" as string,
    budget_currency: "" as string,
    assigned_pic: "" as string,
    engineer_name: "" as string,
    anr_name: "" as string,
    description: "" as string,
  });

  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"overview" | "drafts" | "references" | "discussion" | "meetings">(
    (searchParams.get("tab") as "overview" | "drafts" | "references" | "discussion" | "meetings") ?? "overview"
  );

  const realtimeBoundRef = useRef(false);

  const raceWithTimeout = <T,>(p: PromiseLike<T>, ms = 8000): Promise<T> =>
    Promise.race([Promise.resolve(p), new Promise<T>((_, rj) => setTimeout(() => rj(new Error("timeout")), ms))]);

  // ---- load initial
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await supabase.auth.getSession();

        // project summary
        const { data: proj, error: perr } = await raceWithTimeout(
          supabase
            .from("project_summary")
            .select(
              "id,project_name,artist_name,album_title,genre,sub_genre,description,payment_plan,start_date,deadline,delivery_format,nda_required,preferred_engineer_id,preferred_engineer_name,stage,status,progress_percent,budget_amount,budget_currency,assigned_pic,engineer_name,anr_name,latest_update"
            )
            .eq("id", params.id)
            .maybeSingle<ProjectSummary>()
        );
        if (perr || !proj) {
          console.error(perr);
          router.replace("/admin/projects");
          return;
        }
        if (!mounted) return;

        setProject(proj);
        setEdit({
          project_name: proj.project_name,
          artist_name: proj.artist_name ?? "",
          album_title: proj.album_title ?? "",
          genre: proj.genre ?? "",
          sub_genre: proj.sub_genre ?? "",
          payment_plan: proj.payment_plan ?? "",
          start_date: proj.start_date ? proj.start_date.slice(0, 10) : "",
          deadline: proj.deadline ? proj.deadline.slice(0, 10) : "",
          delivery_format: proj.delivery_format ?? "",
          nda_required: Boolean(proj.nda_required),
          preferred_engineer_id: proj.preferred_engineer_id ?? "",
          preferred_engineer_name: proj.preferred_engineer_name ?? "",
          stage: (proj.stage as string) ?? "",
          status: proj.status,
          progress_percent: Number(proj.progress_percent ?? 0),
          budget_amount: proj.budget_amount != null ? String(proj.budget_amount) : "",
          budget_currency: (proj.budget_currency ?? "IDR").toUpperCase(),
          assigned_pic: proj.assigned_pic ?? "",
          engineer_name: proj.engineer_name ?? "",
          anr_name: proj.anr_name ?? "",
          description: proj.description ?? "",
        });
      } catch (e) {
        console.error(e);
        router.replace("/admin/projects");
        return;
      } finally {
        if (mounted) setLoading(false);
      }

      // background loads
      supabase
        .from("drafts")
        .select("draft_id,project_id,file_path,uploaded_by,version,created_at")
        .eq("project_id", params.id)
        .order("version", { ascending: false })
        .returns<DraftRow[]>()
        .then(({ data, error }) => {
          if (!mounted) return;
          if (error) console.error(error);
          setDrafts(data ?? []);
        });

      supabase
        .from("revisions")
        .select("revision_id,draft_id,requested_by,reason,created_at")
        .order("created_at", { ascending: false })
        .returns<RevisionRow[]>()
        .then(({ data, error }) => {
          if (!mounted) return;
          if (error) console.error(error);
          setRevisions(data ?? []);
        });

      supabase
        .from("project_reference_links")
        .select("id,project_id,url,created_at")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })
        .returns<ReferenceLinkRow[]>()
        .then(({ data, error }) => {
          if (!mounted) return;
          if (error) console.error(error);
          setLinks(data ?? []);
        });

      supabase
        .from("discussion_messages")
        .select("id,project_id,author_id,content,created_at")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })
        .returns<DiscussionMessage[]>()
        .then(({ data, error }) => {
          if (!mounted) return;
          if (error) console.error(error);
          setMessages(data ?? []);
        });

      supabase
        .from("meetings")
        .select("id,project_id,title,start_at,duration_min,link,notes,created_by,created_at")
        .eq("project_id", params.id)
        .order("start_at", { ascending: false })
        .returns<MeetingRow[]>()
        .then(({ data, error }) => {
          if (!mounted) return;
          if (error) console.error(error);
          setMeetings(data ?? []);
        });
    })();

    return () => {
      mounted = false;
    };
  }, [params.id, router, supabase]);

  // realtime minimal (discussion & meetings insert)
  useEffect(() => {
    if (!project) return;
    if (realtimeBoundRef.current) return;
    realtimeBoundRef.current = true;

    const ch = supabase.channel(`realtime:admin-project:${project.id}`);

    ch.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "discussion_messages", filter: `project_id=eq.${project.id}` },
      (payload) => {
        const row = payload.new as DiscussionMessage;
        setMessages((prev) => {
          const list = prev ?? [];
          if (list.some((x) => x.id === row.id)) return list;
          return [...list, row];
        });
      }
    );

    ch.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "meetings", filter: `project_id=eq.${project.id}` },
      (payload) => {
        const row = payload.new as MeetingRow;
        setMeetings((prev) => {
          const list = prev ?? [];
          if (list.some((x) => x.id === row.id)) return list;
          return [row, ...list].sort((a, b) => b.start_at.localeCompare(a.start_at));
        });
      }
    );

    void ch.subscribe();

    return () => {
      void supabase.removeChannel(ch);
      realtimeBoundRef.current = false;
    };
  }, [project, supabase]);

  // revisions by draft
  const revByDraft = useMemo(() => {
    const m = new Map<string, RevisionRow[]>();
    (revisions ?? []).forEach((r) => {
      const arr = m.get(r.draft_id) ?? [];
      arr.push(r);
      m.set(r.draft_id, arr);
    });
    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));
      m.set(k, arr);
    }
    return m;
  }, [revisions]);

  // ---- helpers
  const statusLabelMap: Record<ProjectStatus, string> = {
    pending: "Not Started",
    in_progress: "In Progress",
    revision: "Under Review",
    approved: "Approved",
    published: "Published",
    archived: "Archived",
    cancelled: "Cancelled",
  };

  const setStatus = async (status: ProjectStatus): Promise<void> => {
    try {
      const { error } = await supabase.from("projects").update({ status }).eq("project_id", params.id);
      if (error) throw error;
      setProject((p) => (p ? { ...p, status } : p));
      setEdit((s) => ({ ...s, status }));
    } catch (e) {
      console.error(e);
      alert("Gagal update status (cek RLS).");
    }
  };

  const setStage = async (stage: ProjectStage): Promise<void> => {
    try {
      const { error } = await supabase.from("projects").update({ stage }).eq("project_id", params.id);
      if (error) throw error;
      setProject((p) => (p ? { ...p, stage } : p));
      setEdit((s) => ({ ...s, stage }));
    } catch (e) {
      console.error(e);
      alert("Gagal update stage (cek RLS).");
    }
  };

  const saveProject = async (): Promise<void> => {
    if (!project) return;
    setSaving(true);
    try {
      const payload = {
        project_name: edit.project_name.trim() || null,
        artist_name: edit.artist_name.trim() || null,
        album_title: edit.album_title.trim() || null,
        genre: edit.genre.trim() || null,
        sub_genre: edit.sub_genre.trim() || null,
        description: edit.description.trim() || null,
        payment_plan: edit.payment_plan || null,
        start_date: edit.start_date ? new Date(edit.start_date).toISOString() : null,
        deadline: edit.deadline ? new Date(edit.deadline).toISOString() : null,
        delivery_format: edit.delivery_format.trim() || null,
        nda_required: Boolean(edit.nda_required),
        preferred_engineer_id: edit.preferred_engineer_id || null,
        preferred_engineer_name: edit.preferred_engineer_name.trim() || null,
        stage: (edit.stage || null) as ProjectStage | null,
        status: edit.status as ProjectStatus,
        progress_percent: Number.isFinite(Number(edit.progress_percent))
          ? Math.max(0, Math.min(100, Math.round(Number(edit.progress_percent))))
          : 0,
        budget_amount: edit.budget_amount ? Number(edit.budget_amount) : null,
        budget_currency: edit.budget_currency.trim() || null,
        assigned_pic: edit.assigned_pic.trim() || null,
        engineer_name: edit.engineer_name.trim() || null,
        anr_name: edit.anr_name.trim() || null,
      };

      const { error } = await supabase.from("projects").update(payload).eq("project_id", params.id);
      if (error) throw error;

      // refresh header state (optimistic)
      setProject((p) =>
        p
          ? {
              ...p,
              project_name: payload.project_name ?? p.project_name,
              artist_name: payload.artist_name ?? p.artist_name,
              album_title: payload.album_title ?? p.album_title,
              genre: payload.genre ?? p.genre,
              sub_genre: payload.sub_genre ?? p.sub_genre,
              description: payload.description ?? p.description,
              payment_plan: payload.payment_plan ?? p.payment_plan,
              start_date: payload.start_date ?? p.start_date,
              deadline: payload.deadline ?? p.deadline,
              delivery_format: payload.delivery_format ?? p.delivery_format,
              nda_required: payload.nda_required,
              preferred_engineer_id: payload.preferred_engineer_id,
              preferred_engineer_name: payload.preferred_engineer_name ?? p.preferred_engineer_name,
              stage: (payload.stage as string | null) ?? p.stage,
              status: payload.status ?? p.status,
              progress_percent: payload.progress_percent ?? p.progress_percent,
              budget_amount: payload.budget_amount ?? p.budget_amount,
              budget_currency: payload.budget_currency ?? p.budget_currency,
              assigned_pic: payload.assigned_pic ?? p.assigned_pic,
              engineer_name: payload.engineer_name ?? p.engineer_name,
              anr_name: payload.anr_name ?? p.anr_name,
            }
          : p
      );
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan perubahan. Periksa RLS/permission untuk tabel 'projects'.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-gray-500 shadow">Loading project…</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-gray-500 shadow">Project not found.</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/admin/projects" className="hover:underline">
              Projects (Admin)
            </Link>
          </li>
          <li>›</li>
          <li className="max-w-[50vw] truncate font-medium text-gray-800">{project.project_name}</li>
        </ol>
      </nav>

      {/* Header: Summary + Quick controls + Workflow actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Project Summary"
          right={
            <div className="flex items-center gap-2">
              <Tag>{(project.stage as string) || "No Stage"}</Tag>
              <Tag>{project.status}</Tag>
            </div>
          }
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="w-32 text-gray-500">Project</span>
              <span className="flex-1 text-gray-800">{project.project_name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="w-32 text-gray-500">Artist</span>
              <span className="flex-1 text-gray-800">{project.artist_name ?? "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="w-32 text-gray-500">Genre</span>
              <span className="flex-1 text-gray-800">{project.genre ?? "-"}</span>
            </div>
            <div className="pt-2">
              <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                <span>Overall Progress</span>
                <span>{project.progress_percent ?? 0}%</span>
              </div>
              <ProgressBar value={project.progress_percent} />
            </div>
          </div>
        </Card>

        {/* Quick edits */}
        <Card title="Quick Controls">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-gray-500">Status</label>
              <select
                value={edit.status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5"
              >
                {(["pending","in_progress","revision","approved","published","archived","cancelled"] as ProjectStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {s} — {statusLabelMap[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-xs text-gray-500">Stage</label>
              <select
                value={edit.stage}
                onChange={(e) => setStage(e.target.value as ProjectStage)}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5"
              >
                {[
                  "request_review",
                  "awaiting_payment",
                  "assign_team",
                  "draft1_work",
                  "draft1_review",
                  "finalization",
                  "metadata",
                  "agreement",
                  "publishing",
                  "post_release",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-xs text-gray-500">Progress (%)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={edit.progress_percent}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setEdit((p) => ({ ...p, progress_percent: v }));
                }}
                className="w-full"
              />
              <div className="mt-1 text-xs text-gray-600">{edit.progress_percent}%</div>
            </div>
          </div>
        </Card>

        {/* Workflow actions sesuai alur */}
        <Card title="Workflow Actions">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <button
              onClick={async () => {
                await setStatus("in_progress");
                await setStage("awaiting_payment");
              }}
              className="rounded-md bg-gray-800 px-3 py-2 text-white hover:bg-black"
            >
              Accept Project
            </button>
            <button
              onClick={async () => {
                await setStage("assign_team");
              }}
              className="rounded-md border px-3 py-2 hover:bg-gray-50"
            >
              Mark Payment Received
            </button>
            <button
              onClick={async () => {
                await setStage("draft1_work");
              }}
              className="rounded-md border px-3 py-2 hover:bg-gray-50"
            >
              Move to Draft 1
            </button>
            <button
              onClick={async () => {
                await setStatus("revision");
                await setStage("draft1_review");
              }}
              className="rounded-md bg-amber-600 px-3 py-2 text-white hover:bg-amber-700"
            >
              Request Revision
            </button>
            <button
              onClick={async () => {
                await setStatus("approved");
                await setStage("metadata");
              }}
              className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
            >
              Approve Final
            </button>
            <button
              onClick={async () => {
                await setStage("publishing");
              }}
              className="rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
            >
              Send to Publishing
            </button>
            <button
              onClick={async () => {
                await setStatus("published");
                await setStage("post_release");
              }}
              className="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 col-span-2"
            >
              Mark Released
            </button>
          </div>
        </Card>
      </div>

      {/* Assignments */}
      <Card title="Assignments">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <label className="mb-1 block text-xs text-gray-500">PIC</label>
            <input
              value={edit.assigned_pic}
              onChange={(e) => setEdit((p) => ({ ...p, assigned_pic: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Engineer</label>
            <input
              value={edit.engineer_name}
              onChange={(e) => setEdit((p) => ({ ...p, engineer_name: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">A&amp;R</label>
            <input
              value={edit.anr_name}
              onChange={(e) => setEdit((p) => ({ ...p, anr_name: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Preferred Engineer</label>
            <input
              value={edit.preferred_engineer_name}
              onChange={(e) => setEdit((p) => ({ ...p, preferred_engineer_name: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5"
            />
          </div>
          {/* Jika kamu nanti menambah kolom composer/producer/sound_designer di DB, tinggal tambahkan input di sini */}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={saveProject}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { key: "overview", label: "Overview & Details" },
          { key: "drafts", label: "Drafts" },
          { key: "references", label: "References" },
          { key: "discussion", label: "Discussion" },
          { key: "meetings", label: "Meetings" },
        ].map((t) => {
          const k = t.key as typeof activeTab;
          const act = activeTab === k;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(k)}
              className={`px-3 py-2 text-sm ${act ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-blue-600"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW & EDIT FORM */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card title="Main Info">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Project Name</label>
                <input
                  value={edit.project_name}
                  onChange={(e) => setEdit((p) => ({ ...p, project_name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Artist</label>
                <input
                  value={edit.artist_name}
                  onChange={(e) => setEdit((p) => ({ ...p, artist_name: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Album</label>
                <input
                  value={edit.album_title}
                  onChange={(e) => setEdit((p) => ({ ...p, album_title: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Genre</label>
                <input
                  value={edit.genre}
                  onChange={(e) => setEdit((p) => ({ ...p, genre: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Sub-Genre</label>
                <input
                  value={edit.sub_genre}
                  onChange={(e) => setEdit((p) => ({ ...p, sub_genre: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Description</label>
                <textarea
                  value={edit.description}
                  onChange={(e) => setEdit((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 p-3"
                />
              </div>
            </div>
          </Card>

          <Card title="Budget & Payment">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Budget Amount</label>
                <input
                  inputMode="decimal"
                  value={edit.budget_amount}
                  onChange={(e) => setEdit((p) => ({ ...p, budget_amount: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Currency</label>
                <input
                  value={edit.budget_currency}
                  onChange={(e) => setEdit((p) => ({ ...p, budget_currency: e.target.value.toUpperCase() }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="IDR"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Payment Plan</label>
                <select
                  value={edit.payment_plan}
                  onChange={(e) => setEdit((p) => ({ ...p, payment_plan: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">(select)</option>
                  <option value="upfront">100% Up-front</option>
                  <option value="half">50% DP / 50% Delivery</option>
                  <option value="milestone">Milestone (25–50–25)</option>
                </select>
              </div>
            </div>
          </Card>

          <Card title="Schedule & NDA / Delivery">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Start Date</label>
                <input
                  type="date"
                  value={edit.start_date}
                  onChange={(e) => setEdit((p) => ({ ...p, start_date: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Deadline</label>
                <input
                  type="date"
                  value={edit.deadline}
                  onChange={(e) => setEdit((p) => ({ ...p, deadline: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Delivery Format</label>
                <input
                  value={edit.delivery_format}
                  onChange={(e) => setEdit((p) => ({ ...p, delivery_format: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <label className="col-span-2 inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={edit.nda_required}
                  onChange={(e) => setEdit((p) => ({ ...p, nda_required: e.target.checked }))}
                />
                NDA Required
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* DRAFTS */}
      {activeTab === "drafts" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Drafts (Admin)">
            {drafts === null ? (
              <div className="text-sm text-gray-500">Loading drafts…</div>
            ) : drafts.length ? (
              <ul className="space-y-3 text-sm">
                {drafts.map((d) => {
                  const list = revByDraft.get(d.draft_id) ?? [];
                  return (
                    <li key={d.draft_id} className="rounded-md border border-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">v{d.version}</span>
                        <span className="text-xs text-gray-500">
                          {d.created_at ? new Date(d.created_at).toLocaleString("id-ID") : "-"}
                        </span>
                      </div>
                      <div className="mt-1 break-all text-gray-600">{d.file_path}</div>
                      <div className="mt-1 text-xs text-gray-500">Uploaded by: {d.uploaded_by ?? "-"}</div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={d.file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          Open
                        </a>
                        <button
                          onClick={async () => {
                            try {
                              await setStatus("approved");
                              await setStage("metadata");
                            } catch (e) {
                              console.error(e);
                              alert("Gagal set Approved.");
                            }
                          }}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
                        >
                          Approve Final
                        </button>
                        <button
                          onClick={async () => {
                            const reason = window.prompt("Alasan/revisi?");
                            if (reason === null) return;
                            try {
                              const { error } = await supabase.from("revisions").insert({
                                draft_id: d.draft_id,
                                reason,
                              });
                              if (error) throw error;
                              setRevisions((prev) => [
                                ...(prev ?? []),
                                {
                                  revision_id: crypto.randomUUID(),
                                  draft_id: d.draft_id,
                                  requested_by: null,
                                  reason,
                                  created_at: new Date().toISOString(),
                                },
                              ]);
                              await setStatus("revision");
                              await setStage("draft1_review");
                            } catch (e) {
                              console.error(e);
                              alert("Gagal request revision.");
                            }
                          }}
                          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs text-white hover:bg-amber-700"
                        >
                          Request Revision
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await setStage("publishing");
                            } catch (e) {
                              console.error(e);
                              alert("Gagal kirim ke Publishing.");
                            }
                          }}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
                        >
                          Send to Publishing
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await setStatus("published");
                              await setStage("post_release");
                            } catch (e) {
                              console.error(e);
                              alert("Gagal mark Released.");
                            }
                          }}
                          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-700"
                        >
                          Mark Released
                        </button>
                      </div>

                      {list.length > 0 && (
                        <div className="mt-3 rounded-md bg-gray-50 p-2">
                          <div className="mb-1 text-xs font-medium text-gray-700">Revision History</div>
                          <ul className="space-y-1">
                            {list.map((rv) => (
                              <li key={rv.revision_id} className="text-xs text-gray-600">
                                <span className="font-medium">{rv.requested_by ?? "Unknown"}</span> — {rv.reason ?? "-"}
                                <span className="ml-2 text-[11px] text-gray-400">
                                  {rv.created_at ? new Date(rv.created_at).toLocaleString("id-ID") : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">Belum ada draft.</div>
            )}
          </Card>

          <Card title="Notes / QA Checklist">
            <div className="text-sm text-gray-500">Tempat admin/A&amp;R menyimpan catatan QC internal (draft 1 → final).</div>
          </Card>
        </div>
      )}

      {/* REFERENCES */}
      {activeTab === "references" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="References Feed">
            {links === null ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : links.length === 0 ? (
              <div className="text-sm text-gray-500">Belum ada link.</div>
            ) : (
              <ul className="space-y-3 text-sm">
                {links.map((l) => (
                  <li key={l.id} className="rounded-md border border-gray-200 p-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{l.created_at ? new Date(l.created_at).toLocaleString("id-ID") : ""}</span>
                      <DeleteReferenceButton id={l.id} onDeleted={() => setLinks((prev) => (prev ? prev.filter((x) => x.id !== l.id) : prev))} />
                    </div>
                    <a href={l.url} target="_blank" rel="noreferrer" className="break-all text-blue-600 hover:underline">
                      {l.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Add Reference (Admin)">
            <ReferenceAdder
              projectId={params.id}
              onAdded={(row) => setLinks((prev) => (prev ? [row, ...prev] : [row]))}
            />
          </Card>
        </div>
      )}

      {/* DISCUSSION */}
      {activeTab === "discussion" && (
        <Card title="Discussion (Admin moderation)">
          <div className="flex flex-col gap-3">
            {messages === null ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-gray-500">Belum ada pesan.</div>
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li key={m.id} className="rounded-md border border-gray-200 p-2">
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{m.author_id ?? "Anon"}</span>
                      <span>{new Date(m.created_at).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-gray-800">{m.content}</div>
                    <div className="mt-2 flex gap-2">
                      <DeleteMessageButton id={m.id} onDeleted={() => setMessages((prev) => (prev ? prev.filter((x) => x.id !== m.id) : prev))} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      )}

      {/* MEETINGS */}
      {activeTab === "meetings" && (
        <Card title="Meetings (Admin)">
          {meetings === null ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : meetings.length === 0 ? (
            <div className="text-sm text-gray-500">Belum ada meeting.</div>
          ) : (
            <ul className="space-y-3">
              {meetings.map((m) => {
                const start = new Date(m.start_at);
                const end = new Date(start.getTime() + m.duration_min * 60_000);
                return (
                  <li key={m.id} className="rounded-md border border-gray-200 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-800">{m.title}</div>
                      <div className="text-xs text-gray-500">
                        {start.toLocaleString("id-ID")} –{" "}
                        {end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {m.notes && <div className="mt-1 text-gray-700">{m.notes}</div>}
                    <div className="mt-2 flex items-center gap-2">
                      {m.link ? (
                        <a
                          className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                          href={m.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Join
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No link</span>
                      )}
                      <CancelMeetingButton id={m.id} onCancelled={() => setMeetings((prev) => (prev ? prev.filter((x) => x.id !== m.id) : prev))} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

/** ---------- small button components (supaya tidak duplikasi fungsi) ---------- */

function DeleteReferenceButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  return (
    <button
      onClick={async () => {
        if (!confirm("Hapus link referensi ini?")) return;
        try {
          const { error } = await supabase.from("project_reference_links").delete().eq("id", id);
          if (error) throw error;
          onDeleted();
        } catch (e) {
          console.error(e);
          alert("Gagal hapus link (cek RLS).");
        }
      }}
      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
    >
      Delete
    </button>
  );
}

function DeleteMessageButton({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  return (
    <button
      onClick={async () => {
        if (!confirm("Hapus pesan diskusi ini?")) return;
        try {
          const { error } = await supabase.from("discussion_messages").delete().eq("id", id);
          if (error) throw error;
          onDeleted();
        } catch (e) {
          console.error(e);
          alert("Gagal hapus pesan (cek RLS).");
        }
      }}
      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
    >
      Delete
    </button>
  );
}

function CancelMeetingButton({ id, onCancelled }: { id: string; onCancelled: () => void }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  return (
    <button
      onClick={async () => {
        if (!confirm("Batalkan meeting ini?")) return;
        try {
          const { error } = await supabase.from("meetings").delete().eq("id", id);
          if (error) throw error;
          onCancelled();
        } catch (e) {
          console.error(e);
          alert("Gagal membatalkan meeting (cek RLS).");
        }
      }}
      className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
    >
      Cancel
    </button>
  );
}

/** ---------- child component: add reference (admin) ---------- */
function ReferenceAdder({
  projectId,
  onAdded,
}: {
  projectId: string;
  onAdded: (row: ReferenceLinkRow) => void;
}): React.JSX.Element {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [url, setUrl] = useState("");
  const [posting, setPosting] = useState(false);

  const add = useCallback(async () => {
    const raw = url.trim();
    if (!raw) return;
    try {
      // simple validate
      // eslint-disable-next-line no-new
      new URL(raw);
    } catch {
      alert("URL tidak valid.");
      return;
    }
    setPosting(true);
    try {
      const { data, error } = await supabase
        .from("project_reference_links")
        .insert({ project_id: projectId, url: raw })
        .select("id,project_id,url,created_at")
        .single<ReferenceLinkRow>();
      if (error) throw error;
      onAdded(data);
      setUrl("");
    } catch (e) {
      console.error(e);
      alert("Gagal menambah link (cek RLS 'project_reference_links').");
    } finally {
      setPosting(false);
    }
  }, [projectId, supabase, url, onAdded]);

  return (
    <div className="space-y-3">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste URL…"
        className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
      />
      <div className="flex justify-end">
        <button
          disabled={posting || !url.trim()}
          onClick={add}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {posting ? "Posting…" : "Add Link"}
        </button>
      </div>
    </div>
  );
}
