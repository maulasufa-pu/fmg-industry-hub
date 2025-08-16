// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { getEffectiveRole } from "@/lib/roles/effective";
import { isAdminLike } from "@/lib/roles";

export async function GET() {
  const role = await getEffectiveRole();
  if (!isAdminLike(role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // ... logic
  return NextResponse.json({ ok: true });
}
