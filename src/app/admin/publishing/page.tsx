"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type PubStatus =
  | "pending_assets"
  | "qc_metadata"
  | "awaiting_contract"
  | "queued_to_distributor"
  | "in_distribution"
  | "live"
  | "rejected";

type PublishingRow = {
  id: string;
  project_id: string | null;
  title: string;
  artist_name: string | null;
  planned_release_date: string | null;
  status: PubStatus;
  notes: string | null;
  distributor_ref: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const PUBLISHING_TABLE = "publishing_jobs";
const COLS =
  "id,project_id,title,artist_name,planned_release_date,status,notes,distributor_ref,created_at,updated_at";

export default function AdminPublishingPage(): React.JSX.Element {
  const sb = useMemo(() => getSupabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PublishingRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<PubStatus | "all">("qc_metadata");

  const load = async () => {
    setLoading(true);
    let qb = sb.from(PUBLISHING_TABLE).select(COLS).order("updated_at", { ascending: false });

    if (status !== "all") qb = qb.eq("status", status);
    if (q.trim()) {
      const like = `%${q.trim()}%`;
      qb = qb.or(`title.ilike.${like},artist_name.ilike.${like},notes.ilike.${like},distributor_ref.ilike.${like}`);
    }

    const { data, error } = await qb;
    if (!error) setRows(((data ?? []) as unknown) as PublishingRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [q, status]);

  const updateStatus = async (id: string, next: PubStatus) => {
    const { error } = await sb.from(PUBLISHING_TABLE).update({ status: next, updated_at: new Date().toISOString() }).eq("id", id);
    if (!error) void load();
  };

  const STATUSES: PubStatus[] = [
    "pending_assets",
    "qc_metadata",
    "awaiting_contract",
    "queued_to_distributor",
    "in_distribution",
    "live",
    "rejected",
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Publishing</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            placeholder="Search title/artist/notes…"
            className="h-9 rounded-lg border px-3 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.currentTarget.value as PubStatus | "all")}
            className="h-9 rounded-lg border px-3 text-sm"
          >
            <option value="all">All</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-8 text-gray-500 shadow">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-gray-500 shadow">No publishing items.</div>
      ) : (
        <table className="w-full rounded-lg border bg-white shadow">
          <thead className="bg-gray-50 text-left text-sm">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Artist</th>
              <th className="p-3">Plan Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Distributor Ref</th>
              <th className="p-3">Notes</th>
              <th className="p-3 text-right">Advance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium">{r.title}</td>
                <td className="p-3">{r.artist_name ?? "-"}</td>
                <td className="p-3">{r.planned_release_date ? new Date(r.planned_release_date).toLocaleDateString("id-ID") : "-"}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">{r.distributor_ref ?? "-"}</td>
                <td className="p-3">{r.notes ?? "-"}</td>
                <td className="p-3">
                  <div className="flex justify-end">
                    <select
                      className="rounded border px-2 py-1 text-xs"
                      value={r.status}
                      onChange={(e) => updateStatus(r.id, e.currentTarget.value as PubStatus)}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
