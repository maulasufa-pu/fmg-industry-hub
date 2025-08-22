// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server"; // lihat step 2

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  // opsional: support ?next=/admin/...
  const nextParam = url.searchParams.get("next") || url.searchParams.get("redirectedFrom");
  const fallback = "/client/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login", url));
  }

  const supabase = getSupabaseServerClient();

  // Tukar code → session dan SET-COOKIE (HttpOnly) di domain kamu
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?err=oauth", url));
  }

  // (Opsional) tentukan tujuan berdasar role jika mau:
  const { data: { user } } = await supabase.auth.getUser();
  const { data: prof } = await supabase.from("profiles").select("main_role,staff_role").eq("id", user?.id!).maybeSingle();
  const isAdminLike = !!(prof && (prof.main_role === "owner" || prof.main_role === "admin" || (Array.isArray(prof.staff_role) && prof.staff_role.some(r => r === "admin" || r === "owner"))));
  const defaultDest = isAdminLike ? "/admin/dashboard" : "/client/dashboard";

  // Pakai nextParam kalau valid dan segmennya cocok, kalau tidak jatuh ke fallback
  let dest = fallback;
  if (nextParam) {
    try {
      const u = new URL(nextParam, url.origin);
      if (u.pathname.startsWith("/")) dest = u.pathname + u.search + u.hash;
    } catch { /* ignore */ }
  }

  return NextResponse.redirect(new URL(dest, url));
}
