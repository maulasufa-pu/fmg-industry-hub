// src/app/admin/projects/[id]/components/tabs/MeetingsTab.tsx
"use client";

import { motion } from "framer-motion";
import type { MeetingRow, ProjectSummary } from "../../types";

interface MeetingsTabProps {
  project: ProjectSummary;
  meetings: MeetingRow[] | null;
  setMeetings: React.Dispatch<React.SetStateAction<MeetingRow[] | null>>;
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

function CancelMeetingButton({ id, onCancelled }: { id: string; onCancelled: () => void }) {
  return (
    <motion.button
      onClick={onCancelled}
      className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      ❌ Cancel
    </motion.button>
  );
}

export default function MeetingsTab({ 
  project,
  meetings, 
  setMeetings 
}: MeetingsTabProps) {
  const handleCancelMeeting = (id: string) => {
    setMeetings(prev => prev ? prev.filter(meeting => meeting.id !== id) : prev);
  };
  return (
    <AnimatedCard title="🗓️ Meetings (Admin)" gradient>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {meetings === null ? (
          <motion.div 
            className="text-sm text-gray-500 dark:text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            Loading…
          </motion.div>
        ) : meetings.length === 0 ? (
          <motion.div 
            className="text-sm text-gray-500 dark:text-gray-400 text-center py-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            🗓️ Belum ada meeting.
          </motion.div>
        ) : (
          <motion.ul className="space-y-3">
            {meetings.map((m, index) => {
              const start = new Date(m.start_at);
              const end = new Date(start.getTime() + m.duration_min * 60_000);
              return (
                <motion.li 
                  key={m.id} 
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 text-sm shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  <div className="flex items-center justify-between">
                    <motion.div 
                      className="font-medium text-gray-800 dark:text-gray-100 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-lg"
                      whileHover={{ scale: 1.05 }}
                    >
                      📅 {m.title}
                    </motion.div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                      ⏰ {start.toLocaleString("id-ID")} –{" "}
                      {end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  {m.notes && (
                    <motion.div 
                      className="mt-3 text-gray-700 dark:text-gray-200 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + 0.1 * index }}
                    >
                      📝 {m.notes}
                    </motion.div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    {m.link ? (
                      <motion.a
                        className="inline-flex items-center rounded-lg border px-3 py-2 text-xs bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium"
                        href={m.link}
                        target="_blank"
                        rel="noreferrer"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        🚀 Join
                      </motion.a>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
                        🔗 No link
                      </span>
                    )}
                    <CancelMeetingButton
                      id={m.id}
                      onCancelled={() => handleCancelMeeting(m.id)}
                    />
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </motion.div>
    </AnimatedCard>
  );
}
