import { NextRequest, NextResponse } from "next/server";

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID!;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID!;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET!;

async function getZoomAccessToken(): Promise<string> {
  const creds = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(ZOOM_ACCOUNT_ID)}`,
    { method: "POST", headers: { Authorization: `Basic ${creds}`, "Content-Type": "application/x-www-form-urlencoded" } }
  );
  if (!res.ok) throw new Error(`Zoom token failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

export async function POST(req: NextRequest) {
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Missing Zoom env. Check ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID / ZOOM_CLIENT_SECRET" },
      { status: 500 }
    );
  }

  try {
    const { title, startAt, durationMin, timezone } = (await req.json()) as {
      title: string;
      startAt: string;     // kirim ISO dari client kalau bisa (startLocal.toISOString())
      durationMin: number;
      timezone?: string;   // optional; default Asia/Jakarta
    };

    if (!title || !startAt || !durationMin) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // NORMALISASI WAKTU → UTC ISO
    // Jika client sudah kirim ISO (ada 'Z' / offset), ini aman.
    // Kalau yang dikirim bukan ISO lengkap, new Date(startAt) bisa salah tergantung server TZ.
    // Jadi paling aman: kirim dari client pakai startLocal.toISOString().
    const date = new Date(startAt);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid startAt" }, { status: 400 });
    }
    const utcISO = date.toISOString();

    const token = await getZoomAccessToken();

    const payload = {
      topic: title,
      type: 2,                 // scheduled
      start_time: utcISO,      // UTC
      duration: durationMin,
      timezone: timezone || "Asia/Jakarta", // tampilkan sesuai WIB di Zoom
      settings: {
        join_before_host: true,
        waiting_room: true,
      },
    };

    const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Zoom create failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { join_url: string };
    return NextResponse.json({ joinUrl: json.join_url });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);
    return NextResponse.json({ error: String(message) }, { status: 500 });
  }
}
