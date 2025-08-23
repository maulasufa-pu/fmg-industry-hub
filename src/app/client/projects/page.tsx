// src/app/admin/projects/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";
import { getEffectiveRole } from "@/lib/roles/effective";
import type { UserRole } from "@/lib/roles";
import { Plus } from "lucide-react";
import CreateProjectPopover from "../../ui/panel/projects/CreateProjectPopover";
import ProjectList, {
  TabKey, ProjectRow, PicOption, StageOption, StatusOption,
} from "@/app/ui/panel/projects/project_list";

const VIEW = "project_summary";

const QUERY_COLS =
  "project_id,title,status,stage,updated_at,client_id,artist_name,genre,progress_percent,composer_id,producer_id,anr_id,engineer_id,publisher_id,client_first_name,client_last_name";

// Function to fetch assignment names for projects
const fetchAssignmentNames = async (supabase: any, projectIds: string[]) => {
  if (projectIds.length === 0) return {};

  try {
    const { data: assignments, error: assignmentsError } = await supabase
      .from("assignment_view")
      .select("project_id, user_id, role, staff_first_name")
      .in("project_id", projectIds)
      .eq("active", true);

    if (assignmentsError) {
      console.warn("Assignments view fetch error:", assignmentsError);
      return {};
    }

    if (!assignments || assignments.length === 0) return {};

    const assignmentMap: Record<string, Record<string, string>> = {};
    assignments.forEach((assignment: any) => {
      const projectId = assignment.project_id;
      const userId = assignment.user_id;
      const role = assignment.role;
      const staffName = assignment.staff_first_name?.trim() || "";
      if (!assignmentMap[projectId]) assignmentMap[projectId] = {};
      assignmentMap[projectId][role] = staffName || `User ${userId}`;
    });

    return assignmentMap;
  } catch (error) {
    console.warn("Assignment names fetch error:", error);
    return {};
  }
};

type DbProjectSummary = {
  project_id: string;
  title: string;
  status: string | null;
  stage: string | null;
  updated_at: string;
  client_id: string | null;
  artist_name: string | null;
  genre: string | null;
  progress_percent: number | null;
  composer_id: string | null;
  producer_id: string | null;
  anr_id: string | null;
  engineer_id: string | null;
  publisher_id: string | null;
  client_first_name: string | null;
  client_last_name: string | null;
};

