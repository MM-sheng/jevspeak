/**
 * Deterministic Language Compiler.
 *
 *   SemanticResponse (IR)  →  plan (slots)  →  realize (phrases)  →  grammar  →  text
 *
 * No generative model is involved. Same IR in → same text out. Every step is
 * recorded in a trace so the UI can prove where each word came from.
 */
import { DEPENDS_CLAIMS, GENERIC_CLAIMS, PLAIN_CLAIMS, SCOPE_CLAIMS, type SemanticResponse, type Claim } from "@/types/semantic";
import type { CompiledResponse, TraceStep } from "@/types/language";
import { hashString, pick } from "./seed";
import { confidenceBand, describeBand, type ConfidenceBand } from "./confidence";
import type { LocalePack, Locale } from "./locale";
import { getPack } from "./locales";

export type Slot =
  | "opener"
  | "greeting"
  | "acknowledgement"
  | "goal_line"
  | "short_answer"
  | "stance_line"
  | "claim"
  | "qualification"
  | "decline"
  | "clarify"
  | "follow_up";

export interface CompileOptions {
  locale?: Locale;
}

export interface Plan {
  ir: SemanticResponse;
  slots: Slot[];
  band: ConfidenceBand;
  warnings: string[];
  /** true when a short answer already carries the hedge, so the claim shouldn't repeat it. */
  hedgeCarried: boolean;
}

/** Realized fragments, before grammar assembly. */
type Fragment =
  | { kind: "sentence"; text: string }
  | { kind: "opener"; text: string }
  | { kind: "qualification"; connector: string; clause: string };

/* ------------------------------------------------------------------ */
/* 1. Validate & repair the IR                                          */
/* ------------------------------------------------------------------ */

const NEGATIVE = new Set(["sad", "disappointed", "anxious", "frustrated", "tired"]);
const POSITIVE = new Set(["happy", "excited"]);

export function repairIR(input: SemanticResponse): { ir: SemanticResponse; warnings: string[] } {
  const warnings: string[] = [];
  const ir: SemanticResponse = { ...input };

  if (!Number.isFinite(ir.confidence)) {
    ir.confidence = 0;
    warnings.push("confidence missing → treated as 0");
  }
  ir.confidence = Math.min(1, Math.max(0, ir.confidence));

  if (ir.emotion && ir.emotionIntensity === undefined) {
    ir.emotionIntensity = 0.5;
    warnings.push("emotionIntensity missing → default 0.5");
  }

  if (ir.speechAct === "empathize" && (!ir.emotion || !NEGATIVE.has(ir.emotion))) {
    warnings.push(`empathize without negative emotion (${ir.emotion ?? "none"}) → acknowledge`);
    ir.speechAct = "acknowledge";
  }

  if (ir.speechAct === "answer" && ir.confidence < 0.5) {
    warnings.push(`answer with confidence ${ir.confidence.toFixed(2)} < 0.50 → decline`);
    ir.speechAct = "decline";
    if (!ir.followUp) ir.followUp = "ask_which_aspect";
  }

  if ((ir.speechAct === "answer" || ir.speechAct === "agree" || ir.speechAct === "disagree") && !ir.stance) {
    warnings.push("answer without stance → stance = uncertain");
    ir.stance = "uncertain";
  }

  if (ir.mainClaim === "uncertain" && ir.confidence >= 0.75) {
    warnings.push(`claim "uncertain" contradicts confidence ${ir.confidence.toFixed(2)} → claim dropped`);
    delete ir.mainClaim;
  }

  if (ir.speechAct === "advise" && !ir.mainClaim) {
    warnings.push("advise without a claim → clarify");
    ir.speechAct = "clarify";
    if (!ir.followUp) ir.followUp = "ask_goal";
  }

  if (ir.speechAct === "clarify" && !ir.followUp) {
    ir.followUp = "ask_clarify";
    warnings.push("clarify without follow-up → ask_clarify");
  }

  // A context caveat after a claim that already says "it depends" is noise.
  if (ir.mainClaim && DEPENDS_CLAIMS.has(ir.mainClaim) && (ir.qualification === "context_dependent" || ir.qualification === "depends_on_person")) {
    warnings.push(`qualification ${ir.qualification} redundant after claim ${ir.mainClaim} → dropped`);
    delete ir.qualification;
  }

  // "Yes." + "the answer is yes." says nothing twice.
  if (ir.speechAct === "answer" && ir.mainClaim && GENERIC_CLAIMS.has(ir.mainClaim) && ir.stance && ir.stance !== "uncertain") {
    warnings.push(`claim ${ir.mainClaim} only restates the short answer → dropped`);
    delete ir.mainClaim;
  }

  // Good news is not something to recover from.
  if (ir.emotion && POSITIVE.has(ir.emotion) && (ir.responseGoal === "encourage" || ir.responseGoal === "reassure")) {
    warnings.push(`goal ${ir.responseGoal} with positive emotion ${ir.emotion} → connect`);
    ir.responseGoal = "connect";
  }

  if (ir.speechAct === "ask_follow_up" && !ir.followUp) {
    ir.followUp = "invite_more";
    warnings.push("ask_follow_up without follow-up → invite_more");
  }

  if (ir.speechAct === "greet" && !["greeting", "farewell", "thanks"].includes(ir.intent)) {
    warnings.push(`greet with intent ${ir.intent} → acknowledge`);
    ir.speechAct = "acknowledge";
  }

  return { ir, warnings };
}

