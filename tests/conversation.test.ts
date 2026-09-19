import { describe, expect, it } from "vitest";
import { advanceState, emptyState, MAX_RECENT } from "@/lib/conversation/state";
import type { SemanticResponse } from "@/types/semantic";

const sem: SemanticResponse = { intent: "question", topic: "ai", speechAct: "answer", tone: "analytical", length: "short", confidence: 0.7 };

describe("conversation state", () => {
  it("keeps only the recent window", () => {
    let s = emptyState();
    for (let i = 0; i < 20; i++) s = advanceState(s, `m${i}`, sem, `r${i}`);
    expect(s.recentMessages.length).toBe(MAX_RECENT);
    expect(s.turnCount).toBe(20);
    expect(s.currentTopic).toBe("ai");
  });
  it("tracks unresolved questions", () => {
    const s = advanceState(emptyState(), "hi", { ...sem, speechAct: "clarify", followUp: "ask_clarify" }, "What do you mean?");
    expect(s.unresolvedQuestion).toBe("What do you mean?");
    const t = advanceState(s, "ok", sem, "Sure.");
    expect(t.unresolvedQuestion).toBeNull();
  });
  it("does not overwrite topic with other", () => {
    const s = advanceState(emptyState(), "x", sem, "y");
    const t = advanceState(s, "x", { ...sem, topic: "other" }, "y");
    expect(t.currentTopic).toBe("ai");
  });
});
