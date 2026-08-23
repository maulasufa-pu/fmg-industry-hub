// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { apiAuthErrorResponse, requireAdminRequest } from "@/lib/auth/server";

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
  } catch (error) {
    return apiAuthErrorResponse(error) ?? NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
  // ... logic
  return NextResponse.json({ ok: true });
}
