// hooks/useProjects.ts (contoh hook kecil)
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ProjectRow = {
  project_id: string;
  project_name: string;
  artist_name: string | null;
  genre: string | null;
  stage: string | null;
  status: string;
  progress_percent: number | null;
  budget_amount: string | null;
  budget_currency: string | null;
  is_active: boolean;
  is_finished: boolean;
  latest_update: string | null;
  engineer_name: string | null;
  anr_name: string | null;
  assigned_pic: string | null;
};

export function useProjects(params: {
  q: string;
  tab: "All" | "Active" | "Finished" | "Pending" | "Requested";
  page: number;
  pageSize?: number;
}) {
  const { q, tab, page, pageSize = 10 } = params;
  const [data, setData] = useState<ProjectRow[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);

      // Base query
      let query = supabase
        .from("project_summary")
        .select("*", { count: "exact" })
        .order("latest_update", { ascending: false });

      // Search (OR di 3 kolom)
      if (q?.trim()) {
        const term = `%${q.trim()}%`;
        query = query.or(
          `project_name.ilike.${term},artist_name.ilike.${term},genre.ilike.${term}`
        );
      }

      // Tab filter
      switch (tab) {
        case "Active":
          query = query.eq("is_active", true);
          break;
        case "Finished":
          query = query.eq("is_finished", true);
          break;
        case "Pending":
          query = query.eq("status", "pending");
          break;
        case "Requested":
          // contoh: belum ada draft sama sekali
          // cara simpel: join di server (view/func), tapi di client kita workaround:
          // kalau kamu punya view `requested_projects`, panggil itu saja.
          // sementara, skip filter ini atau buat view khusus di DB.
          break;
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (cancelled) return;
      if (error) setError(error);
      else {
        setData(data ?? []);
        setCount(count ?? 0);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [q, tab, page, pageSize]);

  return { data, count, loading, error };
}
