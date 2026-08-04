import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { calculateCost } from "../ai-cost-calculator/calculator.js";
import { classifyLoop, controls } from "../agent-loop-diagnostic/diagnostic.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [html, css, js, labCss, toolsHtml, costHtml, loopHtml, sitemap, robots, llms, socialCard] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "app.js"), "utf8"),
  readFile(path.join(root, "lab.css"), "utf8"),
  readFile(path.join(root, "tools/index.html"), "utf8"),
  readFile(path.join(root, "ai-cost-calculator/index.html"), "utf8"),
  readFile(path.join(root, "agent-loop-diagnostic/index.html"), "utf8"),
  readFile(path.join(root, "sitemap.xml"), "utf8"),
  readFile(path.join(root, "robots.txt"), "utf8"),
  readFile(path.join(root, "llms.txt"), "utf8"),
  readFile(path.join(root, "social-card.png")),
]);

assert.match(html, /<title>AI Launch Evidence Scorecard \| ResearchAudio<\/title>/);
assert.match(html, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(html, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.equal((html.match(/type="checkbox"/g) || []).length, 7, "expected seven evidence checks");
assert.match(html, /utm_campaign=ai_launch_scorecard/);
assert.match(html, /rel="canonical"/);
assert.match(html, /application\/ld\+json/);
assert.match(html, /social-card\.png/);
assert.match(html, /ai-cost-calculator/);
assert.match(html, /agent-loop-diagnostic/);
assert.doesNotMatch(html, /TODO|PLACEHOLDER|example\.com/);

assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /focus-visible/);

assert.match(js, /const STORAGE_KEY/);
assert.match(js, /navigator\.share/);
assert.match(js, /utm_source", "scorecard_share"/);
assert.match(js, /min: 7,[\s\S]*title: "Evidence-complete"/);

for (const [name, page] of [
  ["scorecard", html],
  ["hub", toolsHtml],
  ["cost calculator", costHtml],
  ["loop diagnostic", loopHtml],
]) {
  assert.match(page, /https:\/\/researchaudio\.io\/subscribe\?utm_source=/, `${name} direct subscribe CTA missing`);
  assert.match(page, /utm_campaign=ai_evidence_lab/, `${name} acquisition campaign missing`);
  assert.match(page, /utm_content=(header_join|hero_join|result_join)/, `${name} CTA placement attribution missing`);
  assert.match(page, /52,000\+/, `${name} subscriber proof missing`);
}

for (const [name, page, title] of [
  ["hub", toolsHtml, "Free AI Evaluation Tools for Builders"],
  ["cost calculator", costHtml, "AI Cost per Successful Task Calculator"],
  ["loop diagnostic", loopHtml, "AI Agent Loop Diagnostic Checklist"],
]) {
  assert.match(page, new RegExp(`<title>${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\| ResearchAudio<\\/title>`), `${name} title missing`);
  assert.match(page, /rel="canonical"/, `${name} canonical missing`);
  assert.match(page, /application\/ld\+json/, `${name} structured data missing`);
  assert.match(page, /social-card\.png/, `${name} social image missing`);
  assert.match(page, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/, `${name} Beehiiv form missing`);
  assert.match(page, /subscribe-forms\.beehiiv\.com\/attribution\.js/, `${name} attribution missing`);
  assert.doesNotMatch(page, /TODO|PLACEHOLDER|example\.com/, `${name} contains placeholder copy`);
}

assert.match(labCss, /@media \(max-width: 620px\)/);
assert.match(labCss, /prefers-reduced-motion/);
assert.match(labCss, /focus-visible/);
assert.match(labCss, /\.result-join/);
assert.match(css, /\.result-join/);
assert.equal((loopHtml.match(/type="checkbox"/g) || []).length, 10, "expected ten loop controls");
assert.equal(controls.length, 10, "diagnostic logic and markup should share ten controls");

const certain = calculateCost({ modelCost: 1, successRate: 100, maxAttempts: 4, reviewMinutes: 0, hourlyCost: 0 });
assert.equal(certain.costPerSuccess, 1, "certain success should cost one attempt");
const retry = calculateCost({ modelCost: 1, successRate: 50, maxAttempts: 2, reviewMinutes: 0, hourlyCost: 0 });
assert.equal(retry.expectedAttempts, 1.5);
assert.equal(retry.eventualSuccess, 0.75);
assert.equal(retry.costPerSuccess, 2);
assert.equal(classifyLoop(0).status, "BLIND");
assert.equal(classifyLoop(7).status, "EXPOSED");
assert.equal(classifyLoop(10).status, "CONTROLLED");

assert.equal((sitemap.match(/<url>/g) || []).length, 4, "sitemap should contain all four crawlable pages");
assert.match(robots, /Sitemap: https:\/\/deepmehta11\.github\.io\/researchaudio-scorecard\/sitemap\.xml/);
assert.match(llms, /AI Cost per Successful Task Calculator/);
assert.match(llms, /AI Agent Loop Diagnostic/);
assert.deepEqual([...socialCard.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "social card should be a PNG");

console.log("Evidence Lab verified: 3 tools, 4 crawlable pages, direct attributed subscribe CTAs, calculation logic, accessibility, and responsive CSS are present.");
