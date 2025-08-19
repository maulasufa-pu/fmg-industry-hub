"use client";

import type React from "react";
import { useEffect, useCallback, useState } from "react";
import { motion, Variants } from "framer-motion";
import Link from "next/link";
import type { ProjectSummary } from "../types";

interface HeroSectionProps {
  project: ProjectSummary;
  showRightActions?: boolean;
  onAcceptProject?: () => Promise<void>;
  onPutOnHold?: () => Promise<void>;
  onContinueProject?: () => Promise<void>; // ✅ baru
  teamMemberCount?: number;
  daysActive?: number;
}

function useIsSmallScreen(): boolean {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setSmall(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return small;
}

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
};

/** ------------------------------------------------------------------
 * Human-friendly text mappers (tidak sama dengan enum DB)
 * ------------------------------------------------------------------ */
const STATUS_TEXT: Record<string, string> = {
  requested: "Awaiting review",
  pending: "Awaiting review",
  in_progress: "Work in progress",
  revision: "Revisions in progress",
  approved: "Approved for release",
  published: "Released",
  finished: "Completed",
  archived: "Archived",
  cancelled: "Cancelled",
  on_hold: "On hold",
  hold: "On hold",
  paused: "Paused",
};

const STAGE_TEXT: Record<string, string> = {
  drafting: "Drafting & ideation",
  production: "Production",
  recording: "Recording session",
  mixing: "Mixing & balancing",
  mastering: "Mastering & final polish",
  revision: "Under review & revisions",
  distribution: "Distribution & release setup",
  request_review: "Request under review",
  awaiting_payment: "Awaiting payment",
  assign_team: "Team assignment",
  draft1_work: "First draft in progress",
  draft1_review: "First draft under review",
  finalization: "Finalizing deliverables",
  metadata: "Metadata & assets",
  agreement: "Agreement & paperwork",
};

function formatStatus(raw: string | null | undefined): string {
  const k = (raw ?? "").toLowerCase();
  return STATUS_TEXT[k] ?? (k ? "In progress" : "Not specified");
}

function formatStage(raw: string | null | undefined): string {
  const k = (raw ?? "").toLowerCase();
  return STAGE_TEXT[k] ?? (k ? "Active phase" : "Not specified");
}

/** Properti opsional yang mungkin ada di view untuk client name */
type WithClientName = ProjectSummary & {
  client_name?: string | null;
  client_full_name?: string | null;
  client?: string | null;
  created_at?: string | null;
  released_at?: string | null;
};

