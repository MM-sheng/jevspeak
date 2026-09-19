import type { JevDecision, SemanticResponse, Topic, Tone, Emotion } from "./semantic";
import type { CompileTrace } from "./language";

export interface UserTurn {
  role: "user";
  id: string;
  text: string;
  at: number;
}

export interface JevTurn {
  role: "jev";
  id: string;
  text: string;
  at: number;
  semantic: SemanticResponse;
  decision: JevDecision;
  trace: CompileTrace;
}

export type Turn = UserTurn | JevTurn;

/**
 * Lightweight structured memory. This is what we hand Jev as STATE —
 * not the raw transcript forever.
 */
export interface ConversationState {
  recentMessages: Array<{ role: "user" | "jev"; text: string }>;
  currentTopic: Topic | null;
  knownEntities: string[];
  unresolvedQuestion: string | null;
  userSentiment: Emotion | null;
  conversationTone: Tone | null;
  turnCount: number;
}

export interface ChatRequest {
  message: string;
  state: ConversationState;
}

export interface ChatResponse {
  ok: true;
  user: UserTurn;
  jev: JevTurn;
  state: ConversationState;
  mode: "mock" | "api";
}

export interface ChatError {
  ok: false;
  code:
    | "bad_request"
    | "jev_unavailable"
    | "jev_malformed"
    | "jev_missing_key"
    | "jev_rate_limited"
    | "jev_network"
    | "compile_failed"
    | "internal";
  message: string;
  detail?: string;
}
