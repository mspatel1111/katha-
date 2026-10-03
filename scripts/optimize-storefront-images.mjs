import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const sourceDirectory = path.resolve("assets/originals");
const outputDirectory = path.resolve("public/images");
await sharp(path.resolve("public/katha-logo-transparent.png")).resize({ width: 450, withoutEnlargement: true }).webp({ quality: 85 }).toFile(path.resolve("public/katha-logo.webp"));
const originals = (await readdir(sourceDirectory)).filter((name) => name.startsWith("katha-") && name.endsWith("-4k.jpg"));
let originalBytes = 0;
let mobileBytes = 0;
for (const name of originals) {
  const input = path.join(sourceDirectory, name);
  originalBytes += (await stat(input)).size;
  for (const width of [480, 800, 1200, 1600]) {
    const output = path.join(outputDirectory, name.replace("-4k.jpg", `-${width}w.webp`));
    await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 74, effort: 4 }).toFile(output);
    if (width === 800) mobileBytes += (await stat(output)).size;
  }
}
console.log(JSON.stringify({ images: originals.length, originalBytes, mobileBytes, reductionPercent: Math.round(100 * (1 - mobileBytes / originalBytes)) }));
