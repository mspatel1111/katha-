import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: parts } = await params;
  const key = parts.join("/");
  if (!/^products\/[a-zA-Z0-9._-]+$/.test(key)) return new Response("Not found", { status: 404 });
  const bucket = (env as unknown as { BUCKET?: R2Bucket }).BUCKET;
  if (!bucket) return new Response("Storage unavailable", { status: 503 });
  const object = await bucket.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  if (request.headers.get("if-none-match") === object.httpEtag) {
    return new Response(null, { status: 304, headers: { etag: object.httpEtag, "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable" } });
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, s-maxage=31536000, immutable");
  return new Response(object.body, { headers });
}
