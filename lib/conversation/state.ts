/**
 * Structured conversation memory.
 *
 * We keep a small, typed state instead of replaying the whole transcript.
 * Jev receives this as STATE; the UI persists it between requests.
 */
import type { ConversationState } from "@/types/conversation";
import type { SemanticResponse } from "@/types/semantic";
import type { JevState } from "@/lib/jev/schema";

export const MAX_RECENT = 8;

export function emptyState(): ConversationState {
  return {
    recentMessages: [],
    currentTopic: null,
    knownEntities: [],
    unresolvedQuestion: null,
    userSentiment: null,
    conversationTone: null,
    turnCount: 0,
  };
}

/** Very light entity capture: capitalized tokens that aren't sentence-initial. */
function extractEntities(text: string): string[] {
  const out: string[] = [];
  const re = /(?:^|[^.!?]\s+)([A-Z][a-zA-Z]{2,})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

export function toJevState(state: ConversationState, message: string): JevState {
  return {
    message,
    recentMessages: state.recentMessages.slice(-MAX_RECENT),
    currentTopic: state.currentTopic,
    userSentiment: state.userSentiment,
    unresolvedQuestion: state.unresolvedQuestion,
  };
}

export function advanceState(
  prev: ConversationState,
  userText: string,
  sem: SemanticResponse,
  jevText: string,
): ConversationState {
  const recentMessages = [
    ...prev.recentMessages,
    { role: "user" as const, text: userText },
    { role: "jev" as const, text: jevText },
  ].slice(-MAX_RECENT);

  const knownEntities = Array.from(new Set([...prev.knownEntities, ...extractEntities(userText)])).slice(-20);

  const askedQuestion = ["clarify", "decline"].includes(sem.speechAct) || (sem.followUp && sem.followUp !== "offer_more");

  return {
    recentMessages,
    currentTopic: sem.topic === "other" ? prev.currentTopic : sem.topic,
    knownEntities,
    unresolvedQuestion: askedQuestion ? jevText : null,
    userSentiment: sem.emotion ?? (sem.intent === "emotional_sharing" ? prev.userSentiment : null),
    conversationTone: sem.tone,
    turnCount: prev.turnCount + 1,
  };
}

export function isConversationState(v: unknown): v is ConversationState {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return Array.isArray(s.recentMessages) && typeof s.turnCount === "number";
}
