"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";

type ProjectSummary = {
  id: string;
  title: string;
  artist_name: string | null;
  genre: string | null;
  stage: string | null;
  status: "pending" | "in_progress" | "revision" | "approved" | "published" | "archived" | "cancelled";
  progress_percent: number | null;
  updated_at: string;
  composer_id: string | null;
  producer_id: string | null;
  anr_id: string | null;
  engineer_id: string | null;
  publisher_id: string | null;
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
  start_at: string; // ISO string
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

const Card: React.FC<React.PropsWithChildren<{ title: string; right?: React.ReactNode }>> = ({ title, right, children }) => (
  <section className="rounded-xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 bg-white dark:bg-gray-900 p-4 shadow dark:shadow-gray-800/25 dark:shadow dark:shadow-gray-800/25-gray-800/25-sm">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 dark:text-gray-100">{title}</h3>
      {right}
    </div>
    {children}
  </section>
);

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-200">
    {children}
  </span>
);

const ProgressBar = ({ value = 0 }: { value?: number | null }) => {
  const pct = Math.max(0, Math.min(100, Number(value ?? 0)));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 dark:bg-gray-700">
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

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<DiscussionMessage[] | null>(null);
  const [isSending, setIsSending] = useState(false);

  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const realtimeBoundRef = useRef(false);
  const [meetings, setMeetings] = useState<MeetingRow[] | null>(null);
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    date: "",
    time: "",
    durationMin: 60,
    notes: "",
    provider: "google" as "zoom" | "google",
  });
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

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

  const supabase = useMemo(() => getSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [drafts, setDrafts] = useState<DraftRow[] | null>(null);
  const [revisions, setRevisions] = useState<RevisionRow[] | null>(null);
  const [activeTab, setActiveTab] = useState<"drafts" | "references" | "discussion">("drafts");
  const [busyAction, setBusyAction] = useState<{ draftId: string; action: "approve" | "revision" | "publish" } | null>(null);

  // References (link-only)
  const [links, setLinks] = useState<ReferenceLinkRow[] | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);

  const raceWithTimeout = <T,>(promiseLike: PromiseLike<T>, ms = 8000): Promise<T> =>
    Promise.race<T>([
      Promise.resolve(promiseLike),
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
    ]);

  // 1) Session → project + initial background loads
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await supabase.auth.getSession();

        const { data: proj, error } = await raceWithTimeout(
          supabase
            .from("project_summary")
            .select(
              "id,title,artist_name,genre,stage,status,progress_percent,updated_at,composer_id,producer_id,anr_id,engineer_id,publisher_id"
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

      if (!mounted) return;

      // Discussion messages (background)
      supabase
        .from("discussion_messages")
        .select("id,project_id,author_id,content,created_at")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })
        .limit(100)
        .returns<DiscussionMessage[]>()
        .then(({ data, error: err }) => {
          if (!mounted) return;
          if (err) {
            console.error(err);
            setMessages([]);
            return;
          }
          setMessages(data ?? []);
        });

      // Meetings (background)
      supabase
        .from("meetings")
        .select("id,project_id,title,start_at,duration_min,link,notes,created_by,created_at")
        .eq("project_id", params.id)
        .order("start_at", { ascending: false })
        .returns<MeetingRow[]>()
        .then(({ data, error: err }) => {
          if (!mounted) return;
          if (err) {
            console.error(err);
            setMeetings([]);
            return;
          }
          setMeetings(data ?? []);
        });

      // Drafts (background)
      supabase
        .from("drafts")
        .select("draft_id,project_id,file_path,uploaded_by,version,created_at")
        .eq("project_id", params.id)
        .order("version", { ascending: false })
        .returns<DraftRow[]>()
        .then(({ data, error: err }) => {
          if (!mounted) return;
          if (err) {
            console.error(err);
            setDrafts([]);
            return;
          }
          setDrafts(data ?? []);
        });

      // References (link-only) background
      supabase
        .from("project_reference_links")
        .select("id,project_id,url,created_at")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })
        .returns<ReferenceLinkRow[]>()
        .then(({ data, error: err }) => {
          if (!mounted) return;
          if (err) {
            console.error(err);
            setLinks([]);
            return;
          }
          setLinks(data ?? []);
        });
    })();

    return () => {
      mounted = false;
    };
  }, [params.id, router, supabase]);

  // Group revisions per draft
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

  // Fetch revisions after drafts
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

  // Realtime (messages + meetings)
  useEffect(() => {
    if (!project) return;
    if (realtimeBoundRef.current) return;
    realtimeBoundRef.current = true;

    const channel = supabase.channel(`realtime:project:${project.id}`);

    const pushUniqueMsg = (row: DiscussionMessage) => {
      setMessages((prev) => {
        const list = prev ?? [];
        if (list.some((x) => x.id === row.id)) return list;
        return [row, ...list];
      });
    };
    const pushUniqueMeeting = (row: MeetingRow) => {
      setMeetings((prev) => {
        const list = prev ?? [];
        if (list.some((x) => x.id === row.id)) return list;
        const next = [row, ...list].sort((a, b) => b.start_at.localeCompare(a.start_at));
        return next;
      });
    };

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "discussion_messages", filter: `project_id=eq.${project.id}` },
      (payload) => pushUniqueMsg(payload.new as DiscussionMessage)
    );

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "meetings", filter: `project_id=eq.${project.id}` },
      (payload) => pushUniqueMeeting(payload.new as MeetingRow)
    );

    void channel.subscribe();

    return () => {
      try {
        void supabase.removeChannel(channel);
      } finally {
        realtimeBoundRef.current = false;
      }
    };
  }, [project, supabase]);

  const sendMessage = async (): Promise<void> => {
    const text = chatInput.trim();
    if (!text) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from("discussion_messages").insert({
        project_id: params.id,
        content: text,
      });
      if (error) throw error;
      setChatInput("");
    } catch (e) {
      console.error(e);
      alert("Gagal mengirim pesan.");
    } finally {
      setIsSending(false);
    }
  };

  const createMeeting = async (): Promise<void> => {
    const { title, date, time, durationMin, notes, provider } = meetingForm;
    if (!title.trim() || !date || !time) {
      alert("Isi Title, Date, dan Time.");
      return;
    }
    const startLocal = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startLocal.getTime())) {
      alert("Tanggal/Jam tidak valid.");
      return;
    }

    setIsCreatingMeeting(true);
    try {
      const res = await fetch(`/api/meetings/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          startAt: startLocal.toISOString(),
          durationMin: Number(durationMin) || 60,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { joinUrl } = (await res.json()) as { joinUrl?: string };

      const { error } = await supabase.from("meetings").insert({
        project_id: params.id,
        title: title.trim(),
        start_at: startLocal.toISOString(),
        duration_min: Number(durationMin) || 60,
        link: joinUrl ?? null,
        notes: notes.trim() || null,
      });
      if (error) throw error;

      setMeetingForm((p) => ({ ...p, title: "", date: "", time: "", durationMin: 60, notes: "" }));
      setShowMeetingForm(false);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat meeting otomatis.");
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  // actions drafts → auto status
  const updateProjectStatus = async (status: ProjectSummary["status"]): Promise<void> => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status })
        .eq("project_id", params.id) // ganti ke .eq("id", params.id) jika PK = id
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
      await updateProjectStatus("approved");
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
    } finally {
      setBusyAction(null);
    }
  };

  // Reference links: add
  const addReferenceLink = async (): Promise<void> => {
    const raw = newLinkUrl.trim();
    if (!raw) {
      alert("Masukkan URL terlebih dahulu.");
      return;
    }
    try {
      // simple validation
      // eslint-disable-next-line no-new
      new URL(raw);
    } catch {
      alert("URL tidak valid.");
      return;
    }

    setIsAddingLink(true);
    try {
      const { data, error } = await supabase
        .from("project_reference_links")
        .insert({ project_id: params.id, url: raw })
        .select("id,project_id,url,created_at")
        .single<ReferenceLinkRow>();
      if (error) throw error;

      setLinks((prev) => (prev ? [data, ...prev] : [data]));
      setNewLinkUrl("");
    } catch (e) {
      console.error(e);
      alert("Gagal menambah link referensi.");
    } finally {
      setIsAddingLink(false);
    }
  };

  // support tombol Try again di error boundary (client-refresh)
  useEffect(() => {
    const onClientRefresh = () => {
      window.location.reload();
    };
    window.addEventListener("client-refresh", onClientRefresh);
    return () => window.removeEventListener("client-refresh", onClientRefresh);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 bg-white dark:bg-gray-900 p-8 text-gray-500 dark:text-gray-400 dark:text-gray-400 shadow dark:shadow-gray-800/25 dark:shadow dark:shadow-gray-800/25-gray-800/25">Loading project…</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 bg-white dark:bg-gray-900 p-8 text-gray-500 dark:text-gray-400 dark:text-gray-400 shadow dark:shadow-gray-800/25 dark:shadow dark:shadow-gray-800/25-gray-800/25">Project not found.</div>
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
      <nav className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/client/projects" className="hover:underline">
              Projects
            </Link>
          </li>
          <li>›</li>
          <li>
            <Link href={`/client/projects?tab=${encodeURIComponent(currentTab)}`} className="hover:underline">
              {tabLabel}
            </Link>
          </li>
          <li>›</li>
          <li className="max-w-[50vw] truncate font-medium text-gray-800 dark:text-gray-100 dark:text-gray-100">{project.title}</li>
        </ol>
      </nav>

      {/* Header summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Brief Details" right={<Tag>{statusLabelMap[project.status]}</Tag>}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="w-32 text-gray-500 dark:text-gray-400 dark:text-gray-400">Project</span>
              <span className="flex-1 text-gray-800 dark:text-gray-100 dark:text-gray-100">{project.title}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="w-32 text-gray-500 dark:text-gray-400 dark:text-gray-400">Artist</span>
              <span className="flex-1 text-gray-800 dark:text-gray-100 dark:text-gray-100">{project.artist_name ?? "-"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="w-32 text-gray-500 dark:text-gray-400 dark:text-gray-400">Genre</span>
              <span className="flex-1 text-gray-800 dark:text-gray-100 dark:text-gray-100">{project.genre ?? "-"}</span>
            </div>
            <div className="pt-2">
              <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                <span>Overall Progress</span>
                <span>{project.progress_percent ?? 0}%</span>
              </div>
              <ProgressBar value={project.progress_percent} />
            </div>
          </div>
        </Card>

        <Card title="Last Updated">
          <div className="text-sm text-gray-800 dark:text-gray-100 dark:text-gray-100">
            {new Date(project.updated_at).toLocaleString("id-ID")}
          </div>
        </Card>

        <Card title="Team Assignments">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Composer</span>
            <span className={`text-sm px-2 py-1 rounded ${project.composer_id ? 'bg-green-100 text-green-800' : 'text-gray-500 dark:text-gray-400 dark:text-gray-400'}`}>
              {project.composer_id ? 'Assigned' : 'Unassigned'}
            </span>
            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Producer</span>
            <span className={`text-sm px-2 py-1 rounded ${project.producer_id ? 'bg-blue-100 text-blue-800' : 'text-gray-500 dark:text-gray-400 dark:text-gray-400'}`}>
              {project.producer_id ? 'Assigned' : 'Unassigned'}
            </span>
            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">A&R</span>
            <span className={`text-sm px-2 py-1 rounded ${project.anr_id ? 'bg-yellow-100 text-yellow-800' : 'text-gray-500 dark:text-gray-400 dark:text-gray-400'}`}>
              {project.anr_id ? 'Assigned' : 'Unassigned'}
            </span>
            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Engineer</span>
            <span className={`text-sm px-2 py-1 rounded ${project.engineer_id ? 'bg-purple-100 text-purple-800' : 'text-gray-500 dark:text-gray-400 dark:text-gray-400'}`}>
              {project.engineer_id ? 'Assigned' : 'Unassigned'}
            </span>
            <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400">Publisher</span>
            <span className={`text-sm px-2 py-1 rounded ${project.publisher_id ? 'bg-pink-100 text-pink-800' : 'text-gray-500 dark:text-gray-400 dark:text-gray-400'}`}>
              {project.publisher_id ? 'Assigned' : 'Unassigned'}
            </span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-[var(--border)] border-gray-200 dark:border-gray-600 dark:border-gray-600">
        {[
          { key: "drafts", label: "Draft & Revision" },
          { key: "references", label: "References" },
          { key: "discussion", label: "Discussion / Meeting" },
        ].map((t) => {
          const act = activeTab === (t.key as typeof activeTab);
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              className={`px-3 py-2 text-sm ${act ? "border-[var(--border)]-2 border-blue-600 text-sky-600 dark:text-sky-200" : "text-neutral-600 dark:text-neutral-200 dark:text-gray-200 hover:text-sky-600 dark:text-sky-200"}`}
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
              <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Loading drafts…</div>
            ) : drafts.length ? (
              <ul className="space-y-3 text-sm">
                {drafts.map((d) => {
                  const list = revByDraft.get(d.draft_id) ?? [];
                  return (
                    <li key={d.draft_id} className="rounded-md border border-gray-200 dark:border-gray-600 dark:border-gray-600 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 dark:text-gray-100 dark:text-gray-100">v{d.version}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                          {d.created_at ? new Date(d.created_at).toLocaleString("id-ID") : "-"}
                        </span>
                      </div>

                      <div className="mt-1 break-all text-neutral-600 dark:text-neutral-200 dark:text-gray-200">{d.file_path}</div>

                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Uploaded by: {d.uploaded_by ?? "-"}</div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={d.file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:bg-gray-800"
                        >
                          Open
                        </a>

                        <button
                          disabled={!!busyAction && busyAction.draftId === d.draft_id}
                          onClick={() => approveDraft(d.draft_id)}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700 disabled:opacity-60"
                          title="Approve draft ini"
                        >
                          {busyAction?.draftId === d.draft_id && busyAction.action === "approve" ? "Processing…" : "Approve Draft"}
                        </button>

                        <button
                          disabled={!!busyAction && busyAction.draftId === d.draft_id}
                          onClick={() => requestRevisionForDraft(d.draft_id)}
                          className="rounded-md bg-amber-600 px-3 py-1.5 text-xs text-white hover:bg-amber-700 disabled:opacity-60"
                          title="Minta revisi untuk draft ini"
                        >
                          {busyAction?.draftId === d.draft_id && busyAction.action === "revision" ? "Processing…" : "Request Revision"}
                        </button>

                        <button
                          disabled={!!busyAction && busyAction.draftId === d.draft_id}
                          onClick={() => markFinishedFromDraft(d.draft_id)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-60"
                          title="Tandai selesai berdasarkan draft ini"
                        >
                          {busyAction?.draftId === d.draft_id && busyAction.action === "publish" ? "Processing…" : "Mark as Finished"}
                        </button>
                      </div>

                      {list.length > 0 && (
                        <div className="mt-3 rounded-md bg-gray-50 dark:bg-gray-800 p-2">
                          <div className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-200">Revision History</div>
                          <ul className="space-y-1">
                            {list.map((rv) => (
                              <li key={rv.revision_id} className="text-xs text-neutral-600 dark:text-neutral-200 dark:text-gray-200">
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
              <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Belum ada draft.</div>
            )}
          </Card>

          <Card title="Notes">
            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Simpan catatan review, checklist QC, atau link referensi terkait draft di sini.</div>
          </Card>
        </div>
      )}

      {activeTab === "references" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Composer: add link */}
          <Card
            title="Add a reference link"
            right={<span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{isAddingLink ? "Posting…" : ""}</span>}
          >
            <div className="space-y-3">
              <input
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="Paste URL (YouTube/Spotify/Drive/website)…"
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:border-gray-600 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
              />
              <div className="flex justify-end">
                <button
                  disabled={isAddingLink || !newLinkUrl.trim()}
                  onClick={addReferenceLink}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Add Link
                </button>
              </div>
            </div>
          </Card>

          {/* Feed */}
          <Card title="References Feed" right={null}>
            {links === null ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Loading…</div>
            ) : links.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Belum ada link.</div>
            ) : (
              <ul className="space-y-4">
                {links.map((l) => (
                  <li key={l.id} className="rounded-md border border-gray-200 dark:border-gray-600 dark:border-gray-600 p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                      <span>Link</span>
                      <span>{l.created_at ? new Date(l.created_at).toLocaleString("id-ID") : ""}</span>
                    </div>
                    <a href={l.url} target="_blank" rel="noreferrer" className="break-all text-sky-600 dark:text-sky-200 hover:underline">
                      {l.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Filters (optional)">
            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Tambahkan filter by domain/type kalau perlu.</div>
          </Card>
        </div>
      )}

      {activeTab === "discussion" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card title="Discussion" right={<span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">{isSending ? "Sending…" : ""}</span>}>
            <div className="flex h-[420px] flex-col">
              <div className="flex-1 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-600 dark:border-gray-600 p-3">
                {messages === null ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Loading…</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Belum ada pesan.</div>
                ) : (
                  <ul className="space-y-3">
                    {messages.map((m) => (
                      <li key={m.id} className="rounded-md border border-gray-200 dark:border-gray-600 dark:border-gray-600 p-2">
                        <div className="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                          <span>{m.author_id ?? "Anon"}</span>
                          <span>{new Date(m.created_at).toLocaleString("id-ID")}</span>
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100 dark:text-gray-100">{m.content}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tulis pesan…"
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={sendMessage}
                  disabled={isSending || !chatInput.trim()}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Send
                </button>
              </div>
            </div>
          </Card>

          <Card title="Meetings">
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setShowMeetingForm((s) => !s)}
                className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50 dark:bg-gray-800"
              >
                {showMeetingForm ? "Close" : "New Meeting"}
              </button>
            </div>

            {showMeetingForm && (
              <div className="mb-4 space-y-3 rounded-md border border-gray-200 dark:border-gray-600 dark:border-gray-600 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={meetingForm.title}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Title"
                    className="col-span-2 rounded-md border border-gray-300 dark:border-gray-600 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, date: e.target.value }))}
                    className="rounded-md border border-gray-300 dark:border-gray-600 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="time"
                    value={meetingForm.time}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, time: e.target.value }))}
                    className="rounded-md border border-gray-300 dark:border-gray-600 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={meetingForm.durationMin}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, durationMin: Number(e.target.value) }))}
                    placeholder="Duration (min)"
                    className="rounded-md border border-gray-300 dark:border-gray-600 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <textarea
                    value={meetingForm.notes}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Notes (optional)"
                    rows={2}
                    className="col-span-2 w-full resize-none rounded-md border border-gray-300 dark:border-gray-600 dark:border-gray-600 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <select
                    value={meetingForm.provider}
                    onChange={(e) =>
                      setMeetingForm((p) => ({ ...p, provider: e.target.value as "zoom" | "google" }))
                    }
                    className="rounded-md border border-gray-300 dark:border-gray-600 dark:border-gray-600 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="google">Google Meet</option>
                    <option value="zoom">Zoom</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={createMeeting}
                    disabled={isCreatingMeeting || !meetingForm.title.trim() || !meetingForm.date || !meetingForm.time}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isCreatingMeeting ? "Creating…" : "Create Meeting"}
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-200">Upcoming & Past</div>
              {meetings === null ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Loading…</div>
              ) : meetings.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">Belum ada meeting.</div>
              ) : (
                <ul className="space-y-3">
                  {meetings.map((m) => {
                    const start = new Date(m.start_at);
                    const end = new Date(start.getTime() + m.duration_min * 60_000);
                    return (
                      <li key={m.id} className="rounded-md border border-gray-200 dark:border-gray-600 dark:border-gray-600 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-800 dark:text-gray-100 dark:text-gray-100">{m.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
                            {start.toLocaleString("id-ID")} –{" "}
                            {end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        {m.notes && <div className="mt-1 text-gray-700 dark:text-gray-200">{m.notes}</div>}
                        <div className="mt-2">
                          {m.link ? (
                            <a
                              className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50 dark:bg-gray-800"
                              href={m.link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Join
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">No link</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
