"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "./Header";
import type { Locale } from "@/lib/language/locale";

const COPY = {
  en: {
    tagline: "decisions → language → speech",
    h1a: "Jev can't generate text.",
    h1b: "So I made it talk anyway.",
    sub: "A conversational interface built from probabilistic decisions, deterministic language composition, and no generative LLM.",
    line: "Language is the rendering layer. Jev makes the decisions.",
    cta: "Talk to Jev →",
    how: "How it works ↓",
    howTitle: "How a reply is produced",
    win: "JevSpeak 0.1 — pipeline",
    pipeline: [
      ["USER", '"Will AI replace programmers?"'],
      ["JEV", "intent question 100%  ·  stance mixed 68%  ·  claim replace_tasks 70%"],
      ["SEMANTIC IR", '{ stance: "mixed", confidence: 0.68, mainClaim: "replace_tasks", qualification: "context_dependent" }'],
      ["LANGUAGE COMPILER", 'stance(mixed) → "yes and no"  +  claim template  +  qualification clause'],
      ["JEV SAYS", '"Yes and no. AI is going to take over some programming tasks, not the whole job, though it depends on the specifics."'],
    ],
    note: "The words are produced by code. The meaning is chosen by Jev. No GPT / Claude / Gemini model runs at any point in this pipeline.",
    cards: [
      ["Decisions, Not Tokens", "Jev answers 13 semantic questions in parallel with probability distributions — intent, stance, claim, tone…"],
      ["Deterministic Compiler", "Plan slots → pick phrases by seed → grammar. Same IR, same sentence, every time."],
      ["Calibrated Wording", "0.54 → “maybe”. 0.86 → “probably”. Below 0.50 Jev declines instead of bluffing."],
    ],
    bigA: "Meaning by Jev.",
    bigB: "Words by code.",
    bigNote: "*Same decisions, two languages: switch EN / 中文 and only the rendering layer changes.",
    footer: "Built with Jev by TypeSafe. Claude was used as a development tool, not in the runtime pipeline.",
  },
  zh: {
    tagline: "决策 → 语言 → 语音",
    h1a: "Jev 不会生成文本。",
    h1b: "所以我让它开口说话。",
    sub: "一个由概率决策和确定性语言合成构建的对话界面——没有任何生成式大模型。",
    line: "语言只是渲染层。决策由 Jev 做出。",
    cta: "和 Jev 聊聊 →",
    how: "它是怎么工作的 ↓",
    howTitle: "一句回复是如何产生的",
    win: "JevSpeak 0.1 — 管线",
    pipeline: [
      ["用户", '"AI 会取代程序员吗?"'],
      ["JEV", "intent question 100%  ·  stance mixed 68%  ·  claim replace_tasks 70%"],
      ["语义中间表示", '{ stance: "mixed", confidence: 0.68, mainClaim: "replace_tasks", qualification: "context_dependent" }'],
      ["语言编译器", 'stance(mixed) → "既是也不是"  +  claim 模板  +  限定从句'],
      ["JEV 说", '"既是也不是。AI会接手一些编程任务,但不是整个职业,不过要看具体情况。"'],
    ],
    note: "文字由代码产生,意义由 Jev 决定。整条管线中没有任何 GPT / Claude / Gemini 模型在运行。",
    cards: [
      ["决策,而非 token", "Jev 并行回答 13 个语义问题,每个都给出概率分布——意图、立场、主张、语气……"],
      ["确定性编译器", "规划槽位 → 按种子选短语 → 语法组装。同样的 IR,永远是同样的句子。"],
      ["校准的措辞", "0.54 → “也许”。0.86 → “大概率”。低于 0.50 时 Jev 会拒答,而不是硬编。"],
    ],
    bigA: "意义来自 Jev。",
    bigB: "文字来自代码。",
    bigNote: "*同样的决策,两种语言:切换 EN / 中文,只有渲染层在变。",
    footer: "基于 TypeSafe 的 Jev 构建。Claude 在开发阶段被用作工具,不参与运行时管线。",
  },
} as const;

