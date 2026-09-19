/**
 * @jevspeak/language — public surface of the language engine.
 * Kept dependency-free (only ./ and @/types) so it can be extracted later.
 */
export { compileResponse, plan, repairIR } from "./compiler";
export type { CompileOptions } from "./compiler";
export { getPack, PACKS, isLocale } from "./locales";
export type { Locale, LocalePack } from "./locale";
export { LOCALES, DEFAULT_LOCALE } from "./locale";
export { confidenceBand, DECLINE_THRESHOLD, describeBand } from "./confidence";
export type { ConfidenceBand } from "./confidence";
export * as templates from "./templates";
