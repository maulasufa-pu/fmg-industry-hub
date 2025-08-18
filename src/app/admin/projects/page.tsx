// src/app/admin/projects/page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";
import AdminPanel, {
  AdminTabKey, AdminProjectRow, PicOption, StageOption, StatusOption,
} from "@/app/admin/ui/AdminPanel";

const VIEW = "project_summary";

const QUERY_COLS =
  "project_id,title,status,stage,updated_at,client_id,artist_name,genre,progress_percent,composer_id,producer_id,anr_id,engineer_id,publisher_id,client_first_name,client_last_name";

// Function to fetch assignment names for projects
const fetchAssignmentNames = async (supabase: any, projectIds: string[]) => {
  if (projectIds.length === 0) return {};
  
  try {
    // Get assignments data directly from assignments_view with staff_first_name
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignment_view')
      .select('project_id, user_id, role, staff_first_name')
      .in('project_id', projectIds)
      .eq('active', true);

    if (assignmentsError) {
      console.warn('Assignments view fetch error:', assignmentsError);
      return {};
    }

    if (!assignments || assignments.length === 0) return {};

    // Group assignments by project_id and role using staff_first_name from view
    const assignmentMap: Record<string, Record<string, string>> = {};
    
    assignments.forEach((assignment: any) => {
      const projectId = assignment.project_id;
      const userId = assignment.user_id;
      const role = assignment.role;
      const staffName = assignment.staff_first_name?.trim() || "";
      
      if (!assignmentMap[projectId]) {
        assignmentMap[projectId] = {};
      }
      
      // Use staff_first_name from assignments_view
      assignmentMap[projectId][role] = staffName || `User ${userId}`;
    });
    
    return assignmentMap;

  } catch (error) {
    console.warn('Assignment names fetch error:', error);
    return {};
  }
};

