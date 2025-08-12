"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabaseClient, withSignal } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";

type ProjectRow = {
  id: string;
  project_name: string;
  artist_name: string | null;
  status: string | null;
  latest_update: string | null;
};

type MeetingRow = {
  id: string;
  project_id: string | null;
  title: string;
  start_at: string;     // ISO
  duration_min: number;
  link: string | null;
  notes: string | null;
  created_at: string;
};

type InvoiceRow = {
  id: string;
  invoice_no: string;
  client_name: string | null;
  amount_total: number | null;
  currency: string | null;
  status: "draft" | "unpaid" | "paid" | "cancelled";
  created_at: string | null;
};

const QUERY_PROJECTS = "id,project_name,artist_name,status,latest_update";
const QUERY_MEETINGS = "id,project_id,title,start_at,duration_min,link,notes,created_at";
const QUERY_INVOICES = "id,invoice_no,client_name,amount_total,currency,status,created_at";

const Card: React.FC<React.PropsWithChildren<{ title: string; right?: React.ReactNode }>> = ({ title, right, children }) => (
  <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {right}
    </div>
    {children}
  </section>
);

const Stat: React.FC<{ label: string; value: React.ReactNode; to?: string }> = ({ label, value, to }) => {
  const content = (
    <div className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
  return to ? <Link href={to}>{content}</Link> : content;
};

export default function ClientDashboard(): React.JSX.Element {
  useFocusWarmAuth();

  const supabase = useMemo(() => getSupabaseClient(), []);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Abort + realtime guard
  const abortRef = useRef<AbortController | null>(null);
  const rtBoundRef = useRef(false);

  // Stats
  const [statProjectsAll, setStatProjectsAll] = useState<number | null>(null);
  const [statProjectsActive, setStatProjectsActive] = useState<number | null>(null);
  const [statProjectsFinished, setStatProjectsFinished] = useState<number | null>(null);
  const [statProjectsPending, setStatProjectsPending] = useState<number | null>(null);
  const [statInvoicesUnpaid, setStatInvoicesUnpaid] = useState<number | null>(null);
  const [statMeetingsUpcoming, setStatMeetingsUpcoming] = useState<number | null>(null);

  // Lists
  const [recentProjects, setRecentProjects] = useState<ProjectRow[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingRow[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceRow[]>([]);

  // Fetch helpers
  const fetchAll = async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoadingInitial(true);

    try {
      // ===== Counts (head:true) =====
      type CountResp = { count: number | null; error?: unknown };

      // projects: all
      const allQ = supabase.from("project_summary").select("id", { count: "exact", head: true });
      const allP = withSignal(allQ, ac.signal) as unknown as Promise<CountResp>;

      // projects: active (is_active = true) — sesuaikan kalau status berbeda
      const actQ = supabase.from("project_summary").select("id", { count: "exact", head: true }).eq("is_active", true);
      const actP = withSignal(actQ, ac.signal) as unknown as Promise<CountResp>;

      // projects: finished (is_finished = true)
      const finQ = supabase.from("project_summary").select("id", { count: "exact", head: true }).eq("is_finished", true);
      const finP = withSignal(finQ, ac.signal) as unknown as Promise<CountResp>;

      // projects: pending (is_active=false & is_finished=false)
      const penQ = supabase.from("project_summary").select("id", { count: "exact", head: true }).eq("is_active", false).eq("is_finished", false);
      const penP = withSignal(penQ, ac.signal) as unknown as Promise<CountResp>;

      // invoices: unpaid
      const invQ = supabase.from("invoices").select("id", { count: "exact", head: true }).eq("status", "unpaid");
      const invP = withSignal(invQ, ac.signal) as unknown as Promise<CountResp>;

      // meetings: upcoming (start_at >= now)
      const nowIso = new Date().toISOString();
      const meetQ = supabase.from("meetings").select("id", { count: "exact", head: true }).gte("start_at", nowIso);
      const meetP = withSignal(meetQ, ac.signal) as unknown as Promise<CountResp>;

      // ===== Lists =====
      const projListQ = supabase
        .from("project_summary")
        .select(QUERY_PROJECTS)
        .order("latest_update", { ascending: false })
        .limit(8);
      const projListP = withSignal(
        supabase
          .from("project_summary")
          .select(QUERY_PROJECTS)
          .order("latest_update", { ascending: false })
          .limit(8),
        ac.signal
      )
        .returns<ProjectRow[]>()
        .then(({ data, error }) => {
          if (error) throw error;
          return data ?? [];
        });

      const meetingsQ = supabase
        .from("meetings")
        .select(QUERY_MEETINGS)
        .gte("start_at", nowIso)
        .order("start_at", { ascending: true })
        .limit(6);
      const meetingsP = withSignal(
        supabase
          .from("meetings")
          .select(QUERY_MEETINGS)
          .gte("start_at", nowIso)
          .order("start_at", { ascending: true })
          .limit(6),
        ac.signal
      )
        .returns<MeetingRow[]>()
        .then(({ data, error }) => {
          if (error) throw error;
          return data ?? [];
        });


      const invoicesQ = supabase
        .from("invoices")
        .select(QUERY_INVOICES)
        .order("created_at", { ascending: false })
        .limit(6);
      const invoicesP = withSignal(
        supabase
          .from("invoices")
          .select(QUERY_INVOICES)
          .order("created_at", { ascending: false })
          .limit(6),
        ac.signal
      )
        .returns<InvoiceRow[]>()
        .then(({ data, error }) => {
          if (error) throw error;
          return data ?? [];
        });


      const [
      allR, actR, finR, penR, invR, meetR,
      projListArr, meetingsArr, invoicesArr
    ] = await Promise.all([
      allP, actP, finP, penP, invP, meetP,
      projListP, meetingsP, invoicesP
    ]);


      // errors count?
      for (const r of [allR, actR, finR, penR, invR, meetR]) {
        if ((r as any)?.error) throw (r as any).error;
      }

      setStatProjectsAll(allR.count ?? 0);
      setStatProjectsActive(actR.count ?? 0);
      setStatProjectsFinished(finR.count ?? 0);
      setStatProjectsPending(penR.count ?? 0);
      setStatInvoicesUnpaid(invR.count ?? 0);
      setStatMeetingsUpcoming(meetR.count ?? 0);

      setRecentProjects(projListArr);
      setUpcomingMeetings(meetingsArr);
      setRecentInvoices(invoicesArr);

    } catch (e) {
      console.error(e);
      // fallback aman
      setRecentProjects((p) => p ?? []);
      setUpcomingMeetings((p) => p ?? []);
      setRecentInvoices((p) => p ?? []);
    } finally {
      if (abortRef.current === ac) abortRef.current = null;
      setLoadingInitial(false);
    }
  };

  // Initial load
  useEffect(() => {
    (async () => {
      await supabase.auth.getSession().catch(() => {});
      await fetchAll();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime INSERT minimal (meetings + invoices) — dedup + strictmode guard
  useEffect(() => {
    if (rtBoundRef.current) return;
    rtBoundRef.current = true;

    const ch = supabase.channel("realtime:dashboard");

    ch.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "meetings" },
      (payload) => {
        const row = payload.new as MeetingRow;
        // upcoming only
        if (new Date(row.start_at).getTime() < Date.now()) return;
        setUpcomingMeetings((prev) => {
          const list = prev ?? [];
          if (list.some((x) => x.id === row.id)) return list;
          const next = [row, ...list].sort((a, b) => a.start_at.localeCompare(b.start_at));
          return next.slice(0, 6);
        });
        setStatMeetingsUpcoming((c) => (typeof c === "number" ? c + 1 : (c ?? 0) + 1));
      }
    );

    ch.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "invoices" },
      (payload) => {
        const row = payload.new as InvoiceRow;
        setRecentInvoices((prev) => {
          const list = prev ?? [];
          if (list.some((x) => x.id === row.id)) return list;
          const next = [row, ...list].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
          return next.slice(0, 6);
        });
        if (row.status === "unpaid") {
          setStatInvoicesUnpaid((c) => (typeof c === "number" ? c + 1 : (c ?? 0) + 1));
        }
      }
    );

    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
      rtBoundRef.current = false;
    };
  }, [supabase]);

  if (loadingInitial) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-gray-500 shadow">
          Loading dashboard…
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/client/projects" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
            Projects
          </Link>
          <Link href="/client/invoices" className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
            Invoices
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Projects" value={statProjectsAll ?? 0} to="/client/projects?tab=All%20Project" />
        <Stat label="Active" value={statProjectsActive ?? 0} to="/client/projects?tab=Active" />
        <Stat label="Finished" value={statProjectsFinished ?? 0} to="/client/projects?tab=Finished" />
        <Stat label="Pending" value={statProjectsPending ?? 0} to="/client/projects?tab=Pending" />
        <Stat label="Invoices Unpaid" value={statInvoicesUnpaid ?? 0} to="/client/invoices?tab=Unpaid" />
        <Stat label="Meetings Upcoming" value={statMeetingsUpcoming ?? 0} to="/client/projects" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recently Updated Projects */}
        <Card
          title="Recently Updated Projects"
          right={
            <Link href="/client/projects" className="text-xs text-blue-600 hover:underline">
              View All
            </Link>
          }
        >
          {recentProjects.length === 0 ? (
            <div className="text-sm text-gray-500">No recent updates.</div>
          ) : (
            <ul className="divide-y">
              {recentProjects.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900">{p.project_name}</div>
                      <div className="truncate text-xs text-gray-500">{p.artist_name ?? "-"}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {p.latest_update ? new Date(p.latest_update).toLocaleString("id-ID") : "-"}
                    </div>
                  </div>
                  <div className="mt-1">
                    <Link
                      href={`/client/projects/${p.id}?tab=Active`}
                      className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Upcoming Meetings */}
        <Card
          title="Upcoming Meetings"
          right={
            <Link href="/client/projects" className="text-xs text-blue-600 hover:underline">
              Schedule
            </Link>
          }
        >
          {upcomingMeetings.length === 0 ? (
            <div className="text-sm text-gray-500">No upcoming meetings.</div>
          ) : (
            <ul className="space-y-3">
              {upcomingMeetings.map((m) => {
                const start = new Date(m.start_at);
                const end = new Date(start.getTime() + (m.duration_min || 0) * 60_000);
                return (
                  <li key={m.id} className="rounded-md border border-gray-200 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-800 truncate">{m.title}</div>
                      <div className="text-xs text-gray-500">
                        {start.toLocaleString("id-ID")} –{" "}
                        {end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="mt-1">
                      {m.link ? (
                        <a
                          className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                          href={m.link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Join
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No link</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recent Invoices */}
        <Card
          title="Recent Invoices"
          right={
            <Link href="/client/invoices" className="text-xs text-blue-600 hover:underline">
              View All
            </Link>
          }
        >
          {recentInvoices.length === 0 ? (
            <div className="text-sm text-gray-500">No invoices.</div>
          ) : (
            <ul className="space-y-3">
              {recentInvoices.map((r) => (
                <li key={r.id} className="rounded-md border border-gray-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900">{r.invoice_no}</div>
                      <div className="truncate text-xs text-gray-500">{r.client_name ?? "-"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {r.amount_total != null
                          ? `${(r.currency ?? "IDR").toUpperCase()} ${Number(r.amount_total).toLocaleString("id-ID")}`
                          : "-"}
                      </div>
                      <div className="text-xs capitalize text-gray-500">{r.status}</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Link
                      href={`/client/invoices/${r.id}`}
                      className="inline-flex items-center rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      Open
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
