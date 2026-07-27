import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manualPath = resolve(projectRoot, "S09_manual_ru.html");
const html = await readFile(manualPath, "utf8");

const requiredMarkers = [
  "https://telegram.org/js/telegram-web-app.js",
  "telegram.ready()",
  "telegram.expand()",
  'id="search"',
  'class="manual"'
];

for (const marker of requiredMarkers) {
  if (!html.includes(marker)) {
    throw new Error(`Missing required marker: ${marker}`);
  }
}

const imageSources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map((match) => match[1]);
const missingImages = [];

for (const source of new Set(imageSources)) {
  if (/^(?:https?:|data:)/i.test(source)) continue;
  try {
    await access(resolve(projectRoot, source));
  } catch {
    missingImages.push(source);
  }
}

const chapterCount = (html.match(/<article class="chapter"/g) ?? []).length;

if (chapterCount === 0) {
  throw new Error("No manual chapters found");
}

if (missingImages.length > 0) {
  throw new Error(`Missing images:\n${missingImages.join("\n")}`);
}

console.log(`Manual check passed: ${chapterCount} chapters, ${imageSources.length} image references.`);
