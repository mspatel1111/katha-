import { env } from "cloudflare:workers";
import { getD1 } from "@/lib/catalog-db";
import { logEvent } from "@/lib/monitoring";

type NativeRateLimiter = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};

export type RateLimitResult = { allowed: boolean; retryAfter: number };

async function rateKey(request: Request, scope: string) {
  const ip = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  const salt = (env as unknown as { RATE_LIMIT_SALT?: string }).RATE_LIMIT_SALT ?? "katha-checkout-v1";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${scope}:${ip}`));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export async function applyRateLimit(request: Request, scope: string, limit: number, period = 60): Promise<RateLimitResult> {
  const key = await rateKey(request, scope);
  const now = Math.floor(Date.now() / 1000);
  const retryAfter = period - (now % period);
  const native = (env as unknown as { CHECKOUT_RATE_LIMITER?: NativeRateLimiter }).CHECKOUT_RATE_LIMITER;
  if (native) {
    const result = await native.limit({ key: `${scope}:${key}` });
    if (!result.success) logEvent("warn", "rate_limited", { scope, backend: "cloudflare" });
    return { allowed: result.success, retryAfter };
  }

  try {
    const windowStart = now - (now % period);
    const row = await getD1().prepare(
      `INSERT INTO checkout_rate_limits (rate_key, window_start, request_count, updated_at)
       VALUES (?, ?, 1, datetime('now'))
       ON CONFLICT(rate_key, window_start) DO UPDATE SET
         request_count = checkout_rate_limits.request_count + 1,
         updated_at = datetime('now')
       RETURNING request_count`,
    ).bind(`${scope}:${key}`, windowStart).first<{ request_count: number }>();
    if (key.endsWith("00")) {
      await getD1().prepare("DELETE FROM checkout_rate_limits WHERE window_start < ?")
        .bind(now - 86_400).run();
    }
    const allowed = (row?.request_count ?? limit + 1) <= limit;
    if (!allowed) logEvent("warn", "rate_limited", { scope, backend: "d1" });
    return { allowed, retryAfter };
  } catch (error) {
    logEvent("error", "rate_limit_failed_open", { scope, message: error instanceof Error ? error.message : "unknown" });
    return { allowed: true, retryAfter };
  }
}
