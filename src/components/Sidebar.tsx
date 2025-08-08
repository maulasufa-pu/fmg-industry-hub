"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
  label: string;
  href: string;
}

interface SidebarProps {
  menuItems?: MenuItem[];
}

export default function Sidebar({
  menuItems = [
    { label: "🏠 Dashboard", href: "/client/dashboard" },
    { label: "🎵 Projects", href: "/client/projects" },
    { label: "💳 Invoices", href: "/client/invoices" },
    { label: "📢 Publishing", href: "/client/publishing" },
    { label: "📊 Reports", href: "/client/reports" },
  ],
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      role="navigation"
      aria-label="Client sidebar navigation"
      tabIndex={0}
      className="w-64 bg-gray-900 text-white flex flex-col"
    >
      <div className="p-4 font-bold text-lg border-b border-gray-700">
        Flemmo Hub
      </div>
      <nav className="flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`block px-4 py-2 hover:bg-gray-700 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
