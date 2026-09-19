import type { Distribution as Dist } from "@/types/semantic";

const pct = (p: number) => `${Math.round(p * 100)}%`;

/** Slider-style bars for one Jev question's distribution. */
export function DistributionBars({ dist, max = 4 }: { dist: Dist; max?: number }) {
  const rows = dist.options.slice(0, max);
  return (
    <ul className="space-y-[5px]">
      {rows.map((o, i) => (
        <li key={o.value} className="grid grid-cols-[minmax(0,1fr)_84px_36px] items-center gap-2 mono text-[11px]">
          <span className={`truncate ${i === 0 ? "text-ink bg-ink/0 font-medium" : "text-ink-dim"}`}>
            {i === 0 ? <span className="bg-ink text-white px-1">{o.value}</span> : o.value}
          </span>
          <span className="track">
            <span className={`fill ${i === 0 ? "" : "dim"}`} style={{ width: pct(o.probability) }} />
          </span>
          <span className={`text-right tabular-nums ${i === 0 ? "text-ink" : "text-ink-dim"}`}>{pct(o.probability)}</span>
        </li>
      ))}
    </ul>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_84px_36px] items-center gap-2 mono text-[11px]">
      <span className="text-ink">{label}</span>
      <span className="track">
        <span className="knob" style={{ left: pct(value) }} />
      </span>
      <span className="text-right tabular-nums text-ink">{value.toFixed(2)}</span>
    </div>
  );
}
