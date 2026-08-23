import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({ type: z.enum(["export", "delete"]) });

export async function POST(request: Request) {
  try {
    const auth = await requireAuthenticatedRequest(request);
    const input = requestSchema.parse(await request.json());
    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Privacy request service is not configured" }, { status: 503 });
    const { data, error } = await admin.from("data_privacy_requests").insert({ user_id: auth.user.id, request_type: input.type, request_email: auth.user.email, status: "pending" }).select("id, request_type, status, created_at").single();
    if (error) throw error;
    return NextResponse.json({ request: data }, { status: 201 });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid privacy request" }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create privacy request" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuthenticatedRequest(request);
    const admin = getSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Privacy request service is not configured" }, { status: 503 });
    const { data, error } = await admin.from("data_privacy_requests").select("id, request_type, status, created_at, completed_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(20);
    if (error) throw error;
    return NextResponse.json({ requests: data ?? [] });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load privacy requests" }, { status: 500 });
  }
}
