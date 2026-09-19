/**
 * 中文 locale pack。
 *
 * 与英文包共用同一套语义槽位和规划逻辑;这里只决定措辞和表层语法。
 * `{hedge}` 会被置信度副词替换(或删除)。
 */
import type { LocalePack, Bank } from "../locale";
import type { ConfidenceBand } from "../confidence";
import { ADVICE_CLAIMS } from "../templates";

const yes: Record<ConfidenceBand, Bank> = {
  insufficient: ["我不确定"],
  maybe: ["也许吧", "有可能"],
  i_think: ["我觉得是", "我倾向于是"],
  probably: ["大概率是", "多半是"],
  very_likely: ["很可能是", "基本可以说是"],
  highly_confident: ["是的", "可以肯定,是的"],
};
const no: Record<ConfidenceBand, Bank> = {
  insufficient: ["我不确定"],
  maybe: ["也许不会", "不太好说,可能不会"],
  i_think: ["我觉得不是", "我倾向于不是"],
  probably: ["大概率不会", "多半不会"],
  very_likely: ["很可能不会", "基本不会"],
  highly_confident: ["不会", "可以肯定,不会"],
};
const adverb: Record<ConfidenceBand, string> = {
  insufficient: "可能",
  maybe: "也许",
  i_think: "应该",
  probably: "大概率",
  very_likely: "很可能",
  highly_confident: "几乎肯定",
};
const prefix: Record<ConfidenceBand, Bank> = {
  insufficient: ["我不太有把握,但"],
  maybe: ["也许", "有可能"],
  i_think: ["我觉得", "我的感觉是"],
  probably: ["我认为", "我会说"],
  very_likely: ["我比较确定", "很可能"],
  highly_confident: ["我很有把握", "可以肯定"],
};
const advice: Record<ConfidenceBand, Bank> = {
  insufficient: ["一个选择是"],
  maybe: ["或许可以", "可以试试"],
  i_think: ["我觉得可以", "我会考虑"],
  probably: ["我建议你", "比较有帮助的是"],
  very_likely: ["我强烈建议你", "最好是"],
  highly_confident: ["你应该", "一定要"],
};

const 句尾 = (s: string) => s.replace(/[。!?.!?]+$/, "");

