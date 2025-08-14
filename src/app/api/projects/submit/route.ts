// app/api/projects/submit/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/** ---------- utils ---------- */
const idr = (n: number) => `IDR ${n.toLocaleString("id-ID")}`;
const toDateStr = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const clampInt = (n: number) => Math.max(0, Math.round(n));
const isYmd = (s?: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** ---------- schema ---------- */
const ServiceSchema = z.object({
  key: z.string().min(1),
  price: z.number().finite().nonnegative(),
  label: z.string().min(1),
  isSubscription: z.boolean().optional(),
});
const BundleSchema = z.object({
  label: z.string().min(1),
  bundlePrice: z.number().finite().nonnegative(),
  includes: z.array(z.string().min(1)).min(1),
});

const PayloadSchema = z.object({
  songTitle: z.string().min(1),
  artistName: z.string().default("").optional(),
  genre: z.string().default("").optional(),
  subGenre: z.string().default("").optional(),
  description: z.string().default("").optional(),
  selectedServices: z.array(ServiceSchema).default([]),
  bundle: BundleSchema.nullable().optional(),
  startDate: z.string().nullable().optional(),   // "YYYY-MM-DD"
  deadline: z.string().nullable().optional(),    // "YYYY-MM-DD"
  deliveryFormat: z.array(z.string()).optional(),
  referenceLinks: z.string().optional(),         // newline separated
  paymentPlan: z.enum(["upfront", "half", "milestone"]),
  ndaRequired: z.boolean().optional(),
  preferredEngineerId: z.string().uuid().nullable().optional(),
  total: z.number().finite().nonnegative(),
});

/** ---------- handler ---------- */
export async function POST(req: Request) {
  try {
    // env guard
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase envs" },
        { status: 500 }
      );
    }

    // auth (session user via cookies)
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: auth } = await supabase.auth.getUser();
    const authHeader = req.headers.get("Authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    let uid: string | null = null;

    if (bearer) {
      // verifikasi token langsung (tanpa cookies)
      const svc = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${bearer}` } },
      });
      const { data: u } = await svc.auth.getUser();
      uid = u.user?.id ?? null;
    } else {
      // fallback ke cookies (kalau ada)
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      const { data: u } = await supabase.auth.getUser();
      uid = u.user?.id ?? null;
    }

    if (!uid) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // validate body
    const raw = await req.json().catch(() => null);
    if (!raw) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    const body = PayloadSchema.parse(raw);

    // sanitize dates
    const startDate = isYmd(body.startDate ?? undefined) ? body.startDate : null;
    const deadline = isYmd(body.deadline ?? undefined) ? body.deadline : null;

    // build human description
    const serviceLines = body.selectedServices.map(
      (s) => `- ${s.label}${s.isSubscription ? " (subscription)" : ""} — ${idr(s.price)}`
    );
    const bundleLine = body.bundle
      ? `Bundle: ${body.bundle.label} — ${idr(body.bundle.bundlePrice)}`
      : null;

    const desc = [
      body.description?.trim(),
      "",
      "— Requested Services —",
      ...(bundleLine ? [bundleLine] : []),
      ...serviceLines,
      "",
      `Total Estimate: ${idr(body.total)}`,
      "",
      "— Preferences —",
      startDate ? `Start: ${startDate}` : null,
      deadline ? `Deadline: ${deadline}` : null,
      body.deliveryFormat?.length ? `Delivery: ${body.deliveryFormat.join(", ")}` : null,
      body.referenceLinks?.trim() ? `Refs:\n${body.referenceLinks.trim()}` : null,
      `Payment Plan: ${body.paymentPlan}`,
      `NDA Required: ${body.ndaRequired ? "Yes" : "No"}`,
      "",
      `Song Title: ${body.songTitle || "-"}`,
      `Artist: ${body.artistName || "-"}`,
      `Genre: ${body.genre || "-"}${body.subGenre ? " / " + body.subGenre : ""}`,
      body.preferredEngineerId ? `Preferred Engineer: ${body.preferredEngineerId}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // service-role client (no session)
    const srv = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    /** 1) projects */
    type ProjectInsertResult = { project_id: string };
    const { data: proj, error: projErr } = await srv
      .from("projects")
      .insert({
        client_id: uid,
        title: body.songTitle || "(Untitled)",
        artist_name: body.artistName || null,
        genre: body.genre || null,
        stage: "drafting",
        status: "pending",
        description: desc,
        budget_amount: clampInt(body.total) || null,
        budget_currency: "IDR",
      })
      .select("project_id")
      .single<ProjectInsertResult>();
    if (projErr) throw projErr;
    const projectId = proj.project_id;

    /** 2) milestones (DP, First Draft, Final Mix, Mastering) */
    const start = startDate ? new Date(startDate) : new Date();
    const end = deadline ? new Date(deadline) : null;
    const mid = end
      ? new Date(start.getTime() + Math.floor((end.getTime() - start.getTime()) * 0.5))
      : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
    const near = end
      ? new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(start.getTime() + 21 * 24 * 60 * 60 * 1000);

    const msRows = [
      { title: "DP (Down Payment)", due_date: toDateStr(start), order_no: 1 },
      { title: "First Draft",       due_date: toDateStr(mid),   order_no: 2 },
      { title: "Final Mix",         due_date: toDateStr(near),  order_no: 3 },
      { title: "Mastering",         due_date: toDateStr(end),   order_no: 4 },
    ].map((m) => ({ ...m, project_id: projectId, status: "pending" as const }));

    type MilestoneRow = { id: string; title: string; order_no: number };
    const { data: msData, error: msErr } = await srv
      .from("project_milestones")
      .insert(msRows)
      .select("id,title,order_no")
      .returns<MilestoneRow[]>();
    if (msErr) throw msErr;

    const msByTitle = new Map<string, string>(
      (msData ?? []).map((m) => [m.title, m.id])
    );

    /** 3) reference links */
    const lines = (body.referenceLinks || "")
      .split(/\r?\n/)
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (lines.length) {
      const refRows = lines.map((u) => ({ project_id: projectId, url: u }));
      const { error: refErr } = await srv.from("project_reference_links").insert(refRows);
      if (refErr) throw refErr;
    }

    /** 4) preferred engineer → assignments (optional) */
    if (body.preferredEngineerId) {
      const { error: asgErr } = await srv.from("assignments").insert({
        project_id: projectId,
        engineer_id: body.preferredEngineerId,
        assigned_by: uid,
      });
      if (asgErr) throw asgErr;
    }

    /** 5) payment schedules (berdasarkan plan) */
    const addSched = (
      label: string,
      percent: number,
      linkTitle: string | null,
      due: Date | null
    ) => ({
      project_id: projectId,
      milestone_id: linkTitle ? msByTitle.get(linkTitle) ?? null : null,
      label,
      amount: clampInt((body.total * percent) / 100),
      currency: "IDR",
      due_date: toDateStr(due),
      status: "unpaid" as const,
    });

    let schedules: Array<ReturnType<typeof addSched>> = [];
    if (body.paymentPlan === "upfront") {
      schedules = [addSched("Full Payment", 100, "DP (Down Payment)", start)];
    } else if (body.paymentPlan === "half") {
      schedules = [
        addSched("DP 50%", 50, "DP (Down Payment)", start),
        addSched("Pelunasan 50%", 50, "Mastering", end),
      ];
    } else {
      schedules = [
        addSched("DP 25%", 25, "DP (Down Payment)", start),
        addSched("Pembayaran 50% (Final Mix)", 50, "Final Mix", near),
        addSched("Pelunasan 25% (Mastering)", 25, "Mastering", end),
      ];
    }

    type PaymentScheduleRow = { id: string; label: string };
    let createdSchedules: PaymentScheduleRow[] = [];
    if (schedules.length) {
      const { data: schData, error: schErr } = await srv
        .from("payment_schedules")
        .insert(schedules)
        .select("id,label")
        .returns<PaymentScheduleRow[]>();
      if (schErr) throw schErr;
      createdSchedules = schData ?? [];
    }

    return NextResponse.json(
      {
        project_id: projectId,
        milestones: msData,
        payment_schedules: createdSchedules,
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error("[/api/projects/submit] error:", e);
    const msg =
      typeof e === "object" &&
      e !== null &&
      "message" in e &&
      typeof (e as { message?: unknown }).message === "string"
        ? (e as { message: string }).message
        : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
