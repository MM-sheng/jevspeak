"use client";
import { useEffect, useState } from "react";

export interface JevSettingsValue {
  mode: "mock" | "api";
  apiKey: string;
  apiUrl: string;
  model: string;
}

export const SETTINGS_KEY = "jevspeak.jev";
export const DEFAULT_SETTINGS: JevSettingsValue = { mode: "mock", apiKey: "", apiUrl: "", model: "" };

export function loadSettings(): JevSettingsValue {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Headers sent with every /api call so the server uses these credentials for that request only. */
export function settingsHeaders(s: JevSettingsValue): Record<string, string> {
  const h: Record<string, string> = { "x-jev-mode": s.mode };
  if (s.apiKey) h["x-jev-api-key"] = s.apiKey;
  if (s.apiUrl) h["x-jev-api-url"] = s.apiUrl;
  if (s.model) h["x-jev-model"] = s.model;
  return h;
}

interface ServerInfo {
  mode: "mock" | "api";
  envKeyConfigured: boolean;
  apiUrl: string;
  model: string;
}

export function JevSettings({
  value,
  onChange,
  onClose,
}: {
  value: JevSettingsValue;
  onChange: (v: JevSettingsValue) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const [server, setServer] = useState<ServerInfo | null>(null);
  const [test, setTest] = useState<{ state: "idle" | "running" | "ok" | "fail"; text?: string }>({ state: "idle" });

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setServer)
      .catch(() => {});
  }, []);

  const set = <K extends keyof JevSettingsValue>(k: K, v: JevSettingsValue[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const runTest = async () => {
    setTest({ state: "running" });
    try {
      const r = await fetch("/api/jev/verify", { method: "POST", headers: settingsHeaders({ ...draft, mode: "api" }) });
      const j = await r.json();
      if (j.ok) setTest({ state: "ok", text: `connected · ${j.model} · ${j.latencyMs}ms` });
      else setTest({ state: "fail", text: `${j.code}: ${j.message}${j.detail ? ` — ${String(j.detail).slice(0, 160)}` : ""}` });
    } catch (e) {
      setTest({ state: "fail", text: String(e) });
    }
  };

  const save = () => {
    onChange(draft);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(draft));
    } catch {}
    onClose();
  };

  const field = "field w-full !py-1.5 text-[12px]";

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pt-16 bg-ink/30" onClick={onClose}>
      <div className="w-[460px] max-w-[calc(100vw-32px)] win fade-up" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Jev settings">
        <div className="win-title">
          <span>Jev settings</span>
          <span className="stripes" />
          <button onClick={onClose} className="hover:underline">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="label mb-2">Decision source</div>
            <div className="grid grid-cols-2 gap-2">
              {(["mock", "api"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => set("mode", m)}
                  className={`text-left border-[1.5px] border-ink px-3 py-2 transition-colors ${draft.mode === m ? "bg-pink shadow-[2px_2px_0_var(--ink)]" : "bg-white hover:bg-grey-faint"}`}
                >
                  <div className="mono text-[12px] text-ink font-medium">{m.toUpperCase()}</div>
                  <div className="text-[11px] text-ink-soft mt-0.5">
                    {m === "mock" ? "Built-in deterministic scorer. No network." : "TypeSafe Jev — real probabilistic decisions."}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={draft.mode === "api" ? "" : "opacity-40 pointer-events-none"}>
            <div className="label mb-2">
              API key
              {server?.envKeyConfigured && <span className="text-ink-dim"> · server has JEV_API_KEY; leave blank to use it</span>}
            </div>
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft.apiKey}
              onChange={(e) => set("apiKey", e.target.value)}
              placeholder={server?.envKeyConfigured ? "(using server key)" : "ts-…"}
              className={field}
            />
            <div className="mono text-[10px] text-ink-dim mt-1">
              Stored only in this browser (localStorage) and sent with each request. Get a key at typesafe.ai.
            </div>

            <div className="grid grid-cols-[1fr_140px] gap-2 mt-3">
              <div>
                <div className="label mb-2">Endpoint</div>
                <input value={draft.apiUrl} onChange={(e) => set("apiUrl", e.target.value)} placeholder={server?.apiUrl ?? ""} className={field} spellCheck={false} />
              </div>
              <div>
                <div className="label mb-2">Model</div>
                <input value={draft.model} onChange={(e) => set("model", e.target.value)} placeholder={server?.model ?? ""} className={field} spellCheck={false} />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={runTest}
                disabled={test.state === "running" || (!draft.apiKey && !server?.envKeyConfigured)}
                className="btn btn-sm"
              >
                {test.state === "running" ? "testing…" : "Test connection"}
              </button>
              {test.text && (
                <span className={`mono text-[11px] break-all px-1 ${test.state === "ok" ? "bg-ink text-white" : "bg-pink text-ink"}`}>{test.text}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t-[1.5px] border-ink bg-grey-faint">
          <button onClick={onClose} className="btn btn-sm">
            cancel
          </button>
          <button onClick={save} className="btn btn-sm btn-ink">
            save
          </button>
        </div>
      </div>
    </div>
  );
}
