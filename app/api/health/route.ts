import { NextResponse } from "next/server";
import { resolveJevConfig } from "@/lib/jev";

/** Server-side defaults. Never returns the key itself. */
export async function GET() {
  const cfg = resolveJevConfig();
  return NextResponse.json({
    ok: true,
    mode: cfg.mode,
    envKeyConfigured: cfg.keySource === "env",
    apiUrl: cfg.apiUrl,
    model: cfg.model,
  });
}