/* ------------------------------------------------------------------ */
/* 2. Plan: which semantic layers appear, in what order                  */
/* ------------------------------------------------------------------ */

export function plan(input: SemanticResponse, pack: LocalePack = getPack("en")): Plan {
  const T = pack.templates;
  const { ir, warnings } = repairIR(input);
  const band = confidenceBand(ir.confidence);
  const slots: Slot[] = [];
  let hedgeCarried = false;

  const hasClaim = !!ir.mainClaim;
  const hasQual = !!ir.qualification;
  const hasFollow = !!ir.followUp;
  const tonedOpener = (T.toneOpener[ir.tone]?.length ?? 0) > 0 && ir.length === "medium";

  switch (ir.speechAct) {
    case "greet":
      slots.push("greeting");
      if (hasFollow && ir.length !== "minimal") slots.push("follow_up");
      break;

    case "empathize":
    case "encourage":
      slots.push("acknowledgement");
      if (ir.length !== "minimal") {
        if (hasClaim) slots.push("claim");
        else if (ir.responseGoal && T.goalLine[ir.responseGoal]) slots.push("goal_line");
      }
      if (hasFollow) slots.push("follow_up");
      break;

    case "answer":
      if (ir.mainClaim === "base_rate_only") {
        // "Am I Elon Musk?" → the short answer is fine, but the disclaimer is the point; always keep it.
        if (tonedOpener) slots.push("opener");
        if (ir.stance && ir.stance !== "uncertain") slots.push("short_answer");
        slots.push("claim");
        hedgeCarried = true;
        if (hasFollow && ir.length === "medium") slots.push("follow_up");
        break;
      }
      if (hasClaim && SCOPE_CLAIMS.has(ir.mainClaim!)) {
        // "What's the capital of X?" → no yes/no; say plainly what this model can't do.
        slots.push("claim");
        hedgeCarried = true;
        if (hasFollow && ir.length !== "minimal" && ir.followUp !== "offer_more") slots.push("follow_up");
        break;
      }
      if (tonedOpener) slots.push("opener");
      slots.push("short_answer");
      hedgeCarried = true;
      if (hasClaim && ir.length !== "minimal") slots.push("claim");
      if (hasQual && ir.length !== "minimal") slots.push("qualification");
      if (hasFollow && ir.length === "medium") slots.push("follow_up");
      break;

    case "ask_follow_up":
      if (ir.emotion && ir.emotion !== "curious") slots.push("acknowledgement");
      if (hasClaim && ir.length !== "minimal") slots.push("claim");
      slots.push("follow_up");
      break;

    case "advise":
      if (ir.emotion && NEGATIVE.has(ir.emotion) && ir.length !== "minimal") slots.push("acknowledgement");
      slots.push("claim");
      if (hasQual && ir.length !== "minimal") slots.push("qualification");
      if (hasFollow && ir.length === "medium") slots.push("follow_up");
      break;

    case "agree":
    case "disagree":
      slots.push("stance_line");
      if (hasClaim && ir.length !== "minimal") slots.push("claim");
      if (hasQual && ir.length === "medium") slots.push("qualification");
      if (hasFollow && ir.length === "medium") slots.push("follow_up");
      break;

    case "warn":
      slots.push("stance_line");
      if (hasClaim) slots.push("claim");
      if (hasQual && ir.length !== "minimal") slots.push("qualification");
      if (hasFollow && ir.length === "medium") slots.push("follow_up");
      break;

    case "clarify":
      slots.push("clarify");
      slots.push("follow_up");
      break;

    case "decline":
      if (hasClaim && (SCOPE_CLAIMS.has(ir.mainClaim!) || ir.mainClaim === "base_rate_only")) {
        slots.push("claim");
        hedgeCarried = true;
        if (hasFollow) slots.push("follow_up");
        break;
      }
      slots.push("decline");
      if (hasQual && ir.qualification === "limited_knowledge") slots.push("qualification");
      // Jev may decline the direct question yet still hand us a claim (usually
      // advice, e.g. "seek_professional"); render it as the "but" clause.
      if (hasClaim && T.adviceClaims.has(ir.mainClaim!) && ir.length !== "minimal") slots.push("claim");
      if (hasFollow) slots.push("follow_up");
      break;

    case "acknowledge":
    default:
      slots.push("acknowledgement");
      if (hasClaim && ir.length !== "minimal") slots.push("claim");
      if (ir.responseGoal && T.goalLine[ir.responseGoal] && ir.length === "medium" && !hasClaim) slots.push("goal_line");
      if (hasFollow && ir.length !== "minimal") slots.push("follow_up");
      break;
  }

  return { ir, slots, band, warnings, hedgeCarried };
}

