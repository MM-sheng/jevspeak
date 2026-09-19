/**
 * A locale pack = everything language-specific the compiler needs.
 *
 * The compiler's plan (which semantic slots appear) is language-independent.
 * Only *wording* and *surface grammar* live here, so adding a language means
 * adding a pack — no changes to Jev, the IR, or the planner.
 */
import type { Claim, Emotion, FollowUp, Intent, Qualification, ResponseGoal, Tone } from "@/types/semantic";
import type { ConfidenceBand } from "./confidence";

export type Locale = "en" | "zh";
export const LOCALES: readonly Locale[] = ["en", "zh"];
export const DEFAULT_LOCALE: Locale = "en";

export type Bank = readonly string[];

export interface ConfidenceWords {
  yes: Record<ConfidenceBand, Bank>;
  no: Record<ConfidenceBand, Bank>;
  adverb: Record<ConfidenceBand, string>;
  prefix: Record<ConfidenceBand, Bank>;
  advice: Record<ConfidenceBand, Bank>;
}

export interface Templates {
  ackLow: Partial<Record<Emotion, Bank>>;
  ackHigh: Partial<Record<Emotion, Bank>>;
  ackNeutral: Bank;
  goalLine: Partial<Record<ResponseGoal, Bank>>;
  claim: Record<Claim, Bank>;
  adviceClaims: ReadonlySet<Claim>;
  qualification: Record<Exclude<Qualification, "none">, { connector: string; clause: Bank }>;
  followUp: Record<Exclude<FollowUp, "none">, Bank>;
  greeting: Partial<Record<Intent, Bank>>;
  decline: Bank;
  declineRequest: Bank;
  clarify: Bank;
  stanceMixed: Bank;
  stanceUncertain: Bank;
  toneOpener: Partial<Record<Tone, Bank>>;
  agree: Bank;
  disagree: Bank;
  warn: Bank;
}

export interface Grammar {
  /** Fill `{hedge}` in a claim template; an empty hedge must leave clean text. */
  fillHedge(template: string, hedge: string): string;
  /** Prefix + clause (e.g. "I think" + "AI will…"). */
  prefix(prefix: string, clause: string): string;
  /** Attach a trailing qualification clause with its connector. */
  attachClause(main: string, clause: string, connector: string): string;
  /** Glue a tone opener onto the following sentence. */
  attachOpener(opener: string, sentence: string): string;
  /** Whether the sentence is already a question (keeps its mark). */
  isQuestion(s: string): boolean;
  /** Ensure terminal punctuation. */
  ensureTerminal(s: string): string;
  /** Compose sentences into a paragraph. */
  join(sentences: string[]): string;
}

export interface LocalePack {
  locale: Locale;
  /** BCP-47 tag for speech synthesis. */
  speechLang: string;
  confidence: ConfidenceWords;
  templates: Templates;
  grammar: Grammar;
}
