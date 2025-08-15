// src/app/admin/ui/AdminSidebarSection.tsx  (CLIENT)
"use client";
import Link from "next/link";
import { Layout, Clipboard, File, Calendar, Document, Users } from "@/icons"; // pakai ikonmu

export default function AdminSidebarSection() {
  const item = (href: string, label: string, Icon: React.FC<React.SVGProps<SVGSVGElement>>) => (
    <Link href={href} className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-100">
      <Icon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
      <span className="text-gray-800">{label}</span>
    </Link>
  );
  return (
    <aside className="sticky top-0 z-10 h-[100svh] w-60 shrink-0 border-r bg-white p-3">
      <div className="mb-2 px-3 text-xs font-semibold uppercase text-gray-500">Admin Panel</div>
      <nav className="flex flex-col gap-1">
        {item("/admin/dashboard", "Dashboard", Layout)}
        {item("/admin/projects", "Projects", Clipboard)}
        {item("/admin/invoices", "Invoices", File)}
        {item("/admin/meetings", "Meetings", Calendar)}
        {item("/admin/publishing", "Publishing", Document)}
        {/* Halaman Owner-only ditunjukkan di UI pun ok, server/middleware tetap batasi */}
        {item("/admin/users", "Users (Owner)", Users)}
      </nav>
    </aside>
  );
}
