/**
 * Phrase banks. Keyed by semantic values, never by whole user messages.
 * Each entry is a list of interchangeable variants; the compiler picks one
 * deterministically from the IR seed. Templates decide *wording*; the IR
 * decides *meaning*.
 *
 * `{hedge}` in a claim is replaced with a confidence adverb (or removed).
 */
import type {
  Claim,
  Emotion,
  FollowUp,
  Intent,
  Qualification,
  ResponseGoal,
  Tone,
} from "@/types/semantic";

type Bank = readonly string[];

/* ---------- acknowledgement by emotion ---------- */

export const ACK_LOW: Partial<Record<Emotion, Bank>> = {
  sad: ["That sounds like a hard day", "That's a downer"],
  disappointed: ["That sounds rough", "That's frustrating"],
  anxious: ["That sounds stressful", "It makes sense to feel uneasy about that"],
  frustrated: ["That sounds annoying", "I can see why that's irritating"],
  tired: ["That sounds draining", "It sounds like you're running low"],
  happy: ["That's good to hear", "Nice"],
  excited: ["That's exciting", "Sounds like a big deal, in a good way"],
  curious: ["Good question", "Interesting one"],
};

export const ACK_HIGH: Partial<Record<Emotion, Bank>> = {
  sad: ["I'm sorry — that sounds really hard", "That sounds genuinely painful"],
  disappointed: ["That's a real letdown, and it's okay to feel it", "That sounds really rough"],
  anxious: ["That sounds like a lot to carry right now", "That kind of worry is exhausting"],
  frustrated: ["That sounds infuriating", "I'd be frustrated too"],
  tired: ["That sounds like real exhaustion, not just a long day", "It sounds like you're worn down"],
  happy: ["That's great news", "I'm really glad to hear that"],
  excited: ["That's really exciting", "That's a big moment"],
  curious: ["That's a genuinely interesting question", "Good question — it's a live debate"],
};

export const ACK_NEUTRAL: Bank = ["Got it", "Okay", "Understood", "Noted"];

/* ---------- reassurance / encouragement lines, by goal ---------- */

export const GOAL_LINE: Partial<Record<ResponseGoal, Bank>> = {
  encourage: ["You can come back from this", "This is recoverable"],
  reassure: ["It's probably not as final as it feels right now", "One moment like this rarely decides much"],
  connect: ["I'm here for it", "Happy to talk it through"],
  caution: ["It's worth being careful here", "I'd be cautious about this"],
};

/* ---------- claims (finite propositions) ---------- */

export const CLAIM: Record<Claim, Bank> = {
  replace_tasks: [
    "AI will {hedge} replace parts of programming work rather than programmers entirely",
    "AI is {hedge} going to take over some programming tasks, not the whole job",
  ],
  replace_jobs: [
    "AI will {hedge} eliminate a meaningful share of programming jobs",
    "a real number of programming jobs will {hedge} disappear",
  ],
  augment_workers: [
    "AI will {hedge} make programmers more productive rather than replace them",
    "the {hedge} outcome is programmers working with AI, not being replaced by it",
  ],
  change_skill_mix: [
    "the skills that matter for programmers will {hedge} shift more than the number of programmers",
    "what changes is {hedge} which skills are valued, not whether people are needed",
  ],
  yes_generally: ["the answer is {hedge} yes", "it {hedge} holds"],
  no_generally: ["the answer is {hedge} no", "it {hedge} doesn't hold"],
  depends: ["it {hedge} depends on the specifics", "the honest answer is that it depends"],
  uncertain: ["I don't have a clear read on that", "I can't judge that well"],
  one_event_not_defining: [
    "one bad result {hedge} doesn't mean very much on its own",
    "a single setback {hedge} says less about you than it feels like it does",
  ],
  effort_compounds: [
    "steady effort {hedge} matters more than any single outcome",
    "what you do next {hedge} counts for more than this one result",
  ],
  feedback_is_signal: [
    "this is {hedge} more useful as information than as a verdict",
    "it's {hedge} a signal about what to adjust, not a judgment of you",
  ],
  take_break: ["step back for a bit", "take a real break"],
  start_small: ["start with something small and concrete", "pick one small thing and do that first"],
  practice_more: ["put in some focused practice", "get more reps in"],
  talk_to_someone: ["talk it through with someone you trust", "say this out loud to someone close to you"],
  sleep_more: ["prioritize sleep for a few days", "get some proper rest first"],
  reflect_first: ["take a moment to figure out what you actually want here", "get clear on what the real question is"],
  seek_professional: ["talk to a professional about it", "bring this to someone qualified"],
  markets_unpredictable: [
    "short-term market moves are {hedge} not predictable",
    "nobody can {hedge} call short-term market direction reliably",
  ],
  diversify: ["spread the risk rather than concentrate it", "avoid betting on a single outcome"],
  consult_doctor: ["check with a doctor", "get this looked at by a doctor"],
};

