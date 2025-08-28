"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import SidebarSection from "@/app/ui/page_section/SidebarSection";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserRole } from "@/lib/roles";
import { getEffectiveRole } from "@/lib/roles/effective";
import { getSupabaseClient } from "@/lib/supabase/client";

const WAKE_EVENT = "admin-wake";
const DEBOUNCE_MS = 1500;

type Props = {
  role: UserRole;            // ⬅️ diterima dari layout (server)
  children: React.ReactNode;
};

export default function AdminShell({ role, children }: Props): React.JSX.Element {
  const last = useRef<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>(role);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => getSupabaseClient(), []);

  // Check user role on mount
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[AdminShell] No session found');
          setIsLoading(false);
          return;
        }

        console.log('[AdminShell] User email:', session.user.email);

        // Check if user is owner from environment
        const ownerEmails = (process.env.NEXT_PUBLIC_OWNER_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
        const userEmail = (session.user.email || "").toLowerCase();
        
        console.log('[AdminShell] Owner emails:', ownerEmails);
        console.log('[AdminShell] User email normalized:', userEmail);
        
        if (ownerEmails.length > 0 && ownerEmails.includes(userEmail)) {
          console.log('[AdminShell] User is owner based on environment');
          setCurrentRole("owner");
          setIsLoading(false);
          return;
        }

        // Get role from database
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("main_role, staff_role")
          .eq("id", session.user.id)
          .maybeSingle();

        console.log('[AdminShell] Profile data:', profile, 'error:', error);

        if (profile) {
          const allRoles: string[] = [];
          if (profile.main_role) allRoles.push(profile.main_role);
          if (profile.staff_role && Array.isArray(profile.staff_role)) {
            allRoles.push(...profile.staff_role);
          }
          
          console.log('[AdminShell] All roles:', allRoles);
          
          // Priority: owner > admin > client
          let effectiveRole: UserRole = "client";
          if (allRoles.includes("owner")) effectiveRole = "owner";
          else if (allRoles.includes("admin")) effectiveRole = "admin";
          else effectiveRole = "client";
          
          console.log('[AdminShell] Effective role:', effectiveRole);
          setCurrentRole(effectiveRole);
        } else {
          console.log('[AdminShell] No profile found, defaulting to admin for testing');
          // Fallback: if no profile but user is authenticated, assume admin for debugging
          setCurrentRole("admin");
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        // Fallback to admin if there's an error
        setCurrentRole("admin");
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [supabase]);

  useEffect(() => {
    const fire = () => {
      const now = Date.now();
      if (now - last.current < DEBOUNCE_MS) return;
      last.current = now;
      window.dispatchEvent(new Event(WAKE_EVENT));
    };
    const onFocus = () => fire();
    const onVis = () => { if (document.visibilityState === "visible") fire(); };
    const onPageShow = () => fire();

    window.addEventListener("focus", onFocus, { passive: true });
    document.addEventListener("visibilitychange", onVis, { passive: true });
    window.addEventListener("pageshow", onPageShow, { passive: true });

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (sidebarOpen && !target.closest('[data-sidebar]') && !target.closest('[data-menu-button]')) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [sidebarOpen]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // Kalau kamu mau tampilkan badge kecil role di header, bisa pakai memo ini.
  const arolePretty = useMemo(() => currentRole.replace("_", " ").toUpperCase(), [currentRole]);
  
  // Debug logging
  useEffect(() => {
    console.log('[AdminShell] currentRole =', currentRole, 'isLoading =', isLoading);
    console.log('[AdminShell] sidebarOpen =', sidebarOpen);
    console.log('[AdminShell] NEXT_PUBLIC_OWNER_EMAILS =', process.env.NEXT_PUBLIC_OWNER_EMAILS);
  }, [currentRole, isLoading, sidebarOpen]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <div className="text-slate-300">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start relative bg-coolgray-10 w-full min-h-screen overflow-x-hidden">
      {/* Mobile Header */}
      <motion.div 
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 backdrop-blur-sm border-b border-slate-700 h-16"
        initial={{ y: -64 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-3">
            <motion.button
              data-menu-button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle sidebar"
            >
              <AnimatePresence mode="wait">
                {sidebarOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            
            <div className="flex items-center gap-2">
              <div className="inline-flex flex-col items-end justify-center relative flex-[0_0_auto]">
                <div 
                  className="relative w-fit mt-[-1.00px] font-heading-4 font-[number:var(--heading-4-font-weight)] text-gray-800 dark:text-gray-100 dark:text-gray-100 text-[length:var(--heading-4-font-size)] tracking-[var(--heading-4-letter-spacing)] leading-[var(--heading-4-line-height)] whitespace-nowrap [font-style:var(--heading-4-font-style)]">
                  Flemmo Music
                </div>

                <div 
                  className="relative w-fit -mt-1 font-body-XS font-[number:var(--body-XS-font-weight)] text-neutral-600 dark:text-neutral-200 dark:text-gray-200 text-[length:var(--body-XS-font-size)] tracking-[var(--body-XS-letter-spacing)] leading-[var(--body-XS-line-height)] whitespace-nowrap [font-style:var(--body-XS-font-style)]">
                Global Universe Solution
                </div>
              </div>
              <div className="hidden sm:block text-xs text-slate-300 px-2 py-1 bg-slate-800/50 rounded-full border border-slate-600">
                {arolePretty}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <SidebarSection
        role={currentRole} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 w-full max-w-none lg:pl-72">
        {children}
      </main>
    </div>
  );
}
