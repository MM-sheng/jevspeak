/** Pluggable voice provider. Swap BrowserSpeech for ElevenLabs etc. later. */
export interface SpeechProvider {
  readonly name: string;
  isSupported(): boolean;
  speak(text: string, opts?: { onEnd?: () => void; onError?: (e: unknown) => void }): void;
  stop(): void;
  isSpeaking(): boolean;
}