export default function HeroSection({
  project,
  showRightActions = false,
  onAcceptProject,
  onContinueProject,
  onPutOnHold,
  teamMemberCount,
  daysActive,
}: HeroSectionProps) {
  // prevent double click & visual feedback
  const [isAccepting, setIsAccepting] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  // helper display
  const artistName = project.artist_name?.trim() || "Unknown Artist";
  const p = project as WithClientName;
  const clientName =
    (p.client_name?.trim() ||
      p.client_full_name?.trim() ||
      p.client?.trim() ||
      null) ?? "Unknown Client";

  const genreText = project.genre?.trim() || "No genre";

  // pilih sumber year yang paling masuk akal
  const yearFrom = p.released_at ?? p.created_at ?? project.updated_at ?? null;
  const yearText = yearFrom ? new Date(yearFrom).getFullYear().toString() : undefined;

  // handler aman
  const handleAccept = useCallback(async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!onAcceptProject || isAccepting) return;
    try {
      setIsAccepting(true);
      await onAcceptProject();
    } catch (err) {
      console.error("[HeroSection] onAcceptProject error:", err);
    } finally {
      setIsAccepting(false);
    }
  }, [onAcceptProject, isAccepting]);

  const handleHold = useCallback(async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!onPutOnHold || isHolding) return;
    try {
      setIsHolding(true);
      await onPutOnHold();
    } catch (err) {
      console.error("[HeroSection] onPutOnHold error:", err);
    } finally {
      setIsHolding(false);
    }
  }, [onPutOnHold, isHolding]);

  const [isContinuing, setIsContinuing] = useState(false);

  const handleContinue = useCallback(async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!onContinueProject || isContinuing) return;
    try {
      setIsContinuing(true);
      await onContinueProject();
    } catch (err) {
      console.error("[HeroSection] onContinueProject error:", err);
    } finally {
      setIsContinuing(false);
    }
  }, [onContinueProject, isContinuing]);

  // rules tampil tombol
  const statusRaw = (project.status ?? "").toLowerCase();
  const isRequested  = statusRaw === "requested" || statusRaw === "pending";
  const isOnHold     = statusRaw === "on_hold" || statusRaw === "hold" || statusRaw === "paused";

  const showAcceptBtn   = isRequested;
  const showHoldBtn     = !isRequested && !isOnHold;   // ✅ jangan tampil saat on-hold
  const showContinueBtn = isOnHold;

  const teamCount = teamMemberCount ?? 0;
  const activeDays = daysActive ?? 0;

  // susun meta line: "Project by *client name* . genre . year."
  const metaParts: string[] = [`Project by ${clientName}`, genreText];
  if (yearText) metaParts.push(yearText);
  const metaLine = `${metaParts.join(" . ")}.`; // titik di akhir

  const isSmall = useIsSmallScreen();

  // progress guard
  const rawProgress = (project as { progress_percent?: number | null }).progress_percent;
  const progress = typeof rawProgress === "number" && Number.isFinite(rawProgress)
    ? Math.min(100, Math.max(0, rawProgress))
    : null;

  return (
    <>
      {/* Breadcrumb */}
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

      {/* Hero */}
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
        {/* Bg anim */}
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
          {/* Left */}
          <div className="flex-1 space-y-6">
            {/* Title — artist italic */}
            <motion.h1
              className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight floating-element"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
              whileHover={{ scale: 1.05 }}
            >
              🎵 {project.title}
              <span className="text-white font-bold"> — {artistName}</span>
            </motion.h1>

            {/* Meta line: Project by *client* . genre . year. */}
            <motion.p
              className="text-lg lg:text-xl text-blue-100 floating-element"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <span>{metaLine}</span>
            </motion.p>

            {/* Badges (status & stage human-friendly) */}
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
                <span className="text-sm font-semibold">
                  Status: {formatStatus(project.status)}
                </span>
              </motion.div>

              <motion.div
                className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 floating-element"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-sm font-semibold">
                  Phase: {formatStage(project.stage)}
                </span>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Actions */}
          {/* (opsional tombol besar di kanan) */}
          {showRightActions && (showAcceptBtn || showHoldBtn || showContinueBtn) && (
            <motion.div
              className="hidden sm:flex flex-col sm:flex-row xl:flex-col gap-4 xl:min-w-[280px]"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              {showContinueBtn && (
                <motion.button
                  type="button"
                  onClick={handleContinue}
                  disabled={isContinuing}
                  aria-disabled={isContinuing}
                  className="group relative px-8 py-4 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white font-semibold rounded-2xl shadow-2xl overflow-hidden floating-element"
                  whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(59,130,246,0.6)", y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ type: "tween", duration: 0.3 }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <motion.span animate={{ rotate: [0, 0, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      {isContinuing ? "⏳" : "▶️"}
                    </motion.span>
                    {isContinuing ? "Processing..." : "Continue Project"}
                  </span>
                </motion.button>
              )}

              {showAcceptBtn && (
                <motion.button
                  type="button"
                  onClick={handleAccept}
                  disabled={isAccepting}
                  aria-disabled={isAccepting}
                  className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white font-semibold rounded-2xl shadow-2xl overflow-hidden floating-element"
                  whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.6)", y: -3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ type: "tween", duration: 0.3 }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <motion.span animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                      {isAccepting ? "⏳" : "✅"}
                    </motion.span>
                    {isAccepting ? "Processing..." : "Accept Project"}
                  </span>
                </motion.button>
              )}

              {showHoldBtn && (
                <motion.button
                  type="button"
                  onClick={handleHold}
                  disabled={isHolding}
                  aria-disabled={isHolding}
                  className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-semibold rounded-2xl shadow-2xl overflow-hidden floating-element"
                  whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(245, 158, 11, 0.6)", y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ type: "tween", duration: 0.3 }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                      {isHolding ? "⏳" : "⏸️"}
                    </motion.span>
                    {isHolding ? "Processing..." : "Put on Hold"}
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

        {progress !== null && (
          <motion.div
            className="mt-8 w-full"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="flex justify-between text-sm">
              <span>Project Progress</span>
              <span className="font-bold">{progress}%</span>
            </div>

            <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full shadow-lg relative"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Mobile Quick Actions */}
      {showRightActions && isSmall && (showAcceptBtn || showHoldBtn || showContinueBtn) && (
        <motion.div
          className="sm:hidden flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {showContinueBtn && (
            <motion.button
              type="button"
              onClick={handleContinue}
              disabled={isContinuing}
              aria-disabled={isContinuing}
              className="w-full mt-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-3 text-white font-medium shadow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isContinuing ? "⏳ Processing..." : "▶️ Continue Project"}
            </motion.button>
          )}

          <div className="w-full max-w-xs">
            {showAcceptBtn && (
              <motion.button
                type="button"
                onClick={handleAccept}
                disabled={isAccepting}
                aria-disabled={isAccepting}
                className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 text-white font-medium shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isAccepting ? "⏳ Processing..." : "✅ Accept Project"}
              </motion.button>
            )}

            {showHoldBtn && (
              <motion.button
                type="button"
                onClick={handleHold}
                disabled={isHolding}
                aria-disabled={isHolding}
                className="w-full mt-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-3 text-white font-medium shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isHolding ? "⏳ Processing..." : "⏸️ Put on Hold"}
              </motion.button>
            )}
          </div>

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
