// src/app/auth/RequireRole.tsx (SERVER)
import { notFound, redirect } from "next/navigation";
import { getEffectiveRole } from "@/lib/roles/effective";
import type { UserRole } from "@/lib/roles";

export default async function RequireRole({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const role = await getEffectiveRole();
  if (role === "guest") redirect("/login");
  return allow.includes(role) ? <>{children}</> : notFound(); // atau redirect("/403")
}