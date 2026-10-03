import { readdir, readFile, writeFile } from "node:fs/promises";
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = dir + "/" + entry.name;
    if (entry.isDirectory()) { await walk(file); continue; }
    if (!file.endsWith(".tsx")) continue;
    const original = await readFile(file, "utf8");
    let changed = false;
    let source = original.replace(/<a\b([^>]*?)>([\s\S]*?)<\/a>/g, (full, attributes, content) => {
      if (!/href=(?:["'](?:\/|#)|\{\x60\/)/.test(attributes)) return full;
      if (/signIn|signOut|signin|signout/.test(attributes)) return full;
      changed = true;
      return "<Link" + attributes + ">" + content + "</Link>";
    }).replaceAll("ethic perfection", "ethnic perfection").replaceAll("Shipping worldwide", "Delivery across India");
    if (changed && !source.includes('from "next/link"')) {
      source = source.replace(/^(["']use client["'];\s*)?/, '$&import Link from "next/link";\n');
    }
    if (source !== original) await writeFile(file, source);
  }
}
await walk("app");
