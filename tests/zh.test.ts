import { describe, expect, it } from "vitest";
import { compileResponse } from "@/lib/language";
import type { SemanticResponse } from "@/types/semantic";

const base: SemanticResponse = {
  intent: "question", topic: "ai", speechAct: "answer", tone: "analytical", length: "short",
  confidence: 0.77, stance: "mostly_yes", mainClaim: "replace_tasks", qualification: "not_all_jobs",
};

const wellFormedZh = (text: string) => {
  expect(text.length).toBeGreaterThan(0);
  expect(text).toMatch(/[。?!]$/);
  expect(text).not.toMatch(/\{hedge\}/);
  expect(text).not.toMatch(/[a-z]\s[a-z]/i); // no stray English words
  expect(text).not.toMatch(/。。/);
  expect(text).not.toMatch(/\s/); // CJK text has no spaces
};

describe("zh locale", () => {
  it("renders the same IR in Chinese", () => {
    const { text, trace } = compileResponse(base, { locale: "zh" });
    expect(trace.locale).toBe("zh");
    expect(text).toMatch(/^(大概率是|多半是)。AI/);
    expect(text).toMatch(/,不过/);
    wellFormedZh(text);
  });

  it("maps confidence bands to Chinese hedges", () => {
    expect(compileResponse({ ...base, confidence: 0.54 }, { locale: "zh" }).text).toMatch(/^(也许吧|有可能)。/);
    expect(compileResponse({ ...base, confidence: 0.71 }, { locale: "zh" }).text).toMatch(/^(我觉得是|我倾向于是)。/);
    expect(compileResponse({ ...base, confidence: 0.95 }, { locale: "zh" }).text).toMatch(/^(很可能是|基本可以说是)。/);
    expect(compileResponse({ ...base, confidence: 0.41 }, { locale: "zh" }).text).toMatch(/把握|依据/);
  });

  it("negation", () => {
    expect(compileResponse({ ...base, stance: "mostly_no", confidence: 0.86, mainClaim: undefined, qualification: undefined }, { locale: "zh" }).text)
      .toMatch(/^(大概率不会|多半不会)。$/);
  });

  it("uses an inline adverb hedge for claims without a short answer", () => {
    const { text } = compileResponse({
      intent: "emotional_sharing", topic: "learning", speechAct: "empathize", tone: "warm", length: "short",
      confidence: 0.82, emotion: "disappointed", emotionIntensity: 0.7, mainClaim: "one_event_not_defining", followUp: "ask_what_happened",
    }, { locale: "zh" });
    expect(text).toMatch(/大概率/);
    expect(text).toMatch(/\?$/);
    wellFormedZh(text);
  });

  it("every speech act yields well-formed Chinese with no optional fields", () => {
    const acts: SemanticResponse["speechAct"][] = ["answer", "acknowledge", "agree", "disagree", "clarify", "empathize", "encourage", "warn", "advise", "ask_follow_up", "greet", "decline"];
    for (const speechAct of acts) {
      const { text } = compileResponse({ intent: "other", topic: "other", speechAct, tone: "neutral", length: "short", confidence: 0.7 }, { locale: "zh" });
      wellFormedZh(text);
    }
  });

  it("is deterministic and independent of the English rendering", () => {
    const a = compileResponse(base, { locale: "zh" }).text;
    const b = compileResponse(base, { locale: "zh" }).text;
    expect(a).toBe(b);
    expect(a).not.toBe(compileResponse(base).text);
  });
});
