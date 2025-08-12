"use client";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type DashboardRow = { id: string }; // sesuaikan minimal kolom yang dipakai

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DashboardRow[]>([]); // ⬅️ no any

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sb = getSupabaseClient();
        const { data, error } = await sb.from("YOUR_TABLE").select("id").limit(10);
        if (!cancelled) setRows(error ? [] : (data as DashboardRow[] ?? []));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>;
  return <div>{rows.length} items</div>;
}
