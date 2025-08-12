import { NextRequest, NextResponse } from "next/server";
import { google, calendar_v3 } from "googleapis";

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID!;
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
const GOOGLE_OAUTH_REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN!;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

export async function POST(req: NextRequest) {
  // Guard env
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET || !GOOGLE_OAUTH_REFRESH_TOKEN) {
    return NextResponse.json(
      { error: "Missing Google env. Check GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN" },
      { status: 500 }
    );
  }

  try {
    const { title, startAt, durationMin } = (await req.json()) as {
      title: string;
      startAt: string;   // UTC ISO dari client
      durationMin: number;
    };

    if (!title || !startAt || !durationMin) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const start = new Date(startAt);
    if (isNaN(start.getTime())) {
      return NextResponse.json({ error: "Invalid startAt" }, { status: 400 });
    }
    const end = new Date(start.getTime() + Number(durationMin) * 60_000);

    // OAuth client
    const oAuth2 = new google.auth.OAuth2(
      GOOGLE_OAUTH_CLIENT_ID,
      GOOGLE_OAUTH_CLIENT_SECRET
    );
    oAuth2.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });

    const calendar = google.calendar({ version: "v3", auth: oAuth2 });

    // Penting: conferenceDataVersion=1 agar Meet link dibuat
    const res = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      conferenceDataVersion: 1,
      requestBody: {
        summary: title,
        start: { dateTime: start.toISOString(), timeZone: "Asia/Jakarta" },
        end:   { dateTime: end.toISOString(),   timeZone: "Asia/Jakarta" },
        conferenceData: {
          createRequest: {
            requestId: `meet-${start.getTime()}-${Math.random().toString(36).slice(2)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const event = res.data;

    // Ketik entryPoints dengan tipe resmi dari googleapis
    const videoEP = event.conferenceData?.entryPoints?.find(
      (ep): ep is calendar_v3.Schema$EntryPoint => ep?.entryPointType === "video"
    );

    const joinUrl = event.hangoutLink || videoEP?.uri;

    if (!joinUrl) {
      return NextResponse.json({ error: "Failed to get Meet link from Google Calendar response." }, { status: 500 });
    }

    return NextResponse.json({ joinUrl });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
