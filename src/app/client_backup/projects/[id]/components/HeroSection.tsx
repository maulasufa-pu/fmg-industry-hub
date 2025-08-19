// src/app/admin/projects/[id]/components/HeroSection.tsx
"use client";

import { motion, Variants } from "framer-motion";
import Link from "next/link";
import type { ProjectSummary } from "../types";

interface HeroSectionProps {
  project: ProjectSummary;
  showRightActions?: boolean;
  onAcceptProject?: () => Promise<void>;
  onPutOnHold?: () => Promise<void>;
  teamMemberCount?: number; // ✅
  daysActive?: number;      // ✅
}

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" as const }
  }
};

const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

interface HeroSectionProps {
  project: ProjectSummary;
  showRightActions?: boolean;
  onAcceptProject?: () => Promise<void>;
  onPutOnHold?: () => Promise<void>;
  teamMemberCount?: number;   // NEW
  daysActive?: number;        // NEW
}

export default function HeroSection({
  project,
  showRightActions = false,
  onAcceptProject,
  onPutOnHold,
  teamMemberCount,
  daysActive,
}: HeroSectionProps) {

  // 🌟 rules tampil tombol
  const isRequested = (project.status ?? "").toLowerCase() === "requested";
  const isDrafty = (project.stage ?? "").toLowerCase().startsWith("draft");
  const showAcceptBtn = isRequested;
  const showHoldBtn = !isRequested && !isDrafty;

  const teamCount = teamMemberCount ?? 0;
  const activeDays = daysActive ?? 0;

  return (
    <>
      {/* Enhanced Floating Breadcrumb */}
      <motion.div 
        className="sticky top-4 z-40" 
        initial={{ opacity: 0, y: -30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2, type: "spring" }}
      >
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-white/30 dark:border-slate-700/30 shadow-2xl dark:shadow-slate-900/50 p-4">
          <motion.nav className="text-sm text-slate-500 dark:text-slate-400" whileHover={{ scale: 1.02 }}>
            <ol className="flex items-center gap-3 flex-wrap">
              <li>
                <Link
                  href="/admin/projects"
                  className="hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 flex items-center gap-2"
                >
                  <motion.span whileHover={{ rotate: 15 }} className="text-lg">
                    🏠
                  </motion.span>
                  Projects (Admin)
                </Link>
              </li>
              <motion.li 
                animate={{ rotate: [0, 15, -15, 0] }} 
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 5 }} 
                className="text-slate-400 text-lg"
              >
                →
              </motion.li>
              <motion.li
                className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <span className="text-lg">🎵</span>
                <span className="max-w-[40vw] truncate">{project.title}</span>
              </motion.li>
            </ol>
          </motion.nav>
        </div>
      </motion.div>

      {/* Enhanced Hero Section with Project Status */}
      <motion.div
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 lg:p-12 text-white shadow-2xl floating-element"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        whileHover={{
          scale: 1.02,
          boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.5)",
        }}
      >
        {/* Animated Background Pattern */}
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          {/* Left Content */}
          <div className="flex-1 space-y-6">
            <motion.h1
              className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight floating-element"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
              whileHover={{ scale: 1.05 }}
            >
              🎵 {project.title}
            </motion.h1>

            <motion.p 
              className="text-xl text-blue-100 floating-element" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.6 }}
            >
              by <span className="font-semibold">{project.artist_name || "Unknown Artist"}</span> •{" "}
              <span className="font-medium">{project.genre || "No genre"}</span>
            </motion.p>

            {/* Enhanced Status Badges */}
            <motion.div 
              className="flex flex-wrap gap-4" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.8 }}
            >
              <motion.div 
                className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 floating-element" 
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <span className="text-sm font-semibold">Status: {project.status}</span>
              </motion.div>

              <motion.div
                className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 floating-element"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-sm font-semibold">Stage: {project.stage}</span>
              </motion.div>

              {project.progress_percent !== null && (
                <motion.div
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 floating-element"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-sm font-semibold stat-number">Progress: {project.progress_percent}%</span>
                </motion.div>
              )}
            </motion.div>

            {/* Progress Bar */}
            {project.progress_percent !== null && (
              <motion.div 
                className="space-y-3" 
                initial={{ opacity: 0, scaleX: 0 }} 
                animate={{ opacity: 1, scaleX: 1 }} 
                transition={{ delay: 1, duration: 0.8 }}
              >
                <div className="flex justify-between text-sm">
                  <span>Project Progress</span>
                  <span className="font-bold">{project.progress_percent}%</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full shadow-lg relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress_percent}%` }}
                    transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
                  >
                    {/* Animated shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Enhanced Right Actions - Only show if user has access */}
          {showRightActions && (showAcceptBtn || showHoldBtn) && (
          <motion.div
            className="hidden sm:flex flex-col sm:flex-row xl:flex-col gap-4 xl:min-w-[280px]"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            {showAcceptBtn && (
              <motion.button
                onClick={onAcceptProject}
                className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white font-semibold rounded-2xl shadow-2xl overflow-hidden floating-element"
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.6)", y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600" initial={{ x: "-100%" }} whileHover={{ x: 0 }} transition={{ type: "tween", duration: 0.3 }} />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    ✅
                  </motion.span>
                  Accept Project
                </span>
              </motion.button>
            )}

            {showHoldBtn && (
              <motion.button
                onClick={onPutOnHold}
                className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-semibold rounded-2xl shadow-2xl overflow-hidden floating-element"
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(245, 158, 11, 0.6)", y: -3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ delay: 0.1 }}
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600" initial={{ x: "-100%" }} whileHover={{ x: 0 }} transition={{ type: "tween", duration: 0.3 }} />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                    ⏸️
                  </motion.span>
                  Put on Hold
                </span>
              </motion.button>
            )}

                {/* Quick Stats */}
                <motion.div
                  className="grid grid-cols-2 gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold stat-number">{teamCount}</div>
                    <div className="text-xs opacity-80">Team Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold stat-number">{activeDays}</div>
                    <div className="text-xs opacity-80">Days Active</div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Mobile Quick Actions — sekarang center + tampilkan stats juga */}
        {showRightActions && (
          <motion.div
            className="sm:hidden flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Rail untuk tombol: lebar sama dengan quick stats */}
            <div className="w-full max-w-xs">
              {showAcceptBtn && (
                <motion.button
                  onClick={onAcceptProject}
                  className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 text-white font-medium shadow"
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(34, 197, 94, 0.4)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  ✅ Accept Project
                </motion.button>
              )}

              {showHoldBtn && (
                <motion.button
                  onClick={onPutOnHold}
                  className="w-full mt-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-3 text-white font-medium shadow"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ⏸️ Put on Hold
                </motion.button>
              )}
            </div>

            {/* Quick Stats: rail yang sama */}
            <motion.div
              className="w-full max-w-xs grid grid-cols-2 gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold stat-number">{teamCount}</div>
                <div className="text-xs opacity-80">Team Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold stat-number">{activeDays}</div>
                <div className="text-xs opacity-80">Days Active</div>
              </div>
            </motion.div>
          </motion.div>
        )}

    </>
  );
}
