import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { calculateCost } from "../ai-cost-calculator/calculator.js";
import { classifyLoop, controls } from "../agent-loop-diagnostic/diagnostic.js";
import { calculateAgentRoi, classifyAgentRoi } from "../ai-agent-roi-calculator/calculator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexNowKey = "b5f8e5d9ef605861f4432c4b66a2d884";
const [html, css, js, labCss, toolsHtml, costHtml, loopHtml, roiHtml, roiJs, starterHtml, starterJs, sitemap, robots, llms, socialCard, publishedKey, indexNowScript, indexNowWorkflow] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "app.js"), "utf8"),
  readFile(path.join(root, "lab.css"), "utf8"),
  readFile(path.join(root, "tools/index.html"), "utf8"),
  readFile(path.join(root, "ai-cost-calculator/index.html"), "utf8"),
  readFile(path.join(root, "agent-loop-diagnostic/index.html"), "utf8"),
  readFile(path.join(root, "ai-agent-roi-calculator/index.html"), "utf8"),
  readFile(path.join(root, "ai-agent-roi-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "evidence-starter-kit/index.html"), "utf8"),
  readFile(path.join(root, "evidence-starter-kit/starter.js"), "utf8"),
  readFile(path.join(root, "sitemap.xml"), "utf8"),
  readFile(path.join(root, "robots.txt"), "utf8"),
  readFile(path.join(root, "llms.txt"), "utf8"),
  readFile(path.join(root, "social-card.png")),
  readFile(path.join(root, `${indexNowKey}.txt`), "utf8"),
  readFile(path.join(root, "scripts/submit-indexnow.mjs"), "utf8"),
  readFile(path.join(root, ".github/workflows/indexnow.yml"), "utf8"),
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
  ["agent ROI calculator", roiHtml],
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
  ["agent ROI calculator", roiHtml, "AI Agent ROI Calculator with Failure & Review"],
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

const defaultRoi = calculateAgentRoi({
  tasksPerMonth: 2000,
  minutesPerTask: 8,
  hourlyCost: 65,
  automationCoverage: 60,
  successRate: 85,
  reviewMinutes: 1.5,
  runCost: 0.12,
  recurringCost: 1500,
  implementationCost: 25000,
});
assert.equal(defaultRoi.successfulTasks, 1020);
assert.ok(Math.abs(defaultRoi.monthlySavings - 5246) < 0.01);
assert.ok(Math.abs(defaultRoi.paybackMonths - (25000 / 5246)) < 0.0001);
assert.equal(classifyAgentRoi(defaultRoi).status, "PILOT");
const holdRoi = calculateAgentRoi({
  tasksPerMonth: 100,
  minutesPerTask: 1,
  hourlyCost: 20,
  automationCoverage: 50,
  successRate: 50,
  reviewMinutes: 5,
  runCost: 2,
  recurringCost: 1000,
  implementationCost: 10000,
});
assert.equal(classifyAgentRoi(holdRoi).status, "HOLD");
assert.match(roiJs, /utm_source", "agent_roi_share"/);
assert.match(roiJs, /utm_campaign", "ai_evidence_lab"/);

assert.match(starterHtml, /<title>AI Evidence Starter Kit: 4 Free Evaluation Tools \| ResearchAudio<\/title>/);
assert.match(starterHtml, /rel="canonical"/);
assert.match(starterHtml, /application\/ld\+json/);
assert.match(starterHtml, /social-card\.png/);
assert.match(starterHtml, /52,000\+/);
assert.match(starterHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=evidence_starter_kit/);
assert.equal((starterHtml.match(/data-step=/g) || []).length, 4, "starter kit should contain four progress steps");
assert.match(starterHtml, /Three confirmed referrals unlock the AI Launch Evidence Checklist PDF automatically/);
assert.match(starterJs, /researchaudio_evidence_starter_progress_v1/);
assert.match(starterJs, /utm_source", "evidence_starter_share"/);
assert.match(starterJs, /utm_medium", "referral"/);
assert.match(starterJs, /utm_campaign", "ai_evidence_lab"/);
assert.match(starterJs, /utm_medium"\) === "onboarding"/);
assert.doesNotMatch(starterHtml, /TODO|PLACEHOLDER|example\.com/);

assert.equal((sitemap.match(/<url>/g) || []).length, 6, "sitemap should contain all six crawlable pages");
assert.match(robots, /Sitemap: https:\/\/deepmehta11\.github\.io\/researchaudio-scorecard\/sitemap\.xml/);
assert.match(llms, /AI Cost per Successful Task Calculator/);
assert.match(llms, /AI Agent Loop Diagnostic/);
assert.match(llms, /AI Agent ROI Calculator/);
assert.match(llms, /AI Evidence Starter Kit/);
assert.deepEqual([...socialCard.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], "social card should be a PNG");
assert.equal(publishedKey.trim(), indexNowKey, "public IndexNow key must match the submission script");
assert.match(indexNowScript, /https:\/\/api\.indexnow\.org\/indexnow/);
assert.match(indexNowScript, /keyLocation/);
assert.match(indexNowScript, /--check/);
assert.match(indexNowWorkflow, /node scripts\/verify-site\.mjs/);
assert.match(indexNowWorkflow, /node scripts\/submit-indexnow\.mjs/);
assert.match(indexNowWorkflow, /Wait for this exact Pages deployment/);
assert.match(indexNowWorkflow, /head_sha=\$\{GITHUB_SHA\}/);
assert.match(indexNowWorkflow, /pages build and deployment/);
assert.match(indexNowWorkflow, /Wait for the ownership key to be public/);

console.log("Evidence Lab verified: 4 tools, 1 activation kit, 6 crawlable pages, attributed subscribe and share CTAs, calculation logic, accessibility, responsive CSS, and IndexNow deployment are present.");
