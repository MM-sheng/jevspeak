import type { SpeechProvider } from "./provider";

/** Browser SpeechSynthesis provider with automatic voice selection. */
export class BrowserSpeech implements SpeechProvider {
  readonly name = "browser";
  private voices = new Map<string, SpeechSynthesisVoice>();

  isSupported() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  private pickVoice(lang: string): SpeechSynthesisVoice | null {
    const cached = this.voices.get(lang);
    if (cached) return cached;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const base = lang.split("-")[0];
    const norm = (l: string) => l.replace("_", "-").toLowerCase();
    const quality = /Tingting|Meijia|Samantha|Daniel|Karen|Moira|Google|Natural|Premium|Enhanced|Siri/i;
    const prefer = [
      (v: SpeechSynthesisVoice) => norm(v.lang) === lang.toLowerCase() && quality.test(v.name),
      (v: SpeechSynthesisVoice) => norm(v.lang) === lang.toLowerCase(),
      (v: SpeechSynthesisVoice) => norm(v.lang).startsWith(base) && quality.test(v.name),
      (v: SpeechSynthesisVoice) => norm(v.lang).startsWith(base),
      (v: SpeechSynthesisVoice) => v.default,
    ];
    for (const p of prefer) {
      const v = voices.find(p);
      if (v) {
        this.voices.set(lang, v);
        return v;
      }
    }
    return voices[0];
  }

  speak(text: string, opts?: { lang?: string; onEnd?: () => void; onError?: (e: unknown) => void }) {
    if (!this.isSupported()) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const lang = opts?.lang ?? "en";
    u.lang = lang;
    const v = this.pickVoice(lang);
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
