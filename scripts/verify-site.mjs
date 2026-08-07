import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { calculateCost } from "../ai-cost-calculator/calculator.js";
import { classifyLoop, controls } from "../agent-loop-diagnostic/diagnostic.js";
import { calculateAgentRoi, classifyAgentRoi } from "../ai-agent-roi-calculator/calculator.js";
import { calculateLlmApiCost } from "../llm-api-cost-calculator/calculator.js";
import { calculateGpuMemory } from "../llm-gpu-memory-calculator/calculator.js";
import { calculateKvCache, MODEL_PRESETS } from "../kv-cache-calculator/calculator.js";
import { calculatePromptCacheSavings } from "../prompt-caching-calculator/calculator.js";
import { buildCodexConfig, normalizeFallbackFiles, normalizeMaxBytes } from "../codex-config-generator/generator.js";
import { calculateVoiceLatency, classifyVoiceLatency } from "../voice-ai-latency-calculator/calculator.js";
import { calculateVoiceAiCost } from "../voice-ai-cost-calculator/calculator.js";
import { buildAttributedShareUrl, parseSharedChecklist, parseSharedNumbers } from "../share-state.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexNowKey = "b5f8e5d9ef605861f4432c4b66a2d884";
const brandedToolsOrigin = "https://tools.researchaudio.io";
const retiredGitHubPagesPath = /deepmehta11\.github\.io\/researchaudio-scorecard/;
const parseStructuredData = (page) => [...page.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)].map((match) => JSON.parse(match[1]));
const [html, css, js, labCss, embedModeJs, toolsHtml, embedsHtml, embedsJs, costHtml, loopHtml, roiHtml, roiJs, llmCostHtml, llmCostJs, gpuMemoryHtml, gpuMemoryJs, kvCacheHtml, kvCacheJs, gpuGuideHtml, qwenGuideHtml, promptCacheHtml, promptCacheJs, codexConfigHtml, codexConfigJs, voiceLatencyHtml, voiceLatencyJs, voiceCostHtml, voiceCostJs, voiceCostPerMinuteHtml, aiReceptionistCostHtml, starterHtml, starterJs, fablePlaybookHtml, fablePlaybookCss, fablePlaybookPdf, sitemap, robots, llms, socialCard, publishedKey, indexNowScript, indexNowWorkflow] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "app.js"), "utf8"),
  readFile(path.join(root, "lab.css"), "utf8"),
  readFile(path.join(root, "embed-mode.js"), "utf8"),
  readFile(path.join(root, "tools/index.html"), "utf8"),
  readFile(path.join(root, "embeds/index.html"), "utf8"),
  readFile(path.join(root, "embeds/embeds.js"), "utf8"),
  readFile(path.join(root, "ai-cost-calculator/index.html"), "utf8"),
  readFile(path.join(root, "agent-loop-diagnostic/index.html"), "utf8"),
  readFile(path.join(root, "ai-agent-roi-calculator/index.html"), "utf8"),
  readFile(path.join(root, "ai-agent-roi-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "llm-api-cost-calculator/index.html"), "utf8"),
  readFile(path.join(root, "llm-api-cost-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "llm-gpu-memory-calculator/index.html"), "utf8"),
  readFile(path.join(root, "llm-gpu-memory-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "kv-cache-calculator/index.html"), "utf8"),
  readFile(path.join(root, "kv-cache-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "70b-llm-gpu-requirements/index.html"), "utf8"),
  readFile(path.join(root, "qwen2-5-gpu-requirements/index.html"), "utf8"),
  readFile(path.join(root, "prompt-caching-calculator/index.html"), "utf8"),
  readFile(path.join(root, "prompt-caching-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "codex-config-generator/index.html"), "utf8"),
  readFile(path.join(root, "codex-config-generator/generator.js"), "utf8"),
  readFile(path.join(root, "voice-ai-latency-calculator/index.html"), "utf8"),
  readFile(path.join(root, "voice-ai-latency-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "voice-ai-cost-calculator/index.html"), "utf8"),
  readFile(path.join(root, "voice-ai-cost-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "voice-ai-cost-per-minute/index.html"), "utf8"),
  readFile(path.join(root, "ai-receptionist-cost/index.html"), "utf8"),
  readFile(path.join(root, "evidence-starter-kit/index.html"), "utf8"),
  readFile(path.join(root, "evidence-starter-kit/starter.js"), "utf8"),
  readFile(path.join(root, "fable-playbook/index.html"), "utf8"),
  readFile(path.join(root, "fable-playbook/playbook.css"), "utf8"),
  readFile(path.join(root, "fable-playbook/fable5-cost-playbook.pdf")),
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
assert.match(html, /voice-ai-latency-calculator/);
assert.match(html, /voice-ai-cost-calculator/);
assert.match(html, /llm-gpu-memory-calculator/);
assert.match(html, /kv-cache-calculator/);
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
  ["embed library", embedsHtml, "/embeds/"],
  ["cost calculator", costHtml, "/ai-cost-calculator/"],
  ["loop diagnostic", loopHtml, "/agent-loop-diagnostic/"],
  ["agent ROI calculator", roiHtml, "/ai-agent-roi-calculator/"],
  ["LLM API cost calculator", llmCostHtml, "/llm-api-cost-calculator/"],
  ["LLM GPU memory calculator", gpuMemoryHtml, "/llm-gpu-memory-calculator/"],
  ["LLM KV cache calculator", kvCacheHtml, "/kv-cache-calculator/"],
  ["prompt caching calculator", promptCacheHtml, "/prompt-caching-calculator/"],
  ["Codex config generator", codexConfigHtml, "/codex-config-generator/"],
  ["voice AI latency calculator", voiceLatencyHtml, "/voice-ai-latency-calculator/"],
  ["voice AI cost calculator", voiceCostHtml, "/voice-ai-cost-calculator/"],
  ["voice AI cost per minute guide", voiceCostPerMinuteHtml, "/voice-ai-cost-per-minute/"],
  ["AI receptionist cost worksheet", aiReceptionistCostHtml, "/ai-receptionist-cost/"],
  ["70B LLM GPU requirements guide", gpuGuideHtml, "/70b-llm-gpu-requirements/"],
  ["Qwen2.5 GPU requirements guide", qwenGuideHtml, "/qwen2-5-gpu-requirements/"],
  ["starter kit", starterHtml, "/evidence-starter-kit/"],
  ["Fable 5 cost playbook", fablePlaybookHtml, "/fable-playbook/"],
]) {
  const canonical = page.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, `${name} canonical missing`);
  assert.equal(canonical[1], `${brandedToolsOrigin}${pathname}`, `${name} canonical should use the ResearchAudio tools domain`);
  assert.doesNotMatch(page, retiredGitHubPagesPath, `${name} still exposes the retired GitHub Pages path`);
}

for (const [name, page, title, source, calculatorPath, questions] of [
  ["voice AI cost per minute guide", voiceCostPerMinuteHtml, "Voice AI Cost per Minute: Formula &amp; Calculator", "voice_ai_cost_per_minute", "voice-ai-cost-calculator", [
    "How do you calculate voice AI cost per minute?",
    "Is cost per minute enough to compare voice AI systems?",
    "Which voice AI costs are usually missed?",
    "How do you convert voice AI cost per minute into cost per resolved call?",
  ]],
  ["AI receptionist cost worksheet", aiReceptionistCostHtml, "AI Receptionist Cost: Monthly Worksheet &amp; Calculator", "ai_receptionist_cost", "voice-ai-cost-calculator", [
    "How much does an AI receptionist cost?",
    "How should an AI receptionist be compared with a human receptionist?",
    "What counts as an AI receptionist resolution?",
    "Which data should be collected during an AI receptionist pilot?",
  ]],
  ["70B LLM GPU requirements guide", gpuGuideHtml, "70B LLM GPU Requirements: INT4, INT8 &amp; FP16", "70b_llm_gpu_requirements", "llm-gpu-memory-calculator", [
    "How much VRAM does a 70B model need at 4-bit precision?",
    "Can a 70B model run on one 48 GB GPU?",
    "How much VRAM do 70B FP16 weights require?",
    "Why is a model file smaller than the serving-memory requirement?",
  ]],
  ["Qwen2.5 GPU requirements guide", qwenGuideHtml, "Qwen2.5 GPU Requirements: 7B, 32B &amp; 72B VRAM", "qwen2_5_gpu_requirements", "llm-gpu-memory-calculator", [
    "How much GPU memory does Qwen2.5 7B need?",
    "How much GPU memory does Qwen2.5 32B need?",
    "How much GPU memory does Qwen2.5 72B need?",
    "Why does 128K context change Qwen2.5 VRAM requirements?",
  ]],
]) {
  assert.match(page, new RegExp(`<title>${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\| ResearchAudio<\\/title>`), `${name} title missing`);
  assert.equal((page.match(/"@type": "TechArticle"/g) || []).length, 1, `${name} should have one TechArticle schema`);
  assert.equal((page.match(/"@type": "FAQPage"/g) || []).length, 1, `${name} should have one FAQPage schema`);
  assert.doesNotThrow(() => parseStructuredData(page), `${name} structured data must be valid JSON`);
  assert.match(page, new RegExp(`https:\\/\\/researchaudio\\.io\\/subscribe\\?utm_source=${source}&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab`), `${name} direct subscribe attribution missing`);
  assert.match(page, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/, `${name} Beehiiv form missing`);
  assert.match(page, /subscribe-forms\.beehiiv\.com\/attribution\.js/, `${name} attribution missing`);
  assert.equal((page.match(/class="scenario-card/g) || []).length, 3, `${name} should contain three editable scenarios`);
  assert.match(page, new RegExp(`${calculatorPath}\\/\\?[a-zA-Z]+=`), `${name} scenario should open the calculator with state`);
  assert.doesNotMatch(page, /TODO|PLACEHOLDER|example\.com/, `${name} contains placeholder copy`);
  for (const question of questions) {
    const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(page, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `${name} visible FAQ question missing: ${question}`);
    assert.match(page, new RegExp(`"name": "${escapedQuestion}"`), `${name} FAQ schema question missing: ${question}`);
  }
}

for (const [name, page] of [
  ["scorecard", html],
  ["hub", toolsHtml],
  ["cost calculator", costHtml],
  ["loop diagnostic", loopHtml],
  ["agent ROI calculator", roiHtml],
  ["LLM API cost calculator", llmCostHtml],
  ["LLM GPU memory calculator", gpuMemoryHtml],
  ["LLM KV cache calculator", kvCacheHtml],
  ["prompt caching calculator", promptCacheHtml],
  ["Codex config generator", codexConfigHtml],
  ["voice AI latency calculator", voiceLatencyHtml],
  ["voice AI cost calculator", voiceCostHtml],
]) {
  assert.match(page, /https:\/\/researchaudio\.io\/subscribe\?utm_source=/, `${name} direct subscribe CTA missing`);
  assert.match(page, /utm_campaign=ai_evidence_lab/, `${name} acquisition campaign missing`);
  assert.match(page, /utm_content=(header_join|hero_join|result_join)/, `${name} CTA placement attribution missing`);
  assert.match(page, /51,000\+/, `${name} subscriber proof missing`);
}

for (const [name, page, title] of [
  ["hub", toolsHtml, "Free AI Evaluation Tools for Builders"],
  ["cost calculator", costHtml, "AI Cost per Successful Task Calculator"],
  ["loop diagnostic", loopHtml, "AI Agent Loop Diagnostic Checklist"],
  ["agent ROI calculator", roiHtml, "AI Agent ROI Calculator with Failure & Review"],
  ["LLM API cost calculator", llmCostHtml, "LLM API Cost Calculator (Input &amp; Output Tokens)"],
  ["LLM GPU memory calculator", gpuMemoryHtml, "LLM GPU Memory Calculator (VRAM &amp; GPU Count)"],
  ["LLM KV cache calculator", kvCacheHtml, "LLM KV Cache Calculator (VRAM &amp; Concurrency)"],
  ["prompt caching calculator", promptCacheHtml, "Prompt Caching Cost Calculator &amp; Break-Even Hit Rate"],
  ["Codex config generator", codexConfigHtml, "Codex CLI config.toml Generator"],
  ["voice AI latency calculator", voiceLatencyHtml, "Voice AI Latency Calculator (Fast &amp; Slow Models)"],
  ["voice AI cost calculator", voiceCostHtml, "AI Voice Agent Cost Calculator (Cost per Resolved Call)"],
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
  ["LLM GPU memory calculator", gpuMemoryHtml, [
    "How much GPU memory does an LLM need?",
    "How many GPUs does a 70B model need?",
    "How does quantization change LLM VRAM?",
    "Does this calculator include KV cache memory?",
  ]],
  ["LLM KV cache calculator", kvCacheHtml, [
    "How do you calculate LLM KV cache memory?",
    "Why do grouped-query attention models use less KV cache?",
    "How does context length affect KV cache memory?",
    "Does KV cache memory include model weights?",
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
  ["voice AI latency calculator", voiceLatencyHtml, [
    "How do you calculate voice AI response latency?",
    "What is a good latency for a voice AI agent?",
    "Why do voice AI systems use fast and slow models in parallel?",
    "What usually causes voice AI latency?",
  ]],
  ["voice AI cost calculator", voiceCostHtml, [
    "How do you calculate AI voice agent cost?",
    "What is cost per resolved call?",
    "Why does resolution rate change voice AI economics?",
    "Which fees belong in a voice AI cost model?",
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
assert.match(labCss, /\.subscribe-form-shell > div/);
assert.match(labCss, /\.embed-library/);
assert.match(labCss, /html\.embed-mode/);
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

const defaultGpuMemory = calculateGpuMemory({
  parameterBillions: 70,
  bitsPerParameter: 4,
  inferenceHeadroom: 20,
  vramPerGpu: 24,
  usableVramPercent: 90,
  availableGpus: 2,
});
assert.ok(Math.abs(defaultGpuMemory.weightMemoryGiB - 32.5962901115) < 0.000001);
assert.equal(defaultGpuMemory.kvCacheMemoryGiB, 0);
assert.equal(defaultGpuMemory.hasKvCacheInputs, false);
assert.ok(Math.abs(defaultGpuMemory.planningTargetGiB - 39.1155481339) < 0.000001);
assert.ok(Math.abs(defaultGpuMemory.usablePerGpuGiB - 21.6) < 0.000001);
assert.equal(defaultGpuMemory.minimumGpus, 2);
assert.equal(defaultGpuMemory.fitsAvailable, true);
const fp16GpuMemory = calculateGpuMemory({
  parameterBillions: 70,
  bitsPerParameter: 16,
  inferenceHeadroom: 20,
  vramPerGpu: 80,
  usableVramPercent: 90,
  availableGpus: 2,
});
assert.equal(fp16GpuMemory.minimumGpus, 3);
assert.equal(fp16GpuMemory.fitsAvailable, false);
const emptyGpuMemory = calculateGpuMemory({
  parameterBillions: -1,
  bitsPerParameter: 3,
  inferenceHeadroom: -10,
  vramPerGpu: 0,
  usableVramPercent: 200,
  availableGpus: -2,
});
assert.equal(emptyGpuMemory.weightMemoryGiB, 0);
assert.equal(emptyGpuMemory.minimumGpus, 0);
assert.equal(emptyGpuMemory.bits, 4);
const contextAwareGpuMemory = calculateGpuMemory({
  parameterBillions: 70,
  bitsPerParameter: 4,
  layers: 80,
  kvHeads: 8,
  headDimension: 128,
  contextTokens: 32768,
  concurrentSequences: 1,
  kvCacheBits: 16,
  inferenceHeadroom: 20,
  vramPerGpu: 48,
  usableVramPercent: 90,
  availableGpus: 2,
});
assert.equal(contextAwareGpuMemory.kvCacheMemoryGiB, 10);
assert.ok(Math.abs(contextAwareGpuMemory.planningTargetGiB - 51.1155481339) < 0.000001);
assert.equal(contextAwareGpuMemory.minimumGpus, 2);
assert.equal(contextAwareGpuMemory.fitsAvailable, true);
for (const scenario of [
  { parameters: 7.61, layers: 28, kvHeads: 4, target: 6.35 },
  { parameters: 32.5, layers: 64, kvHeads: 8, target: 27.76 },
  { parameters: 72.7, layers: 80, kvHeads: 8, target: 52.62 },
]) {
  const result = calculateGpuMemory({
    parameterBillions: scenario.parameters,
    bitsPerParameter: 4,
    layers: scenario.layers,
    kvHeads: scenario.kvHeads,
    headDimension: 128,
    contextTokens: 32768,
    concurrentSequences: 1,
    kvCacheBits: 16,
    inferenceHeadroom: 20,
    vramPerGpu: 48,
    usableVramPercent: 90,
    availableGpus: 2,
  });
  assert.equal(Number(result.planningTargetGiB.toFixed(2)), scenario.target, `Qwen2.5 ${scenario.parameters}B target should match the guide`);
}
assert.match(gpuMemoryHtml, /name="layers"/);
assert.match(gpuMemoryHtml, /name="kvHeads"/);
assert.match(gpuMemoryHtml, /name="headDimension"/);
assert.match(gpuMemoryHtml, /name="contextTokens"/);
assert.match(gpuMemoryHtml, /name="concurrentSequences"/);
assert.match(gpuMemoryHtml, /name="kvCacheBits"/);
assert.match(gpuMemoryHtml, /70b-llm-gpu-requirements/);
assert.match(gpuGuideHtml, /51\.1 GiB/);
assert.match(gpuGuideHtml, /90\.2 GiB/);
assert.match(gpuGuideHtml, /168\.5 GiB/);
assert.match(gpuGuideHtml, /huggingface\.co\/docs\/transformers\/en\/kv_cache/);
assert.match(gpuMemoryJs, /source: "gpu_memory_share"/);
assert.match(gpuMemoryJs, /content: "shared_gpu_memory_plan"/);
assert.match(gpuMemoryHtml, /huggingface\.co\/docs\/accelerate\/en\/usage_guides\/model_size_estimator/);
assert.match(gpuMemoryHtml, /huggingface\.co\/docs\/transformers\/en\/kv_cache/);
assert.match(gpuMemoryHtml, /understanding-gpu-architecture-technical-deep-dive/);
assert.match(toolsHtml, /llm-gpu-memory-calculator/);
assert.match(gpuMemoryHtml, /kv-cache-calculator/);
assert.match(gpuGuideHtml, /kv-cache-calculator/);

const defaultKvCache = calculateKvCache({
  layers: 28,
  attentionHeads: 28,
  kvHeads: 4,
  headDimension: 128,
  contextTokens: 32768,
  concurrentSequences: 1,
  kvCacheBits: 16,
  availableKvVramGiB: 16,
});
assert.equal(defaultKvCache.bytesPerToken, 57344);
assert.equal(defaultKvCache.perSequenceGiB, 1.75);
assert.equal(defaultKvCache.totalGiB, 1.75);
assert.equal(defaultKvCache.mhaTotalGiB, 12.25);
assert.equal(defaultKvCache.gqaReduction, 7);
assert.equal(defaultKvCache.gqaSavingsGiB, 10.5);
assert.equal(defaultKvCache.maxFullContextSequences, 9);
assert.equal(defaultKvCache.totalCachedTokens, 32768);
const qwen32KvCache = calculateKvCache({
  ...MODEL_PRESETS["qwen2.5-32b"],
  contextTokens: 32768,
  concurrentSequences: 3,
  kvCacheBits: 8,
  availableKvVramGiB: 24,
});
assert.equal(qwen32KvCache.perSequenceGiB, 4);
assert.equal(qwen32KvCache.totalGiB, 12);
assert.equal(qwen32KvCache.maxFullContextSequences, 6);
const invalidKvCache = calculateKvCache({
  layers: 32,
  attentionHeads: 4,
  kvHeads: 8,
  headDimension: 128,
  contextTokens: 8192,
  concurrentSequences: 1,
  kvCacheBits: 3,
  availableKvVramGiB: -1,
});
assert.equal(invalidKvCache.validHeadRatio, false);
assert.equal(invalidKvCache.cacheBits, 16);
assert.equal(invalidKvCache.availableGiB, 0);
assert.match(kvCacheJs, /source: "kv_cache_share"/);
assert.match(kvCacheJs, /content: "shared_kv_cache_result"/);
assert.match(kvCacheHtml, /name="attentionHeads"/);
assert.match(kvCacheHtml, /name="kvHeads"/);
assert.match(kvCacheHtml, /name="contextTokens"/);
assert.match(kvCacheHtml, /name="concurrentSequences"/);
assert.match(kvCacheHtml, /name="availableKvVramGiB"/);
assert.match(kvCacheHtml, /Qwen2\.5 7B/);
assert.match(kvCacheHtml, /Qwen2\.5 32B/);
assert.match(kvCacheHtml, /Qwen2\.5 72B/);
assert.equal((kvCacheHtml.match(/class="scenario-card/g) || []).length, 3, "KV-cache calculator should contain three sourced scenarios");
assert.match(toolsHtml, /kv-cache-calculator/);
assert.equal((toolsHtml.match(/class="tool-card"/g) || []).length, 11, "tools hub should contain eleven instruments");

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

const defaultVoiceLatency = calculateVoiceLatency({
  endpointMs: 280,
  transcriptionMs: 220,
  contextMs: 120,
  fastModelMs: 180,
  slowModelMs: 650,
  ttsMs: 160,
  playoutMs: 60,
});
assert.equal(defaultVoiceLatency.transcriptReadyMs, 500);
assert.equal(defaultVoiceLatency.slowBranchMs, 770);
assert.equal(defaultVoiceLatency.firstBranch, "fast");
assert.equal(defaultVoiceLatency.firstBranchMs, 180);
assert.equal(defaultVoiceLatency.parallelFirstAudioMs, 900);
assert.equal(defaultVoiceLatency.sequentialFirstAudioMs, 1490);
assert.equal(defaultVoiceLatency.deepReasoningReadyMs, 1270);
assert.equal(defaultVoiceLatency.handoffGapMs, 590);
assert.equal(defaultVoiceLatency.parallelSavingsMs, 590);
assert.ok(Math.abs(defaultVoiceLatency.preModelShare - (500 / 900)) < 0.000001);
assert.equal(classifyVoiceLatency(defaultVoiceLatency.parallelFirstAudioMs).status, "CONVERSATIONAL");
const slowBranchWins = calculateVoiceLatency({
  endpointMs: 100,
  transcriptionMs: 100,
  contextMs: 50,
  fastModelMs: 1000,
  slowModelMs: 100,
  ttsMs: 100,
  playoutMs: 50,
});
assert.equal(slowBranchWins.firstBranch, "slow");
assert.equal(slowBranchWins.parallelFirstAudioMs, 500);
assert.equal(slowBranchWins.sequentialFirstAudioMs, 500);
assert.equal(slowBranchWins.parallelSavingsMs, 0);
assert.equal(classifyVoiceLatency(600).status, "FAST");
assert.equal(classifyVoiceLatency(601).status, "CONVERSATIONAL");
assert.equal(classifyVoiceLatency(1001).status, "NOTICEABLE");
assert.equal(classifyVoiceLatency(1501).status, "SLOW");
assert.match(voiceLatencyJs, /source: "voice_latency_share"/);
assert.match(voiceLatencyJs, /content: "shared_latency_budget"/);
assert.match(voiceLatencyHtml, /href="https:\/\/researchaudio\.io\/p\/voice-ai-latency-budget-guide\?utm_source=voice_ai_latency&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab&amp;utm_content=guide_link"/);
assert.match(toolsHtml, /voice-ai-latency-calculator/);
assert.match(labCss, /\.latency-tape/);

const defaultVoiceCost = calculateVoiceAiCost({
  callsPerMonth: 5000,
  minutesPerCall: 4,
  platformPerMinute: 0.05,
  telephonyPerMinute: 0.014,
  sttPerMinute: 0.006,
  ttsPerMinute: 0.03,
  llmPerMinute: 0.005,
  fixedMonthlyCost: 200,
  resolutionRate: 70,
  handoffMinutes: 6,
  humanHourlyCost: 30,
  humanCostPerCall: 4,
});
assert.ok(Math.abs(defaultVoiceCost.perMinuteStackCost - 0.105) < 0.000001);
assert.equal(defaultVoiceCost.monthlyMinutes, 20000);
assert.equal(defaultVoiceCost.aiMonthlyCost, 2300);
assert.equal(defaultVoiceCost.resolvedCalls, 3500);
assert.equal(defaultVoiceCost.unresolvedCalls, 1500);
assert.equal(defaultVoiceCost.humanHandoffCost, 4500);
assert.equal(defaultVoiceCost.loadedMonthlyCost, 6800);
assert.ok(Math.abs(defaultVoiceCost.costPerResolvedCall - (6800 / 3500)) < 0.000001);
assert.equal(defaultVoiceCost.monthlySavings, 13200);
assert.ok(Math.abs(defaultVoiceCost.breakEvenResolutionRate - (3.46 / 7)) < 0.000001);
const leanVoiceCost = calculateVoiceAiCost({
  callsPerMonth: 5000,
  minutesPerCall: 4,
  platformPerMinute: 0.02,
  telephonyPerMinute: 0.014,
  sttPerMinute: 0.006,
  ttsPerMinute: 0.015,
  llmPerMinute: 0.005,
  fixedMonthlyCost: 200,
  resolutionRate: 70,
  handoffMinutes: 6,
  humanHourlyCost: 30,
  humanCostPerCall: 4,
});
assert.ok(Math.abs(leanVoiceCost.costPerResolvedCall - (5900 / 3500)) < 0.000001);
assert.match(voiceCostPerMinuteHtml, /\$1\.69 loaded \/ resolution/);
assert.match(voiceCostPerMinuteHtml, /\$1\.94 loaded \/ resolution/);
assert.match(voiceCostPerMinuteHtml, /\$2\.49 loaded \/ resolution/);
const afterHoursReceptionist = calculateVoiceAiCost({
  callsPerMonth: 400,
  minutesPerCall: 2.5,
  platformPerMinute: 0.05,
  telephonyPerMinute: 0.014,
  sttPerMinute: 0.006,
  ttsPerMinute: 0.03,
  llmPerMinute: 0.005,
  fixedMonthlyCost: 100,
  resolutionRate: 60,
  handoffMinutes: 5,
  humanHourlyCost: 30,
  humanCostPerCall: 5,
});
assert.equal(afterHoursReceptionist.loadedMonthlyCost, 605);
assert.match(aiReceptionistCostHtml, /\$605\/mo/);
assert.match(aiReceptionistCostHtml, /\$1,365\/mo/);
assert.match(aiReceptionistCostHtml, /\$6,800\/mo/);
const zeroResolutionVoiceCost = calculateVoiceAiCost({
  callsPerMonth: 100,
  minutesPerCall: 3,
  platformPerMinute: -1,
  telephonyPerMinute: 0,
  sttPerMinute: 0,
  ttsPerMinute: 0,
  llmPerMinute: 0,
  fixedMonthlyCost: -5,
  resolutionRate: -10,
  handoffMinutes: 5,
  humanHourlyCost: 30,
  humanCostPerCall: 4,
});
assert.equal(zeroResolutionVoiceCost.perMinuteStackCost, 0);
assert.equal(zeroResolutionVoiceCost.resolvedCalls, 0);
assert.equal(zeroResolutionVoiceCost.costPerResolvedCall, null);
assert.match(voiceCostJs, /source: "voice_cost_share"/);
assert.match(voiceCostJs, /content: "shared_voice_cost_result"/);
assert.match(voiceCostHtml, /voice-ai-latency-calculator/);
assert.match(voiceCostHtml, /voice-ai-cost-per-minute/);
assert.match(voiceCostHtml, /ai-receptionist-cost/);
assert.match(voiceCostHtml, /twilio\.com\/en-us\/voice\/pricing\/us/);
assert.match(voiceCostHtml, /elevenlabs\.io\/pricing/);
assert.match(toolsHtml, /voice-ai-cost-calculator/);
assert.match(toolsHtml, /voice-ai-cost-per-minute/);
assert.match(toolsHtml, /ai-receptionist-cost/);
assert.equal((toolsHtml.match(/class="resource-card"/g) || []).length, 4, "tools hub should contain four search field notes");
assert.match(toolsHtml, /70b-llm-gpu-requirements/);
assert.match(toolsHtml, /qwen2-5-gpu-requirements/);
assert.match(voiceLatencyHtml, /voice-ai-cost-per-minute/);
assert.match(labCss, /\.resource-section/);
assert.match(labCss, /\.resource-grid/);
assert.match(labCss, /\.formula-copy/);
assert.match(labCss, /\.guide-scenario-grid/);

assert.match(fablePlaybookHtml, /<title>Fable 5 Cost Playbook \(10-Move PDF\) \| ResearchAudio<\/title>/);
assert.match(fablePlaybookHtml, /fable5-cost-playbook\.pdf/);
assert.match(fablePlaybookHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(fablePlaybookHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(fablePlaybookHtml, /utm_campaign=fable_5_cost_playbook/);
assert.match(fablePlaybookHtml, /Archive note:/);
assert.match(fablePlaybookHtml, /application\/ld\+json/);
assert.doesNotThrow(() => parseStructuredData(fablePlaybookHtml), "Fable playbook structured data must be valid JSON");
assert.deepEqual([...fablePlaybookPdf.subarray(0, 5)], [37, 80, 68, 70, 45], "Fable playbook asset should be a PDF");
assert.match(fablePlaybookCss, /@media \(max-width: 620px\)/);
assert.match(fablePlaybookCss, /prefers-reduced-motion/);
assert.match(fablePlaybookCss, /focus-visible/);
assert.match(toolsHtml, /fable-playbook/);

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
assert.match(starterHtml, /51,000\+/);
assert.match(starterHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=evidence_starter_kit/);
assert.equal((starterHtml.match(/data-step=/g) || []).length, 4, "starter kit should contain four progress steps");
assert.match(starterHtml, /Three confirmed referrals unlock the AI Launch Evidence Checklist PDF automatically/);
assert.match(starterJs, /researchaudio_evidence_starter_progress_v1/);
assert.match(starterJs, /utm_source", "evidence_starter_share"/);
assert.match(starterJs, /utm_medium", "referral"/);
assert.match(starterJs, /utm_campaign", "ai_evidence_lab"/);
assert.match(starterJs, /utm_medium"\) === "onboarding"/);
assert.doesNotMatch(starterHtml, /TODO|PLACEHOLDER|example\.com/);

for (const [name, page] of [
  ["AI agent ROI", roiHtml],
  ["LLM API cost", llmCostHtml],
  ["LLM GPU memory", gpuMemoryHtml],
  ["LLM KV cache", kvCacheHtml],
  ["voice AI cost", voiceCostHtml],
]) {
  assert.match(page, /<script src="\.\.\/embed-mode\.js"><\/script>/, `${name} calculator should support embed mode`);
}
assert.match(embedModeJs, /parameters\.get\("embed"\) === "1"/);
assert.match(embedModeJs, /utm_medium", "embedded_tool"/);
assert.match(embedModeJs, /utm_campaign", "ai_evidence_lab"/);
assert.match(embedModeJs, /target = "_blank"/);
assert.match(embedsHtml, /<title>Embed Free AI Calculators on Your Website \| ResearchAudio<\/title>/);
assert.equal((embedsHtml.match(/data-widget-url=/g) || []).length, 5, "embed library should offer five widgets");
assert.equal((embedsHtml.match(/data-copy-embed/g) || []).length, 5, "every widget should expose a copy action");
assert.match(embedsHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(embedsHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(embedsJs, /utm_source/);
assert.match(embedsJs, /utm_medium/);
assert.match(embedsJs, /utm_campaign/);
assert.match(embedsJs, /navigator\.clipboard\.writeText/);
assert.match(toolsHtml, /href="\.\.\/embeds\/\?utm_source=evidence_lab/);

assert.match(toolsHtml, /Qwen2\.5 GPU requirements/);
assert.match(qwenGuideHtml, /Official Qwen2\.5 7B model card/);
assert.match(qwenGuideHtml, /Official Qwen2\.5 32B model card/);
assert.match(qwenGuideHtml, /Official Qwen2\.5 72B model card/);
assert.match(qwenGuideHtml, /6\.35 GiB/);
assert.match(qwenGuideHtml, /27\.76 GiB/);
assert.match(qwenGuideHtml, /52\.62 GiB/);

assert.equal((sitemap.match(/<url>/g) || []).length, 19, "sitemap should contain all nineteen crawlable pages");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(sitemapUrls.length, 19, "sitemap should publish nineteen URL locations");
assert.ok(sitemapUrls.every((url) => new URL(url).origin === brandedToolsOrigin), "every sitemap URL should use the ResearchAudio tools domain");
assert.match(robots, /Sitemap: https:\/\/tools\.researchaudio\.io\/sitemap\.xml/);
assert.doesNotMatch(`${sitemap}\n${robots}\n${llms}`, retiredGitHubPagesPath, "discovery files should not expose the retired GitHub Pages path");
assert.match(llms, /AI Cost per Successful Task Calculator/);
assert.match(llms, /AI Agent Loop Diagnostic/);
assert.match(llms, /AI Agent ROI Calculator/);
assert.match(llms, /LLM API Cost Calculator/);
assert.match(llms, /LLM GPU Memory Calculator/);
assert.match(llms, /LLM KV Cache Calculator/);
assert.match(llms, /Prompt Caching Cost Calculator/);
assert.match(llms, /Codex CLI config\.toml Generator/);
assert.match(llms, /Voice AI Latency Calculator/);
assert.match(llms, /AI Voice Agent Cost Calculator/);
assert.match(llms, /AI Evidence Starter Kit/);
assert.match(llms, /Embeddable AI Calculators/);
assert.match(llms, /The Fable 5 Cost Playbook/);
assert.match(llms, /Voice AI Cost per Minute/);
assert.match(llms, /AI Receptionist Cost Worksheet/);
assert.match(llms, /70B LLM GPU Requirements/);
assert.match(llms, /Qwen2\.5 GPU Requirements/);
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

console.log("Evidence Lab verified: 11 tools, 1 activation kit, 1 embed library, 5 field guides, 19 crawlable pages, attributed subscribe and share CTAs, calculation logic, accessibility, responsive CSS, and IndexNow deployment are present.");
