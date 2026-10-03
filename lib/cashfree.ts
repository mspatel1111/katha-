import { env } from "cloudflare:workers";
import { verifyCashfreeSignature } from "@/lib/cashfree-signature";

const DEFAULT_API_VERSION = "2025-01-01";

type CashfreeRuntime = {
  CASHFREE_APP_ID?: string;
  CASHFREE_SECRET_KEY?: string;
  CASHFREE_ENV?: "sandbox" | "production";
  CASHFREE_API_VERSION?: string;
  CASHFREE_CHECKOUT_ENABLED?: string;
};

// Keys alone do not activate customer payments. Enable only after production verification.
export function onlineCheckoutEnabled() {
  return (env as unknown as CashfreeRuntime).CASHFREE_CHECKOUT_ENABLED === "true" && cashfreeConfig() !== null;
}

export function cashfreeConfig() {
  const runtime = env as unknown as CashfreeRuntime;
  if (!runtime.CASHFREE_APP_ID || !runtime.CASHFREE_SECRET_KEY) return null;
  const mode:"sandbox"|"production" = runtime.CASHFREE_ENV === "production" ? "production" : "sandbox";
  return {
    appId: runtime.CASHFREE_APP_ID,
    secret: runtime.CASHFREE_SECRET_KEY,
    mode,
    apiVersion: runtime.CASHFREE_API_VERSION ?? DEFAULT_API_VERSION,
    baseUrl: mode === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com",
  };
}

export async function cashfreeFetch(path: string, init: RequestInit = {}) {
  const config = cashfreeConfig();
  if (!config) throw new Error("Cashfree is not configured.");
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");
  headers.set("x-api-version", config.apiVersion);
  headers.set("x-client-id", config.appId);
  headers.set("x-client-secret", config.secret);
  return fetch(`${config.baseUrl}${path}`, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(8_000) });
}

export async function verifyCashfreeWebhook(signature: string, timestamp: string, rawBody: string) {
  const config = cashfreeConfig();
  return config ? verifyCashfreeSignature(config.secret, signature, timestamp, rawBody) : false;
}

export { verifyCashfreeSignature };

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
