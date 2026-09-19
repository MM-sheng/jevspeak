/**
 * English phrase banks. Keyed by semantic values, never by whole user
 * messages. Each entry is a list of interchangeable variants; the compiler
 * picks one deterministically from the IR seed. Templates decide *wording*;
 * the IR decides *meaning*.
 *
 * `{hedge}` in a claim is replaced with a confidence adverb (or removed).
 */
import type { Claim, Emotion, FollowUp, Intent, Qualification, ResponseGoal, Tone } from "@/types/semantic";

type Bank = readonly string[];

/* ---------- acknowledgement by emotion ---------- */

export const ACK_LOW: Partial<Record<Emotion, Bank>> = {
  sad: ["That sounds like a hard day", "That's a downer", "That's not an easy thing to sit with", "Sorry to hear that"],
  disappointed: ["That sounds rough", "That's frustrating", "That's a letdown", "That's disappointing, and it's fair to feel it"],
  anxious: ["That sounds stressful", "It makes sense to feel uneasy about that", "That kind of waiting is hard", "That's a lot to have on your mind"],
  frustrated: ["That sounds annoying", "I can see why that's irritating", "That would get to anyone", "That sounds like it's been wearing on you"],
  tired: ["That sounds draining", "It sounds like you're running low", "That kind of tired is hard to shake", "Sounds like the tank is close to empty"],
  happy: ["That's good to hear", "Nice", "Good news", "Glad to hear it"],
  excited: ["That's exciting", "Sounds like a big deal, in a good way", "That's something to look forward to", "Nice — that's a real one"],
  curious: ["Good question", "Interesting one", "That's a fair thing to wonder about", "Worth asking"],
};

export const ACK_HIGH: Partial<Record<Emotion, Bank>> = {
  sad: ["I'm sorry — that sounds really hard", "That sounds genuinely painful", "That's a real loss, and it's okay to feel it fully", "I'm sorry. That's heavy"],
  disappointed: ["That's a real letdown, and it's okay to feel it", "That sounds really rough", "That one stings, and it should", "That's a hard thing to have hoped for and not get"],
  anxious: ["That sounds like a lot to carry right now", "That kind of worry is exhausting", "It's understandable to be wound up about this", "That's a heavy thing to be sitting with"],
  frustrated: ["That sounds infuriating", "I'd be frustrated too", "That's genuinely maddening", "Anyone would be angry about that"],
  tired: ["That sounds like real exhaustion, not just a long day", "It sounds like you're worn down", "That's the kind of tired that rest alone doesn't fix", "It sounds like you've been running on empty for a while"],
  happy: ["That's great news", "I'm really glad to hear that", "That's genuinely wonderful", "That's the good kind of news"],
  excited: ["That's really exciting", "That's a big moment", "That's huge — congratulations", "That's the kind of thing worth being excited about"],
  curious: ["That's a genuinely interesting question", "Good question — it's a live debate", "That's one people argue about for good reason", "That's a question with real depth to it"],
};

export const ACK_NEUTRAL: Bank = ["Got it", "Okay", "Understood", "Noted", "Fair enough", "Right"];

/* ---------- reassurance / encouragement lines, by goal ---------- */

export const GOAL_LINE: Partial<Record<ResponseGoal, Bank>> = {
  encourage: ["You can come back from this", "This is recoverable", "You've got more room to move than it feels like", "This isn't the end of the road"],
  reassure: ["It's probably not as final as it feels right now", "One moment like this rarely decides much", "This will look smaller from a little distance", "Right now it feels bigger than it is"],
  connect: ["I'm here for it", "Happy to talk it through", "I'm listening", "Say more if you want"],
  caution: ["It's worth being careful here", "I'd be cautious about this", "This is one to slow down on", "Worth a second look before acting"],
};

/* ---------- claims (finite propositions) ---------- */

