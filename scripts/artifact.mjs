/* Turns the Vite build (dist/index.html, a full document) into the page body that claude.ai artifacts expect:
   the artifact publisher adds its own doctype, head and body, so the file starts with <title> and
   carries its links, styles, markup and scripts directly. Output: dist/artifact.html */
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("dist/index.html", "utf8");
let head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1].trim();

/* take the inlined scripts out first, so nothing inside them is mistaken for a tag */
const scripts = [...head.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].map(m => m[0]);
head = head.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
const pick = re => [...head.matchAll(re)].map(m => m[0]);

const page = [
  ...pick(/<title>[\s\S]*?<\/title>/g),
  ...pick(/<meta name="claude:[^>]*>/g),
  ...pick(/<link\b[^>]*>/g),
  ...pick(/<style\b[^>]*>[\s\S]*?<\/style>/g),
  body,
  ...scripts
].join("\n") + "\n";

writeFileSync("dist/artifact.html", page);
console.log(`dist/artifact.html: ${(page.length / 1024).toFixed(1)} KB`);
