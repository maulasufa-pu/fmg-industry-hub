"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import { getSupabaseClient } from "@/lib/supabase/client";

type ProfileLite = {
  fullName: string;
  email: string;
  role: string;
};

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseClient(true);
    let unsub: (() => void) | undefined;

    const boot = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setProfile(null);
      } else {
        const md = user.user_metadata || {};
        const full =
          md.full_name ||
          [md.first_name, md.last_name].filter(Boolean).join(" ") ||
          user.email?.split("@")[0] ||
          "User";
        setProfile({
          fullName: full,
          email: user.email || "",
          role: md.role || "Client",
        });
      }

      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        const u = s?.user;
        if (!u) {
          setProfile(null);
        } else {
          const m = u.user_metadata || {};
          const full =
            m.full_name ||
            [m.first_name, m.last_name].filter(Boolean).join(" ") ||
            u.email?.split("@")[0] ||
            "User";
          setProfile({
            fullName: full,
            email: u.email || "",
            role: m.role || "Client",
          });
        }
      });
      unsub = () => sub.subscription.unsubscribe();
    };

    boot();
    return () => { unsub?.(); };
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        className="flex w-12 h-12 items-center justify-center rounded-full bg-coolgray-10 hover:bg-coolgray-20 transition-colors"
      >
        <svg className="w-6 h-6 text-coolgray-90" viewBox="0 0 24 24" fill="none">
          <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div
          ref={popRef}
          className="absolute right-0 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg p-3 z-50"
        >
          {/* Header info user */}
          <div className="flex items-start gap-3 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coolgray-10 text-coolgray-90">
              {(profile?.fullName?.charAt(0) || "U").toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-coolgray-90 truncate">
                {profile?.fullName || "Guest"}
              </div>
              <div className="text-xs text-coolgray-60 truncate">
                {profile?.email || "Read Only"}
              </div>
              {profile && (
                <div className="text-xs mt-0.5 px-2 py-0.5 rounded-full bg-coolgray-10 text-coolgray-90 w-fit">
                  {profile.role}
                </div>
              )}
            </div>
          </div>

          <hr className="my-3 border-t border-[var(--border)]" />

          {profile ? (
            <>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/client/profile"
                  className="px-3 py-2 rounded-lg hover:bg-coolgray-10 text-coolgray-90"
                  onClick={() => setOpen(false)}
                >
                  View Profile
                </Link>
                <Link
                  href="/client/settings"
                  className="px-3 py-2 rounded-lg hover:bg-coolgray-10 text-coolgray-90"
                  onClick={() => setOpen(false)}
                >
                  Settings
                </Link>
              </nav>

              <hr className="my-3 border-t border-[var(--border)]" />

              <div className="px-2 pb-1">
                <LogoutButton className="w-full h-10 rounded-lg bg-primary-60 text-white hover:bg-primary-70" />
              </div>
            </>
          ) : (
            <div className="px-2 pb-1">
              <Link
                href="/login"
                className="block w-full h-10 rounded-lg bg-primary-60 text-white hover:bg-primary-70 text-center leading-10"
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
