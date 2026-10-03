import { env } from "cloudflare:workers";
import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { getD1 } from "@/lib/catalog-db";
import { logEvent } from "@/lib/monitoring";

const FALLBACK_ADMIN_EMAIL = "yashpatel9724945@gmail.com";

export function isAdminEmail(email: string) {
  const configured = (env as unknown as { ADMIN_EMAIL?: string }).ADMIN_EMAIL ?? FALLBACK_ADMIN_EMAIL;
  return email.toLowerCase() === configured.toLowerCase();
}

export async function getAdmin(request?: Request): Promise<ChatGPTUser | null> {
  const user = await getChatGPTUser();
  if (!user || !isAdminEmail(user.email)) return null;

  if (request && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      logEvent("warn", "admin_origin_rejected", { origin, method: request.method });
      return null;
    }
  }
  return user;
}

export async function auditAdmin(actor: ChatGPTUser, action: string, target?: string) {
  try {
    await getD1().prepare(
      "INSERT INTO admin_audit_log (actor_email, action, target, created_at) VALUES (?, ?, ?, datetime('now'))",
    ).bind(actor.email.toLowerCase(), action.slice(0, 80), target?.slice(0, 160) ?? null).run();
  } catch (error) {
    logEvent("error", "admin_audit_failed", { action, message: error instanceof Error ? error.message : "unknown" });
  }
}
