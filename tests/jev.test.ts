import { describe, expect, it } from "vitest";
import { normalizeDecision, toSemantic } from "@/lib/jev/decision";
import { mockInfer } from "@/lib/jev/mock";
import { JEV_QUESTIONS } from "@/lib/jev/schema";
import { JevError } from "@/lib/jev/errors";
import { compileResponse } from "@/lib/language";

const state = (message: string) => ({ message, recentMessages: [], currentTopic: null, userSentiment: null, unresolvedQuestion: null });

describe("mock jev", () => {
  it("answers every question with a valid distribution", async () => {
    const raw = await mockInfer({ state: state("Will AI replace programmers?"), questions: JEV_QUESTIONS });
    const d = normalizeDecision(raw, { source: "mock", latencyMs: 0 });
    for (const q of JEV_QUESTIONS) {
      if (q.kind === "choice") {
        const sum = d.dimensions[q.id].options.reduce((a, o) => a + o.probability, 0);
        expect(sum).toBeCloseTo(1, 5);
      } else {
        expect(d.scores[q.id]).toBeGreaterThanOrEqual(0);
        expect(d.scores[q.id]).toBeLessThanOrEqual(1);
      }
    }
  });

  it("is deterministic for the same input", async () => {
    const a = await mockInfer({ state: state("I failed my exam today."), questions: JEV_QUESTIONS });
    const b = await mockInfer({ state: state("I failed my exam today."), questions: JEV_QUESTIONS });
    expect(a).toEqual(b);
  });

  it("routes the canonical examples sensibly", async () => {
    const q = toSemantic(normalizeDecision(await mockInfer({ state: state("Will AI replace programmers?"), questions: JEV_QUESTIONS }), { source: "mock", latencyMs: 0 }));
    expect(q.intent).toBe("question");
    expect(q.speechAct).toBe("answer");
    expect(q.stance).toBe("mostly_yes");
    const e = toSemantic(normalizeDecision(await mockInfer({ state: state("I failed my exam today."), questions: JEV_QUESTIONS }), { source: "mock", latencyMs: 0 }));
    expect(e.intent).toBe("emotional_sharing");
    expect(e.speechAct).toBe("empathize");
    expect(compileResponse(e).text).toMatch(/What happened\?|what happened\?$/);
  });
});

describe("normalization", () => {
  it("rejects a missing answer", () => {
    expect(() => normalizeDecision({ answers: {} }, { source: "api", latencyMs: 0 })).toThrow(JevError);
  });
  it("rejects unknown-only options", () => {
    const answers: Record<string, unknown> = {};
    for (const q of JEV_QUESTIONS) answers[q.id] = q.kind === "choice" ? { distribution: { bogus: 1 } } : { value: 0.5 };
    expect(() => normalizeDecision({ answers } as never, { source: "api", latencyMs: 0 })).toThrow(/no known options/);
  });
  it("renormalizes and drops unknown options", () => {
    const answers: Record<string, unknown> = {};
    for (const q of JEV_QUESTIONS)
      answers[q.id] = q.kind === "choice" ? { distribution: { [q.options[0]]: 3, [q.options[1]]: 1, bogus: 5 } } : { value: 2 };
    const d = normalizeDecision({ answers } as never, { source: "api", latencyMs: 0 });
    expect(d.dimensions.intent.probability).toBeCloseTo(0.75);
    expect(d.scores.confidence).toBe(1);
  });
});

describe("confidence lowering", () => {
  const build = (overrides: { answerable: number; stance: Record<string, number>; act?: string }) => {
    const answers: Record<string, unknown> = {};
    for (const q of JEV_QUESTIONS) {
      if (q.kind === "choice") answers[q.id] = { distribution: { [q.options[0]]: 1 } };
      else answers[q.id] = { value: 0.5 };
    }
    answers.confidence = { value: overrides.answerable };
    answers.stance = { distribution: overrides.stance };
    answers.speech_act = { distribution: { [overrides.act ?? "answer"]: 1 } };
    return toSemantic(normalizeDecision({ answers } as never, { source: "api", latencyMs: 0 }));
  };

  it("below the answerability threshold, confidence is the (low) answerability so the compiler declines", () => {
    const s = build({ answerable: 0.32, stance: { mostly_yes: 0.9 } });
    expect(s.confidence).toBe(0.32);
    expect(compileResponse(s).text).toMatch(/not confident|solid enough/);
  });
  it("for a judgment, confidence is the probability Jev put on the chosen stance", () => {
    const s = build({ answerable: 0.9, stance: { mostly_yes: 0.62, mixed: 0.3, mostly_no: 0.08 } });
    expect(s.confidence).toBeCloseTo(0.62);
    expect(compileResponse(s).text).toMatch(/^(I think so|I'd lean yes)/);
  });
  it("for a non-judgment act, confidence is answerability", () => {
    const s = build({ answerable: 0.88, stance: { mostly_yes: 0.62 }, act: "acknowledge" });
    expect(s.confidence).toBeCloseTo(0.88);
  });
});
