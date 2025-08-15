// E:\FMGIH\fmg-industry-hub\src\app\admin\projects\page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";
import AdminPanel, {
  AdminTabKey, AdminProjectRow, PicOption, StageOption, StatusOption,
} from "@/app/admin/ui/AdminPanel";

type CountResp = { count: number | null; error: unknown };

const QUERY_COLS =
  "id,project_name,artist_name,genre,stage,status,latest_update,is_active,is_finished,assigned_pic,progress_percent,budget_amount,budget_currency,engineer_name,anr_name";

export default function AdminProjectsPage(): React.JSX.Element {
  useFocusWarmAuth();

  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => getSupabaseClient(), []);

  // ---------- tabs ----------
  const validTabs: AdminTabKey[] = ["All", "Active", "Finished", "Pending", "Unassigned"];
  const initialTabRaw = (params.get("tab") as AdminTabKey) || "All";
  const initialTab: AdminTabKey = validTabs.includes(initialTabRaw) ? initialTabRaw : "All";
  const [activeTab, setActiveTab] = useState<AdminTabKey>(initialTab);

  // ---------- filters ----------
  const [search, setSearch] = useState("");
  const [filterPIC, setFilterPIC] = useState<PicOption>("any");
  const [filterStage, setFilterStage] = useState<StageOption>("any");
  const [filterStatus, setFilterStatus] = useState<StatusOption>("any");

  // debounce search
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setQ(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  // ---------- paging ----------
  const [pageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ---------- data ----------
  const [rows, setRows] = useState<AdminProjectRow[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<AdminTabKey, number | null>>({
    All: null, Active: null, Finished: null, Pending: null, Unassigned: null,
  });

  // filter options (diambil SEKALI di page.tsx, bukan di child)
  const [picOptions, setPicOptions] = useState<PicOption[]>(["any"]);
  const [stageOptions, setStageOptions] = useState<StageOption[]>(["any"]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(["any"]);

  // ui state
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [didInit, setDidInit] = useState(false);

  // abort
  const abortRef = useRef<AbortController | null>(null);

  // ---------- counts ----------
  const fetchCounts = useCallback(
    async (signal: AbortSignal) => {
      const base = supabase.from("project_summary").select("id", { count: "exact", head: true });

      const applyAllFilters = (qb: ReturnType<typeof base["abortSignal"]> extends infer _T ? typeof base : typeof base) => {
        let b = qb;
        if (q) {
          const like = `%${q}%`;
          b = b.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
        }
        if (filterPIC !== "any") b = b.eq("assigned_pic", filterPIC);
        if (filterStage !== "any") b = b.eq("stage", filterStage);
        if (filterStatus !== "any") b = b.eq("status", filterStatus);
        return b.abortSignal(signal);
      };

      const allQ = applyAllFilters(base);
      const actQ = applyAllFilters(base.eq("is_active", true));
      const finQ = applyAllFilters(base.eq("is_finished", true));
      const penQ = applyAllFilters(base.eq("is_active", false).eq("is_finished", false));
      const unQ  = applyAllFilters(base.is("assigned_pic", null));

      const [allR, actR, finR, penR, unR] = (await Promise.all([allQ, actQ, finQ, penQ, unQ])) as [
        CountResp, CountResp, CountResp, CountResp, CountResp
      ];

      if (allR.error) throw allR.error;
      if (actR.error) throw actR.error;
      if (finR.error) throw finR.error;
      if (penR.error) throw penR.error;
      if (unR.error) throw unR.error;

      return {
        All: allR.count ?? 0,
        Active: actR.count ?? 0,
        Finished: finR.count ?? 0,
        Pending: penR.count ?? 0,
        Unassigned: unR.count ?? 0,
      } as const;
    },
    [supabase, q, filterPIC, filterStage, filterStatus]
  );

  // ---------- filter options (only page.tsx) ----------
  const fetchFilterOptions = useCallback(async () => {
    // ambil nilai unik dari keseluruhan dataset (limit aman)
    const [picsR, stagesR, statusesR] = await Promise.all([
      supabase.from("project_summary").select("assigned_pic").not("assigned_pic", "is", null).limit(2000),
      supabase.from("project_summary").select("stage").not("stage", "is", null).limit(2000),
      supabase.from("project_summary").select("status").not("status", "is", null).limit(2000),
    ]);

    const uniq = (arr: (string | null)[]) =>
      Array.from(new Set(arr.filter((x): x is string => !!x))).sort((a, b) => a.localeCompare(b));

    const picList = ["any", ...uniq((picsR.data ?? []).map(r => r.assigned_pic as string | null))] as PicOption[];
    const stageList = ["any", ...uniq((stagesR.data ?? []).map(r => r.stage as string | null))] as StageOption[];
    const statusList = ["any", ...uniq((statusesR.data ?? []).map(r => r.status as string | null))] as StatusOption[];

    setPicOptions(picList);
    setStageOptions(stageList);
    setStatusOptions(statusList);
  }, [supabase]);

  // ---------- page data ----------
  const fetchPage = useCallback(
    async (isInitial = false) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      if (isInitial) setLoadingInitial(true);
      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let qb = supabase
          .from("project_summary")
          .select(QUERY_COLS, { count: "exact", head: false });

        if (q) {
          const like = `%${q}%`;
          qb = qb.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
        }
        if (filterPIC !== "any") qb = qb.eq("assigned_pic", filterPIC);
        if (filterStage !== "any") qb = qb.eq("stage", filterStage);
        if (filterStatus !== "any") qb = qb.eq("status", filterStatus);

        if (activeTab === "Active") qb = qb.eq("is_active", true);
        else if (activeTab === "Finished") qb = qb.eq("is_finished", true);
        else if (activeTab === "Pending") qb = qb.eq("is_active", false).eq("is_finished", false);
        else if (activeTab === "Unassigned") qb = qb.is("assigned_pic", null);

        qb = qb.order("latest_update", { ascending: false }).range(from, to).abortSignal(ac.signal);

        const countsP = fetchCounts(ac.signal);

        const listR = await qb;
        if ((listR as { error?: unknown }).error) throw (listR as { error: unknown }).error;

        const listData = (listR as { data: unknown }).data as AdminProjectRow[] | null;
        const listCount = (listR as { count: number | null }).count ?? 0;

        const counts = await countsP;

        setRows(listData ?? []);
        setTotalCount(listCount);
        setTabCounts(counts);
      } catch (e) {
        if ((e as { name?: string }).name !== "AbortError") {
          console.error("admin/projects fetch error:", e);
        }
      } finally {
        if (abortRef.current === ac) abortRef.current = null;
        if (isInitial) setLoadingInitial(false);
      }
    },
    [supabase, page, pageSize, q, activeTab, filterPIC, filterStage, filterStatus, fetchCounts]
  );

  // initial
  useEffect(() => {
    (async () => {
      await supabase.auth.getSession().catch(() => {});
      await fetchFilterOptions();           // <-- options sekali, di page.tsx
      await fetchPage(true);
      setDidInit(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // updates on state change (no spinner)
  useEffect(() => {
    if (!didInit) return;
    void fetchPage(false);
  }, [didInit, activeTab, q, filterPIC, filterStage, filterStatus, page, fetchPage]);

  // wake/refresh
  useEffect(() => {
    const onWake = () => fetchPage(false);
    const onRefresh = () => fetchPage(true);
    window.addEventListener("admin-wake", onWake);
    window.addEventListener("admin-refresh", onRefresh);
    return () => {
      window.removeEventListener("admin-wake", onWake);
      window.removeEventListener("admin-refresh", onRefresh);
    };
  }, [fetchPage]);

  // url sync for tab
  const setTabAndUrl = (t: AdminTabKey) => {
    setPage(1);
    setActiveTab(t);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", t);
      router.replace(url.pathname + "?" + url.searchParams.toString());
    }
  };

  // bulk actions (mutasi langsung; nama tabel "projects" sesuaikan jika berbeda)
  const bulkAssignPIC = async (ids: string[], pic: string | null) => {
    if (ids.length === 0) return;
    const { error } = await supabase.from("projects").update({ assigned_pic: pic }).in("id", ids);
    if (error) console.error(error);
    await fetchPage(false);
  };

  const bulkMarkFinished = async (ids: string[]) => {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("projects")
      .update({ status: "finished", is_finished: true, is_active: false })
      .in("id", ids);
    if (error) console.error(error);
    await fetchPage(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <AdminPanel
        activeTab={activeTab}
        counts={tabCounts}
        onTabChange={setTabAndUrl}
        search={search}
        onSearchChange={(v) => { setPage(1); setSearch(v); }}
        filterPIC={filterPIC}
        filterStage={filterStage}
        filterStatus={filterStatus}
        onFilterPIC={(v) => { setPage(1); setFilterPIC(v); }}
        onFilterStage={(v) => { setPage(1); setFilterStage(v); }}
        onFilterStatus={(v) => { setPage(1); setFilterStatus(v); }}
        filterOptions={{ picOptions, stageOptions, statusOptions }}
        loading={loadingInitial}
        rows={rows}
        totalCount={totalCount}
        currentPage={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onOpen={(id) => router.push(`/admin/projects/${id}`)}
        onBulkAssignPIC={bulkAssignPIC}
        onBulkMarkFinished={bulkMarkFinished}
      />
    </div>
  );
}
