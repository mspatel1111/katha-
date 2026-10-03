/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { readEdgeCache, writeEdgeCache } from "../lib/edge-cache";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startedAt = Date.now();
    const requestId = request.headers.get("cf-ray") ?? crypto.randomUUID();
    const url = new URL(request.url);
    try {
      const isStaticImage = url.pathname.startsWith("/images/")
        || /^\/katha-logo(?:-transparent)?\.(?:webp|png)$/i.test(url.pathname);
      const cacheable = request.method === "GET"
        && ((url.pathname === "/api/products"&&!url.searchParams.has("ids")&&request.headers.get("cache-control")!=="no-cache") || url.pathname.startsWith("/api/images/") || isStaticImage);
      const { cache, response: cached } = cacheable ? await readEdgeCache(request) : {};
      const response = cached ?? (url.pathname === "/_vinext/image"
        ? await handleImageOptimization(request, {
          fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
          transformImage: async (body, { width, format, quality }) => {
            const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
            return result.response();
          },
        }, [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES])
        : await handler.fetch(request, env, ctx));
      const durationMs = Date.now() - startedAt;
      if (response.status >= 500 || durationMs >= 2_000) {
        console.warn(JSON.stringify({ service: "katha-storefront", event: "request_completed", requestId, path: url.pathname, method: request.method, status: response.status, durationMs }));
      }
      const headers = new Headers(response.headers);
      headers.set("x-request-id", requestId);
      if (cacheable) headers.set("x-katha-cache", cached ? "HIT" : cache ? "MISS" : "BYPASS");
      if (isStaticImage && response.ok) {
        headers.set("cache-control", "public, max-age=604800, s-maxage=31536000, stale-while-revalidate=86400");
      }
      headers.append("server-timing", `app;dur=${durationMs}`);
      const finalResponse=new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      if(cache&&!cached&&response.ok)ctx.waitUntil(writeEdgeCache(cache,request,finalResponse.clone()));
      return finalResponse;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      console.error(JSON.stringify({ service: "katha-storefront", event: "request_failed", requestId, path: url.pathname, method: request.method, durationMs, message: error instanceof Error ? error.message : "unknown" }));
      throw error;
    }
  },
};

export default worker;
