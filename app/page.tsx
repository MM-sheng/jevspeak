import Link from "next/link";
import { Header } from "@/components/Header";

const PIPELINE = [
  ["USER", '"Will AI replace programmers?"'],
  ["JEV", "intent question 97%  ·  stance mostly_yes 64%  ·  claim replace_tasks 81%"],
  ["SEMANTIC IR", '{ stance: "mostly_yes", confidence: 0.64, mainClaim: "replace_tasks", qualification: "not_all_jobs" }'],
  ["LANGUAGE COMPILER", "confidence(0.64) → \"I think\"  +  claim template  +  qualification clause"],
  ["JEV SAYS", '"I think AI is more likely to replace programming tasks than programmers entirely."'],
];

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 px-6 py-16 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
          Jev can&apos;t generate text.
          <br />
          <span className="text-fg-muted">So I made it talk anyway.</span>
        </h1>
        <p className="mt-6 text-fg-muted max-w-xl leading-relaxed">
          A conversational interface built from probabilistic decisions, deterministic language composition, and no
          generative LLM.
        </p>
        <p className="mt-2 font-mono text-sm text-fg-dim">
          Language is the rendering layer. Jev makes the decisions.
        </p>

        <div className="mt-8 flex gap-3">
          <Link
            href="/chat"
            className="px-4 py-2 rounded bg-fg text-bg text-sm font-medium hover:bg-accent transition-colors"
          >
            Talk to Jev →
          </Link>
          <a
            href="#how"
            className="px-4 py-2 rounded border border-border text-sm text-fg-muted hover:border-border-strong hover:text-fg transition-colors"
          >
            How it works ↓
          </a>
        </div>

        <section id="how" className="mt-16">
          <div className="font-mono text-[11px] text-fg-dim uppercase tracking-wider mb-3">How a reply is produced</div>
          <ol className="border border-border rounded divide-y divide-border">
            {PIPELINE.map(([label, body], i) => (
              <li key={label} className="grid grid-cols-[140px_1fr] gap-4 px-4 py-3 items-start">
                <span className="font-mono text-[11px] text-fg-dim pt-0.5">
                  {i + 1}. {label}
                </span>
                <span className={`font-mono text-[13px] ${i === 4 ? "text-fg" : "text-fg-muted"}`}>{body}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-fg-dim">
            The words are produced by code. The meaning is chosen by Jev. No GPT / Claude / Gemini model runs at any point
            in this pipeline.
          </p>
        </section>

        <section className="mt-12 grid sm:grid-cols-3 gap-4 text-sm">
          {[
            ["Jev", "Answers ~13 semantic questions in parallel with probability distributions — intent, stance, claim, tone…"],
            ["Compiler", "Deterministic: plan slots → pick phrases by seed → grammar. Same IR, same sentence, every time."],
            ["Uncertainty", "0.54 → “maybe”. 0.86 → “probably”. Below 0.50 Jev declines instead of bluffing."],
          ].map(([h, b]) => (
            <div key={h} className="border border-border rounded p-4">
              <div className="font-mono text-xs text-accent mb-1">{h}</div>
              <div className="text-fg-muted leading-relaxed">{b}</div>
            </div>
          ))}
        </section>
      </main>
      <footer className="px-6 py-4 text-[11px] text-fg-dim font-mono border-t border-border">
        Claude was used as a development tool to build this software. It is not part of the runtime pipeline.
      </footer>
    </div>
  );
}
