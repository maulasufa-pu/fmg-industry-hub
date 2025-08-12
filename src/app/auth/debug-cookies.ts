// src/app/auth/debug-cookies/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function GET() {
  const c = await cookies();
  return NextResponse.json(c.getAll().map(x => ({ name: x.name })));
}
