import { ImageResponse } from "next/og";

export const alt = "FMG Universe — Music arrangement and production";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 72, color: "white", background: "radial-gradient(circle at 75% 20%, #7c3aed 0, #111827 42%, #050505 75%)" }}><div style={{ fontSize: 28, letterSpacing: 8, textTransform: "uppercase", opacity: .75 }}>FMG Universe</div><div style={{ marginTop: 18, maxWidth: 950, fontSize: 70, fontWeight: 800, lineHeight: 1.05 }}>Your song, arranged to sound release-ready.</div><div style={{ marginTop: 24, fontSize: 30, opacity: .8 }}>Arrangement · Production · Mixing · Mastering</div></div>, size);
}
