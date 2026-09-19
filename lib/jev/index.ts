/**
 * Jev adapter entry point. The rest of the app calls `inferDecision` and
 * never sees raw Jev payloads or mode-specific details.
 */
import { JEV_QUESTIONS, type JevRequest, type JevState } from "./schema";
import { mockInfer } from "./mock";
import { apiInfer } from "./client";
import { normalizeDecision, toSemantic } from "./decision";
import { JevError } from "./errors";
import type { JevDecision, SemanticResponse } from "@/types/semantic";

export type JevMode = "mock" | "api";

export function getJevMode(): JevMode {
  const m = (process.env.JEV_MODE ?? "mock").toLowerCase();
  return m === "api" ? "api" : "mock";
}

export interface InferenceResult {
  decision: JevDecision;
  semantic: SemanticResponse;
}

export async function inferDecision(state: JevState): Promise<InferenceResult> {
  const mode = getJevMode();
  const req: JevRequest = { state, questions: JEV_QUESTIONS };
  const started = Date.now();

  let raw;
  if (mode === "api") {
    const apiUrl = process.env.JEV_API_URL;
    const apiKey = process.env.JEV_API_KEY;
    if (!apiKey) throw new JevError("missing_key", "JEV_MODE=api but JEV_API_KEY is not set.");
    if (!apiUrl) throw new JevError("missing_key", "JEV_MODE=api but JEV_API_URL is not set.");
    raw = await apiInfer(req, { apiUrl, apiKey });
  } else {
    raw = await mockInfer(req);
  }

  const decision = normalizeDecision(raw, { source: mode, latencyMs: Date.now() - started });
  return { decision, semantic: toSemantic(decision) };
}

export { JevError } from "./errors";
