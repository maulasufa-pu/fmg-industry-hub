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
      className={`relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl dark:shadow-gray-800/25 ${
        gradient
          ? "bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20"
          : "bg-white dark:bg-gray-900"
      } ${className}`}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{
        scale: 1.01,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      }}
    >
      <div className="relative z-10 p-8">
        <motion.div
          className="mb-6 flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
            {title}
          </h3>
        </motion.div>
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

// small helper for display
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
      {/* MAIN INFO */}
      <AnimatedCard title="📝 Main Info (Read-only)" gradient>
        {/* Status & Stage - formatted, not input */}
        <motion.div
          className="mb-6 space-y-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-1.5 text-white text-xs font-semibold bg-gradient-to-r ${statusTone(
                project.status
              )} shadow`}
            >
              <span>Status</span>
              <span className="opacity-90">•</span>
              <span className="tracking-wide">{pretty(project.status)}</span>
            </span>

            <span className="inline-flex items-center gap-2 rounded-2xl px-4 py-1.5 text-xs font-semibold bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow">
              <span>Stage</span>
              <span className="opacity-90">•</span>
              <span className="tracking-wide">{pretty(project.stage)}</span>
            </span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300">
            This project is currently <span className="font-semibold">{pretty(project.status)}</span>{" "}
            and is at the <span className="font-semibold">{pretty(project.stage)}</span> stage.
          </p>
        </motion.div>

        {/* Other details - keep as read-only inputs for neatness */}
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
            // Progress removed as requested
            // { label: "📈 Progress", value: `${project.progress_percent || 0}%` },
          ].map((field, index) => (
            <motion.div
              key={field.label}
              className={field.span === 2 ? "col-span-2" : ""}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.08 }}
            >
              <label className="mb-2 block text-xs font-medium text-gray-600 dark:text-gray-300">
                {field.label}
              </label>
              <motion.input
                value={field.value}
                disabled
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 transition-all text-gray-800 dark:text-gray-200"
                whileHover={{ scale: 1.01 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatedCard>

      {/* DESCRIPTION with custom scrollbar */}
      <AnimatedCard title="📝 Project Description" gradient className="h-full flex flex-col">
        <motion.div
          className="flex-1 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="relative">
            {/* Top fade */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/70 dark:from-gray-900/70 to-transparent rounded-t-xl" />
            {/* Scrollable content */}
            <div
              className="descScroll whitespace-pre-wrap leading-relaxed text-sm text-gray-800 dark:text-gray-200 bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl p-4 max-h-[420px] overflow-auto shadow-inner"
              role="region"
              aria-label="Project description"
            >
              {project.description?.trim() || "No description provided"}
            </div>
            {/* Bottom fade */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/70 dark:from-gray-900/70 to-transparent rounded-b-xl" />
          </div>
        </motion.div>

        {/* custom scrollbar styles */}
        <style jsx>{`
          :global(.descScroll) {
            scrollbar-width: thin; /* Firefox */
            scrollbar-color: #94a3b8 transparent; /* thumb, track */
          }
          :global(.descScroll::-webkit-scrollbar) {
            width: 10px;
          }
          :global(.descScroll::-webkit-scrollbar-track) {
            background: transparent;
          }
          :global(.descScroll::-webkit-scrollbar-thumb) {
            background: linear-gradient(180deg, #c7d2fe 0%, #a5b4fc 50%, #818cf8 100%);
            border-radius: 9999px;
            border: 2px solid rgba(255, 255, 255, 0.4);
          }
          :global(.descScroll::-webkit-scrollbar-thumb:hover) {
            background: linear-gradient(180deg, #a5b4fc 0%, #818cf8 50%, #6366f1 100%);
          }
        `}</style>
      </AnimatedCard>
    </motion.div>
  );
}
