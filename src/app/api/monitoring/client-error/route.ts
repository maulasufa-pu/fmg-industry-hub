import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";

const schema = z.object({ name: z.string().trim().min(1).max(100), message: z.string().trim().min(1).max(1000), digest: z.string().max(200).optional(), path: z.string().max(500).optional() });

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) return NextResponse.json({ ok: false }, { status: 403 });
    const rate = consumeRateLimit(request, "client-error", 10, 60_000);
    if (!rate.allowed) return NextResponse.json({ ok: false }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    const input = schema.parse(await request.json());
    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ ok: false }, { status: 503 });
    const { error } = await admin.from("app_error_events").insert({ error_name: input.name, message: input.message, digest: input.digest ?? null, path: input.path ?? null, user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
