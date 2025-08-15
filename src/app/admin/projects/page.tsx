// E:\FMGIH\fmg-industry-hub\src\app\admin\projects\page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient, withSignal } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";
import AdminPanel, {
  AdminTabKey, AdminProjectRow, PicOption, StageOption, StatusOption,
} from "@/app/admin/ui/AdminPanel";

const VIEW = "project_summary";
const QUERY_COLS =
  "id,project_name,artist_name,genre,stage,status,latest_update,is_active,is_finished,assigned_pic,progress_percent,budget_amount,budget_currency,engineer_name,anr_name";

type CountResp = { count: number | null; error: unknown };
type PostgrestList<T> = { data: T[] | null; count: number | null; error?: unknown };

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

  // debounce search (samakan dengan client)
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
    All: null, Active: null, Finished: null, Pending: null, Unassigned: null,
  });

  // filter options (diambil SEKALI di page.tsx, bukan di child)
  const [picOptions, setPicOptions] = useState<PicOption[]>(["any"]);
  const [stageOptions, setStageOptions] = useState<StageOption[]>(["any"]);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>(["any"]);

  // ui state
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [didInit, setDidInit] = useState(false);

  // Abort (samakan gaya client: assign controller baru tiap fetch; tanpa explicit abort sebelumnya)
  const abortRef = useRef<AbortController | null>(null);

  // ---------- counts (berurutan; count: "exact") ----------
  type CountResp = { count: number | null; error: unknown };

