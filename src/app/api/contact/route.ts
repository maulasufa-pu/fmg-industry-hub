import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit, isSameOriginRequest, requestIp } from "@/lib/security/request";
import { ContactSchema, type ContactInput } from "@/lib/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hashIp(ip: string): string {
  const salt = process.env.CONTACT_IP_HASH_SALT || process.env.NEXT_PUBLIC_APP_URL || "fmg-contact";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

async function sendContactEmail(input: ContactInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "FMG Website <noreply@flemmomusic.com>";
  if (!apiKey || !to) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: input.email,
      subject: `[FMG Website] ${input.subject}`,
      text: [
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Company: ${input.company || "-"}`,
        `Reason: ${input.reason}`,
        "",
        input.message,
      ].join("\n"),
    }),
    cache: "no-store",
  });
  return response.ok;
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const rate = consumeRateLimit(request, "contact", 5, 60 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  const parsed = ContactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the contact form fields." }, { status: 400 });
  }

  const input = parsed.data;
  const admin = getSupabaseAdminClient();
  let stored = false;
  if (admin) {
    const { error } = await admin.from("contact_inquiries").insert({
      name: input.name,
      email: input.email.toLowerCase(),
      company: input.company || null,
      reason: input.reason,
      subject: input.subject,
      message: input.message,
      status: "new",
      ip_hash: hashIp(requestIp(request)),
      user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
    });
    stored = !error;
  }

  let emailed = false;
  try {
    emailed = await sendContactEmail(input);
  } catch {
    emailed = false;
  }

  if (!stored && !emailed) {
    return NextResponse.json(
      { error: "Contact delivery is temporarily unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
