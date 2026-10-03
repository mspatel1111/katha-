function decodeBase64(value: string) {
  try {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

export async function verifyCashfreeSignature(secret: string, signature: string, timestamp: string, rawBody: string) {
  const signatureBytes = decodeBase64(signature);
  if (!signatureBytes || !/^\d{10,16}$/.test(timestamp)) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(`${timestamp}${rawBody}`),
  );
}
