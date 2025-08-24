"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Moon,
  Sun,
  LogOut,
  X,
  LayoutDashboard,
  FolderOpen,
  UserCog,
  Settings,
  Users,
  BarChart3,
  Home, // ⬅️ ditambahkan
} from "lucide-react";
import { useTheme } from "next-themes";
import LogoutButton from "@/app/auth/LogoutButton";
import { useProfile } from "@/hooks/useProfile";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function UserDropdown({ isOpen, onClose, className = "" }: UserDropdownProps) {
  const { profile, loading } = useProfile();
  const { theme, setTheme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Esc
  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const role = profile ? (profile.role?.toLowerCase?.() ?? "client") : "guest";
  const isAdmin = ["admin", "superadmin", "owner"].includes(role);
  const isClient = role === "client";
  const isGuest = role === "guest";

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="User menu"
      tabIndex={-1}
      onMouseDownCapture={(e) => e.stopPropagation()}
      onTouchStartCapture={(e) => e.stopPropagation()}
      className={[
        "w-[min(92vw,22rem)] overflow-hidden rounded-2xl pointer-events-auto",
        "border border-black/10 bg-white/90 backdrop-blur-xl shadow-2xl",
        "dark:border-white/10 dark:bg-black/70",
        "ring-1 ring-white/40 dark:ring-white/5",
        className,
      ].join(" ")}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {loading ? (
              <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            ) : (
              <ProfileAvatar
                avatarUrl={profile?.avatarUrl}
                fullName={profile?.fullName}
                size="lg"
                className="shadow-md dark:shadow-slate-900/40"
              />
            )}
          </div>

          {/* Name + email */}
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-slate-900 dark:text-slate-100">
              {loading ? (
                <span className="inline-block h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              ) : (
                profile?.fullName || "Guest"
              )}
            </div>
            <div className="truncate text-xs text-slate-600 dark:text-slate-400">
              {loading ? (
                <span className="inline-block h-3 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              ) : (
                profile?.email || "—"
              )}
            </div>
            {!loading && profile && (
              <div className="mt-1 w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                {(profile.role ?? "client").replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
            )}
          </div>

          {/* Actions (theme + close) */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full
                         border border-black/10 bg-white text-slate-900 hover:bg-white/85
                         dark:border-white/10 dark:bg-black/40 dark:text-white"
              aria-label="Toggle theme"
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full
                         bg-black/5 text-black/70 hover:bg-black/10
                         dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <hr className="mx-4 border-t border-black/10 dark:border-white/10" />

      {/* Content */}
      {loading ? (
        <div className="space-y-2 p-4">
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
      ) : isGuest ? (
        <div className="p-4 space-y-2">
          {/* ⬅️ Tombol Home untuk Guest */}
          <Link
            href="/"
            onClick={onClose}
            className="block h-10 w-full rounded-xl border border-black/10 bg-white/70 text-center font-semibold leading-10 text-slate-900 transition hover:bg-white
                       dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100"
          >
            Home
          </Link>
          <Link
            href="/login"
            onClick={onClose}
            className="block h-10 w-full rounded-xl bg-indigo-600 text-center font-semibold leading-10 text-white transition hover:bg-indigo-700"
          >
            Login
          </Link>
        </div>
      ) : (
        <>
          {/* Client Hub */}
          {(isClient || isAdmin) && (
            <div className="p-3">
              <div className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Client Hub
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* ⬅️ Tile Home untuk user yang login */}
                <Link
                  href="/"
                  onClick={onClose}
                  className="group flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2
                             text-sm font-medium text-slate-900 shadow-sm ring-1 ring-white/40 transition
                             hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:ring-white/10"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-600/10 text-slate-700 dark:text-slate-200">
                    <Home className="h-4 w-4" />
                  </span>
                  <span>Home</span>
                </Link>

                <Link
                  href="/client/dashboard"
                  onClick={onClose}
                  className="group flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2
                             text-sm font-medium text-slate-900 shadow-sm ring-1 ring-white/40 transition
                             hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:ring-white/10"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                    <LayoutDashboard className="h-4 w-4" />
                  </span>
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/client/projects"
                  onClick={onClose}
                  className="group flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2
                             text-sm font-medium text-slate-900 shadow-sm ring-1 ring-white/40 transition
                             hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:ring-white/10"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-600/10 text-violet-600 dark:text-violet-400">
                    <FolderOpen className="h-4 w-4" />
                  </span>
                  <span>My Projects</span>
                </Link>

                <Link
                  href="/profile/settings"
                  onClick={onClose}
                  className="group flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2
                             text-sm font-medium text-slate-900 shadow-sm ring-1 ring-white/40 transition
                             hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:ring-white/10"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                    <UserCog className="h-4 w-4" />
                  </span>
                  <span>Edit Profile</span>
                </Link>

                <div onClick={onClose}>
                  <LogoutButton
                    className="group flex w-full items-center gap-2 rounded-xl border border-red-500/20 bg-red-600/90 px-3 py-2
                               text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 focus-visible:outline-none
                               focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15">
                      <LogOut className="h-4 w-4" />
                    </span>
                    <span>Logout</span>
                  </LogoutButton>
                </div>
              </div>
            </div>
          )}

          {/* Admin Hub */}
          {isAdmin && (
            <>
              <hr className="mx-4 border-t border-black/10 dark:border-white/10" />
              <div className="p-3">
                <div className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Admin Hub
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="group flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2
                               text-sm font-medium text-slate-900 shadow-sm ring-1 ring-white/40 transition
                               hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:ring-white/10"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-600/10 text-sky-600 dark:text-sky-400">
                      <BarChart3 className="h-4 w-4" />
                    </span>
                    <span>Admin Dashboard</span>
                  </Link>

                  <Link
                    href="/admin/users"
                    onClick={onClose}
                    className="group flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2
                               text-sm font-medium text-slate-900 shadow-sm ring-1 ring-white/40 transition
                               hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:ring-white/10"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-600/10 text-rose-600 dark:text-rose-400">
                      <Users className="h-4 w-4" />
                    </span>
                    <span>Users</span>
                  </Link>

                  <Link
                    href="/admin/projects"
                    onClick={onClose}
                    className="group flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2
                               text-sm font-medium text-slate-900 shadow-sm ring-1 ring-white/40 transition
                               hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:ring-white/10"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-600/10 text-purple-600 dark:text-purple-400">
                      <FolderOpen className="h-4 w-4" />
                    </span>
                    <span>Projects</span>
                  </Link>

                  <Link
                    href="/admin/settings"
                    onClick={onClose}
                    className="group flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-2
                               text-sm font-medium text-slate-900 shadow-sm ring-1 ring-white/40 transition
                               hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:ring-white/10"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Settings className="h-4 w-4" />
                    </span>
                    <span>Settings</span>
                  </Link>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
