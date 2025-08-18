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

export default function OverviewTab({ project }: OverviewTabProps) {
  return (
    <motion.div 
      className="grid grid-cols-1 gap-6 lg:grid-cols-2" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
    >
      <AnimatedCard title="📝 Main Info (Read-only)" gradient>
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
            { label: "📊 Status", value: project.status },
            { label: "🎬 Stage", value: project.stage || "N/A" },
            { label: "👤 Client ID", value: project.client_id || "N/A" },
            { label: "📅 Last Updated", value: new Date(project.updated_at).toLocaleString("id-ID") },
            { label: "📈 Progress", value: `${project.progress_percent || 0}%` },
          ].map((field, index) => (
            <motion.div
              key={field.label}
              className={field.span === 2 ? "col-span-2" : ""}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
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

      <AnimatedCard title="📝 Project Description" gradient className="h-full flex flex-col">
        <motion.div 
          className="flex-1 flex flex-col" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.4 }}
        >
          <motion.textarea
            value={project.description || "No description provided"}
            disabled
            className="w-full flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 transition-all resize-none text-gray-800 dark:text-gray-200"
            whileHover={{ scale: 1.01 }}
            placeholder="Project description will appear here..."
            style={{ height: "100%", minHeight: "400px" }}
          />
        </motion.div>
      </AnimatedCard>
    </motion.div>
  );
}
