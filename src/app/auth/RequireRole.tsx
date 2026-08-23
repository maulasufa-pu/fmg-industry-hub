// src/app/auth/RequireRole.tsx (SERVER)
import { notFound, redirect } from "next/navigation";
import { getServerAuthContext } from "@/lib/auth/server";
import type { UserRole } from "@/lib/roles";

export default async function RequireRole({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const auth = await getServerAuthContext();
  const role = auth?.effectiveRole ?? "guest";
  if (role === "guest") redirect("/login");
  return allow.includes(role) ? <>{children}</> : notFound(); 
}