export const zh: LocalePack = {
  locale: "zh",
  speechLang: "zh-CN",
  confidence: { yes, no, adverb, prefix, advice },
  templates: {
    ackLow: {
      sad: ["听起来今天不太好过", "这确实让人有点低落"],
      disappointed: ["这挺让人失望的", "这种感觉确实不好受"],
      anxious: ["听起来压力不小", "会不安是很正常的"],
      frustrated: ["这确实挺烦人的", "我能理解你为什么恼火"],
      tired: ["听起来很耗人", "感觉你的电量不太够了"],
      happy: ["这挺好的", "不错"],
      excited: ["这挺让人兴奋的", "听起来是件大事,而且是好事"],
      curious: ["好问题", "这个问题挺有意思"],
    },
    ackHigh: {
      sad: ["很抱歉,这听起来真的很难", "这听起来是真的很痛"],
      disappointed: ["这确实是个不小的打击,难受是正常的", "这听起来真的很糟"],
      anxious: ["听起来你现在扛着不少东西", "这种担心很消耗人"],
      frustrated: ["这确实让人火大", "换我也会很恼火"],
      tired: ["这听起来是真的累了,不只是一天的疲劳", "感觉你已经被磨得差不多了"],
      happy: ["这是个好消息", "真替你高兴"],
      excited: ["这真的很让人兴奋", "这是个重要时刻"],
      curious: ["这是个很有意思的问题", "好问题,这个正在被激烈讨论"],
    },
    ackNeutral: ["明白", "好的", "了解", "收到"],
    goalLine: {
      encourage: ["这是能缓过来的", "这不是不可挽回的"],
      reassure: ["它大概没有现在感觉的那么决定性", "这样一个时刻很少能决定什么"],
      connect: ["我在", "可以慢慢聊"],
      caution: ["这里值得小心一点", "我会对此保持谨慎"],
    },
    claim: {
      replace_tasks: ["AI{hedge}会取代编程工作的一部分,而不是取代程序员本身", "AI{hedge}会接手一些编程任务,但不是整个职业"],
      replace_jobs: ["{hedge}会有相当一部分编程岗位消失", "一批编程岗位{hedge}会不复存在"],
      augment_workers: ["AI{hedge}更多是让程序员效率更高,而不是取代他们", "更{hedge}的结果是程序员和AI协作,而不是被替代"],
      change_skill_mix: ["变化{hedge}更多在于哪些技能被看重,而不是需不需要人", "真正会变的{hedge}是技能组合,而不是人数"],
      yes_generally: ["答案{hedge}是肯定的", "这{hedge}成立"],
      no_generally: ["答案{hedge}是否定的", "这{hedge}不成立"],
      depends: ["这{hedge}要看具体情况", "老实说,要看情况"],
      uncertain: ["这个我没有清晰的判断", "这个我判断不好"],
      one_event_not_defining: ["一次不好的结果{hedge}本身说明不了太多", "一次挫折{hedge}没有它让你感觉到的那么能定义你"],
      effort_compounds: ["持续的投入{hedge}比任何一次结果都重要", "接下来怎么做{hedge}比这一次结果更重要"],
      feedback_is_signal: ["这{hedge}更像是信息,而不是判决", "它{hedge}是在提示该调整什么,而不是在评判你"],
      take_break: ["先退一步歇一歇", "好好休息一下"],
      start_small: ["从一件小而具体的事开始", "挑一件小事先做起来"],
      practice_more: ["做一些专注的练习", "多练几遍"],
      talk_to_someone: ["和信任的人聊一聊", "把这件事说给身边亲近的人听"],
      sleep_more: ["先把睡眠放在第一位", "先好好休息几天"],
      reflect_first: ["先想清楚你真正想要的是什么", "先把真正的问题理清楚"],
      seek_professional: ["找专业人士聊聊", "把这件事交给有资质的人"],
      markets_unpredictable: ["短期市场走势{hedge}是没法预测的", "没有人能{hedge}可靠地判断短期市场方向"],
      diversify: ["分散风险,不要押在一处", "避免把宝押在单一结果上"],
      consult_doctor: ["去看看医生", "让医生检查一下"],
    },
    adviceClaims: ADVICE_CLAIMS,
    qualification: {
      not_all_jobs: { connector: "不过", clause: ["不是每个岗位受到的影响都一样", "这在不同工作上不会是均匀的"] },
      timeline_uncertain: { connector: "而且", clause: ["时间线是真的不确定", "多快发生谁也说不准"] },
      industry_specific: { connector: "但", clause: ["不同行业差别很大", "细节要看具体领域"] },
      technology_uncertain: { connector: "而且", clause: ["技术本身也可能有几种走向", "技术未必按大家预期的方式发展"] },
      depends_on_person: { connector: "不过", clause: ["什么有效要看你自己", "你的情况可能需要别的办法"] },
      context_dependent: { connector: "不过", clause: ["细节在这里很重要", "要看具体情况"] },
      limited_knowledge: { connector: "而且", clause: ["我对这个的了解有限", "我没有足够依据说更多"] },
    },
    followUp: {
      ask_what_happened: ["发生什么了?", "想说说发生了什么吗?"],
      ask_clarify: ["能多说一点你的意思吗?", "你具体想问的是什么?"],
      ask_which_aspect: ["你最关心哪一部分?", "有没有特别在意的角度?"],
      ask_how_feel: ["你现在感觉怎么样?", "你还好吗?"],
      ask_goal: ["你想达到什么目标?", "对你来说,什么样的结果算好?"],
      ask_timeline: ["这件事有截止时间吗?", "你需要多快做决定?"],
      offer_more: ["需要我展开说某一部分吗?", "有需要的话我可以再细说。"],
    },
    greeting: {
      greeting: ["你好", "嗨", "哈喽"],
      farewell: ["保重", "回头见", "先这样,再见"],
      thanks: ["不客气", "随时", "有帮到就好"],
    },
    decline: ["这个我没有足够把握直接回答", "对这个我的判断依据不够,没法直接答"],
    declineRequest: ["这个决定我没法替你做", "这个我不能告诉你该怎么做"],
    clarify: ["我不太确定我理解对了", "我想先确认一下我理解得对不对"],
    stanceMixed: ["两方面都有", "一半一半", "既是也不是"],
    stanceUncertain: ["不好说", "我判断不了"],
    toneOpener: {
      casual: ["说实话,", "嗯,"],
      analytical: ["总体来看,", "平心而论,"],
      cautious: [],
      confident: [],
      warm: [],
      neutral: [],
    },
    agree: ["我同意", "这和我的看法一致"],
    disagree: ["这点我有些不同看法", "我的看法不太一样"],
    warn: ["这里要小心", "提醒一句"],
  },
  grammar: {
    fillHedge: (t, h) => t.replace(/\{hedge\}/g, h),
    prefix: (p, c) => `${p}${c}`,
    attachClause: (main, clause, connector) => `${句尾(main)},${connector}${clause}`,
    attachOpener: (opener, s) => `${opener}${s}`,
    isQuestion: (s) => /[?？]$/.test(s.trim()),
    ensureTerminal: (s) => {
      const t = s.trim();
      if (!t) return t;
      if (/[。!?！？…]$/.test(t)) return t;
      return t.replace(/[,,;;:]+$/, "") + "。";
    },
    join: (parts) =>
      parts
        .map((p) => p.trim())
        .filter(Boolean)
        .join("")
        .replace(/\?/g, "?")
        .replace(/!/g, "!")
        .replace(/\s+([,。?!,])/g, "$1")
        .replace(/([。?!])\s+/g, "$1")
        .replace(/。{2,}/g, "。")
        .trim(),
  },
};
