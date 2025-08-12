"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function DashboardClient() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]); // ganti ke tipe kamu

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sb = getSupabaseClient(); // aman di browser
        const { data, error } = await sb.from("YOUR_TABLE").select("*").limit(10);
        if (!cancelled) setRows(error ? [] : (data ?? []));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>;
  return <div>{rows.length} items</div>;
}
