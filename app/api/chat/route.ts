import { NextResponse } from "next/server";
import { runTurn } from "@/lib/conversation/pipeline";
import { emptyState, isConversationState } from "@/lib/conversation/state";
import { JevError } from "@/lib/jev";
import type { ChatError, ChatResponse } from "@/types/conversation";

export const runtime = "nodejs";

const MAX_MESSAGE = 2000;

function err(code: ChatError["code"], message: string, status: number, detail?: string) {
  return NextResponse.json<ChatError>({ ok: false, code, message, detail }, { status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("bad_request", "Request body must be JSON.", 400);
  }
  const { message, state } = (body ?? {}) as { message?: unknown; state?: unknown };
  if (typeof message !== "string" || !message.trim()) return err("bad_request", "`message` is required.", 400);
  if (message.length > MAX_MESSAGE) return err("bad_request", `Message too long (max ${MAX_MESSAGE} chars).`, 400);
  const convo = isConversationState(state) ? state : emptyState();

  try {
    const result = await runTurn(message.trim(), convo);
    return NextResponse.json<ChatResponse>({ ok: true, ...result });
  } catch (e) {
    if (e instanceof JevError) {
      const map: Record<JevError["code"], [ChatError["code"], number]> = {
        missing_key: ["jev_missing_key", 500],
        unavailable: ["jev_unavailable", 502],
        rate_limited: ["jev_rate_limited", 429],
        network: ["jev_network", 502],
        malformed: ["jev_malformed", 502],
      };
      const [code, status] = map[e.code];
      return err(code, e.message, status, e.detail);
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (/compile|template|slot/i.test(msg)) return err("compile_failed", "Language compiler failed on this semantic state.", 500, msg);
    return err("internal", "Unexpected server error.", 500, msg);
  }
}
