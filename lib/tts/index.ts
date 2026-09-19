import { BrowserSpeech } from "./browser";
import type { SpeechProvider } from "./provider";

let instance: SpeechProvider | null = null;

export function getSpeechProvider(): SpeechProvider {
  if (!instance) instance = new BrowserSpeech();
  return instance;
}

export type { SpeechProvider } from "./provider";
