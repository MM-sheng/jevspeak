/**
 * The set of parallel questions we ask Jev on every turn.
 *
 * Jev (TypeSafe System One) is a decision model: given STATE, it answers each
 * question with a probability distribution over finite options (choice), a
 * position on an ordered scale (score), or a probability of "true" (noul).
 * One request → many decisions, resolved in parallel.
 *
 * Every option carries a short criterion. These descriptions are what Jev
 * actually reads when deciding — they are the closest thing this project has
 * to a "prompt", and they are the only place semantics are explained in prose.
 */
import type {
  Claim,
  Emotion,
  FollowUp,
  Intent,
  Qualification,
  ResponseGoal,
  ResponseLength,
  SpeechAct,
  Stance,
  Tone,
  Topic,
} from "@/types/semantic";

export type ChoiceQuestion = {
  id: string;
  kind: "choice";
  prompt: string;
  /** option → criterion. Key order is the display order. */
  criteria: Record<string, string>;
  options: readonly string[];
};
export type ScoreQuestion = {
  id: string;
  kind: "score";
  prompt: string;
  /** Ordered anchors, low → high. Jev returns an index into this array. */
  anchors: readonly string[];
};
export type NoulQuestion = {
  id: string;
  kind: "noul";
  prompt: string;
  criteria: { true: string; false: string };
};
export type JevQuestion = ChoiceQuestion | ScoreQuestion | NoulQuestion;

function choice<T extends string>(id: string, prompt: string, criteria: Record<T, string>): ChoiceQuestion {
  return { id, kind: "choice", prompt, criteria, options: Object.keys(criteria) };
}

const INTENT = choice<Intent>("intent", "What is the user doing with this message?", {
  question: "Asking for information, an opinion, or a judgment",
  statement: "Stating an opinion, belief, or fact without asking anything",
  request: "Asking for advice, help, or a recommendation on what to do",
  emotional_sharing: "Telling us about something that happened to them and how they feel about it",
  greeting: "Saying hello or opening the conversation",
  farewell: "Saying goodbye or closing the conversation",
  thanks: "Expressing gratitude",
  other: "Unclear, nonsensical, or none of the above",
});

const TOPIC = choice<Topic>("topic", "What is the message mainly about?", {
  ai: "Artificial intelligence, language models, automation, robots",
  technology: "Software, programming, computers, apps, tech products (not AI specifically)",
  economics: "The economy, inflation, GDP, macro trends, unemployment",
  work: "Jobs, careers, employers, interviews, the workplace",
  learning: "Studying, exams, school, university, learning a skill",
  personal: "The user's own life, feelings, habits, or decisions",
  health: "Physical or mental health, sleep, symptoms, exercise",
  relationships: "Friends, family, partners, dating, social conflict",
  markets: "Investing, stocks, crypto, trading, personal finance",
  other: "Something not covered by the other topics",
});

const EMOTION = choice<Emotion>("emotion", "What emotion is the user expressing?", {
  neutral: "No particular emotion; matter-of-fact",
  happy: "Pleased, content, glad",
  excited: "Energized, enthusiastic, eager",
  curious: "Interested, wondering, wanting to understand",
  sad: "Unhappy, low, grieving",
  disappointed: "Let down by an outcome they hoped would go differently",
  anxious: "Worried, nervous, stressed about something uncertain",
  frustrated: "Annoyed, irritated, angry at an obstacle",
  tired: "Exhausted, drained, burnt out",
});

const EMOTION_INTENSITY: ScoreQuestion = {
  id: "emotion_intensity",
  kind: "score",
  prompt: "How intense is the emotion the user is expressing?",
  anchors: ["No emotion expressed", "Mild", "Moderate", "Strong", "Overwhelming"],
};

const SPEECH_ACT = choice<SpeechAct>("speech_act", "What kind of response is appropriate?", {
  answer: "Give a direct answer or considered judgment to a question — hedged is fine",
  acknowledge: "Register what they said without adding a judgment",
  agree: "Express agreement with an opinion they stated",
  disagree: "Push back on an opinion they stated",
  clarify: "The message cannot be interpreted (gibberish, a fragment, or genuinely ambiguous between very different readings); ask what they mean",
  empathize: "They shared something negative; respond to the feeling first",
  encourage: "They need a boost; respond with encouragement",
  warn: "There is a risk they should be cautious about (health, money, safety)",
  advise: "They asked what to do; give a concrete suggestion",
  ask_follow_up: "The best move is simply to ask a follow-up question",
  greet: "Respond to a greeting, farewell, or thanks in kind",
  decline: "We cannot answer this responsibly; say so",
});

const STANCE = choice<Stance>("stance", "If this calls for a judgment, which way does the honest answer lean?", {
  mostly_yes: "The answer leans yes / affirmative",
  mostly_no: "The answer leans no / negative",
  mixed: "Genuinely both; it depends on the specifics",
  uncertain: "Not enough basis to lean either way, or no judgment is being asked for",
});

