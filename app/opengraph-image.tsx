import { ImageResponse } from "next/og";

export const alt = "JevSpeak: a decision model that speaks. Decisions to meaning to language, without a generative LLM.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#101827", color: "#f4f7fc", padding: "64px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", color: "#73e2bd", fontSize: 28 }}>JevSpeak / Open-source experiment</div>
      <div style={{ display: "flex", fontSize: 72, fontWeight: 700, marginTop: 32, maxWidth: 1000 }}>A decision model that speaks.</div>
      <div style={{ display: "flex", fontSize: 32, color: "#c6d1e4", marginTop: 28 }}>Decisions → Meaning → English / Chinese</div>
      <div style={{ display: "flex", fontSize: 27, color: "#73e2bd", marginTop: 24 }}>No generative LLM. Inspect every decision.</div>
      <div style={{ display: "flex", fontSize: 24, marginTop: "auto", color: "#c6d1e4" }}>Try it at jevspeak.org</div>
    </div>,
    size,
  );
}
