"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// Icon components dari src/icons (PascalCase = nama file.svg)
import { Dashboard, Folder, Users, Cog } from "@/icons";

type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>;
type Item = { href: string; label: string; Icon: Icon };

const items: Item[] = [
  { href: "/admin/dashboard", label: "Dashboard", Icon: Dashboard },
  { href: "/admin/projects", label: "Projects", Icon: Folder },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/settings", label: "Settings", Icon: Cog },
];

export function AdminSidebarSection(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] min-h-screen border-r bg-white">
      <div className="p-4">
        <div className="mb-4 text-base font-semibold">Admin Panel</div>
        <nav className="space-y-1">
          {items.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active ? "bg-coolgray-20 font-medium" : "hover:bg-coolgray-20",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
