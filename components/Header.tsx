import Link from "next/link";

export function Header({
  mode,
  right,
  tagline = "decisions → language → speech",
}: {
  mode?: "mock" | "api" | null;
  right?: React.ReactNode;
  tagline?: string;
}) {
  return (
    <header className="flex items-center justify-between border-b-[1.5px] border-ink bg-paper px-3 h-11 shrink-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/" className="font-semibold tracking-tight text-[15px] text-ink hover:bg-ink hover:text-white px-1.5 -mx-1.5">
          JevSpeak
        </Link>
        <span className="mono text-[11px] text-ink-dim hidden sm:inline truncate">{tagline}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {mode && (
          <span
            className={`mono text-[11px] px-1.5 py-[2px] border-[1.5px] border-ink ${mode === "api" ? "bg-ink text-white" : "bg-pink text-ink"}`}
            title={mode === "api" ? "Decisions from the Jev API" : "Decisions from the mock scorer"}
          >
            JEV {mode.toUpperCase()}
          </span>
        )}
        {right}
      </div>
    </header>
  );
}
