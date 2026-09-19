import { describe, expect, it } from "vitest";
import { fromWire, toWire } from "@/lib/jev/client";
import { JEV_QUESTIONS } from "@/lib/jev/schema";
import { normalizeDecision, toSemantic } from "@/lib/jev/decision";
import { JevError } from "@/lib/jev/errors";

const req = {
  state: { message: "Will AI replace programmers?", recentMessages: [], currentTopic: null, userSentiment: null, unresolvedQuestion: null },
  questions: JEV_QUESTIONS,
};

describe("toWire (TypeSafe System One)", () => {
  it("emits model, state object and keyed questions with criteria", () => {
    const w = toWire(req, "jev-latest");
    expect(w.model).toBe("jev-latest");
    expect(w.state.LATEST_USER_MESSAGE).toBe("Will AI replace programmers?");
    expect(w.questions.intent).toMatchObject({ type: "choice", instructions: expect.any(String) });
    expect(Object.keys((w.questions.intent as { criteria: object }).criteria)).toContain("question");
    expect(w.questions.emotion_intensity).toMatchObject({ type: "score", criteria: expect.any(Array) });
    expect(w.questions.confidence).toMatchObject({ type: "noul", criteria: { true: expect.any(String), false: expect.any(String) } });
  });
});

/** Build a full, well-formed API response like the one in TypeSafe's docs. */
function fakeApiResponse(overrides: Record<string, unknown> = {}) {
  const answers: Record<string, unknown> = {};
  for (const q of JEV_QUESTIONS) {
    if (q.kind === "choice") {
      const probabilities: Record<string, number> = {};
      q.options.forEach((o, i) => (probabilities[o] = i === 0 ? 0.7 : 0.3 / (q.options.length - 1)));
      answers[q.id] = { type: "choice", choice: q.options[0], probabilities, confidence: 0.81 };
    } else if (q.kind === "score") {
      answers[q.id] = { type: "score", score: 2.5, legend: {}, probabilities: {}, confidence: 0.6 };
    } else {
      answers[q.id] = { type: "noul", noul: 0.77 };
    }
  }
  return { model: "jev-1.13", answers: { ...answers, ...overrides }, usage: { input_tokens: 312, output_tokens: 48 } };
}

describe("fromWire", () => {
  it("maps choice probabilities, score index → [0,1], and noul → value", () => {
    const raw = fromWire(fakeApiResponse(), JEV_QUESTIONS);
    expect(raw.model).toBe("jev-1.13");
    expect((raw.answers.intent as { distribution: Record<string, number> }).distribution.question).toBeCloseTo(0.7);
    expect((raw.answers.intent as { confidence?: number }).confidence).toBe(0.81);
    // 5 anchors → max index 4; 2.5 / 4
    expect((raw.answers.emotion_intensity as { value: number }).value).toBeCloseTo(0.625);
    expect((raw.answers.confidence as { value: number }).value).toBe(0.77);
  });

  it("flows through normalization into a usable IR", () => {
    const d = normalizeDecision(fromWire(fakeApiResponse(), JEV_QUESTIONS), { source: "api", latencyMs: 90 });
    expect(d.model).toBe("jev-1.13");
    expect(d.dimensions.intent.confidence).toBe(0.81);
    expect(d.scores.confidence).toBe(0.77);
    const sem = toSemantic(d);
    expect(sem.intent).toBe("question");
    // speech_act=answer with stance mostly_yes @ 0.70 → the hedge follows the stance probability
    expect(sem.confidence).toBeCloseTo(0.7);
  });

  it("rejects a missing answers object", () => {
    expect(() => fromWire({ model: "x" }, JEV_QUESTIONS)).toThrow(JevError);
  });
  it("rejects a missing question", () => {
    const r = fakeApiResponse();
    delete (r.answers as Record<string, unknown>).tone;
    expect(() => fromWire(r, JEV_QUESTIONS)).toThrow(/did not answer "tone"/);
  });
  it("rejects a choice without probabilities", () => {
    expect(() => fromWire(fakeApiResponse({ intent: { type: "choice", choice: "question" } }), JEV_QUESTIONS)).toThrow(/probabilities/);
  });
  it("rejects a non-numeric score", () => {
    expect(() => fromWire(fakeApiResponse({ emotion_intensity: { type: "score", score: "high" } }), JEV_QUESTIONS)).toThrow(/numeric score/);
  });
});
