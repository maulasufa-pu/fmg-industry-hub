import { ImageResponse } from "next/og";

export const alt = "FMG music arrangement portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function PortfolioOpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 72, color: "white", background: "linear-gradient(135deg, #050505, #312e81 58%, #7c3aed)" }}><div style={{ fontSize: 28, letterSpacing: 7, opacity: .75 }}>FMG UNIVERSE</div><div style={{ marginTop: 24, fontSize: 82, fontWeight: 800 }}>Arrangement Portfolio</div><div style={{ marginTop: 20, fontSize: 30, opacity: .8 }}>Brief · musical solution · deliverables · result</div></div>, size);
}
