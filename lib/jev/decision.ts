/**
 * Normalize raw Jev answers → JevDecision (distributions) → SemanticResponse (IR).
 *
 * This is the only place that knows both the raw answer shape and the IR.
 * Everything downstream sees typed, validated data.
 */
import type {
  Claim,
  Distribution,
  Emotion,
  FollowUp,
  Intent,
  JevDecision,
  Qualification,
  ResponseGoal,
  ResponseLength,
  SemanticResponse,
  SpeechAct,
  Stance,
  Tone,
  Topic,
} from "@/types/semantic";
import { JEV_QUESTIONS, type RawJevResponse, type ChoiceQuestion } from "./schema";
import { JevError } from "./errors";

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function normalizeChoice(q: ChoiceQuestion, raw: unknown): Distribution {
  if (!raw || typeof raw !== "object" || !("distribution" in raw))
    throw new JevError("malformed", `Jev answer for "${q.id}" is missing a distribution.`);
  const dist = (raw as { distribution: unknown }).distribution;
  if (!dist || typeof dist !== "object")
    throw new JevError("malformed", `Jev distribution for "${q.id}" is not an object.`);

  // Keep only known options; drop negatives; renormalize.
  const entries: Array<{ value: string; probability: number }> = [];
  for (const opt of q.options) {
    const p = (dist as Record<string, unknown>)[opt];
    if (isFiniteNum(p) && p > 0) entries.push({ value: opt, probability: p });
  }
  if (entries.length === 0)
    throw new JevError("malformed", `Jev distribution for "${q.id}" contains no known options.`);
  const sum = entries.reduce((a, e) => a + e.probability, 0);
  for (const e of entries) e.probability /= sum;
  entries.sort((a, b) => b.probability - a.probability);
  return { choice: entries[0].value, probability: entries[0].probability, options: entries };
}

function normalizeScore(id: string, raw: unknown): number {
  if (!raw || typeof raw !== "object" || !("value" in raw))
    throw new JevError("malformed", `Jev answer for "${id}" is missing a value.`);
  const v = (raw as { value: unknown }).value;
  if (!isFiniteNum(v)) throw new JevError("malformed", `Jev score for "${id}" is not a number.`);
  return Math.min(1, Math.max(0, v));
}

export function normalizeDecision(
  raw: RawJevResponse,
  meta: { source: "mock" | "api"; latencyMs: number },
): JevDecision {
  const dimensions: Record<string, Distribution> = {};
  const scores: Record<string, number> = {};
  for (const q of JEV_QUESTIONS) {
    const a = raw.answers[q.id];
    if (a === undefined) throw new JevError("malformed", `Jev did not answer "${q.id}".`);
    if (q.kind === "choice") dimensions[q.id] = normalizeChoice(q, a);
    else scores[q.id] = normalizeScore(q.id, a);
  }
  return { dimensions, scores, source: meta.source, latencyMs: meta.latencyMs };
}

/** Lower the IR into the typed SemanticResponse. */
export function toSemantic(d: JevDecision): SemanticResponse {
  const pick = <T extends string>(id: string) => d.dimensions[id].choice as T;
  const speechAct = pick<SpeechAct>("speech_act");
  const emotion = pick<Emotion>("emotion");
  const claim = pick<Claim>("main_claim");
  const qualification = pick<Qualification>("qualification");
  const followUp = pick<FollowUp>("follow_up");

  const sem: SemanticResponse = {
    intent: pick<Intent>("intent"),
    topic: pick<Topic>("topic"),
    speechAct,
    tone: pick<Tone>("tone"),
    length: pick<ResponseLength>("verbosity"),
    confidence: d.scores.confidence,
    responseGoal: pick<ResponseGoal>("response_goal"),
  };

  // Only attach optional dimensions where they carry meaning; the compiler
  // treats absence as "no such layer".
  const stance = pick<Stance>("stance");
  if (["answer", "agree", "disagree", "warn"].includes(speechAct)) sem.stance = stance;
  if (emotion !== "neutral") {
    sem.emotion = emotion;
    sem.emotionIntensity = d.scores.emotion_intensity;
  }
  if (claim !== "uncertain" || speechAct === "answer") sem.mainClaim = claim;
  if (qualification !== "none") sem.qualification = qualification;
  if (followUp !== "none") sem.followUp = followUp;
  return sem;
}
