import type { Distribution as Dist } from "@/types/semantic";

const pct = (p: number) => `${Math.round(p * 100)}%`;

/** Horizontal bar chart of one Jev question's distribution. */
export function DistributionBars({ dist, max = 4 }: { dist: Dist; max?: number }) {
  const rows = dist.options.slice(0, max);
  return (
    <ul className="space-y-[3px]">
      {rows.map((o, i) => (
        <li key={o.value} className="grid grid-cols-[minmax(0,1fr)_88px_36px] items-center gap-2 font-mono text-[11px]">
          <span className={`truncate ${i === 0 ? "text-fg" : "text-fg-dim"}`}>{o.value}</span>
          <span className="h-[6px] bg-panel-2 rounded-sm overflow-hidden">
            <span
              className={`block h-full rounded-sm bar-anim ${i === 0 ? "bg-accent" : "bg-border-strong"}`}
              style={{ width: pct(o.probability) }}
            />
          </span>
          <span className={`text-right tabular-nums ${i === 0 ? "text-fg" : "text-fg-dim"}`}>{pct(o.probability)}</span>
        </li>
      ))}
    </ul>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_88px_36px] items-center gap-2 font-mono text-[11px]">
      <span className="text-fg">{label}</span>
      <span className="h-[6px] bg-panel-2 rounded-sm overflow-hidden">
        <span className="block h-full rounded-sm bg-amber bar-anim" style={{ width: pct(value) }} />
      </span>
      <span className="text-right tabular-nums text-fg">{value.toFixed(2)}</span>
    </div>
  );
}
