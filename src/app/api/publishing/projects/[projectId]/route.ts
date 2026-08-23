import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { validatePublishingMetadata } from "@/lib/publishing/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DSP_KEYS = ["spotify", "appleMusic", "youtubeMusic", "deezer", "tiktok", "instagram"] as const;
const StatusSchema = z.enum(["pending", "submitted", "live", "rejected", "takedown"]);
const MetadataSchema = z.object({
  action: z.literal("save_metadata"),
  metadata: z.object({
    isrc: z.string().trim().max(32).nullable(), upc: z.string().trim().max(32).nullable(),
    release_date: z.string().trim().max(20).nullable(), explicit: z.boolean(), label_name: z.string().trim().max(160).nullable(),
    copyright_c: z.string().trim().max(240).nullable(), copyright_p: z.string().trim().max(240).nullable(),
    language: z.string().trim().max(80).nullable(), primary_genre: z.string().trim().max(120).nullable(), sub_genre: z.string().trim().max(120).nullable(),
    artwork_path: z.string().trim().max(600).nullable(), artwork_url: z.string().trim().max(1000).nullable(),
    royalty_splits: z.array(z.object({ party: z.string().trim().min(1).max(160), percentage: z.number().min(0).max(100) })).max(50),
    platform_statuses: z.record(z.string(), z.object({ status: StatusSchema, url: z.string().url().nullable().or(z.literal("")) })),
  }),
});
const ActionSchema = z.discriminatedUnion("action", [
  MetadataSchema,
  z.object({ action: z.literal("validate") }),
  z.object({ action: z.literal("generate_isrc") }),
  z.object({ action: z.literal("submit"), distributors: z.array(z.enum(DSP_KEYS)).min(1).max(DSP_KEYS.length).default([...DSP_KEYS]) }),
  z.object({ action: z.literal("update_status"), distributor: z.enum(DSP_KEYS), status: StatusSchema, url: z.string().url().nullable().optional(), note: z.string().trim().max(500).optional() }),
  z.object({ action: z.literal("analytics_upsert"), platform: z.string().trim().min(2).max(80), period_start: z.string().date(), period_end: z.string().date(), streams: z.number().int().nonnegative(), listeners: z.number().int().nonnegative(), revenue_amount: z.number().nonnegative(), revenue_currency: z.string().trim().length(3).default("USD") }),
]);

function canManage(auth: Awaited<ReturnType<typeof requireAuthenticatedRequest>>) {
  return auth.isAdmin || auth.staffRoles.includes("publisher");
}

