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
  maybe: ["也许吧", "有可能", "说不定是"],
  i_think: ["我觉得是", "我倾向于是", "应该是"],
  probably: ["大概率是", "多半是", "很大可能是"],
  very_likely: ["很可能是", "基本可以说是", "几乎可以确定是"],
  highly_confident: ["是的", "可以肯定,是的", "没错"],
};
const no: Record<ConfidenceBand, Bank> = {
  insufficient: ["我不确定"],
  maybe: ["也许不会", "不太好说,可能不会", "说不定不会"],
  i_think: ["我觉得不是", "我倾向于不是", "应该不会"],
  probably: ["大概率不会", "多半不会", "很大可能不会"],
  very_likely: ["很可能不会", "基本不会", "几乎可以确定不会"],
  highly_confident: ["不会", "可以肯定,不会", "不是"],
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
  maybe: ["也许", "有可能", "说不定"],
  i_think: ["我觉得", "我的感觉是", "在我看来"],
  probably: ["我认为", "我会说", "我的判断是"],
  very_likely: ["我比较确定", "很可能", "我相当有把握"],
  highly_confident: ["我很有把握", "可以肯定", "毫无疑问"],
};
const advice: Record<ConfidenceBand, Bank> = {
  insufficient: ["一个选择是"],
  maybe: ["或许可以", "可以试试", "不妨"],
  i_think: ["我觉得可以", "我会考虑", "我觉得值得"],
  probably: ["我建议你", "比较有帮助的是", "我会建议"],
  very_likely: ["我强烈建议你", "最好是", "我很建议你"],
  highly_confident: ["你应该", "一定要", "务必"],
};

const 句尾 = (s: string) => s.replace(/[。!?.!?]+$/, "");

