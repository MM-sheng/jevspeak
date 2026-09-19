"use client";
import type { JevTurn } from "@/types/conversation";
import type { ConversationState } from "@/types/conversation";

function Block({ title, children, tint }: { title: string; children: React.ReactNode; tint?: boolean }) {
  return (
    <section className="win">
      <div className="win-title">
        <span>{title}</span>
        <span className="stripes" />
      </div>
      <div className={`p-3 mono text-[11.5px] leading-relaxed overflow-x-auto ${tint ? "bg-pink" : ""}`}>{children}</div>
    </section>
  );
}

const Arrow = () => <div className="text-center text-ink mono text-xs leading-none py-0.5">↓</div>;

export function DebugPanel({ turn, userText, stateBefore }: { turn: JevTurn; userText: string; stateBefore: ConversationState }) {
  const { decision, semantic, trace, text } = turn;
  const pct = (p: number) => `${Math.round(p * 100)}%`;
  return (
    <div className="space-y-1 fade-up">
      <Block title="01 · raw user state (sent to Jev)">
        <pre className="text-ink-soft whitespace-pre-wrap">
          {JSON.stringify(
            {
              message: userText,
              currentTopic: stateBefore.currentTopic,
              userSentiment: stateBefore.userSentiment,
              unresolvedQuestion: stateBefore.unresolvedQuestion,
              recentMessages: stateBefore.recentMessages.length,
            },
            null,
            2,
          )}
        </pre>
      </Block>
      <Arrow />
      <Block title={`02 · Jev decision (${decision.model ?? decision.source}, ${decision.latencyMs}ms)`}>
        <table className="w-full">
          <tbody>
            {Object.entries(decision.dimensions).map(([k, d]) => (
              <tr key={k}>
                <td className="text-ink-dim pr-4 align-top">{k}</td>
                <td className="text-ink pr-4 font-medium">{d.choice}</td>
                <td className="text-ink-dim tabular-nums whitespace-nowrap pr-3">P = {d.probability.toFixed(2)}</td>
                <td className="text-ink-dim pl-4 hidden md:table-cell">{d.options.slice(1, 3).map((o) => `${o.value} ${pct(o.probability)}`).join(" · ")}</td>
              </tr>
            ))}
            {Object.entries(decision.scores).map(([k, v]) => (
              <tr key={k}>
                <td className="text-ink-dim pr-4">{k}</td>
                <td className="text-ink" colSpan={3}>
                  {v.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>
      <Arrow />
      <Block title="03 · normalized semantic IR">
        <pre className="text-ink whitespace-pre-wrap">{JSON.stringify(semantic, null, 2)}</pre>
        {trace.warnings.length > 0 && (
          <div className="mt-2 text-ink border-t-[1.5px] border-ink pt-2">
            {trace.warnings.map((w, i) => (
              <div key={i}>⚠ repair: {w}</div>
            ))}
          </div>
        )}
      </Block>
      <Arrow />
      <Block title={`04 · language compiler trace (${trace.locale} · seed ${trace.seed})`}>
        <table className="w-full">
          <tbody>
            {trace.steps.map((s, i) => (
              <tr key={i} className="align-top">
                <td className="text-ink-dim pr-3 whitespace-nowrap">{s.stage}</td>
                <td className="text-ink pr-3 whitespace-nowrap font-medium">{s.slot}</td>
                <td className="text-ink-soft pr-3">{s.input}</td>
                <td className="text-ink">→ {s.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>
      <Arrow />
      <Block title="05 · final text" tint>
        <div className="text-ink text-[15px] font-sans">“{text}”</div>
      </Block>
    </div>
  );
}
