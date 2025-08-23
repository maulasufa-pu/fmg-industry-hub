"use client";

import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/roles";
import {
  Layout, Clipboard, FileText, Calendar, BookOpen, Users,
  BarChart3, Music, Headphones, Mic2, Settings, Package2 // ⬅️ tambah ini
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import UserDropdown from "../pop_over/user_dropdown";
import { useProfile } from "@/hooks/useProfile";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import Portal from "@/components/ui/Portal";

/** ------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------ */

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type Props = { 
  role: UserRole;
  isOpen?: boolean;
  onClose?: () => void;
};

/** ------------------------------------------------------------------
 * Menu Map (keep strictly typed)
 * ------------------------------------------------------------------ */

const MENU: Partial<Record<UserRole, readonly NavItem[]>> = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", Icon: Layout },
    { href: "/admin/projects", label: "Projects", Icon: Clipboard },
    { href: "/admin/invoices", label: "Invoices", Icon: FileText },
    // { href: "/admin/meetings", label: "Meetings", Icon: Calendar },
    // { href: "/admin/publishing", label: "Publishing", Icon: BookOpen },
    { href: "/admin/productservices", label: "Products & Services", Icon: Package2 }, // ⬅️ baru
    { href: "/admin/users", label: "Users (Owner)", Icon: Users },
  ],
  owner: [
    { href: "/admin/dashboard", label: "Dashboard", Icon: Layout },
    { href: "/admin/projects", label: "Projects", Icon: Clipboard },
    { href: "/admin/invoices", label: "Invoices", Icon: FileText },
    // { href: "/admin/meetings", label: "Meetings", Icon: Calendar },
    // { href: "/admin/publishing", label: "Publishing", Icon: BookOpen },
    { href: "/admin/productservices", label: "Products & Services", Icon: Package2 }, // ⬅️ baru
    { href: "/admin/users", label: "Users", Icon: Users },
  ],
  anr: [
    // { href: "/admin/anr/queue", label: "My Queue", Icon: Clipboard },
    // { href: "/admin/anr/meetings", label: "Meetings", Icon: Calendar },
    // { href: "/admin/anr/qc", label: "QC & Revisions", Icon: Settings },
    // { href: "/admin/anr/projects", label: "Projects", Icon: Layout },
    { href: "/admin/projects", label: "Projects", Icon: Clipboard },
  ],
  composer: [
    { href: "/admin/projects", label: "Projects", Icon: Clipboard },
    // { href: "/admin/composer/assigned", label: "Assigned Tracks", Icon: Music },
    // { href: "/admin/composer/drafts", label: "Drafts", Icon: FileText },
    // { href: "/admin/composer/uploads", label: "Uploads", Icon: BookOpen },
  ],
  producer: [
    { href: "/admin/projects", label: "Projects", Icon: Clipboard },
    // { href: "/admin/producer/board", label: "Production Board", Icon: BarChart3 },
    // { href: "/admin/producer/sessions", label: "Sessions", Icon: Calendar },
    // { href: "/admin/producer/deliverables", label: "Deliverables", Icon: FileText },
  ],
  engineer: [
    { href: "/admin/projects", label: "Projects", Icon: Clipboard },
    // { href: "/admin/engineer/queue", label: "Mix/Master Queue", Icon: Headphones },
    // { href: "/admin/engineer/sessions", label: "Sessions", Icon: Mic2 },
    // { href: "/admin/engineer/renders", label: "Renders", Icon: FileText },
  ],
  publisher: [
    { href: "/admin/projects", label: "Projects", Icon: Clipboard },
    // { href: "/admin/engineer/queue", label: "Mix/Master Queue", Icon: Headphones },
    // { href: "/admin/engineer/sessions", label: "Sessions", Icon: Mic2 },
    // { href: "/admin/engineer/renders", label: "Renders", Icon: FileText },
  ],
  client: [
    { href: "/admin/projects", label: "Projects", Icon: Clipboard },
    // { href: "/client/dashboard/", label: "Dashboard", Icon: Layout },
    // { href: "/client/projects/", label: "Projects", Icon: Clipboard },
    // { href: "/client/invoices/", label: "Invoices", Icon: FileText },
  ]
} as const;

