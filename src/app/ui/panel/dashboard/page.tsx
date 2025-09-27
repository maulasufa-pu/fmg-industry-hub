//E:\FMGIH\fmg-industry-hub\src\app\ui\panel\dashboard\page.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useFocusWarmAuth } from "@/lib/supabase/useFocusWarmAuth";
import { motion, AnimatePresence } from "framer-motion";
import { getEffectiveRole } from "@/lib/roles/effective";
import type { UserRole } from "@/lib/roles";
import { gsap } from "gsap";
import {
  TrendingUp,
  Clock,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Calendar,
  FileText,
  Settings
} from "lucide-react";

export default function AdminDashboard(): React.JSX.Element {
  useFocusWarmAuth();

  const supabase = useMemo(() => getSupabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<UserRole>("guest");

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error) {
        setUserId(null);
        return;
      }
      setUserId(data.user?.id ?? null);
    })();
    return () => { mounted = false; };
  }, [supabase]);

  const [kpi, setKpi] = useState({
    newRequests: 0,
    unpaidProjects: 0, 
    unassigned: 0,
    activeProjects: 0,
    upcomingMeetings: 0,
    unpaidInvoices: 0,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await getEffectiveRole();
        if (mounted) setRole(r);
      } catch {
        if (mounted) setRole("guest");
      }
    })();
    return () => { mounted = false; };
  }, []);

  const getCountSafe = useCallback(async (
    tableName: string,
    queryFn: () => Promise<{ count: number | null; error: Error | null }>
  ): Promise<number> => {
    try {
      const queryPromise = queryFn();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 5000)
      );
      const result = await Promise.race([queryPromise, timeoutPromise]) as { count: number | null; error: Error | null };
      const { count, error } = result;
      if (error) {
        console.warn(`Failed to fetch count from ${tableName}:`, error);
        return 0;
      }
      return count ?? 0;
    } catch (err) {
      const e = err as { message?: string };
      console.warn(`Error querying ${tableName}:`, e?.message || err);
      return 0;
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const nowIso = new Date().toISOString();

      if (role === "client" && !userId) {
        setKpi({ newRequests: 0, unpaidProjects: 0, unassigned: 0, activeProjects: 0, upcomingMeetings: 0, unpaidInvoices: 0 });
        return;
      }

      if (role === "admin" || role === "owner") {
        const newRequests = await getCountSafe("project_summary (new requests)", async () => {
          const { count, error } = await supabase
            .from("project_summary")
            .select("project_id", { count: "estimated", head: true })
            .eq("status", "requested");
          return { count, error };
        });

        const unpaidProjects = await getCountSafe("project_summary (unpaid projects)", async () => {
          const { count, error } = await supabase
            .from("project_summary")
            .select("project_id", { count: "estimated", head: true })
            .eq("status", "unpaid");
          return { count, error };
        });

        const unassigned = await getCountSafe("project_summary (unassigned)", async () => {
          const { count, error } = await supabase
            .from("project_summary")
            .select("project_id", { count: "estimated", head: true })
            .is("composer_id", null)
            .is("producer_id", null)
            .is("anr_id", null)
            .is("engineer_id", null)
            .is("publisher_id", null);
          return { count, error };
        });

        const activeProjects = await getCountSafe("project_summary (active projects)", async () => {
          const { count, error } = await supabase
            .from("project_summary")
            .select("project_id", { count: "exact", head: true }) // was: "estimated"
            .eq("status", "in_progress");
          return { count, error };
        });

        const upcomingMeetings = await getCountSafe("meetings (upcoming)", async () => {
          const { count, error } = await supabase
            .from("meetings")
            .select("id", { count: "exact", head: true })
            .gte("start_at", nowIso);
          return { count, error };
        });

        const unpaidInvoices = await getCountSafe("invoices (unpaid)", async () => {
          const { count, error } = await supabase
            .from("invoices")
            .select("id", { count: "exact", head: true })
            .eq("status", "unpaid");
          return { count, error };
        });

        setKpi({ newRequests, unpaidProjects, unassigned, activeProjects, upcomingMeetings, unpaidInvoices });
        return;
      }

      const activeProjects = await getCountSafe("project_summary (active projects - client)", async () => {
        const { count, error } = await supabase
          .from("project_summary")
          .select("project_id", { count: "exact", head: true }) // was: "estimated"
          .eq("status", "in_progress")
          .eq("client_id", userId!);
        return { count, error };
      });


      const upcomingMeetings = await getCountSafe("meetings (upcoming - client)", async () => {
        const { count, error } = await supabase
          .from("meetings")
          .select("id", { count: "exact", head: true })
          .gte("start_at", nowIso)
          .eq("client_id", userId!); 
        return { count, error };
      });

      const unpaidInvoices = await getCountSafe("invoices (unpaid - client)", async () => {
        const { count, error } = await supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("status", "unpaid")
          .eq("client_id", userId!); 
        return { count, error };
      });

      setKpi({
        newRequests: 0,
        unpaidProjects: 0,
        unassigned: 0,
        activeProjects,
        upcomingMeetings,
        unpaidInvoices
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [supabase, getCountSafe, role, userId]);

  useEffect(() => {
    void loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDashboardData]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.set(containerRef.current, { opacity: 0, y: 20 });
        gsap.to(containerRef.current, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" });
        if (statsRef.current) {
          gsap.set(statsRef.current.children, { opacity: 0, y: 30, scale: 0.95 });
          gsap.to(statsRef.current.children, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.08,
            ease: "back.out(1.3)",
            delay: 0.2
          });
        }
      }, containerRef.current);
      return () => ctx.revert();
    }
  }, [loading]);

  const animateValue = (start: number, end: number, duration: number = 800): Promise<number> => {
    return new Promise((resolve) => {
      if (end === 0) {
        resolve(0);
        return;
      }
      let startTime: number | null = null;
      const step = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOutCubic);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve(end);
        }
      };
      requestAnimationFrame(step);
    });
  };

  const Stat = ({
    label,
    value,
    color = "gray",
    icon: Icon,
  }: {
    label: string;
    value: number;
    color?: "gray" | "blue" | "green" | "orange" | "red" | "purple" | "crimson";
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
      if (!loading && !hasAnimated) {
        const timer = setTimeout(() => {
          if (value > 0) {
            animateValue(0, value).then((finalValue) => {
              setDisplayValue(finalValue);
              setHasAnimated(true);
            });
          } else {
            setDisplayValue(value);
            setHasAnimated(true);
          }
        }, 400);
        return () => clearTimeout(timer);
      }
    }, [value, loading, hasAnimated]);

    const colorSchemes = {
      gray: {
        bg: "from-neutral-50 via-stone-25 to-gray-100 dark:from-neutral-900 dark:via-stone-800 dark:to-gray-750",
        border: "border-neutral-200/60 dark:border-neutral-600/50",
        icon: "text-neutral-700 dark:text-neutral-100",
        accent: "from-neutral-500 via-stone-400 to-gray-600"
      },
      blue: {
        bg: "from-sky-50 via-sky-200 to-sky-400 dark:from-blue-900 dark:via-blue-700 dark:to-sky-400",
        border: "border-sky-300/70 dark:border-sky-400/60",
        icon: "text-sky-600 dark:text-sky-200",
        accent: "from-sky-400 via-sky-300 to-sky-500"
      },
      green: {
        bg: "from-green-100 via-emerald-200 to-lime-300 dark:from-green-700 dark:via-emerald-600 dark:to-lime-500",
        border: "border-green-300/70 dark:border-green-400/60",
        icon: "text-green-600 dark:text-green-200",
        accent: "from-green-400 via-emerald-300 to-lime-400"
      },
      orange: {
        bg: "from-orange-100 via-amber-200 to-yellow-300 dark:from-orange-700 dark:via-amber-600 dark:to-yellow-00",
        border: "border-orange-300/70 dark:border-orange-400/60",
        icon: "text-orange-600 dark:text-orange-200",
        accent: "from-orange-400 via-amber-300 to-yellow-400"
      },
      red: {
        bg: "from-red-300 via-rose-200 to-pink-300 dark:from-red-800 dark:via-rose-600 dark:to-pink-500",
        border: "border-red-300/70 dark:border-red-400/60",
        icon: "text-red-600 dark:text-red-200",
        accent: "from-red-400 via-rose-300 to-pink-400"
      },
      purple: {
        bg: "from-purple-100 via-violet-200 to-fuchsia-300 dark:from-purple-700 dark:via-violet-600 dark:to-fuchsia-500",
        border: "border-purple-300/70 dark:border-purple-400/60",
        icon: "text-purple-600 dark:text-purple-200",
        accent: "from-purple-400 via-violet-300 to-fuchsia-400"
      },
      crimson: {
        bg: "from-red-700 via-red-300 to-red-400 dark:from-red-800 dark:via-red-700 dark:to-red-600",
        border: "border-red-400/70 dark:border-red-500/60",
        icon: "text-red-700 dark:text-red-200",
        accent: "from-red-500 via-red-400 to-red-600"
      }
    } as const;

    const scheme = colorSchemes[color];

    return (
      <motion.div
        className={`relative overflow-hidden bg-gradient-to-br ${scheme.bg} rounded-xl shadow-lg border ${scheme.border} group hover:shadow-xl transition-all duration-300 min-w-0`}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className={`absolute inset-0 bg-gradient-to-r ${scheme.accent} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
        <div className="relative p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="text-[11px] sm:text-xs text-gray-600 dark:text-white uppercase tracking-wider font-semibold">
              {label}
            </div>
            {Icon && (
              <motion.div
                className={`${scheme.icon} opacity-60 group-hover:opacity-100 transition-opacity duration-300 shrink-0`}
                whileHover={{ scale: 1.1, rotate: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Icon width={18} height={18} />
              </motion.div>
            )}
          </div>

          <div className="flex items-end justify-between gap-2">
            <motion.div
              className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate"
              key={displayValue}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {displayValue.toLocaleString()}
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
      </motion.div>
    );
  };

  const AdminView = () => (
    <div
      className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-25 to-sky-100 dark:from-neutral-950 dark:via-blue-950 dark:to-sky-900"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="space-y-1">
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 dark:from-sky-400 dark:to-purple-300 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Admin Dashboard
            </motion.h1>
            <motion.p
              className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Monitor your business metrics at a glance
            </motion.p>
          </div>

          <motion.button
            onClick={() => void loadDashboardData()}
            disabled={loading}
            className="group relative w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center sm:justify-start space-x-2">
              <motion.div
                animate={loading ? { rotate: 360 } : { rotate: 0 }}
                transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
              >
                <RefreshCw width={18} height={18} />
              </motion.div>
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </div>
          </motion.button>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="bg-gradient-to-r from-rose-100 via-red-50 to-pink-200 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 sm:px-6 py-3 sm:py-4 rounded-xl flex justify-between items-center shadow-lg"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              layout
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle width={20} height={20} />
                <span className="font-medium text-sm sm:text-base">{error}</span>
              </div>
              <motion.button
                onClick={() => setError(null)}
                className="ml-3 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30 p-1 rounded-full transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
          <Stat label="New Requests" value={kpi.newRequests} color="blue" icon={FileText} />
          <Stat label="Unpaid Projects" value={kpi.unpaidProjects} color="orange" icon={Clock} />
          <Stat label="Unassigned" value={kpi.unassigned} color="red" icon={AlertTriangle} />
          <Stat label="Active Projects" value={kpi.activeProjects} color="green" icon={CheckCircle} />
          <Stat label="Upcoming Meetings" value={kpi.upcomingMeetings} color="purple" icon={Calendar} />
          <Stat label="Unpaid Invoices" value={kpi.unpaidInvoices} color="crimson" icon={DollarSign} />
        </div>

        <motion.div
          className="bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-600/30 p-6 sm:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
        >
          <motion.h2
            className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center space-x-3"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <Settings className="text-sky-600 dark:text-sky-200" />
            <span>Quick Actions</span>
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, title: "Projects", subtitle: "Manage project pipeline", color: "from-blue-500 to-indigo-600" },
              { icon: Users, title: "Users", subtitle: "Manage user roles", color: "from-green-500 to-emerald-600" },
              { icon: DollarSign, title: "Invoices", subtitle: "Track payments", color: "from-orange-500 to-red-600" },
              { icon: FileText, title: "Reports", subtitle: "View analytics", color: "from-purple-500 to-pink-600" }
            ].map((action, index) => (
              <motion.button
                key={action.title}
                className="group relative w-full p-5 sm:p-6 text-left border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <motion.div
                  className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${action.color} text-white mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <action.icon />
                </motion.div>
                <div className="relative">
                  <div className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
                    {action.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-neutral-600 dark:group-hover:text-gray-200 transition-colors">
                    {action.subtitle}
                  </div>
                </div>
                <motion.div
                  className="absolute top-4 right-4 text-gray-400 group-hover:text-neutral-600 dark:group-hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  initial={{ x: -5 }}
                  whileHover={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  →
                </motion.div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const ClientView = () => (
    <div
      className="min-h-screen bg-gradient-to-br from-neutral-50 via-emerald-25 to-emerald-100 dark:from-neutral-950 dark:via-emerald-950 dark:to-emerald-900"
      ref={containerRef}
    >
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8">
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="space-y-1">
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-300 dark:to-teal-200 bg-clip-text text-transparent"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Client Dashboard
            </motion.h1>
            <motion.p
              className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Track your projects & upcoming meetings
            </motion.p>
          </div>

          <motion.button
            onClick={() => void loadDashboardData()}
            disabled={loading}
            className="group relative w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center justify-center sm:justify-start space-x-2">
              <motion.div
                animate={loading ? { rotate: 360 } : { rotate: 0 }}
                transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
              >
                <RefreshCw width={18} height={18} />
              </motion.div>
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </div>
          </motion.button>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="bg-gradient-to-r from-rose-100 via-red-50 to-pink-200 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 sm:px-6 py-3 sm:py-4 rounded-xl flex justify-between items-center shadow-lg"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              layout
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle width={20} height={20} />
                <span className="font-medium text-sm sm:text-base">{error}</span>
              </div>
              <motion.button
                onClick={() => setError(null)}
                className="ml-3 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30 p-1 rounded-full transition-all duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Stat label="Active Projects" value={kpi.activeProjects} color="green" icon={CheckCircle} />
          <Stat label="Upcoming Meetings" value={kpi.upcomingMeetings} color="purple" icon={Calendar} />
          <Stat label="Unpaid Invoices" value={kpi.unpaidInvoices} color="crimson" icon={DollarSign} />
        </div>

        <motion.div
          className="bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-600/30 p-6 sm:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
        >
          <motion.h2
            className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center space-x-3"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <Settings className="text-emerald-600 dark:text-emerald-200" />
            <span>Quick Actions</span>
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: FileText, title: "Request New Project", subtitle: "Start a new brief", color: "from-emerald-500 to-teal-600" },
              { icon: Calendar, title: "Book a Meeting", subtitle: "Schedule with our team", color: "from-blue-500 to-indigo-600" },
              { icon: DollarSign, title: "Pay Invoice", subtitle: "Complete your payment", color: "from-orange-500 to-red-600" },
            ].map((action, index) => (
              <motion.button
                key={action.title}
                className="group relative w-full p-5 sm:p-6 text-left border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                <motion.div
                  className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${action.color} text-white mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <action.icon />
                </motion.div>
                <div className="relative">
                  <div className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
                    {action.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-neutral-600 dark:group-hover:text-gray-200 transition-colors">
                    {action.subtitle}
                  </div>
                </div>
                <motion.div
                  className="absolute top-4 right-4 text-gray-400 group-hover:text-neutral-600 dark:group-hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  initial={{ x: -5 }}
                  whileHover={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  →
                </motion.div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-4 sm:p-6">
        <motion.div
          className="max-w-7xl mx-auto space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="h-7 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded-lg w-48 sm:w-64 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72 sm:w-96 animate-pulse" />
            </div>
            <div className="h-10 bg-blue-300 dark:bg-blue-600 rounded-lg w-full sm:w-24 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600 p-4 sm:p-6 space-y-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                <div className="h-8 bg-gray-400 dark:bg-gray-500 rounded animate-pulse w-3/4" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (role === "admin" || role === "owner") return <AdminView />;
  if (role === "client") return <ClientView />;

  return (
    <div className="min-h-screen grid place-items-center p-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Unauthorized</h2>
        <p className="text-gray-500">Please sign in with the correct account.</p>
      </div>
    </div>
  );
}
