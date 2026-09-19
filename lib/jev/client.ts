/**
 * Real Jev API client.
 *
 * Wire format (configurable in one place). We POST the STATE + QUESTIONS
 * block and expect per-question answers back. If Jev's real endpoint shape
 * differs, adapt `toWire` / `fromWire` here — nothing else in the app
 * touches raw Jev payloads.
 */
import type { JevRequest, RawJevResponse } from "./schema";
import { JevError } from "./errors";

export interface JevClientConfig {
  apiUrl: string;
  apiKey: string;
  timeoutMs?: number;
}

function toWire(req: JevRequest) {
  return {
    state: req.state,
    questions: req.questions.map((q) =>
      q.kind === "choice"
        ? { id: q.id, type: "choice", prompt: q.prompt, options: [...q.options] }
        : { id: q.id, type: "score", prompt: q.prompt },
    ),
  };
}

function fromWire(json: unknown): RawJevResponse {
  if (!json || typeof json !== "object") throw new JevError("malformed", "Jev returned a non-object response.");
  const obj = json as Record<string, unknown>;
  // Accept either {answers: {...}} or {decisions: {...}}.
  const answers = (obj.answers ?? obj.decisions) as Record<string, unknown> | undefined;
  if (!answers || typeof answers !== "object")
    throw new JevError("malformed", "Jev response is missing an `answers` object.", JSON.stringify(json).slice(0, 400));
  return { answers: answers as RawJevResponse["answers"] };
}

export async function apiInfer(req: JevRequest, cfg: JevClientConfig): Promise<RawJevResponse> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), cfg.timeoutMs ?? 15000);
  let res: Response;
  try {
    res = await fetch(cfg.apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(toWire(req)),
      signal: ctrl.signal,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new JevError(
      "network",
      ctrl.signal.aborted ? "Jev request timed out." : "Could not reach the Jev API.",
      msg,
    );
  } finally {
    clearTimeout(t);
  }

  if (res.status === 401 || res.status === 403) throw new JevError("missing_key", "Jev rejected the API key.");
  if (res.status === 429) throw new JevError("rate_limited", "Jev rate limit reached. Try again shortly.");
  if (res.status >= 500) throw new JevError("unavailable", `Jev API unavailable (HTTP ${res.status}).`);
  if (!res.ok) throw new JevError("malformed", `Jev API returned HTTP ${res.status}.`, await res.text().catch(() => ""));

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new JevError("malformed", "Jev returned non-JSON.");
  }
  return fromWire(json);
}
