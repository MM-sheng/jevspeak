/** English locale pack — composed from the original phrase banks. */
import type { LocalePack } from "../locale";
import * as T from "../templates";
import { ADVICE_PREFIX, HEDGE_ADVERB, HEDGE_PREFIX, NO_WORD, YES_WORD } from "../confidence";
import { attachClause, capitalize, ensureTerminal, fillHedge, joinSentences } from "../grammar";

export const en: LocalePack = {
  locale: "en",
  speechLang: "en",
  confidence: { yes: YES_WORD, no: NO_WORD, adverb: HEDGE_ADVERB, prefix: HEDGE_PREFIX, advice: ADVICE_PREFIX },
  templates: {
    ackLow: T.ACK_LOW,
    ackHigh: T.ACK_HIGH,
    ackNeutral: T.ACK_NEUTRAL,
    goalLine: T.GOAL_LINE,
    claim: T.CLAIM,
    adviceClaims: T.ADVICE_CLAIMS,
    qualification: T.QUALIFICATION,
    followUp: T.FOLLOW_UP,
    greeting: T.GREETING,
    decline: T.DECLINE,
    declineRequest: T.DECLINE_REQUEST,
    clarify: T.CLARIFY,
    stanceMixed: T.STANCE_MIXED,
    stanceUncertain: T.STANCE_UNCERTAIN,
    toneOpener: T.TONE_OPENER,
    agree: T.AGREE,
    disagree: T.DISAGREE,
    warn: T.WARN,
  },
  grammar: {
    fillHedge,
    prefix: (p, c) => `${p} ${c}`,
    attachClause,
    attachOpener: (opener, s) => {
      const lowered = /^I(\s|')/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);
      return `${opener} ${lowered}`;
    },
    isQuestion: (s) => s.trim().endsWith("?"),
    ensureTerminal: (s) => ensureTerminal(s),
    join: (parts) => joinSentences(parts.map(capitalize)),
  },
};