type ProfileName = {
  first_name: string | null;
  last_name: string | null;
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

export default function AdminProjectsPage(): React.JSX.Element {
  useFocusWarmAuth();

  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => getSupabaseClient(), []);

  type ProfileRow = {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };

  const getClientName = (row: DbProjectSummary): string => {
    const first = row.client_first_name?.trim() ?? "";
    const last = row.client_last_name?.trim() ?? "";
    let full = (first || last) ? `${first} ${last}`.trim() : "-";
    if (full.length > 25) full = `${full.slice(0, 22)}...`;
    return full;
  };


  // ---------- tabs ----------
  const validTabs: AdminTabKey[] = ["All", "Active", "Finished", "Pending", "Unassigned", "Requested"];
  const initialTabRaw = (params.get("tab") as AdminTabKey) || "All";
  const initialTab: AdminTabKey = validTabs.includes(initialTabRaw) ? initialTabRaw : "All";
  const [activeTab, setActiveTab] = useState<AdminTabKey>(initialTab);

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
  const [rows, setRows] = useState<AdminProjectRow[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<AdminTabKey, number | null>>({
    All: null, Active: null, Finished: null, Pending: null, Unassigned: null, Requested: null
  });

  // filter options
  const [picOptions, setPicOptions] = useState<PicOption[]>(["any"]);
  const [stageOptions, setStageOptions] = useState<StageOption[]>(["any"]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(["any"]);

  // ui state
  const [loadingInitial, setLoadingInitial] = useState(true);

  // SIMPLE COUNTS - NO BS
  const fetchCounts = useCallback(async () => {
    try {
      // Create separate queries for each count to avoid conflicts
      const [all, active, finished, pending, unassigned, requested] = await Promise.all([
        supabase.from(VIEW).select("project_id", { count: "estimated", head: true }),
        supabase.from(VIEW).select("project_id", { count: "estimated", head: true }).eq("status", "in_progress"),
        supabase.from(VIEW).select("project_id", { count: "estimated", head: true }).eq("status", "finished"),
        supabase.from(VIEW).select("project_id", { count: "estimated", head: true }).in("status", ["pending"]),
        supabase.from(VIEW).select("project_id", { count: "estimated", head: true })
          .is("composer_id", null)
          .is("producer_id", null)
          .is("anr_id", null)
          .is("engineer_id", null)
          .is("publisher_id", null),
        supabase.from(VIEW).select("project_id", { count: "estimated", head: true }).eq("status", "requested"),
      ]);

      return {
        All: all.count || 0,
        Active: active.count || 0,
        Finished: finished.count || 0,
        Pending: pending.count || 0,
        Unassigned: unassigned.count || 0,
        Requested: requested.count || 0,
      };
    } catch (err) {
      console.warn("Count error:", err);
      return { All: 0, Active: 0, Finished: 0, Pending: 0, Unassigned: 0, Requested: 0 };
    }
  }, [supabase]);

  // SIMPLE DATA FETCH - NO BS
  const fetchPage = useCallback(async (tab: AdminTabKey, pageNum: number) => {
    try {
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from(VIEW).select(QUERY_COLS, { count: "estimated" });

      // Apply tab filter
      if (tab === "Active") query = query.eq("status", "in_progress");
      else if (tab === "Finished") query = query.eq("status", "completed");
      else if (tab === "Pending") query = query.in("status", ["pending", "on_hold"]);
      else if (tab === "Unassigned") {
        query = query
          .is("composer_id", null)
          .is("producer_id", null)
          .is("anr_id", null)
          .is("engineer_id", null)
          .is("publisher_id", null);
      }

      // Apply search
      if (debouncedSearch) {
        const like = `%${debouncedSearch}%`;
        query = query.or(`title.ilike.${like},artist_name.ilike.${like}`);
      }

      // Apply filters - Note: PIC filtering now requires a different approach with assignments
      // For now, skip PIC filtering until we can implement assignment-based filtering
      if (filterStage !== "any") query = query.eq("stage", filterStage);
      if (filterStatus !== "any") query = query.eq("status", filterStatus);

      // Execute
      const { data, count, error } = await query
        .order("updated_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const clientIds = (data ?? []).map(r => r.client_id).filter((v): v is string => Boolean(v));
      const projectIds = (data ?? []).map(r => r.project_id);

      // Fetch assignment names for these projects
      const assignmentNames = await fetchAssignmentNames(supabase, projectIds);

      const mapped: AdminProjectRow[] = (data ?? []).map((r: DbProjectSummary) => {
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
          composer_name: assignments['composer'] || null,
          producer_id: r.producer_id,
          producer_name: assignments['producer'] || null,
          anr_id: r.anr_id,
          anr_name: assignments['anr'] || null,
          engineer_id: r.engineer_id,
          engineer_name: assignments['engineer'] || null,
          publisher_id: r.publisher_id,
          publisher_name: assignments['publisher'] || null,
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
  }, [supabase, pageSize, debouncedSearch, filterPIC, filterStage, filterStatus]);

  // Load counts on mount
  useEffect(() => {
    fetchCounts().then(setTabCounts);
  }, [fetchCounts]);

  // Load data when filters change
  useEffect(() => {
    fetchPage(activeTab, page);
  }, [fetchPage, activeTab, page]);

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const { data } = await supabase.from(VIEW).select("stage,status");
        
        const stages = [...new Set((data || []).map(r => r.stage).filter(Boolean))];
        const statuses = [...new Set((data || []).map(r => r.status).filter(Boolean))];

        setPicOptions(["any"]); // PIC filtering disabled for now with new schema
        setStageOptions(["any", ...stages]);
        setStatusOptions(["any", ...statuses]);
      } catch (err) {
        console.warn("Options load error:", err);
      }
    };
    loadOptions();
  }, [supabase]);

  const handleTabChange = (tab: AdminTabKey) => {
    setActiveTab(tab);
    setPage(1);
    router.push(`/admin/projects?tab=${tab}`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleOpen = (project_id: string) => {
    router.push(`/admin/projects/${project_id}`);
  };

  const handleBulkAssignPIC = async (ids: string[], pic: string | null) => {
    // TODO: Implement bulk assign
    console.log("Bulk assign PIC:", ids, pic);
  };

  const handleBulkMarkFinished = async (ids: string[]) => {
    // TODO: Implement bulk mark finished
    console.log("Bulk mark finished:", ids);
  };

  return (
    <div className="flex flex-col gap-6">
    <AdminPanel
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
    /></div>
  );
}
