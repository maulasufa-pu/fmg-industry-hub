// src/app/admin/projects/[id]/components/tabs/MeetingsTab.tsx
"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  StickyNote,
  Plus,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { MeetingRow, ProjectSummary } from "../../types";

interface MeetingsTabProps {
  project: ProjectSummary;
  meetings: MeetingRow[] | null;
  setMeetings: React.Dispatch<React.SetStateAction<MeetingRow[] | null>>;
}

const normalizeLink = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const s = raw.trim();
  if (s === "" || /^(dummy|null|undefined|#|-)$/i.test(s)) return null;

  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;

  try {
    // eslint-disable-next-line no-new
    new URL(withProto);
    return withProto;
  } catch {
    return null;
  }
};


const CardShell = ({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <motion.section
    className="relative rounded-3xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden"
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    <div className="relative bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-purple-50/70 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 flex items-center justify-between gap-3 px-6 py-4">
      <h3 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        🗓️ {title}
      </h3>
      {right}
    </div>
    <div className="px-6 pb-6 pt-4">{children}</div>
  </motion.section>
);

function FieldLabel({
  children,
  hint,
  htmlFor,
}: {
  children: React.ReactNode;
  hint?: string;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-medium text-gray-700 dark:text-gray-300">
      {children}
      {hint ? (
        <span className="ml-1 text-[11px] font-normal text-gray-400 dark:text-gray-500">{hint}</span>
      ) : null}
    </label>
  );
}

function InputBase({
  id,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  return (
    <input
      id={id}
      {...rest}
      className={[
        "w-full rounded-xl border-2 bg-white/95 dark:bg-slate-800/95 shadow-sm",
        "border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-medium",
        "text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400",
        "outline-none focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400",
        "hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200",
        (rest.className ?? ""),
      ].join(" ")}
    />
  );
}

function TextareaBase({ id, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string }) {
  return (
    <textarea
      id={id}
      {...rest}
      className={[
        "w-full resize-none rounded-xl border-2 bg-white/95 dark:bg-slate-800/95 shadow-sm min-h-[80px]",
        "border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-medium",
        "text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400",
        "outline-none focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400",
        "hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200",
        (rest.className ?? ""),
      ].join(" ")}
    />
  );
}

function SelectBase({ id, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { id: string }) {
  return (
    <select
      id={id}
      {...rest}
      className={[
        "w-full rounded-xl border-2 bg-white/95 dark:bg-slate-800/95 shadow-sm appearance-none",
        "border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-medium",
        "text-slate-900 dark:text-slate-100",
        "outline-none focus:ring-4 focus:ring-blue-500/20 dark:focus:ring-blue-400/30 focus:border-blue-500 dark:focus:border-blue-400",
        "hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200",
        "bg-[url('data:image/svg+xml,%3csvg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 20 20\"%3e%3cpath stroke=\"%236b7280\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M6 8l4 4 4-4\"/%3e%3c/svg%3e')] dark:bg-[url('data:image/svg+xml,%3csvg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 20 20\"%3e%3cpath stroke=\"%23cbd5e1\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\" d=\"M6 8l4 4 4-4\"/%3e%3c/svg%3e')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat",
        (rest.className ?? ""),
      ].join(" ")}
    />
  );
}

function NewMeetingButton({
  show,
  toggle,
}: {
  show: boolean;
  toggle: () => void;
}) {
  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 dark:shadow-blue-400/20 hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 hover:shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-blue-400/25 active:from-blue-800 active:to-indigo-800 dark:active:from-blue-700 dark:active:to-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40 dark:focus-visible:ring-blue-400/50 transition-all duration-200 transform hover:scale-105 active:scale-95"
    >
      {show ? (
        <>
          <X className="h-4 w-4" /> Close
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" /> New Meeting
        </>
      )}
    </button>
  );
}

export default function MeetingsTab({ project, meetings, setMeetings }: MeetingsTabProps) {
  const supabase = getSupabaseClient();

  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    date: "",
    time: "",
    durationMin: 60,
    notes: "",
    provider: "google" as "google" | "zoom",
  });

  const canSubmit = useMemo(
    () => meetingForm.title.trim() && meetingForm.date && meetingForm.time,
    [meetingForm.title, meetingForm.date, meetingForm.time]
  );

  const createMeeting = async (): Promise<void> => {
    const { title, date, time, durationMin, notes, provider } = meetingForm;
    if (!title.trim() || !date || !time) {
      alert("Isi Title, Date, dan Time.");
      return;
    }

    const startLocal = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startLocal.getTime())) {
      alert("Tanggal/Jam tidak valid.");
      return;
    }

    setIsCreatingMeeting(true);
    try {
      const res = await fetch(`/api/meetings/${provider}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          startAt: startLocal.toISOString(),
          durationMin: Number(durationMin) || 60,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { joinUrl } = (await res.json()) as { joinUrl?: string };

      const { data, error } = await supabase
        .from("meetings")
        .insert({
          project_id: project.project_id,
          title: title.trim(),
          start_at: startLocal.toISOString(),
          duration_min: Number(durationMin) || 60,
          link: joinUrl ?? null,
          notes: notes.trim() || null,
        })
        .select("*")
        .single();

      if (error) throw error;

      setMeetings((prev) => (prev ? [data, ...prev] : [data]));
      setMeetingForm({ title: "", date: "", time: "", durationMin: 60, notes: "", provider: "google" });
      setShowMeetingForm(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      alert("Gagal membuat meeting otomatis.");
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  const handleCancelMeeting = (id: string) => {
    setMeetings((prev) => (prev ? prev.filter((m) => m.id !== id) : prev));
  };

  return (
    <CardShell
      title="Meetings (Admin)"
      right={<NewMeetingButton show={showMeetingForm} toggle={() => setShowMeetingForm((s) => !s)} />}
    >
      {showMeetingForm && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xl shadow-black/5 dark:shadow-black/20 p-4 sm:p-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white/95 dark:bg-slate-800/95 shadow-sm px-4 py-3 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200">
                <Video className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <input
                  id="title"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Kickoff with client"
                  className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="date" hint="(YYYY-MM-DD)">
                Date
              </FieldLabel>
              <div className="mt-1.5 relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                <InputBase
                  id="date"
                  type="date"
                  value={meetingForm.date}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, date: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="time" hint="(24h)">Time</FieldLabel>
              <div className="mt-1.5 relative">
                <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                <InputBase
                  id="time"
                  type="time"
                  value={meetingForm.time}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, time: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="duration">Duration (min)</FieldLabel>
              <InputBase
                id="duration"
                type="number"
                min={15}
                step={15}
                value={meetingForm.durationMin}
                onChange={(e) => setMeetingForm((p) => ({ ...p, durationMin: Number(e.target.value) }))}
              />
            </div>

            <div>
              <FieldLabel htmlFor="provider">Provider</FieldLabel>
              <SelectBase
                id="provider"
                value={meetingForm.provider}
                onChange={(e) =>
                  setMeetingForm((p) => ({ ...p, provider: e.target.value as "zoom" | "google" }))
                }
              >
                <option value="google">Google Meet</option>
                <option value="zoom">Zoom</option>
              </SelectBase>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
              <div className="mt-1.5 relative">
                <StickyNote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500 dark:text-slate-400" />
                <TextareaBase
                  id="notes"
                  rows={3}
                  placeholder="Agenda, participants, links…"
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm((p) => ({ ...p, notes: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={() => setShowMeetingForm(false)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/95 dark:bg-slate-800/95 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
            <button
              onClick={createMeeting}
              disabled={isCreatingMeeting || !canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-500 dark:to-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 dark:shadow-emerald-400/20 hover:from-emerald-700 hover:to-green-700 dark:hover:from-emerald-600 dark:hover:to-green-600 hover:shadow-xl hover:shadow-emerald-500/30 dark:hover:shadow-emerald-400/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {isCreatingMeeting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                </>
              ) : (
                <>Create Meeting</>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {meetings === null ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 animate-pulse shadow-sm"
            />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 p-10 text-center shadow-inner">
          <div className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">No meetings yet</div>
          <p className="mb-4 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Create the first meeting for this project. Schedule a Google Meet or Zoom, save the link, and add notes.
          </p>
          <NewMeetingButton show={false} toggle={() => setShowMeetingForm(true)} />
        </div>
      ) : (
        <ul className="space-y-3">
          {meetings.map((m, index) => {
            const start = new Date(m.start_at);
            const end = new Date(start.getTime() + m.duration_min * 60_000);

            const safeLink = normalizeLink(m.link);
            const hasLink = !!safeLink;

            return (
              <motion.li
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index }}
                className="group rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 sm:p-5 shadow-lg shadow-black/5 dark:shadow-black/20 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-indigo-50/90 dark:bg-indigo-900/40 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {hasLink ? "Online" : "Offline"}
                      </span>
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{m.title}</div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <div className="inline-flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {start.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                      <div className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        <span className="mx-1">–</span>
                        {end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        <span className="ml-2 text-slate-500 dark:text-slate-500">({m.duration_min}m)</span>
                      </div>
                    </div>
                    {m.notes ? (
                      <div className="mt-2 rounded-xl border-2 border-yellow-200 dark:border-yellow-700/60 bg-yellow-50/80 dark:bg-yellow-900/30 p-3 text-xs text-slate-800 dark:text-slate-200 shadow-sm">
                        {m.notes}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 sm:pl-4">
                    {hasLink ? (
                      <a
                        href={safeLink!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        Join <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                        No Link
                      </span>
                    )}

                    <button
                      onClick={() => handleCancelMeeting(m.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-50/90 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-2 text-xs font-medium border border-red-200 dark:border-red-800 shadow-sm hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </CardShell>
  );
}
