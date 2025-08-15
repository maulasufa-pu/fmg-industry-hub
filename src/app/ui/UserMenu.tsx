"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  | "publishing";

type ProfileLite = {
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
};

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileLite | null>(null);

  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const boundRef = useRef(false);

  useEffect(() => {
    if (boundRef.current) return;
    boundRef.current = true;

    const supabase = getSupabaseClient();
    let cancelled = false;

    /** Ambil profile dari DB (tabel `profiles`) untuk user saat ini */
    const refreshProfileFromDB = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        const u = session?.user;
        if (!u) {
          setProfile(null);
          return;
        }

        const { data: row, error } = await supabase
          .from("profiles")
          .select("name, role, avatar_url")
          .eq("id", u.id)
          .maybeSingle();

        // fallback aman kalau profil belum ada (harusnya sudah ada)
        const fullName =
          row?.name ||
          u.user_metadata?.full_name ||
          [u.user_metadata?.first_name, u.user_metadata?.last_name].filter(Boolean).join(" ") ||
          u.email?.split("@")[0] ||
          "User";

        const email = u.email ?? "";
        const role: Role = (row?.role as Role) || "client";
        const avatarUrl = (row?.avatar_url as string) ?? null;

        if (!error && !cancelled) {
          setProfile({ fullName, email, role, avatarUrl });
        } else if (!cancelled) {
          // Kalau query error, tetap tampilkan minimal info
          setProfile({ fullName, email, role, avatarUrl });
        }
      } catch {
        if (!cancelled) setProfile(null);
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
      } catch {
        // ignore
      }
      try {
        void supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, []);

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
        className="flex h-12 w-12 items-center justify-center rounded-full bg-coolgray-10 transition-colors hover:bg-coolgray-20"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* Avatar sederhana */}
        <svg className="h-6 w-6 text-coolgray-90" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div
          ref={popRef}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg"
        >
          {/* Header info user */}
          <div className="flex items-start gap-3 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coolgray-10 text-coolgray-90">
              {(profile?.fullName?.charAt(0) || "U").toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate font-medium text-coolgray-90">
                {profile?.fullName || "Guest"}
              </div>
              <div className="truncate text-xs text-coolgray-60">
                {profile?.email || "Read Only"}
              </div>
              {profile && (
                <div className="mt-1 w-fit rounded-full bg-coolgray-10 px-2 py-0.5 text-xs text-coolgray-90">
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
                  href="/client/profile"
                  className="rounded-lg px-3 py-2 text-coolgray-90 hover:bg-coolgray-10"
                  onClick={() => setOpen(false)}
                >
                  View Profile
                </Link>
                <Link
                  href="/client/settings"
                  className="rounded-lg px-3 py-2 text-coolgray-90 hover:bg-coolgray-10"
                  onClick={() => setOpen(false)}
                >
                  Settings
                </Link>

                {/* Tautan Admin Panel muncul hanya untuk admin/owner */}
                {(profile.role === "admin" || profile.role === "owner") && (
                  <>
                    <Link
                      href="/admin/dashboard"
                      className="rounded-lg px-3 py-2 text-coolgray-90 hover:bg-coolgray-10"
                      onClick={() => setOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      href="/admin/projects"
                      className="rounded-lg px-3 py-2 text-coolgray-90 hover:bg-coolgray-10"
                      onClick={() => setOpen(false)}
                    >
                      Admin Projects
                    </Link>
                    <Link
                      href="/admin/invoices"
                      className="rounded-lg px-3 py-2 text-coolgray-90 hover:bg-coolgray-10"
                      onClick={() => setOpen(false)}
                    >
                      Admin Invoices
                    </Link>
                    {profile.role === "owner" && (
                      <Link
                        href="/admin/users"
                        className="rounded-lg px-3 py-2 text-coolgray-90 hover:bg-coolgray-10"
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
