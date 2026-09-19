/**
 * Minimal in-memory per-IP rate limiter for the public deployment.
 * Serverless instances don't share memory, so this is a soft cap per
 * instance — enough to stop casual scripting, not a security boundary.
 */
const WINDOW_MS = 60_000;
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, max: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= max) return { ok: false, retryAfterSec: Math.ceil((hits[0] + WINDOW_MS - now) / 1000) };
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.delete(buckets.keys().next().value as string);
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
