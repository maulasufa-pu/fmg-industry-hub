"use client";

import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from "react";
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
  LayoutDashboard,
  Info,
  Package2,
  Briefcase,
  Mail,
  Newspaper,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence, Variants, MotionConfig } from "framer-motion";
import UserDropdown from "../pop_over/user_dropdown";
import { useProfile } from "@/hooks/useProfile";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import Portal from "@/components/ui/Portal";
import { ARRANGEMENT_PORTFOLIO_PATH } from "@/lib/arrangement";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CurrencyDropdownAdvanced } from "@/components/CurrencyDropdownAdvanced";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { localizedPathFor } from "@/i18n/language-routes";
import FmgUniverseLogo from "@/components/brand/FmgUniverseLogo";

type MenuItem = {
  label: string;
  href: string;
  desc: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type UniverseItem = {
  label: string;
  href: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const MENU: readonly MenuItem[] = [
  { label: "Music Arrangement", href: "/arrangement", desc: "Professional arrangement service with a clear order flow.", Icon: Wand2 },
  { label: "Creative", href: "/creative", desc: "Production, mixing, mastering, sound design.", Icon: Wand2 },
  { label: "Talent", href: "/talent", desc: "Scouting, A&R, artist development & management.", Icon: Users2 },
  { label: "Labs (AI/tuneXpert)", href: "/labs", desc: "R&D, AI tools, workflow acceleration.", Icon: Cpu },
  { label: "Publishing", href: "/publishing", desc: "Rights admin, licensing & royalty tracking.", Icon: BookOpen },
  { label: "Academy", href: "/academy", desc: "Workshops, mentorships, career pathways.", Icon: GraduationCap },
  { label: "Media", href: "/media", desc: "Content, MV, promos & PR distribution.", Icon: Film },
  { label: "Event & Festival", href: "/event", desc: "Showcases, tours, venue & brand collabs.", Icon: PartyPopper },
  { label: "Articles", href: "/articles", desc: "Practical insights about songwriting, arrangement, production, and music.", Icon: Newspaper },
];

const UNIVERSE: readonly UniverseItem[] = [
  { label: "Overview", href: "/company", Icon: LayoutDashboard },
  { label: "About", href: "/company#about", Icon: Info },
  { label: "Products", href: "/company#features", Icon: Package2 },
  { label: "Careers", href: "/careers", Icon: Briefcase },
  { label: "Contact", href: "/contact", Icon: Mail },
];

const MENU_ID: Record<string, { label: string; desc: string }> = {
  "/arrangement": { label: "Aransemen Musik", desc: "Jasa aransemen profesional dengan alur order yang jelas." },
  "/creative": { label: "Kreatif", desc: "Produksi, mixing, mastering, dan sound design." },
  "/talent": { label: "Talenta", desc: "Scouting, A&R, pengembangan artis, dan manajemen." },
  "/labs": { label: "Labs (AI/tuneXpert)", desc: "R&D, perangkat AI, dan percepatan workflow." },
  "/publishing": { label: "Publishing", desc: "Administrasi hak, lisensi, dan pelacakan royalti." },
  "/academy": { label: "Akademi", desc: "Workshop, mentoring, dan jalur karier." },
  "/media": { label: "Media", desc: "Konten, video musik, promosi, dan distribusi PR." },
  "/event": { label: "Event & Festival", desc: "Showcase, tur, venue, dan kolaborasi brand." },
  "/articles": { label: "Artikel", desc: "Insight praktis tentang lagu, aransemen, produksi, dan musik." },
};

const UNIVERSE_ID: Record<string, string> = {
  "Overview": "Ringkasan",
  "About": "Tentang",
  "Products": "Produk",
  "Careers": "Karier",
  "Contact": "Kontak",
};

const panel: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 420,
      damping: 32,
      mass: 0.6,
      when: "beforeChildren",
      delayChildren: 0.03,
      staggerChildren: 0.045,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.985,
    transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: -8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 520, damping: 34, mass: 0.5 },
  },
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: "linear" } },
};

const sheetVariants: Variants = {
  hidden: { y: -24, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 460, damping: 36, mass: 0.65 },
  },
  exit: {
    y: -16,
    opacity: 0,
    transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
  },
};

