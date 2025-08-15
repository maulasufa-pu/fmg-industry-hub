// src/app/admin/dashboard/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type CountOnly = { count: number | null };

export default function AdminDashboard(): React.JSX.Element {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({
    newRequests: 0,
    awaitingPayment: 0,
    unassigned: 0,
    activeProjects: 0,
    upcomingMeetings: 0,
    unpaidInvoices: 0,
  });

  // Helper kecil untuk ambil count dengan fallback aman
  const getCountSafe = async (run: () => Promise<CountOnly>): Promise<number> => {
    try {
      const { count } = await run();
      return count ?? 0;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();

      // Jalankan sequential; jelas dan aman tipe
      const newRequests = await getCountSafe(async () => {
        const { count, error } = await supabase
          .from("project_summary")
          .select("id", { count: "exact", head: true })
          .eq("status", "requested");

        if (error) throw error;
        return { count };
      });
      const awaitingPayment = await getCountSafe(async () => {
        const { count, error } = await supabase
          .from("project_summary")
          .select("id", { count: "exact", head: true })
          .eq("status", "waiting_payment");
        if (error) throw error;
        return { count };
      });

      const unassigned = await getCountSafe(async () => {
        const { count, error } = await supabase
          .from("project_summary")
          .select("id", { count: "exact", head: true })
          .is("assigned_pic", null);
        if (error) throw error;
        return { count };
      });

      const activeProjects = await getCountSafe(async () => {
        const { count, error } = await supabase
          .from("project_summary")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true);
        if (error) throw error;
        return { count };
      });

      const upcomingMeetings = await getCountSafe(async () => {
        const { count, error } = await supabase
          .from("meetings")
          .select("id", { count: "exact", head: true })
          .gte("start_at", nowIso);
        if (error) throw error;
        return { count };
      });

      const unpaidInvoices = await getCountSafe(async () => {
        const { count, error } = await supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("status", "unpaid");
        if (error) throw error;
        return { count };
      });


      if (!mounted) return;
      setKpi({ newRequests, awaitingPayment, unassigned, activeProjects, upcomingMeetings, unpaidInvoices });
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-8 text-gray-500 shadow">Loading…</div>
      </div>
    );
  }

  const Stat = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-lg border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="New Requests" value={kpi.newRequests} />
        <Stat label="Awaiting Payment" value={kpi.awaitingPayment} />
        <Stat label="Unassigned" value={kpi.unassigned} />
        <Stat label="Active" value={kpi.activeProjects} />
        <Stat label="Upcoming Meetings" value={kpi.upcomingMeetings} />
        <Stat label="Unpaid Invoices" value={kpi.unpaidInvoices} />
      </div>
    </div>
  );
}
