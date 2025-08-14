// src/app/client/projects/[id]/page.tsx
"use client";

export const dynamic = "force-dynamic"; // ekstra aman: cegah prerender/ISR di segment ini

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
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

type DriveFile = {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  mimeType?: string;
  thumbnailLink?: string;
  iconLink?: string;
  sizeBytes?: number;
};

type ReferencePost = {
  id: string;
  project_id: string;
  author_id: string | null;
  content: string | null;
  media: DriveFile[];
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
    start_at: string;     // ISO string
    duration_min: number;
    link: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
  };

  // Discussion state
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<DiscussionMessage[] | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Meeting state
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
  const [activeTab, setActiveTab] = useState<
    "drafts" | "references" | "discussion"
  >("drafts");
  const [busyAction, setBusyAction] = useState<{
    draftId: string;
    action: "approve" | "revision" | "publish";
  } | null>(null);

  // References state
  const [posts, setPosts] = useState<ReferencePost[] | null>(null);
  const [composerText, setComposerText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  // util: timeout keras supaya gak pernah stuck
  const raceWithTimeout = <T,>(promiseLike: PromiseLike<T>, ms = 8000): Promise<T> =>
    Promise.race<T>([
      Promise.resolve(promiseLike),
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
    ]);

    // === PRICING START: types ===
    type CatalogItem = {
      id: string;
      name: string;
      unit: string | null;
      default_price: number; // numeric → number di client
      is_active?: boolean;
    };

    type ProjectPricingItem = {
      id: string;
      project_id: string;         // sesuai schema: projects.project_id
      catalog_id: string;
      qty: number;
      custom_unit_price: number | null;
      created_at?: string | null;
      catalog?: CatalogItem;      // join alias
    };
    // === PRICING END: types ===
  
    // === PRICING START: state ===
  const [pricingCatalog, setPricingCatalog] = useState<CatalogItem[] | null>(null);
  const [pricingItems, setPricingItems] = useState<ProjectPricingItem[] | null>(null);
  const [pricingBusyId, setPricingBusyId] = useState<string | null>(null);
  const [addingCatalogId, setAddingCatalogId] = useState<string>("");
  const [isSyncingBudget, setIsSyncingBudget] = useState(false);
  // === PRICING END: state ===

  // 1) CEPAT: session → project
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

      if (!mounted) return;

      // Discussion messages (background)
      supabase
        .from("discussion_messages")
        .select("id,project_id,author_id,content,created_at")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })
        .limit(100)
        .returns<DiscussionMessage[]>()
        .then(({ data, error }) => {
          if (!mounted) return;
          if (error) { console.error(error); setMessages([]); return; }
          setMessages(data ?? []);
        });

      // Meetings (background)
      supabase
        .from("meetings")
        .select("id,project_id,title,start_at,duration_min,link,notes,created_by,created_at")
        .eq("project_id", params.id)
        .order("start_at", { ascending: false })
        .returns<MeetingRow[]>()
        .then(({ data, error }) => {
          if (!mounted) return;
          if (error) { console.error(error); setMeetings([]); return; }
          setMeetings(data ?? []);
        });

      // Drafts (background)
      supabase
        .from("drafts")
        .select("draft_id,project_id,file_path,uploaded_by,version,created_at")
        .eq("project_id", params.id)
        .order("version", { ascending: false })
        .returns<DraftRow[]>()
        .then(({ data, error }) => {
          if (!mounted) return;
          if (error) { console.error(error); setDrafts([]); return; }
          setDrafts(data ?? []);
        });

      // References posts (background)
      supabase
        .from("references_posts")
        .select("id,project_id,author_id,content,media,created_at")
        .eq("project_id", params.id)
        .order("created_at", { ascending: false })
        .returns<ReferencePost[]>()
        .then(({ data, error }) => {
          if (!mounted) return;
          if (error) { console.error(error); setPosts([]); return; }
          const safe = (data ?? []).map((p) => ({
            ...p,
            media: Array.isArray(p.media) ? (p.media as DriveFile[]) : [],
          }));
          setPosts(safe);
        });

        // === PRICING START: fetch catalog & items ===
        supabase
          .from("pricing_catalog")
          .select("id,name,unit,default_price,is_active")
          .eq("is_active", true)
          .order("name", { ascending: true })
          .returns<CatalogItem[]>()
          .then(({ data, error }) => {
            if (!mounted) return;
            if (error) { console.error(error); setPricingCatalog([]); return; }
            setPricingCatalog(data ?? []);
          });

        supabase
          .from("project_pricing_items")
          .select("id,project_id,catalog_id,qty,custom_unit_price,created_at,catalog:pricing_catalog(id,name,unit,default_price)")
          .eq("project_id", params.id)   // ← filter pakai project_id
          .order("created_at", { ascending: false })
          .returns<ProjectPricingItem[]>()
          .then(({ data, error }) => {
            if (!mounted) return;
            if (error) { console.error(error); setPricingItems([]); return; }
            setPricingItems(data ?? []);
          });
        // === PRICING END: fetch catalog & items ===

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

  // Setelah drafts ada, fetch revisions
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
      if (error) { console.error(error); setRevisions([]); return; }
      setRevisions(data ?? []);
    })();
    return () => { mounted = false; };
  }, [drafts, supabase]);

  // realtime
  useEffect(() => {
    if (!project) return;
    if (realtimeBoundRef.current) return;
    realtimeBoundRef.current = true;

    const channel = supabase.channel(`realtime:project:${project.id}`);

    const pushUniqueMsg = (row: DiscussionMessage) => {
      setMessages(prev => {
        const list = prev ?? [];
        if (list.some(x => x.id === row.id)) return list;
        return [row, ...list];
      });
    };
    const pushUniqueMeeting = (row: MeetingRow) => {
      setMeetings(prev => {
        const list = prev ?? [];
        if (list.some(x => x.id === row.id)) return list;
        const next = [row, ...list].sort((a,b) => b.start_at.localeCompare(a.start_at));
        return next;
      });
    };

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'discussion_messages', filter: `project_id=eq.${project.id}` },
      (payload) => pushUniqueMsg(payload.new as DiscussionMessage)
    );

    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'meetings', filter: `project_id=eq.${project.id}` },
      (payload) => pushUniqueMeeting(payload.new as MeetingRow)
    );

    void channel.subscribe();

    return () => {
      try { void supabase.removeChannel(channel); } finally { realtimeBoundRef.current = false; }
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
      setChatInput(""); // realtime akan masukin pesan
    } catch (e) {
      console.error(e);
      alert("Gagal mengirim pesan.");
    } finally {
      setIsSending(false);
    }
  };

  const createMeeting = async (): Promise<void> => {
    const { title, date, time, durationMin, notes, provider } = meetingForm;
    if (!title.trim() || !date || !time) { alert("Isi Title, Date, dan Time."); return; }
    const startLocal = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startLocal.getTime())) { alert("Tanggal/Jam tidak valid."); return; }

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
      const { joinUrl } = await res.json();

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
      alert("Gagal membuat meeting otomatis: " + (e as Error).message);
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  // actions drafts → auto status
  const updateProjectStatus = async (
    status: ProjectSummary["status"]
  ): Promise<void> => {
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

  // === PRICING START: helpers & handlers ===
  const fmtIDR = (n: number): string => `IDR ${Math.round(n).toLocaleString("id-ID")}`;

  const resolvedUnit = (row: ProjectPricingItem): number => {
    const def = Number(row.catalog?.default_price ?? 0);
    const cus = row.custom_unit_price == null ? 0 : Number(row.custom_unit_price);
    return Math.max(def, cus);
  };

  const lineTotal = (row: ProjectPricingItem): number =>
    resolvedUnit(row) * Math.max(1, Number(row.qty || 1));

  const grandTotal = useMemo(() => {
    return (pricingItems ?? []).reduce((acc, r) => acc + lineTotal(r), 0);
  }, [pricingItems]);

  const addPricingItem = async (): Promise<void> => {
    if (!addingCatalogId || !project) return;

    // Jika item katalog sudah ada → tambah qty saja
    const existing = (pricingItems ?? []).find((x) => x.catalog_id === addingCatalogId);
    if (existing) {
      await updateQty(existing.id, existing.qty + 1);
      return;
    }

    setPricingBusyId("new");
    try {
      const { data, error } = await supabase
        .from("project_pricing_items")
        .insert({
          project_id: params.id,            // ← pakai project_id
          catalog_id: addingCatalogId,
          qty: 1,
          custom_unit_price: null,          // null = pakai default
        })
        .select("id,project_id,catalog_id,qty,custom_unit_price,created_at,catalog:pricing_catalog(id,name,unit,default_price)")
        .single<ProjectPricingItem>();
      if (error) throw error;
      setPricingItems((prev) => prev ? [data, ...prev] : [data]);
      setAddingCatalogId("");
    } catch (e: unknown) {
      console.error(e);
      alert("Gagal menambah item.");
    } finally {
      setPricingBusyId(null);
    }
  };

  const removePricingItem = async (id: string): Promise<void> => {
    if (!confirm("Hapus item ini?")) return;
    setPricingBusyId(id);
    try {
      const { error } = await supabase.from("project_pricing_items").delete().eq("id", id);
      if (error) throw error;
      setPricingItems((prev) => (prev ?? []).filter((x) => x.id !== id));
    } catch (e: unknown) {
      console.error(e);
      alert("Gagal menghapus item.");
    } finally {
      setPricingBusyId(null);
    }
  };

  const updateQty = async (id: string, nextQty: number): Promise<void> => {
    const qty = Math.max(1, Math.round(Number(nextQty || 1)));
    setPricingBusyId(id);
    try {
      const { data, error } = await supabase
        .from("project_pricing_items")
        .update({ qty })
        .eq("id", id)
        .select("id,project_id,catalog_id,qty,custom_unit_price,created_at,catalog:pricing_catalog(id,name,unit,default_price)")
        .single<ProjectPricingItem>();
      if (error) throw error;
      setPricingItems((prev) => (prev ?? []).map((x) => (x.id === id ? data : x)));
    } catch (e: unknown) {
      console.error(e);
      alert("Gagal mengubah qty.");
    } finally {
      setPricingBusyId(null);
    }
  };

  const updateCustomPrice = async (id: string, raw: string, defaultPrice: number): Promise<void> => {
    // custom bebas tapi minimal default → clamp ke default
    const parsed = Number(raw);
    const safe = Number.isFinite(parsed) ? Math.max(defaultPrice, Math.round(parsed)) : defaultPrice;

    setPricingBusyId(id);
    try {
      const { data, error } = await supabase
        .from("project_pricing_items")
        .update({ custom_unit_price: safe })
        .eq("id", id)
        .select("id,project_id,catalog_id,qty,custom_unit_price,created_at,catalog:pricing_catalog(id,name,unit,default_price)")
        .single<ProjectPricingItem>();
      if (error) throw error;
      setPricingItems((prev) => (prev ?? []).map((x) => (x.id === id ? data : x)));
    } catch (e: unknown) {
      console.error(e);
      alert("Gagal menyimpan harga custom.");
    } finally {
      setPricingBusyId(null);
    }
  };

  const syncBudgetToProject = async (): Promise<void> => {
    if (!project) return;
    if (!confirm(`Sync total ${fmtIDR(grandTotal)} ke Budget project?`)) return;

    setIsSyncingBudget(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ budget_amount: grandTotal, budget_currency: project.budget_currency ?? "IDR" })
        .eq("project_id", params.id)   // ← sesuai schema kamu
        .select("project_id,budget_amount,budget_currency")
        .single();
      if (error) throw error;

      setProject((p) => p ? { ...p, budget_amount: grandTotal, budget_currency: p.budget_currency ?? "IDR" } : p);
    } catch (e: unknown) {
      console.error(e);
      alert("Gagal sync budget.");
    } finally {
      setIsSyncingBudget(false);
    }
  };
  // === PRICING END: helpers & handlers ===


  // references
  const onPickLocalFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...arr]);
  };
  const removeSelectedFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadToGoogleDrive = async (files: File[]): Promise<DriveFile[]> => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    const res = await fetch("/api/gdrive/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error(`GDrive upload failed: ${await res.text()}`);
    const json = (await res.json()) as { files: DriveFile[] };
    return json.files ?? [];
  };

  const submitReferencePost = async () => {
    if (!composerText.trim() && selectedFiles.length === 0) {
      alert("Tulis sesuatu atau pilih media dulu.");
      return;
    }
    setIsPosting(true);
    try {
      let driveFiles: DriveFile[] = [];
      if (selectedFiles.length) {
        driveFiles = await uploadToGoogleDrive(selectedFiles);
      }
      const { data, error } = await supabase
        .from("references_posts")
        .insert({
          project_id: params.id,
          author_id: null,
          content: composerText.trim() || null,
          media: driveFiles,
        })
        .select("id,project_id,author_id,content,media,created_at")
        .single<ReferencePost>();
      if (error) throw error;

      setPosts((prev) => (prev ? [data, ...prev] : [data]));
      setComposerText("");
      setSelectedFiles([]);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat post referensi.");
    } finally {
      setIsPosting(false);
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
            <Link href={`/client/projects?tab=${encodeURIComponent(currentTab)}`} className="hover:underline">
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

      {/* === PRICING START: UI Card === */}
      <Card
        title="Pricing Items"
        right={
          <div className="flex items-center gap-2">
            <select
              value={addingCatalogId}
              onChange={(e) => setAddingCatalogId(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">+ Add item from catalog…</option>
              {(pricingCatalog ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {fmtIDR(Number(c.default_price))}{c.unit ? ` / ${c.unit}` : ""}
                </option>
              ))}
            </select>
            <button
              disabled={!addingCatalogId || pricingBusyId === "new"}
              onClick={addPricingItem}
              className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-60"
            >
              {pricingBusyId === "new" ? "Adding…" : "Add"}
            </button>
          </div>
        }
      >
        {pricingItems === null ? (
          <div className="text-sm text-gray-500">Loading pricing…</div>
        ) : pricingItems.length === 0 ? (
          <div className="text-sm text-gray-500">Belum ada item. Tambahkan dari katalog.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-2 py-2">Item</th>
                  <th className="px-2 py-2">Default</th>
                  <th className="px-2 py-2">Custom</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2">Line Total</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pricingItems.map((row) => {
                  const def = Number(row.catalog?.default_price ?? 0);
                  const cus = row.custom_unit_price == null ? undefined : Number(row.custom_unit_price);
                  const resolved = resolvedUnit(row);
                  return (
                    <tr key={row.id} className="border-t">
                      <td className="px-2 py-2">
                        <div className="font-medium text-gray-800">{row.catalog?.name ?? "Item"}</div>
                        <div className="text-xs text-gray-500">{row.catalog?.unit ? `per ${row.catalog?.unit}` : ""}</div>
                      </td>
                      <td className="px-2 py-2">{fmtIDR(def)}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={def}
                            step={1000}
                            inputMode="numeric"
                            defaultValue={cus ?? def}
                            onBlur={(e) => {
                              const v = e.currentTarget.value;
                              void updateCustomPrice(row.id, v, def);
                            }}
                            className="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          {resolved > def ? (
                            <span className="text-[11px] text-emerald-600">custom &gt;= default ✓</span>
                          ) : (
                            <span className="text-[11px] text-gray-400">min {fmtIDR(def)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          value={row.qty}
                          onChange={(e) => void updateQty(row.id, Number(e.target.value))}
                          className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </td>
                      <td className="px-2 py-2 font-medium text-gray-800">{fmtIDR(lineTotal(row))}</td>
                      <td className="px-2 py-2">
                        <button
                          disabled={pricingBusyId === row.id}
                          onClick={() => void removePricingItem(row.id)}
                          className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t">
                  <td colSpan={4} className="px-2 py-3 text-right text-sm font-semibold text-gray-700">
                    Grand Total
                  </td>
                  <td className="px-2 py-3 text-sm font-semibold text-gray-900">{fmtIDR(grandTotal)}</td>
                  <td className="px-2 py-3">
                    <button
                      disabled={isSyncingBudget}
                      onClick={() => void syncBudgetToProject()}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {isSyncingBudget ? "Syncing…" : "Sync to Project Budget"}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {/* === PRICING END: UI Card === */}


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

          <Card title="Notes">
            <div className="text-sm text-gray-500">
              Simpan catatan review, checklist QC, atau link referensi terkait
              draft di sini (akan dihubungkan ke tabel terpisah nanti).
            </div>
          </Card>
        </div>
      )}

      {activeTab === "references" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Composer */}
          <Card
            title="Post a reference"
            right={
              <span className="text-xs text-gray-500">
                {isPosting ? "Posting…" : ""}
              </span>
            }
          >
            <div className="space-y-3">
              <textarea
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="Describe your references..."
                className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <label className="cursor-pointer rounded-md border px-3 py-2 text-xs hover:bg-gray-50">
                  Choose Media
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    multiple
                    className="hidden"
                    onChange={(e) => onPickLocalFiles(e.target.files)}
                  />
                </label>

                {selectedFiles.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {selectedFiles.length} file selected
                  </span>
                )}
              </div>

              {selectedFiles.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {selectedFiles.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="group relative flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1 text-xs"
                    >
                      <span className="max-w-[160px] truncate">{f.name}</span>
                      <button
                        onClick={() => removeSelectedFile(i)}
                        className="opacity-60 hover:opacity-100"
                        title="Hapus"
                        type="button"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex justify-end">
                <button
                  disabled={isPosting}
                  onClick={submitReferencePost}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Post
                </button>
              </div>
            </div>
          </Card>

          {/* Feed */}
          <Card title="References Feed" right={null}>
            {posts === null ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : posts.length === 0 ? (
              <div className="text-sm text-gray-500">Belum ada post.</div>
            ) : (
              <ul className="space-y-4">
                {posts.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-md border border-gray-200 p-3 text-sm"
                  >
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{p.author_id ?? "Anon"}</span>
                      <span>
                        {p.created_at
                          ? new Date(p.created_at).toLocaleString("id-ID")
                          : ""}
                      </span>
                    </div>
                    {p.content && (
                      <div className="mb-2 whitespace-pre-wrap text-gray-800">
                        {p.content}
                      </div>
                    )}
                    {p.media.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {p.media.map((m, idx) => {
                          const mime = m.mimeType ?? "";
                          const isImg = mime.startsWith("image/");
                          const isVideo = mime.startsWith("video/");
                          const isAudio = mime.startsWith("audio/");
                          return (
                            <div
                              key={`${m.id}-${idx}`}
                              className="overflow-hidden rounded-md border border-gray-200"
                            >
                              {isImg ? (
                                <a
                                  href={m.webViewLink || m.webContentLink || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={
                                      m.thumbnailLink ||
                                      m.webContentLink ||
                                      "/placeholder.png"
                                    }
                                    alt={m.name}
                                    className="h-36 w-full object-cover"
                                  />
                                </a>
                              ) : isVideo ? (
                                <a
                                  className="block p-3 text-xs hover:bg-gray-50"
                                  href={m.webViewLink || m.webContentLink || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  🎬 {m.name}
                                </a>
                              ) : isAudio ? (
                                <a
                                  className="block p-3 text-xs hover:bg-gray-50"
                                  href={m.webViewLink || m.webContentLink || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  🎵 {m.name}
                                </a>
                              ) : (
                                <a
                                  className="block p-3 text-xs hover:bg-gray-50"
                                  href={m.webViewLink || m.webContentLink || "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  📄 {m.name}
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Filters (optional)">
            <div className="text-sm text-gray-500">
              Tambahkan filter by media type, author, dsb.
            </div>
          </Card>
        </div>
      )}

      {activeTab === "discussion" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Chat (2 kolom) */}
          <Card
            title="Discussion"
            right={<span className="text-xs text-gray-500">{isSending ? "Sending…" : ""}</span>}
          >
            <div className="flex h-[420px] flex-col">
              <div className="flex-1 overflow-y-auto rounded-md border border-gray-200 p-3">
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
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
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

          {/* Meeting (1 kolom) */}
          <Card title="Meetings">
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setShowMeetingForm(s => !s)}
                className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                {showMeetingForm ? "Close" : "New Meeting"}
              </button>
            </div>

            {showMeetingForm && (
              <div className="mb-4 space-y-3 rounded-md border border-gray-200 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={meetingForm.title}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Title"
                    className="col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="date"
                    value={meetingForm.date}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, date: e.target.value }))}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="time"
                    value={meetingForm.time}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, time: e.target.value }))}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={meetingForm.durationMin}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, durationMin: Number(e.target.value) }))}
                    placeholder="Duration (min)"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <textarea
                    value={meetingForm.notes}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Notes (optional)"
                    rows={2}
                    className="col-span-2 w-full resize-none rounded-md border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <select
                    value={meetingForm.provider}
                    onChange={(e) => setMeetingForm((p) => ({ ...p, provider: e.target.value as "zoom" | "google" }))}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600"
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
              <div className="mb-2 text-xs font-medium text-gray-700">Upcoming & Past</div>
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
                            {start.toLocaleString("id-ID")} – {end.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {m.notes && <div className="mt-1 text-gray-700">{m.notes}</div>}
                        <div className="mt-2">
                          {m.link ? (
                            <a className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50" href={m.link} target="_blank" rel="noreferrer">
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
