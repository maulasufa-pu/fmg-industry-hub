import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";

type JsonOk = { ok: true };

export async function POST(req: Request) {
  try {
    if (!isSameOriginRequest(req)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const auth = await requireAuthenticatedRequest(req);
    const rate = consumeRateLimit(req, "owner-bootstrap", 5, 60 * 60_000, auth.user.id);
    if (!rate.allowed) return NextResponse.json({ error: "Too many bootstrap attempts" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });

    const expected = process.env.OWNER_BOOTSTRAP_CODE ?? "";
    const { code } = (await req.json().catch(() => ({}))) as { code?: string };
    const submitted = code ?? "";
    const validCode = expected.length >= 32 && submitted.length === expected.length && timingSafeEqual(Buffer.from(submitted), Buffer.from(expected));
    if (!validCode) return NextResponse.json({ error: "Invalid code" satisfies string }, { status: 403 });

    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });

  const { error: ownersErr, count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("main_role", "owner");

  if (ownersErr) {
    return NextResponse.json({ error: `DB error: ${String(ownersErr.message ?? ownersErr)}` }, { status: 500 });
  }
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "Owner already exists" satisfies string }, { status: 409 });
  }

  const userId = auth.user.id;

  const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "owner" },
  });
  if (updErr) {
    return NextResponse.json({ error: "Unable to initialize owner account" }, { status: 500 });
  }

  const { error: profErr } = await admin
    .from("profiles")
    .update({ main_role: "owner" })
    .eq("id", userId);
  if (profErr) {
    await admin.auth.admin.updateUserById(userId, { app_metadata: { role: "client" } });
    return NextResponse.json({ error: "Unable to initialize owner account" }, { status: 500 });
  }

  return NextResponse.json({ ok: true } satisfies JsonOk);
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to initialize owner account" }, { status: 500 });
  }
}
