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

type ProjectStage =
  | "request_review"
  | "awaiting_payment"
  | "assign_team"
  | "draft1_work"
  | "draft1_review"
  | "finalization"
  | "metadata"
  | "agreement"
  | "publishing"
  | "post_release";

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
  engineer_name: string | null;  // Audio Engineer
  anr_name: string | null;       // A&R
  /** Optional jika kamu tambahkan kolom ini di DB */
  composer_name?: string | null;
  producer_name?: string | null;
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

/** Sumber opsi dropdown (optional) */
type TeamOption = { id: string; name: string; role: string };

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

export default function AdminProjectDetailPage(): React.JSX.Element {
  useFocusWarmAuth();

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[] | null>(null);
  const [revisions, setRevisions] = useState<RevisionRow[] | null>(null);
  const [links, setLinks] = useState<ReferenceLinkRow[] | null>(null);
  const [messages, setMessages] = useState<DiscussionMessage[] | null>(null);
  const [meetings, setMeetings] = useState<MeetingRow[] | null>(null);

  // Assignment state (editable)
  const [anrName, setAnrName] = useState<string>("");
  const [composerName, setComposerName] = useState<string>("");
  const [producerName, setProducerName] = useState<string>("");
  const [engineerName, setEngineerName] = useState<string>("");

  // Read-only mirror for Overview
  const [view, setView] = useState({
    project_name: "",
    artist_name: "",
    album_title: "",
    genre: "",
    sub_genre: "",
    start_date: "",
    deadline: "",
    description: "",
    budget_amount: "",
    budget_currency: "IDR",
    payment_plan: "",
  });

  const [activeTab, setActiveTab] = useState<"overview" | "drafts" | "references" | "discussion" | "meetings">(
    (searchParams.get("tab") as any) ?? "overview"
  );

  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]); // optional source for datalist
  const realtimeBoundRef = useRef(false);

  const raceWithTimeout = <T,>(p: PromiseLike<T>, ms = 8000): Promise<T> =>
    Promise.race([Promise.resolve(p), new Promise<T>((_, rj) => setTimeout(() => rj(new Error("timeout")), ms))]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await supabase.auth.getSession();

        // summary
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

        // Assignments (editable)
        setAnrName(proj.anr_name ?? "");
        setEngineerName(proj.engineer_name ?? "");
        // composer/producer mungkin belum ada di view → tetap kosong
        setComposerName((proj as any)?.composer_name ?? "");
        setProducerName((proj as any)?.producer_name ?? "");

        // Overview read-only mirror
        setView({
          project_name: proj.project_name,
          artist_name: proj.artist_name ?? "",
          album_title: proj.album_title ?? "",
          genre: proj.genre ?? "",
          sub_genre: proj.sub_genre ?? "",
          start_date: proj.start_date ? proj.start_date.slice(0, 10) : "",
          deadline: proj.deadline ? proj.deadline.slice(0, 10) : "",
          description: proj.description ?? "",
          budget_amount: proj.budget_amount != null ? String(proj.budget_amount) : "",
          budget_currency: (proj.budget_currency ?? "IDR").toUpperCase(),
          payment_plan: proj.payment_plan ?? "",
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
        .then(({ data }) => mounted && setDrafts(data ?? []));

      supabase
        .from("revisions")
        .select("revision_id,draft_id,requested_by,reason,created_at")
        .order("created_at", { ascending: false })
        .returns<RevisionRow[]>()
        .then(({ data }) => mounted && setRevisions(data ?? []));

      supabase
        .from("project_reference_links")
        .select("id,project_id,url,created_at")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })
        .returns<ReferenceLinkRow[]>()
        .then(({ data }) => mounted && setLinks(data ?? []));

      supabase
        .from("discussion_messages")
        .select("id,project_id,author_id,content,created_at")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })
        .returns<DiscussionMessage[]>()
        .then(({ data }) => mounted && setMessages(data ?? []));

      supabase
        .from("meetings")
        .select("id,project_id,title,start_at,duration_min,link,notes,created_by,created_at")
        .eq("project_id", params.id)
        .order("start_at", { ascending: false })
        .returns<MeetingRow[]>()
        .then(({ data }) => mounted && setMeetings(data ?? []));

      // Optional: load team options (abaikan error jika tabel tidak ada)
      try {
        const { data } = await supabase
            .from("team_members")
            .select("id,name,role")
            .returns<TeamOption[]>();

        if (mounted) setTeamOptions(data ?? []);
        } catch (error) {
        // handle error
        }
    })();

    return () => {
      mounted = false;
    };
  }, [params.id, router, supabase]);

  // realtime (diskusi + meetings)
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

  // helpers
  const setStatus = async (status: ProjectStatus): Promise<void> => {
    try {
      const { error } = await supabase.from("projects").update({ status }).eq("project_id", params.id);
      if (error) throw error;
      setProject((p) => (p ? { ...p, status } : p));
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
    } catch (e) {
      console.error(e);
      alert("Gagal update stage (cek RLS).");
    }
  };

  const saveAssignments = async (): Promise<void> => {
    try {
      // Selalu simpan A&R & Engineer (kolom sudah ada)
      const basePayload: Record<string, string | null> = {
        anr_name: anrName.trim() || null,
        engineer_name: engineerName.trim() || null,
      };

      // Opsional: simpan composer/producer jika kolom tersedia
      // Agar aman dari error "column does not exist", cek via RPC ringan (skip di sini), atau
      // langsung tambahkan kolom di DB sesuai SQL di bawah.
      // Jika kamu SUDAH menambah kolom, baris di bawah bisa diaktifkan:
      (basePayload as any).composer_name = composerName.trim() || null;
      (basePayload as any).producer_name = producerName.trim() || null;

      const { error } = await supabase.from("projects").update(basePayload).eq("project_id", params.id);
      if (error) throw error;

      setProject((p) =>
        p
          ? {
              ...p,
              anr_name: basePayload.anr_name,
              engineer_name: basePayload.engineer_name,
              composer_name: (basePayload as any).composer_name ?? (p as any).composer_name,
              producer_name: (basePayload as any).producer_name ?? (p as any).producer_name,
            }
          : p
      );
      alert("Assignments saved.");
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan assignments. Cek kolom/permission.");
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

  // Helper untuk opsi datalist per role
  const optsFor = (roleKey: string) =>
    teamOptions.filter((o) => o.role?.toLowerCase() === roleKey).map((o) => o.name);

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

      {/* Actions only (Project summary & Quick controls removed) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Actions">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <button
              onClick={async () => {
                await setStatus("in_progress");
                await setStage("awaiting_payment");
              }}
              className="rounded-md bg-gray-800 px-3 py-2 text-white hover:bg-black"
            >
              Accept Project
            </button>
          </div>
        </Card>

        {/* Project Assignment */}
        <Card title="Project Assignment">
          {/* A&R, Composer, Producer, Audio Engineer — datalist: bisa pilih & bisa ketik */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-gray-500">A&amp;R</label>
              <input
                list="anrOptions"
                value={anrName}
                onChange={(e) => setAnrName(e.target.value)}
                placeholder="Ketik atau pilih…"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <datalist id="anrOptions">
                {optsFor("a&r").concat(optsFor("anr")).map((name) => (
                  <option key={`anr-${name}`} value={name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">Composer</label>
              <input
                list="composerOptions"
                value={composerName}
                onChange={(e) => setComposerName(e.target.value)}
                placeholder="Ketik atau pilih…"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <datalist id="composerOptions">
                {optsFor("composer").map((name) => (
                  <option key={`composer-${name}`} value={name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">Producer</label>
              <input
                list="producerOptions"
                value={producerName}
                onChange={(e) => setProducerName(e.target.value)}
                placeholder="Ketik atau pilih…"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <datalist id="producerOptions">
                {optsFor("producer").map((name) => (
                  <option key={`producer-${name}`} value={name} />
                ))}
              </datalist>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="mb-1 block text-xs text-gray-500">Audio Engineer</label>
              <input
                list="engineerOptions"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                placeholder="Ketik atau pilih…"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <datalist id="engineerOptions">
                {optsFor("engineer").concat(optsFor("audio engineer")).map((name) => (
                  <option key={`engineer-${name}`} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={saveAssignments}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Save Assignments
            </button>
          </div>
        </Card>
      </div>

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

      {/* OVERVIEW (read-only) */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Main Info (Read-only)">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Project Title</label>
                <input value={view.project_name} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Artist Name</label>
                <input value={view.artist_name} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Album Title</label>
                <input value={view.album_title} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Genre</label>
                <input value={view.genre} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Sub-genre</label>
                <input value={view.sub_genre} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Start Date</label>
                <input value={view.start_date} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Deadline</label>
                <input value={view.deadline} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Description</label>
                <textarea
                  value={view.description}
                  disabled
                  rows={4}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 p-3"
                />
              </div>
            </div>
          </Card>

          <Card title="Budget & Payment (Read-only)">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Budget Amount</label>
                <input value={view.budget_amount} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Currency</label>
                <input value={view.budget_currency} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Payment Plan</label>
                <input value={view.payment_plan || ""} disabled className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2" />
              </div>
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
                  const list = (revisions ?? []).filter((r) => r.draft_id === d.draft_id);
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
                      <DeleteReferenceButton
                        id={l.id}
                        onDeleted={() => setLinks((prev) => (prev ? prev.filter((x) => x.id !== l.id) : prev))}
                      />
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
                      <DeleteMessageButton
                        id={m.id}
                        onDeleted={() => setMessages((prev) => (prev ? prev.filter((x) => x.id !== m.id) : prev))}
                      />
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
                      <CancelMeetingButton
                        id={m.id}
                        onCancelled={() => setMeetings((prev) => (prev ? prev.filter((x) => x.id !== m.id) : prev))}
                      />
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

/** ---------- small button components ---------- */

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
