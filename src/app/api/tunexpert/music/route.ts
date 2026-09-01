import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiAuthErrorResponse, requireAuthenticatedRequest } from "@/lib/auth/server";
import { elevenLabsApiKey, elevenLabsError, elevenLabsUrl, safeDownloadName } from "@/lib/elevenlabs/server";
import { consumeRateLimit, isSameOriginRequest } from "@/lib/security/request";
import { tuneXpertCreditsForSeconds } from "@/lib/tunexpert/billing";
import { completeTuneXpertJob, refundTuneXpertJob, reserveTuneXpertJob, TuneXpertInsufficientCreditsError } from "@/lib/tunexpert/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RequestSchema = z.object({
  prompt: z.string().trim().min(20).max(4_100),
  durationSeconds: z.number().int().min(5).max(60),
  instrumental: z.boolean().default(true),
  title: z.string().trim().max(80).optional().default("tunexpert-track"),
});

export async function POST(request: Request): Promise<NextResponse> {
  let reservedJobId: string | null = null;
  let shouldRefund = false;
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const auth = await requireAuthenticatedRequest(request);
    const rate = consumeRateLimit(request, "tunexpert-music", 4, 60 * 60_000, auth.user.id);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Generation limit reached. Try again after the cooldown." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
      );
    }

    const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid generation request" },
        { status: 400 },
      );
    }

    const { prompt, durationSeconds, instrumental, title } = parsed.data;
    const costCredits = tuneXpertCreditsForSeconds(durationSeconds);
    reservedJobId = crypto.randomUUID();
    const balanceAfter = await reserveTuneXpertJob({
      userId: auth.user.id,
      jobId: reservedJobId,
      jobType: "music",
      costCredits,
      usageSeconds: durationSeconds,
      requestSummary: { durationSeconds, instrumental, title: title || null },
    });
    shouldRefund = true;

    const upstream = await fetch(
      `${elevenLabsUrl("/music")}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsApiKey(),
        },
        body: JSON.stringify({
          prompt,
          music_length_ms: durationSeconds * 1_000,
          model_id: "music_v2",
          force_instrumental: instrumental,
          sign_with_c2pa: true,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(280_000),
      },
    );

    if (!upstream.ok || !upstream.body) {
      const upstreamError = await elevenLabsError(upstream);
      await refundTuneXpertJob(reservedJobId, upstreamError);
      shouldRefund = false;
      return NextResponse.json(
        { error: upstreamError },
        { status: upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502 },
      );
    }

    shouldRefund = false;
    const songId = upstream.headers.get("song-id");
    await completeTuneXpertJob(reservedJobId, songId).catch(() => undefined);

    const filename = `${safeDownloadName(title, "tunexpert-track")}.mp3`;
    const headers = new Headers({
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
      "X-Content-Type-Options": "nosniff",
      "X-TuneXpert-Model": "music_v2",
      "X-TuneXpert-Cost": String(costCredits),
      "X-TuneXpert-Balance": String(balanceAfter),
    });
    if (songId) headers.set("X-TuneXpert-Song-Id", songId);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error: unknown) {
    if (reservedJobId && shouldRefund) {
      await refundTuneXpertJob(reservedJobId, error instanceof Error ? error.message : "Music generation failed");
    }
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof TuneXpertInsufficientCreditsError) {
      return NextResponse.json(
        { error: "Not enough tuneXpert credits.", code: "INSUFFICIENT_CREDITS", balance: error.balance, cost: error.cost },
        { status: 402 },
      );
    }
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { error: timedOut ? "Music generation timed out. Please try a shorter duration." : "Unable to generate music right now." },
      { status: timedOut ? 504 : 500 },
    );
  }
}