/* ------------------------------------------------------------------ */
/* 3. Realize: slot → phrase                                            */
/* ------------------------------------------------------------------ */

function realizeClaim(p: Plan, pack: LocalePack, seed: number, steps: TraceStep[]): string {
  const { templates: T, confidence: C, grammar: G } = pack;
  const claim = p.ir.mainClaim as Claim;
  const template = pick(T.claim[claim], seed, "claim");
  steps.push({ stage: "realize", slot: "claim", input: claim, output: template });

  if (T.adviceClaims.has(claim)) {
    const prefix = pick(C.advice[p.band], seed, "advice_prefix");
    steps.push({ stage: "realize", slot: "advice_prefix", input: `advicePrefix(${p.ir.confidence.toFixed(2)})`, output: prefix });
    return G.prefix(prefix, template);
  }

  if (p.hedgeCarried || p.band === "insufficient" || PLAIN_CLAIMS.has(claim)) {
    const out = G.fillHedge(template, "");
    steps.push({ stage: "realize", slot: "hedge", input: PLAIN_CLAIMS.has(claim) ? "plain claim → no hedge" : "hedge already carried by short answer", output: out });
    return out;
  }

  // Outside a yes/no judgment, a very confident claim reads best stated plainly:
  // "nerves are normal", not "nerves almost certainly are normal".
  const isJudgmentAct = ["answer", "agree", "disagree", "warn"].includes(p.ir.speechAct);
  if (!isJudgmentAct && (p.band === "very_likely" || p.band === "highly_confident")) {
    const out = G.fillHedge(template, "");
    steps.push({ stage: "realize", slot: "hedge", input: `confidence ${p.ir.confidence.toFixed(2)} in a ${p.ir.speechAct} → stated plainly`, output: out });
    return out;
  }

  // Prefer a sentence-initial frame for the "I think" band; an adverb otherwise.
  if (p.band === "i_think") {
    const prefix = pick(C.prefix[p.band], seed, "hedge_prefix");
    const out = G.prefix(prefix, G.fillHedge(template, ""));
    steps.push({ stage: "realize", slot: "hedge", input: `confidencePrefix(${p.ir.confidence.toFixed(2)})`, output: prefix });
    return out;
  }
  const adverb = C.adverb[p.band];
  const out = template.includes("{hedge}")
    ? G.fillHedge(template, adverb)
    : G.prefix(pick(C.prefix[p.band], seed, "hedge_prefix"), template);
  steps.push({ stage: "realize", slot: "hedge", input: `confidenceAdverb(${p.ir.confidence.toFixed(2)})`, output: adverb });
  return out;
}

