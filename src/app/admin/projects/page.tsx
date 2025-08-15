"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";
import AdminProjectTabsSection, {
  AdminTabKey,
  PicOption,
  StageOption,
  StatusOption,
} from "@/app/admin/ui/AdminProjectTabsSection";
import AdminProjectTableSection, { AdminProjectRow } from "@/app/admin/ui/AdminProjectTableSection";
import AdminProjectPagination from "@/app/admin/ui/AdminProjectPagination";

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
    All: null,
    Active: null,
    Finished: null,
    Pending: null,
    Unassigned: null,
  });

  // ui state
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [didInit, setDidInit] = useState(false);

  // abort
  const abortRef = useRef<AbortController | null>(null);

  // ---------- helpers (generic constraints, no intersection nesting) ----------
//   const applyTextFilter = <T extends { or(expr: string): T }>(qb: T, text: string): T => {
//     if (!text) return qb;
//     const like = `%${text}%`;
//     return qb.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
//   };

//   const applyFacetFilters = <T extends { eq(col: string, val: unknown): T }>(
//     qb: T,
//     pic: PicOption,
//     stage: StageOption,
//     status: StatusOption
//   ): T => {
//     let out = qb;
//     if (pic !== "any") out = out.eq("assigned_pic", pic);
//     if (stage !== "any") out = out.eq("stage", stage);
//     if (status !== "any") out = out.eq("status", status);
//     return out;
//   };

//   const applyTab = <T extends { eq(c: string, v: unknown): T; is(c: string, v: unknown): T }>(
//     qb: T,
//     tab: AdminTabKey
//   ): T => {
//     if (tab === "Active") return qb.eq("is_active", true);
//     if (tab === "Finished") return qb.eq("is_finished", true);
//     if (tab === "Pending") return qb.eq("is_active", false).eq("is_finished", false);
//     if (tab === "Unassigned") return qb.is("assigned_pic", null);
//     return qb;
//   };

  // ---------- counts ----------
  const fetchCounts = useCallback(
    async (signal: AbortSignal) => {
        // builder dasar
        const base = supabase.from("project_summary").select("id", { count: "exact", head: true });

        // fungsi kecil untuk menerapkan SEMUA filter (search + facet)
        const applyAllFilters = (qb: ReturnType<typeof base["abortSignal"]> extends infer _T
        ? typeof base
        : typeof base) => {
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

        // builder list
        let qb = supabase
            .from("project_summary")
            .select(QUERY_COLS, { count: "exact", head: false });

        // search text
        if (q) {
            const like = `%${q}%`;
            qb = qb.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
        }

        // facet filters
        if (filterPIC !== "any") qb = qb.eq("assigned_pic", filterPIC);
        if (filterStage !== "any") qb = qb.eq("stage", filterStage);
        if (filterStatus !== "any") qb = qb.eq("status", filterStatus);

        // tab filter
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

  // bulk actions (NOTE: sesuaikan nama tabel mutasi jika berbeda dari "projects")
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
      <AdminProjectTabsSection
        activeTab={activeTab}
        counts={tabCounts}
        search={search}
        onSearchChange={(v) => {
          setPage(1);
          setSearch(v);
        }}
        filterPIC={filterPIC}
        filterStage={filterStage}
        filterStatus={filterStatus}
        onFilterPIC={(v) => {
          setPage(1);
          setFilterPIC(v);
        }}
        onFilterStage={(v) => {
          setPage(1);
          setFilterStage(v);
        }}
        onFilterStatus={(v) => {
          setPage(1);
          setFilterStatus(v);
        }}
        onTabChange={(t) => setTabAndUrl(t)}
        onCreate={() => router.push("/admin/projects/new")}
      />

      {loadingInitial ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500 shadow">
          Loading projects…
        </div>
      ) : (
        <>
          <AdminProjectTableSection
            rows={rows}
            onOpen={(id) => router.push(`/admin/projects/${id}`)}
            onBulkAssignPIC={bulkAssignPIC}
            onBulkMarkFinished={bulkMarkFinished}
          />

          <AdminProjectPagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(totalCount / pageSize))}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
