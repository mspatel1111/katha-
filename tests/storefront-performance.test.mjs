import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true,hmr:false } });
after(() => vite.close());

test("all original photos have smaller responsive derivatives", async () => {
  const sourceDirectory = path.join(root, "assets/originals");
  const outputDirectory = path.join(root, "public/images");
  const originals = (await readdir(sourceDirectory)).filter((name) => name.startsWith("katha-") && name.endsWith("-4k.jpg"));
  assert.equal(originals.length, 17);
  for (const name of originals) {
    const original = await stat(path.join(sourceDirectory, name));
    for (const width of [480, 800, 1200, 1600]) {
      const derivative = await stat(path.join(outputDirectory, name.replace("-4k.jpg", `-${width}w.jpg`)));
      assert.ok(derivative.size > 1000 && derivative.size < original.size);
      const webp = await stat(path.join(outputDirectory, name.replace("-4k.jpg", `-${width}w.webp`)));
      assert.ok(webp.size > 1000 && webp.size < derivative.size);
    }
  }
});

test("images use responsive sources, while external/admin images remain unchanged", async () => {
  const { ResponsiveImage } = await vite.ssrLoadModule("/app/responsive-image.tsx");
  const html = renderToStaticMarkup(React.createElement(ResponsiveImage, { src: "/images/katha-pink-saree-4k.jpg", alt: "Saree", loading: "eager" }));
  assert.match(html, /480w.webp 480w/);
  assert.match(html, /1600w.webp 1600w/);
  assert.doesNotMatch(html, /-4k.jpg/);
  const deferred = renderToStaticMarkup(React.createElement(ResponsiveImage, { src: "/images/katha-pink-saree-4k.jpg", alt: "Saree", loading: "lazy" }));
  assert.match(deferred, /src="\/images\/katha-pink-saree-480w.webp"/);
  assert.match(deferred, /loading="lazy"/);
  assert.match(deferred, /fetchPriority="low"/);
  assert.doesNotMatch(deferred, /<noscript>/);
  const uploaded = renderToStaticMarkup(React.createElement(ResponsiveImage, { src: "/api/images/upload.jpg", alt: "Upload", loading: "eager" }));
  assert.match(uploaded, /src="\/api\/images\/upload.jpg"/);
  assert.doesNotMatch(uploaded, /srcSet/);
  const optimizedUpload = renderToStaticMarkup(React.createElement(ResponsiveImage, {
    src: "/api/images/products/example-master.webp", alt: "Optimized upload", loading: "eager",
  }));
  assert.match(optimizedUpload, /example-480w.webp 480w/);
  assert.match(optimizedUpload, /example-1600w.webp 1600w/);
  assert.doesNotMatch(optimizedUpload, /master.webp/);
  const source = await readFile(path.join(root, "app/responsive-image.tsx"), "utf8");
  assert.doesNotMatch(source, /use client|IntersectionObserver|useEffect/);
});

test("search supports native submission and visible category links", async () => {
  const { StoreSearch } = await vite.ssrLoadModule("/app/store-search.tsx");
  const html = renderToStaticMarkup(React.createElement(StoreSearch));
  assert.match(html, /action="\/shop"/);
  assert.match(html, /name="q"/);
  assert.match(html, /type="search"/);
  assert.match(html, /category=Kurtis/);
  const { DEFAULT_PRODUCTS, matchesProductQuery } = await vite.ssrLoadModule("/lib/catalog.ts");
  assert.ok(matchesProductQuery(DEFAULT_PRODUCTS[2], " kurtis "));
  assert.ok(matchesProductQuery(DEFAULT_PRODUCTS[0], "blue co-ord"));
  assert.ok(matchesProductQuery(DEFAULT_PRODUCTS[0], ""));
  assert.equal(matchesProductQuery(DEFAULT_PRODUCTS[0], "black"), false);
});

test("home no longer embeds a map", async () => {
  const source = await readFile(path.join(root, "app/page.tsx"), "utf8");
  assert.doesNotMatch(source, /<iframe|output=embed/);
  assert.match(source, /settings.address/);
  assert.match(await readFile(path.join(root,"lib/store-config.ts"),"utf8"),/Shop Nos\. 09/);
  assert.doesNotMatch(source, /use client/);
  const header = await readFile(path.join(root, "app/home-header.tsx"), "utf8");
  assert.match(header, /lazy\(\(\) => import\("\.\/home-drawers"\)\)/);
});

