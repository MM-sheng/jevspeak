import { NextResponse } from "next/server";
import { JevError, overrideFromHeaders, verifyJev } from "@/lib/jev";

/** Makes one minimal real Jev call with the supplied credentials to validate them. */
export async function POST(req: Request) {
  try {
    const r = await verifyJev(overrideFromHeaders(req.headers));
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof JevError) return NextResponse.json({ ok: false, code: e.code, message: e.message, detail: e.detail }, { status: 400 });
    return NextResponse.json({ ok: false, code: "internal", message: String(e) }, { status: 500 });
  }
}
