"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import LogoutButton from "@/app/auth/LogoutButton";
import { getSupabaseClient } from "@/lib/supabase/client";

type Role =
  | "client"
  | "admin"
  | "owner"
  | "anr"
  | "engineer"
  | "composer"
  | "producer"
  | "publisher";

type ProfileLite = {
  fullName: string;
  email: string;
  role: Role;
  avatarPath: string | null;
};

const BUCKET = "avatars";
const USE_PUBLIC_BUCKET = true;

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const { theme, setTheme } = useTheme();

  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const boundRef = useRef(false);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshAvatarUrlFromPath = useCallback(async (path: string | null) => {
    if (!path) { setAvatarUrl(null); return; }
    const supabase = getSupabaseClient();
    if (USE_PUBLIC_BUCKET) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setAvatarUrl(data?.publicUrl ?? null);
    } else {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
      setAvatarUrl(error ? null : (data?.signedUrl ?? null));
    }
  }, []);

  useEffect(() => {
    if (boundRef.current) return;
    boundRef.current = true;

    const supabase = getSupabaseClient();
    let cancelled = false;

    const pickEffectiveRole = (mainRole?: string | null, staffRole?: string[] | null): Role => {
      const roles = [
        ...(mainRole ? [mainRole] : []),
        ...(Array.isArray(staffRole) ? staffRole : []),
      ];
      if (roles.includes("owner")) return "owner";
      if (roles.includes("admin")) return "admin";
      const staffPriority: Role[] = ["anr", "engineer", "composer", "producer", "publisher"];
      const found = staffPriority.find(r => roles.includes(r));
      return found ?? "client";
    };

    /** Get profile from DB (table `profiles`) for current user */
    const refreshProfileFromDB = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        const u = session?.user;
        if (!u) {
          setProfile(null);
          setAvatarUrl(null);
          return;
        }

        const { data: row } = await supabase
          .from("profiles")
          .select("name, first_name, last_name, email, main_role, staff_role, avatar_path, avatar_url")
          .eq("id", u.id)
          .maybeSingle();

        const fullName =
          row?.name ||
          [row?.first_name, row?.last_name].filter(Boolean).join(" ") ||
          u.user_metadata?.full_name ||
          [u.user_metadata?.first_name, u.user_metadata?.last_name].filter(Boolean).join(" ") ||
          u.email?.split("@")[0] ||
          "User";

        const email = row?.email ?? u.email ?? "";
        const role = pickEffectiveRole(row?.main_role, row?.staff_role);
        const avatarPath = (row?.avatar_path as string | null) ?? null;

        // Tentukan URL avatar: path Storage > url eksternal > null
        if (avatarPath) {
          await refreshAvatarUrlFromPath(avatarPath);
        } else if (typeof row?.avatar_url === "string" && row.avatar_url.length > 0) {
          setAvatarUrl(row.avatar_url);
        } else {
          setAvatarUrl(null);
        }

        if (!cancelled) setProfile({ fullName, email, role, avatarPath });
      } catch {
        if (!cancelled) {
          setProfile(null);
          setAvatarUrl(null);
        }
      }
    };

    // initial load
    void refreshProfileFromDB();

    // update saat auth berubah
    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      if (!cancelled) void refreshProfileFromDB();
    });

    // optional: dengar realtime update pada row profile user ini
    let channel = supabase.channel("realtime:user-profile");
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) return;

        channel = supabase
          .channel("realtime:user-profile:" + uid)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "profiles", filter: `id=eq.${uid}` },
            () => void refreshProfileFromDB()
          );

        void channel.subscribe();
      } catch {
        /* ignore realtime errors */
      }
    })();

    return () => {
      cancelled = true;
      boundRef.current = false;
      try {
        authSub.subscription.unsubscribe();
      } catch {/* ignore */}
      try {
        void supabase.removeChannel(channel);
      } catch {/* ignore */}
    };
  }, [refreshAvatarUrlFromPath]);

  // close popover on outside click / ESC
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const roleLabel = (r?: Role) =>
    (r ?? "client").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-coolgray-10 transition-colors hover:bg-coolgray-20 overflow-hidden"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* Avatar: pakai foto kalau ada, kalau tidak pakai inisial */}
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={profile?.fullName || "User avatar"}
            width={48}
            height={48}
            className="h-12 w-12 object-cover"
            onError={() => setAvatarUrl(null)}
            unoptimized
          />
        ) : (
          <svg className="h-6 w-6 text-coolgray-90" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {open && (
        <div
          ref={popRef}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--card)] dark:bg-gray-800 p-3 shadow dark:shadow-gray-800/25-lg dark:shadow dark:shadow-gray-800/25-gray-800/25"
        >
          {/* Header info user */}
          <div className="flex items-start gap-3 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coolgray-10 text-coolgray-90 overflow-hidden">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile?.fullName || "User avatar"}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-cover"
                  onError={() => setAvatarUrl(null)}
                  unoptimized
                />
              ) : (
                (profile?.fullName?.charAt(0) || "U").toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium text-coolgray-90 dark:text-gray-100">
                {profile?.fullName || "Guest"}
              </div>
              <div className="truncate text-xs text-coolgray-60 dark:text-gray-400">
                {profile?.email || "Read Only"}
              </div>
              {profile && (
                <div className="mt-1 w-fit rounded-full bg-coolgray-10 dark:bg-gray-700 px-2 py-0.5 text-xs text-coolgray-90 dark:text-gray-200">
                  {roleLabel(profile.role)}
                </div>
              )}
            </div>
          </div>

          <hr className="my-3 border-t border-[var(--border)]" />

          {profile ? (
            <>
              <nav className="flex flex-col gap-1">
                {/* Tautan umum */}
                <Link
                  href="/profile/settings"
                  className="rounded-lg px-3 py-2 text-coolgray-90 dark:text-gray-200 hover:bg-coolgray-10 dark:hover:bg-gray-700"
                  onClick={() => setOpen(false)}
                >
                  View Profile
                </Link>
                <Link
                  href="/profile/settings"
                  className="rounded-lg px-3 py-2 text-coolgray-90 dark:text-gray-200 hover:bg-coolgray-10 dark:hover:bg-gray-700"
                  onClick={() => setOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/articles"
                  className="rounded-lg px-3 py-2 text-coolgray-90 dark:text-gray-200 hover:bg-coolgray-10 dark:hover:bg-gray-700"
                  onClick={() => setOpen(false)}
                >
                  Articles
                </Link>

                {/* Dark Mode Toggle */}
                {mounted && (
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-coolgray-90 dark:text-gray-200 hover:bg-coolgray-10 dark:hover:bg-gray-700"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                )}

                {/* Admin Panel link appears only for admin/owner */}
                {(profile.role === "admin" || profile.role === "owner") && (
                  <>
                    <Link
                      href="/admin/dashboard"
                      className="rounded-lg px-3 py-2 text-coolgray-90 dark:text-gray-200 hover:bg-coolgray-10 dark:hover:bg-gray-700"
                      onClick={() => setOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      href="/admin/projects"
                      className="rounded-lg px-3 py-2 text-coolgray-90 dark:text-gray-200 hover:bg-coolgray-10 dark:hover:bg-gray-700"
                      onClick={() => setOpen(false)}
                    >
                      Admin Projects
                    </Link>
                    <Link
                      href="/admin/articles"
                      className="rounded-lg px-3 py-2 text-coolgray-90 dark:text-gray-200 hover:bg-coolgray-10 dark:hover:bg-gray-700"
                      onClick={() => setOpen(false)}
                    >
                      Article Studio
                    </Link>
                    <Link
                      href="/admin/invoices"
                      className="rounded-lg px-3 py-2 text-coolgray-90 dark:text-gray-200 hover:bg-coolgray-10 dark:hover:bg-gray-700"
                      onClick={() => setOpen(false)}
                    >
                      Admin Invoices
                    </Link>
                    {profile.role === "owner" && (
                      <Link
                        href="/admin/users"
                        className="rounded-lg px-3 py-2 text-coolgray-90 dark:text-gray-200 hover:bg-coolgray-10 dark:hover:bg-gray-700"
                        onClick={() => setOpen(false)}
                      >
                        User & Roles
                      </Link>
                    )}
                  </>
                )}
              </nav>

              <hr className="my-3 border-t border-[var(--border)]" />

              <div className="px-2 pb-1">
                <LogoutButton className="h-10 w-full rounded-lg bg-primary-60 text-white hover:bg-primary-70" />
              </div>
            </>
          ) : (
            <div className="px-2 pb-1">
              <Link
                href="/login"
                className="block h-10 w-full rounded-lg bg-primary-60 text-center leading-10 text-white hover:bg-primary-70"
                onClick={() => setOpen(false)}
              >
                Login
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
