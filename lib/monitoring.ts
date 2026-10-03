type LogLevel = "info" | "warn" | "error";

export function logEvent(level: LogLevel, event: string, details: Record<string, unknown> = {}) {
  const entry = JSON.stringify({
    service: "katha-storefront",
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.log(entry);
}

export function requestId(request: Request) {
  return request.headers.get("cf-ray") ?? crypto.randomUUID();
}
