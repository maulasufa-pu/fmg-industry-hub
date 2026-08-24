import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { catalogMoney, catalogTotalFromVerifiedRows } from "@/lib/projects/catalog-pricing";
import { NEW_CUSTOMER_PROMO_BUNDLE_KEY } from "@/lib/arrangement";

export const dynamic = "force-dynamic";

const ServiceSelectionSchema = z.object({ key: z.string().trim().min(1).max(80) });
const BundleSelectionSchema = z.object({ key: z.string().trim().min(1).max(80) });

const PayloadSchema = z.object({
  songTitle: z.string().trim().min(1).max(200),
  artistName: z.string().trim().min(1).max(160),
  albumTitle: z.string().trim().max(200).optional().default(""),
  genre: z.string().trim().max(100).optional().default(""),
  subGenre: z.string().trim().max(100).optional().default(""),
  description: z.string().trim().min(150).max(8_000),
  selectedServices: z.array(ServiceSelectionSchema).max(50).default([]),
  bundle: BundleSelectionSchema.nullable().optional(),
  startDate: z.string().date().nullable().optional(),
  deadline: z.string().date().nullable().optional(),
  deliveryFormat: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  referenceLinks: z.string().max(4_000).optional().default(""),
  paymentPlan: z.enum(["upfront", "half", "milestone"]),
  ndaRequired: z.boolean().optional().default(false),
  preferredEngineerId: z.string().uuid().nullable().optional(),
  status: z.literal("requested").optional(),
});

type ServiceRow = { id: string; service_key: string; label: string; price: number | string };
type BundleRow = { id: string; bundle_key: string; label: string; bundle_price: number | string; promo_type: string; promo_value: number | string; promo_start: string | null; promo_end: string | null };

async function idrPerUsd(): Promise<number> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD", { next: { revalidate: 3600 } });
    const data = response.ok ? await response.json() : null;
    const rate = Number(data?.rates?.IDR);
    return Number.isFinite(rate) && rate > 0 ? rate : 15750;
  } catch {
    return 15750;
  }
}

