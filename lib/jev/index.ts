/**
 * Jev adapter entry point. The rest of the app calls `inferDecision` and
 * never sees raw Jev payloads or mode-specific details.
 */
import { JEV_QUESTIONS, type JevRequest, type JevState } from "./schema";
import { mockInfer } from "./mock";
import { apiInfer } from "./client";
import { normalizeDecision, toSemantic } from "./decision";
import { JevError } from "./errors";
import { resolveJevConfig, type JevOverride } from "./config";
import type { JevDecision, SemanticResponse } from "@/types/semantic";

export interface InferenceResult {
  decision: JevDecision;
  semantic: SemanticResponse;
}

export async function inferDecision(state: JevState, override?: JevOverride): Promise<InferenceResult> {
  const cfg = resolveJevConfig(override);
  const req: JevRequest = { state, questions: JEV_QUESTIONS };
  const started = Date.now();

  let raw;
  if (cfg.mode === "api") {
    if (!cfg.apiKey) throw new JevError("missing_key", "Jev API mode is on but no API key is set. Add one in Settings or JEV_API_KEY.");
    raw = await apiInfer(req, { apiKey: cfg.apiKey, apiUrl: cfg.apiUrl, model: cfg.model });
  } else {
    raw = await mockInfer(req);
  }

  const decision = normalizeDecision(raw, { source: cfg.mode, latencyMs: Date.now() - started });
  return { decision, semantic: toSemantic(decision) };
}

/** One tiny real request to validate a key/endpoint. Returns the resolved model. */
export async function verifyJev(override?: JevOverride): Promise<{ model: string; latencyMs: number }> {
  const cfg = resolveJevConfig({ ...override, mode: "api" });
  if (!cfg.apiKey) throw new JevError("missing_key", "No API key provided.");
  const started = Date.now();
  const raw = await apiInfer(
    {
      state: { message: "hello", recentMessages: [], currentTopic: null, userSentiment: null, unresolvedQuestion: null },
      questions: [JEV_QUESTIONS[0]],
    },
    { apiKey: cfg.apiKey, apiUrl: cfg.apiUrl, model: cfg.model, timeoutMs: 15000 },
  );
  return { model: raw.model ?? cfg.model, latencyMs: Date.now() - started };
}

export { JevError } from "./errors";
export { envMode as getJevMode, resolveJevConfig, overrideFromHeaders } from "./config";
export type { JevMode, JevOverride } from "./config";