async function projectForActor(projectId: string, userId: string, isManager: boolean) {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Publishing service is not configured");
  const { data, error } = await admin.from("projects").select("*").eq("project_id", projectId).maybeSingle();
  if (error) throw error;
  if (!data || (!isManager && data.client_id !== userId)) return null;
  return data;
}

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const auth = await requireAuthenticatedRequest(request);
    const { projectId } = await params;
    const project = await projectForActor(projectId, auth.user.id, canManage(auth));
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const admin = getSupabaseAdminClient()!;
    const [{ data: logs }, { data: analytics }] = await Promise.all([
      admin.from("publishing_delivery_logs").select("id,action,distributor,status,error_message,attempt_count,created_at,updated_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(100),
      admin.from("publishing_analytics").select("id,platform,period_start,period_end,streams,listeners,revenue_amount,revenue_currency,source,synced_at").eq("project_id", projectId).order("period_end", { ascending: false }).limit(100),
    ]);
    return NextResponse.json({ project, logs: logs ?? [], analytics: analytics ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    return authResponse ?? NextResponse.json({ error: "Unable to load publishing operations" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    const auth = await requireAuthenticatedRequest(request);
    if (!canManage(auth)) return NextResponse.json({ error: "Publishing staff access required" }, { status: 403 });
    const rate = consumeRateLimit(request, "publishing-action", 40, 60_000, auth.user.id);
    if (!rate.allowed) return NextResponse.json({ error: "Too many publishing actions" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    const { projectId } = await params;
    const project = await projectForActor(projectId, auth.user.id, true);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const parsed = ActionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid publishing action", issues: parsed.error.issues }, { status: 400 });
    const admin = getSupabaseAdminClient()!;
    const input = parsed.data;

    if (input.action === "save_metadata") {
      const { error } = await admin.from("projects").update({ ...input.metadata, updated_at: new Date().toISOString() }).eq("project_id", projectId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (input.action === "generate_isrc") {
      const country = (process.env.ISRC_COUNTRY_CODE || "").toUpperCase().replace(/[^A-Z]/g, "");
      const registrant = (process.env.ISRC_REGISTRANT_CODE || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z0-9]{3}$/.test(registrant)) {
        return NextResponse.json({ error: "Configure a registered ISRC country and registrant code before generating codes." }, { status: 503 });
      }
      const year = String(new Date().getUTCFullYear()).slice(-2);
      let isrc = "";
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const candidate = `${country}${registrant}${year}${String(randomInt(0, 100000)).padStart(5, "0")}`;
        const { count } = await admin.from("projects").select("project_id", { count: "exact", head: true }).eq("isrc", candidate);
        if (!count) { isrc = candidate; break; }
      }
      if (!isrc) return NextResponse.json({ error: "Unable to reserve a unique ISRC" }, { status: 503 });
      const { error } = await admin.from("projects").update({ isrc }).eq("project_id", projectId);
      if (error) throw error;
      await admin.from("publishing_delivery_logs").insert({ project_id: projectId, action: "isrc_reserved", status: "accepted", request_payload: { isrc }, created_by: auth.user.id, attempt_count: 1 });
      return NextResponse.json({ ok: true, isrc });
    }

    const fresh = await projectForActor(projectId, auth.user.id, true);
    if (!fresh) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const validationErrors = validatePublishingMetadata(fresh);
    await admin.from("projects").update({ publishing_last_validated_at: new Date().toISOString(), publishing_validation_errors: validationErrors }).eq("project_id", projectId);
    if (input.action === "validate") return NextResponse.json({ ok: validationErrors.length === 0, errors: validationErrors }, { status: validationErrors.length ? 422 : 200 });

    if (input.action === "submit") {
      if (validationErrors.length) return NextResponse.json({ error: "Metadata validation failed", errors: validationErrors }, { status: 422 });
      const statuses = { ...(fresh.platform_statuses || {}) } as Record<string, { status: string; url: string | null }>;
      input.distributors.forEach((distributor) => { statuses[distributor] = { ...(statuses[distributor] || { url: null }), status: "submitted" }; });
      const { error } = await admin.from("projects").update({ platform_statuses: statuses, publishing_submission_status: "queued", stage: "distribution", updated_at: new Date().toISOString() }).eq("project_id", projectId);
      if (error) throw error;
      await admin.from("publishing_delivery_logs").insert(input.distributors.map((distributor) => ({ project_id: projectId, action: "delivery_submission", distributor, status: "queued", request_payload: { title: fresh.title, artist_name: fresh.artist_name, isrc: fresh.isrc, release_date: fresh.release_date }, created_by: auth.user.id })));
      return NextResponse.json({ ok: true, queued: input.distributors.length });
    }

    if (input.action === "update_status") {
      const statuses = { ...(fresh.platform_statuses || {}) } as Record<string, { status: string; url: string | null }>;
      statuses[input.distributor] = { status: input.status, url: input.url ?? statuses[input.distributor]?.url ?? null };
      const { error } = await admin.from("projects").update({ platform_statuses: statuses, updated_at: new Date().toISOString() }).eq("project_id", projectId);
      if (error) throw error;
      const logStatus = input.status === "pending" ? "queued" : input.status;
      await admin.from("publishing_delivery_logs").insert({ project_id: projectId, action: "status_update", distributor: input.distributor, status: logStatus, response_payload: { url: input.url ?? null, note: input.note ?? null }, created_by: auth.user.id, attempt_count: 1 });
      return NextResponse.json({ ok: true });
    }

    const { error } = await admin.from("publishing_analytics").upsert({ project_id: projectId, platform: input.platform, period_start: input.period_start, period_end: input.period_end, streams: input.streams, listeners: input.listeners, revenue_amount: input.revenue_amount, revenue_currency: input.revenue_currency.toUpperCase(), source: "manual", synced_at: new Date().toISOString(), created_by: auth.user.id }, { onConflict: "project_id,platform,period_start,period_end" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    return authResponse ?? NextResponse.json({ error: "Publishing action failed" }, { status: 500 });
  }
}
