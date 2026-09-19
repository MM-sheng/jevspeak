import type { SpeechProvider } from "./provider";

/** Browser SpeechSynthesis provider with automatic voice selection. */
export class BrowserSpeech implements SpeechProvider {
  readonly name = "browser";
  private voice: SpeechSynthesisVoice | null = null;

  isSupported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    if (this.voice) return this.voice;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const lang = navigator.language || "en-US";
    const prefer = [
      (v: SpeechSynthesisVoice) => v.lang === lang && /Samantha|Daniel|Karen|Moira|Google|Natural|Premium|Enhanced/i.test(v.name),
      (v: SpeechSynthesisVoice) => v.lang === lang,
      (v: SpeechSynthesisVoice) => v.lang.startsWith("en") && /Google|Natural|Premium|Enhanced/i.test(v.name),
      (v: SpeechSynthesisVoice) => v.lang.startsWith("en"),
      (v: SpeechSynthesisVoice) => v.default,
    ];
    for (const p of prefer) {
      const v = voices.find(p);
      if (v) {
        this.voice = v;
        return v;
      }
    }
    this.voice = voices[0];
    return this.voice;
  }

  speak(text: string, opts?: { onEnd?: () => void; onError?: (e: unknown) => void }) {
    if (!this.isSupported()) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = this.pickVoice();
    if (v) u.voice = v;
    u.rate = 1.0;
    u.pitch = 1.0;
    u.onend = () => opts?.onEnd?.();
    u.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") opts?.onEnd?.();
      else opts?.onError?.(e);
    };
    synth.speak(u);
  }

  stop() {
    if (this.isSupported()) window.speechSynthesis.cancel();
  }

  isSpeaking() {
    return this.isSupported() && window.speechSynthesis.speaking;
  }
}
