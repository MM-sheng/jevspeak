"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatError, ChatResponse, ConversationState, JevTurn, Turn } from "@/types/conversation";
import { emptyState } from "@/lib/conversation/state";
import { Header } from "./Header";
import { JevBrain } from "./JevBrain";
import { DebugPanel } from "./DebugPanel";
import { useSpeech } from "./useSpeech";
import { JevSettings, loadSettings, settingsHeaders, DEFAULT_SETTINGS, type JevSettingsValue } from "./JevSettings";
import { UI } from "@/lib/i18n";
import { getPack, type Locale } from "@/lib/language";

const STORAGE_KEY = "jevspeak.autospeak";
const LOCALE_KEY = "jevspeak.locale";

interface TurnRecord {
  user: Turn & { role: "user" };
  jev: JevTurn;
  stateBefore: ConversationState;
}

export function ChatClient() {
  const [records, setRecords] = useState<TurnRecord[]>([]);
  const [state, setState] = useState<ConversationState>(() => emptyState());
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<ChatError | null>(null);
  const [mode, setMode] = useState<"mock" | "api" | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [debug, setDebug] = useState(false);
  const [brainOpen, setBrainOpen] = useState(true);
  const [mobileBrain, setMobileBrain] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<JevSettingsValue>(DEFAULT_SETTINGS);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [locale, setLocale] = useState<Locale>("en");
  const t = UI[locale];
  const speech = useSpeech();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Browser-only state, read after hydration so server and client markup match.
    const timer = setTimeout(() => {
      const saved = loadSettings();
      setSettings(saved);
      if (saved.mode !== "auto") setMode(saved.mode);
      try {
        setAutoSpeak(localStorage.getItem(STORAGE_KEY) === "1");
        const q = new URLSearchParams(window.location.search).get("lang");
        const saved = q ?? localStorage.getItem(LOCALE_KEY) ?? (navigator.language.startsWith("zh") ? "zh" : "en");
        setLocale(saved === "zh" ? "zh" : "en");
      } catch {}
      if (new URLSearchParams(window.location.search).has("settings")) setSettingsOpen(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((j) => setMode((m) => m ?? j.mode))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSettingsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  const toggleLocale = () =>
    setLocale((l) => {
      const next: Locale = l === "en" ? "zh" : "en";
      try {
        localStorage.setItem(LOCALE_KEY, next);
      } catch {}
      return next;
    });

  const toggleAutoSpeak = () =>
    setAutoSpeak((v) => {
      try {
        localStorage.setItem(STORAGE_KEY, v ? "0" : "1");
      } catch {}
      return !v;
    });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [records.length, pending]);

  const send = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg || pending) return;
      setInput("");
      setError(null);
      setPending(msg);
      const stateBefore = state;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json", ...settingsHeaders(settings) },
          body: JSON.stringify({ message: msg, state, locale }),
        });
        const json = (await res.json()) as ChatResponse | ChatError;
        if (!json.ok) {
          setError(json);
          return;
        }
        setRecords((r) => [...r, { user: json.user, jev: json.jev, stateBefore }]);
        setState(json.state);
        setMode(json.mode);
        setSelected(json.jev.id);
        if (autoSpeak && speech.supported) speech.speak(json.jev.id, json.jev.text, getPack(locale).speechLang);
      } catch (e) {
        setError({ ok: false, code: "internal", message: t.serverUnreachable, detail: String(e) });
      } finally {
        setPending(null);
        inputRef.current?.focus();
      }
    },
    [pending, state, autoSpeak, speech, settings, locale, t.serverUnreachable],
  );

  const reset = () => {
    speech.stop();
    setRecords([]);
    setState(emptyState());
    setSelected(null);
    setError(null);
  };

  const selectedRecord = records.find((r) => r.jev.id === selected) ?? records[records.length - 1] ?? null;

  return (
    <div className="flex flex-col h-screen">
      {settingsOpen && (
        <JevSettings
          value={settings}
          onChange={(v) => {
            setSettings(v);
            if (v.mode !== "auto") setMode(v.mode);
            else fetch("/api/health").then((r) => r.json()).then((j) => setMode(j.mode)).catch(() => {});
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <Header
        mode={mode}
        tagline={t.tagline}
        right={
          <div className="flex items-center gap-1.5 mono text-[11px]">
            <button onClick={toggleLocale} className="btn btn-sm" title={locale === "en" ? "切换到中文渲染" : "Switch to English rendering"}>
              {locale === "en" ? "EN" : "中文"}
            </button>
            <Toggle on={autoSpeak} onClick={toggleAutoSpeak} label={t.autoSpeak} disabled={!speech.supported} />
            <Toggle on={debug} onClick={() => setDebug((v) => !v)} label={t.debug} />
            <span className="hidden md:inline-flex">
              <Toggle on={brainOpen} onClick={() => setBrainOpen((v) => !v)} label={t.brain} />
            </span>
            <span className="md:hidden inline-flex">
              <Toggle on={mobileBrain} onClick={() => setMobileBrain((v) => !v)} label={t.brain} />
            </span>
            <button onClick={() => setSettingsOpen(true)} className="btn btn-sm" title="Jev API settings">
              {t.settings}
            </button>
            <button onClick={reset} className="btn btn-sm" title={t.resetTitle}>
              {t.reset}
            </button>
          </div>
        }
      />

      <div className="flex flex-1 min-h-0 dots p-3 gap-3">
        {/* Conversation window */}
        <main className="flex-1 flex flex-col min-w-0 win">
          <div className="win-title">
            <span>{locale === "zh" ? "对话" : "Conversation"}</span>
            <span className="stripes" />
            <span>{records.length}</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            <div className="max-w-2xl mx-auto space-y-5">
              {records.length === 0 && !pending && (
                <div className="pt-10">
                  <div className="text-[15px] text-ink leading-snug max-w-md">{t.emptyTitle}</div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {t.suggestions.map((s) => (
                      <button key={s} onClick={() => send(s)} className="btn">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {records.map((r) => (
                <div key={r.user.id} className="space-y-4 fade-up">
                  <Message role={t.you} text={r.user.text} />
                  <div
                    className={`border-[1.5px] px-3 py-2.5 cursor-pointer transition-colors ${
                      selectedRecord?.jev.id === r.jev.id ? "border-ink bg-white shadow-[3px_3px_0_var(--ink)]" : "border-transparent hover:border-ink"
                    }`}
                    onClick={() => setSelected(r.jev.id)}
                  >
                    <Message
                      role={t.jev}
                      isJev
                      text={r.jev.text}
                      meta={`${r.jev.semantic.speechAct} · ${r.jev.semantic.tone} · conf ${r.jev.semantic.confidence.toFixed(2)}`}
                      action={
                        <span className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(r.jev.id);
                            setMobileBrain(true);
                          }}
                          className="btn btn-sm md:hidden"
                        >
                          {t.brain}
                        </button>
                        {speech.supported && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (speech.speakingId === r.jev.id) speech.stop();
                              else speech.speak(r.jev.id, r.jev.text, getPack(r.jev.trace.locale ?? "en").speechLang);
                            }}
                            className={`btn btn-sm ${speech.speakingId === r.jev.id ? "btn-on" : ""}`}
                          >
                            {speech.speakingId === r.jev.id ? t.stop : t.speak}
                          </button>
                        )}
                        </span>
                      }
                    />
                    {debug && selectedRecord?.jev.id === r.jev.id && (
                      <div className="mt-4">
                        <DebugPanel turn={r.jev} userText={r.user.text} stateBefore={r.stateBefore} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {pending && (
                <div className="space-y-4 fade-up">
                  <Message role={t.you} text={pending} />
                  <div className="mono text-[11px] text-ink">
                    <span className="bg-ink text-white px-1">Jev</span> <span className="blink">{t.deciding}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="win fade-up">
                  <div className="win-title">
                    <span>⚠ {error.code}</span>
                    <span className="stripes" />
                  </div>
                  <div className="p-3 text-sm bg-pink">
                  <div className="text-ink">{error.message}</div>
                  {error.detail && <pre className="mt-2 mono text-[11px] text-ink-soft whitespace-pre-wrap">{error.detail}</pre>}
                  <div className="mt-2 mono text-[11px] text-ink-soft">
                    {t.noFallback}
                    {error.code === "jev_missing_key" && (
                      <>
                        {" "}
                        <button onClick={() => setSettingsOpen(true)} className="underline">
                          {t.openSettings}
                        </button>
                      </>
                    )}
                  </div>
                  </div>
                </div>
              )}
              {speech.error && <div className="mono text-[11px] text-ink">{speech.error}</div>}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t-[1.5px] border-ink px-4 sm:px-6 py-3 bg-grey-faint"
          >
            <div className="max-w-2xl mx-auto flex gap-2 items-stretch">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                placeholder={t.placeholder}
                className="field flex-1 resize-none !font-sans text-[14px]"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || !!pending}
                className="btn btn-ink"
              >
                {t.send}
              </button>
            </div>
            <div className="max-w-2xl mx-auto mt-2 mono text-[10px] text-ink-soft">
              {t.memory(state.turnCount, state.currentTopic ?? "—", state.userSentiment ?? "—")}
              {state.unresolvedQuestion ? t.awaiting : ""}
            </div>
          </form>
        </main>

        {/* Jev Brain */}
        {brainOpen && (
          <aside className="w-[340px] shrink-0 hidden md:flex flex-col min-h-0">
            <JevBrain turn={selectedRecord?.jev ?? null} locale={locale} />
          </aside>
        )}
        {/* Mobile: Brain as a bottom sheet */}
        {mobileBrain && (
          <div className="md:hidden fixed inset-0 z-30 bg-ink/30 flex flex-col justify-end" onClick={() => setMobileBrain(false)}>
            <div className="h-[78vh] p-3 pb-4 flex flex-col min-h-0" onClick={(e) => e.stopPropagation()}>
              <JevBrain turn={selectedRecord?.jev ?? null} locale={locale} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Message({ role, text, meta, action, isJev }: { role: string; text: string; meta?: string; action?: React.ReactNode; isJev?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <div className="mono text-[11px] text-ink">
          <span className={isJev ? "bg-ink text-white px-1" : "border-[1.5px] border-ink px-1"}>{role}</span>
          {meta && <span className="text-ink-dim ml-2">{meta}</span>}
        </div>
        {action}
      </div>
      <div className={`text-[15px] leading-relaxed ${isJev ? "text-ink" : "text-ink-soft"}`}>{text}</div>
    </div>
  );
}

function Toggle({ on, onClick, label, disabled }: { on: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-sm ${on ? "btn-on" : ""}`}
      title={disabled ? "Not supported in this browser" : undefined}
    >
      {label}
    </button>
  );
}
