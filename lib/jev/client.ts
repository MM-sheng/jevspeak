/**
 * Real Jev API client — TypeSafe System One.
 *
 *   POST https://api.typesafe.ai/v1/systemone
 *   Authorization: Bearer <JEV_API_KEY>
 *   { model, state, questions: { [id]: { type, instructions, criteria } } }
 *   → { model, answers: { [id]: { type, choice|score|noul, probabilities, confidence } }, usage }
 *
 * This is the only file that knows the wire format. `toWire` / `fromWire`
 * translate between it and our RawJevResponse; nothing else touches it.
 */
import type { JevQuestion, JevRequest, RawAnswer, RawJevResponse } from "./schema";
import { JevError } from "./errors";

export const DEFAULT_JEV_API_URL = "https://api.typesafe.ai/v1/systemone";
export const DEFAULT_JEV_MODEL = "jev-latest";

export interface JevClientConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

/* ---------- request ---------- */

type WireQuestion =
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  | { type: "score"; instructions: string; criteria: string[] }
  | { type: "noul"; instructions: string; criteria: { true: string; false: string } };

function toWireQuestion(q: JevQuestion): WireQuestion {
  switch (q.kind) {
    case "choice":
      return { type: "choice", instructions: q.prompt, criteria: q.criteria };
    case "score":
      return { type: "score", instructions: q.prompt, criteria: [...q.anchors] };
    case "noul":
      return { type: "noul", instructions: q.prompt, criteria: q.criteria };
  }
}

export function toWire(req: JevRequest, model: string) {
  const { state } = req;
  return {
    model,
    // Jev accepts a JSON object as state. The latest message is the object of
    // every question; earlier turns are labelled as background so that a
    // previous emotional turn does not colour an unrelated new message.
    state: {
      task: "Decide how to respond to LATEST_USER_MESSAGE. Every question is about this message only. BACKGROUND is earlier conversation, for context.",
      LATEST_USER_MESSAGE: state.message,
      BACKGROUND: {
        topic_so_far: state.currentTopic,
        open_question_we_asked: state.unresolvedQuestion,
        earlier_turns: state.recentMessages,
      },
    },
    questions: Object.fromEntries(req.questions.map((q) => [q.id, toWireQuestion(q)])),
  };
}

/* ---------- response ---------- */

type WireAnswer =
  | { type: "choice"; choice: string; probabilities: Record<string, number>; confidence?: number }
  | { type: "score"; score: number; legend?: Record<string, string>; probabilities?: Record<string, number>; confidence?: number }
  | { type: "noul"; noul: number };

function isNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function fromWireAnswer(q: JevQuestion, a: unknown): RawAnswer {
  if (!a || typeof a !== "object") throw new JevError("malformed", `Jev answer for "${q.id}" is not an object.`);
  const w = a as Partial<WireAnswer> & Record<string, unknown>;

  if (q.kind === "choice") {
    if (!w.probabilities || typeof w.probabilities !== "object")
      throw new JevError("malformed", `Jev choice answer for "${q.id}" has no probabilities.`, JSON.stringify(a));
    return { distribution: w.probabilities as Record<string, number>, confidence: isNum(w.confidence) ? w.confidence : undefined };
  }

  if (q.kind === "score") {
    if (!isNum(w.score)) throw new JevError("malformed", `Jev score answer for "${q.id}" has no numeric score.`, JSON.stringify(a));
    // score is a (possibly fractional) index into the anchors: 0 .. N-1 → 0 .. 1
    const max = Math.max(1, q.anchors.length - 1);
    return { value: w.score / max, confidence: isNum(w.confidence) ? w.confidence : undefined };
  }

  // noul: probability that the statement is true
  if (!isNum(w.noul)) throw new JevError("malformed", `Jev noul answer for "${q.id}" has no probability.`, JSON.stringify(a));
  return { value: w.noul };
}

export function fromWire(json: unknown, questions: readonly JevQuestion[]): RawJevResponse {
  if (!json || typeof json !== "object") throw new JevError("malformed", "Jev returned a non-object response.");
  const obj = json as Record<string, unknown>;
  const answers = obj.answers as Record<string, unknown> | undefined;
  if (!answers || typeof answers !== "object")
    throw new JevError("malformed", "Jev response is missing an `answers` object.", JSON.stringify(json).slice(0, 400));

  const out: Record<string, RawAnswer> = {};
  for (const q of questions) {
    if (!(q.id in answers)) throw new JevError("malformed", `Jev did not answer "${q.id}".`);
    out[q.id] = fromWireAnswer(q, answers[q.id]);
  }
  return {
    answers: out,
    model: typeof obj.model === "string" ? obj.model : undefined,
    usage: obj.usage as RawJevResponse["usage"],
  };
}

/* ---------- transport ---------- */

export async function apiInfer(req: JevRequest, cfg: JevClientConfig): Promise<RawJevResponse> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), cfg.timeoutMs ?? 20000);
  let res: Response;
  try {
    res = await fetch(cfg.apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(toWire(req, cfg.model)),
      signal: ctrl.signal,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new JevError("network", ctrl.signal.aborted ? "Jev request timed out." : "Could not reach the Jev API.", msg);
  } finally {
    clearTimeout(t);
  }

  if (res.status === 401 || res.status === 403) throw new JevError("missing_key", "Jev rejected the API key.", await res.text().catch(() => ""));
  if (res.status === 429) throw new JevError("rate_limited", "Jev rate limit reached. Try again shortly.");
  if (res.status >= 500) throw new JevError("unavailable", `Jev API unavailable (HTTP ${res.status}).`);
  if (!res.ok) throw new JevError("malformed", `Jev API returned HTTP ${res.status}.`, await res.text().catch(() => ""));

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new JevError("malformed", "Jev returned non-JSON.");
  }
  return fromWire(json, req.questions);
}
