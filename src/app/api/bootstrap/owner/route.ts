import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

type JsonOk = { ok: true };
type JsonErr = { error: string };

export async function POST(req: Request) {
  const { code } = (await req.json()) as { code: string };

  if (!code || code !== process.env.OWNER_BOOTSTRAP_CODE) {
    return NextResponse.json({ error: "Invalid code" satisfies string }, { status: 403 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Must be logged in" satisfies string }, { status: 401 });
  }

  const { data: owners, error: ownersErr, count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: false })
    .eq("main_role", "owner");

  if (ownersErr) {
    return NextResponse.json({ error: `DB error: ${String(ownersErr.message ?? ownersErr)}` }, { status: 500 });
  }
  if ((count ?? (owners?.length ?? 0)) > 0) {
    return NextResponse.json({ error: "Owner already exists" satisfies string }, { status: 409 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  );

  const userId = session.user.id;

  const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: "owner" },
  });
  if (updErr) {
    return NextResponse.json({ error: `Auth update failed: ${String(updErr.message ?? updErr)}` }, { status: 500 });
  }

  const { error: profErr } = await admin
    .from("profiles")
    .update({ main_role: "owner" })
    .eq("id", userId);
  if (profErr) {
    return NextResponse.json({ error: `Profile sync failed: ${String(profErr.message ?? profErr)}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true } satisfies JsonOk);
}
