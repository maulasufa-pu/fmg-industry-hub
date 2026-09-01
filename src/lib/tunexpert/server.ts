import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export class TuneXpertInsufficientCreditsError extends Error {
  constructor(
    public readonly balance: number,
    public readonly cost: number,
  ) {
    super("Not enough tuneXpert credits.");
    this.name = "TuneXpertInsufficientCreditsError";
  }
}

async function walletBalance(userId: string): Promise<number> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("TuneXpert billing is not configured");
  const { data } = await admin.from("tunexpert_wallets").select("balance").eq("user_id", userId).maybeSingle();
  return Number(data?.balance ?? 0);
}

export async function reserveTuneXpertJob(input: {
  userId: string;
  jobId: string;
  jobType: "music" | "isolation";
  costCredits: number;
  usageSeconds: number;
  requestSummary?: Record<string, unknown>;
}): Promise<number> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("TuneXpert billing is not configured");

  const { data, error } = await admin.rpc("tunexpert_reserve_job", {
    p_user_id: input.userId,
    p_job_id: input.jobId,
    p_job_type: input.jobType,
    p_cost_credits: input.costCredits,
    p_usage_seconds: input.usageSeconds,
    p_request_summary: input.requestSummary ?? {},
  });

  if (error) {
    if (error.message.includes("INSUFFICIENT_TUNEXPERT_CREDITS")) {
      throw new TuneXpertInsufficientCreditsError(await walletBalance(input.userId), input.costCredits);
    }
    throw new Error("Unable to reserve tuneXpert credits");
  }

  return Number(data ?? 0);
}

export async function completeTuneXpertJob(jobId: string, providerReference?: string | null): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("TuneXpert billing is not configured");
  const { error } = await admin.rpc("tunexpert_complete_job", {
    p_job_id: jobId,
    p_provider_reference: providerReference ?? null,
  });
  if (error) throw new Error("Unable to complete tuneXpert job");
}

export async function refundTuneXpertJob(jobId: string, reason: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) return;
  await admin.rpc("tunexpert_refund_job", { p_job_id: jobId, p_reason: reason });
}