export default function ClientProjectsPage(): React.ReactElement {
  useFocusWarmAuth();

  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [openRequest, setOpenRequest] = useState(false);
  const requestBtnRef = useRef<HTMLButtonElement | null>(null);

  const getClientName = (row: DbProjectSummary): string => {
    const first = row.client_first_name?.trim() ?? "";
    const last = row.client_last_name?.trim() ?? "";
    let full = (first || last) ? `${first} ${last}`.trim() : "-";
    if (full.length > 25) full = `${full.slice(0, 22)}...`;
    return full;
  };

  // ===== role & user =====
  const [role, setRole] = useState<UserRole>("guest");
  const [myId, setMyId] = useState<string | null>(null);
  const [roleReady, setRoleReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await getEffectiveRole();
        if (alive) setRole(r);
        const { data: { user } } = await supabase.auth.getUser();
        if (alive) setMyId(user?.id ?? null);
      } finally {
        if (alive) setRoleReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase]);

  // ---------- tabs (client-only) ----------
  const validTabs: TabKey[] = ["All", "Active", "Finished", "Pending"]; // client tidak punya Unassigned/Requested
  const initialTabRaw = (params.get("tab") as TabKey) || "All";
  const initialTab: TabKey = validTabs.includes(initialTabRaw) ? initialTabRaw : "All";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // ---------- filters ----------
  const [search, setSearch] = useState("");
  const [filterPIC, setFilterPIC] = useState<PicOption>("any");
  const [filterStage, setFilterStage] = useState<StageOption>("any");
  const [filterStatus, setFilterStatus] = useState<StatusOption>("any");

  // debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  // ---------- paging ----------
  const [pageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ---------- data ----------
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<TabKey, number | null>>({
    All: null, Active: null, Finished: null, Pending: null,
    // keys yg tidak dipakai tetap disediakan untuk tipe:
    Unassigned: 0, // disembunyikan di ProjectList untuk client
    Requested: 0,
  });

  // filter options
  const [picOptions, setPicOptions] = useState<PicOption[]>(["any"]);
  const [stageOptions, setStageOptions] = useState<StageOption[]>(["any"]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(["any"]);

  // ui state
  const [loadingInitial, setLoadingInitial] = useState(true);

  // SIMPLE COUNTS - client scope
  const fetchCounts = useCallback(async () => {
    if (!myId) {
      return { All: 0, Active: 0, Finished: 0, Pending: 0, Unassigned: 0, Requested: 0 };
    }
    try {
      const [all, active, finished, pending] = await Promise.all([
        supabase.from(VIEW).select("project_id", { count: "estimated", head: true }).eq("client_id", myId),
        supabase.from(VIEW).select("project_id", { count: "estimated", head: true }).eq("status", "in_progress").eq("client_id", myId),
        supabase.from(VIEW).select("project_id", { count: "estimated", head: true }).in("status", ["completed", "finished"]).eq("client_id", myId),
        supabase.from(VIEW).select("project_id", { count: "estimated", head: true }).in("status", ["pending", "on_hold"]).eq("client_id", myId),
      ]);

      return {
        All: all.count || 0,
        Active: active.count || 0,
        Finished: finished.count || 0,
        Pending: pending.count || 0,
        Unassigned: 0,
        Requested: 0,
      };
    } catch (err) {
      console.warn("Count error:", err);
      return { All: 0, Active: 0, Finished: 0, Pending: 0, Unassigned: 0, Requested: 0 };
    }
  }, [supabase, myId]);

  // SIMPLE DATA FETCH - client scope
  const fetchPage = useCallback(async (tab: TabKey, pageNum: number) => {
    try {
      if (!myId) {
        setRows([]);
        setTotalCount(0);
        return;
      }

      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from(VIEW).select(QUERY_COLS, { count: "estimated" }).eq("client_id", myId);

      // Apply tab filter (client doesn't use Unassigned/Requested)
      if (tab === "Active") query = query.eq("status", "in_progress");
      else if (tab === "Finished") query = query.in("status", ["completed", "finished"]);
      else if (tab === "Pending") query = query.in("status", ["pending", "on_hold"]);

      // Apply search
      if (debouncedSearch) {
        const like = `%${debouncedSearch}%`;
        query = query.or(`title.ilike.${like},artist_name.ilike.${like}`);
      }

      // Apply filters
      if (filterStage !== "any") query = query.eq("stage", filterStage);
      if (filterStatus !== "any") query = query.eq("status", filterStatus);

      const { data, count, error } = await query
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const projectIds = (data ?? []).map(r => r.project_id);

      // Fetch assignment names for these projects
      const assignmentNames = await fetchAssignmentNames(supabase, projectIds);

      const mapped: ProjectRow[] = (data ?? []).map((r: DbProjectSummary) => {
        const assignments = assignmentNames[r.project_id] || {};
        return {
          project_id: r.project_id,
          title: r.title,
          status: r.status,
          stage: r.stage,
          updated_at: r.updated_at,
          client_id: r.client_id,
          client_name: r.client_id ? getClientName(r) : "-",
          artist_name: r.artist_name,
          genre: r.genre,
          progress_percent: r.progress_percent,
          composer_id: r.composer_id,
          composer_name: assignments["composer"] || null,
          producer_id: r.producer_id,
          producer_name: assignments["producer"] || null,
          anr_id: r.anr_id,
          anr_name: assignments["anr"] || null,
          engineer_id: r.engineer_id,
          engineer_name: assignments["engineer"] || null,
          publisher_id: r.publisher_id,
          publisher_name: assignments["publisher"] || null,
        };
      });

      setRows(mapped);
      setTotalCount(count || 0);
    } catch (error) {
      console.warn("Fetch error:", error);
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoadingInitial(false);
    }
  }, [supabase, pageSize, debouncedSearch, filterStage, filterStatus, myId]);

  // Load counts when ready
  useEffect(() => {
    if (!roleReady) return;
    fetchCounts().then(setTabCounts);
  }, [fetchCounts, roleReady]);

  // Load data when ready / filters change
  useEffect(() => {
    if (!roleReady) return;
    fetchPage(activeTab, page);
  }, [fetchPage, activeTab, page, roleReady]);

  // Load filter options (client scope)
  useEffect(() => {
    const loadOptions = async () => {
      try {
        if (!myId) {
          setStageOptions(["any"]);
          setStatusOptions(["any"]);
          return;
        }
        const { data } = await supabase.from(VIEW).select("stage,status").eq("client_id", myId);
        const stages = [...new Set((data || []).map(r => r.stage).filter(Boolean))];
        const statuses = [...new Set((data || []).map(r => r.status).filter(Boolean))];
        setPicOptions(["any"]); // PIC filtering still off
        setStageOptions(["any", ...stages]);
        setStatusOptions(["any", ...statuses]);
      } catch (err) {
        console.warn("Options load error:", err);
      }
    };
    loadOptions();
  }, [supabase, myId]);

  // Tab change -> client route
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setPage(1);
    router.push(`/client/projects?tab=${tab}`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleOpen = (project_id: string) => {
    router.push(`/client/projects/${project_id}`);
  };

  const handleBulkAssignPIC = async (ids: string[], pic: string | null) => {
    // Client biasanya tidak assign PIC — biarkan no-op/log
    console.log("Client bulk assign PIC (ignored):", ids, pic);
  };

  const handleBulkMarkFinished = async (ids: string[]) => {
    // Client biasanya tidak mark finished — biarkan no-op/log
    console.log("Client bulk mark finished (ignored):", ids);
  };

  // (Opsional) Jika mau hard-guard: non-client diarahkan ke admin
  // useEffect(() => {
  //   if (roleReady && role !== "client") {
  //     router.replace("/admin/projects");
  //   }
  // }, [role, roleReady, router]);

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar atas tabel */}
      <div className="flex items-center justify-end">
        <button
          ref={requestBtnRef}
          onClick={() => setOpenRequest(true)}
          className={[
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white",
            "bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-[0_12px_40px_rgba(99,102,241,.35)]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60",
            "hover:opacity-95 transition"
          ].join(" ")}
        >
          <Plus className="h-4 w-4" />
          Request New Project
        </button>
      </div>

      {/* POPUP Request New Project */}
      <ProjectList
        rows={rows}
        counts={tabCounts}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        search={search}
        onSearchChange={setSearch}
        filterPIC={filterPIC}
        filterStage={filterStage}
        filterStatus={filterStatus}
        onFilterPIC={setFilterPIC}
        onFilterStage={setFilterStage}
        onFilterStatus={setFilterStatus}
        filterOptions={{
          picOptions,
          stageOptions,
          statusOptions,
        }}
        loading={loadingInitial}
        totalCount={totalCount}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onOpen={handleOpen}
        onBulkAssignPIC={handleBulkAssignPIC}
        onBulkMarkFinished={handleBulkMarkFinished}
      />
    </div>
  );
}
