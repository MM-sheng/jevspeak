"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechProvider } from "@/lib/tts";

export function useSpeech() {
  const [supported, setSupported] = useState(false);

  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const provider = useRef(getSpeechProvider());

  useEffect(() => {
    setSupported(provider.current.isSupported());
    // Chrome loads voices asynchronously; touching them early warms the cache.
    if (provider.current.isSupported()) window.speechSynthesis.getVoices();
  }, []);

  const stop = useCallback(() => {
    provider.current.stop();
    setSpeakingId(null);
  }, []);

  const speak = useCallback((id: string, text: string, lang?: string) => {
    setError(null);
    setSpeakingId(id);
    provider.current.speak(text, {
      lang,
      onEnd: () => setSpeakingId((cur) => (cur === id ? null : cur)),
      onError: () => {
        setError("Speech failed in this browser.");
        setSpeakingId(null);
      },
    });
  }, []);

  useEffect(() => () => provider.current.stop(), []);

  return { supported, speakingId, speak, stop, error };
}