function parseReferenceLinks(raw: string): string[] | null {
  const links = raw.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  if (links.length > 10) return null;
  return links.every((link) => z.string().url().safeParse(link).success) ? links : null;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });

    const auth = await requireAuthenticatedRequest(request);
    const rate = consumeRateLimit(request, "project-submit", 10, 60 * 60_000, auth.user.id);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many project requests" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    }

    const parsed = PayloadSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid project request" }, { status: 400 });
    }
    const body = parsed.data;
    if (body.startDate && body.deadline && body.deadline < body.startDate) {
      return NextResponse.json({ error: "Deadline cannot be before the start date" }, { status: 400 });
    }

    const references = parseReferenceLinks(body.referenceLinks);
    if (!references) return NextResponse.json({ error: "Reference links must be valid URLs (maximum 10)" }, { status: 400 });

    const parsedKey = z.string().uuid().safeParse(request.headers.get("idempotency-key"));
    if (!parsedKey.success) return NextResponse.json({ error: "A valid Idempotency-Key header is required" }, { status: 400 });

    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });

    const selectedKeys = [...new Set(body.selectedServices.map((item) => item.key))];
    const selectedResult = selectedKeys.length
      ? await admin.from("services").select("id,service_key,label,price").in("service_key", selectedKeys).eq("is_active", true).returns<ServiceRow[]>()
      : { data: [] as ServiceRow[], error: null };
    if (selectedResult.error) throw new Error("Unable to verify the service catalog");
    if ((selectedResult.data ?? []).length !== selectedKeys.length) {
      return NextResponse.json({ error: "One or more selected services are unavailable" }, { status: 400 });
    }

    let bundle: BundleRow | null = null;
    let bundledServiceIds = new Set<string>();
    let bundledRows: ServiceRow[] = [];
    if (body.bundle) {
      const { data, error } = await admin.from("bundles").select("id,bundle_key,label,bundle_price,promo_type,promo_value,promo_start,promo_end").eq("bundle_key", body.bundle.key).eq("is_active", true).maybeSingle<BundleRow>();
      if (error) throw new Error("Unable to verify the selected bundle");
      if (!data) return NextResponse.json({ error: "The selected bundle is unavailable" }, { status: 400 });
      bundle = data;

      if (bundle.bundle_key === NEW_CUSTOMER_PROMO_BUNDLE_KEY) {
        const now = new Date();
        if ((bundle.promo_start && now < new Date(bundle.promo_start)) || (bundle.promo_end && now > new Date(bundle.promo_end))) {
          return NextResponse.json({ error: "This promotion is not currently available" }, { status: 400 });
        }
        const { count, error: historyError } = await admin
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("client_id", auth.user.id);
        if (historyError) throw new Error("Unable to verify promotion eligibility");
        if ((count ?? 0) > 0) return NextResponse.json({ error: "This promotion is only available to new customers" }, { status: 409 });
      }

      const { data: bundleItems, error: bundleItemsError } = await admin.from("bundle_items").select("service_id").eq("bundle_id", bundle.id);
      if (bundleItemsError) throw new Error("Unable to verify the selected bundle");
      bundledServiceIds = new Set((bundleItems ?? []).map((item) => item.service_id));
      if (bundledServiceIds.size > 0) {
        const { data: services, error: bundledError } = await admin.from("services").select("id,service_key,label,price").in("id", [...bundledServiceIds]).eq("is_active", true).returns<ServiceRow[]>();
        if (bundledError || (services ?? []).length !== bundledServiceIds.size) {
          return NextResponse.json({ error: "The selected bundle contains unavailable services" }, { status: 400 });
        }
        bundledRows = services ?? [];
      }
    }

    const selectedRows = selectedResult.data ?? [];
    if (!bundle && selectedRows.length === 0) return NextResponse.json({ error: "Select at least one service or bundle" }, { status: 400 });

    if (body.preferredEngineerId) {
      const { data: engineer } = await admin.from("profiles").select("main_role,staff_role").eq("id", body.preferredEngineerId).maybeSingle();
      const validEngineer = engineer && (engineer.main_role === "admin" || engineer.main_role === "owner" || (Array.isArray(engineer.staff_role) && engineer.staff_role.includes("engineer")));
      if (!validEngineer) return NextResponse.json({ error: "Preferred engineer is unavailable" }, { status: 400 });
    }

    const verifiedBundlePrice = bundle?.bundle_key === NEW_CUSTOMER_PROMO_BUNDLE_KEY
      ? Number(bundle.promo_value) / await idrPerUsd()
      : bundle?.bundle_price ?? null;
    const total = catalogTotalFromVerifiedRows(verifiedBundlePrice, selectedRows, bundledServiceIds);
    if (total <= 0) return NextResponse.json({ error: "The selected catalog has no valid price" }, { status: 400 });

    const itemMap = new Map<string, ServiceRow>();
    for (const service of [...bundledRows, ...selectedRows]) itemMap.set(service.id, service);
    const orderItems = [...itemMap.values()].map((service) => ({
      service_id: service.id,
      service_key: service.service_key,
      label: service.label,
      unit_price: bundledServiceIds.has(service.id) ? 0 : catalogMoney(service.price),
      currency: "USD",
      included_in_bundle: bundledServiceIds.has(service.id),
    }));

    const { data: projectId, error: submitError } = await admin.rpc("submit_project_request", {
      p_user_id: auth.user.id,
      p_idempotency_key: parsedKey.data,
      p_project: {
        title: body.songTitle,
        artist_name: body.artistName,
        album_title: body.albumTitle || null,
        genre: body.genre || null,
        sub_genre: body.subGenre || null,
        description: body.description,
        budget_amount: total,
        budget_currency: "USD",
        payment_plan: body.paymentPlan,
        start_date: body.startDate || null,
        deadline: body.deadline || null,
        delivery_format: body.deliveryFormat,
        nda_required: body.ndaRequired,
        preferred_engineer_id: body.preferredEngineerId || null,
        order_bundle_id: bundle?.id || null,
      },
      p_items: orderItems,
      p_references: references,
    });

    if (submitError) {
      if (/submit_project_request|schema cache|function/i.test(submitError.message)) {
        return NextResponse.json({ error: "Order database migration has not been applied" }, { status: 503 });
      }
      throw new Error("Unable to create the project request");
    }

    return NextResponse.json({
      project_id: projectId,
      invoice_id: null,
      status: "requested",
      quote_status: "pending_review",
      catalog_total: total,
      currency: "USD",
    }, { status: 201 });
  } catch (error: unknown) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: "Unable to submit project request" }, { status: 500 });
  }
}
