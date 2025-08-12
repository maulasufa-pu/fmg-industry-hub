import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID!;
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
const GOOGLE_OAUTH_REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN!;
// kalender target (email pemilik refresh token, atau calendarId lain yg user itu punya akses)
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

export async function POST(req: NextRequest) {
  try {
    const { title, startAt, durationMin } = await req.json() as {
      title: string; startAt: string; durationMin: number;
    };
    if (!title || !startAt || !durationMin) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // OAuth client
    const oAuth2 = new google.auth.OAuth2(
      GOOGLE_OAUTH_CLIENT_ID,
      GOOGLE_OAUTH_CLIENT_SECRET
    );
    oAuth2.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN });

    const calendar = google.calendar({ version: "v3", auth: oAuth2 });

    const start = new Date(startAt);
    const end = new Date(start.getTime() + durationMin * 60_000);

    // Penting: conferenceDataVersion=1
    const res = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      conferenceDataVersion: 1,
      requestBody: {
        summary: title,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        conferenceData: {
          createRequest: {
            requestId: `meet-${start.getTime()}-${Math.random().toString(36).slice(2)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const event = res.data;
    // `hangoutLink` biasanya ada di event; fallback cek entries
    const joinUrl =
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri;

    if (!joinUrl) throw new Error("Failed to get Meet link from Google Calendar response.");
    return NextResponse.json({ joinUrl });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
