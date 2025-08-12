"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";

type ProjectSummary = {
  id: string;
  project_name: string;
  artist_name: string | null;
  genre: string | null;
  stage: string | null;
  status:
    | "pending"
    | "in_progress"
    | "revision"
    | "approved"
    | "published"
    | "archived"
    | "cancelled";
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

const Card: React.FC<
  React.PropsWithChildren<{ title: string; right?: React.ReactNode }>
> = ({ title, right, children }) => (
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
      <div
        className="h-full bg-blue-600 transition-[width] duration-500 ease-in-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export default function ProjectDetailPage(): React.JSX.Element {
  useFocusWarmAuth();
  type TabKey = "All Project" | "Active" | "Finished" | "Pending" | "Requested";

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const validTabs: TabKey[] = [
    "All Project",
    "Active",
    "Finished",
    "Pending",
    "Requested",
  ];
  const rawTab = (searchParams.get("tab") as TabKey) || "Active";
  const currentTab: TabKey = validTabs.includes(rawTab) ? rawTab : "Active";

  const tabLabelMapAll: Record<TabKey, string> = {
    "All Project": "All Projects",
    Active: "Active",
    Finished: "Finished",
    Pending: "Pending",
    Requested: "Requested",
  };
  const tabLabel = tabLabelMapAll[currentTab];
  const backUrl = `/client/projects?tab=${encodeURIComponent(currentTab)}`;

  const supabase = useMemo(() => getSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[] | null>(null);
  const [revisions, setRevisions] = useState<RevisionRow[] | null>(null);
  const [activeTab, setActiveTab] = useState<"drafts" | "references" | "discussion">("drafts");
  const [busyAction, setBusyAction] = useState<{
    draftId: string;
    action: "approve" | "revision" | "publish";
  } | null>(null);

  // util: timeout keras supaya gak pernah stuck
  const raceWithTimeout = <T,>(promiseLike: PromiseLike<T>, ms = 8000): Promise<T> =>
    Promise.race<T>([
      Promise.resolve(promiseLike),
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
    ]);

  // 1) CEPAT: pastikan session aktif → ambil project → matikan spinner
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await supabase.auth.getSession();

        const { data: proj, error } = await raceWithTimeout(
          supabase
            .from("project_summary")
            .select(
              "id,project_name,artist_name,genre,stage,status,progress_percent,budget_amount,budget_currency,assigned_pic,engineer_name,anr_name,latest_update"
            )
            .eq("id", params.id)
            .maybeSingle<ProjectSummary>()
        );

        if (!mounted) return;

        if (error || !proj) {
          console.error(error);
          router.replace("/client/projects");
          return;
        }

        setProject(proj);
      } catch (e) {
        console.error(e);
        router.replace("/client/projects");
        return;
      } finally {
        if (mounted) setLoading(false);
      }

      // 2) SEKUNDER: drafts di background
      supabase
        .from("drafts")
        .select("draft_id,project_id,file_path,uploaded_by,version,created_at")
        .eq("project_id", params.id)
        .order("version", { ascending: false })
        .returns<DraftRow[]>()
        .then(({ data, error }) => {
          if (!mounted) return;
          if (error) {
            console.error(error);
            setDrafts([]);
            return;
          }
          setDrafts(data ?? []);
        });
    })();

    return () => {
      mounted = false;
    };
  }, [params.id, router, supabase]);

  const revByDraft = useMemo(() => {
    const m = new Map<string, RevisionRow[]>();
    (revisions ?? []).forEach((r) => {
      const arr = m.get(r.draft_id) ?? [];
      arr.push(r);
      m.set(r.draft_id, arr);
    });
    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
      m.set(k, arr);
    }
    return m;
  }, [revisions]);

  // Setelah drafts ada, baru fetch revisions sekali
  useEffect(() => {
    if (drafts === null) return;
    const draftIds = drafts.map((d) => d.draft_id);
    if (draftIds.length === 0) {
      setRevisions([]);
      return;
    }
    let mounted = true;
    (async () => {
      const { data, error } = await raceWithTimeout(
        supabase
          .from("revisions")
          .select("revision_id,draft_id,requested_by,reason,created_at")
          .in("draft_id", draftIds)
          .returns<RevisionRow[]>(),
        8000
      );
      if (!mounted) return;
      if (error) {
        console.error(error);
        setRevisions([]);
        return;
      }
      setRevisions(data ?? []);
    })();
    return () => {
      mounted = false;
    };
  }, [drafts, supabase]);

  // actions (dipanggil otomatis dari tombol per draft)
  const updateProjectStatus = async (
    status: ProjectSummary["status"]
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status })
        .eq("project_id", params.id) // ganti ke .eq("id", params.id) kalau PK kamu "id"
        .select("status")
        .single();
      if (error) throw error;

      setProject((p) => (p ? { ...p, status } : p));
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui status.");
    }
  };

  const approveDraft = async (draftId: string): Promise<void> => {
    setBusyAction({ draftId, action: "approve" });
    try {
      // contoh jika ingin tandai draft:
      // await supabase.from("drafts").update({ status: "approved" }).eq("draft_id", draftId);
      await updateProjectStatus("approved");
    } catch (e) {
      console.error(e);
      alert("Gagal meng-approve draft.");
    } finally {
      setBusyAction(null);
    }
  };

  const requestRevisionForDraft = async (draftId: string): Promise<void> => {
    const reason = window.prompt("Alasan/revisi yang diminta?");
    if (reason === null) return;

    setBusyAction({ draftId, action: "revision" });
    try {
      const { error } = await supabase.from("revisions").insert({
        draft_id: draftId,
        reason,
      });
      if (error) throw error;

      await updateProjectStatus("revision");

      // Optimistic update riwayat revisi
      setRevisions((prev) => [
        ...(prev ?? []),
        {
          revision_id: crypto.randomUUID(),
          draft_id: draftId,
          requested_by: null,
          reason,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat request revision.");
    } finally {
      setBusyAction(null);
    }
  };

  const markFinishedFromDraft = async (draftId: string): Promise<void> => {
    setBusyAction({ draftId, action: "publish" });
    try {
      await updateProjectStatus("published");
    } catch (e) {
      console.error(e);
      alert("Gagal menandai sebagai selesai.");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-gray-500 shadow">
          Loading project…
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-gray-500 shadow">
          Project not found.
        </div>
      </div>
    );
  }

  const statusLabelMap: Record<ProjectSummary["status"], string> = {
    pending: "Not Started",
    in_progress: "In Progress",
    revision: "Under Review",
    approved: "Approved",
    published: "Published",
    archived: "Archived",
    cancelled: "Cancelled",
  };

  // Group revisions per draft (newest first)
  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/client/projects" className="hover:underline">
              Projects
            </Link>
          </li>
          <li>›</li>
          <li>
            <Link href={backUrl} className="hover:underline">
              {tabLabel}
            </Link>
          </li>
          <li>›</li>
          <li className="max-w-[50vw] truncate font-medium text-gray-800">
            {project.project_name}
          </li>
        </ol>
      </nav>

      {/* Header summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Brief Details" right={<Tag>{statusLabelMap[project.status]}</Tag>}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="w-32 text-gray-500">Project</span>
              <span className="flex-1 text-gray-800">{project.project_name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="w-32 text-gray-500">Artist</span>
              <span className="flex-1 text-gray-800">
                {project.artist_name ?? "-"}
              </span>
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

        <Card title="Budget">
          <div className="text-sm text-gray-800">
            {project.budget_amount != null
              ? `${(project.budget_currency ?? "IDR").toUpperCase()} ${Number(
                  project.budget_amount
                ).toLocaleString("id-ID")}`
              : "-"}
          </div>
        </Card>

        <Card title="Team Assigned">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">PIC</span>
            <span className="text-gray-800">{project.assigned_pic ?? "-"}</span>
            <span className="text-gray-500">Engineer</span>
            <span className="text-gray-800">
              {project.engineer_name ?? "-"}
            </span>
            <span className="text-gray-500">A&R</span>
            <span className="text-gray-800">{project.anr_name ?? "-"}</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { key: "drafts", label: "Draft & Revision" },
          { key: "references", label: "References" },
          { key: "discussion", label: "Discussion / Meeting" },
        ].map((t) => {
          const active = activeTab === (t.key as typeof activeTab);
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              className={`px-3 py-2 text-sm ${
                active
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "drafts" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Latest Drafts">
            {drafts === null ? (
              <div className="text-sm text-gray-500">Loading drafts…</div>
            ) : drafts.length ? (
              <ul className="space-y-3 text-sm">
                {drafts.map((d) => {
                  const list = revByDraft.get(d.draft_id) ?? [];
                  return (
                    <li
                      key={d.draft_id}
                      className="rounded-md border border-gray-200 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">
                          v{d.version}
                        </span>
                        <span className="text-xs text-gray-500">
                          {d.created_at
                            ? new Date(d.created_at).toLocaleString("id-ID")
                            : "-"}
                        </span>
                      </div>

                      <div className="mt-1 break-all text-gray-600">
                        {d.file_path}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        Uploaded by: {d.uploaded_by ?? "-"}
                      </div>

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
                          disabled={
                            !!busyAction && busyAction.draftId === d.draft_id
                          }
                          onClick={() => approveDraft(d.draft_id)}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700 disabled:opacity-60"
                          title="Approve draft ini"
                        >
                          {busyAction?.draftId === d.draft_id &&
                          busyAction.action === "approve"
                            ? "Processing…"
                            : "Approve Draft"}
                        </button>

                        <button
                          disabled={
                            !!busyAction && busyAction.draftId === d.draft_id
                          }
                          onClick={() => requestRevisionForDraft(d.draft_id)}
                          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs text-white hover:bg-amber-700 disabled:opacity-60"
                          title="Minta revisi untuk draft ini"
                        >
                          {busyAction?.draftId === d.draft_id &&
                          busyAction.action === "revision"
                            ? "Processing…"
                            : "Request Revision"}
                        </button>

                        <button
                          disabled={
                            !!busyAction && busyAction.draftId === d.draft_id
                          }
                          onClick={() => markFinishedFromDraft(d.draft_id)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-60"
                          title="Tandai selesai berdasarkan draft ini"
                        >
                          {busyAction?.draftId === d.draft_id &&
                          busyAction.action === "publish"
                            ? "Processing…"
                            : "Mark as Finished"}
                        </button>
                      </div>

                      {/* Mini Revision History (per draft) */}
                      {list.length > 0 && (
                        <div className="mt-3 rounded-md bg-gray-50 p-2">
                          <div className="mb-1 text-xs font-medium text-gray-700">
                            Revision History
                          </div>
                          <ul className="space-y-1">
                            {list.map((rv) => (
                              <li
                                key={rv.revision_id}
                                className="text-xs text-gray-600"
                              >
                                <span className="font-medium">
                                  {rv.requested_by ?? "Unknown"}
                                </span>{" "}
                                — {rv.reason ?? "-"}
                                <span className="ml-2 text-[11px] text-gray-400">
                                  {rv.created_at
                                    ? new Date(rv.created_at).toLocaleString(
                                        "id-ID"
                                      )
                                    : ""}
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

          {/* (Opsional) Panel samping info / placeholder */}
          <Card title="Notes">
            <div className="text-sm text-gray-500">
              Simpan catatan review, checklist QC, atau link referensi terkait
              draft di sini (akan dihubungkan ke tabel terpisah nanti).
            </div>
          </Card>
        </div>
      )}

      {activeTab === "references" && (
        <Card title="Reference Files / Links / Notes">
          <div className="text-sm text-gray-500">
            Belum ada tabel khusus untuk references di schema kamu. Sementara,
            upload bisa lewat “Drafts” atau simpan link di notes (akan kita
            sambungkan ke DB nanti).
          </div>
        </Card>
      )}

      {activeTab === "discussion" && (
        <Card title="Discussion / Meeting">
          <div className="text-sm text-gray-500">
            Chat & video call placeholder — integrasi real-time bisa via
            Supabase Realtime / Livekit nanti.
          </div>
        </Card>
      )}
    </div>
  );
}
