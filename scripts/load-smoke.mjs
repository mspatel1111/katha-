const baseUrl = process.argv[2] ?? "http://localhost:5176";
const total = Number(process.argv[3] ?? 500);
const concurrency = Number(process.argv[4] ?? 25);
if (!Number.isInteger(total) || total < 1 || total > 100_000) throw new Error("total must be 1..100000");
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 500) throw new Error("concurrency must be 1..500");

const paths = (process.argv[5] ?? "/,/shop,/api/products,/track-order").split(",").filter((path) => path.startsWith("/"));
if (!paths.length) throw new Error("Provide at least one absolute URL path");
let next = 0;
let failures = 0;
const latencies = [];
async function worker() {
  while (true) {
    const id = next++;
    if (id >= total) return;
    const started = performance.now();
    try {
      const response = await fetch(`${baseUrl}${paths[id % paths.length]}`, { signal: AbortSignal.timeout(10_000) });
      await response.arrayBuffer();
      if (!response.ok) failures++;
    } catch { failures++; }
    latencies.push(performance.now() - started);
  }
}
await Promise.all(Array.from({ length: Math.min(total, concurrency) }, worker));
latencies.sort((a, b) => a - b);
const percentile = (p) => Math.round(latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))] ?? 0);
const result = { total, concurrency, failures, p50Ms: percentile(.5), p95Ms: percentile(.95), p99Ms: percentile(.99) };
console.log(JSON.stringify(result));
if (failures) process.exitCode = 1;