export const CLAIM: Record<Claim, Bank> = {
  replace_tasks: [
    "AI will {hedge} replace parts of programming work rather than programmers entirely",
    "AI is {hedge} going to take over some programming tasks, not the whole job",
    "what AI {hedge} replaces is specific tasks, not the role itself",
  ],
  replace_jobs: [
    "AI will {hedge} eliminate a meaningful share of programming jobs",
    "a real number of programming jobs will {hedge} disappear",
    "some programming jobs {hedge} won't survive this",
  ],
  augment_workers: [
    "AI will {hedge} make programmers more productive rather than replace them",
    "the {hedge} outcome is programmers working with AI, not being replaced by it",
    "AI {hedge} ends up as a tool programmers use, not a substitute for them",
  ],
  change_skill_mix: [
    "the skills that matter for programmers will {hedge} shift more than the number of programmers",
    "what changes is {hedge} which skills are valued, not whether people are needed",
    "the job {hedge} changes shape more than it shrinks",
  ],
  yes_generally: ["the answer is {hedge} yes", "it {hedge} holds", "that's {hedge} right"],
  no_generally: ["the answer is {hedge} no", "it {hedge} doesn't hold", "that's {hedge} not the case"],
  depends: [
    "it {hedge} comes down to the specifics",
    "the honest answer is that it depends on the situation",
    "there isn't one answer; it {hedge} hinges on the details",
  ],
  uncertain: ["I don't have a clear read on that", "I can't judge that well", "I don't have a firm view here"],
  one_event_not_defining: [
    "one bad result {hedge} doesn't mean very much on its own",
    "a single setback {hedge} says less about you than it feels like it does",
    "one result {hedge} isn't a verdict on you",
  ],
  effort_compounds: [
    "steady effort {hedge} matters more than any single outcome",
    "what you do next {hedge} counts for more than this one result",
    "the next few weeks {hedge} matter more than this one day",
  ],
  feedback_is_signal: [
    "this is {hedge} more useful as information than as a verdict",
    "it's {hedge} a signal about what to adjust, not a judgment of you",
    "this {hedge} tells you something about what to change, not about your worth",
  ],
  take_break: ["step back for a bit", "take a real break", "give yourself some genuine time off"],
  start_small: ["start with something small and concrete", "pick one small thing and do that first", "shrink it to one step you can take today"],
  practice_more: ["put in some focused practice", "get more reps in", "practice it deliberately, a little at a time"],
  talk_to_someone: ["talk it through with someone you trust", "say this out loud to someone close to you", "let someone you trust in on this"],
  sleep_more: ["prioritize sleep for a few days", "get some proper rest first", "protect your sleep before anything else"],
  reflect_first: ["take a moment to figure out what you actually want here", "get clear on what the real question is", "sort out what matters most to you before deciding"],
  seek_professional: ["talk to a professional about it", "bring this to someone qualified", "get a professional's view on this"],
  markets_unpredictable: [
    "short-term market moves are {hedge} not predictable",
    "nobody can {hedge} call short-term market direction reliably",
    "timing the market {hedge} isn't something anyone does reliably",
  ],
  diversify: ["spread the risk rather than concentrate it", "avoid betting on a single outcome", "keep it spread out rather than all in one place"],
  consult_doctor: ["check with a doctor", "get this looked at by a doctor", "have a doctor take a look"],
  tradeoffs: [
    "each option has real advantages; it's a trade-off, not a clear winner",
    "both sides {hedge} have genuine strengths, so it's about which trade-offs you prefer",
    "neither {hedge} wins outright; they're good at different things",
  ],
  depends_on_goals: [
    "the right answer {hedge} depends on what you're optimizing for",
    "it {hedge} comes down to what you want out of it",
    "what's better {hedge} depends on what you're trying to get",
  ],
  moderation_fine: [
    "in moderation it's {hedge} fine for most people",
    "for most people a reasonable amount is {hedge} not a problem",
    "the dose {hedge} matters more than the thing itself",
  ],
  worth_it_if_used: [
    "it's {hedge} worth it if you'll actually use it",
    "it {hedge} pays off only if it ends up in real use",
    "the value {hedge} depends on whether you'll put it to work",
  ],
  never_too_late: [
    "it's {hedge} not too late; what matters is whether you'll stick with it",
    "starting now is {hedge} fine — consistency matters more than timing",
    "the timing {hedge} matters less than whether you keep going",
  ],
  partial_shift: [
    "the shift will {hedge} be partial and gradual rather than total",
    "it {hedge} happens in pieces, not all at once",
    "expect a {hedge} gradual change, not a clean takeover",
  ],
  nerves_are_normal: [
    "nerves {hedge} are normal and usually mean you care",
    "being nervous {hedge} says you take it seriously, not that you'll do badly",
    "some nerves {hedge} help more than they hurt",
  ],
  celebrate: ["that's worth celebrating", "that deserves a proper celebration", "take a moment to enjoy this one"],
  earned_it: ["you earned that", "that's the result of your own work", "you put in the effort and it paid off"],
  prepare_evidence: ["go in with concrete evidence of your impact", "bring specific examples of what you've delivered", "make the case with numbers and results"],
  ask_directly: ["ask plainly and specifically for what you want", "be direct about what you're asking for", "say exactly what you want, without hedging"],
  narrow_down: ["narrow it down to the smallest case that still fails", "isolate the smallest thing that reproduces it", "cut the problem in half until it's obvious"],
  wait_before_acting: ["give it a day before you decide", "sleep on it before doing anything", "wait until the urge passes and see if it's still there"],
  find_underlying_issue: ["figure out what the fight is really about underneath", "name what's actually at stake beneath the surface topic", "look for the thing under the thing"],
  try_something_new: ["try something you've never done before", "step outside your usual routine for a bit", "pick something unfamiliar and just start"],
  keep_connection: ["keep reaching out; distance doesn't end a friendship", "stay in touch on purpose — it takes deliberate effort now", "make the connection a habit rather than an accident"],
  out_of_scope_factual: [
    "I can't look up or recall facts — I only make judgments",
    "that needs a fact I don't have; I decide meaning, I don't retrieve information",
    "I'm a decision model, not a reference: I can't supply facts or explanations",
  ],
  out_of_scope_creative: [
    "I can't make up jokes or stories — I choose meaning, and code writes the words",
    "composing text isn't something I do; I pick what to say, not how to invent it",
    "creative writing is out of my range: every sentence I say is assembled from fixed pieces",
  ],
  base_rate_only: [
    "I don't know anything about you beyond this conversation — that's just the base rate talking",
    "that's only a base rate; I have no information about who you are",
    "I can't know that about you — I'm going on how likely it is for anyone, not on anything about you",
  ],
  no_self_experience: [
    "I don't have experiences or feelings to report — I'm a decision model",
    "I don't have tastes or an inner life — I'm a decision model, not a person",
    "there's no inner life here to ask about; I judge what's in front of me, that's all",
  ],
};

