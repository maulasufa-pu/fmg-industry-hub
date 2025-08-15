"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type MeetingRow = {
  id: string;
  project_id: string | null;
  title: string;
  start_at: string; // ISO
  duration_min: number;
  link: string | null;
  notes: string | null;
  created_at: string;
};

const COLS =
  "id,project_id,title,start_at,duration_min,link,notes,created_at";

export default function AdminMeetingsPage(): React.JSX.Element {
  const sb = useMemo(() => getSupabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MeetingRow[]>([]);
  const [q, setQ] = useState("");
  const [when, setWhen] = useState<"upcoming" | "past" | "all">("upcoming");

  const load = async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();

    let qb = sb.from("meetings").select(COLS).order("start_at", { ascending: when !== "past" });
    if (when === "upcoming") qb = qb.gte("start_at", nowIso);
    if (when === "past") qb = qb.lt("start_at", nowIso);

    if (q.trim()) {
      const like = `%${q.trim()}%`;
      qb = qb.or(`title.ilike.${like},notes.ilike.${like}`);
    }

    const { data, error } = await qb;
    if (!error) setRows(((data ?? []) as unknown) as MeetingRow[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [q, when]);

  const createMeeting = async (payload: Pick<MeetingRow, "title" | "start_at" | "duration_min" | "link" | "notes"> & { project_id?: string | null }) => {
    const { error } = await sb.from("meetings").insert({
      project_id: payload.project_id ?? null,
      title: payload.title,
      start_at: payload.start_at,
      duration_min: payload.duration_min,
      link: payload.link ?? null,
      notes: payload.notes ?? null,
    });
    if (!error) void load();
  };

  const deleteMeeting = async (id: string) => {
    const { error } = await sb.from("meetings").delete().eq("id", id);
    if (!error) void load();
  };

  // Simple quick-create form
  const [title, setTitle] = useState("");
  const [start, setStart] = useState<string>("");
  const [duration, setDuration] = useState<number>(30);
  const [link, setLink] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const submit = async () => {
    if (!title || !start) return;
    await createMeeting({
      title,
      start_at: new Date(start).toISOString(),
      duration_min: Number(duration || 30),
      link: link || null,
      notes: notes || null,
    });
    setTitle(""); setStart(""); setDuration(30); setLink(""); setNotes("");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-lg font-semibold">Meetings</h1>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          placeholder="Search title/notes…"
          className="h-9 rounded-lg border px-3 text-sm"
        />
        <select
          className="h-9 rounded-lg border px-3 text-sm"
          value={when}
          onChange={(e) => setWhen(e.currentTarget.value as "upcoming" | "past" | "all")}
        >
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow">
        <div className="mb-2 text-sm font-medium">Quick Schedule</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <input className="rounded border px-2 py-1 text-sm" placeholder="Title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
          <input className="rounded border px-2 py-1 text-sm" type="datetime-local" value={start} onChange={(e) => setStart(e.currentTarget.value)} />
          <input className="rounded border px-2 py-1 text-sm" type="number" min={15} step={5} value={duration} onChange={(e) => setDuration(Number(e.currentTarget.value))} placeholder="Duration (min)" />
          <input className="rounded border px-2 py-1 text-sm" placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.currentTarget.value)} />
          <input className="rounded border px-2 py-1 text-sm" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
        </div>
        <div className="mt-2">
          <button onClick={submit} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Create</button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-8 text-gray-500 shadow">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-gray-500 shadow">No meetings found.</div>
      ) : (
        <table className="w-full rounded-lg border bg-white shadow">
          <thead className="bg-gray-50 text-left text-sm">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Start</th>
              <th className="p-3">End</th>
              <th className="p-3">Link</th>
              <th className="p-3">Notes</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(m => {
              const startAt = new Date(m.start_at);
              const endAt = new Date(startAt.getTime() + (m.duration_min || 0) * 60_000);
              return (
                <tr key={m.id} className="border-t">
                  <td className="p-3 font-medium">{m.title}</td>
                  <td className="p-3">{startAt.toLocaleString("id-ID")}</td>
                  <td className="p-3">{endAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="p-3">{m.link ? <a className="text-blue-600 underline" href={m.link} target="_blank">Open</a> : "-"}</td>
                  <td className="p-3">{m.notes ?? "-"}</td>
                  <td className="p-3">
                    <div className="flex justify-end">
                      <button onClick={() => deleteMeeting(m.id)} className="rounded bg-red-600 px-2 py-1 text-xs text-white">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
