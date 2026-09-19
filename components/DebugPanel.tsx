"use client";
import type { JevTurn } from "@/types/conversation";
import type { ConversationState } from "@/types/conversation";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border rounded">
      <div className="px-3 py-1.5 border-b border-border font-mono text-[10px] uppercase tracking-wider text-fg-dim">{title}</div>
      <div className="p-3 font-mono text-[11.5px] leading-relaxed overflow-x-auto">{children}</div>
    </section>
  );
}

const Arrow = () => <div className="text-center text-fg-dim font-mono text-xs">↓</div>;

export function DebugPanel({ turn, userText, stateBefore }: { turn: JevTurn; userText: string; stateBefore: ConversationState }) {
  const { decision, semantic, trace, text } = turn;
  const pct = (p: number) => `${Math.round(p * 100)}%`;
  return (
    <div className="space-y-2 fade-up">
      <Block title="1 · Raw user state (sent to Jev)">
        <pre className="text-fg-muted whitespace-pre-wrap">
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
      <Block title={`2 · Jev decision (${decision.source}, ${decision.latencyMs}ms)`}>
        <table className="w-full">
          <tbody>
            {Object.entries(decision.dimensions).map(([k, d]) => (
              <tr key={k}>
                <td className="text-fg-dim pr-4 align-top">{k}</td>
                <td className="text-fg pr-4">{d.choice}</td>
                <td className="text-fg-dim tabular-nums">P = {d.probability.toFixed(2)}</td>
                <td className="text-fg-dim pl-4 hidden md:table-cell">
                  {d.options.slice(1, 3).map((o) => `${o.value} ${pct(o.probability)}`).join(" · ")}
                </td>
              </tr>
            ))}
            {Object.entries(decision.scores).map(([k, v]) => (
              <tr key={k}>
                <td className="text-fg-dim pr-4">{k}</td>
                <td className="text-amber" colSpan={3}>
                  {v.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>
      <Arrow />
      <Block title="3 · Normalized Semantic IR">
        <pre className="text-fg whitespace-pre-wrap">{JSON.stringify(semantic, null, 2)}</pre>
        {trace.warnings.length > 0 && (
          <div className="mt-2 text-amber">
            {trace.warnings.map((w, i) => (
              <div key={i}>⚠ repair: {w}</div>
            ))}
          </div>
        )}
      </Block>
      <Arrow />
      <Block title={`4 · Language compiler trace (seed ${trace.seed})`}>
        <table className="w-full">
          <tbody>
            {trace.steps.map((s, i) => (
              <tr key={i} className="align-top">
                <td className="text-fg-dim pr-3 whitespace-nowrap">{s.stage}</td>
                <td className="text-accent pr-3 whitespace-nowrap">{s.slot}</td>
                <td className="text-fg-muted pr-3">{s.input}</td>
                <td className="text-fg">→ {s.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Block>
      <Arrow />
      <Block title="5 · Final text">
        <div className="text-fg text-sm font-sans">“{text}”</div>
      </Block>
    </div>
  );
}
