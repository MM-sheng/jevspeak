import { NextResponse } from "next/server";
import { getJevMode } from "@/lib/jev";

export async function GET() {
  const mode = getJevMode();
  return NextResponse.json({
    ok: true,
    mode,
    apiConfigured: mode === "api" ? Boolean(process.env.JEV_API_URL && process.env.JEV_API_KEY) : null,
  });
}
