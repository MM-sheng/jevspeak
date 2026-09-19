"use client";
import { useState } from "react";
import type { JevTurn } from "@/types/conversation";
import { DistributionBars, ScoreBar } from "./Distribution";
import { confidenceBand, describeBand } from "@/lib/language/confidence";
import { UI } from "@/lib/i18n";
import type { Locale } from "@/lib/language/locale";

const ORDER = ["intent", "topic", "speech_act", "stance", "main_claim", "qualification", "emotion", "response_goal", "follow_up", "tone", "verbosity"];

export function JevBrain({ turn, locale = "en" }: { turn: JevTurn | null; locale?: Locale }) {
  const [expanded, setExpanded] = useState(true);
  const t = UI[locale];

  return (
    <div className="win flex flex-col h-full min-h-0">
      <div className="win-title">
        <span>{t.brainTitle}</span>
        <span className="stripes" />
        {turn && (
          <span className="flex gap-3">
            <span>{turn.decision.model ?? turn.decision.source}</span>
            <span>{turn.decision.latencyMs}ms</span>
            <button onClick={() => setExpanded((e) => !e)} className="hover:underline">
              {expanded ? "▾" : "▸"}
            </button>
          </span>
        )}
      </div>

      {!turn ? (
        <div className="p-4 mono text-[11px] text-ink-soft">{t.brainEmpty}</div>
      ) : (
        <>
          <div className="px-3 py-3 border-b-[1.5px] border-ink space-y-2 bg-grey-faint">
            <ScoreBar label="answerable" value={turn.decision.scores.confidence} />
            <div className="mono text-[10.5px] text-ink-soft">
              → confidence {turn.semantic.confidence.toFixed(2)} · {describeBand(confidenceBand(turn.semantic.confidence))}
            </div>
            {turn.semantic.emotion && <ScoreBar label="emotion_intensity" value={turn.decision.scores.emotion_intensity} />}
          </div>

          {expanded && (
            <div className="overflow-y-auto flex-1 min-h-0">
              {ORDER.map((k) => {
                const d = turn.decision.dimensions[k];
                if (!d) return null;
                const inIR = isInIR(k, turn.semantic);
                return (
                  <section key={k} className="px-3 py-3 border-b-[1.5px] border-ink last:border-b-0">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="label !border-l-0 !pl-0 text-[11px]">{k}</span>
                      <span className="flex gap-2 mono text-[10px] text-ink-dim">
                        {d.confidence !== undefined && <span title="Jev's calibrated confidence in this decision">{t.conf} {d.confidence.toFixed(2)}</span>}
                        {!inIR && <span title={t.unusedTitle}>{t.unused}</span>}
                      </span>
                    </div>
                    <DistributionBars dist={d} />
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function isInIR(k: string, s: JevTurn["semantic"]): boolean {
  switch (k) {
    case "stance":
      return s.stance !== undefined;
    case "main_claim":
      return s.mainClaim !== undefined;
    case "qualification":
      return s.qualification !== undefined;
    case "emotion":
      return s.emotion !== undefined;
    case "follow_up":
      return s.followUp !== undefined;
    default:
      return true;
  }
}
