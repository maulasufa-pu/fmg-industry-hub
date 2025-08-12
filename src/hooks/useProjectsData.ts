import { useCallback, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useWakeRefetch } from "@/hooks/useWakeRefetch";

export type ProjectRow = {
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
};

export function useProjectsData() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [rows, setRows] = useState<ProjectRow[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from("project_summary").select("*");
    if (error) setError(error.message);
    setRows(data ?? null);
    setLoading(false);
  }, [supabase]);

  // dengarkan event bangun tab
  useWakeRefetch(refetch);

  return { rows, loading, error, refetch };
}