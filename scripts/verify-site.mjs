import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { calculateCost } from "../ai-cost-calculator/calculator.js";
import { classifyLoop, controls } from "../agent-loop-diagnostic/diagnostic.js";
import { calculateAgentRoi, classifyAgentRoi } from "../ai-agent-roi-calculator/calculator.js";
import { calculateLlmApiCost } from "../llm-api-cost-calculator/calculator.js";
import { calculatePromptCacheSavings } from "../prompt-caching-calculator/calculator.js";
import { buildCodexConfig, normalizeFallbackFiles, normalizeMaxBytes } from "../codex-config-generator/generator.js";
import { buildAttributedShareUrl, parseSharedChecklist, parseSharedNumbers } from "../share-state.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexNowKey = "b5f8e5d9ef605861f4432c4b66a2d884";
const brandedToolsOrigin = "https://tools.researchaudio.io";
const retiredGitHubPagesPath = /deepmehta11\.github\.io\/researchaudio-scorecard/;
const parseStructuredData = (page) => [...page.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)].map((match) => JSON.parse(match[1]));
const [html, css, js, labCss, toolsHtml, costHtml, loopHtml, roiHtml, roiJs, llmCostHtml, llmCostJs, promptCacheHtml, promptCacheJs, codexConfigHtml, codexConfigJs, starterHtml, starterJs, sitemap, robots, llms, socialCard, publishedKey, indexNowScript, indexNowWorkflow] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "app.js"), "utf8"),
  readFile(path.join(root, "lab.css"), "utf8"),
  readFile(path.join(root, "tools/index.html"), "utf8"),
  readFile(path.join(root, "ai-cost-calculator/index.html"), "utf8"),
  readFile(path.join(root, "agent-loop-diagnostic/index.html"), "utf8"),
  readFile(path.join(root, "ai-agent-roi-calculator/index.html"), "utf8"),
  readFile(path.join(root, "ai-agent-roi-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "llm-api-cost-calculator/index.html"), "utf8"),
  readFile(path.join(root, "llm-api-cost-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "prompt-caching-calculator/index.html"), "utf8"),
  readFile(path.join(root, "prompt-caching-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "codex-config-generator/index.html"), "utf8"),
  readFile(path.join(root, "codex-config-generator/generator.js"), "utf8"),
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
assert.match(html, /prompt-caching-calculator/);
assert.match(html, /codex-config-generator/);
assert.doesNotMatch(html, /TODO|PLACEHOLDER|example\.com/);

assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /focus-visible/);

assert.match(js, /const STORAGE_KEY/);
assert.match(js, /navigator\.share/);
assert.match(js, /source: "scorecard_share"/);
assert.match(js, /content: `shared_score_\$\{score\}`/);
assert.match(js, /min: 7,[\s\S]*title: "Evidence-complete"/);

for (const [name, page, pathname] of [
  ["scorecard", html, "/"],
  ["hub", toolsHtml, "/tools/"],
  ["cost calculator", costHtml, "/ai-cost-calculator/"],
  ["loop diagnostic", loopHtml, "/agent-loop-diagnostic/"],
  ["agent ROI calculator", roiHtml, "/ai-agent-roi-calculator/"],
  ["LLM API cost calculator", llmCostHtml, "/llm-api-cost-calculator/"],
  ["prompt caching calculator", promptCacheHtml, "/prompt-caching-calculator/"],
  ["Codex config generator", codexConfigHtml, "/codex-config-generator/"],
  ["starter kit", starterHtml, "/evidence-starter-kit/"],
]) {
  const canonical = page.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, `${name} canonical missing`);
  assert.equal(canonical[1], `${brandedToolsOrigin}${pathname}`, `${name} canonical should use the ResearchAudio tools domain`);
  assert.doesNotMatch(page, retiredGitHubPagesPath, `${name} still exposes the retired GitHub Pages path`);
}

for (const [name, page] of [
  ["scorecard", html],
  ["hub", toolsHtml],
  ["cost calculator", costHtml],
  ["loop diagnostic", loopHtml],
  ["agent ROI calculator", roiHtml],
  ["LLM API cost calculator", llmCostHtml],
  ["prompt caching calculator", promptCacheHtml],
  ["Codex config generator", codexConfigHtml],
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
  ["LLM API cost calculator", llmCostHtml, "LLM API Cost Calculator (Input &amp; Output Tokens)"],
  ["prompt caching calculator", promptCacheHtml, "Prompt Caching Cost Calculator &amp; Break-Even Hit Rate"],
  ["Codex config generator", codexConfigHtml, "Codex CLI config.toml Generator"],
]) {
  assert.match(page, new RegExp(`<title>${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\| ResearchAudio<\\/title>`), `${name} title missing`);
  assert.match(page, /rel="canonical"/, `${name} canonical missing`);
  assert.match(page, /application\/ld\+json/, `${name} structured data missing`);
  assert.match(page, /social-card\.png/, `${name} social image missing`);
  assert.match(page, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/, `${name} Beehiiv form missing`);
  assert.match(page, /subscribe-forms\.beehiiv\.com\/attribution\.js/, `${name} attribution missing`);
  assert.doesNotMatch(page, /TODO|PLACEHOLDER|example\.com/, `${name} contains placeholder copy`);
}

for (const [name, page, questions] of [
  ["cost calculator", costHtml, [
    "How do you calculate AI cost per successful task?",
    "How do retries affect AI cost?",
    "Should human review be included in AI workflow cost?",
  ]],
  ["loop diagnostic", loopHtml, [
    "What is an AI agent loop?",
    "How do you stop an AI agent loop?",
    "What should be logged in an AI agent loop?",
  ]],
  ["agent ROI calculator", roiHtml, [
    "How do you calculate AI agent ROI?",
    "What costs belong in an AI agent ROI model?",
    "What is a reasonable AI agent payback period?",
  ]],
  ["LLM API cost calculator", llmCostHtml, [
    "How do you calculate LLM API cost?",
    "Why are input and output tokens priced separately?",
    "How does prompt caching affect LLM cost?",
    "How do retries affect token cost?",
  ]],
  ["prompt caching calculator", promptCacheHtml, [
    "How do you calculate prompt caching savings?",
    "What is a good prompt cache hit rate?",
    "When can prompt caching cost more?",
    "Which input tokens belong in a cache calculation?",
  ]],
  ["Codex config generator", codexConfigHtml, [
    "What does project_doc_fallback_filenames do?",
    "What does project_doc_max_bytes do?",
    "Does a fallback file replace AGENTS.md?",
    "Where should Codex config.toml go?",
  ]],
]) {
  assert.doesNotThrow(() => parseStructuredData(page), `${name} structured data must be valid JSON`);
  assert.equal((page.match(/"@type": "FAQPage"/g) || []).length, 1, `${name} should have one FAQPage schema`);
  assert.match(page, /utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab&amp;utm_content=guide_link/, `${name} evidence guide attribution missing`);
  for (const question of questions) {
    const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(page, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `${name} visible FAQ question missing: ${question}`);
    assert.match(page, new RegExp(`"name": "${escapedQuestion}"`), `${name} FAQ schema question missing: ${question}`);
  }
}

assert.match(roiHtml, /href="https:\/\/researchaudio\.io\/p\/ai-agent-roi-calculator-guide\?utm_source=ai_agent_roi&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab&amp;utm_content=guide_link"/, "agent ROI calculator should link to its dedicated guide");
assert.match(costHtml, /href="https:\/\/researchaudio\.io\/p\/ai-cost-per-successful-task-guide\?utm_source=ai_cost_calculator&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab&amp;utm_content=guide_link"/, "cost calculator should link to its dedicated guide");

assert.match(labCss, /@media \(max-width: 620px\)/);
assert.match(labCss, /prefers-reduced-motion/);
assert.match(labCss, /focus-visible/);
assert.match(labCss, /\.result-join/);
assert.match(labCss, /\.guide-section/);
assert.match(labCss, /\.faq-item/);
assert.match(labCss, /\.config-output/);
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
assert.match(roiJs, /source: "agent_roi_share"/);
assert.match(roiJs, /content: "shared_roi_result"/);

const defaultLlmCost = calculateLlmApiCost({
  requestsPerMonth: 100000,
  inputTokens: 1200,
  outputTokens: 300,
  inputPricePerMillion: 1,
  outputPricePerMillion: 5,
  cacheHitRate: 30,
  cacheDiscount: 75,
  retryOverhead: 8,
  otherCostPerRequest: 0,
});
assert.ok(Math.abs(defaultLlmCost.totalTokens - 162000000) < 0.001);
assert.ok(Math.abs(defaultLlmCost.inputSpend - 100.44) < 0.0001);
assert.ok(Math.abs(defaultLlmCost.outputSpend - 162) < 0.0001);
assert.ok(Math.abs(defaultLlmCost.retrySpend - 19.44) < 0.0001);
assert.ok(Math.abs(defaultLlmCost.cacheSavings - 29.16) < 0.0001);
assert.ok(Math.abs(defaultLlmCost.totalCost - 262.44) < 0.0001);
assert.ok(Math.abs(defaultLlmCost.costPerRequest - 0.0026244) < 0.0000001);
const emptyLlmCost = calculateLlmApiCost({
  requestsPerMonth: -10,
  inputTokens: 1000,
  outputTokens: 100,
  inputPricePerMillion: 1,
  outputPricePerMillion: 1,
  cacheHitRate: 200,
  cacheDiscount: 200,
  retryOverhead: -5,
  otherCostPerRequest: -1,
});
assert.equal(emptyLlmCost.totalCost, 0);
assert.equal(emptyLlmCost.costPerRequest, 0);
const retryHeavyLlmCost = calculateLlmApiCost({
  requestsPerMonth: 100,
  inputTokens: 1000,
  outputTokens: 0,
  inputPricePerMillion: 10,
  outputPricePerMillion: 0,
  cacheHitRate: 0,
  cacheDiscount: 0,
  retryOverhead: 200,
  otherCostPerRequest: 0,
});
assert.equal(retryHeavyLlmCost.retryMultiplier, 3);
assert.equal(retryHeavyLlmCost.totalCost, 3);
assert.match(llmCostJs, /source: "llm_cost_share"/);
assert.match(llmCostJs, /content: "shared_llm_cost_result"/);
assert.match(llmCostHtml, /prompt-caching-calculator/);

const defaultPromptCache = calculatePromptCacheSavings({
  requestsPerMonth: 100000,
  reusableInputTokens: 8000,
  uncachedPricePerMillion: 3,
  cacheReadPricePerMillion: 0.3,
  cacheWritePricePerMillion: 3.75,
  cacheHitRate: 80,
});
assert.equal(defaultPromptCache.uncachedCost, 2400);
assert.ok(Math.abs(defaultPromptCache.cacheReadCost - 192) < 0.0001);
assert.ok(Math.abs(defaultPromptCache.cacheWriteCost - 600) < 0.0001);
assert.ok(Math.abs(defaultPromptCache.cachedCost - 792) < 0.0001);
assert.ok(Math.abs(defaultPromptCache.savings - 1608) < 0.0001);
assert.ok(Math.abs(defaultPromptCache.savingsRate - 0.67) < 0.0001);
assert.ok(Math.abs(defaultPromptCache.breakEvenHitRate - 0.2173913043) < 0.0000001);
assert.ok(Math.abs(defaultPromptCache.costPerRequest - 0.00792) < 0.0000001);
const allMissPromptCache = calculatePromptCacheSavings({
  requestsPerMonth: 100,
  reusableInputTokens: 1000,
  uncachedPricePerMillion: 3,
  cacheReadPricePerMillion: 0.3,
  cacheWritePricePerMillion: 3.75,
  cacheHitRate: 0,
});
assert.ok(Math.abs(allMissPromptCache.uncachedCost - 0.3) < 0.0001);
assert.ok(Math.abs(allMissPromptCache.cachedCost - 0.375) < 0.0001);
assert.ok(Math.abs(allMissPromptCache.savings - (-0.075)) < 0.0001);
const unreachablePromptCache = calculatePromptCacheSavings({
  requestsPerMonth: 100,
  reusableInputTokens: 1000,
  uncachedPricePerMillion: 3,
  cacheReadPricePerMillion: 4,
  cacheWritePricePerMillion: 5,
  cacheHitRate: 100,
});
assert.equal(unreachablePromptCache.breakEvenHitRate, null);
assert.match(promptCacheJs, /source: "prompt_cache_share"/);
assert.match(promptCacheJs, /content: "shared_prompt_cache_result"/);

assert.deepEqual(
  normalizeFallbackFiles([" TEAM_GUIDE.md ", "CLAUDE.md", "team_guide.md", "../escape.md", "ONCALL.md, .agents.md"]),
  ["TEAM_GUIDE.md", "CLAUDE.md", "ONCALL.md", ".agents.md"],
  "Codex fallback filenames should be trimmed, filename-safe, and deduplicated case-insensitively",
);
assert.deepEqual(normalizeFallbackFiles("ONCALL.md, CLAUDE.md"), ["ONCALL.md", "CLAUDE.md"]);
assert.equal(normalizeMaxBytes(0), 32768);
assert.equal(normalizeMaxBytes(64), 1024);
assert.equal(normalizeMaxBytes(2000000), 1048576);
assert.equal(
  buildCodexConfig({ fallbackFiles: ["TEAM_GUIDE.md", "CLAUDE.md"], maxBytes: 65536 }),
  'project_doc_fallback_filenames = ["TEAM_GUIDE.md", "CLAUDE.md"]\nproject_doc_max_bytes = 65536',
);
assert.match(codexConfigJs, /utm_source", "codex_config_share"/);
assert.match(codexConfigJs, /utm_campaign", "ai_evidence_lab"/);
assert.match(codexConfigHtml, /AGENTS\.override\.md/);

assert.match(starterHtml, /<title>AI Evidence Starter Kit: 4 Free Evaluation Tools \| ResearchAudio<\/title>/);
assert.match(starterHtml, /rel="canonical"/);

const sharedCostUrl = buildAttributedShareUrl(
  "https://tools.researchaudio.io/ai-cost-calculator/?utm_source=old#result",
  { modelCost: "0.42", successRate: "81", maxAttempts: "4" },
  { source: "cost_calculator_share", content: "shared_cost_result" },
);
assert.equal(sharedCostUrl.searchParams.get("modelCost"), "0.42");
assert.equal(sharedCostUrl.searchParams.get("successRate"), "81");
assert.equal(sharedCostUrl.searchParams.get("maxAttempts"), "4");
assert.equal(sharedCostUrl.searchParams.get("utm_source"), "cost_calculator_share");
assert.equal(sharedCostUrl.searchParams.get("utm_medium"), "referral");
assert.equal(sharedCostUrl.searchParams.get("utm_campaign"), "ai_evidence_lab");
assert.equal(sharedCostUrl.searchParams.get("utm_content"), "shared_cost_result");
assert.equal(sharedCostUrl.hash, "");

assert.deepEqual(
  parseSharedNumbers("?modelCost=0.42&successRate=999&maxAttempts=bad&utm_source=share", {
    modelCost: { min: 0, max: 100 },
    successRate: { min: 0.1, max: 100 },
    maxAttempts: { min: 1, max: 20 },
  }),
  { modelCost: "0.42", successRate: "100" },
  "shared numeric state should restore valid values, clamp bounds, and ignore malformed values",
);

assert.equal(parseSharedChecklist("?utm_source=share", ["access", "claim"]), null);
assert.deepEqual(
  parseSharedChecklist("?checks=claim,unknown,access,claim", ["access", "claim"]),
  ["claim", "access"],
  "shared checklist state should preserve valid unique controls only",
);
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

assert.equal((sitemap.match(/<url>/g) || []).length, 9, "sitemap should contain all nine crawlable pages");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(sitemapUrls.length, 9, "sitemap should publish nine URL locations");
assert.ok(sitemapUrls.every((url) => new URL(url).origin === brandedToolsOrigin), "every sitemap URL should use the ResearchAudio tools domain");
assert.match(robots, /Sitemap: https:\/\/tools\.researchaudio\.io\/sitemap\.xml/);
assert.doesNotMatch(`${sitemap}\n${robots}\n${llms}`, retiredGitHubPagesPath, "discovery files should not expose the retired GitHub Pages path");
assert.match(llms, /AI Cost per Successful Task Calculator/);
assert.match(llms, /AI Agent Loop Diagnostic/);
assert.match(llms, /AI Agent ROI Calculator/);
assert.match(llms, /LLM API Cost Calculator/);
assert.match(llms, /Prompt Caching Cost Calculator/);
assert.match(llms, /Codex CLI config\.toml Generator/);
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
assert.match(indexNowWorkflow, /key_url="https:\/\/tools\.researchaudio\.io\/\$\{key\}\.txt"/);
assert.doesNotMatch(indexNowWorkflow, retiredGitHubPagesPath, "IndexNow should verify ownership through the branded tools domain");

console.log("Evidence Lab verified: 7 tools, 1 activation kit, 9 crawlable pages, attributed subscribe and share CTAs, calculation logic, accessibility, responsive CSS, and IndexNow deployment are present.");
