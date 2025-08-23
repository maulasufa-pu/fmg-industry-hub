"use client";

import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Wand2,
  Users2,
  Cpu,
  BookOpen,
  GraduationCap,
  Film,
  PartyPopper,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Image from "next/image";
import UserDropdown from "../pop_over/user_dropdown";
import { useProfile } from "@/hooks/useProfile";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import Portal from "@/components/ui/Portal";

/*********************************
 * Types & Menu Data
 *********************************/
 type MenuItem = {
  label: string;
  href: string;
  desc: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const MENU: readonly MenuItem[] = [
  { label: "Creative", href: "/creative", desc: "Production, mixing, mastering, sound design.", Icon: Wand2 },
  { label: "Talent", href: "/talent", desc: "Scouting, A&R, artist development & management.", Icon: Users2 },
  { label: "Labs (AI/tuneXpert)", href: "/labs", desc: "R&D, AI tools, workflow acceleration.", Icon: Cpu },
  { label: "Publishing", href: "/publishing", desc: "Rights admin, licensing & royalty tracking.", Icon: BookOpen },
  { label: "Academy", href: "/academy", desc: "Workshops, mentorships, career pathways.", Icon: GraduationCap },
  { label: "Media", href: "/media", desc: "Content, MV, promos & PR distribution.", Icon: Film },
  { label: "Event & Festival", href: "/event", desc: "Showcases, tours, venue & brand collabs.", Icon: PartyPopper },
];

/*********************************
 * Animations
 *********************************/
const panel: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.98, pointerEvents: "none" as const },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    pointerEvents: "auto" as const,
    transition: { duration: 0.18, ease: "easeOut", when: "beforeChildren", staggerChildren: 0.035 },
  },
  exit: { opacity: 0, y: -6, scale: 0.985, transition: { duration: 0.12 } },
};
const item: Variants = { hidden: { opacity: 0, y: -6 }, show: { opacity: 1, y: 0 } };

// Mobile sheet animations
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};
const sheetVariants: Variants = {
  hidden: { y: -24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "tween", duration: 0.22 } },
  exit: { y: -16, opacity: 0, transition: { duration: 0.15 } },
};

type BrandLockupProps = {
  title: string;
  subtitle: string;
  className?: string;
  // basis + batas agar tetap terbaca di layar kecil/besar
  subtitleBasePx?: number; // default 14
  subtitleMinPx?: number;  // default 10
  subtitleMaxPx?: number;  // default 48
};

export function BrandLockup({
  title,
  subtitle,
  className = "",
  subtitleBasePx = 14,
  subtitleMinPx = 10,
  subtitleMaxPx = 48,
}: BrandLockupProps): React.JSX.Element {
  const titleRef = React.useRef<HTMLDivElement | null>(null);
  const measureRef = React.useRef<HTMLDivElement | null>(null);
  const [subSize, setSubSize] = React.useState<number | null>(null);

  const recalc = React.useCallback(() => {
    const t = titleRef.current;
    const m = measureRef.current;
    if (!t || !m) return;

    const target = t.getBoundingClientRect().width;
    m.style.fontSize = `${subtitleBasePx}px`; // ukuran basis pengukuran
    const natural = m.getBoundingClientRect().width;

    if (target > 0 && natural > 0) {
      const next = Math.min(
        subtitleMaxPx,
        Math.max(subtitleMinPx, (target / natural) * subtitleBasePx)
      );
      setSubSize(next);
    }
  }, [subtitleBasePx, subtitleMinPx, subtitleMaxPx]);

  React.useLayoutEffect(() => {
    recalc();
    const obs = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => recalc()) : null;
    if (obs && titleRef.current) obs.observe(titleRef.current);
    // Recalc setelah font siap
    document.fonts?.ready?.then?.(() => recalc());
    const onResize = () => recalc();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      obs?.disconnect();
    };
  }, [recalc]);

  // CSS var utk font-size subtitle (supaya bisa !important)
  type VarStyle = React.CSSProperties & { ['--sub-fs']?: string };
  const subStyle: VarStyle = {
    ['--sub-fs']: subSize ? `${subSize}px` : undefined,
    opacity: subSize ? 1 : 0,
  };

  return (
    <div className={`relative ${className}`}>
      {/* Judul (nowrap supaya lebarnya pasti) */}
      <div
        ref={titleRef}
        className="font-heading-1 leading-none text-gray-800 dark:text-gray-100 whitespace-nowrap"
      >
        {title}
      </div>

      {/* Elemen ukur (invisible tapi tetap layout) */}
      <div
        ref={measureRef}
        className="absolute -z-10 invisible pointer-events-none select-none whitespace-nowrap font-body-XS"
      >
        {subtitle}
      </div>

      {/* Subtitle tampil, ukuran pakai CSS var + !important */}
      <div
        className="-mt-1 font-body-XS leading-none text-neutral-600 dark:text-neutral-300 py-0.5 whitespace-nowrap brand-subtitle"
        style={subStyle}
      >
        {subtitle}
      </div>

      {/* Aturan local untuk override !important dari util kelas */}
      <style jsx>{`
        .brand-subtitle {
          font-size: var(--sub-fs, 12px) !important;
        }
      `}</style>
    </div>
  );
}


