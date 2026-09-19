"use client";
import { useState } from "react";
import type { JevTurn } from "@/types/conversation";
import { DistributionBars, ScoreBar } from "./Distribution";
import { confidenceBand, describeBand } from "@/lib/language/confidence";

const ORDER = [
  "intent",
  "topic",
  "speech_act",
  "stance",
  "main_claim",
  "qualification",
  "emotion",
  "response_goal",
  "follow_up",
  "tone",
  "verbosity",
];

export function JevBrain({ turn }: { turn: JevTurn | null }) {
  const [expanded, setExpanded] = useState(true);

  if (!turn) {
    return (
      <div className="p-4 text-xs text-fg-dim font-mono">
        Send a message. Jev&apos;s decisions — with the alternatives it rejected — will appear here.
      </div>
    );
  }

  const { decision, semantic } = turn;
  const band = confidenceBand(semantic.confidence);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-9 border-b border-border shrink-0">
        <span className="font-mono text-[11px] text-fg-muted uppercase tracking-wider">Jev Brain</span>
        <div className="flex items-center gap-3 font-mono text-[11px] text-fg-dim">
          <span title="Inference source">{decision.model ?? decision.source}</span>
          <span>{decision.latencyMs}ms</span>
          <button onClick={() => setExpanded((e) => !e)} className="hover:text-fg">
            {expanded ? "collapse" : "expand"}
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border space-y-2">
        <ScoreBar label="confidence" value={decision.scores.confidence} />
        <div className="font-mono text-[11px] text-fg-dim pl-0.5">→ {describeBand(band)}</div>
        {semantic.emotion && <ScoreBar label="emotion_intensity" value={decision.scores.emotion_intensity} />}
      </div>

      {expanded && (
        <div className="overflow-y-auto flex-1">
          {ORDER.map((k) => {
            const d = decision.dimensions[k];
            if (!d) return null;
            const inIR = isInIR(k, semantic);
            return (
              <section key={k} className="px-4 py-3 border-b border-border">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="font-mono text-[11px] text-fg-muted">{k}</span>
                  <span className="flex gap-2 font-mono text-[10px] text-fg-dim">
                    {d.confidence !== undefined && <span title="Jev's calibrated confidence in this decision">conf {d.confidence.toFixed(2)}</span>}
                    {!inIR && <span title="Not used by the compiler for this response">unused</span>}
                  </span>
                </div>
                <DistributionBars dist={d} />
              </section>
            );
          })}
        </div>
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
