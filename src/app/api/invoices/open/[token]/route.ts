import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64");

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const now = new Date().toISOString();
      await admin.from("invoice_delivery_logs").update({ status: "opened", opened_at: now, updated_at: now }).eq("tracking_token", token).is("opened_at", null);
    }
  }
  return new NextResponse(PIXEL, { headers: { "Content-Type": "image/gif", "Content-Length": String(PIXEL.length), "Cache-Control": "no-store, max-age=0", "Content-Disposition": "inline" } });
}
