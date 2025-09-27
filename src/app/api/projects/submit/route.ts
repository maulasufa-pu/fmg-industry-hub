// app/api/projects/submit/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const idr = (n: number) => `IDR ${n.toLocaleString("id-ID")}`;
const toDateStr = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const clampInt = (n: number) => Math.max(0, Math.round(n));
const isYmd = (s?: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};
const fallbackInvoiceNo = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `INV-${y}${m}${dd}-${hh}${mm}${ss}`;
};

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
  albumTitle: z.string().default("").optional(),
  genre: z.string().default("").optional(),
  subGenre: z.string().default("").optional(),
  description: z.string().default("").optional(),
  selectedServices: z.array(ServiceSchema).default([]),
  bundle: BundleSchema.nullable().optional(),
  startDate: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  deliveryFormat: z.array(z.string()).optional(),
  referenceLinks: z.string().optional(),
  paymentPlan: z.enum(["upfront", "half", "milestone"]),
  total: z.number().finite().nonnegative(),
  status: z.enum([
    "requested","pending","in_progress","revision","approved","published","archived","cancelled"
  ]).optional(),
});

export async function GET(req: Request) {
  const h = req.headers.get("Authorization");
  return NextResponse.json({ hasAuth: !!h, authPrefix: h?.slice(0, 10) ?? null });
}

export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !serviceKey || !anonKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase envs" },
        { status: 500 }
      );
    }

    const cookieStore = cookies();
    const supabaseCookie = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabaseCookie.auth.getUser(); // keep cookie session warm

    const authHeader = req.headers.get("Authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const srv = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const svcBearer = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: bearer ? { headers: { Authorization: `Bearer ${bearer}` } } : undefined,
    });

    let uid: string | null = null;
    if (bearer) {
      const { data: u } = await svcBearer.auth.getUser();
      uid = u.user?.id ?? null;
    } else {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: u } = await supabase.auth.getUser();
      uid = u.user?.id ?? null;
    }
    if (!uid) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const raw = await req.json().catch(() => null);
    if (!raw) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    const body = PayloadSchema.parse(raw);

    const startDate = isYmd(body.startDate ?? undefined) ? body.startDate : null;
    const deadline = isYmd(body.deadline ?? undefined) ? body.deadline : null;

    const rawDescription = body.description?.trim() || null;

    type ProjectInsertResult = { project_id: string };
    const { data: proj, error: projErr } = await srv
      .from("projects")
      .insert({
        client_id: uid,
        title: body.songTitle || "(Untitled)",
        artist_name: body.artistName || null,
        album_title: body.albumTitle || null,
        genre: body.genre || null,
        sub_genre: body.subGenre || null,
        stage: "drafting",
        status: body.status ?? "requested",
        description: rawDescription,
        budget_amount: clampInt(body.total) || null,
        budget_currency: "IDR",
        payment_plan: body.paymentPlan,
        start_date: startDate,
        deadline: deadline,
        delivery_format: body.deliveryFormat ?? null,
      })
      .select("project_id")
      .single<ProjectInsertResult>();
    if (projErr) throw projErr;
    const projectId = proj.project_id;

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

    const lines = (body.referenceLinks || "")
      .split(/\r?\n/)
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (lines.length) {
      const refRows = lines.map((u) => ({ project_id: projectId, url: u }));
      const { error: refErr } = await srv.from("project_reference_links").insert(refRows);
      if (refErr) throw refErr;
    }

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

    type ClientRow = { id: string; name: string | null; email: string | null };
    const { data: clientRow } = await srv
      .from("clients")
      .select("id,name,email")
      .eq("id", uid)
      .maybeSingle<ClientRow>();

    let clientName: string | null = clientRow?.name ?? null;
    let clientEmail: string | null = clientRow?.email ?? null;

    if (!clientName || !clientEmail) {
      const { data: adminUser } = await srv.auth.admin.getUserById(uid);
      const meta = (adminUser?.user?.user_metadata ?? {}) as Record<string, unknown>;
      const maybeFullName = typeof meta.full_name === "string" ? meta.full_name : null;
      clientName = clientName ?? maybeFullName ?? null;
      clientEmail = clientEmail ?? (adminUser?.user?.email ?? null);
    }

    let invoiceNo = fallbackInvoiceNo();
    const rpc = await srv.rpc("next_invoice_no");
    if (!rpc.error && typeof rpc.data === "string" && rpc.data.trim()) {
      invoiceNo = rpc.data;
    }

    const today = new Date();
    const issueDate = toDateStr(today);
    const dueDate = toDateStr(addDays(today, 14));

    type InvoiceInsertResult = { id: string };
    const baseInvoice = {
      invoice_no: invoiceNo,
      client_id: uid,
      client_name: clientName,
      client_email: clientEmail,
      currency: "IDR",
      status: "unpaid" as const,
      issue_date: issueDate,
      due_date: dueDate,
    };
    let invoiceId: string | null = null;

    {
      const { data: inv1, error: invErr1 } = await srv
        .from("invoices")
        .insert({ ...baseInvoice, project_id: projectId })
        .select("id")
        .single<InvoiceInsertResult>();
      if (!invErr1 && inv1?.id) {
        invoiceId = inv1.id;
      } else {
        const { data: inv2, error: invErr2 } = await srv
          .from("invoices")
          .insert(baseInvoice)
          .select("id")
          .single<InvoiceInsertResult>();
        if (invErr2 || !inv2?.id) {
          throw new Error(invErr2?.message ?? invErr1?.message ?? "Failed to create invoice");
        }
        invoiceId = inv2.id;
      }
    }

    type ServiceMapRow = { id: string; service_key: string };
    const uniqueKeys = Array.from(new Set(body.selectedServices.map((s) => s.key)));
    const { data: svcRows, error: svcErr } = await srv
      .from("services")
      .select("id,service_key")
      .in("service_key", uniqueKeys)
      .returns<ServiceMapRow[]>();
    if (svcErr) {
      await srv.from("invoices").delete().eq("id", invoiceId);
      throw svcErr;
    }
    const keyToId = new Map<string, string>((svcRows ?? []).map((r) => [r.service_key, r.id]));

    type InvoiceItemInsert = {
      invoice_id: string;
      service_id: string | null;
      description: string;
      qty: number;
      unit_price: number;
      position: number;
    };
    const items: InvoiceItemInsert[] = [];
    let pos = 0;

    if (body.bundle) {
      items.push({
        invoice_id: invoiceId!,
        service_id: null,
        description: `Bundle: ${body.bundle.label}`,
        qty: 1,
        unit_price: clampInt(body.bundle.bundlePrice),
        position: pos++,
      });
    }

    for (const s of body.selectedServices) {
      items.push({
        invoice_id: invoiceId!,
        service_id: keyToId.get(s.key) ?? null,
        description: s.label,
        qty: 1,
        unit_price: clampInt(s.price),
        position: pos++,
      });
    }

    if (items.length) {
      const { error: itErr } = await srv.from("invoice_items").insert(items).select("invoice_id");
      if (itErr) {
        await srv.from("invoices").delete().eq("id", invoiceId);
        throw itErr;
      }
    }

    await srv.from("projects").update({ invoice_id: invoiceId }).eq("project_id", projectId);

    return NextResponse.json(
      {
        project_id: projectId,
        invoice_id: invoiceId,
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