function realizeShortAnswer(p: Plan, pack: LocalePack, seed: number, steps: TraceStep[]): string {
  const { templates: T, confidence: C } = pack;
  const { stance } = p.ir;
  let out: string;
  if (stance === "mostly_yes") out = pick(C.yes[p.band], seed, "short_answer");
  else if (stance === "mostly_no") out = pick(C.no[p.band], seed, "short_answer");
  else if (stance === "mixed") out = pick(T.stanceMixed, seed, "short_answer");
  else out = pick(T.stanceUncertain, seed, "short_answer");
  steps.push({
    stage: "realize",
    slot: "short_answer",
    input: `stance=${stance} × ${describeBand(p.band)}`,
    output: out,
  });
  return out;
}

function realizeAck(p: Plan, pack: LocalePack, seed: number, steps: TraceStep[]): string {
  const T = pack.templates;
  const e = p.ir.emotion;
  const intensity = p.ir.emotionIntensity ?? 0;
  const bank = e ? (intensity >= 0.6 ? T.ackHigh[e] : T.ackLow[e]) : undefined;
  if (bank) {
    const out = pick(bank, seed, "ack");
    steps.push({ stage: "realize", slot: "acknowledgement", input: `emotion=${e} intensity=${intensity.toFixed(2)}`, output: out });
    return out;
  }
  const out = pick(T.ackNeutral, seed, "ack");
  steps.push({ stage: "realize", slot: "acknowledgement", input: "emotion=neutral", output: out });
  return out;
}

