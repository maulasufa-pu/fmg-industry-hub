"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Moon, Sun, LogOut } from "lucide-react";
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

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const roleLabel = (r?: string) =>
    (r ?? "client").replace(/\b\w/g, (c) => c.toUpperCase());

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={`w-72 rounded-xl border border-slate-400/40 bg-white dark:bg-slate-800 p-4 shadow-2xl dark:shadow-slate-900/50 z-[9999] relative ${className}`}
    >
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {loading ? (
            <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
          ) : (
            <ProfileAvatar
              avatarUrl={profile?.avatarUrl}
              fullName={profile?.fullName}
              size="lg"
              className="shadow-md dark:shadow-slate-800/25"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-slate-900 dark:text-gray-100">
            {loading ? (
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-24"></div>
            ) : (
              profile?.fullName || "Guest"
            )}
          </div>
          <div className="truncate text-xs text-slate-600 dark:text-gray-400 mt-1">
            {loading ? (
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-32"></div>
            ) : (
              profile?.email || "Read Only"
            )}
          </div>
          {!loading && profile && (
            <div className="mt-1 w-fit rounded-full bg-slate-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-slate-900 dark:text-gray-200">
              {roleLabel(profile.role)}
            </div>
          )}
        </div>
      </div>

      <hr className="my-3 border-t border-slate-200 dark:border-slate-600" />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300"></div>
        </div>
      ) : profile ? (
        <>
          <nav className="flex flex-col gap-1">
            {/* Profile and Settings */}
            <Link
              href="/profile/settings"
              className="rounded-lg px-3 py-2 text-slate-900 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              onClick={onClose}
            >
              View Profile
            </Link>
            <Link
              href="/profile/settings"
              className="rounded-lg px-3 py-2 text-slate-900 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              onClick={onClose}
            >
              Edit Profile
            </Link>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
                onClose();
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </nav>

          <hr className="my-3 border-t border-slate-200 dark:border-slate-600" />

          <div className="px-2 pb-1">
            <div onClick={onClose}>
              <LogoutButton className="h-10 w-full rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </LogoutButton>
            </div>
          </div>
        </>
      ) : (
        <div className="px-2 pb-1">
          <Link
            href="/login"
            className="block h-10 w-full rounded-lg bg-blue-600 text-center leading-10 text-white hover:bg-blue-700 transition-colors"
            onClick={onClose}
          >
            Login
          </Link>
        </div>
      )}
    </div>
  );
}
