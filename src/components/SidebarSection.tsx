"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import { getSupabaseClient, ensureFreshSession } from "@/lib/supabase/client";
import { User, Tags, Plane, Search, Pictures, Home, Folder, Cog, Bell, ChevronDown } from "@/icons";
import rectangle14Stroke from "../icons/rectangle-14-stroke.svg";
import { usePathname, useRouter } from "next/navigation";

type ProfileLite = {
  fullName: string;
  email: string;
  role: string;
  avatar_path?: string | null;
};

const BUCKET = "avatars";
const USE_PUBLIC_BUCKET = true;

export const SidebarSection = () => {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const router = useRouter();
  const pathname = usePathname() || "";

  const [searchValue, setSearchValue] = useState("");
  const [activeMenuItem, setActiveMenuItem] = useState("");
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileLite | null>(null);

  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // helper: buat URL dari path storage
  const refreshAvatarUrl = async (path: string | null) => {
    if (!path) { setAvatarUrl(null); return; }
    if (USE_PUBLIC_BUCKET) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } else {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
      setAvatarUrl(error ? null : data.signedUrl);
    }
  };

  // Ambil profile Supabase + avatar path
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let mounted = true;

    const boot = async () => {
      await ensureFreshSession();
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!mounted) return;

      if (!user) {
        setProfile(null);
        setAvatarPath(null);
        setAvatarUrl(null);
      } else {
        const md = user.user_metadata || {};
        const full =
          md.full_name ||
          [md.first_name, md.last_name].filter(Boolean).join(" ") ||
          user.email?.split("@")[0] ||
          "User";

        // ambil avatar_path dari metadata, kalau kosong cek tabel profiles
        let p = (md.avatar_path as string | undefined) || null;
        if (!p) {
          const { data: row } = await supabase
            .from("profiles")
            .select("avatar_path")
            .eq("id", user.id)
            .maybeSingle();
          p = row?.avatar_path || null;
        }

        if (!mounted) return;

        setProfile({
          fullName: full,
          email: user.email || "",
          role: md.role || "Client",
          avatar_path: p,
        });
        setAvatarPath(p);
        await refreshAvatarUrl(p);
      }

      // subscribe perubahan auth
      const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
        if (!mounted) return;
        const u = s?.user;
        if (!u) {
          setProfile(null);
          setAvatarPath(null);
          setAvatarUrl(null);
        } else {
          const m = u.user_metadata || {};
          const full2 =
            m.full_name ||
            [m.first_name, m.last_name].filter(Boolean).join(" ") ||
            u.email?.split("@")[0] ||
            "User";

          let p2 = (m.avatar_path as string | undefined) || null;
          if (!p2) {
            const { data: row2 } = await supabase
              .from("profiles")
              .select("avatar_path")
              .eq("id", u.id)
              .maybeSingle();
            p2 = row2?.avatar_path || null;
          }

          setProfile({
            fullName: full2,
            email: u.email || "",
            role: m.role || "Client",
            avatar_path: p2,
          });
          setAvatarPath(p2);
          await refreshAvatarUrl(p2);
        }
      });

      unsub = () => sub.subscription.unsubscribe();
    };

    boot();
    return () => { mounted = false; unsub?.(); };
  }, [supabase]);

  // Tutup popover kalau klik di luar / ESC
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

  const menuItems = useMemo(() => ([
    { id: "Dashboard", icon: Home, label: "Dashboard", href: "/client/dashboard" },
    { id: "Projects", icon: Folder, label: "Projects", href: "/client/projects" },
    { id: "Invoices", icon: Tags, label: "Invoices", href: "/client/invoices" },
    { id: "Publishing", icon: Pictures, label: "Publishing", href: "/client/publishing" },
    { id: "Reports", icon: Plane, label: "Reports", badge: "99+", hasDropdown: true, href: "/client/reports" },
  ]), []);

  // Deteksi URL dan set menu aktif
  useEffect(() => {
    const match = menuItems.find((item) => pathname.startsWith(item.href));
    if (match) setActiveMenuItem(match.id);
  }, [pathname, menuItems]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchValue(e.target.value);

  const itemBase =
    "group relative flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coolgray-30";

  const qaBtnBase =
    "relative group grid h-10 w-10 place-items-center rounded-lg " +
    "transition-[transform,background-color,box-shadow] duration-150 " +
    "hover:bg-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coolgray-30 " +
    "motion-reduce:transition-none";

  return (
    <aside
      className="flex flex-col w-64 min-h-screen items-start gap-4 px-4 py-6 bg-defaultwhite border-r border-coolgray-20"
      role="navigation"
      aria-label="Main navigation"
    >
      <header className="flex flex-col items-center gap-2.5 self-stretch w-full">
        <div className="inline-flex items-start gap-1">
          <div className="inline-flex items-center justify-center">
            {/* <img className="w-6 h-6" alt="Flemmo Music logo" src={rectangle14Stroke} /> */}
          </div>
          <div className="inline-flex flex-col items-end justify-center">
            <h1 className="font-heading-4 text-coolgray-60">Flemmo Music</h1>
            <p className="font-body-XS text-coolgray-60 -mt-1">Global Industry Hub</p>
          </div>
        </div>
      </header>

      {/* Quick actions */}
      <div
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--card)]/70 p-2 shadow-sm ring-1 ring-[var(--border)]"
        role="toolbar"
        aria-label="User actions"
      >
        {/* User profile button */}
        <div className="relative">
          <button
            ref={btnRef}
            aria-label="User profile"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
            className={`${qaBtnBase} rounded-full`}
          >
            <span className="pointer-events-none absolute inset-0 rounded-full bg-black/5 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
            <User className="text-coolgray-90 group-hover:text-primary-90 transition-colors" />
          </button>

          {open && (
            <div
              ref={popRef}
              role="menu"
              className="absolute left-2 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg p-3 z-50"
            >
              {/* Header info user */}
              <div className="flex items-start gap-3 p-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-coolgray-10 text-coolgray-90 overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={profile?.fullName || "User avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (profile?.fullName?.charAt(0) || "U").toUpperCase()
                  )}
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
                      href="/client/settings"
                      className="px-3 py-2 rounded-lg hover:bg-coolgray-10 text-coolgray-90"
                    >
                      View Profile
                    </Link>
                    <Link
                      href="/client/settings"
                      className="px-3 py-2 rounded-lg hover:bg-coolgray-10 text-coolgray-90"
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
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          aria-label="Settings"
          className={qaBtnBase}
          onClick={() => router.push("/client/settings")}
        >
          <span className="pointer-events-none absolute inset-0 rounded-lg bg-black/5 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
          <Cog className="text-coolgray-90 group-hover:text-primary-90 transition-colors" />
        </button>

        {/* Notifications */}
        <button aria-label="Notifications" className={qaBtnBase}>
          <span className="pointer-events-none absolute inset-0 rounded-lg bg-black/5 opacity-0 group-active:opacity-100 transition-opacity duration-150" />
          <Bell className="text-coolgray-90 group-hover:text-primary-90 transition-colors" />
          <span
            aria-label="9 notifications"
            className="absolute -top-0.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px]
                       rounded-full bg-red-500 text-[10px] font-medium text-white shadow-md shadow-red-500/30"
          >
            9
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="mt-3 flex w-full items-center gap-2 rounded-lg bg-coolgray-10/60 px-3 py-2 ring-1 ring-[var(--border)]">
        <Search className="!w-5 !h-5 text-coolgray-60" />
        <label htmlFor="sidebar-search" className="sr-only">Search</label>
        <input
          id="sidebar-search"
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search…"
          className="w-full bg-transparent font-body-m text-coolgray-90 placeholder-coolgray-60 focus:outline-none"
        />
      </div>

      {/* Nav */}
      <nav className="w-full flex-1">
        <ul className="w-full">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const isActive = activeMenuItem === item.id;

            return (
              <li key={item.id} className={i === 0 ? "" : "border-t border-divider"}>
                <Link
                  href={item.href}
                  className={
                    itemBase +
                    " " +
                    (isActive
                      ? "bg-coolgray-10 font-medium text-coolgray-90"
                      : "text-coolgray-90 hover:bg-hover")
                  }
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded bg-primary-60"
                    />
                  )}
                  <Icon
                    className={
                      "!w-6 !h-6 transition-colors " +
                      (isActive ? "text-primary-90" : "text-coolgray-90 group-hover:text-primary-90")
                    }
                  />
                  <span className="flex-1 text-left font-other-menu-m">{item.label}</span>
                  {item.badge && (
                    <span className="inline-flex items-center px-[6px] py-[2px] rounded-xl bg-red-500 text-[10px] font-medium text-white shadow-md shadow-red-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.hasDropdown && (
                    <ChevronDown
                      className={
                        "!w-5 !h-5 ml-1 transition-transform " +
                        (isActive ? "text-primary-90" : "text-coolgray-90 group-hover:text-primary-90")
                      }
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
