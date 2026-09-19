/**
 * Mock Jev.
 *
 * A deterministic, feature-based scorer that produces *distributions* over
 * the same questions the real Jev answers. It exists so the whole pipeline
 * can be developed without API access. It is NOT a language model and it is
 * clearly labelled "mock" in the UI. Probabilities come from softmax over
 * hand-written feature weights plus a small seeded jitter, so the same
 * message always yields the same decisions.
 */
import type { JevRequest, RawJevResponse, RawAnswer, ChoiceQuestion } from "./schema";
import { hashString, mulberry32 } from "@/lib/language/seed";

type Logits = Record<string, number>;

interface Features {
  text: string;
  words: string[];
  isQuestion: boolean;
  yesNo: boolean;
  has: (...terms: string[]) => boolean;
  any: (re: RegExp) => boolean;
}

function extract(message: string): Features {
  const text = message.toLowerCase().trim();
  const words = text.split(/[^a-z0-9']+/).filter(Boolean);
  const isQuestion =
    /[?？]$/.test(text) ||
    /^(is|are|will|do|does|can|could|should|would|what|why|how|when|where|who|which)\b/.test(text) ||
    /(吗|呢|多少|什么|怎么|为什么|该不该|要不要|会不会|能不能)/.test(text);
  const yesNo =
    /^(is|are|will|do|does|can|could|should|would|did|has|have|am)\b/.test(text) || /(吗|该不该|要不要|会不会|能不能)/.test(text);
  // whole-word match so "ai" doesn't hit "failed"; a trailing "*" allows a prefix ("programm*")
  const has = (...terms: string[]) =>
    terms.some((t) => {
      const prefix = t.endsWith("*");
      const body = (prefix ? t.slice(0, -1) : t).replace(/[.+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9'])${body}${prefix ? "" : "(?![a-z0-9])"}`).test(text);
    });
  const any = (re: RegExp) => re.test(text);
  return { text, words, isQuestion, yesNo, has, any };
}

function softmax(logits: Logits, temperature = 1): Record<string, number> {
  const keys = Object.keys(logits);
  const max = Math.max(...keys.map((k) => logits[k]));
  const exps = keys.map((k) => Math.exp((logits[k] - max) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  keys.forEach((k, i) => (out[k] = exps[i] / sum));
  return out;
}

function base(q: ChoiceQuestion, fill = 0): Logits {
  const l: Logits = {};
  for (const o of q.options) l[o] = fill;
  return l;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* ---------- Chinese keyword hooks (mock only; real Jev reads any language) ---------- */

const ZH = {
  greeting: /^(你好|嗨|哈喽|早上好|晚上好)/,
  farewell: /(再见|拜拜|回头见|晚安)/,
  thanks: /(谢谢|多谢|感谢)/,
  request: /(建议|怎么办|该怎么|帮我|告诉我|要不要|该不该)/,
  emotional: /(我今天|我最近|我感觉|我觉得好|我很|挂了|失败|没考好|难过|焦虑|累|烦|开心|兴奋)/,
  opinion: /(我认为|我觉得|我相信|比.*好|比.*差)/,
  ai: /(AI|人工智能|大模型|机器人|自动化|ai)/,
  tech: /(程序员|编程|代码|软件|开发|电脑|科技|应用)/,
  work: /(工作|职业|老板|面试|工资|升职|岗位)/,
  economics: /(经济|通胀|GDP|衰退|失业)/,
  markets: /(股票|股市|加密|比特币|投资|币)/,
  learning: /(考试|学习|学校|大学|课|成绩|作业|挂科)/,
  health: /(生病|睡眠|睡不着|累|头疼|头痛|医生|健康|疼|锻炼|饮食|发烧)/,
  relationships: /(朋友|男朋友|女朋友|伴侣|老婆|老公|家人|妈|爸|分手|感情)/,
  sad: /(难过|失败|挂了|没考好|失去|哭|低落|沮丧)/,
  disappointed: /(失望|挂了|没考好|不够好|搞砸)/,
  anxious: /(担心|焦虑|紧张|害怕|压力|慌)/,
  frustrated: /(生气|烦|恼火|讨厌|气死)/,
  tired: /(累|疲惫|精疲力尽|没精神|倦)/,
  happy: /(开心|高兴|太好了|喜欢|棒|很好)/,
  excited: /(兴奋|迫不及待|激动)/,
  replace: /(取代|代替|替代|接管)/,
  entirely: /(完全|彻底|所有|全部)/,
  exact: /(具体|确切|准确|多少|哪一年)/,
  pain: /(疼|痛|生病|发烧|头疼|头痛)/,
  invest: /(投资|买|入场|抄底)/,
};
const zh = (re: RegExp, t: string) => re.test(t);

/* ---------- per-dimension scoring ---------- */

function scoreIntent(f: Features, q: ChoiceQuestion): Logits {
  const l = base(q, -1);
  if (f.any(/^(hi|hello|hey|yo|good (morning|evening|afternoon))\b/) || zh(ZH.greeting, f.text)) l.greeting += 5;
  if (f.any(/\b(bye|goodbye|see you|later|good night)\b/) || zh(ZH.farewell, f.text)) l.farewell += 5;
  if (f.any(/\b(thanks|thank you|thx|cheers)\b/) || zh(ZH.thanks, f.text)) l.thanks += 5;
  if (f.isQuestion) l.question += 4;
  if (f.any(/\b(should i|what should|any advice|any tips|how do i|help me|tell me|can you|give me|what do i do)\b/) || zh(ZH.request, f.text)) l.request += 4.5;
  if (f.any(/\b(i failed|i feel|i'm (so )?(sad|tired|anxious|happy|excited|scared|worried|stressed|bored|nervous)|i lost|i got|today i|i just|i finally|i can't (sleep|decide))\b/))
    l.emotional_sharing += 4;
  if (zh(ZH.emotional, f.text) && !f.isQuestion) l.emotional_sharing += 4;
  if ((f.any(/\b(i think|i believe|in my opinion|honestly)\b/) || zh(ZH.opinion, f.text)) && !f.isQuestion) l.statement += 3;
  if (!f.isQuestion) l.statement += 1.5;
  if (f.words.length <= 2 && !/[\u4e00-\u9fff]/.test(f.text) && !f.isQuestion && !f.any(/\b(hi|hello|hey|bye|thanks|thank)\b/)) l.other += 4;
  return l;
}

function scoreTopic(f: Features, q: ChoiceQuestion): Logits {
  const l = base(q, -1);
  if (f.has("ai", "artificial intelligence", "llm*", "gpt*", "models", "language model", "robot*", "automat*", "chatbot*")) l.ai += 4;
  if (f.has("programm*", "code", "coding", "software", "develop*", "computer*", "tech*", "apps", "app")) l.technology += 3;
  if (f.has("job*", "career*", "work*", "boss*", "interview*", "hired", "fired", "salary*", "promotion*")) l.work += 3.5;
  if (f.has("econom*", "inflation*", "gdp", "recession*", "unemploy*")) l.economics += 4;
  if (f.has("stock*", "market*", "crypto*", "bitcoin*", "invest*", "share*")) l.markets += 4;
  if (f.has("exam*", "test*", "study*", "learn*", "class*", "school*", "university*", "course*", "grade*", "homework*")) l.learning += 4;
  if (f.has("sick*", "sleep*", "tired*", "headache*", "ache*", "doctor*", "health", "pain*", "hurt*", "fever*", "exercise*", "diet*")) l.health += 4;
  if (f.has("friend*", "girlfriend", "boyfriend", "partner*", "wife", "husband", "family*", "mom", "dad", "breakup*", "relationship*")) l.relationships += 4;
  if (f.any(/\b(i|me|my|myself)\b/) || /我/.test(f.text)) l.personal += 1.5;
  if (zh(ZH.ai, f.text)) l.ai += 4;
  if (zh(ZH.tech, f.text)) l.technology += 3;
  if (zh(ZH.work, f.text)) l.work += 3.5;
  if (zh(ZH.economics, f.text)) l.economics += 4;
  if (zh(ZH.markets, f.text)) l.markets += 4;
  if (zh(ZH.learning, f.text)) l.learning += 4;
  if (zh(ZH.health, f.text)) l.health += 4;
  if (zh(ZH.relationships, f.text)) l.relationships += 4;
  l.other += 0.5;
  return l;
}

function scoreEmotion(f: Features, q: ChoiceQuestion): Logits {
  const l = base(q, -1);
  l.neutral += 1.5;
  if (f.has("failed", "lost", "missed", "sad", "cry", "crying", "cried", "down", "upset")) l.sad += 2.5;
  if (f.has("failed*", "disappoint*", "let down", "didn't work", "not good enough")) l.disappointed += 3;
  if (f.has("worr*", "anxi*", "nervous*", "scared*", "afraid", "stress*", "panic*")) l.anxious += 3.5;
  if (f.has("angry*", "annoy*", "frustrat*", "hate*", "ugh", "stupid")) l.frustrated += 3.5;
  if (f.has("tired*", "exhaust*", "burnt out", "burned out", "burnout", "drained*")) l.tired += 3.5;
  if (f.has("happy*", "great*", "love*", "glad*", "awesome*", "amazing*", "wonder*")) l.happy += 3.5;
  if (f.has("excite*", "can't wait", "thrill*", "!!") || f.any(/\b(got the job|i passed|i won|finished my|accepted)\b|拿到|通过了|赢了|完成了/)) l.excited += 3.5;
  if (f.isQuestion || f.has("wonder*", "curious*", "interest*")) l.curious += 2;
  if (zh(ZH.sad, f.text)) l.sad += 2.5;
  if (zh(ZH.disappointed, f.text)) l.disappointed += 3;
  if (zh(ZH.anxious, f.text)) l.anxious += 3.5;
  if (zh(ZH.frustrated, f.text)) l.frustrated += 3.5;
  if (zh(ZH.tired, f.text)) l.tired += 3.5;
  if (zh(ZH.happy, f.text)) l.happy += 3.5;
  if (zh(ZH.excited, f.text)) l.excited += 3;
  return l;
}

function scoreEmotionIntensity(f: Features): number {
  let v = 0.15;
  if (f.has("failed*", "lost*", "hate*", "love*", "worr*", "excite*", "tired*") || zh(/(挂了|失败|讨厌|喜欢|担心|兴奋|累)/, f.text)) v += 0.35;
  if (f.has("so", "really", "very", "extremely", "terrible*", "awful*", "amazing*")) v += 0.2;
  if (f.text.includes("!")) v += 0.1;
  if (f.isQuestion && !f.has("i", "my")) v -= 0.1;
  return clamp01(v);
}

function scoreSpeechAct(f: Features, q: ChoiceQuestion, intent: string, emotion: string, topic: string): Logits {
  const l = base(q, -2);
  const negative = ["sad", "disappointed", "anxious", "frustrated", "tired"].includes(emotion);
  if (intent === "greeting" || intent === "farewell" || intent === "thanks") l.greet += 6;
  if (intent === "emotional_sharing") {
    if (negative) l.empathize += 5;
    else l.acknowledge += 4;
    l.encourage += 2;
  }
  if (intent === "question") {
    l.answer += 4;
    if (f.words.length < 3) l.clarify += 3;
    if (topic === "other" && !f.yesNo) l.clarify += 1.5;
  }
  if (intent === "request") {
    l.advise += 4.5;
    if (f.words.length < 4) l.clarify += 2;
  }
  if (intent === "statement") {
    l.acknowledge += 3;
    if (f.has("i think", "i believe", "is better", "is worse", "in my opinion")) {
      l.agree += 3.2;
      l.disagree += 1.2;
    }
  }
  if (topic === "health" && (f.has("pain*", "sick*", "medic*", "doctor*", "pill*", "headache*", "ache*", "hurt*", "fever*") || zh(ZH.pain, f.text))) l.warn += 4.5;
  if (topic === "markets" && (f.has("should i", "invest*", "buy") || zh(ZH.invest, f.text))) l.warn += 5.5;
  if (intent === "other") l.clarify += 3;
  return l;
}

function scoreStance(f: Features, q: ChoiceQuestion, intent: string, topic: string): Logits {
  const l = base(q, 0);
  if (intent !== "question" && intent !== "statement") {
    l.uncertain += 2;
    return l;
  }
  if (!f.yesNo) {
    l.mixed += 1;
    l.uncertain += 1;
  }
  if (f.has("replace*", "take over", "automat*") || zh(ZH.replace, f.text)) {
    l.mostly_yes += 2.2;
    l.mixed += 1.2;
  }
  if (f.has("entire*", "complete*", "all", "ever") || zh(ZH.entirely, f.text)) l.mostly_no += 1.2;
  if (f.has("some", "parts", "help*", "assist*", "useful", "worth", "good idea")) l.mostly_yes += 1.5;
  if (f.has("impossible*", "never", "bad idea", "waste*")) l.mostly_no += 1.5;
  if (topic === "markets") l.uncertain += 2.5;
  if (f.has("should i", "is it better")) l.mixed += 1;
  return l;
}

function scoreConfidence(f: Features, intent: string, topic: string): number {
  let c = 0.7;
  if (intent === "question") {
    c = 0.62;
    if (f.has("replace*", "will ai", "programm*") || zh(ZH.replace, f.text)) c += 0.08;
    if (topic === "markets") c -= 0.25;
    if (topic === "other") c -= 0.2;
    if (f.words.length < 3 && !/[\u4e00-\u9fff]/.test(f.text)) c -= 0.2;
    if (f.has("exact*", "precisely", "when exactly", "what year", "how many") || zh(ZH.exact, f.text)) c -= 0.3;
  }
  if (intent === "emotional_sharing") c = 0.8;
  if (intent === "greeting" || intent === "thanks" || intent === "farewell") c = 0.95;
  if (intent === "request") c = 0.68;
  if (intent === "other") c = 0.4;
  if (topic === "health" && (f.has("pain*", "sick*", "headache*", "ache*", "hurt*", "fever*") || zh(ZH.pain, f.text))) c = 0.82;
  return clamp01(c);
}

function scoreClaim(f: Features, q: ChoiceQuestion, intent: string, topic: string, stance: string, emotion: string): Logits {
  const l = base(q, -3);
  l.uncertain += 0.5;
  if (topic === "ai" || (topic === "technology" && (f.has("ai", "automat*") || zh(ZH.ai, f.text)))) {
    l.replace_tasks += 3.5;
    l.augment_workers += 2.2;
    l.change_skill_mix += 1.8;
    l.replace_jobs += 0.6;
    if (f.has("entire*", "all")) l.replace_jobs += 0.8;
  }
  if (intent === "emotional_sharing" && ["sad", "disappointed", "frustrated"].includes(emotion)) {
    l.one_event_not_defining += 3.5;
    l.feedback_is_signal += 2;
    if (topic === "learning") l.effort_compounds += 2.5;
  }
  if (intent === "emotional_sharing" && emotion === "tired") {
    l.take_break += 3.5;
    l.sleep_more += 2.5;
  }
  if (intent === "emotional_sharing" && emotion === "anxious") {
    l.reflect_first += 2.5;
    l.talk_to_someone += 2.5;
    l.one_event_not_defining += 1.5;
  }
  if (intent === "request") {
    l.start_small += 3;
    l.practice_more += 2;
    l.reflect_first += 2;
    if (topic === "learning") l.practice_more += 1.5;
    if (topic === "relationships") l.talk_to_someone += 3;
    if (topic === "health") l.consult_doctor += 3;
    if (f.has("tired*", "burn*")) l.take_break += 2.5;
  }
  if (topic === "markets") {
    l.markets_unpredictable += 4;
    l.diversify += 2.5;
  }
  if (topic === "health" && (f.has("pain*", "sick*", "doctor*", "headache*", "ache*", "hurt*", "fever*") || zh(ZH.pain, f.text))) l.consult_doctor += 4.5;
  if (intent === "statement" && f.has("i think", "i believe", "is better", "is worse")) {
    l.depends += 3.5;
    l.yes_generally += 1.5;
  }
  if (intent === "question" && !["ai", "markets", "health"].includes(topic)) {
    if (stance === "mostly_yes") l.yes_generally += 3;
    if (stance === "mostly_no") l.no_generally += 3;
    if (stance === "mixed") l.depends += 3;
    if (stance === "uncertain") l.uncertain += 2.5;
  }
  // comparative / opinion questions
  if (intent === "question" && f.any(/\b(better than|vs\.?|or|worth)\b|比.*好|值得/)) {
    l.tradeoffs += 3.5;
    l.depends_on_goals += 3;
    if (f.has("worth*") || /值得/.test(f.text)) l.worth_it_if_used += 3.5;
  }
  if (f.any(/\b(too late|too old)\b|太晚|来不及|年纪/)) l.never_too_late += 4.5;
  if (f.any(/\b(bad for|healthy|unhealthy)\b|有害|健康吗/)) l.moderation_fine += 4;
  if (f.any(/\b(completely|entirely|take over)\b|完全|彻底/) && intent === "question") l.partial_shift += 3;
  if (f.any(/\b(nervous|presentation|interview tomorrow)\b|紧张|演讲/)) l.nerves_are_normal += 4;
  // good news
  if (intent === "emotional_sharing" && ["happy", "excited"].includes(emotion)) {
    l.celebrate += 4.5;
    l.earned_it += 3;
  }
  // more advice
  if (f.any(/\b(raise|promotion|negotiate)\b|加薪|谈判/)) l.prepare_evidence += 4;
  if (f.any(/\b(bug|debug|crash|error)\b|bug|报错|崩/)) l.narrow_down += 4.5;
  if (f.any(/\b(text my ex|call my ex|message (him|her|them))\b|前任|前男友|前女友/)) l.wait_before_acting += 4.5;
  if (f.any(/\b(argu|fight|fighting)\w*\b|吵架|争吵/) && topic === "relationships") l.find_underlying_issue += 4;
  if (f.any(/\bbored\b|无聊/)) l.try_something_new += 4.5;
  if (f.any(/\b(moved away|lonely|miss (him|her|them))\b|搬走|孤独|想念/)) l.keep_connection += 4;
  // scope
  if (f.any(/^(what|who|where|when|how many|how much|explain|define|describe)\b|是什么|多少|解释|首都|人口/) && !f.has("should*", "think*", "better*") && !/该|觉得|应该/.test(f.text)) {
    l.out_of_scope_factual += 5;
  }
  if (f.any(/\b(joke|story|poem|song|write me|compose)\b|笑话|故事|诗|写一/)) l.out_of_scope_creative += 6;
  if (f.any(/\b(are you|do you (like|love|feel|have)|what do you think about me|conscious|alive)\b|你有.*吗|你喜欢|你是不是|你有意识/)) l.no_self_experience += 6;
  return l;
}

function scoreQualification(f: Features, q: ChoiceQuestion, topic: string, claim: string, confidence: number): Logits {
  const l = base(q, -1.5);
  l.none += 1;
  if (claim === "replace_tasks" || claim === "augment_workers") l.not_all_jobs += 3.5;
  if (claim === "change_skill_mix") l.industry_specific += 2.5;
  if (topic === "ai") {
    l.timeline_uncertain += 2;
    l.technology_uncertain += 1;
  }
  if (topic === "markets") l.timeline_uncertain += 2.5;
  if (["start_small", "practice_more", "reflect_first", "take_break"].includes(claim)) l.depends_on_person += 3;
  if (claim === "depends") l.context_dependent += 3.5;
  if (confidence < 0.55) l.limited_knowledge += 3;
  if (f.has("exact*", "how many", "what year") || zh(ZH.exact, f.text)) l.limited_knowledge += 2;
  return l;
}

function scoreGoal(q: ChoiceQuestion, intent: string, act: string, emotion: string): Logits {
  const l = base(q, -1);
  if (act === "answer") l.inform += 4;
  if (act === "advise") l.guide += 4;
  if (act === "clarify") l.clarify += 4;
  if (act === "warn") l.caution += 4;
  if (act === "empathize") {
    l.reassure += 3;
    l.encourage += 2.5;
    if (emotion === "anxious") l.reassure += 1.5;
  }
  if (act === "encourage") l.encourage += 4;
  if (act === "acknowledge" || act === "greet") l.connect += 4;
  if (intent === "statement") l.connect += 1;
  return l;
}

function scoreFollowUp(f: Features, q: ChoiceQuestion, intent: string, act: string, confidence: number): Logits {
  const l = base(q, -1);
  l.none += 1.5;
  if (act === "empathize") {
    l.ask_what_happened += 3.5;
    l.ask_how_feel += 1.5;
  }
  if (act === "clarify") {
    l.ask_clarify += 4;
    l.ask_which_aspect += 2;
  }
  if (act === "answer" && confidence < 0.6) l.ask_which_aspect += 2.5;
  if (act === "answer" && confidence >= 0.6) l.offer_more += 1.2;
  if (act === "advise") {
    l.ask_goal += 2;
    l.ask_timeline += 0.8;
  }
  if (act === "greet") {
    l.none += 1;
    if (intent === "greeting") l.ask_goal += 2.5;
  }
  return l;
}

function scoreTone(q: ChoiceQuestion, intent: string, act: string, topic: string, confidence: number): Logits {
  const l = base(q, -1);
  l.neutral += 1;
  if (act === "empathize" || act === "encourage") l.warm += 4;
  if (act === "answer" && ["ai", "technology", "economics", "markets"].includes(topic)) l.analytical += 3.5;
  if (act === "warn" || confidence < 0.55) l.cautious += 3;
  if (confidence > 0.88) l.confident += 2.5;
  if (intent === "greeting" || intent === "thanks" || intent === "farewell") l.casual += 4;
  if (act === "advise") l.warm += 1.5;
  return l;
}

function scoreVerbosity(f: Features, q: ChoiceQuestion, intent: string, act: string): Logits {
  const l = base(q, 0);
  if (intent === "greeting" || intent === "thanks" || intent === "farewell") l.minimal += 3;
  if (act === "clarify") l.short += 2.5;
  if (act === "answer") {
    l.medium += 2;
    l.short += 1.5;
  }
  if (act === "empathize" || act === "advise") l.short += 2;
  if (act === "agree" || act === "disagree" || act === "warn" || act === "acknowledge") l.short += 2.2;
  if (f.words.length > 18) l.medium += 1.5;
  return l;
}

/* ---------- jitter + assembly ---------- */

function jitter(l: Logits, rand: () => number, amount = 0.35): Logits {
  const out: Logits = {};
  for (const k of Object.keys(l)) out[k] = l[k] + (rand() - 0.5) * amount;
  return out;
}

function argmax(d: Record<string, number>): string {
  return Object.entries(d).sort((a, b) => b[1] - a[1])[0][0];
}

export async function mockInfer(req: JevRequest): Promise<RawJevResponse> {
  const f = extract(req.state.message);
  const rand = mulberry32(hashString(req.state.message + "|" + (req.state.currentTopic ?? "")));
  const byId = Object.fromEntries(req.questions.filter((q) => q.kind === "choice").map((q) => [q.id, q])) as Record<
    string,
    ChoiceQuestion
  >;
  const answers: Record<string, RawAnswer> = {};
  const choice = (id: string, logits: Logits, temp = 1) => {
    const d = softmax(jitter(logits, rand), temp);
    answers[id] = { distribution: d };
    return argmax(d);
  };

  const intent = choice("intent", scoreIntent(f, byId.intent), 1.1);
  let topic = choice("topic", scoreTopic(f, byId.topic), 1.1);
  // light memory effect: an unresolved topic keeps some pull when the message is short/ambiguous
  if (req.state.currentTopic && f.words.length < 4 && topic === "other") {
    const d = answers.topic as { distribution: Record<string, number> };
    d.distribution[req.state.currentTopic] = (d.distribution[req.state.currentTopic] ?? 0) + 0.3;
    const sum = Object.values(d.distribution).reduce((a, b) => a + b, 0);
    for (const k in d.distribution) d.distribution[k] /= sum;
    topic = argmax(d.distribution);
  }
  const emotion = choice("emotion", scoreEmotion(f, byId.emotion), 1.1);
  const intensity = clamp01(scoreEmotionIntensity(f) + (rand() - 0.5) * 0.08);
  answers.emotion_intensity = { value: intensity };
  const act = choice("speech_act", scoreSpeechAct(f, byId.speech_act, intent, emotion, topic), 1.2);
  const stance = choice("stance", scoreStance(f, byId.stance, intent, topic), 1.0);
  const confidence = clamp01(scoreConfidence(f, intent, topic) + (rand() - 0.5) * 0.1);
  answers.confidence = { value: confidence };
  const claim = choice("main_claim", scoreClaim(f, byId.main_claim, intent, topic, stance, emotion), 1.0);
  choice("qualification", scoreQualification(f, byId.qualification, topic, claim, confidence), 1.1);
  choice("response_goal", scoreGoal(byId.response_goal, intent, act, emotion), 1.1);
  choice("follow_up", scoreFollowUp(f, byId.follow_up, intent, act, confidence), 1.1);
  choice("tone", scoreTone(byId.tone, intent, act, topic, confidence), 1.1);
  choice("verbosity", scoreVerbosity(f, byId.verbosity, intent, act), 1.2);

  // simulate a little inference latency so the UI's loading state is exercised
  await new Promise((r) => setTimeout(r, 120 + Math.floor(rand() * 200)));
  return { answers };
}
