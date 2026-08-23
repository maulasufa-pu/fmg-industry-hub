// src/app/api/verify-hcaptcha/route.ts
import { NextRequest, NextResponse } from "next/server";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";

type VerifyPayload = { token?: string };
type HCaptchaVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: readonly string[];
  credit?: boolean;
  score?: number;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOriginRequest(req)) return NextResponse.json({ ok: false, error: "Invalid request origin" }, { status: 403 });
  const rate = consumeRateLimit(req, "hcaptcha-verify", 20, 10 * 60_000);
  if (!rate.allowed) return NextResponse.json({ ok: false, error: "Too many verification attempts" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const secret = process.env.HCAPTCHA_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "HCAPTCHA_SECRET not configured" },
      { status: 500 }
    );
  }

  const body = (await req.json()) as VerifyPayload;
  if (!body.token) {
    return NextResponse.json(
      { ok: false, error: "Missing hCaptcha token" },
      { status: 400 }
    );
  }

  const remoteip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

  const form = new URLSearchParams();
  form.set("response", body.token);
  form.set("secret", secret);
  if (remoteip) form.set("remoteip", remoteip);

  const resp = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });

  const data = (await resp.json()) as HCaptchaVerifyResponse;
  if (!data.success) {
    const code = data["error-codes"]?.join(",") || "hcaptcha_failed";
    return NextResponse.json({ ok: false, error: code }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