/** Claims that are imperative advice (rendered with an advice prefix). */
export const ADVICE_CLAIMS: ReadonlySet<Claim> = new Set([
  "take_break",
  "start_small",
  "practice_more",
  "talk_to_someone",
  "sleep_more",
  "reflect_first",
  "seek_professional",
  "diversify",
  "consult_doctor",
]);

/* ---------- qualifications ---------- */

export const QUALIFICATION: Record<Exclude<Qualification, "none">, { connector: string; clause: Bank }> = {
  not_all_jobs: { connector: "though", clause: ["not every role will be affected the same way", "that won't apply evenly across jobs"] },
  timeline_uncertain: { connector: "and", clause: ["the timeline is genuinely uncertain", "how fast is anyone's guess"] },
  industry_specific: { connector: "but", clause: ["it varies a lot by industry", "the details depend on the field"] },
  technology_uncertain: { connector: "and", clause: ["the technology itself could go several ways", "the tech may not develop the way people expect"] },
  depends_on_person: { connector: "though", clause: ["what works depends on you", "your situation might call for something different"] },
  context_dependent: { connector: "and", clause: ["the details matter a lot here", "the specifics change the answer"] },
  limited_knowledge: { connector: "and", clause: ["my read on this is limited", "I don't have a strong basis for more than that"] },
};

/* ---------- follow-ups ---------- */

export const FOLLOW_UP: Record<Exclude<FollowUp, "none">, Bank> = {
  ask_what_happened: ["What happened?", "Do you want to tell me what happened?"],
  ask_clarify: ["Can you say a bit more about what you mean?", "What exactly are you asking?"],
  ask_which_aspect: ["Which part are you most interested in?", "Is there a specific angle you care about?"],
  ask_how_feel: ["How are you feeling about it now?", "How are you holding up?"],
  ask_goal: ["What are you trying to get to?", "What would a good outcome look like for you?"],
  ask_timeline: ["Is there a deadline on this?", "How soon do you need to decide?"],
  offer_more: ["Want me to go deeper on any part?", "I can expand on that if useful."],
};

/* ---------- greetings ---------- */

export const GREETING: Partial<Record<Intent, Bank>> = {
  greeting: ["Hi", "Hey", "Hello"],
  farewell: ["Take care", "See you", "Bye for now"],
  thanks: ["You're welcome", "Any time", "Glad it helped"],
};

/* ---------- low confidence / clarification ---------- */

export const DECLINE: Bank = [
  "I'm not confident enough to answer that directly",
  "I don't have a solid enough read on that to answer it straight",
];

export const CLARIFY: Bank = [
  "I'm not sure I follow",
  "I want to make sure I understand",
];

export const STANCE_MIXED: Bank = ["It's mixed", "Partly", "Yes and no"];
export const STANCE_UNCERTAIN: Bank = ["Hard to say", "I can't tell"];

/* ---------- tone colouring (small, surface-only) ---------- */

export const TONE_OPENER: Partial<Record<Tone, Bank>> = {
  casual: ["Honestly,", "So,"],
  analytical: ["On balance,", "Looking at it plainly,"],
  cautious: ["Carefully:", "With some caution,"],
  confident: [],
  warm: [],
  neutral: [],
};

export const AGREE: Bank = ["I'd agree with that", "That matches my read"];
export const DISAGREE: Bank = ["I'd push back on that a little", "I see it differently"];
export const WARN: Bank = ["I'd be careful here", "A word of caution"];