const fetchCounts = useCallback(
  async (qStr: string, signal: AbortSignal) => {
    const like = qStr ? `%${qStr}%` : null;

    // ALL
    let allQ = supabase.from(VIEW).select("id", { count: "exact", head: true });
    if (like) allQ = allQ.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
    if (filterPIC !== "any")   allQ = allQ.eq("assigned_pic", filterPIC);
    if (filterStage !== "any") allQ = allQ.eq("stage",       filterStage);
    if (filterStatus !== "any")allQ = allQ.eq("status",      filterStatus);
    const allRes = await withSignal(allQ, signal).returns<CountResp>();

    // ACTIVE
    let actQ = supabase.from(VIEW).select("id", { count: "exact", head: true }).eq("is_active", true);
    if (like) actQ = actQ.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
    if (filterPIC !== "any")   actQ = actQ.eq("assigned_pic", filterPIC);
    if (filterStage !== "any") actQ = actQ.eq("stage",       filterStage);
    if (filterStatus !== "any")actQ = actQ.eq("status",      filterStatus);
    const actRes = await withSignal(actQ, signal).returns<CountResp>();

    // FINISHED
    let finQ = supabase.from(VIEW).select("id", { count: "exact", head: true }).eq("is_finished", true);
    if (like) finQ = finQ.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
    if (filterPIC !== "any")   finQ = finQ.eq("assigned_pic", filterPIC);
    if (filterStage !== "any") finQ = finQ.eq("stage",       filterStage);
    if (filterStatus !== "any")finQ = finQ.eq("status",      filterStatus);
    const finRes = await withSignal(finQ, signal).returns<CountResp>();

    // PENDING (samakan client: strict FALSE)
    let penQ = supabase.from(VIEW).select("id", { count: "exact", head: true })
      .eq("is_active", false).eq("is_finished", false);
    if (like) penQ = penQ.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
    if (filterPIC !== "any")   penQ = penQ.eq("assigned_pic", filterPIC);
    if (filterStage !== "any") penQ = penQ.eq("stage",       filterStage);
    if (filterStatus !== "any")penQ = penQ.eq("status",      filterStatus);
    const penRes = await withSignal(penQ, signal).returns<CountResp>();

    // UNASSIGNED
    let unQ = supabase.from(VIEW).select("id", { count: "exact", head: true }).is("assigned_pic", null);
    if (like) unQ = unQ.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
    if (filterPIC !== "any")   unQ = unQ.eq("assigned_pic", filterPIC);
    if (filterStage !== "any") unQ = unQ.eq("stage",       filterStage);
    if (filterStatus !== "any")unQ = unQ.eq("status",      filterStatus);
    const unRes = await withSignal(unQ, signal).returns<CountResp>();

    if (allRes.error) throw allRes.error;
    if (actRes.error) throw actRes.error;
    if (finRes.error) throw finRes.error;
    if (penRes.error) throw penRes.error;
    if (unRes.error) throw unRes.error;

    return {
      All:        allRes.count ?? 0,
      Active:     actRes.count ?? 0,
      Finished:   finRes.count ?? 0,
      Pending:    penRes.count ?? 0,
      Unassigned: unRes.count ?? 0,
    } as Record<AdminTabKey, number>;
  },
  [supabase, filterPIC, filterStage, filterStatus]
);

  // ---------- filter options (only once) ----------
  const fetchFilterOptions = useCallback(async () => {
    const [picsR, stagesR, statusesR] = await Promise.all([
      supabase.from(VIEW).select("assigned_pic").not("assigned_pic", "is", null).limit(2000),
      supabase.from(VIEW).select("stage").not("stage", "is", null).limit(2000),
      supabase.from(VIEW).select("status").not("status", "is", null).limit(2000),
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

  // ---------- page data (samakan pola client) ----------
  const fetchPage = useCallback(
  async (tab: AdminTabKey, qStr: string, pageIdx: number, isInitial = false) => {
    abortRef.current = new AbortController();
    const ac = abortRef.current;

    if (isInitial) setLoadingInitial(true);
    try {
      const from = (pageIdx - 1) * pageSize;
      const to = from + pageSize - 1;

      let qBuilder = supabase.from(VIEW).select(QUERY_COLS, { count: "exact", head: false });

      if (qStr) {
        const like = `%${qStr}%`;
        qBuilder = qBuilder.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
      }
      if (filterPIC !== "any")   qBuilder = qBuilder.eq("assigned_pic", filterPIC);
      if (filterStage !== "any") qBuilder = qBuilder.eq("stage",       filterStage);
      if (filterStatus !== "any")qBuilder = qBuilder.eq("status",      filterStatus);

      if (tab === "Active")       qBuilder = qBuilder.eq("is_active", true);
      else if (tab === "Finished")qBuilder = qBuilder.eq("is_finished", true);
      else if (tab === "Pending") qBuilder = qBuilder.eq("is_active", false).eq("is_finished", false);
      else if (tab === "Unassigned") qBuilder = qBuilder.is("assigned_pic", null);

      qBuilder = qBuilder.order("latest_update", { ascending: false }).range(from, to);

      const { data, count, error } = await withSignal(qBuilder, ac.signal).returns<AdminProjectRow[]>();
      if (error) throw error;

      const counts = await fetchCounts(qStr, ac.signal);

      setRows(data ?? []);
      setTotalCount(count ?? 0);    // ambil dari list (persis client)
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
  [supabase, pageSize, filterPIC, filterStage, filterStatus, fetchCounts]
);


  // ---------- initial ----------
  useEffect(() => {
    (async () => {
      setPage(1);
      await supabase.auth.getSession().catch(() => {});
      await fetchFilterOptions();
      await fetchPage(initialTab, "", 1, true);
      setDidInit(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- re-fetch tanpa spinner ----------
  useEffect(() => {
    if (!didInit) return;
    void fetchPage(activeTab, debouncedSearch, page, false);
  }, [didInit, activeTab, debouncedSearch, page, fetchPage, filterPIC, filterStage, filterStatus]);

  // ---------- wake/refresh ----------
  useEffect(() => {
    const onWake = () => fetchPage(activeTab, debouncedSearch, page, false);
    const onRefresh = () => fetchPage(activeTab, debouncedSearch, page, true);
    window.addEventListener("admin-wake", onWake);
    window.addEventListener("admin-refresh", onRefresh);
    return () => {
      window.removeEventListener("admin-wake", onWake);
      window.removeEventListener("admin-refresh", onRefresh);
    };
  }, [fetchPage, activeTab, debouncedSearch, page]);

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
    await fetchPage(activeTab, debouncedSearch, page, false);
  };

  const bulkMarkFinished = async (ids: string[]) => {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("projects")
      .update({ status: "finished", is_finished: true, is_active: false })
      .in("id", ids);
    if (error) console.error(error);
    await fetchPage(activeTab, debouncedSearch, page, false);
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
