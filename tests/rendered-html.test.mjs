import assert from "node:assert/strict";
import test from "node:test";
import {createRuntime} from "./runtime.mjs";
test("renders production storefront HTML and metadata in the Cloudflare runtime", async () => {
  const {runtime}=await createRuntime();
  try {
    const response = await runtime.dispatchFetch("http://localhost/", { headers: { accept: "text/html" } });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    const html = await response.text();
    assert.match(html, /<title>KATHA Ethnic Wear/);
    assert.match(html, /name="description"/);
    assert.match(html, /ethnic perfection/);
    assert.match(html, /fetchPriority="high"/);
    assert.match(html, /katha-pink-saree-480w.webp/);
    assert.doesNotMatch(html, /<img[^>]+src="[^"]+-4k.jpg"/);
  } finally { await runtime.dispose(); }
});