type BrandLockupProps = {
  title: string;
  subtitle: string;
  className?: string;
  subtitleBasePx?: number; 
  subtitleMinPx?: number; 
  subtitleMaxPx?: number; 
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
    m.style.fontSize = `${subtitleBasePx}px`;
    const natural = m.getBoundingClientRect().width;
    if (target > 0 && natural > 0) {
      const next = Math.min(subtitleMaxPx, Math.max(subtitleMinPx, (target / natural) * subtitleBasePx));
      setSubSize(next);
    }
  }, [subtitleBasePx, subtitleMinPx, subtitleMaxPx]);

  React.useLayoutEffect(() => {
    recalc();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => recalc()) : null;
    if (ro && titleRef.current) ro.observe(titleRef.current);
    document.fonts?.ready?.then?.(() => recalc());
    const onResize = () => recalc();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, [recalc]);

  type VarStyle = React.CSSProperties & { ["--sub-fs"]?: string };
  const subStyle: VarStyle = {
    ["--sub-fs"]: subSize ? `${subSize}px` : undefined,
    opacity: subSize ? 1 : 0,
  };

  return (
    <div data-no-translate className={`relative grid content-center ${className}`}>
      <div
        ref={titleRef}
        className="font-heading-1 font-black leading-[1.05] text-gray-800 dark:text-gray-100 whitespace-nowrap"
        style={{ fontWeight: 700 }}
      >
        {title}
      </div>

      <div
        ref={measureRef}
        className="absolute -z-10 invisible pointer-events-none select-none whitespace-nowrap font-body-XS"
      >
        {subtitle}
      </div>

      <div
        className="mt-[-2px] font-body-XS leading-[1] text-slate-600 dark:text-slate-300 whitespace-nowrap brand-subtitle overflow-hidden"
        style={subStyle}
      >
        {subtitle}
      </div>

      <style jsx>{`
        .brand-subtitle {
          font-size: var(--sub-fs, 12px) !important;
        }
      `}</style>
    </div>
  );
}

