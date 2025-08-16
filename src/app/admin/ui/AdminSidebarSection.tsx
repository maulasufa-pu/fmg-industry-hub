"use client";

import Link from "next/link";
import { Layout, Clipboard, File, Calendar, Document, Users } from "@/icons";
import type { UserRole } from "@/lib/roles";

// keep in sync with server roles
type NavItem = {
  href: string;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
};

type Props = { role: UserRole };

const MENU: Partial<Record<UserRole, NavItem[]>> = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", Icon: Layout },
    { href: "/admin/projects", label: "Projects", Icon: Clipboard },
    { href: "/admin/invoices", label: "Invoices", Icon: File },
    { href: "/admin/meetings", label: "Meetings", Icon: Calendar },
    { href: "/admin/publishing", label: "Publishing", Icon: Document },
    { href: "/admin/users", label: "Users (Owner)", Icon: Users },
  ],
  owner: [
    { href: "/admin/dashboard", label: "Dashboard", Icon: Layout },
    { href: "/admin/projects", label: "Projects", Icon: Clipboard },
    { href: "/admin/invoices", label: "Invoices", Icon: File },
    { href: "/admin/meetings", label: "Meetings", Icon: Calendar },
    { href: "/admin/publishing", label: "Publishing", Icon: Document },
    { href: "/admin/users", label: "Users", Icon: Users },
  ],
  anr: [
    { href: "/admin/anr/queue", label: "My Queue", Icon: Clipboard },
    { href: "/admin/anr/meetings", label: "Meetings", Icon: Calendar },
    { href: "/admin/anr/qc", label: "QC & Revisions", Icon: Document },
    { href: "/admin/anr/projects", label: "Projects", Icon: Layout },
  ],
  composer: [
    { href: "/admin/composer/assigned", label: "Assigned Tracks", Icon: Clipboard },
    { href: "/admin/composer/drafts", label: "Drafts", Icon: File },
    { href: "/admin/composer/uploads", label: "Uploads", Icon: Document },
  ],
  producer: [
    { href: "/admin/producer/board", label: "Production Board", Icon: Layout },
    { href: "/admin/producer/sessions", label: "Sessions", Icon: Calendar },
    { href: "/admin/producer/deliverables", label: "Deliverables", Icon: File },
  ],
  audio_engineer: [
    { href: "/admin/engineer/queue", label: "Mix/Master Queue", Icon: Clipboard },
    { href: "/admin/engineer/sessions", label: "Sessions", Icon: Calendar },
    { href: "/admin/engineer/renders", label: "Renders", Icon: File },
  ],
};

export default function AdminSidebarSection({ role }: Props): React.JSX.Element {
  const item = (n: NavItem) => (
    <Link
      key={n.href}
      href={n.href}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-100"
    >
      <n.Icon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
      <span className="text-gray-800">{n.label}</span>
    </Link>
  );

  const items = MENU[role] ?? [];

  return (
    <aside className="sticky top-0 z-10 h-[100svh] w-60 shrink-0 border-r bg-white p-3">
      <div className="mb-2 px-3 text-xs font-semibold uppercase text-gray-500">Admin Panel</div>
      <nav className="flex flex-col gap-1">{items.map(item)}</nav>
    </aside>
  );
}
