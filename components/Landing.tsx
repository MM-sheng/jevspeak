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
    pipeline: [
      ["USER", '"Will AI replace programmers?"'],
      ["JEV", "intent question 100%  ·  stance mixed 68%  ·  claim replace_tasks 70%"],
      ["SEMANTIC IR", '{ stance: "mixed", confidence: 0.68, mainClaim: "replace_tasks", qualification: "context_dependent" }'],
      ["LANGUAGE COMPILER", 'stance(mixed) → "yes and no"  +  claim template  +  qualification clause'],
      ["JEV SAYS", '"Yes and no. AI is going to take over some programming tasks, not the whole job, though it depends on the specifics."'],
    ],
    note: "The words are produced by code. The meaning is chosen by Jev. No GPT / Claude / Gemini model runs at any point in this pipeline.",
    cards: [
      ["Jev", "Answers 13 semantic questions in parallel with probability distributions — intent, stance, claim, tone…"],
      ["Compiler", "Deterministic: plan slots → pick phrases by seed → grammar. Same IR, same sentence, every time."],
      ["Uncertainty", "0.54 → “maybe”. 0.86 → “probably”. Below 0.50 Jev declines instead of bluffing."],
    ],
    footer: "Claude was used as a development tool to build this software. It is not part of the runtime pipeline.",
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
    pipeline: [
      ["用户", '"AI 会取代程序员吗?"'],
      ["JEV", "intent question 100%  ·  stance mixed 68%  ·  claim replace_tasks 70%"],
      ["语义中间表示", '{ stance: "mixed", confidence: 0.68, mainClaim: "replace_tasks", qualification: "context_dependent" }'],
      ["语言编译器", 'stance(mixed) → "既是也不是"  +  claim 模板  +  限定从句'],
      ["JEV 说", '"既是也不是。AI会接手一些编程任务,但不是整个职业,不过要看具体情况。"'],
    ],
    note: "文字由代码产生,意义由 Jev 决定。整条管线中没有任何 GPT / Claude / Gemini 模型在运行。换一套模板,同样的决策就变成另一种语言。",
    cards: [
      ["Jev", "并行回答 13 个语义问题,每个都给出概率分布——意图、立场、主张、语气……"],
      ["编译器", "确定性的:规划槽位 → 按种子选短语 → 语法组装。同样的 IR,永远是同样的句子。"],
      ["不确定性", "0.54 → “也许”。0.86 → “大概率”。低于 0.50 时 Jev 会拒答,而不是硬编。"],
    ],
    footer: "Claude 在开发阶段被用作编程工具,不参与运行时的对话管线。",
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
          <button onClick={toggle} className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-accent/60 text-accent hover:bg-panel-2">
            {locale === "en" ? "EN" : "中文"}
          </button>
        }
      />
      <main className="flex-1 px-6 py-16 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.15]">
          {c.h1a}
          <br />
          <span className="text-fg-muted">{c.h1b}</span>
        </h1>
        <p className="mt-6 text-fg-muted max-w-xl leading-relaxed">{c.sub}</p>
        <p className="mt-2 font-mono text-sm text-fg-dim">{c.line}</p>

        <div className="mt-8 flex gap-3">
          <Link href="/chat" className="px-4 py-2 rounded bg-fg text-bg text-sm font-medium hover:bg-accent transition-colors">
            {c.cta}
          </Link>
          <a href="#how" className="px-4 py-2 rounded border border-border text-sm text-fg-muted hover:border-border-strong hover:text-fg transition-colors">
            {c.how}
          </a>
        </div>

        <section id="how" className="mt-16">
          <div className="font-mono text-[11px] text-fg-dim uppercase tracking-wider mb-3">{c.howTitle}</div>
          <ol className="border border-border rounded divide-y divide-border">
            {c.pipeline.map(([label, body], i) => (
              <li key={label} className="grid grid-cols-[140px_1fr] gap-4 px-4 py-3 items-start">
                <span className="font-mono text-[11px] text-fg-dim pt-0.5">
                  {i + 1}. {label}
                </span>
                <span className={`font-mono text-[13px] ${i === 4 ? "text-fg" : "text-fg-muted"}`}>{body}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-fg-dim">{c.note}</p>
        </section>

        <section className="mt-12 grid sm:grid-cols-3 gap-4 text-sm">
          {c.cards.map(([h, b]) => (
            <div key={h} className="border border-border rounded p-4">
              <div className="font-mono text-xs text-accent mb-1">{h}</div>
              <div className="text-fg-muted leading-relaxed">{b}</div>
            </div>
          ))}
        </section>
      </main>
      <footer className="px-6 py-4 text-[11px] text-fg-dim font-mono border-t border-border flex flex-wrap gap-x-4 gap-y-1 justify-between">
        <span>{c.footer}</span>
        <a href="https://github.com/MM-sheng/jevspeak" className="hover:text-fg">
          github.com/MM-sheng/jevspeak
        </a>
      </footer>
    </div>
  );
}