const CONFIDENCE: NoulQuestion = {
  id: "confidence",
  kind: "noul",
  prompt: "Can this message be responded to substantively, without inventing facts?",
  criteria: {
    true: "A reasonable response is possible: a hedged opinion or judgment about a trend, emotional support, general advice, agreement, or a simple social reply. Uncertainty about the future is fine as long as a considered view can be given.",
    false: "A real response would require specific facts we do not have (exact figures, dates, statistics, private details about the user), or the message is unintelligible.",
  },
};

const MAIN_CLAIM = choice<Claim>("main_claim", "Which single proposition best captures what the response should say?", {
  replace_tasks: "AI will take over parts of programming work, not programmers entirely",
  replace_jobs: "A meaningful share of programming jobs will disappear",
  augment_workers: "AI will make programmers more productive rather than replace them",
  change_skill_mix: "The skills that matter will shift more than headcount",
  yes_generally: "A general affirmative answer to the question",
  no_generally: "A general negative answer to the question",
  depends: "The honest answer depends on specifics",
  uncertain: "No clear proposition applies, or none is needed",
  one_event_not_defining: "One bad result does not define them or mean much on its own",
  effort_compounds: "Steady effort matters more than any single outcome",
  feedback_is_signal: "This result is useful information, not a verdict",
  take_break: "Advice: step back and rest",
  start_small: "Advice: pick one small concrete step",
  practice_more: "Advice: focused practice / repetition",
  talk_to_someone: "Advice: talk it through with someone they trust",
  sleep_more: "Advice: prioritize sleep",
  reflect_first: "Advice: get clear on what they actually want before acting",
  seek_professional: "Advice: bring this to a qualified professional",
  markets_unpredictable: "Short-term market moves cannot be predicted reliably",
  diversify: "Advice: spread risk rather than concentrate it",
  consult_doctor: "Advice: get this checked by a doctor",
});

const QUALIFICATION = choice<Qualification>("qualification", "What caveat, if any, should accompany the response?", {
  none: "No caveat needed",
  not_all_jobs: "It won't apply evenly across roles or jobs",
  timeline_uncertain: "How fast this happens is genuinely uncertain",
  industry_specific: "It varies a lot by industry or field",
  technology_uncertain: "The technology itself could develop in several directions",
  depends_on_person: "What works depends on the individual",
  context_dependent: "The details of the situation change the answer",
  limited_knowledge: "Our basis for saying more is limited",
});

const RESPONSE_GOAL = choice<ResponseGoal>("response_goal", "What should the response achieve?", {
  inform: "Give them information or a judgment",
  encourage: "Lift them up / motivate",
  reassure: "Reduce worry; put the situation in proportion",
  guide: "Point them toward a concrete action",
  clarify: "Resolve ambiguity about what they mean",
  connect: "Simple social connection; be present",
  caution: "Make them aware of a risk",
});

const FOLLOW_UP = choice<FollowUp>("follow_up", "What follow-up question, if any, should end the response?", {
  none: "No follow-up needed",
  ask_what_happened: "Ask them to tell us what happened",
  ask_clarify: "Ask what they mean",
  ask_which_aspect: "Ask which aspect of the topic they care about",
  ask_how_feel: "Ask how they are feeling now",
  ask_goal: "Ask what outcome they want",
  ask_timeline: "Ask about deadlines or timing",
  offer_more: "Offer to go deeper",
});

const TONE = choice<Tone>("tone", "What tone fits the response?", {
  neutral: "Plain and even",
  warm: "Kind, personal, supportive",
  analytical: "Measured, reasoning-forward",
  casual: "Light, informal",
  cautious: "Careful, hedged",
  confident: "Direct and assured",
});

const VERBOSITY = choice<ResponseLength>("verbosity", "How long should the response be?", {
  minimal: "A few words; one short sentence",
  short: "One or two sentences",
  medium: "Two to four sentences with a caveat or follow-up",
});

export const JEV_QUESTIONS: readonly JevQuestion[] = [
  INTENT,
  TOPIC,
  EMOTION,
  EMOTION_INTENSITY,
  SPEECH_ACT,
  STANCE,
  CONFIDENCE,
  MAIN_CLAIM,
  QUALIFICATION,
  RESPONSE_GOAL,
  FOLLOW_UP,
  TONE,
  VERBOSITY,
];

/**
 * Raw shape we accept back from Jev (mock or API) before normalization.
 * The client maps the wire format to this; the mock produces it directly.
 */
export type RawChoiceAnswer = { distribution: Record<string, number>; confidence?: number };
/** Score and noul both normalize to a value in [0, 1]. */
export type RawScoreAnswer = { value: number; confidence?: number };
export type RawAnswer = RawChoiceAnswer | RawScoreAnswer;

export interface RawJevResponse {
  answers: Record<string, RawAnswer>;
  model?: string;
  usage?: { input_tokens: number; output_tokens: number };
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
