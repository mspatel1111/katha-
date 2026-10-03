// Edge caching is optional: restricted hosting and cache failures must not break requests.
export async function readEdgeCache(request: Request): Promise<{ cache?: Cache; response?: Response }> {
  try {
    const cache = (caches as unknown as { default?: Cache }).default;
    if (!cache) return {};
    return { cache, response: await cache.match(request) };
  } catch {
    return {};
  }
}

export async function writeEdgeCache(cache: Cache, request: Request, response: Response) {
  try { await cache.put(request, response); }
  catch { /* Serving an authoritative response does not depend on cache availability. */ }
}
