import { ImageResponse } from "next/og";

export const alt = "Jasa aransemen lagu profesional dari FMG Universe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "flex-start",
          background: "radial-gradient(circle at 18% 18%, #4c1d95 0, #09090b 42%, #020203 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "64px 72px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, fontWeight: 700, letterSpacing: 4 }}>FMG UNIVERSE</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#c4b5fd", display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Jasa aransemen lagu profesional</div>
          <div style={{ display: "flex", fontSize: 70, fontWeight: 900, letterSpacing: -3, lineHeight: 1.04, marginTop: 20, maxWidth: 1020 }}>Bawa ide lagu menjadi produksi yang terdengar utuh.</div>
        </div>
        <div style={{ alignItems: "center", display: "flex", fontSize: 26, gap: 18 }}>
          <div style={{ background: "#ffffff", borderRadius: 999, color: "#111111", display: "flex", fontWeight: 800, padding: "14px 24px" }}>Paket project pertama · Rp6 juta</div>
          <div style={{ color: "#d4d4d8", display: "flex" }}>flemmomusic.com</div>
        </div>
      </div>
    ),
    size,
  );
}
