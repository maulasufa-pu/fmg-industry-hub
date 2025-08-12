// src/hooks/useProjects.ts
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const ac = new AbortController();
    const { signal } = ac;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      // base query + count
      let query = supabase
        .from("project_summary")
        .select(
          "project_id,project_name,artist_name,genre,stage,status,progress_percent,budget_amount,budget_currency,is_active,is_finished,latest_update,engineer_name,anr_name,assigned_pic",
          { count: "exact" }
        )
        .order("latest_update", { ascending: false })
        .abortSignal(signal);

      // search
      const term = q.trim();
      if (term) {
        const like = `%${term}%`;
        query = query.or(
          `project_name.ilike.${like},artist_name.ilike.${like},genre.ilike.${like}`
        );
      }

      // tab filter
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
          // belum ada definisi jelas → biarkan tanpa filter tambahan
          break;
        case "All":
        default:
          break;
      }

      // pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      try {
        const { data: rows, error: qErr, count: total } = await query.returns<ProjectRow[]>();
        if (cancelled) return;
        if (qErr) {
          setError(qErr.message ?? "Failed to load projects");
          setData([]);
          setCount(0);
        } else {
          setData(rows ?? []);
          setCount(total ?? 0);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        if ((e as DOMException)?.name === "AbortError") {
          // dibatalkan saat unmount/refresh effect — abaikan
        } else {
          setError(e instanceof Error ? e.message : "Failed to load projects");
          setData([]);
          setCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [q, tab, page, pageSize]);

  return { data, count, loading, error };
}
