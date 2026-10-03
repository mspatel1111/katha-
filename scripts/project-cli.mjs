import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const [task, ...extra] = process.argv.slice(2);
// Retain the bounded/locked Sites install and build on its managed Linux host.
const managedLinux = process.platform === "linux" && process.env.SITES_MANAGED_LINUX_CONTAINER === "1";
const env = { ...process.env, WRANGLER_WRITE_LOGS: "false", WRANGLER_LOG_PATH: path.join(root, ".wrangler/logs") };

function run(command, args, timeout) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env, stdio: "inherit", ...(timeout ? { timeout } : {}) });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) console.error(`Task ${task} stopped (${signal}).`);
      resolve(code ?? 1);
    });
  });
}
function node(relative, args = [], timeout) {
  return run(process.execPath, [path.join(root, relative), ...args, ...extra], timeout);
}

let code;
switch (task) {
  case "install":
    if (managedLinux) code = await run("bash", ["scripts/install-ci.sh", ...extra]);
    else if (process.env.npm_execpath) code = await run(process.execPath, [process.env.npm_execpath, "ci", ...extra]);
    else throw new Error("Run this command using npm run install:ci (or use npm ci directly).");
    break;
  case "dev":
    code = await node("node_modules/vite/bin/vite.js", ["--host", "127.0.0.1"]);
    break;
  case "build":
    code = managedLinux
      ? await run("bash", ["scripts/build-verified.sh", ...extra])
      : await node("node_modules/vinext/dist/cli.js", ["build"], 180_000);
    break;
  case "preview":
    // Use Cloudflare's local Worker runtime, not a Node-only production server.
    code = await node("node_modules/vite/bin/vite.js", ["preview", "--host", "127.0.0.1"]);
    break;
  case "lint":
    code = await node("node_modules/eslint/bin/eslint.js", [".", "--ignore-pattern", "dist", "--ignore-pattern", ".next"]);
    break;
  case "test": {
    const tests = (await readdir(path.join(root, "tests"))).filter(name => name.endsWith(".test.mjs")).sort();
    code = await run(process.execPath, ["--test", "--test-concurrency=1", ...extra, ...tests.map(name => path.join(root, "tests", name))]);
    break;
  }
  case "db-local":
    if (extra.length) throw new Error("db:local accepts no flags; remote database access is intentionally disabled.");
    code = await node("node_modules/wrangler/bin/wrangler.js", ["d1", "migrations", "apply", "DB", "--local", "--config", "wrangler.local.jsonc"]);
    break;
  case "db-generate":
    code = await node("scripts/drizzle-portable.cjs", ["generate"]);
    break;
  default:
    throw new Error(`Unknown project task: ${task}`);
}
process.exitCode = code;