/** ------------------------------------------------------------------
 * Utils
 * ------------------------------------------------------------------ */

const normalizeRole = (role: UserRole): UserRole => (String(role).replace(/-/g, "_") as UserRole);

const isActive = (pathname: string, href: string): boolean =>
  pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

// Color schemes untuk setiap halaman
const getPageColorScheme = (pathname: string) => {
  if (pathname.includes("/dashboard")) {
    return {
      primary: "blue",
      gradient: "from-blue-900 via-blue-800 to-indigo-900",
      accent: "blue-400",
      activeFrom: "blue-600",
      activeTo: "indigo-600"
    };
  } else if (pathname.includes("/projects")) {
    return {
      primary: "purple", 
      gradient: "from-slate-900 via-slate-800 to-purple-900",
      accent: "purple-400",
      activeFrom: "purple-600", 
      activeTo: "violet-600"
    };
  } else if (pathname.includes("/invoices")) {
    return {
      primary: "green",
      gradient: "from-slate-900 via-emerald-900 to-green-900", 
      accent: "green-400",
      activeFrom: "green-600",
      activeTo: "emerald-600"
    };
  } else if (pathname.includes("/meetings")) {
    return {
      primary: "orange",
      gradient: "from-slate-900 via-orange-900 to-amber-900",
      accent: "orange-400", 
      activeFrom: "orange-600",
      activeTo: "amber-600"
    };
  } else if (pathname.includes("/publishing")) {
    return {
      primary: "teal",
      gradient: "from-slate-900 via-teal-900 to-cyan-900",
      accent: "teal-400",
      activeFrom: "teal-600", 
      activeTo: "cyan-600"
    };
  } else if (pathname.includes("/users")) {
    return {
      primary: "rose",
      gradient: "from-slate-900 via-rose-900 to-pink-900",
      accent: "rose-400",
      activeFrom: "rose-600",
      activeTo: "pink-600"
    };
  }
  
  // Default purple scheme
  return {
    primary: "purple",
    gradient: "from-slate-900 via-slate-800 to-blue-900", 
    accent: "purple-400",
    activeFrom: "blue-600",
    activeTo: "purple-600"
  };
};

/** ------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------ */