export const zh: LocalePack = {
  locale: "zh",
  speechLang: "zh-CN",
  confidence: { yes, no, adverb, prefix, advice },
  templates: {
    ackLow: {
      sad: ["听起来今天不太好过", "这确实让人有点低落", "这不是件容易消化的事", "听到这个我也有点难过"],
      disappointed: ["这挺让人失望的", "这种感觉确实不好受", "这确实是个打击", "失望是正常的"],
      anxious: ["听起来压力不小", "会不安是很正常的", "这种等待确实难熬", "这事挺占脑子的"],
      frustrated: ["这确实挺烦人的", "我能理解你为什么恼火", "换谁都会烦", "听起来这事磨了你一阵了"],
      tired: ["听起来很耗人", "感觉你的电量不太够了", "这种累不容易缓过来", "听起来油箱快空了"],
      happy: ["这挺好的", "不错", "好消息", "很高兴听到"],
      excited: ["这挺让人兴奋的", "听起来是件大事,而且是好事", "这值得期待", "不错,这是实打实的好事"],
      curious: ["好问题", "这个问题挺有意思", "这确实值得琢磨", "问得好"],
    },
    ackHigh: {
      sad: ["很抱歉,这听起来真的很难", "这听起来是真的很痛", "这是真正的失去,难过是应该的", "我很抱歉,这确实沉重"],
      disappointed: ["这确实是个不小的打击,难受是正常的", "这听起来真的很糟", "这一下确实扎人,也理应如此", "抱了希望又落空,确实难"],
      anxious: ["听起来你现在扛着不少东西", "这种担心很消耗人", "为这事绷着完全可以理解", "这是件压在心上的重事"],
      frustrated: ["这确实让人火大", "换我也会很恼火", "这真的让人气不过", "谁遇到都会生气"],
      tired: ["这听起来是真的累了,不只是一天的疲劳", "感觉你已经被磨得差不多了", "这种累光靠休息未必能补回来", "听起来你已经硬撑了一阵子"],
      happy: ["这是个好消息", "真替你高兴", "这真的太好了", "这是那种真正的好消息"],
      excited: ["这真的很让人兴奋", "这是个重要时刻", "这太棒了,恭喜", "这种事值得兴奋"],
      curious: ["这是个很有意思的问题", "好问题,这个正在被激烈讨论", "这个问题大家争论是有道理的", "这是个很有深度的问题"],
    },
    ackNeutral: ["明白", "好的", "了解", "收到", "嗯", "好"],
    goalLine: {
      encourage: ["这是能缓过来的", "这不是不可挽回的", "你的余地比感觉上要大", "路还没走到头"],
      reassure: ["它大概没有现在感觉的那么决定性", "这样一个时刻很少能决定什么", "拉开一点距离看,它会变小", "现在它显得比实际更大"],
      connect: ["我在", "可以慢慢聊", "我在听", "想说就继续说"],
      caution: ["这里值得小心一点", "我会对此保持谨慎", "这事宜慢不宜快", "动手之前值得再看一眼"],
    },
    claim: {
      replace_tasks: ["AI{hedge}会取代编程工作的一部分,而不是取代程序员本身", "AI{hedge}会接手一些编程任务,但不是整个职业", "AI{hedge}取代的是具体的任务,而不是这个角色"],
      replace_jobs: ["{hedge}会有相当一部分编程岗位消失", "一批编程岗位{hedge}会不复存在", "有些编程岗位{hedge}撑不过这一轮"],
      augment_workers: ["AI{hedge}更多是让程序员效率更高,而不是取代他们", "更{hedge}的结果是程序员和AI协作,而不是被替代", "AI{hedge}会成为程序员手里的工具,而不是替代品"],
      change_skill_mix: ["变化{hedge}更多在于哪些技能被看重,而不是需不需要人", "真正会变的{hedge}是技能组合,而不是人数", "这份工作{hedge}是变形,而不是缩水"],
      yes_generally: ["答案{hedge}是肯定的", "这{hedge}成立", "这{hedge}没错"],
      no_generally: ["答案{hedge}是否定的", "这{hedge}不成立", "这{hedge}不是这样"],
      depends: ["这{hedge}要看具体情况", "老实说,要看情况", "没有唯一答案,{hedge}取决于细节"],
      uncertain: ["这个我没有清晰的判断", "这个我判断不好", "这个我没有明确看法"],
      one_event_not_defining: ["一次不好的结果{hedge}本身说明不了太多", "一次挫折{hedge}没有它让你感觉到的那么能定义你", "一次结果{hedge}不是对你的判决"],
      effort_compounds: ["持续的投入{hedge}比任何一次结果都重要", "接下来怎么做{hedge}比这一次结果更重要", "接下来几周{hedge}比这一天重要得多"],
      feedback_is_signal: ["这{hedge}更像是信息,而不是判决", "它{hedge}是在提示该调整什么,而不是在评判你", "这{hedge}说的是该改什么,而不是你值不值"],
      take_break: ["先退一步歇一歇", "好好休息一下", "给自己一段真正的空档"],
      start_small: ["从一件小而具体的事开始", "挑一件小事先做起来", "把它缩到今天就能做的一步"],
      practice_more: ["做一些专注的练习", "多练几遍", "有意识地一点点练"],
      talk_to_someone: ["和信任的人聊一聊", "把这件事说给身边亲近的人听", "让一个你信任的人知道这件事"],
      sleep_more: ["先把睡眠放在第一位", "先好好休息几天", "先把睡眠保住,其他都往后放"],
      reflect_first: ["先想清楚你真正想要的是什么", "先把真正的问题理清楚", "决定之前先理清楚什么对你最重要"],
      seek_professional: ["找专业人士聊聊", "把这件事交给有资质的人", "听听专业人士的看法"],
      markets_unpredictable: ["短期市场走势{hedge}是没法预测的", "没有人能{hedge}可靠地判断短期市场方向", "择时{hedge}不是任何人能稳定做到的事"],
      diversify: ["分散风险,不要押在一处", "避免把宝押在单一结果上", "分散开,别全放在一个篮子里"],
      consult_doctor: ["去看看医生", "让医生检查一下", "找医生看一下"],
      tradeoffs: ["两边各有真实的优势,是取舍,不是谁赢", "双方{hedge}都有实打实的长处,关键看你愿意接受哪种取舍", "两者{hedge}没有绝对的胜者,只是擅长的地方不同"],
      depends_on_goals: ["正确答案{hedge}取决于你在优化什么", "这{hedge}取决于你想从中得到什么", "哪个更好{hedge}要看你想要的是什么"],
      moderation_fine: ["适量的话对大多数人{hedge}没问题", "对多数人来说,合理的量{hedge}不是问题", "剂量{hedge}比东西本身更重要"],
      worth_it_if_used: ["如果你真的会用到,那{hedge}值得", "它{hedge}只有在真正被用起来时才有回报", "值不值{hedge}取决于你会不会真的用它"],
      never_too_late: ["{hedge}不算晚,关键是你能不能坚持下去", "现在开始{hedge}没问题,坚持比时机重要", "时机{hedge}没有能否持续重要"],
      partial_shift: ["这种转变{hedge}会是部分的、渐进的,而不是全面接管", "它{hedge}是一块一块发生的,而不是一夜之间", "预期{hedge}是逐步的变化,而不是干净利落的取代"],
      nerves_are_normal: ["紧张{hedge}很正常,通常说明你在乎", "紧张{hedge}说明你认真对待,而不是你会搞砸", "适度的紧张{hedge}帮的比害的多"],
      celebrate: ["这值得庆祝", "这该好好庆祝一下", "花点时间好好享受这一刻"],
      earned_it: ["这是你应得的", "这是你自己努力的结果", "你付出了,现在有了回报"],
      prepare_evidence: ["带着你贡献的具体证据去谈", "准备好你做成过什么的具体例子", "用数字和结果来说话"],
      ask_directly: ["直接、具体地说出你想要什么", "明确说出你在争取什么", "把想要的说清楚,不要绕"],
      narrow_down: ["把问题缩小到仍然会出错的最小情况", "找出能复现问题的最小片段", "把问题对半切,直到一目了然"],
      wait_before_acting: ["先等一天再决定", "睡一觉再说", "等冲动过去,看看念头还在不在"],
      find_underlying_issue: ["弄清楚这场争吵背后真正的问题是什么", "把表面话题底下真正在意的东西说出来", "找到那件事底下的那件事"],
      try_something_new: ["试一件你从没做过的事", "做一件跳出日常的事", "挑个陌生的东西,先开始"],
      keep_connection: ["继续主动联系,距离不会结束一段友谊", "有意识地保持联络,现在这需要刻意去做", "把联系变成习惯,而不是偶然"],
      out_of_scope_factual: ["我没法查询或回忆事实,我只做判断", "这需要一个我没有的事实;我决定含义,不检索信息", "我是决策模型,不是资料库:我给不了事实和解释"],
      out_of_scope_creative: ["我编不了笑话或故事,我只选择含义,文字由代码拼出来", "写东西不是我做的事;我决定说什么,不负责发明怎么说", "创作超出我的范围:我说的每句话都是由固定片段拼装的"],
      no_self_experience: ["我没有可以汇报的体验或感受,我是一个决策模型", "我没有喜好,也没有内心生活,我是决策模型,不是人", "这里没有可以被问到的内心世界;我只对眼前的东西做判断"],
    },
    adviceClaims: ADVICE_CLAIMS,
    qualification: {
      not_all_jobs: { connector: "不过", clause: ["不是每个岗位受到的影响都一样", "这在不同工作上不会是均匀的", "有些岗位会比别的感受强烈得多"] },
      timeline_uncertain: { connector: "而且", clause: ["时间线是真的不确定", "多快发生谁也说不准", "什么时候发生远比会不会发生模糊"] },
      industry_specific: { connector: "但", clause: ["不同行业差别很大", "细节要看具体领域", "不同领域看到的会是很不一样的版本"] },
      technology_uncertain: { connector: "而且", clause: ["技术本身也可能有几种走向", "技术未必按大家预期的方式发展", "技术本身还在变"] },
      depends_on_person: { connector: "不过", clause: ["什么有效要看你自己", "你的情况可能需要别的办法", "你比我更了解你自己的情况"] },
      context_dependent: { connector: "不过", clause: ["细节在这里很重要", "要看具体情况", "具体情形可能会改变这一点"] },
      limited_knowledge: { connector: "而且", clause: ["我对这个的了解有限", "我没有足够依据说更多", "我手里的信息很少"] },
    },
    followUp: {
      ask_what_happened: ["发生什么了?", "想说说发生了什么吗?", "是怎么到这一步的?"],
      ask_clarify: ["能多说一点你的意思吗?", "你具体想问的是什么?", "你指的是哪一部分?"],
      ask_which_aspect: ["你最关心哪一部分?", "有没有特别在意的角度?", "对你来说最重要的是哪一点?"],
      ask_how_feel: ["你现在感觉怎么样?", "你还好吗?", "你现在对这事是什么状态?"],
      ask_goal: ["你想达到什么目标?", "对你来说,什么样的结果算好?", "你真正想从中得到什么?"],
      ask_timeline: ["这件事有截止时间吗?", "你需要多快做决定?", "这事的时间安排是怎样的?"],
      offer_more: ["需要我展开说某一部分吗?", "有需要的话我可以再细说。", "想的话我可以继续往下说。"],
      invite_more: ["继续说。", "再多说一点。", "接着说,我在听。"],
    },
    greeting: {
      greeting: ["你好", "嗨", "哈喽", "你好呀"],
      farewell: ["保重", "回头见", "先这样,再见", "下次见"],
      thanks: ["不客气", "随时", "有帮到就好", "乐意效劳"],
    },
    decline: ["这个我没有足够把握直接回答", "对这个我的判断依据不够,没法直接答", "直接回答的话我就是在猜了"],
    declineRequest: ["这个决定我没法替你做", "这个我不能告诉你该怎么做", "这个只能由你自己决定"],
    clarify: ["我不太确定我理解对了", "我想先确认一下我理解得对不对", "我可能没抓住你的意思"],
    stanceMixed: ["两方面都有", "一半一半", "既是也不是", "各占一些"],
    stanceUncertain: ["不好说", "我判断不了", "这个我没有明确看法"],
    toneOpener: {
      casual: ["说实话,", "嗯,", "这么说吧,"],
      analytical: ["总体来看,", "平心而论,", "综合来看,"],
      cautious: [],
      confident: [],
      warm: [],
      neutral: [],
    },
    agree: ["我同意", "这和我的看法一致", "我觉得是这样", "我也这么看"],
    disagree: ["这点我有些不同看法", "我的看法不太一样", "我不确定能说到那个程度", "我会换个角度理解"],
    warn: ["这里要小心", "提醒一句", "这事得谨慎", "这里值得慢一点"],
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
