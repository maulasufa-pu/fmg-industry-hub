// src/app/admin/projects/[id]/components/tabs/PublishingTab.tsx
"use client";

import { motion } from "framer-motion";
import type { ProjectSummary } from "../../types";
import type { UserRole } from "@/lib/roles";

interface PublishingTabProps {
  project: ProjectSummary;
  /** dikirim otomatis dari ProjectControlsSection via cloneElement */
  roleStatus?: UserRole;
  /** legacy fallback (optional) */
  isClient?: boolean;
}

const STAFF_ROLES: UserRole[] = [
  "owner","admin","anr","producer","composer","engineer","publisher"
];

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

export default function PublishingTab({
  project,
  roleStatus,
  isClient = false, // fallback
}: PublishingTabProps) {
  // Client view = bukan staff (owner/admin/anr/producer/composer/engineer/publisher)
  const isClientView =
    roleStatus ? !STAFF_ROLES.includes(roleStatus) : !!isClient;

  return (
    <motion.div
      data-role={roleStatus || (isClientView ? "client" : "staff")}
      className={`grid grid-cols-1 gap-6 ${isClientView ? "" : "lg:grid-cols-2"}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* === Status (selalu tampil) === */}
      <AnimatedCard title="📚 Publishing Status" gradient>
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-700/50">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              📊 Current Status
            </h4>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {project.status === "published" ? "Published ✅" : "Not Published Yet ⏳"}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Stage: {project.stage || "Unknown"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "🎵 Spotify", status: "Pending", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
              { label: "🍎 Apple Music", status: "Pending", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
              { label: "▶️ YouTube Music", status: "Pending", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
              { label: "🎧 Deezer", status: "Pending", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
            ].map((platform, index) => (
              <motion.div
                key={platform.label}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                  {platform.label}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${platform.color}`}>
                  {platform.status}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatedCard>

      {/* === Distribution Actions (HANYA staff/admin) === */}
      {!isClientView && (
        <AnimatedCard title="🔄 Distribution Actions" gradient>
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700/50">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                🚀 Quick Actions
              </h4>
              <div className="space-y-2">
                {[
                  { action: "Submit to Distributors", icon: "📤", color: "from-blue-500 to-indigo-600" },
                  { action: "Generate ISRC Codes", icon: "🔢", color: "from-green-500 to-emerald-600" },
                  { action: "Upload Artwork", icon: "🎨", color: "from-purple-500 to-pink-600" },
                  { action: "Set Release Date", icon: "📅", color: "from-orange-500 to-red-600" },
                ].map((item, index) => (
                  <motion.button
                    key={item.action}
                    className={`w-full p-3 rounded-xl bg-gradient-to-r ${item.color} text-white font-medium shadow hover:shadow-lg transition-all`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>{item.icon}</span>
                      {item.action}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatedCard>
      )}

      {/* === Analytics (selalu tampil) === */}
      <AnimatedCard
        title="📈 Analytics & Performance"
        gradient
        className={isClientView ? "" : "lg:col-span-2"}
      >
        <motion.div
          className="text-center py-8 text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-4xl mb-4">📊</div>
          <p>Performance analytics will appear here once the track is published.</p>
          <p className="text-xs mt-2">
            Includes streaming numbers, revenue tracking, and platform performance.
          </p>
        </motion.div>
      </AnimatedCard>
    </motion.div>
  );
}
