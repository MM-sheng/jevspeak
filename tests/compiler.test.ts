import { describe, expect, it } from "vitest";
import { compileResponse } from "@/lib/language";
import type { SemanticResponse } from "@/types/semantic";

const base: SemanticResponse = {
  intent: "question",
  topic: "ai",
  speechAct: "answer",
  tone: "analytical",
  length: "short",
  confidence: 0.77,
  stance: "mostly_yes",
  mainClaim: "replace_tasks",
  qualification: "not_all_jobs",
};

const wellFormed = (text: string) => {
  expect(text.length).toBeGreaterThan(0);
  expect(text).toMatch(/^[A-Z“"]/); // capitalized
  expect(text).toMatch(/[.!?]$/); // terminal punctuation
  expect(text).not.toMatch(/\s[,.!?]/); // no space before punctuation
  expect(text).not.toMatch(/[.!?]{2,}/); // no doubled punctuation
  expect(text).not.toMatch(/\s{2,}/); // no double spaces
  expect(text).not.toMatch(/\{hedge\}/); // no unfilled placeholder
};

describe("determinism", () => {
  it("produces identical output for identical IR", () => {
    const a = compileResponse(base);
    const b = compileResponse({ ...base });
    expect(a.text).toBe(b.text);
    expect(a.trace.seed).toBe(b.trace.seed);
  });

  it("changes wording only via the seed when semantics change", () => {
    const a = compileResponse(base).text;
    const b = compileResponse({ ...base, confidence: 0.55 }).text;
    expect(a).not.toBe(b);
  });
});

describe("confidence wording", () => {
  const cases: Array<[number, RegExp]> = [
    [0.54, /^(Maybe|Possibly)\./],
    [0.71, /^(I think so|I'd lean yes)\./],
    [0.86, /^(Probably|Most likely)\./],
    [0.95, /^(Very likely|Almost certainly)\./],
    [0.99, /^(Yes|I'm confident: yes)\./],
  ];
  for (const [c, re] of cases) {
    it(`confidence ${c} → ${re}`, () => {
      const { text, trace } = compileResponse({ ...base, confidence: c });
      expect(text).toMatch(re);
      wellFormed(text);
      expect(trace.steps.find((s) => s.slot === "confidence")?.output).toContain("band=");
    });
  }

  it("does not repeat the hedge inside the claim when the short answer carries it", () => {
    const { text } = compileResponse({ ...base, confidence: 0.86 });
    expect(text.match(/probably/gi)?.length ?? 0).toBeLessThanOrEqual(1);
  });

  it("uses an adverb hedge when there is no short answer", () => {
    const { text } = compileResponse({
      intent: "emotional_sharing",
      topic: "learning",
      speechAct: "empathize",
      tone: "warm",
      length: "short",
      confidence: 0.82,
      emotion: "disappointed",
      emotionIntensity: 0.7,
      mainClaim: "one_event_not_defining",
      followUp: "ask_what_happened",
    });
    expect(text).toMatch(/probably/);
    expect(text).toMatch(/(happened|led up to it)\?$/);
    wellFormed(text);
  });
});

describe("low confidence", () => {
  it("declines instead of bluffing below 0.5", () => {
    const { text, trace } = compileResponse({ ...base, confidence: 0.41 });
    expect(text).toMatch(/not confident enough|solid enough read/);
    expect(text).toMatch(/\?$/); // asks a follow-up
    expect(trace.warnings.some((w) => w.includes("decline"))).toBe(true);
    wellFormed(text);
  });
});

describe("negation", () => {
  it("renders mostly_no with a negative short answer", () => {
    const { text } = compileResponse({ ...base, stance: "mostly_no", confidence: 0.86, mainClaim: undefined, qualification: undefined });
    expect(text).toMatch(/^(Probably not|Most likely not)\.$/);
  });
  it("renders no_generally claim", () => {
    const { text } = compileResponse({ ...base, stance: "mostly_no", mainClaim: "no_generally", qualification: undefined });
    expect(text).toMatch(/no/i);
    wellFormed(text);
  });
});

describe("qualification", () => {
  it("attaches the qualification as a subordinate clause", () => {
    const { text, trace } = compileResponse(base);
    expect(text).toMatch(/, though /);
    expect(trace.steps.some((s) => s.slot === "attach_qualification")).toBe(true);
    wellFormed(text);
  });
  it("omits qualification at minimal length", () => {
    const { text } = compileResponse({ ...base, length: "minimal" });
    expect(text).not.toMatch(/though/);
    wellFormed(text);
  });
});

describe("questions", () => {
  it("ends with a question when a follow-up is present at medium length", () => {
    const { text } = compileResponse({ ...base, length: "medium", followUp: "ask_which_aspect" });
    expect(text).toMatch(/\?$/);
    wellFormed(text);
  });
  it("clarify always asks something", () => {
    const { text } = compileResponse({ ...base, speechAct: "clarify", followUp: undefined });
    expect(text).toMatch(/\?$/);
  });
});

describe("emotional responses", () => {
  it("scales acknowledgement with intensity", () => {
    const low = compileResponse({ ...base, speechAct: "empathize", emotion: "sad", emotionIntensity: 0.2, mainClaim: undefined, qualification: undefined }).text;
    const high = compileResponse({ ...base, speechAct: "empathize", emotion: "sad", emotionIntensity: 0.9, mainClaim: undefined, qualification: undefined }).text;
    expect(low).not.toBe(high);
    wellFormed(low);
    wellFormed(high);
  });
  it("renders advice claims with a confidence-scaled prefix", () => {
    const { text } = compileResponse({ ...base, speechAct: "advise", mainClaim: "take_break", confidence: 0.93, qualification: undefined });
    expect(text).toMatch(/strongly suggest|best move/);
  });
});

describe("missing optional fields", () => {
  const acts: SemanticResponse["speechAct"][] = [
    "answer", "acknowledge", "agree", "disagree", "clarify", "empathize", "encourage", "warn", "advise", "ask_follow_up", "greet", "decline",
  ];
  for (const speechAct of acts) {
    it(`speechAct=${speechAct} with nothing else set still yields a sentence`, () => {
      const { text } = compileResponse({ intent: "other", topic: "other", speechAct, tone: "neutral", length: "short", confidence: 0.7 });
      wellFormed(text);
    });
  }
  it("handles NaN confidence", () => {
    const { text, trace } = compileResponse({ ...base, confidence: Number.NaN });
    wellFormed(text);
    expect(trace.warnings.length).toBeGreaterThan(0);
  });
});

describe("contradictory semantic states", () => {
  it("empathize with a happy emotion becomes acknowledge", () => {
    const { text, trace } = compileResponse({ ...base, speechAct: "empathize", emotion: "happy", emotionIntensity: 0.8, mainClaim: undefined });
    expect(trace.warnings.join()).toContain("acknowledge");
    wellFormed(text);
  });
  it('"uncertain" claim with high confidence is dropped', () => {
    const { text, trace } = compileResponse({ ...base, mainClaim: "uncertain", confidence: 0.9 });
    expect(trace.warnings.join()).toContain("dropped");
    expect(text).not.toMatch(/clear read/);
    wellFormed(text);
  });
  it("greet with a question intent falls back", () => {
    const { text } = compileResponse({ ...base, speechAct: "greet" });
    wellFormed(text);
  });
});

describe("length", () => {
  it("minimal is shorter than medium", () => {
    const min = compileResponse({ ...base, length: "minimal", followUp: "offer_more" }).text;
    const med = compileResponse({ ...base, length: "medium", followUp: "offer_more" }).text;
    expect(min.length).toBeLessThan(med.length);
  });
});

describe("decline with a claim", () => {
  it("keeps Jev's advice claim after declining a request", () => {
    const { text } = compileResponse({
      intent: "request", topic: "markets", speechAct: "decline", tone: "cautious", length: "medium",
      confidence: 0.9, mainClaim: "seek_professional", qualification: "depends_on_person", followUp: "ask_goal",
    });
    expect(text).toMatch(/not a call I can make|can't tell you what to do/);
    expect(text).toMatch(/professional|qualified/);
    expect(text).toMatch(/\?$/);
    wellFormed(text);
  });
});

describe("vocabulary expansion (from real Jev output)", () => {
  const q = (over: Partial<SemanticResponse>): SemanticResponse => ({ ...base, ...over });

  it("scope claims answer plainly with no yes/no", () => {
    const { text } = compileResponse(q({ stance: "uncertain", mainClaim: "out_of_scope_factual", qualification: undefined, followUp: "ask_which_aspect", length: "medium" }));
    expect(text).not.toMatch(/^(Hard to say|I can't tell)/);
    expect(text).toMatch(/fact|judgment|decision model/);
    wellFormed(text);
  });
  it("no_self_experience renders without a hedge", () => {
    const { text } = compileResponse(q({ stance: "mostly_no", mainClaim: "no_self_experience", confidence: 0.99, qualification: undefined }));
    expect(text).not.toMatch(/almost certainly|probably/i);
    wellFormed(text);
  });
  it("drops a generic yes/no claim after a short answer", () => {
    const { text, trace } = compileResponse(q({ stance: "mostly_no", confidence: 0.93, mainClaim: "no_generally", qualification: "depends_on_person" }));
    expect(text).not.toMatch(/doesn't hold|the answer is no/);
    expect(trace.warnings.join()).toContain("restates");
    wellFormed(text);
  });
  it("drops a context qualification after a depends-type claim", () => {
    const { text } = compileResponse(q({ stance: "mixed", mainClaim: "depends_on_goals", qualification: "context_dependent" }));
    expect(text).not.toMatch(/though/);
    expect(text).toMatch(/optimizing|want|trying to get/);
    wellFormed(text);
  });
  it("good news does not get 'this is recoverable'", () => {
    const { text, trace } = compileResponse({
      intent: "emotional_sharing", topic: "work", speechAct: "encourage", tone: "warm", length: "medium",
      confidence: 0.9, emotion: "excited", emotionIntensity: 0.9, responseGoal: "encourage", followUp: "ask_how_feel",
    });
    expect(text).not.toMatch(/recoverable|come back from this/);
    expect(trace.warnings.join()).toContain("positive");
    wellFormed(text);
  });
  it("celebrate claim renders in an encourage act", () => {
    const { text } = compileResponse({
      intent: "emotional_sharing", topic: "work", speechAct: "encourage", tone: "warm", length: "short",
      confidence: 0.9, emotion: "excited", emotionIntensity: 0.9, mainClaim: "celebrate",
    });
    expect(text).toMatch(/celebrat|enjoy/);
    wellFormed(text);
  });
  it("ask_follow_up defaults to inviting more", () => {
    const { text } = compileResponse(q({ speechAct: "ask_follow_up", stance: undefined, mainClaim: undefined, qualification: undefined }));
    expect(text).toMatch(/Go on|Tell me more|Keep going/);
  });
  it("every new advice claim renders with an advice prefix in both locales", () => {
    for (const c of ["prepare_evidence", "ask_directly", "narrow_down", "wait_before_acting", "find_underlying_issue", "try_something_new", "keep_connection"] as const) {
      const en = compileResponse(q({ speechAct: "advise", mainClaim: c, stance: undefined, qualification: undefined, confidence: 0.8 })).text;
      expect(en).toMatch(/^(I'd suggest you|It would probably help to)/);
      wellFormed(en);
      const zh = compileResponse(q({ speechAct: "advise", mainClaim: c, stance: undefined, qualification: undefined, confidence: 0.8 }), { locale: "zh" }).text;
      expect(zh).toMatch(/^(我建议你|比较有帮助的是|我会建议)/);
    }
  });
});

describe("hedge placement", () => {
  it("plain claims never get a confidence prefix", () => {
    const { text } = compileResponse({
      intent: "emotional_sharing", topic: "work", speechAct: "encourage", tone: "warm", length: "short",
      confidence: 0.99, emotion: "excited", emotionIntensity: 0.9, mainClaim: "celebrate",
    });
    expect(text).not.toMatch(/confident that|certainly/);
    wellFormed(text);
  });
  it("very confident reassurance is stated plainly, not 'almost certainly'", () => {
    const { text } = compileResponse({
      intent: "emotional_sharing", topic: "work", speechAct: "empathize", tone: "warm", length: "short",
      confidence: 0.98, emotion: "anxious", emotionIntensity: 0.5, mainClaim: "nerves_are_normal",
    });
    expect(text).not.toMatch(/almost certainly|very likely/);
    expect(text).toMatch(/nerv/i);
    wellFormed(text);
  });
  it("but a yes/no judgment keeps its hedge", () => {
    const { text } = compileResponse({ ...base, confidence: 0.95 });
    expect(text).toMatch(/^(Very likely|Almost certainly)\./);
  });
});

describe("questions about the user", () => {
  it("'Am I Elon Musk?' gets a short answer plus the base-rate disclaimer", () => {
    const { text } = compileResponse({
      intent: "question", topic: "personal", speechAct: "answer", tone: "cautious", length: "short",
      confidence: 0.55, stance: "mostly_yes", mainClaim: "base_rate_only", qualification: "limited_knowledge",
    });
    expect(text).toMatch(/^(Maybe|Possibly)\./);
    expect(text).toMatch(/base rate|about you|who you are/);
    expect(text).not.toMatch(/maybe I|possibly I/i); // no hedge on the plain claim
    wellFormed(text);
  });
});