function realize(p: Plan, pack: LocalePack, seed: number, steps: TraceStep[]): Fragment[] {
  const T = pack.templates;
  const out: Fragment[] = [];
  const sentence = (text: string) => out.push({ kind: "sentence", text });

  for (const slot of p.slots) {
    switch (slot) {
      case "opener": {
        const text = pick(T.toneOpener[p.ir.tone] ?? [], seed, "opener");
        steps.push({ stage: "realize", slot, input: `tone=${p.ir.tone}`, output: text });
        out.push({ kind: "opener", text });
        break;
      }
      case "greeting": {
        const bank = T.greeting[p.ir.intent] ?? T.ackNeutral;
        const text = pick(bank, seed, "greeting");
        steps.push({ stage: "realize", slot, input: `intent=${p.ir.intent}`, output: text });
        sentence(text);
        break;
      }
      case "acknowledgement":
        sentence(realizeAck(p, pack, seed, steps));
        break;
      case "goal_line": {
        const text = pick(T.goalLine[p.ir.responseGoal!]!, seed, "goal");
        steps.push({ stage: "realize", slot, input: `goal=${p.ir.responseGoal}`, output: text });
        sentence(text);
        break;
      }
      case "short_answer":
        sentence(realizeShortAnswer(p, pack, seed, steps));
        break;
      case "stance_line": {
        const bank = p.ir.speechAct === "warn" ? T.warn : p.ir.speechAct === "disagree" ? T.disagree : T.agree;
        const text = pick(bank, seed, "stance_line");
        steps.push({ stage: "realize", slot, input: `speechAct=${p.ir.speechAct}`, output: text });
        sentence(text);
        break;
      }
      case "claim":
        sentence(realizeClaim(p, pack, seed, steps));
        break;
      case "qualification": {
        const q = T.qualification[p.ir.qualification as keyof typeof T.qualification];
        const clause = pick(q.clause, seed, "qualification");
        steps.push({ stage: "realize", slot, input: `qualification=${p.ir.qualification}`, output: `${q.connector} ${clause}` });
        out.push({ kind: "qualification", connector: q.connector, clause });
        break;
      }
      case "decline": {
        const bank = p.ir.intent === "request" ? T.declineRequest : T.decline;
        const text = pick(bank, seed, "decline");
        steps.push({ stage: "realize", slot, input: `confidence=${p.ir.confidence.toFixed(2)} < 0.50`, output: text });
        sentence(text);
        break;
      }
      case "clarify": {
        const text = pick(T.clarify, seed, "clarify");
        steps.push({ stage: "realize", slot, input: "speechAct=clarify", output: text });
        sentence(text);
        break;
      }
      case "follow_up": {
        const bank = T.followUp[p.ir.followUp as keyof typeof T.followUp];
        const text = pick(bank, seed, "follow_up");
        steps.push({ stage: "realize", slot, input: `followUp=${p.ir.followUp}`, output: text });
        sentence(text);
        break;
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 4. Grammar: assemble sentences                                        */
/* ------------------------------------------------------------------ */

function assemble(fragments: Fragment[], pack: LocalePack, steps: TraceStep[]): string {
  const G = pack.grammar;
  const sentences: string[] = [];
  let pendingOpener: string | null = null;

  for (const f of fragments) {
    if (f.kind === "opener") {
      pendingOpener = f.text;
      continue;
    }
    if (f.kind === "qualification") {
      const prev = sentences.pop();
      if (prev) {
        const merged = G.attachClause(prev, f.clause, f.connector);
        steps.push({ stage: "grammar", slot: "attach_qualification", input: `${prev} + (${f.connector}) ${f.clause}`, output: merged });
        sentences.push(merged);
      } else {
        sentences.push(f.clause);
      }
      continue;
    }
    if (pendingOpener) {
      const merged = G.attachOpener(pendingOpener, f.text);
      steps.push({ stage: "grammar", slot: "attach_opener", input: `${pendingOpener} + ${f.text}`, output: merged });
      sentences.push(merged);
      pendingOpener = null;
      continue;
    }
    sentences.push(f.text);
  }
  if (pendingOpener) sentences.push(pendingOpener.replace(/[,:,]$/, ""));

  const punctuated = sentences.map((s) => (G.isQuestion(s) ? s : G.ensureTerminal(s)));
  const text = G.join(punctuated);
  steps.push({ stage: "grammar", slot: "join", input: `${punctuated.length} sentence(s)`, output: text });
  return text;
}

/* ------------------------------------------------------------------ */
/* Public API                                                            */
/* ------------------------------------------------------------------ */

export function compileResponse(input: SemanticResponse, opts: CompileOptions = {}): CompiledResponse {
  const pack = getPack(opts.locale);
  const p = plan(input, pack);
  const seed = hashString(JSON.stringify(p.ir));
  const steps: TraceStep[] = [];

  steps.push({ stage: "plan", slot: "locale", input: pack.locale, output: `templates=${pack.locale} speech=${pack.speechLang}` });

  steps.push({
    stage: "plan",
    slot: "confidence",
    input: `confidence=${p.ir.confidence.toFixed(2)}`,
    output: `band=${p.band} → ${describeBand(p.band)}`,
  });
  steps.push({
    stage: "plan",
    slot: "slots",
    input: `speechAct=${p.ir.speechAct} length=${p.ir.length}`,
    output: p.slots.join(" + "),
  });

  const fragments = realize(p, pack, seed, steps);
  const text = assemble(fragments, pack, steps);

  return {
    text: text || "…",
    trace: { seed, steps, slots: p.slots, warnings: p.warnings, locale: pack.locale },
  };
}
