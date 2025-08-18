// src/app/admin/projects/[id]/components/tabs/DraftsTab.tsx
"use client";

import { motion } from "framer-motion";
import type { DraftRow, RevisionRow } from "../../types";

interface DraftsTabProps {
  drafts: DraftRow[] | null;
  revisions: RevisionRow[] | null;
}

const AnimatedCard = ({ 
  title, 
  children, 
  className = "", 
  gradient = false 
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
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
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

export default function DraftsTab({ drafts, revisions }: DraftsTabProps) {
  return (
    <motion.div 
      className="grid grid-cols-1 gap-6 lg:grid-cols-2" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
    >
      <AnimatedCard title="🔄 Drafts (Admin)" gradient>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.3 }}
        >
          {drafts === null ? (
            <motion.div 
              className="text-sm text-gray-500 dark:text-gray-400" 
              animate={{ opacity: [0.5, 1, 0.5] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              Loading drafts…
            </motion.div>
          ) : drafts.length ? (
            <motion.ul className="space-y-3 text-sm">
              {drafts.map((d, index) => {
                const list = (revisions ?? []).filter((r) => r.draft_id === d.draft_id);
                return (
                  <motion.li
                    key={d.draft_id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 shadow"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <motion.span 
                        className="font-medium text-gray-800 dark:text-gray-100 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-lg" 
                        whileHover={{ scale: 1.1 }}
                      >
                        v{d.version}
                      </motion.span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {d.created_at ? new Date(d.created_at).toLocaleString("id-ID") : "-"}
                      </span>
                    </div>
                    <div className="mt-2 break-all text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                      {d.file_path}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Uploaded by: {d.uploaded_by ?? "-"}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <motion.a
                        href={d.file_path}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border px-3 py-2 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        🔗 Open
                      </motion.a>
                    </div>

                    {list.length > 0 && (
                      <motion.div
                        className="mt-3 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-3 border border-yellow-200 dark:border-yellow-700/50"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ delay: 0.3 + 0.1 * index }}
                      >
                        <div className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1">
                          📝 Revision History
                        </div>
                        <motion.ul className="space-y-1">
                          {list.map((rv, rvIndex) => (
                            <motion.li
                              key={rv.revision_id}
                              className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 p-2 rounded-md"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 + 0.1 * rvIndex }}
                            >
                              <span className="font-medium">{rv.requested_by ?? "Unknown"}</span> — {rv.reason ?? "-"}
                              <span className="ml-2 text-[11px] text-gray-400 dark:text-gray-500">
                                {rv.created_at ? new Date(rv.created_at).toLocaleString("id-ID") : ""}
                              </span>
                            </motion.li>
                          ))}
                        </motion.ul>
                      </motion.div>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
          ) : (
            <motion.div 
              className="text-sm text-gray-500 dark:text-gray-400 text-center py-8" 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: 0.3 }}
            >
              📋 Belum ada draft.
            </motion.div>
          )}
        </motion.div>
      </AnimatedCard>

      <AnimatedCard title="📝 Notes / QA Checklist" gradient>
        <motion.div 
          className="text-sm text-gray-600 dark:text-gray-300 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.4 }}
        >
          📋 Tempat admin/A&R menyimpan catatan QC internal (draft 1 → final).
        </motion.div>
      </AnimatedCard>
    </motion.div>
  );
}
