// src/app/client/projects/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectTabsSection } from "./ProjectTabsSection";
import { ProjectTableSection } from "./ProjectTableSection";
import { ProjectPaginationSection } from "./ProjectPaginationSection";
import { withSignal, getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";

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

  // Data state
  const [allRows, setAllRows] = useState<ProjectRow[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const lastFetchRef = useRef(0);

  // ====== Anti-race & abort management ======
  const inflightRef = useRef<AbortController | null>(null); // request aktif
  const reqIdRef = useRef(0); // ID unik agar hanya request terakhir yang boleh set state

  // Abort helper (dipakai saat blur)
  const abortCurrent = useCallback(() => {
    inflightRef.current?.abort("cancel-on-blur-or-new-request");
    inflightRef.current = null;
  }, []);

  // Timeout keras biar gak pernah gantung
  const withTimeout = <T,>(p: Promise<T>, ms = 10000) =>
    Promise.race<T>([
      p,
      new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
    ]);

  // Satu pintu untuk semua query
  const runQuery = useCallback(
    async (build: (signal: AbortSignal) => Promise<ProjectRow[]>) => {
      const myId = ++reqIdRef.current;
      const ac = new AbortController();

      // Abort request lama & set baru
      inflightRef.current?.abort("superseded");
      inflightRef.current = ac;

      const isInitial = lastFetchRef.current === 0;
      if (isInitial) setLoadingInitial(true);
      else setRefreshing(true);

      try {
        // warm session (mengurangi delay token di request pertama)
        await supabase.auth.getSession().catch(() => {});

        const rows = await withTimeout(build(ac.signal), 10000);
        if (reqIdRef.current !== myId) return; // hasil basi → abaikan
        setAllRows(rows ?? []);
        lastFetchRef.current = Date.now();
      } catch (e: unknown) {
        if (reqIdRef.current !== myId) return; // error basi → abaikan
        if ((e as { name?: string })?.name !== "AbortError") console.error("fetch error:", e);
      } finally {
        if (reqIdRef.current === myId) {
          setLoadingInitial(false);
          setRefreshing(false);
        }
        if (inflightRef.current === ac) inflightRef.current = null;
      }
    },
    [supabase]
  );

  // Reload data (dipakai tab/search/pagination/focus)
  const reload = useCallback(
    (status: TabKey = activeTab): Promise<void> => {
      return runQuery(async (signal) => {
        let qb = supabase
          .from("project_summary")
          .select(
            "id,project_name,artist_name,genre,stage,status,latest_update,is_active,is_finished,assigned_pic,progress_percent,budget_amount,budget_currency,engineer_name,anr_name"
          )
          .order("latest_update", { ascending: false });

        if (status !== "All Project") {
          qb = qb.eq("status", status.toLowerCase());
        }

        const { data, error } = await withSignal(qb, signal).returns<ProjectRow[]>();
        if (error) throw error;
        return data ?? [];
      });
    },
    [runQuery, supabase, activeTab]
  );

  // Load awal
  useEffect(() => {
    runQuery(async (signal) => {
      const { data, error } = await withSignal(
        supabase
          .from("project_summary")
          .select(
            "id,project_name,artist_name,genre,stage,status,latest_update,is_active,is_finished,assigned_pic,progress_percent,budget_amount,budget_currency,engineer_name,anr_name"
          )
          .order("id", { ascending: true }),
        signal
      ).returns<ProjectRow[]>();
      if (error) throw error;
      return data ?? [];
    });
  }, [runQuery, supabase]);

  // Refetch saat kembali fokus (debounce + stale check 60s)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const onFocus = () => {
      const staleFor = Date.now() - lastFetchRef.current;
      if (staleFor < 60_000) return; // skip jika belum stale
      if (t) clearTimeout(t);
      t = setTimeout(() => reload(activeTab), 200);
    };
    const onBlur = () => abortCurrent();
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      if (t) clearTimeout(t);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, [reload, activeTab, abortCurrent]);

  // ====== Client-only filter (tab + search) ======
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = allRows;

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
        base = []; // belum ada definisi data "requested"
        break;
      default:
        break;
    }

    if (q.length >= 2) {
      base = base.filter((r) => {
        const hay = `${r.project_name ?? ""} ${r.artist_name ?? ""} ${r.genre ?? ""}`;
        return hay.toLowerCase().includes(q);
      });
    }

    return base;
  }, [allRows, activeTab, search]);

  // counts untuk tabs (hitung dari allRows)
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

  // pagination (client-side)
  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(Math.max(1, page), totalPages);
  const pagedRows = useMemo(() => {
    const from = (pageSafe - 1) * pageSize;
    return filteredRows.slice(from, from + pageSize);
  }, [filteredRows, pageSafe, pageSize]);

  // helpers
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

  // render
  return (
    <div className="flex flex-col gap-6 p-6">
      <ProjectTabsSection
        activeTab={activeTab}
        initialTab={initialTabFromUrl}
        onTabChange={(t) => {
          setPage(1);
          setActiveTabAndUrl(t);
          reload(t); // muat ulang data saat user ganti tab
        }}
        onSearchChange={(q) => {
          setPage(1);
          setSearch(q);
          // Search tetap client-side; kalau mau server-filter, panggil reload() di sini
        }}
        externalCounts={counts}
        onCreateClick={() => router.push("/client/projects/CreateProjectPopover")}
      />

      {loadingInitial ? (
        <div className="w-full rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-500 shadow">
          Loading projects…
        </div>
      ) : (
        <>
          {refreshing && (
            <div className="text-xs text-gray-500">Refreshing…</div>
          )}

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

          <ProjectPaginationSection
            currentPage={pageSafe}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              // pagination tetap client-side; untuk server-side pagination, panggil reload() dengan range
            }}
          />
        </>
      )}
    </div>
  );
}
