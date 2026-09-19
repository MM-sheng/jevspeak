import type { Locale, LocalePack } from "../locale";
import { en } from "./en";
import { zh } from "./zh";

export const PACKS: Record<Locale, LocalePack> = { en, zh };

export function getPack(locale?: string | null): LocalePack {
  return locale === "zh" ? zh : en;
}

export function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "zh";
}
