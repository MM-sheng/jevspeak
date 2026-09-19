import Link from "next/link";

export function Header({ mode, right }: { mode?: "mock" | "api" | null; right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between border-b border-border px-4 h-11 shrink-0">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-mono text-sm tracking-tight text-fg hover:text-accent">
          JevSpeak
        </Link>
        <span className="text-fg-dim text-xs hidden sm:inline">decisions → language → speech</span>
      </div>
      <div className="flex items-center gap-3">
        {mode && (
          <span
            className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
              mode === "api" ? "border-green/40 text-green" : "border-amber/40 text-amber"
            }`}
            title={mode === "api" ? "Decisions from the Jev API" : "Decisions from the mock Jev scorer (JEV_MODE=mock)"}
          >
            JEV {mode.toUpperCase()}
          </span>
        )}
        {right}
      </div>
    </header>
  );
}