export default function SidebarSection({ role, isOpen = true, onClose }: Props): React.JSX.Element {
  const pathname = usePathname();
  const normalizedRole = normalizeRole(role);
  const items = normalizedRole === "guest" 
    ? [] 
    : MENU[normalizedRole] ?? MENU.admin ?? [];
  const colorScheme = getPageColorScheme(pathname ?? "");
  
  // State for UserMenu
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileProfileButtonRef = useRef<HTMLButtonElement>(null);
  // Focusable keyboard nav (ArrowUp/Down, Home/End)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  const setRef = useCallback((el: HTMLAnchorElement | null, idx: number) => {
    linkRefs.current[idx] = el;
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const refs = linkRefs.current.filter(Boolean) as HTMLAnchorElement[];
    if (refs.length === 0) return;

    const currentIndex = refs.findIndex((r) => r === document.activeElement);

    const move = (index: number) => {
      const clamped = Math.max(0, Math.min(refs.length - 1, index));
      refs[clamped]?.focus();
    };

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(currentIndex < 0 ? 0 : currentIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(currentIndex <= 0 ? 0 : currentIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        move(0);
        break;
      case "End":
        e.preventDefault();
        move(refs.length - 1);
        break;
    }
  }, []);
  
  // Load profile data
  const { profile, loading: profileLoading } = useProfile();
  
  // Subtle entrance animation once per mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Calculate dropdown position
  const calculateDropdownPosition = useCallback(() => {
    
    const buttonRef = profileButtonRef.current || mobileProfileButtonRef.current;
    if (buttonRef) {
      const rect = buttonRef.getBoundingClientRect();
      const dropdownHeight = 320;
      const gap = 8;
      const viewportHeight = window.innerHeight;
      
      // Check if this is mobile by checking which ref is being used
      const isMobile = buttonRef === mobileProfileButtonRef.current;
      
      if (isMobile) {
        // For mobile, position dropdown below the button to avoid going off-screen
        setDropdownPosition({
          top: rect.bottom + gap,
          left: Math.max(16, rect.left), // Ensure minimum 16px from left edge
        });
      } else {
        // Desktop positioning - above the button
        const topPosition = rect.top - dropdownHeight - gap;
        
        setDropdownPosition({
          top: topPosition < 0 ? rect.bottom + gap : topPosition, // Fallback if too high
          left: rect.left,
        });
      }
    }
  }, []);
  
  // Handle profile button click
  const handleProfileClick = useCallback(() => {
    if (!showUserMenu) {
      calculateDropdownPosition();
    }
    setShowUserMenu(!showUserMenu);
  }, [showUserMenu, calculateDropdownPosition]);

  // Recalculate position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (showUserMenu) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showUserMenu, calculateDropdownPosition]);
  
  // Debug logging
  useEffect(() => {
    console.log('[SidebarSection] role =', role, 'normalizedRole =', normalizedRole);
    console.log('[SidebarSection] items.length =', items.length);
    console.log('[SidebarSection] isOpen =', isOpen);
    console.log('[SidebarSection] profile =', profile);
  }, [role, normalizedRole, items.length, isOpen, profile]);
  
  if (normalizedRole === "guest") {
    console.log('[SidebarSection] Returning empty for guest role');
    return <></>; // atau return null
  }

  /** Render */
  return (
    <>
      {/* Desktop Sidebar - Always visible on lg+ screens */}
      <aside
        data-sidebar
        className="hidden lg:block fixed top-0 left-0 z-10 h-dvh w-72 flex flex-col shrink-0 border-r border-slate-600 dark:border-slate-500 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-800 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900 shadow-xl dark:shadow-slate-800/25"
        aria-label="Sidebar"
      >
      {/* Animated background pattern */}
      <motion.div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ duration: 2 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br  from-blue-600/10 via-transparent to-indigo-600/10" />
        <motion.div 
          className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br  from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-10 w-24 h-24 bg-gradient-to-br  from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
      </motion.div>

      {/* Header / Brand */}
      <motion.div 
        className="relative px-7 pt-6 pb-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4">
          <motion.div 
            className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg dark:shadow-slate-800/25 overflow-hidden"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            {/* Animated background overlay */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
            />
            <Layout className="relative block overflow-visible text-white z-10" size={20} aria-hidden="true" />
          </motion.div>
          <div className="min-w-0 space-y-1.5">
            <motion.div
              className="capitalize text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-300 dark:to-violet-300 bg-clip-text text-transparent leading-tight"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="inline-flex flex-col items-end justify-center relative flex-[0_0_auto]">
                <div 
                  className="relative w-fit mt-[-1.00px] font-heading-4 font-[number:var(--heading-4-font-weight)] text-gray-800 dark:text-gray-100 dark:text-gray-100 text-[length:var(--heading-4-font-size)] tracking-[var(--heading-4-letter-spacing)] leading-[var(--heading-4-line-height)] whitespace-nowrap [font-style:var(--heading-4-font-style)]">
                  Flemmo Music
                </div>

                <div 
                  className="relative w-fit -mt-1 font-body-XS font-[number:var(--body-XS-font-weight)] text-neutral-600 dark:text-neutral-200 dark:text-gray-200 text-[length:var(--body-XS-font-size)] tracking-[var(--body-XS-letter-spacing)] leading-[var(--body-XS-line-height)] whitespace-nowrap [font-style:var(--body-XS-font-style)]">
                Global Industry Hub
                </div>
              </div>
            </motion.div>
            {/* <motion.div 
              className="text-xs text-slate-300 dark:text-slate-300 font-medium leading-relaxed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Role: <span className="capitalize text-white dark:text-white font-semibold ml-1">{String(normalizedRole).replace(/_/g, " ")}</span>
            </motion.div> */}
          </div>
        </div>
        {/* Accent underline */}
        <motion.div 
          className="pointer-events-none absolute inset-x-7 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />
      </motion.div>

      {/* Nav list */}
      <nav
        ref={containerRef}
        onKeyDown={onKeyDown}
        className="relative flex flex-col flex-1 min-h-0 gap-2 overflow-y-auto px-6 py-6 pb-28"
      >
        {/* Navigation background overlay */}
        {/* <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/20 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
        /> */}
        
        <div className="relative z-10">
          <AnimatePresence initial={false}>
            {mounted && (
              <motion.ul
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 24,
                  delay: 0.4,
                  staggerChildren: 0.1
                }}
                className="space-y-2"
                role="list"
              >
                {items.length > 0 ? (
                  items.map((n, idx) => {
                    const active = isActive(pathname ?? "", n.href);
                    const Icon = n.Icon;
                    return (
                      <li key={n.href} className="relative overflow-visible">
                        {active && (
                          <motion.span
                            layoutId="active-indicator"
                            className="absolute inset-y-0 my-2 -left-2 w-1.5 rounded-full bg-gradient-to-br from-purple-600 via-violet-500 to-purple-700 shadow dark:shadow-slate-800/25 dark:shadow-lg z-20"
                            aria-hidden="true"
                            initial={{ scaleY: 0, opacity: 0 }}
                            animate={{ scaleY: 1, opacity: 1 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          />
                        )}
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1, duration: 0.5 }}
                          whileHover={{ x: 4 }}
                        >
                          <Link
                            ref={(el) => setRef(el, idx)}
                            href={n.href}
                            aria-current={active ? "page" : undefined}
                            title={n.label}
                            className={[
                              "group relative z-10 flex items-center gap-4 rounded-xl px-4 py-3 text-sm outline-none transition-all duration-300 overflow-hidden",
                              active
                                ? "bg-gradient-to-r from-purple-900 to-indigo-600 text-purple-50 font-medium shadow-lg shadow-purple-500/20"
                                : "text-white dark:text-white hover:bg-slate-700/40 hover:text-white focus:bg-slate-50 focus:shadow-lg focus:shadow-purple-500/15 dark:bg-slate-800 hover:shadow-sm",
                            ].join(" ")}
                          >
                            {/* Hover background effect */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            />
                            
                            <motion.span
                              className={[
                                "relative grid h-9 w-9 place-items-center rounded-lg transition-all duration-300 overflow-hidden",
                                active 
                                  ? "bg-gradient-to-br from-blue-600 to-purple-600 text-sky-600 dark:text-sky-200 shadow-md dark:shadow-slate-800/25" 
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-100 dark:text-slate-400 group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-purple-600 group-hover:text-sky-200 dark:text-sky-200 group-hover:shadow dark:shadow-slate-800/25",
                              ].join(" ")}
                              whileHover={{ scale: 1.05, rotate: 2 }}
                              transition={{ duration: 0.2 }}
                            >
                              {/* Icon background shimmer effect */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-br from-transparent to-purple-600 opacity-0 group-hover:opacity-100"
                                initial={{ x: -100 }}
                                whileHover={{ x: 100 }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                              />
                              <Icon className="relative block overflow-visible z-10 w-4 h-4" aria-hidden="true" />
                            </motion.span>
                            <motion.span 
                              className="relative truncate font-medium text-sm leading-relaxed"
                              initial={{ opacity: 0.8 }}
                              whileHover={{ opacity: 1 }}
                            >
                              {n.label}
                            </motion.span>
                          </Link>
                        </motion.div>
                      </li>
                    );
                  })
                ) : (
                  <li>
                    <div className="rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">No menu for your role.</div>
                  </li>
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Quick Actions */}
        <motion.div 
          className="mt-6 mx-2 rounded-xl border border-purple-400/30 dark:border-purple-500/40 bg-gradient-to-br from-slate-800/90 via-purple-900/20 to-violet-900/30 backdrop-blur-sm p-5 shadow-lg dark:shadow-purple-900/25"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <motion.div 
            className="text-xs font-semibold uppercase tracking-wider text-purple-300 dark:text-purple-200 mb-4 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full shadow-sm shadow-purple-400/50"></div>
            Quick Actions
          </motion.div>
          <div className="space-y-3">
            <QuickButton href="/admin/projects?new=1" label="New Project" Icon={Clipboard} />
            <QuickButton href="/admin/meetings?new=1" label="New Meeting" Icon={Calendar} />
          </div>
        </motion.div>

        {/* User Controls Footer */}
        <motion.div 
          className="mt-4 mx-2 rounded-full border border-teal-400/40 dark:border-cyan-300/50 bg-gradient-to-br from-teal-800/90 to-cyan-800/90 backdrop-blur-sm px-3 py-1.5 shadow-lg shadow-teal-500/20 dark:shadow-cyan-900/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <div className="flex items-center justify-center">
            {/* Profile Picture - Opens UserMenu - Centered */}
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <button
                ref={profileButtonRef}
                onClick={handleProfileClick}
                className="group relative flex items-center gap-3 rounded-full px-1.5 py-1 w-full hover:bg-teal-600/30 hover:border-cyan-400/60 transition-all duration-200 border border-transparent"
              >
                <div className="flex-shrink-0">
                  <ProfileAvatar
                    avatarUrl={profile?.avatarUrl}
                    fullName={profile?.fullName}
                    size="md"
                    animate
                    showFallback={!profileLoading}
                  />
                </div>
                <span className="text-sm font-medium text-slate-200 dark:text-slate-200 group-hover:text-white flex-1 truncate">
                  {profileLoading ? "Loading..." : (profile?.fullName || "Profile")}
                </span>
              </button>
              
              {/* UserMenu positioned above the button */}
              {showUserMenu && (
                <Portal>
                  <div 
                    className="fixed z-[9999]"
                    style={{ 
                      top: `${dropdownPosition.top}px`, 
                      left: `${dropdownPosition.left}px`,
                      pointerEvents: 'auto'
                    }}
                  >
                    <UserDropdown 
                      isOpen={showUserMenu}
                      onClose={() => setShowUserMenu(false)}
                    />
                  </div>
                </Portal>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Settings Gear Icon - Below User Controls */}
        <motion.div 
          className="mt-3 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href="/profile/settings"
              className="group relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-slate-600/80 to-slate-700/80 border border-slate-500/50 hover:from-purple-600/80 hover:to-violet-600/80 hover:border-purple-400/60 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 backdrop-blur-sm"
              title="User Settings"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-violet-400/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
              <Settings className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors duration-200 relative z-10" />
            </Link>
          </motion.div>
        </motion.div>
      </nav>
    </aside>

    {/* Mobile Sidebar */}
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          data-sidebar
          className="lg:hidden fixed top-16 left-0 z-50 h-[calc(100svh-4rem)] w-80 max-w-[90vw] border-r border-slate-600 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-800 shadow-2xl"
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          exit={{ x: -320 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          aria-label="Mobile admin sidebar"
        >
          {/* Mobile Sidebar Content - Same as Desktop */}
          {/* Animated background pattern */}
          <motion.div 
            className="absolute inset-0 opacity-5 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.05 }}
            transition={{ duration: 2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10" />
            <motion.div 
              className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 20, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
            <motion.div 
              className="absolute bottom-20 left-10 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
              animate={{ 
                scale: [1.2, 1, 1.2],
                rotate: [360, 180, 0]
              }}
              transition={{ 
                duration: 15, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          </motion.div>

          {/* Mobile Header */}
          {/* <motion.div 
            className="relative px-7 pt-6 pb-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex items-center gap-4"> */}
              {/* <motion.div 
                className="relative grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg dark:shadow-slate-800/25 overflow-hidden"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.2 }}
              > */}
                {/* <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                />
                <Layout className="relative block overflow-visible text-white z-10" size={20} aria-hidden="true" />
              </motion.div> */}
              {/* <div className="min-w-0 space-y-1.5"> */}
                {/* <motion.div 
                  className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-300 dark:to-violet-300 bg-clip-text text-transparent leading-tight"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {/* Admin Panel */}
                  {/* <div className="inline-flex flex-col items-end justify-center relative flex-[0_0_auto]">
                    <div 
                      className="relative w-fit mt-[-1.00px] font-heading-4 font-[number:var(--heading-4-font-weight)] text-gray-800 dark:text-gray-100 dark:text-gray-100 text-[length:var(--heading-4-font-size)] tracking-[var(--heading-4-letter-spacing)] leading-[var(--heading-4-line-height)] whitespace-nowrap [font-style:var(--heading-4-font-style)]">
                      Flemmo Music
                    </div>

                    <div 
                      className="relative w-fit -mt-1 font-body-XS font-[number:var(--body-XS-font-weight)] text-neutral-600 dark:text-neutral-200 dark:text-gray-200 text-[length:var(--body-XS-font-size)] tracking-[var(--body-XS-letter-spacing)] leading-[var(--body-XS-line-height)] whitespace-nowrap [font-style:var(--body-XS-font-style)]">
                    Global Industry Hub
                    </div>
                  </div> */}
                {/* </motion.div> */}
                {/* <motion.div 
                  className="text-xs text-slate-300 dark:text-slate-300 font-medium leading-relaxed"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  Role: <span className="capitalize text-white dark:text-white font-semibold ml-1">{String(normalizedRole).replace(/_/g, " ")}</span>
                </motion.div> */}
              {/* </div>
            </div> */}
            {/* <motion.div 
              className="pointer-events-none absolute inset-x-7 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            /> */}
          {/* </motion.div> */}

          {/* Mobile Nav */}
          <nav
            className="relative flex h-[calc(100%-180px)] flex-col gap-2 overflow-y-auto px-6 py-6"
          >
            <div className="relative z-10">
              <AnimatePresence initial={false}>
                {mounted && (
                  <motion.ul
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 24,
                      delay: 0.4,
                      staggerChildren: 0.1
                    }}
                    className="space-y-3"
                    role="list"
                  >
                    {items.length > 0 ? (
                      items.map((n, idx) => {
                        const active = isActive(pathname ?? "", n.href);
                        const Icon = n.Icon;
                        return (
                          <li key={n.href} className="relative overflow-visible">
                            {active && (
                              <motion.span
                                layoutId="mobile-active-indicator"
                                className="absolute inset-y-0 my-2 -left-2 w-1.5 rounded-full bg-gradient-to-br from-purple-600 via-violet-500 to-purple-700 shadow dark:shadow-slate-800/25 dark:shadow-lg z-20"
                                aria-hidden="true"
                                initial={{ scaleY: 0, opacity: 0 }}
                                animate={{ scaleY: 1, opacity: 1 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                              />
                            )}
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1, duration: 0.5 }}
                              whileHover={{ x: 4 }}
                            >
                              <Link
                                href={n.href}
                                onClick={onClose}
                                aria-current={active ? "page" : undefined}
                                title={n.label}
                                className={[
                                  "group relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 pl-4 text-sm outline-none transition-all duration-300 overflow-hidden",
                                  active
                                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-purple-50 font-medium shadow-lg shadow-purple-500/20"
                                    : "text-white dark:text-white hover:bg-slate-700/40 hover:text-white focus:bg-slate-50 focus:shadow-lg focus:shadow-purple-500/15 dark:bg-slate-800 hover:shadow-sm",
                                ].join(" ")}
                              >
                                <motion.span
                                  className={[
                                    "relative grid h-8 w-8 place-items-center rounded-lg transition-all duration-300 overflow-hidden",
                                    active 
                                      ? "bg-gradient-to-br from-blue-600 to-purple-600 text-sky-600 dark:text-sky-200 shadow dark:shadow-slate-800/25" 
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-100 dark:text-slate-400 group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-purple-600 group-hover:text-sky-200 dark:text-sky-200 group-hover:shadow dark:shadow-slate-800/25",
                                  ].join(" ")}
                                  whileHover={{ scale: 1.05, rotate: 2 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Icon className="relative block overflow-visible z-10 w-4 h-4" aria-hidden="true" />
                                </motion.span>
                                <motion.span 
                                  className="relative truncate font-medium"
                                  initial={{ opacity: 0.8 }}
                                  whileHover={{ opacity: 1 }}
                                >
                                  {n.label}
                                </motion.span>
                              </Link>
                            </motion.div>
                          </li>
                        );
                      })
                    ) : (
                      <li>
                        <div className="rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No menu for your role.</div>
                      </li>
                    )}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile User Controls Footer */}
            <motion.div 
              className="mt-4 mx-2 mb-4 rounded-full border border-teal-400/40 dark:border-cyan-300/50 bg-gradient-to-br from-teal-800/90 to-cyan-800/90 backdrop-blur-sm px-3 py-1.5 shadow-lg shadow-teal-500/20 dark:shadow-cyan-900/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <div className="flex items-center justify-center">
                {/* Profile Picture - Opens UserMenu - Centered */}
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    ref={mobileProfileButtonRef}
                    onClick={handleProfileClick}
                    className="group relative flex items-center gap-3 rounded-full px-1.5 py-1 w-full hover:bg-teal-600/30 hover:border-cyan-400/60 transition-all duration-200 border border-transparent"
                  >
                    <div className="flex-shrink-0">
                      <ProfileAvatar
                        avatarUrl={profile?.avatarUrl}
                        fullName={profile?.fullName}
                        size="md"
                        animate
                        showFallback={!profileLoading}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-200 dark:text-slate-200 group-hover:text-white flex-1 truncate">
                      {profileLoading ? "Loading..." : (profile?.fullName || "Profile")}
                    </span>
                  </button>
                  
                  {/* UserMenu positioned with Portal for mobile */}
                  {showUserMenu && (
                    <Portal>
                      <div 
                        className="fixed z-[9999]"
                        style={{ 
                          top: `${dropdownPosition.top}px`, 
                          left: `${dropdownPosition.left}px`,
                          pointerEvents: 'auto'
                        }}
                      >
                        <UserDropdown 
                          isOpen={showUserMenu}
                          onClose={() => setShowUserMenu(false)}
                        />
                      </div>
                    </Portal>
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* Settings Gear Icon - Below User Controls (Mobile) */}
            <motion.div 
              className="mb-4 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href="/profile/settings"
                  onClick={onClose}
                  className="group relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-slate-600/80 to-slate-700/80 border border-slate-500/50 hover:from-purple-600/80 hover:to-violet-600/80 hover:border-purple-400/60 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 backdrop-blur-sm"
                  title="User Settings"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-violet-400/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <Settings className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors duration-200 relative z-10" />
                </Link>
              </motion.div>
            </motion.div>
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
    </>
  );
}

/** ------------------------------------------------------------------
 * Quick Button
 * ------------------------------------------------------------------ */

function QuickButton({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}): React.JSX.Element {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={href}
        className="group relative flex items-center gap-3 rounded-xl border border-purple-300/40 dark:border-purple-400/50 bg-gradient-to-r from-purple-800/60 via-violet-800/50 to-purple-900/60 backdrop-blur-md px-4 py-3 text-sm font-semibold text-purple-100 shadow-lg hover:shadow-xl dark:shadow-purple-900/30 transition-all duration-300 hover:border-purple-200/60 hover:from-purple-700/70 hover:via-violet-700/60 hover:to-purple-800/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 overflow-hidden"
      >
        {/* Animated background overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-400/10 via-violet-400/15 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          initial={{ x: -100 }}
          whileHover={{ x: 100 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        
        {/* Icon container */}
        <motion.div 
          className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-purple-500/90 to-violet-600/90 shadow-md group-hover:shadow-lg group-hover:shadow-purple-400/30"
          whileHover={{ rotate: 5, scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          {/* Icon shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 rounded-lg"
            initial={{ x: -20 }}
            whileHover={{ x: 20 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
          <Icon className="relative w-4 h-4 text-purple-50 z-10" aria-hidden="true" />
        </motion.div>
        
        {/* Label */}
        <motion.span 
          className="relative truncate font-medium tracking-wide"
          initial={{ opacity: 0.9 }}
          whileHover={{ opacity: 1 }}
        >
          {label}
        </motion.span>

        {/* Hover arrow */}
        <motion.div
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ x: -10 }}
          whileHover={{ x: 0 }}
        >
          <div className="w-4 h-4 text-purple-200 group-hover:text-white">
            →
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
