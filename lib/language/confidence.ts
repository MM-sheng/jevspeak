/**
 * Probability → language.
 *
 * Calibrated hedges. The mapping is explicit and coarse on purpose:
 * we never want wording to sound more precise than the underlying number.
 */
export type ConfidenceBand =
  | "insufficient" // < 0.50 — don't bluff
  | "maybe" // 0.50–0.60
  | "i_think" // 0.60–0.75
  | "probably" // 0.75–0.90
  | "very_likely" // 0.90–0.97
  | "highly_confident"; // 0.97+

export const DECLINE_THRESHOLD = 0.5;

export function confidenceBand(p: number): ConfidenceBand {
  if (!Number.isFinite(p) || p < DECLINE_THRESHOLD) return "insufficient";
  if (p < 0.6) return "maybe";
  if (p < 0.75) return "i_think";
  if (p < 0.9) return "probably";
  if (p < 0.97) return "very_likely";
  return "highly_confident";
}

/** Standalone short-answer word for yes-leaning stances. */
export const YES_WORD: Record<ConfidenceBand, readonly string[]> = {
  insufficient: ["I'm not sure"],
  maybe: ["Maybe", "Possibly"],
  i_think: ["I think so", "I'd lean yes"],
  probably: ["Probably", "Most likely"],
  very_likely: ["Very likely", "Almost certainly"],
  highly_confident: ["Yes", "I'm confident: yes"],
};

/** Standalone short-answer word for no-leaning stances. */
export const NO_WORD: Record<ConfidenceBand, readonly string[]> = {
  insufficient: ["I'm not sure"],
  maybe: ["Maybe not", "Possibly not"],
  i_think: ["I don't think so", "I'd lean no"],
  probably: ["Probably not", "Most likely not"],
  very_likely: ["Very unlikely", "Almost certainly not"],
  highly_confident: ["No", "I'm confident: no"],
};

/** Inline adverb dropped into a claim clause: "AI will {hedge} replace..." */
export const HEDGE_ADVERB: Record<ConfidenceBand, string> = {
  insufficient: "possibly",
  maybe: "maybe",
  i_think: "likely",
  probably: "probably",
  very_likely: "very likely",
  highly_confident: "almost certainly",
};

/** Sentence-initial framing for a claim: "I think AI will..." */
export const HEDGE_PREFIX: Record<ConfidenceBand, readonly string[]> = {
  insufficient: ["I'm not confident, but"],
  maybe: ["Maybe", "It's possible that"],
  i_think: ["I think", "My sense is that"],
  probably: ["Probably", "I'd say"],
  very_likely: ["It's very likely that", "I'm fairly sure"],
  highly_confident: ["I'm highly confident that", "I'm confident that"],
};

/** Advice framing scaled by confidence: how strongly to recommend. */
export const ADVICE_PREFIX: Record<ConfidenceBand, readonly string[]> = {
  insufficient: ["One option might be to"],
  maybe: ["It might help to", "One thing you could try is to"],
  i_think: ["I think it would help to", "I'd consider trying to"],
  probably: ["I'd suggest you", "It would probably help to"],
  very_likely: ["I'd strongly suggest you", "The best move is likely to"],
  highly_confident: ["You should", "Definitely"],
};

export function describeBand(band: ConfidenceBand): string {
  return {
    insufficient: "below threshold — decline / clarify",
    maybe: '"maybe"',
    i_think: '"I think"',
    probably: '"probably"',
    very_likely: '"very likely"',
    highly_confident: '"highly confident"',
  }[band];
}
