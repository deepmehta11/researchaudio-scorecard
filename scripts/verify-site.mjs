import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [html, css, js] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "app.js"), "utf8"),
]);

assert.match(html, /<title>AI Launch Evidence Scorecard \| ResearchAudio<\/title>/);
assert.match(html, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(html, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.equal((html.match(/type="checkbox"/g) || []).length, 7, "expected seven evidence checks");
assert.match(html, /utm_campaign=ai_launch_scorecard/);
assert.doesNotMatch(html, /TODO|PLACEHOLDER|example\.com/);

assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /focus-visible/);

assert.match(js, /const STORAGE_KEY/);
assert.match(js, /navigator\.share/);
assert.match(js, /utm_source", "scorecard_share"/);
assert.match(js, /min: 7,[\s\S]*title: "Evidence-complete"/);

console.log("Scorecard package verified: metadata, 7 checks, attribution, sharing, accessibility, and responsive CSS are present.");