/*********************************
 * Component
 *********************************/
export const HeaderSection = (): React.JSX.Element => {
  const [open, setOpen] = React.useState(false); // desktop mega menu
  const [focusIndex, setFocusIndex] = React.useState<number>(-1);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const itemRefs = React.useRef<Array<HTMLAnchorElement | null>>([]);

  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);
  const mobilePanelRef = React.useRef<HTMLDivElement | null>(null);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileProfileButtonRef = useRef<HTMLButtonElement>(null);
  // Focusable keyboard nav (ArrowUp/Down, Home/End)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  // Load profile data
  const { profile, loading: profileLoading } = useProfile();

  const setItemRef =
    (idx: number) =>
    (el: HTMLAnchorElement | null): void => {
      itemRefs.current[idx] = el;
    };

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
          left: rect.left-160,
        });
      }
    }
  }, []);
  
  const handleProfileClick = useCallback(() => {
      if (!showUserMenu) {
        calculateDropdownPosition();
      }
      setShowUserMenu(!showUserMenu);
    }, [showUserMenu, calculateDropdownPosition]);
  // Close on click-outside & Esc & resize (desktop mega menu)
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setFocusIndex(-1);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setFocusIndex(-1);
        triggerRef.current?.focus();
      }
    };
    const onResize = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Focus the hovered/arrowed item (desktop)
  React.useEffect(() => {
    if (!open) return;
    if (focusIndex >= 0) itemRefs.current[focusIndex]?.focus();
  }, [focusIndex, open]);

  // Keyboard handling on trigger (desktop)
  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      setFocusIndex(0);
    }
  };

  // Roving tabindex in menu (desktop)
  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIndex((i) => Math.min(i + 1, MENU.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusIndex(MENU.length - 1);
    } else if (e.key === "Tab") {
      // close if focus leaves panel
      setTimeout(() => {
        const active = document.activeElement;
        const inside = menuRef.current?.contains(active) || triggerRef.current === active;
        if (!inside) setOpen(false);
      }, 0);
    }
  };

  // Mobile: lock scroll & focus the panel on open
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      // focus first focusable element inside panel
      setTimeout(() => mobilePanelRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Mobile: close on ESC
  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Mobile: rudimentary focus trap inside the panel
  const onMobileKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const focusables = mobilePanelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex="0"]'
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <nav
      className="
        sticky top-0 inset-x-0 z-50
        border-b border-black/5 dark:border-white/10
        bg-white/30 dark:bg-black/25
        backdrop-blur-xl
        supports-[backdrop-filter]:bg-white/20
        dark:supports-[backdrop-filter]:bg-black/20
      "
    >
      <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* Left: Brand */}
        {/* <Link href="/" className="flex items-center gap-2 font-semibold"> */}
          {/* <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-600 to-fuchsia-600" /> */}
          {/* <div className="inline-flex flex-col items-start justify-center">
            <div className="font-heading-1 text-gray-800 dark:text-gray-100">Flemmo Music</div>
            <div className="-mt-1 font-body-XS text-neutral-600 dark:text-neutral-300">Global Universe Solution</div>
          </div> */}
          {/* <BrandLockup
            title="Flemmo Music"
            subtitle="Global Universe Solution"
            subtitleBasePx={1}   // ukuran basis perhitungan
            subtitleMinPx={1}    // batas minimum
            subtitleMaxPx={20}    // batas maksimum
          /> */}
        {/* </Link> */}
        <Link href="/" className="flex items-center gap-0.5 font-semibold">
          {/* Logo ganti div jadi Image */}
          <Image
            src="/logo/FMG-Universe-Flemmo-Music-Global.png"   // path relatif dari /public
            alt="FMG Universe Logo"
            width={100}                     // sama dengan h-6 (6*4px)
            height={100}
            className="h-10 w-10 rounded-md object-cover"
            priority
          />

          <BrandLockup
            title="Flemmo Music"
            subtitle="Global Universe Solution"
            subtitleBasePx={1}
            subtitleMinPx={1}
            subtitleMaxPx={20}
          />
        </Link>

        {/* Center: Nav (desktop only) */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:flex items-center gap-6 text-sm z-10">
          <Link href="/#about" className="opacity-80 hover:opacity-100">
            About
          </Link>
          <Link href="/#features" className="opacity-80 hover:opacity-100">
            Services
          </Link>
          <Link href="/#pricing" className="opacity-80 hover:opacity-100">
            Packages
          </Link>

          {/* Desktop Mega Menu */}
          <div className="relative" ref={menuRef}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => {
                setOpen((v) => !v);
                setFocusIndex((v) => (v < 0 ? 0 : v));
              }}
              onKeyDown={onTriggerKeyDown}
              aria-haspopup="menu"
              aria-expanded={open}
              className="
                inline-flex items-center gap-1 rounded-xl px-3 py-1.5
                opacity-90 hover:opacity-100
                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 dark:focus-visible:ring-indigo-300/40
                transition
              "
            >
              Menu
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  key="menu"
                  variants={panel}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  onKeyDown={onMenuKeyDown}
                  role="menu"
                  aria-label="FMG Sections"
                  className="
                    fixed top-16 left-1/2 z-[60]
                    w-[520px] max-w-[calc(100vw-1rem)] -translate-x-1/2 mx-2 sm:mx-0
                    rounded-2xl ring-1 ring-white/80 dark:ring-black/90
                    overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)]
                    bg-white/100 dark:bg-black/100
                  "
                >
                  {/* CONTENT */}
                  <div className="relative z-10 p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {MENU.map((m, idx) => (
                        <motion.div key={m.label} variants={item}>
                          <Link
                            ref={setItemRef(idx)}
                            href={m.href}
                            role="menuitem"
                            tabIndex={-1}
                            onClick={() => {
                              setOpen(false);
                              setFocusIndex(-1);
                            }}
                            className="
                              group relative flex items-center gap-4 rounded-2xl p-3
                              ring-1 ring-black/10 dark:ring-white/10
                              bg-white/65 dark:bg-white/[0.04]
                              hover:bg-white/75 dark:hover:bg-white/[0.06]
                              transition
                              shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]
                              dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
                              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40
                              after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl
                              after:bg-gradient-to-br after:from-white/40 after:to-transparent
                              after:opacity-0 group-hover:after:opacity-100 after:transition-opacity
                            "
                          >
                            {/* Icon */}
                            <div
                              className="
                                flex-shrink-0 grid size-11 place-items-center rounded-xl
                                bg-gradient-to-br from-indigo-600 to-violet-600
                                text-white
                                border border-white/30 dark:border-white/10
                                shadow-[0_6px_18px_rgba(79,70,229,0.35)]
                              "
                            >
                              <m.Icon className="h-5 w-5" />
                            </div>

                            {/* Text */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-black/90 dark:text-white/90">{m.label}</span>
                                <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0" />
                              </div>
                              <p className="mt-0.5 text-[12.5px] leading-5 text-neutral-700 dark:text-neutral-300 line-clamp-2">
                                {m.desc}
                              </p>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-1 flex items-center justify-between rounded-xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 px-3 py-2">
                      <span className="text-[12.5px] text-neutral-700 dark:text-neutral-300">
                        “Beyond Sound. Built-in Intelligence.”
                      </span>
                      <Link
                        href="/client/dashboard"
                        className="
                          inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10
                          bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-xs font-semibold
                          hover:opacity-90 transition
                        "
                      >
                        Start Project <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: CTA + Theme (desktop only) */}
        <div className="ml-auto hidden items-center gap-4 sm:flex">
          <Link
            href="/client/dashboard"
            className="
              group relative inline-flex h-11 items-center gap-2 rounded-2xl px-5
              text-sm font-semibold leading-none
              bg-black text-white dark:bg-white dark:text-black
              shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-colors
              hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 hover:text-white
            "
          >
            Start My Project
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100 dark:bg-black/10" />
          </Link>

          <ThemeToggle className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white/60 text-black dark:border-white/10 dark:bg-black/40" />
        </div>
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
              className="group relative flex items-center gap-3 rounded-full px-1.5 py-1 w-full transition-all duration-200 border border-transparent"
            >
              <span className="text-sm font-medium text-black-200 dark:text-slate-200 group-hover:text-black flex-1 truncate">
                  {profileLoading ? "Loading..." : (profile?.fullName || "Profile")}
                </span>
              <div className="flex-shrink-0">
                <ProfileAvatar
                  avatarUrl={profile?.avatarUrl}
                  fullName={profile?.fullName}
                  size="md"
                  animate
                  showFallback={!profileLoading}
                />
              </div>
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

        {/* Right: Mobile controls */}
        <div className="ml-auto flex items-center gap-2 sm:hidden">
          <ThemeToggle className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/60 text-black dark:border-white/10 dark:bg-black/40" />
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu-panel"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.06]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay + sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial="hidden"
              animate="show"
              exit="exit"
              variants={overlayVariants}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/40"
            />

            <motion.div
              key="sheet"
              id="mobile-menu-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile menu"
              tabIndex={0}
              ref={mobilePanelRef}
              initial="hidden"
              animate="show"
              exit="exit"
              variants={sheetVariants}
              onKeyDown={onMobileKeyDown}
              className="fixed z-50 top-16 inset-x-0 rounded-b-3xl border-b border-black/10 dark:border-white/10 bg-white/95 dark:bg-black/90 backdrop-blur-xl"
            >
              <div className="px-4 pt-3 pb-6">
                {/* Top quick links */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <Link href="/#about" onClick={() => setMobileOpen(false)} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] px-3 py-2 text-center">About</Link>
                  <Link href="/#features" onClick={() => setMobileOpen(false)} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] px-3 py-2 text-center">Services</Link>
                  <Link href="/#pricing" onClick={() => setMobileOpen(false)} className="rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/[0.06] px-3 py-2 text-center">Packages</Link>
                </div>

                {/* Sections */}
                <div className="mt-4 divide-y divide-black/5 dark:divide-white/10">
                  <div className="pb-3">
                    <div className="text-xs uppercase tracking-wide text-neutral-600 dark:text-neutral-300 mb-2">FMG Sections</div>
                    <div className="grid grid-cols-1 gap-2">
                      {MENU.map((m) => (
                        <Link
                          key={m.label}
                          href={m.href}
                          onClick={() => setMobileOpen(false)}
                          className="group flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.06] p-3"
                        >
                          <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white border border-white/30 dark:border-white/10">
                            <m.Icon className="h-4 w-4" />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-[15px] font-medium text-black/90 dark:text-white/90">{m.label}</span>
                            <span className="block text-[12.5px] text-neutral-700 dark:text-neutral-300 line-clamp-1">{m.desc}</span>
                          </span>
                          <ArrowRight className="h-4 w-4 opacity-60 group-hover:opacity-100" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3">
                    <Link
                      href="/client/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="
                        mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3
                        text-sm font-semibold leading-none
                        bg-black text-white dark:bg-white dark:text-black
                        shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-colors
                        hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 hover:text-white
                      "
                    >
                      Start My Project
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Tagline */}
                <div className="mt-4 text-center text-[12.5px] text-neutral-700 dark:text-neutral-300">
                  “Beyond Sound. Built-in Intelligence.”
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default HeaderSection;