test("high-traffic order identities do not collide", async () => {
  const { createOrderIdentity } = await vite.ssrLoadModule("/lib/order-utils.ts");
  const ids = new Set();
  const receipts = new Set();
  for (let index = 0; index < 100_000; index++) {
    const identity = createOrderIdentity(1_800_000_000_000);
    ids.add(identity.orderId);
    receipts.add(identity.receipt);
  }
  assert.equal(ids.size, 100_000);
  assert.equal(receipts.size, 100_000);
});

test("scale migration preserves old orders and blocks negative stock", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(":memory:");
  const migrations = ["0000_goofy_loa.sql", "0001_narrow_moondragon.sql", "0002_confused_rick_jones.sql", "0003_special_dust.sql"];
  const runMigration = async (name) => {
    const sql = await readFile(path.join(root, "drizzle", name), "utf8");
    for (const statement of sql.split("--> statement-breakpoint").map((part) => part.trim()).filter(Boolean)) db.exec(statement);
  };
  await runMigration(migrations[0]);
  await runMigration(migrations[1]);
  db.exec("INSERT INTO orders (id, receipt, customer_name, email, phone, address, city, state, pincode, amount, payment_method) VALUES ('KATOLD', 'old', 'Customer', 'a@b.com', '9999999999', 'Address 1', 'City', 'State', '123456', 100, 'cod')");
  await runMigration(migrations[2]);
  assert.equal(db.prepare("SELECT request_id FROM orders WHERE id = 'KATOLD'").get().request_id, null);
  assert.throws(() => db.exec("INSERT INTO product_overrides (id, name, price, image, stock_s) VALUES (1, 'Test', 100, '/images/test.jpg', -1)"), /CHECK constraint failed/);
  const plan = db.prepare("EXPLAIN QUERY PLAN SELECT * FROM order_items WHERE order_id = ?").all("KATOLD");
  assert.match(JSON.stringify(plan), /idx_order_items_order_id/);
  await runMigration(migrations[3]);
  assert.equal(db.prepare("SELECT phone_last10 FROM orders WHERE id = 'KATOLD'").get().phone_last10, "9999999999");
  assert.deepEqual(
    db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('admin_audit_log', 'checkout_rate_limits', 'payment_events') ORDER BY name").all().map((row) => row.name),
    ["admin_audit_log", "checkout_rate_limits", "payment_events"],
  );
  const gatewayPlan = db.prepare("EXPLAIN QUERY PLAN SELECT * FROM orders WHERE gateway_order_id = ?").all("cf_1");
  assert.match(JSON.stringify(gatewayPlan), /idx_orders_gateway_order_id/);
  db.close();
});

test("Cashfree webhook signatures use timestamp plus the exact raw body", async () => {
  const { verifyCashfreeSignature } = await vite.ssrLoadModule("/lib/cashfree-signature.ts");
  const secret = "test_cashfree_secret";
  const timestamp = "1790760000000";
  const rawBody = '{"type":"PAYMENT_SUCCESS_WEBHOOK","data":{"order":{"order_id":"KAT123"}}}';
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}${rawBody}`));
  const signature = Buffer.from(signatureBytes).toString("base64");
  assert.equal(await verifyCashfreeSignature(secret, signature, timestamp, rawBody), true);
  assert.equal(await verifyCashfreeSignature(secret, signature, timestamp, `${rawBody} `), false);
});

test("production worker includes edge caching and structured error monitoring", async () => {
  const worker = await readFile(path.join(root, "worker/index.ts"), "utf8");
  const edgeCache = await readFile(path.join(root, "lib/edge-cache.ts"), "utf8");
  assert.match(worker, /cacheable \? await readEdgeCache/);
  assert.match(worker, /writeEdgeCache/);
  assert.match(edgeCache, /cache\.match/);
  assert.match(edgeCache, /cache\.put/);
  assert.match(edgeCache, /catch/);
  assert.match(worker, /url\.pathname\.startsWith\("\/images\/"\)/);
  assert.match(worker, /request_failed/);
  assert.match(worker, /x-request-id/);
  const upload = await readFile(path.join(root, "app/api/admin/upload/route.ts"), "utf8");
  assert.match(upload, /image\/webp/);
  assert.match(upload, /\[480, 800, 1200, 1600\]/);
});