export const HeaderSection = (): React.JSX.Element => {
  const { currency, setCurrency, loading: currencyLoading } = useCurrency();
  const { language, pick } = useLanguage();
  const localeHref = (href: string) => localizedPathFor(href, language) ?? href;
  const homeHref = language === "id" ? "/id" : "/";
  const menuLabel = (menu: MenuItem) => pick(MENU_ID[menu.href]?.label ?? menu.label, menu.label);
  const menuDescription = (menu: MenuItem) => pick(MENU_ID[menu.href]?.desc ?? menu.desc, menu.desc);
  const universeLabel = (menu: UniverseItem) => pick(UNIVERSE_ID[menu.label] ?? menu.label, menu.label);
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

  const { profile, loading: profileLoading } = useProfile();

  const dropdownWrapperRef = useRef<HTMLDivElement | null>(null);

  const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

  const getActiveProfileButton = () => {
    const candidates = [mobileProfileButtonRef.current, profileButtonRef.current];
    for (const el of candidates) {
      if (el && el.offsetParent !== null) return el;
    }
    return profileButtonRef.current ?? mobileProfileButtonRef.current;
  };

  const calculateDropdownPosition = useCallback(() => {
    const btn = getActiveProfileButton();
    const menuEl = dropdownWrapperRef.current;
    if (!btn) return;

    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const br = btn.getBoundingClientRect();

    const fallbackW = 320;
    const fallbackH = 320;
    const mr = menuEl?.getBoundingClientRect();
    const mw = mr?.width ?? fallbackW;
    const mh = mr?.height ?? fallbackH;

    const isMobile = window.matchMedia("(max-width: 1027px)").matches;

    let top = isMobile ? br.bottom + pad : br.top - mh - pad;
    if (!isMobile && top < pad) top = br.bottom + pad;

    let left = isMobile ? br.left : br.right - mw;

    top = clamp(top, pad, vh - mh - pad);
    left = clamp(left, pad, vw - mw - pad);
    setDropdownPosition({ top: Math.round(top), left: Math.round(left) });
  }, []);

  useLayoutEffect(() => {
    if (!showUserMenu) return;
    const raf = requestAnimationFrame(() => calculateDropdownPosition());
    const onRelayout = () => calculateDropdownPosition();
    window.addEventListener("resize", onRelayout);
    window.addEventListener("scroll", onRelayout, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onRelayout);
      window.removeEventListener("scroll", onRelayout, true);
    };
  }, [showUserMenu, calculateDropdownPosition]);

  const handleProfileClick = useCallback(() => {
    if (!showUserMenu) {
      setShowUserMenu(true);
      setTimeout(() => calculateDropdownPosition(), 0);
    } else {
      setShowUserMenu(false);
    }
  }, [showUserMenu, calculateDropdownPosition]);

  useEffect(() => {
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

  useEffect(() => {
    if (!open) return;
    if (focusIndex >= 0) itemRefs.current[focusIndex]?.focus();
  }, [focusIndex, open]);

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      setFocusIndex(0);
    }
  };

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
      setTimeout(() => {
        const active = document.activeElement;
        const inside = menuRef.current?.contains(active) || triggerRef.current === active;
        if (!inside) setOpen(false);
      }, 0);
    }
  };

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => mobilePanelRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

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
    <MotionConfig reducedMotion="user">
      <nav
        className="sticky top-0 inset-x-0 z-50
        border-b border-black/5 dark:border-white/10
        bg-white/30 dark:bg-black/25
        backdrop-blur-xl
        supports-[backdrop-filter]:bg-white/20
        dark:supports-[backdrop-filter]:bg-black/20
      "
      >
        <div className="relative mx-auto h-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between min-[1028px]:hidden px-1">
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu-panel"
                onClick={() => setMobileOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/[0.06] hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </button>

              <ThemeToggle
                className="grid h-9 w-9 place-items-center rounded-xl border border-black/10 bg-white/70 text-black dark:border-white/10 dark:bg-white/[0.06] dark:text-white hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle theme (mobile)"
              />
            </div>

            <Link href={homeHref} className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              <FmgUniverseLogo
                alt="FMG Universe Logo"
                width={120}
                height={80}
                className="h-9 w-[54px] rounded-md object-contain"
                fetchPriority="high"
              />
            </Link>

            <button
              ref={mobileProfileButtonRef}
              onClick={handleProfileClick}
              className="inline-flex items-center rounded-full p-1 border border-transparent hover:border-black/10 dark:hover:border-white/10 transition-colors flex-shrink-0"
              aria-label="Open user menu"
            >
              <ProfileAvatar
                avatarUrl={profile?.avatarUrl}
                fullName={profile?.fullName}
                size="md"
                animate
                showFallback={!profileLoading}
              />
            </button>
          </div>

          <div className="hidden h-16 items-center justify-between min-[1028px]:flex">
            <Link href={homeHref} className="flex items-center gap-2 font-semibold flex-shrink-0 min-w-0">
              <FmgUniverseLogo
                alt="FMG Universe Logo"
                width={120}
                height={80}
                className="block h-10 w-[60px] rounded-md object-contain flex-shrink-0"
                fetchPriority="high"
              />
              <div className="min-w-0">
                <BrandLockup
                  title="FLEMMO MUSIC"
                  subtitle="Global Universe Solution"
                  subtitleBasePx={10}
                  subtitleMinPx={1}
                  subtitleMaxPx={11}
                />
              </div>
            </Link>

            <div className="hidden min-[1028px]:flex items-center justify-center flex-1 mx-8">
              <div className="flex items-center gap-6 text-sm">
                <Link href="/company#about" className="opacity-80 hover:opacity-100 whitespace-nowrap transition-opacity">
                  {pick("Tentang", "About")}
                </Link>
                <Link href={localeHref("/services")} className="opacity-80 hover:opacity-100 whitespace-nowrap transition-opacity">
                  {pick("Layanan", "Services")}
                </Link>
                <Link href={localeHref("/pricing")} className="opacity-80 hover:opacity-100 whitespace-nowrap transition-opacity">
                  {pick("Harga", "Pricing")}
                </Link>
                <Link href={language === "id" ? "/id/portofolio?work=arrangement" : ARRANGEMENT_PORTFOLIO_PATH} className="opacity-80 hover:opacity-100 whitespace-nowrap transition-opacity">
                  {pick("Portofolio", "Portfolio")}
                </Link>
                <Link href={localeHref("/articles")} className="opacity-80 hover:opacity-100 whitespace-nowrap transition-opacity">
                  {pick("Artikel", "Articles")}
                </Link>

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
                  {pick("Menu", "Menu")}
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
                      aria-label={pick("Bagian FMG", "FMG Sections")}
                      style={{ willChange: "transform, opacity" }}
                      className="
                      fixed top-16 left-1/2 z-[60]
                      w-[520px] max-w-[calc(100vw-2rem)] -translate-x-1/2
                      rounded-2xl ring-1 ring-white/80 dark:ring-black/90
                      overflow-hidden shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)]
                      bg-white dark:bg-black backdrop-blur-xl
                      transform-gpu
                    "
                    >
                      <div className="relative z-10 p-2">
                        <div className="mb-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[12px] uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                              FMG Universe
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {UNIVERSE.map((u) => (
                              <motion.div key={u.label} variants={item}>
                                <Link
                                  href={localeHref(u.href)}
                                  onClick={() => {
                                    setOpen(false);
                                    setFocusIndex(-1);
                                  }}
                                  className="
                                    group flex flex-col items-center justify-center gap-1
                                    rounded-xl border border-black/10 dark:border-white/10
                                    bg-white dark:bg-neutral-900
                                    px-3 py-2 text-center transition
                                    hover:bg-white/90 dark:hover:bg-white/[0.08]
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40
                                  "
                                >
                                  <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white border border-white/30 dark:border-white/10">
                                    <u.Icon className="h-4 w-4" />
                                  </span>
                                  <span className="text-[12.5px] font-medium text-black/85 dark:text-white/90">
                                    {universeLabel(u)}
                                  </span>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {MENU.map((m, idx) => (
                            <motion.div key={m.label} variants={item} style={{ willChange: "transform, opacity" }}>
                              <Link
                                ref={((i: number) => (el: HTMLAnchorElement | null) => {
                                  itemRefs.current[i] = el;
                                })(idx)}
                                href={localeHref(m.href)}
                                role="menuitem"
                                tabIndex={-1}
                                onClick={() => {
                                  setOpen(false);
                                  setFocusIndex(-1);
                                }}
                                className="
                                group relative flex items-center frost-item p-3 gap-4 rounded-2xl p-3
                                ring-1 ring-black/10 dark:ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
                                bg-white dark:bg-neutral-900
                                hover:bg-white dark:hover:bg-neutral-900
                                transition
                                shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]
                                dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40
                                after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl
                                after:bg-gradient-to-br after:from-white/40 after:to-transparent
                                after:opacity-0 group-hover:after:opacity-100 after:transition-opacity
                              "
                              >
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

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-black/90 dark:text-white/90">{menuLabel(m)}</span>
                                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0" />
                                  </div>
                                  <p className="mt-0.5 text-[12.5px] leading-5 text-neutral-700 dark:text-neutral-300 line-clamp-2">
                                    {menuDescription(m)}
                                  </p>
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </div>

                        <div className="mt-2 flex items-center justify-between rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950 px-3 py-2">
                          <span className="text-[12.5px] text-neutral-700 dark:text-neutral-300">
                            “Beyond Sound. Built-in Intelligence.”
                          </span>
                          <Link
                            href={localeHref("/arrangement")}
                            className="
                            inline-flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10
                            bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-xs font-semibold
                            hover:opacity-90 transition
                          "
                          >
                            {pick("Mulai Project", "Start Project")} <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-3 min-[1028px]:flex flex-shrink-0">
              <LanguageSelector />
              <CurrencyDropdownAdvanced
                value={currency}
                onChange={setCurrency}
                loading={currencyLoading}
                variant="compact"
                size="sm"
                showName={false}
                showSearch={false}
              />
              <Link
                href={localeHref("/arrangement")}
                className="
                group relative inline-flex h-10 items-center gap-2 rounded-2xl px-4
                text-sm font-semibold leading-none whitespace-nowrap
                bg-black text-white dark:bg-white dark:text-black
                shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-colors
                hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 hover:text-white
                min-[1200px]:h-11 min-[1200px]:px-5
              "
              >
                <span className="hidden min-[1200px]:inline">{pick("Mulai Project Saya", "Start My Project")}</span>
                <span className="min-[1200px]:hidden">{pick("Mulai Project", "Start Project")}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/10 opacity-0 blur-xl transition-opacity group-hover:opacity-100 dark:bg-black/10" />
              </Link>

              <ThemeToggle className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white/60 text-black dark:border-white/10 dark:bg-black/40 min-[1200px]:h-11 min-[1200px]:w-11" />

              <motion.div className="relative" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                <button
                  ref={profileButtonRef}
                  onClick={handleProfileClick}
                  className="flex items-center gap-2 rounded-full px-1.5 py-1 transition-all duration-200 border border-transparent hover:border-black/10 dark:hover:border-white/10 min-[1200px]:gap-3"
                >
                  <span className="hidden min-[1200px]:block text-sm font-medium text-black/80 dark:text-slate-200 truncate max-w-[120px]">
                    {profileLoading ? "Loading..." : profile?.fullName || "Profile"}
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
              </motion.div>
            </div>
          </div>

          {showUserMenu && (
            <Portal>
              <div
                ref={dropdownWrapperRef}
                className="fixed z-[9999] pointer-events-auto"
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left - 5,
                  maxWidth: "min(96vw, 360px)",
                }}
              >
                <UserDropdown
                  isOpen={showUserMenu}
                  onClose={() => setShowUserMenu(false)}
                  profile={profile}
                  loading={profileLoading}
                />
              </div>
            </Portal>
          )}
        </div>

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
                style={{ willChange: "transform, opacity" }}
                className="
                fixed inset-x-0 top-0 z-[60] rounded-b-3xl border-b border-black/10 dark:border-white/10
                bg-white dark:bg-black backdrop-blur-xl transform-gpu max-w-full
              "
              >
                <div className="sticky top-0 inset-x-0 z-10 bg-white dark:bg-black">
                  <div
                    className="flex items-center justify-start px-4 pb-2"
                    style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
                  >
                    <button
                      onClick={() => setMobileOpen(false)}
                      aria-label="Close menu"
                      className="
                      inline-flex h-9 w-9 items-center justify-center rounded-full
                      border border-black/10 bg-white/80 text-black
                      dark:border-white/10 dark:bg-white/10 dark:text-white
                      hover:opacity-90 transition
                    "
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="px-4 pt-2 pb-8 overflow-y-auto max-h-[calc(100vh-80px)]">
                  <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-950 p-3">
                    <div className="mb-2 text-xs uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
                      FMG Universe
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {UNIVERSE.map((u) => (
                        <Link
                          key={u.label}
                          href={localeHref(u.href)}
                          onClick={() => setMobileOpen(false)}
                          className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2"
                        >
                          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white border border-white/30 dark:border-white/10">
                            <u.Icon className="h-4 w-4" />
                          </span>
                          <span className="text-[12.5px] font-medium text-black/85 dark:text-white/90">
                            {universeLabel(u)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm mt-3">
                    <Link
                      href="/company#about"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2.5 text-center hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      {pick("Tentang", "About")}
                    </Link>
                    <Link
                      href={localeHref("/services")}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2.5 text-center hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      {pick("Layanan", "Services")}
                    </Link>
                    <Link
                      href={localeHref("/pricing")}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2.5 text-center hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      {pick("Paket", "Packages")}
                    </Link>
                    <Link
                      href={language === "id" ? "/id/portofolio?work=arrangement" : ARRANGEMENT_PORTFOLIO_PATH}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2.5 text-center hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      {pick("Portofolio", "Portfolio")}
                    </Link>
                    <Link
                      href={localeHref("/articles")}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2.5 text-center hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      {pick("Artikel", "Articles")}
                    </Link>
                  </div>

                  <div className="mt-4 divide-y divide-black/5 dark:divide-white/10">
                    <div className="pb-4">
                      <div className="mb-2 text-xs uppercase tracking-wide text-neutral-600 dark:text-neutral-300">{pick("Bahasa", "Language")}</div>
                      <LanguageSelector mobile />
                    </div>
                    <div className="pb-4">
                      <div className="mb-2 text-xs uppercase tracking-wide text-neutral-600 dark:text-neutral-300">{pick("Mata uang", "Currency")}</div>
                      <CurrencyDropdownAdvanced
                        value={currency}
                        onChange={setCurrency}
                        loading={currencyLoading}
                        variant="compact"
                        size="sm"
                        showName
                      />
                    </div>
                    <div className="pb-3">
                      <div className="text-xs uppercase tracking-wide text-neutral-600 dark:text-neutral-300 mb-2">
                        {pick("Bagian FMG", "FMG Sections")}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {MENU.map((m) => (
                          <Link
                            key={m.label}
                            href={localeHref(m.href)}
                            onClick={() => setMobileOpen(false)}
                            className="group flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-3"
                          >
                            <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white border border-white/30 dark:border-white/10">
                              <m.Icon className="h-4 w-4" />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[15px] font-medium text-black/90 dark:text-white/90">
                                {menuLabel(m)}
                              </span>
                              <span className="block text-[12.5px] text-neutral-700 dark:text-neutral-300 line-clamp-1">
                                {menuDescription(m)}
                              </span>
                            </span>
                            <ArrowRight className="h-4 w-4 opacity-60 group-hover:opacity-100" />
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3">
                      <Link
                        href={localeHref("/arrangement")}
                        onClick={() => setMobileOpen(false)}
                        className="
                        mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3
                        text-sm font-semibold leading-none
                        bg-black text-white dark:bg-white dark:text-black
                        shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-colors
                        hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 hover:text-white
                      "
                      >
                        {pick("Mulai Project Saya", "Start My Project")}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 text-center text-[12.5px] text-neutral-700 dark:text-neutral-300">
                    “Beyond Sound. Built-in Intelligence.”
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </MotionConfig>
  );
};

export default HeaderSection;
