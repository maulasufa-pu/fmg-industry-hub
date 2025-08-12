"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ProjectTabsSection } from "./ProjectTabsSection";
import { ProjectTableSection } from "./ProjectTableSection";
import { ProjectPaginationSection } from "./ProjectPaginationSection";
import { useFocusWarmAuth, ensureFreshSession } from "@/lib/supabase/safe";


type TabKey = "All Project" | "Active" | "Finished" | "Pending" | "Requested";

type ProjectRow = {
  id: string;
  project_name: string;
  artist_name: string | null;
  genre: string | null;
  stage: string | null;
  status: string;
  latest_update: string | null;
  assigned_pic: string | null;
  progress_percent: number | null;
  budget_amount: number | null;
  budget_currency: string | null;
  engineer_name: string | null;
  anr_name: string | null;
  is_active?: boolean | null;
  is_finished?: boolean | null;
};

export default function PageContent(): React.JSX.Element {
  useFocusWarmAuth();

  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const validTabs: TabKey[] = ["All Project", "Active", "Finished", "Pending", "Requested"];
  const initialTabRaw = (params.get("tab") as TabKey) || "All Project";
  const initialTabFromUrl: TabKey = validTabs.includes(initialTabRaw) ? initialTabRaw : "All Project";

  // UI state
  const [activeTab, setActiveTab] = useState<TabKey>(initialTabFromUrl);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Data state (HANYA DIISI SEKALI)
  const [loading, setLoading] = useState(true);
  const [allRows, setAllRows] = useState<ProjectRow[]>([]);

  // ---- LOAD SEKALI SAAT MOUNT ----
  useEffect(() => {
  let mounted = true;
  let alive = true;

  (async () => {
    setLoading(true);
    await ensureFreshSession();

    const { data, error } = await supabase
      .from("project_summary")
      .select(
        "id,project_name,artist_name,genre,stage,status,latest_update,is_active,is_finished,assigned_pic,progress_percent,budget_amount,budget_currency,engineer_name,anr_name"
      )
      .order("id", { ascending: true })
      .returns<ProjectRow[]>(); // ⬅️ penting: pastikan tipe rows

    if (!mounted) return;
    if (!alive) return;

    if (error) {
      console.error("LOAD error", error);
      setAllRows([]);
    } else {
      setAllRows(data ?? []);
    }

    setLoading(false);
  })();

  return () => {
    mounted = false;
    alive = false;
  };
}, [supabase]);


  // ---- Client-only filter (tab + search) ----
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = allRows;

    // Tab filter
    switch (activeTab) {
      case "Active":
        base = base.filter((r) => r.is_active === true);
        break;
      case "Finished":
        base = base.filter((r) => r.is_finished === true);
        break;
      case "Pending":
        base = base.filter((r) => r.is_active === false && r.is_finished === false);
        break;
      case "Requested":
        base = []; // belum ada definisi data "requested" di source
        break;
      default:
        // "All Project" -> tidak difilter
        break;
    }

    // Search filter (simple contains)
    if (q.length >= 2) {
      base = base.filter((r) => {
        const hay =
          (r.project_name ?? "") +
          " " +
          (r.artist_name ?? "") +
          " " +
          (r.genre ?? "");
        return hay.toLowerCase().includes(q);
      });
    }

    return base;
  }, [allRows, activeTab, search]);

  // ---- counts untuk tabs (hitung dari allRows sekali jalan) ----
  const counts = useMemo((): Record<TabKey, number | null> => {
    const all = allRows.length;
    const act = allRows.filter((r) => r.is_active === true).length;
    const fin = allRows.filter((r) => r.is_finished === true).length;
    const pen = allRows.filter((r) => r.is_active === false && r.is_finished === false).length;
    return {
      "All Project": all,
      Active: act,
      Finished: fin,
      Pending: pen,
      Requested: 0,
    };
  }, [allRows]);

  // ---- pagination (client-side) ----
  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const pagedRows = useMemo(() => {
    const from = (pageSafe - 1) * pageSize;
    return filteredRows.slice(from, from + pageSize);
  }, [filteredRows, pageSafe, pageSize]);

  // ---- helpers ----
  const setActiveTabAndUrl = (tab: TabKey) => {
    setPage(1);
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      router.replace(url.pathname + "?" + url.searchParams.toString());
    }
  };

  const openProject = (id: string) => {
    // langsung push; kalau balik ke /client/projects, boleh refresh lagi (load 1x lagi)
    router.push(`/client/projects/${id}?tab=${encodeURIComponent(activeTab)}`);
  };

  // ---- render ----
  return (
    <div className="flex flex-col gap-6 p-6">
      <ProjectTabsSection
        activeTab={activeTab}
        initialTab={initialTabFromUrl}
        onTabChange={(t) => {
          setPage(1);
          setActiveTabAndUrl(t);
        }}
        onSearchChange={(q) => {
          setPage(1);
          setSearch(q);
        }}
        externalCounts={counts}
        onCreateClick={() => {}}
      />

      {loading && (
        <div className="w-full bg-white rounded-lg border border-gray-200 shadow p-10 text-center text-gray-500">
          Loading projects…
        </div>
      )}

      {!loading && (
        <ProjectTableSection
          rows={pagedRows.map((r) => ({
            id: r.id,
            projectName: r.project_name,
            artistName: r.artist_name,
            genre: r.genre,
            stage: r.stage,
            progressStatus: r.status,
            latestUpdate: r.latest_update,
            assignedPIC: r.assigned_pic ?? "-",
            budget:
              r.budget_amount != null
                ? `${(r.budget_currency ?? "IDR").toUpperCase()} ${Number(r.budget_amount).toLocaleString("id-ID")}`
                : undefined,
            assignedEngineer: r.engineer_name ?? "-",
            assignedANR: r.anr_name ?? "-",
            coverUrl: undefined,
            description: undefined,
            progress: r.progress_percent != null ? Number(r.progress_percent) : null,
            activities: [],
          }))}
          onOpenProject={openProject}
        />
      )}

      {!loading && (
        <ProjectPaginationSection
          currentPage={pageSafe}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
