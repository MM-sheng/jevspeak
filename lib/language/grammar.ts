/** Surface-level grammar: capitalization, punctuation, joining. No semantics here. */

export function capitalize(s: string): string {
  const t = s.trimStart();
  return t.length ? t[0].toUpperCase() + t.slice(1) : t;
}

export function endsWithTerminal(s: string): boolean {
  return /[.!?…]["')\]]?$/.test(s.trim());
}

export function ensureTerminal(s: string, mark: "." | "?" | "!" = "."): string {
  const t = s.trim();
  if (!t) return t;
  if (endsWithTerminal(t)) return t;
  return t.replace(/[,;:]+$/, "") + mark;
}

/** Normalize whitespace and common punctuation glitches. */
export function tidy(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([.!?]){2,}/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

/** Fill `{hedge}` placeholders; an empty hedge is removed cleanly. */
export function fillHedge(template: string, hedge: string): string {
  if (!template.includes("{hedge}")) return template;
  return tidy(template.replace(/\{hedge\}/g, hedge));
}

/** Join a main clause with a trailing qualification clause using a connector. */
export function attachClause(main: string, clause: string, connector: string): string {
  const m = main.trim().replace(/[.!?]$/, "");
  const c = clause.trim().replace(/^[,;]\s*/, "");
  return `${m}, ${connector} ${c}`.replace(/\s+/g, " ");
}

/** Compose an ordered list of sentences into a paragraph. */
export function joinSentences(parts: string[]): string {
  return tidy(
    parts
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => capitalize(ensureTerminal(p)))
      .join(" "),
  );
}
