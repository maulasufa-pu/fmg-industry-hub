"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ensureFreshSession, withTimeout, withSignal, getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";


type ProjectSummary = {
  id: string;
  project_name: string;
  artist_name: string | null;
  genre: string | null;
  stage: string | null;
  status: "pending" | "in_progress" | "revision" | "approved" | "published" | "archived" | "cancelled";
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

const Card: React.FC<React.PropsWithChildren<{ title: string; right?: React.ReactNode }>> = ({ title, right, children }) => (
  <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {right}
    </div>
    {children}
  </section>
);

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{children}</span>
);

const ProgressBar = ({ value = 0 }: { value?: number | null }) => {
  const pct = Math.max(0, Math.min(100, Number(value ?? 0)));
  return (
    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
      <div className="h-full bg-blue-600 transition-[width] duration-500 ease-in-out" style={{ width: `${pct}%` }} />
    </div>
  );
};

export default function ProjectDetailPage(): React.JSX.Element {
  useFocusWarmAuth();
  type TabKey = "All Project" | "Active" | "Finished" | "Pending" | "Requested";

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const validTabs: TabKey[] = ["All Project", "Active", "Finished", "Pending", "Requested"];
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

  const [loading, setLoading] = useState(true);             // spinner global: hanya di awal
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[] | null>(null);      // background load
  const [revisions, setRevisions] = useState<RevisionRow[] | null>(null); // background load
  const [activeTab, setActiveTab] = useState<"drafts" | "references" | "discussion" | "history">("drafts");
  const [busyAction, setBusyAction] = useState<string | null>(null);

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
        await ensureFreshSession();
        // Paksa refresh/validasi session agar query pertama tidak ngegantung
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

        if (error) {
          console.error(error);
          router.replace("/client/projects");
          return;
        }
        if (!proj) {
          router.replace("/client/projects");
          return;
        }

        setProject(proj);
      } catch (e) {
        console.error(e);
        // kalau timeout/error → jangan ngegantung; langsung balik saja
        router.replace("/client/projects");
        return;
      } finally {
        if (mounted) setLoading(false); // spinner global SELESAI DI SINI, apapun hasilnya
      }

      // 2) SEKUNDER: drafts & revisions di background (tidak mempengaruhi spinner)
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

      // Revisions akan di-fetch ulang setelah drafts ada (lihat efek di bawah)
    })();

    return () => {
      mounted = false;
    };
  }, [params.id, router, supabase]);

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

  // actions
  const updateProjectStatus = async (status: ProjectSummary["status"]) => {
    setBusyAction(status);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status })
        .eq("project_id", params.id) // kalau PK tabel projects adalah "id", ganti ke .eq("id", params.id)
        .select("status")
        .single();
      if (error) throw error;
      setProject((p) => (p ? { ...p, status } : p));
    } catch (e) {
      console.error(e);
      alert("Gagal memperbarui status.");
    } finally {
      setBusyAction(null);
    }
  };

  const requestRevision = async () => {
    const reason = window.prompt("Alasan/revisi yang diminta?");
    if (reason === null) return;
    setBusyAction("revision");
    try {
      const targetDraftId = drafts?.[0]?.draft_id;
      if (!targetDraftId) {
        alert("Belum ada draft untuk direvisi.");
        setBusyAction(null);
        return;
      }
      const { error: e1 } = await supabase.from("revisions").insert({ draft_id: targetDraftId, reason });
      if (e1) throw e1;
      await updateProjectStatus("revision");
    } catch (e) {
      console.error(e);
      alert("Gagal membuat request revision.");
      setBusyAction(null);
    }
  };

  if (loading) {
    // Loading HANYA sekali, cepat
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

  const statusLabelMap: Record<ProjectSummary["status"], string> = {
    pending: "Not Started",
    in_progress: "In Progress",
    revision: "Under Review",
    approved: "Approved",
    published: "Published",
    archived: "Archived",
    cancelled: "Cancelled",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/client/projects" className="hover:underline">Projects</Link>
          </li>
          <li>›</li>
          <li>
            <Link href={backUrl} className="hover:underline">{tabLabel}</Link>
          </li>
          <li>›</li>
          <li className="text-gray-800 font-medium truncate max-w-[50vw]">{project.project_name}</li>
        </ol>
      </nav>

      {/* Header summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Brief Details" right={<Tag>{statusLabelMap[project.status]}</Tag>}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 w-32">Project</span>
              <span className="text-gray-800 flex-1">{project.project_name}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 w-32">Artist</span>
              <span className="text-gray-800 flex-1">{project.artist_name ?? "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 w-32">Genre</span>
              <span className="text-gray-800 flex-1">{project.genre ?? "-"}</span>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
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
              ? `${(project.budget_currency ?? "IDR").toUpperCase()} ${Number(project.budget_amount).toLocaleString("id-ID")}`
              : "-"}
          </div>
        </Card>

        <Card title="Team Assigned">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500">PIC</span><span className="text-gray-800">{project.assigned_pic ?? "-"}</span>
            <span className="text-gray-500">Engineer</span><span className="text-gray-800">{project.engineer_name ?? "-"}</span>
            <span className="text-gray-500">A&R</span><span className="text-gray-800">{project.anr_name ?? "-"}</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { key: "drafts", label: "Draft & Revision" },
          { key: "references", label: "References" },
          { key: "discussion", label: "Discussion / Meeting" },
          { key: "history", label: "Revision History" },
        ].map((t) => {
          const active = activeTab === (t.key as typeof activeTab);
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              className={`px-3 py-2 text-sm ${active ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-blue-600"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "drafts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Latest Draft">
            {drafts === null ? (
              <div className="text-sm text-gray-500">Loading drafts…</div>
            ) : drafts.length ? (
              <ul className="space-y-3 text-sm">
                {drafts.map((d) => (
                  <li key={d.draft_id} className="rounded-md border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">v{d.version}</span>
                      <span className="text-xs text-gray-500">
                        {d.created_at ? new Date(d.created_at).toLocaleString("id-ID") : "-"}
                      </span>
                    </div>
                    <div className="mt-1 text-gray-600 break-all">{d.file_path}</div>
                    <div className="mt-2 flex gap-2">
                      <a href={d.file_path} target="_blank" rel="noreferrer" className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50">
                        Open
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500">Belum ada draft.</div>
            )}
          </Card>

          <Card title="Actions" right={busyAction && <span className="text-xs text-gray-500">Processing…</span>}>
            <div className="flex flex-col gap-2">
              <button
                disabled={!!busyAction}
                onClick={() => updateProjectStatus("approved")}
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Approve Draft
              </button>
              <button
                disabled={!!busyAction}
                onClick={requestRevision}
                className="rounded-md bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-60"
              >
                Request Revision
              </button>
              <button
                disabled={!!busyAction}
                onClick={() => updateProjectStatus("published")}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Mark as Finished
              </button>
            </div>
          </Card>

          <Card title="Status">
            <div className="text-sm">
              <div className="mb-2">
                Current: <span className="font-medium">{statusLabelMap[project.status]}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["pending", "in_progress", "revision", "approved", "published"] as ProjectSummary["status"][]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateProjectStatus(s)}
                    disabled={!!busyAction || project.status === s}
                    className={`rounded-full px-3 py-1 text-xs border ${
                      project.status === s ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    } disabled:opacity-60`}
                  >
                    {statusLabelMap[s]}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "references" && (
        <Card title="Reference Files / Links / Notes">
          <div className="text-sm text-gray-500">
            Belum ada tabel khusus untuk references di schema kamu. Sementara, upload bisa lewat “Drafts” atau simpan link di notes (akan
            kita sambungkan ke DB nanti).
          </div>
        </Card>
      )}

      {activeTab === "discussion" && (
        <Card title="Discussion / Meeting">
          <div className="text-sm text-gray-500">Chat & video call placeholder — integrasi real-time bisa via Supabase Realtime / Livekit nanti.</div>
        </Card>
      )}

      {activeTab === "history" && (
        <Card title="Revision History">
          {revisions === null ? (
            <div className="text-sm text-gray-500">Loading revisions…</div>
          ) : revisions.length ? (
            <ul className="space-y-3 text-sm">
              {revisions.map((rv) => (
                <li key={rv.revision_id} className="rounded-md border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">Revision</span>
                    <span className="text-xs text-gray-500">
                      {rv.created_at ? new Date(rv.created_at).toLocaleString("id-ID") : "-"}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-700">Reason: {rv.reason ?? "-"}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">Belum ada revisi.</div>
          )}
        </Card>
      )}
    </div>
  );
}
