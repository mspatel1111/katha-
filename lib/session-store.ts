// Device-local retry state; storage restrictions must not stop checkout.
const memory = new Map<string, string | null>();
export function readSession(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try { return sessionStorage.getItem(key); } catch { return null; }
}
export function writeSession(key: string, value: string) {
  memory.set(key, value);
  try { sessionStorage.setItem(key, value); } catch { /* Keep retries stable in this tab. */ }
}
export function removeSession(key: string) {
  memory.set(key, null);
  try { sessionStorage.removeItem(key); } catch { /* A stale stored value is masked in memory. */ }
}
