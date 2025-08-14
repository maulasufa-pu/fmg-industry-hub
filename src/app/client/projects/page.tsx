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
import SubmitSuccessModal from "@/components/SubmisSuccessForm";


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

type CountResp = { count: number | null; error?: unknown };

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
  const [successOpen, setSuccessOpen] = useState(false);
  const [successProjectId, setSuccessProjectId] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<"upfront" | "half" | "milestone">("half");

  const [activeTab, setActiveTab] = useState<TabKey>(initialTabFromUrl);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  // Data
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<TabKey, number | null>>({
    "All Project": null,
    Active: null,
    Finished: null,
    Pending: null,
    Requested: null,
  });

  // Spinner hanya untuk initial load
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [didInit, setDidInit] = useState(false);

  // Abort & mount guard
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(true);

  const fetchCounts = useCallback(
    async (q: string, signal: AbortSignal): Promise<Record<TabKey, number>> => {
      const like = q ? `%${q}%` : null;

      // Helper untuk apply OR search tanpa bikin TS ngambek
      const applySearch = <T extends { or: (expr: string) => T }>(qb: T): T => {
        return like
          ? qb.or(`project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`)
          : qb;
      };
      
      // All
      let allQ = supabase
        .from("project_summary")
        .select("id", { count: "exact", head: true });
      allQ = applySearch(allQ);
      const { count: allCount, error: allErr } = await allQ.abortSignal(signal);

      // Active
      let actQ = supabase
        .from("project_summary")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      actQ = applySearch(actQ);
      const { count: actCount, error: actErr } = await actQ.abortSignal(signal);

      // Finished
      let finQ = supabase
        .from("project_summary")
        .select("id", { count: "exact", head: true })
        .eq("is_finished", true);
      finQ = applySearch(finQ);
      const { count: finCount, error: finErr } = await finQ.abortSignal(signal);

      // Pending (pakai status agar tidak tumpang tindih)
      let penQ = supabase
        .from("project_summary")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      penQ = applySearch(penQ);
      const { count: penCount, error: penErr } = await penQ.abortSignal(signal);

      // Requested
      let reqQ = supabase
        .from("project_summary")
        .select("id", { count: "exact", head: true })
        .eq("status", "requested");
      reqQ = applySearch(reqQ);
      const { count: reqCount, error: reqErr } = await reqQ.abortSignal(signal);

      if (allErr) throw allErr;
      if (actErr) throw actErr;
      if (finErr) throw finErr;
      if (penErr) throw penErr;
      if (reqErr) throw reqErr;

      return {
        "All Project": allCount ?? 0,
        Active: actCount ?? 0,
        Finished: finCount ?? 0,
        Pending: penCount ?? 0,
        Requested: reqCount ?? 0,
      };
    },
    [supabase]
  );

  const fetchPage = useCallback(
    async (tab: TabKey, q: string, pageIdx: number, isInitial = false) => {
      // Batalkan request lama
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const ac = abortRef.current;

      if (isInitial) setLoadingInitial(true);
      try {
        const from = (pageIdx - 1) * pageSize;
        const to = from + pageSize - 1;

        let qBuilder = supabase.from("project_summary").select(QUERY_COLS, { count: "exact", head: false });

        if (tab === "Active") qBuilder = qBuilder.eq("is_active", true);
        else if (tab === "Finished") qBuilder = qBuilder.eq("is_finished", true);
        else if (tab === "Pending") qBuilder = qBuilder.eq("status", "pending");
        else if (tab === "Requested") qBuilder = qBuilder.eq("status", "requested");

        if (q) {
          qBuilder = qBuilder.or(`project_name.ilike.%${q}%,artist_name.ilike.%${q}%,genre.ilike.%${q}%`);
        }

        qBuilder = qBuilder.order("latest_update", { ascending: false }).range(from, to);

        const { data, count, error } = await qBuilder.abortSignal(ac.signal);
        if (error) throw error;

        const counts = await fetchCounts(q, ac.signal);

        if (!mountedRef.current) return;
        setRows(data ?? []);
        setTotalCount(count ?? 0);
        setTabCounts(counts);
      } catch (err: unknown) {
        const isAbortError = (e: unknown): boolean => {
          if (e instanceof DOMException && e.name === "AbortError") return true;
          const x = e as { code?: string; name?: string; message?: string } | null;
          return !!(
            x &&
            (x.name === "AbortError" ||
            x.code === "20" ||
            /aborted|AbortError/i.test(x.message || ""))
          );
        };
      } finally {
        if (abortRef.current === ac) abortRef.current = null;
        if (isInitial && mountedRef.current) setLoadingInitial(false);
      }
    },
    [fetchCounts, supabase]
  );

  // initial
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      setPage(1);
      try {
        await supabase.auth.getSession();
      } catch {
        // ignore
      }
      await fetchPage(initialTabFromUrl, "", 1, true); // spinner hanya di sini
      if (mountedRef.current) setDidInit(true);
    })();
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // re-fetch tanpa spinner pada tab/search/page change
  useEffect(() => {
    if (!didInit) return;
    void fetchPage(activeTab, debouncedSearch, page, false);
  }, [didInit, activeTab, debouncedSearch, page, fetchPage]);

  // client-wake (dipanggil dari ClientShell saat focus/visible/pageshow)
  useEffect(() => {
    const onWake = () => {
      void fetchPage(activeTab, debouncedSearch, page, false);
    };
    window.addEventListener("client-wake", onWake);
    return () => {
      window.removeEventListener("client-wake", onWake);
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
        <div
          className="w-full rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500 shadow"
          data-global-loader="true"
        >
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
            onSaved={() => {/* refresh table/list kalau perlu */}}
            onSubmitted={({ projectId, paymentPlan }) => {
              setSuccessProjectId(projectId);
              setSuccessPlan(paymentPlan);
              setSuccessOpen(true); // tampilkan modal sukses DI LUAR form
            }}
          />

          <SubmitSuccessModal
            open={successOpen}
            onClose={() => setSuccessOpen(false)}
            projectId={successProjectId}
            paymentPlan={successPlan}
          />
        </>
      )}
    </div>
  );
}
