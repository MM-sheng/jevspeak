/**
 * Semantic IR — the intermediate representation between Jev and language.
 *
 * Think of this like a compiler AST: Jev produces it (via the adapter),
 * the language compiler consumes it. Nothing here is free-form text.
 * Every field is a finite choice or a bounded number.
 */

export const INTENTS = [
  "question",
  "statement",
  "request",
  "emotional_sharing",
  "greeting",
  "farewell",
  "thanks",
  "other",
] as const;
export type Intent = (typeof INTENTS)[number];

export const TOPICS = [
  "ai",
  "technology",
  "economics",
  "work",
  "learning",
  "personal",
  "health",
  "relationships",
  "markets",
  "other",
] as const;
export type Topic = (typeof TOPICS)[number];

export const SPEECH_ACTS = [
  "answer",
  "acknowledge",
  "agree",
  "disagree",
  "clarify",
  "empathize",
  "encourage",
  "warn",
  "advise",
  "ask_follow_up",
  "greet",
  "decline",
] as const;
export type SpeechAct = (typeof SPEECH_ACTS)[number];

export const TONES = [
  "neutral",
  "warm",
  "analytical",
  "casual",
  "cautious",
  "confident",
] as const;
export type Tone = (typeof TONES)[number];

export const LENGTHS = ["minimal", "short", "medium"] as const;
export type ResponseLength = (typeof LENGTHS)[number];

export const STANCES = ["mostly_yes", "mostly_no", "mixed", "uncertain"] as const;
export type Stance = (typeof STANCES)[number];

export const EMOTIONS = [
  "neutral",
  "happy",
  "excited",
  "curious",
  "sad",
  "disappointed",
  "anxious",
  "frustrated",
  "tired",
] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const RESPONSE_GOALS = [
  "inform",
  "encourage",
  "reassure",
  "guide",
  "clarify",
  "connect",
  "caution",
] as const;
export type ResponseGoal = (typeof RESPONSE_GOALS)[number];

export const FOLLOW_UPS = [
  "none",
  "ask_what_happened",
  "ask_clarify",
  "ask_which_aspect",
  "ask_how_feel",
  "ask_goal",
  "ask_timeline",
  "offer_more",
] as const;
export type FollowUp = (typeof FOLLOW_UPS)[number];

export const QUALIFICATIONS = [
  "none",
  "not_all_jobs",
  "timeline_uncertain",
  "industry_specific",
  "technology_uncertain",
  "depends_on_person",
  "context_dependent",
  "limited_knowledge",
] as const;
export type Qualification = (typeof QUALIFICATIONS)[number];

/**
 * Claims are finite semantic propositions. Jev picks one; the compiler
 * renders it. Adding a new claim = adding an id here + a template.
 */
export const CLAIMS = [
  // AI / work
  "replace_tasks",
  "replace_jobs",
  "augment_workers",
  "change_skill_mix",
  // generic judgments
  "yes_generally",
  "no_generally",
  "depends",
  "uncertain",
  // learning / setbacks
  "one_event_not_defining",
  "effort_compounds",
  "feedback_is_signal",
  // advice
  "take_break",
  "start_small",
  "practice_more",
  "talk_to_someone",
  "sleep_more",
  "reflect_first",
  "seek_professional",
  // markets
  "markets_unpredictable",
  "diversify",
  // health
  "consult_doctor",
] as const;
export type Claim = (typeof CLAIMS)[number];

export interface SemanticResponse {
  intent: Intent;
  topic: Topic;

  speechAct: SpeechAct;
  tone: Tone;
  length: ResponseLength;

  /** Overall confidence in the response as a whole, 0..1. */
  confidence: number;

  stance?: Stance;
  emotion?: Emotion;
  /** 0..1 — how strong the detected user emotion is. */
  emotionIntensity?: number;

  mainClaim?: Claim;
  qualification?: Qualification;

  responseGoal?: ResponseGoal;
  followUp?: FollowUp;
}

/** A probability distribution over finite options for one Jev question. */
export interface Distribution<T extends string = string> {
  choice: T;
  probability: number;
  options: Array<{ value: T; probability: number }>;
  /** Jev's own calibrated confidence in this decision (API mode only). */
  confidence?: number;
}

/**
 * Everything Jev decided, in normalized form. Kept alongside the IR so the
 * UI can show the alternatives Jev considered, not only what it picked.
 */
export interface JevDecision {
  dimensions: Record<string, Distribution>;
  scores: Record<string, number>;
  /** "mock" | "api" — surfaced in the UI so nobody mistakes mock for real. */
  source: "mock" | "api";
  latencyMs: number;
  /** Resolved model version reported by the API (e.g. "jev-1.13"). */
  model?: string;
  usage?: { input_tokens: number; output_tokens: number };
}