/** Claims that are imperative advice (rendered with an advice prefix). */
export const ADVICE_CLAIMS: ReadonlySet<Claim> = new Set<Claim>([
  "take_break",
  "start_small",
  "practice_more",
  "talk_to_someone",
  "sleep_more",
  "reflect_first",
  "seek_professional",
  "diversify",
  "consult_doctor",
  "prepare_evidence",
  "ask_directly",
  "narrow_down",
  "wait_before_acting",
  "find_underlying_issue",
  "try_something_new",
  "keep_connection",
]);

/* ---------- qualifications ---------- */

export const QUALIFICATION: Record<Exclude<Qualification, "none">, { connector: string; clause: Bank }> = {
  not_all_jobs: { connector: "though", clause: ["not every role will be affected the same way", "that won't apply evenly across jobs", "some roles will feel it far more than others"] },
  timeline_uncertain: { connector: "and", clause: ["the timeline is genuinely uncertain", "how fast is anyone's guess", "when it happens is much less clear than whether"] },
  industry_specific: { connector: "but", clause: ["it varies a lot by industry", "the details depend on the field", "different fields will see very different versions of this"] },
  technology_uncertain: { connector: "and", clause: ["the technology itself could go several ways", "the tech may not develop the way people expect", "the technology is still a moving target"] },
  depends_on_person: { connector: "though", clause: ["what works depends on you", "your situation might call for something different", "you know your own situation better than I do"] },
  context_dependent: { connector: "though", clause: ["the details matter a lot here", "it depends on the specifics", "it depends on your situation"] },
  limited_knowledge: { connector: "and", clause: ["my read on this is limited", "I don't have a strong basis for more than that", "I'm working with very little here"] },
};

/* ---------- follow-ups ---------- */

export const FOLLOW_UP: Record<Exclude<FollowUp, "none">, Bank> = {
  ask_what_happened: ["What happened?", "Do you want to tell me what happened?", "What led up to it?"],
  ask_clarify: ["Can you say a bit more about what you mean?", "What exactly are you asking?", "Which part do you mean?"],
  ask_which_aspect: ["Which part are you most interested in?", "Is there a specific angle you care about?", "What's the part that matters most to you?"],
  ask_how_feel: ["How are you feeling about it now?", "How are you holding up?", "Where are you at with it right now?"],
  ask_goal: ["What are you trying to get to?", "What would a good outcome look like for you?", "What do you actually want out of this?"],
  ask_timeline: ["Is there a deadline on this?", "How soon do you need to decide?", "What's the timing on this?"],
  offer_more: ["Want me to go deeper on any part?", "I can expand on that if useful.", "Happy to go further if you want."],
  invite_more: ["Go on.", "Tell me more.", "Keep going — I'm listening."],
};

/* ---------- greetings ---------- */

export const GREETING: Partial<Record<Intent, Bank>> = {
  greeting: ["Hi", "Hey", "Hello", "Hi there"],
  farewell: ["Take care", "See you", "Bye for now", "Until next time"],
  thanks: ["You're welcome", "Any time", "Glad it helped", "Happy to"],
};

/* ---------- low confidence / clarification ---------- */

export const DECLINE: Bank = [
  "I'm not confident enough to answer that directly",
  "I don't have a solid enough read on that to answer it straight",
  "I'd be guessing if I answered that directly",
];

/** Decline phrasing when the user asked what *they* should do. */
export const DECLINE_REQUEST: Bank = ["That's not a call I can make for you", "I can't tell you what to do there", "That one has to be your decision"];

export const CLARIFY: Bank = ["I'm not sure I follow", "I want to make sure I understand", "I might be missing what you mean"];

export const STANCE_MIXED: Bank = ["It's mixed", "Partly", "Yes and no", "Some of both"];
export const STANCE_UNCERTAIN: Bank = ["Hard to say", "I can't tell", "I don't have a clear view on that"];

/* ---------- tone colouring (small, surface-only) ---------- */

export const TONE_OPENER: Partial<Record<Tone, Bank>> = {
  casual: ["Honestly,", "So,", "Well,"],
  analytical: ["On balance,", "Looking at it plainly,", "Taken together,"],
  cautious: [],
  confident: [],
  warm: [],
  neutral: [],
};

export const AGREE: Bank = ["I'd agree with that", "That matches my read", "I think that's right", "I see it the same way"];
export const DISAGREE: Bank = ["I'd push back on that a little", "I see it differently", "I'm not sure I'd go that far", "I'd read it another way"];
export const WARN: Bank = ["I'd be careful here", "A word of caution", "This is one to be careful with", "Worth slowing down on this"];
