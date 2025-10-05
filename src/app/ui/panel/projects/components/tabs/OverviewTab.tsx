// src/app/admin/projects/[id]/components/tabs/OverviewTab.tsx
"use client";

import { motion } from "framer-motion";
import type { ProjectSummary } from "../../types";

interface OverviewTabProps {
  project: ProjectSummary;
}

const AnimatedCard = ({
  title,
  children,
  className = "",
  gradient = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}) => {
  return (
    <motion.section
      className={`relative overflow-hidden rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-xl shadow-black/10 dark:shadow-black/30 ${
        gradient
          ? "bg-gradient-to-br from-white/95 via-blue-50/90 to-purple-50/80 dark:from-slate-900/95 dark:via-blue-950/40 dark:to-purple-950/40"
          : "bg-white/95 dark:bg-slate-900/95"
      } backdrop-blur-sm ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{
        scale: 1.01,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
      }}
    >
      <div className="relative z-10 p-8">
        <motion.h3 
          className="mb-6 text-lg font-bold text-slate-800 dark:text-slate-100 bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 dark:from-slate-100 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h3>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </motion.section>
  );
};

const pretty = (s?: string | null) =>
  (s ?? "N/A")
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const statusTone = (status?: string | null) => {
  const s = (status ?? "").toLowerCase();
  if (["approved", "completed", "done"].includes(s)) return "from-emerald-500 to-green-600";
  if (["requested", "new"].includes(s)) return "from-amber-500 to-yellow-600";
  if (["pending", "on_hold", "hold"].includes(s)) return "from-orange-500 to-amber-600";
  if (["in_progress", "progress", "working"].includes(s)) return "from-sky-500 to-indigo-600";
  if (["cancelled", "rejected"].includes(s)) return "from-rose-500 to-red-600";
  return "from-slate-500 to-slate-600";
};

export default function OverviewTab({ project }: OverviewTabProps) {
  const lastUpdated =
    project.updated_at ? new Date(project.updated_at).toLocaleString("en-US") : "N/A";

  return (
    <motion.div
      className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatedCard title="📝 Main Info (Read-only)" gradient>
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-1.5 text-white text-xs font-semibold bg-gradient-to-r ${statusTone(
                project.status
              )} shadow-lg shadow-black/20 dark:shadow-black/40 border border-white/20 dark:border-white/10`}
            >
              <span>Status</span>
              <span className="opacity-90">•</span>
              <span className="tracking-wide">{pretty(project.status)}</span>
            </span>

            <span className="inline-flex items-center gap-2 rounded-2xl px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg shadow-fuchsia-500/25 dark:shadow-fuchsia-400/30 border border-white/20 dark:border-white/10">
              <span>Stage</span>
              <span className="opacity-90">•</span>
              <span className="tracking-wide">{pretty(project.stage)}</span>
            </span>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300">
            This project is currently <span className="font-semibold text-slate-800 dark:text-slate-200">{pretty(project.status)}</span>{" "}
            and is at the <span className="font-semibold text-slate-800 dark:text-slate-200">{pretty(project.stage)}</span> stage.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-2 gap-4 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[
            { label: "🎵 Project Title", value: project.title, span: 2 },
            { label: "🎤 Artist Name", value: project.artist_name || "N/A" },
            { label: "🎼 Genre", value: project.genre || "N/A" },
            { label: "👤 Client ID", value: project.client_id || "N/A" },
            { label: "📅 Last Updated", value: lastUpdated },
          ].map((field, index) => (
            <motion.div
              key={field.label}
              className={field.span === 2 ? "col-span-2" : ""}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.08 }}
            >
              <label className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {field.label}
              </label>
              <motion.input
                value={field.value}
                disabled
                className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50/90 dark:bg-slate-800/90 px-4 py-3 text-slate-800 dark:text-slate-200 shadow-sm transition-all duration-200 cursor-not-allowed"
                whileHover={{ scale: 1.01 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatedCard>

      <AnimatedCard title="📝 Project Description" gradient className="h-full flex flex-col">
        <div className="flex-1 flex flex-col">
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/80 dark:from-slate-900/80 to-transparent rounded-t-xl z-10" />
            <div
              className="descScroll whitespace-pre-wrap leading-relaxed text-sm text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-600 rounded-xl p-4 max-h-[420px] overflow-auto shadow-inner shadow-slate-200/50 dark:shadow-slate-800/50"
              role="region"
              aria-label="Project description"
            >
              {project.description?.trim() || "No description provided"}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/80 dark:from-slate-900/80 to-transparent rounded-b-xl z-10" />
          </div>
        </div>

        <style jsx>{`
          :global(.descScroll) {
            scrollbar-width: thin; /* Firefox */
            scrollbar-color: #64748b transparent; /* thumb, track */
          }
          :global(.dark .descScroll) {
            scrollbar-color: #475569 transparent; /* thumb for dark mode */
          }
          :global(.descScroll::-webkit-scrollbar) {
            width: 12px;
          }
          :global(.descScroll::-webkit-scrollbar-track) {
            background: transparent;
            border-radius: 10px;
          }
          :global(.descScroll::-webkit-scrollbar-thumb) {
            background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 50%, #64748b 100%);
            border-radius: 10px;
            border: 2px solid rgba(255, 255, 255, 0.2);
          }
          :global(.descScroll::-webkit-scrollbar-thumb:hover) {
            background: linear-gradient(180deg, #94a3b8 0%, #64748b 50%, #475569 100%);
          }
          :global(.dark .descScroll::-webkit-scrollbar-thumb) {
            background: linear-gradient(180deg, #475569 0%, #334155 50%, #1e293b 100%);
            border: 2px solid rgba(0, 0, 0, 0.2);
          }
          :global(.dark .descScroll::-webkit-scrollbar-thumb:hover) {
            background: linear-gradient(180deg, #334155 0%, #1e293b 50%, #0f172a 100%);
          }
        `}</style>
      </AnimatedCard>
    </motion.div>
  );
}
