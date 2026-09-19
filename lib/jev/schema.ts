/**
 * The set of parallel questions we ask Jev on every turn.
 *
 * Jev is a decision model: given STATE, it answers each question with a
 * probability distribution over finite options (or a score in [0,1]).
 * One request → many decisions, resolved in parallel.
 */
import {
  INTENTS,
  TOPICS,
  STANCES,
  CLAIMS,
  QUALIFICATIONS,
  TONES,
  LENGTHS,
  EMOTIONS,
  SPEECH_ACTS,
  RESPONSE_GOALS,
  FOLLOW_UPS,
} from "@/types/semantic";

export type ChoiceQuestion = {
  id: string;
  kind: "choice";
  prompt: string;
  options: readonly string[];
};
export type ScoreQuestion = {
  id: string;
  kind: "score";
  prompt: string;
};
export type JevQuestion = ChoiceQuestion | ScoreQuestion;

export const JEV_QUESTIONS = [
  { id: "intent", kind: "choice", prompt: "What is the user doing with this message?", options: INTENTS },
  { id: "topic", kind: "choice", prompt: "What is the message mainly about?", options: TOPICS },
  { id: "emotion", kind: "choice", prompt: "What emotion is the user expressing?", options: EMOTIONS },
  { id: "emotion_intensity", kind: "score", prompt: "How intense is that emotion (0 = none, 1 = very)?" },
  { id: "speech_act", kind: "choice", prompt: "What kind of response is appropriate?", options: SPEECH_ACTS },
  { id: "stance", kind: "choice", prompt: "If this is a judgment, which way does it lean?", options: STANCES },
  { id: "confidence", kind: "score", prompt: "How confident should the response be overall?" },
  { id: "main_claim", kind: "choice", prompt: "Which proposition best captures the response?", options: CLAIMS },
  { id: "qualification", kind: "choice", prompt: "What caveat, if any, should accompany the claim?", options: QUALIFICATIONS },
  { id: "response_goal", kind: "choice", prompt: "What should the response achieve?", options: RESPONSE_GOALS },
  { id: "follow_up", kind: "choice", prompt: "What follow-up, if any, should be asked?", options: FOLLOW_UPS },
  { id: "tone", kind: "choice", prompt: "What tone fits?", options: TONES },
  { id: "verbosity", kind: "choice", prompt: "How long should the response be?", options: LENGTHS },
] as const satisfies readonly JevQuestion[];

export type JevQuestionId = (typeof JEV_QUESTIONS)[number]["id"];

/** Raw shape we accept back from Jev (mock or API) before normalization. */
export type RawChoiceAnswer = { distribution: Record<string, number> };
export type RawScoreAnswer = { value: number };
export type RawAnswer = RawChoiceAnswer | RawScoreAnswer;

export interface RawJevResponse {
  answers: Record<string, RawAnswer>;
}

/** STATE block handed to Jev. Structured, not a raw transcript dump. */
export interface JevState {
  message: string;
  recentMessages: Array<{ role: "user" | "jev"; text: string }>;
  currentTopic: string | null;
  userSentiment: string | null;
  unresolvedQuestion: string | null;
}

export interface JevRequest {
  state: JevState;
  questions: readonly JevQuestion[];
}
