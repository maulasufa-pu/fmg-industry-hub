"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { label: "🏠 Dashboard", href: "/client/dashboard" },
    { label: "🎵 Projects", href: "/client/projects" },
    { label: "💳 Invoices", href: "/client/invoices" },
    { label: "📢 Publishing", href: "/client/publishing" },
    { label: "📊 Reports", href: "/client/reports" },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-4 font-bold text-lg border-b border-gray-700">
        Flemmo Hub
      </div>
      <nav className="flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-4 py-2 hover:bg-gray-700 transition ${
              pathname === item.href ? "bg-gray-800" : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
