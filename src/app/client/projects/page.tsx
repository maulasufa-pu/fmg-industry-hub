// src/app/client/projects/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectTabsSection } from "./ProjectTabsSection";
import { ProjectTableSection } from "./ProjectTableSection";
import { ProjectPaginationSection } from "./ProjectPaginationSection";
import { withSignal, getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";
import CreateProjectPopover from "./CreateProjectPopover";
import SubmitSuccessForm from "@/components/SubmitSuccessForm"; // <-- tambahkan ini

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

const QUERY_COLS =
  "id,project_name,artist_name,genre,stage,status,latest_update,is_active,is_finished,assigned_pic,progress_percent,budget_amount,budget_currency,engineer_name,anr_name";

export default function PageContent(): React.JSX.Element {
  useFocusWarmAuth();

  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => getSupabaseClient(), []);

  const validTabs: TabKey[] = ["All Project", "Active", "Finished", "Pending", "Requested"];
  const initialTabRaw = (params.get("tab") as TabKey) || "All Project";
  const initialTabFromUrl: TabKey = validTabs.includes(initialTabRaw) ? initialTabRaw : "All Project";

  // UI
  const [openCreate, setOpenCreate] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitInfo, setSubmitInfo] = useState<{ projectId: string | null; paymentPlan: "upfront" | "half" | "milestone" } | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>(initialTabFromUrl);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Debounce
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Data
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<TabKey, number | null>>({
    "All Project": null,
    Active: null,
    Finished: null,
    Pending: null,
    Requested: 0,
  });

  // Spinner hanya untuk initial load
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [didInit, setDidInit] = useState(false);

  // Abort
  const abortRef = useRef<AbortController | null>(null);

  const fetchCounts = useCallback(
    async (q: string, signal: AbortSignal) => {
      type CountResp = { count: number | null; error: unknown };

      const like = q ? `%${q}%` : null;

      // ALL
      let allQ = supabase.from("project_summary").select("id", { count: "exact", head: true });
      if (like) allQ = allQ.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
      const allRes = await withSignal(allQ, signal).returns<CountResp>();

      // ACTIVE
      let actQ = supabase.from("project_summary").select("id", { count: "exact", head: true }).eq("is_active", true);
      if (like) actQ = actQ.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
      const actRes = await withSignal(actQ, signal).returns<CountResp>();

      // FINISHED
      let finQ = supabase.from("project_summary").select("id", { count: "exact", head: true }).eq("is_finished", true);
      if (like) finQ = finQ.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
      const finRes = await withSignal(finQ, signal).returns<CountResp>();

      // PENDING
      let penQ = supabase
        .from("project_summary")
        .select("id", { count: "exact", head: true })
        .eq("is_active", false)
        .eq("is_finished", false);
      if (like) penQ = penQ.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`);
      const penRes = await withSignal(penQ, signal).returns<CountResp>();

      if (allRes.error) throw allRes.error;
      if (actRes.error) throw actRes.error;
      if (finRes.error) throw finRes.error;
      if (penRes.error) throw penRes.error;

      return {
        "All Project": allRes.count ?? 0,
        Active: actRes.count ?? 0,
        Finished: finRes.count ?? 0,
        Pending: penRes.count ?? 0,
        Requested: 0,
      } as Record<TabKey, number>;
    },
    [supabase]
  );

  const fetchPage = useCallback(
    async (tab: TabKey, q: string, pageIdx: number, isInitial = false) => {
      abortRef.current = new AbortController();
      const ac = abortRef.current;

      if (isInitial) setLoadingInitial(true);
      try {
        const from = (pageIdx - 1) * pageSize;
        const to = from + pageSize - 1;

        let qBuilder = supabase
          .from("project_summary")
          .select(QUERY_COLS, { count: "exact", head: false });

        if (tab === "Active") qBuilder = qBuilder.eq("is_active", true);
        else if (tab === "Finished") qBuilder = qBuilder.eq("is_finished", true);
        else if (tab === "Pending") qBuilder = qBuilder.eq("is_active", false).eq("is_finished", false);
        else if (tab === "Requested") qBuilder = qBuilder.eq("status", "requested");

        if (q) {
          qBuilder = qBuilder.or(
            `project_name.ilike.%${q}%,artist_name.ilike.%${q}%,genre.ilike.%${q}%`
          );
        }

        qBuilder = qBuilder.order("latest_update", { ascending: false }).range(from, to);

        const { data, count, error } = await withSignal(qBuilder, ac.signal).returns<ProjectRow[]>();
        if (error) throw error;

        const counts = await fetchCounts(q, ac.signal);

        setRows(data ?? []);
        setTotalCount(count ?? 0);
        setTabCounts(counts);
      } catch (e) {
        if ((e as { name?: string }).name !== "AbortError") console.error(e);
      } finally {
        if (abortRef.current === ac) abortRef.current = null;
        if (isInitial) setLoadingInitial(false);
      }
    },
    [fetchCounts, supabase]
  );

  // initial
  useEffect(() => {
    (async () => {
      setPage(1);
      await supabase.auth.getSession().catch(() => {});
      await fetchPage(initialTabFromUrl, "", 1, true);
      setDidInit(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-fetch tanpa spinner pada tab/search/page change
  useEffect(() => {
    if (!didInit) return;
    fetchPage(activeTab, debouncedSearch, page, false);
  }, [didInit, activeTab, debouncedSearch, page, fetchPage]);

  useEffect(() => {
    const onClientRefresh = () => {
      fetchPage(activeTab, debouncedSearch, page, true);
    };
    window.addEventListener('client-refresh', onClientRefresh);
    return () => {
      window.removeEventListener('client-refresh', onClientRefresh);
    };
  }, [fetchPage, activeTab, debouncedSearch, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);

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
    router.push(`/client/projects/${id}?tab=${encodeURIComponent(activeTab)}`);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <ProjectTabsSection
        activeTab={activeTab}
        initialTab={initialTabFromUrl}
        onTabChange={(t) => setActiveTabAndUrl(t)}
        onSearchChange={(q) => {
          setPage(1);
          setSearch(q);
        }}
        externalCounts={tabCounts}
        onCreateClick={() => setOpenCreate(true)}
      />

      {loadingInitial ? (
        <div className="w-full rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500 shadow">
          Loading projects…
        </div>
      ) : (
        <>
          <ProjectTableSection
            rows={rows.map((r) => ({
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

          <ProjectPaginationSection
            currentPage={pageSafe}
            totalPages={Math.max(1, Math.ceil(totalCount / pageSize))}
            onPageChange={(p) => setPage(p)}
          />

          <CreateProjectPopover
            open={openCreate}
            onClose={() => setOpenCreate(false)}
            onSaved={() => fetchPage(activeTab, debouncedSearch, pageSafe /* no spinner */)}
            onSubmitted={(info) => {
              setOpenCreate(false);
              setSubmitInfo(info);        // { projectId, paymentPlan }
              setShowSuccess(true);       // buka modal sukses
              fetchPage(activeTab, debouncedSearch, pageSafe);  // refresh list/counter
              // optional kalau kamu masih pakai listener 'client-refresh'
              // window.dispatchEvent(new Event("client-refresh"));
            }}
          />

          <SubmitSuccessForm
            open={showSuccess}
            onClose={() => setShowSuccess(false)}
            projectId={submitInfo?.projectId ?? null}
            paymentPlan={submitInfo?.paymentPlan ?? "half"}
          />
        </>
      )}
    </div>
  );
}
