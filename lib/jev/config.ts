/**
 * Resolves where Jev decisions come from for one request.
 *
 * Precedence: per-request override (from the UI's settings panel, sent as
 * headers) → environment → defaults. Keys arriving per request are used for
 * that call only and never persisted or logged server-side.
 */
import { DEFAULT_JEV_API_URL, DEFAULT_JEV_MODEL } from "./client";

export type JevMode = "mock" | "api";

export interface JevOverride {
  mode?: JevMode;
  apiKey?: string;
  apiUrl?: string;
  model?: string;
}

export interface JevConfig {
  mode: JevMode;
  apiKey: string | null;
  apiUrl: string;
  model: string;
  /** Whether the key came from the request rather than the server env. */
  keySource: "request" | "env" | null;
}

export function envMode(): JevMode {
  return (process.env.JEV_MODE ?? "mock").toLowerCase() === "api" ? "api" : "mock";
}

export function resolveJevConfig(o: JevOverride = {}): JevConfig {
  const apiKey = o.apiKey?.trim() || process.env.JEV_API_KEY?.trim() || null;
  return {
    mode: o.mode ?? envMode(),
    apiKey,
    apiUrl: o.apiUrl?.trim() || process.env.JEV_API_URL || DEFAULT_JEV_API_URL,
    model: o.model?.trim() || process.env.JEV_MODEL || DEFAULT_JEV_MODEL,
    keySource: o.apiKey?.trim() ? "request" : process.env.JEV_API_KEY ? "env" : null,
  };
}

/** Read the override the UI sends as headers. Never echoed back. */
export function overrideFromHeaders(h: Headers): JevOverride {
  const mode = h.get("x-jev-mode");
  return {
    mode: mode === "api" || mode === "mock" ? mode : undefined,
    apiKey: h.get("x-jev-api-key") ?? undefined,
    apiUrl: h.get("x-jev-api-url") ?? undefined,
    model: h.get("x-jev-model") ?? undefined,
  };
}
