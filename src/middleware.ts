// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Hanya auto-redirect root panel (tidak ada cek session di Edge!)
  if (path === "/admin") { url.pathname = "/admin/dashboard"; return NextResponse.redirect(url); }
  if (path === "/client") { url.pathname = "/client/dashboard"; return NextResponse.redirect(url); }

  return NextResponse.next();
}

// Matcher cukup untuk root panel saja (atau hapus sekalian kalau tak perlu)
export const config = {
  matcher: ["/admin", "/client"],
};
