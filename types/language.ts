/** Output of the language compiler, including a trace for the debug view. */
export interface TraceStep {
  stage: "plan" | "realize" | "grammar";
  slot: string;
  input: string;
  output: string;
}

export interface CompileTrace {
  seed: number;
  steps: TraceStep[];
  /** Ordered slot names that ended up in the sentence. */
  slots: string[];
  /** Warnings for unsupported / contradictory combinations the compiler repaired. */
  warnings: string[];
}

export interface CompiledResponse {
  text: string;
  trace: CompileTrace;
}