export function Landing() {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const q = new URLSearchParams(window.location.search).get("lang");
        const saved = q ?? localStorage.getItem("jevspeak.locale") ?? (navigator.language.startsWith("zh") ? "zh" : "en");
        setLocale(saved === "zh" ? "zh" : "en");
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const c = COPY[locale];
  const toggle = () => {
    const next: Locale = locale === "en" ? "zh" : "en";
    setLocale(next);
    try {
      localStorage.setItem("jevspeak.locale", next);
    } catch {}
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        tagline={c.tagline}
        right={
          <button onClick={toggle} className="btn btn-sm">
            {locale === "en" ? "EN" : "中文"}
          </button>
        }
      />

      {/* hero */}
      <section className="dots border-b-[1.5px] border-ink">
        <div className="max-w-5xl mx-auto px-6 pt-14 pb-12 brackets">
          <h1 className="text-[44px] sm:text-[72px] font-extrabold tracking-[-0.04em] leading-[0.95] text-ink">
            {c.h1a}
            <br />
            {c.h1b}
          </h1>
          <div className="mt-8 win max-w-xl">
            <div className="win-title">
              <span>JevSpeak 0.1</span>
              <span className="stripes" />
            </div>
            <div className="p-4">
              <p className="text-[15px] leading-relaxed text-ink">{c.sub}</p>
              <p className="mt-2 mono text-[12px] text-ink-soft">{c.line}</p>
              <div className="mt-4 flex gap-3">
                <Link href="/chat" className="btn btn-ink">
                  {c.cta}
                </Link>
                <a href="#how" className="btn">
                  {c.how}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* pipeline */}
      <section id="how" className="max-w-5xl mx-auto w-full px-6 py-14">
        <div className="label mb-4">{c.howTitle}</div>
        <div className="win">
          <div className="win-title">
            <span>{c.win}</span>
            <span className="stripes" />
            <span>▤</span>
          </div>
          <ol className="divide-y-[1.5px] divide-ink">
            {c.pipeline.map(([label, body], i) => (
              <li key={label} className={`grid grid-cols-[130px_1fr] sm:grid-cols-[170px_1fr] gap-4 px-4 py-3 items-start ${i === 4 ? "bg-pink" : ""}`}>
                <span className="mono text-[11px] text-ink pt-0.5">
                  {String(i + 1).padStart(2, "0")} {label}
                </span>
                <span className="mono text-[12.5px] text-ink leading-relaxed break-words">{body}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-3 mono text-[11px] text-ink-soft">*{c.note}</p>
      </section>

      {/* three columns */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-14 grid sm:grid-cols-3 gap-8">
        {c.cards.map(([h, b]) => (
          <div key={h} className="label !py-1 min-h-[96px]">
            <div className="mono text-[11px] text-ink mb-3">{h}</div>
            <div className="text-[15px] leading-snug text-ink font-sans">{b}</div>
          </div>
        ))}
      </section>

      {/* big statement */}
      <section className="dots border-y-[1.5px] border-ink">
        <div className="max-w-5xl mx-auto px-6 py-16 brackets">
          <h2 className="text-[40px] sm:text-[68px] font-extrabold tracking-[-0.04em] leading-[0.95] text-ink">
            {c.bigA}
            <br />
            {c.bigB}
          </h2>
          <p className="mt-4 mono text-[11px] text-ink">{c.bigNote}</p>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto w-full px-6 py-6 mono text-[11px] text-ink-soft flex flex-wrap gap-x-6 gap-y-1 justify-between">
        <span>{c.footer}</span>
        <a href="https://github.com/MM-sheng/jevspeak" className="hover:bg-ink hover:text-white px-1 -mx-1">
          github.com/MM-sheng/jevspeak
        </a>
      </footer>
    </div>
  );
}
