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
      setMode(saved.mode);
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
            setMode(v.mode);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <Header
        mode={mode}
        tagline={t.tagline}
        right={
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <button
              onClick={toggleLocale}
              className="px-1.5 py-0.5 rounded border border-accent/60 text-accent hover:bg-panel-2"
              title={locale === "en" ? "切换到中文渲染" : "Switch to English rendering"}
            >
              {locale === "en" ? "EN" : "中文"}
            </button>
            <Toggle on={autoSpeak} onClick={toggleAutoSpeak} label={t.autoSpeak} disabled={!speech.supported} />
            <Toggle on={debug} onClick={() => setDebug((v) => !v)} label={t.debug} />
            <Toggle on={brainOpen} onClick={() => setBrainOpen((v) => !v)} label={t.brain} />
            <button
              onClick={() => setSettingsOpen(true)}
              className="px-1.5 py-0.5 rounded border border-border text-fg-dim hover:text-fg"
              title="Jev API settings"
            >
              {t.settings}
            </button>
            <button onClick={reset} className="text-fg-dim hover:text-fg px-1" title={t.resetTitle}>
              {t.reset}
            </button>
          </div>
        }
      />

      <div className="flex flex-1 min-h-0">
        {/* Conversation */}
        <main className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {records.length === 0 && !pending && (
                <div className="pt-10">
                  <div className="text-fg-muted text-sm">{t.emptyTitle}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {t.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs border border-border rounded px-2.5 py-1.5 text-fg-muted hover:text-fg hover:border-border-strong transition-colors"
                      >
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
                    className={`rounded -mx-3 px-3 py-2 cursor-pointer transition-colors ${
                      selectedRecord?.jev.id === r.jev.id ? "bg-panel" : "hover:bg-panel/60"
                    }`}
                    onClick={() => setSelected(r.jev.id)}
                  >
                    <Message
                      role={t.jev}
                      isJev
                      text={r.jev.text}
                      meta={`${r.jev.semantic.speechAct} · ${r.jev.semantic.tone} · conf ${r.jev.semantic.confidence.toFixed(2)}`}
                      action={
                        speech.supported && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (speech.speakingId === r.jev.id) speech.stop();
                              else speech.speak(r.jev.id, r.jev.text, getPack(r.jev.trace.locale ?? "en").speechLang);
                            }}
                            className={`font-mono text-[11px] px-2 py-0.5 rounded border transition-colors ${
                              speech.speakingId === r.jev.id
                                ? "border-accent text-accent"
                                : "border-border text-fg-dim hover:text-fg hover:border-border-strong"
                            }`}
                          >
                            {speech.speakingId === r.jev.id ? t.stop : t.speak}
                          </button>
                        )
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
                  <div className="font-mono text-xs text-fg-dim">
                    <span className="text-fg-muted">Jev</span> <span className="blink">{t.deciding}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="border border-red/40 rounded p-3 text-sm fade-up">
                  <div className="font-mono text-[11px] text-red uppercase tracking-wider mb-1">{error.code}</div>
                  <div className="text-fg">{error.message}</div>
                  {error.detail && <pre className="mt-2 text-[11px] text-fg-dim whitespace-pre-wrap">{error.detail}</pre>}
                  <div className="mt-2 text-[11px] text-fg-dim">
                    {t.noFallback}
                    {error.code === "jev_missing_key" && (
                      <>
                        {" "}
                        <button onClick={() => setSettingsOpen(true)} className="text-accent hover:underline">
                          {t.openSettings}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
              {speech.error && <div className="text-xs text-red">{speech.error}</div>}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-border px-4 sm:px-8 py-3"
          >
            <div className="max-w-2xl mx-auto flex gap-2 items-end">
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
                className="flex-1 resize-none bg-panel border border-border rounded px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:outline-none focus:border-accent/60"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || !!pending}
                className="px-3 py-2 rounded bg-fg text-bg text-sm font-medium disabled:opacity-30 hover:bg-accent transition-colors"
              >
                {t.send}
              </button>
            </div>
            <div className="max-w-2xl mx-auto mt-1.5 font-mono text-[10px] text-fg-dim">
              {t.memory(state.turnCount, state.currentTopic ?? "—", state.userSentiment ?? "—")}
              {state.unresolvedQuestion ? t.awaiting : ""}
            </div>
          </form>
        </main>

        {/* Jev Brain */}
        {brainOpen && (
          <aside className="w-[320px] shrink-0 border-l border-border bg-panel/40 hidden md:flex flex-col">
            <JevBrain turn={selectedRecord?.jev ?? null} locale={locale} />
          </aside>
        )}
      </div>
    </div>
  );
}

function Message({ role, text, meta, action, isJev }: { role: string; text: string; meta?: string; action?: React.ReactNode; isJev?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="font-mono text-[11px] text-fg-muted">
          {role}
          {meta && <span className="text-fg-dim"> · {meta}</span>}
        </div>
        {action}
      </div>
      <div className={`text-[15px] leading-relaxed ${isJev ? "text-fg" : "text-user"}`}>{text}</div>
    </div>
  );
}

function Toggle({ on, onClick, label, disabled }: { on: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-1.5 py-0.5 rounded border transition-colors disabled:opacity-30 ${
        on ? "border-accent/60 text-accent" : "border-border text-fg-dim hover:text-fg"
      }`}
      title={disabled ? "Not supported in this browser" : undefined}
    >
      {label}
    </button>
  );
}
