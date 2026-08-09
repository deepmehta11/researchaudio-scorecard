import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { calculateCost } from "../ai-cost-calculator/calculator.js";
import { classifyLoop, controls } from "../agent-loop-diagnostic/diagnostic.js";
import { classifyTask, controls as taskFitControls } from "../ai-task-fit-diagnostic/diagnostic.js";
import { classifyAgentSecurity, controls as securityControls } from "../ai-agent-security-checklist/checklist.js";
import { classifyBenchmarkAudit, controls as benchmarkControls } from "../ai-benchmark-audit-checklist/checklist.js";
import { calculateAgentRoi, classifyAgentRoi } from "../ai-agent-roi-calculator/calculator.js";
import { calculateLlmApiCost } from "../llm-api-cost-calculator/calculator.js";
import { calculateGpuMemory } from "../llm-gpu-memory-calculator/calculator.js";
import { calculateCompatibility } from "../local-llm-gpu-compatibility/checker.js";
import { calculateModelFinder, recommendOllamaStarter } from "../what-llm-can-i-run/finder.js";
import { calculateKvCache, MODEL_PRESETS } from "../kv-cache-calculator/calculator.js";
import { calculatePromptCacheSavings } from "../prompt-caching-calculator/calculator.js";
import { buildCodexConfig, normalizeFallbackFiles, normalizeMaxBytes } from "../codex-config-generator/generator.js";
import { buildCodexExecCommand, shellQuote } from "../codex-exec-command-builder/builder.js";
import { calculateVoiceLatency, classifyVoiceLatency } from "../voice-ai-latency-calculator/calculator.js";
import { calculateVoiceAiCost } from "../voice-ai-cost-calculator/calculator.js";
import { buildAttributedShareUrl, parseSharedChecklist, parseSharedNumbers } from "../share-state.js";
import { buildReaderShareUrl } from "../reader-share.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexNowKey = "b5f8e5d9ef605861f4432c4b66a2d884";
const brandedToolsOrigin = "https://tools.researchaudio.io";
const cloudflareWebAnalyticsToken = "c20a9e29828c471c92ed7c2284901e05";
const retiredGitHubPagesPath = /deepmehta11\.github\.io\/researchaudio-scorecard/;
const parseStructuredData = (page) => [...page.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)].map((match) => JSON.parse(match[1]));
const [html, css, js, labCss, embedModeJs, readerShareJs, conversionLoopJs, toolsHtml, embedsHtml, embedsJs, partnersHtml, partnersJs, costHtml, loopHtml, taskFitHtml, taskFitJs, roiHtml, roiJs, llmCostHtml, llmCostJs, gpuMemoryHtml, gpuMemoryJs, compatibilityHtml, compatibilityJs, finderHtml, finderJs, kvCacheHtml, kvCacheJs, localLlmGuideHtml, smallGpuGuideHtml, gpuGuideHtml, rtx3060GuideHtml, rtx4060GuideHtml, rtx4060Ti16GuideHtml, rtx3090Vs4090GuideHtml, rtx4090GuideHtml, rtx5060TiComparisonGuideHtml, rtx4070SuperComparisonGuideHtml, macMiniM4GuideHtml, rtx5080GuideHtml, rtx5090GuideHtml, qwenGuideHtml, qwen3GuideHtml, gptOssGuideHtml, deepseekV4GuideHtml, glm52GuideHtml, kimiK3GuideHtml, gemma4GuideHtml, diffusionGemmaGuideHtml, securityGuideHtml, securityGuideJs, benchmarkGuideHtml, benchmarkGuideJs, promptCacheHtml, promptCacheJs, codexConfigHtml, codexConfigJs, codexExecHtml, codexExecJs, voiceLatencyHtml, voiceLatencyJs, voiceCostHtml, voiceCostJs, voiceCostPerMinuteHtml, aiReceptionistCostHtml, acquisitionHtml, starterHtml, starterJs, deploymentPackHtml, deploymentBrief, evidenceChecklist, rolloutGates, fablePlaybookHtml, fablePlaybookCss, fablePlaybookPdf, sitemap, robots, llms, socialCard, publishedKey, indexNowScript, indexNowWorkflow] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "styles.css"), "utf8"),
  readFile(path.join(root, "app.js"), "utf8"),
  readFile(path.join(root, "lab.css"), "utf8"),
  readFile(path.join(root, "embed-mode.js"), "utf8"),
  readFile(path.join(root, "reader-share.js"), "utf8"),
  readFile(path.join(root, "conversion-loop.js"), "utf8"),
  readFile(path.join(root, "tools/index.html"), "utf8"),
  readFile(path.join(root, "embeds/index.html"), "utf8"),
  readFile(path.join(root, "embeds/embeds.js"), "utf8"),
  readFile(path.join(root, "partners/index.html"), "utf8"),
  readFile(path.join(root, "partners/partners.js"), "utf8"),
  readFile(path.join(root, "ai-cost-calculator/index.html"), "utf8"),
  readFile(path.join(root, "agent-loop-diagnostic/index.html"), "utf8"),
  readFile(path.join(root, "ai-task-fit-diagnostic/index.html"), "utf8"),
  readFile(path.join(root, "ai-task-fit-diagnostic/diagnostic.js"), "utf8"),
  readFile(path.join(root, "ai-agent-roi-calculator/index.html"), "utf8"),
  readFile(path.join(root, "ai-agent-roi-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "llm-api-cost-calculator/index.html"), "utf8"),
  readFile(path.join(root, "llm-api-cost-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "llm-gpu-memory-calculator/index.html"), "utf8"),
  readFile(path.join(root, "llm-gpu-memory-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "local-llm-gpu-compatibility/index.html"), "utf8"),
  readFile(path.join(root, "local-llm-gpu-compatibility/checker.js"), "utf8"),
  readFile(path.join(root, "what-llm-can-i-run/index.html"), "utf8"),
  readFile(path.join(root, "what-llm-can-i-run/finder.js"), "utf8"),
  readFile(path.join(root, "kv-cache-calculator/index.html"), "utf8"),
  readFile(path.join(root, "kv-cache-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "local-llm-gpu-guide/index.html"), "utf8"),
  readFile(path.join(root, "7b-vs-13b-llm-gpu-requirements/index.html"), "utf8"),
  readFile(path.join(root, "70b-llm-gpu-requirements/index.html"), "utf8"),
  readFile(path.join(root, "rtx-3060-llm-models/index.html"), "utf8"),
  readFile(path.join(root, "rtx-4060-llm-models/index.html"), "utf8"),
  readFile(path.join(root, "rtx-4060-ti-16gb-llm-models/index.html"), "utf8"),
  readFile(path.join(root, "rtx-3090-vs-4090-local-llm/index.html"), "utf8"),
  readFile(path.join(root, "rtx-4090-llm-models/index.html"), "utf8"),
  readFile(path.join(root, "rtx-5060-ti-8gb-vs-16gb-local-llm/index.html"), "utf8"),
  readFile(path.join(root, "rtx-4070-super-vs-4070-ti-super-local-llm/index.html"), "utf8"),
  readFile(path.join(root, "mac-mini-m4-local-llm/index.html"), "utf8"),
  readFile(path.join(root, "rtx-5080-llm-models/index.html"), "utf8"),
  readFile(path.join(root, "rtx-5090-llm-models/index.html"), "utf8"),
  readFile(path.join(root, "qwen2-5-gpu-requirements/index.html"), "utf8"),
  readFile(path.join(root, "qwen3-gpu-requirements/index.html"), "utf8"),
  readFile(path.join(root, "gpt-oss-hardware-requirements/index.html"), "utf8"),
  readFile(path.join(root, "deepseek-v4-flash-gpu-requirements/index.html"), "utf8"),
  readFile(path.join(root, "glm-5-2-gpu-requirements/index.html"), "utf8"),
  readFile(path.join(root, "kimi-k3-gpu-requirements/index.html"), "utf8"),
  readFile(path.join(root, "gemma-4-gpu-requirements/index.html"), "utf8"),
  readFile(path.join(root, "diffusiongemma-gpu-requirements/index.html"), "utf8"),
  readFile(path.join(root, "ai-agent-security-checklist/index.html"), "utf8"),
  readFile(path.join(root, "ai-agent-security-checklist/checklist.js"), "utf8"),
  readFile(path.join(root, "ai-benchmark-audit-checklist/index.html"), "utf8"),
  readFile(path.join(root, "ai-benchmark-audit-checklist/checklist.js"), "utf8"),
  readFile(path.join(root, "prompt-caching-calculator/index.html"), "utf8"),
  readFile(path.join(root, "prompt-caching-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "codex-config-generator/index.html"), "utf8"),
  readFile(path.join(root, "codex-config-generator/generator.js"), "utf8"),
  readFile(path.join(root, "codex-exec-command-builder/index.html"), "utf8"),
  readFile(path.join(root, "codex-exec-command-builder/builder.js"), "utf8"),
  readFile(path.join(root, "voice-ai-latency-calculator/index.html"), "utf8"),
  readFile(path.join(root, "voice-ai-latency-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "voice-ai-cost-calculator/index.html"), "utf8"),
  readFile(path.join(root, "voice-ai-cost-calculator/calculator.js"), "utf8"),
  readFile(path.join(root, "voice-ai-cost-per-minute/index.html"), "utf8"),
  readFile(path.join(root, "ai-receptionist-cost/index.html"), "utf8"),
  readFile(path.join(root, "ai-evidence-starter-kit/index.html"), "utf8"),
  readFile(path.join(root, "evidence-starter-kit/index.html"), "utf8"),
  readFile(path.join(root, "evidence-starter-kit/starter.js"), "utf8"),
  readFile(path.join(root, "ai-deployment-pack/index.html"), "utf8"),
  readFile(path.join(root, "ai-deployment-pack/deployment-decision-brief.md"), "utf8"),
  readFile(path.join(root, "ai-deployment-pack/ai-launch-evidence-checklist.md"), "utf8"),
  readFile(path.join(root, "ai-deployment-pack/production-rollout-gates.md"), "utf8"),
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
assert.match(html, /codex-exec-command-builder/);
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
  ["AI task fit diagnostic", taskFitHtml, "/ai-task-fit-diagnostic/"],
  ["agent ROI calculator", roiHtml, "/ai-agent-roi-calculator/"],
  ["LLM API cost calculator", llmCostHtml, "/llm-api-cost-calculator/"],
  ["LLM GPU memory calculator", gpuMemoryHtml, "/llm-gpu-memory-calculator/"],
  ["local LLM GPU compatibility checker", compatibilityHtml, "/local-llm-gpu-compatibility/"],
  ["hardware-first LLM model finder", finderHtml, "/what-llm-can-i-run/"],
  ["LLM KV cache calculator", kvCacheHtml, "/kv-cache-calculator/"],
  ["prompt caching calculator", promptCacheHtml, "/prompt-caching-calculator/"],
  ["Codex config generator", codexConfigHtml, "/codex-config-generator/"],
  ["Codex exec command builder", codexExecHtml, "/codex-exec-command-builder/"],
  ["voice AI latency calculator", voiceLatencyHtml, "/voice-ai-latency-calculator/"],
  ["voice AI cost calculator", voiceCostHtml, "/voice-ai-cost-calculator/"],
  ["voice AI cost per minute guide", voiceCostPerMinuteHtml, "/voice-ai-cost-per-minute/"],
  ["AI receptionist cost worksheet", aiReceptionistCostHtml, "/ai-receptionist-cost/"],
  ["local LLM GPU and hardware pillar", localLlmGuideHtml, "/local-llm-gpu-guide/"],
  ["7B versus 13B LLM GPU requirements guide", smallGpuGuideHtml, "/7b-vs-13b-llm-gpu-requirements/"],
  ["70B LLM GPU requirements guide", gpuGuideHtml, "/70b-llm-gpu-requirements/"],
  ["RTX 3060 12GB local LLM guide", rtx3060GuideHtml, "/rtx-3060-llm-models/"],
  ["RTX 4060 8GB local LLM guide", rtx4060GuideHtml, "/rtx-4060-llm-models/"],
  ["RTX 4060 Ti 16GB local LLM guide", rtx4060Ti16GuideHtml, "/rtx-4060-ti-16gb-llm-models/"],
  ["RTX 3090 versus RTX 4090 local LLM comparison", rtx3090Vs4090GuideHtml, "/rtx-3090-vs-4090-local-llm/"],
  ["RTX 4090 local LLM guide", rtx4090GuideHtml, "/rtx-4090-llm-models/"],
  ["RTX 5060 Ti 8GB versus 16GB local LLM comparison", rtx5060TiComparisonGuideHtml, "/rtx-5060-ti-8gb-vs-16gb-local-llm/"],
  ["RTX 4070 Super versus RTX 4070 Ti Super local LLM comparison", rtx4070SuperComparisonGuideHtml, "/rtx-4070-super-vs-4070-ti-super-local-llm/"],
  ["Mac mini M4 local LLM memory guide", macMiniM4GuideHtml, "/mac-mini-m4-local-llm/"],
  ["RTX 5080 local LLM guide", rtx5080GuideHtml, "/rtx-5080-llm-models/"],
  ["RTX 5090 local LLM guide", rtx5090GuideHtml, "/rtx-5090-llm-models/"],
  ["Qwen2.5 GPU requirements guide", qwenGuideHtml, "/qwen2-5-gpu-requirements/"],
  ["Qwen3 GPU requirements guide", qwen3GuideHtml, "/qwen3-gpu-requirements/"],
  ["gpt-oss hardware requirements guide", gptOssGuideHtml, "/gpt-oss-hardware-requirements/"],
  ["DeepSeek V4 Flash GPU requirements guide", deepseekV4GuideHtml, "/deepseek-v4-flash-gpu-requirements/"],
  ["GLM-5.2 GPU requirements guide", glm52GuideHtml, "/glm-5-2-gpu-requirements/"],
  ["Kimi K3 GPU requirements guide", kimiK3GuideHtml, "/kimi-k3-gpu-requirements/"],
  ["Gemma 4 GPU requirements guide", gemma4GuideHtml, "/gemma-4-gpu-requirements/"],
  ["DiffusionGemma GPU requirements guide", diffusionGemmaGuideHtml, "/diffusiongemma-gpu-requirements/"],
  ["AI agent security checklist", securityGuideHtml, "/ai-agent-security-checklist/"],
  ["AI benchmark audit checklist", benchmarkGuideHtml, "/ai-benchmark-audit-checklist/"],
  ["AI evidence starter kit acquisition page", acquisitionHtml, "/ai-evidence-starter-kit/"],
  ["Fable 5 cost playbook", fablePlaybookHtml, "/fable-playbook/"],
]) {
  const canonical = page.match(/<link rel="canonical" href="([^"]+)"/);
  assert.ok(canonical, `${name} canonical missing`);
  assert.equal(canonical[1], `${brandedToolsOrigin}${pathname}`, `${name} canonical should use the ResearchAudio tools domain`);
  assert.doesNotMatch(page, retiredGitHubPagesPath, `${name} still exposes the retired GitHub Pages path`);
  assert.equal((page.match(/static\.cloudflareinsights\.com\/beacon\.min\.js/g) || []).length, 1, `${name} should load one Cloudflare Web Analytics beacon`);
  assert.equal((page.match(/data-cf-beacon=/g) || []).length, 1, `${name} should configure one Cloudflare Web Analytics beacon`);
  assert.match(page, new RegExp(`data-cf-beacon='[^']*${cloudflareWebAnalyticsToken}[^']*'`), `${name} should use the ResearchAudio Web Analytics site tag`);
  assert.equal((page.match(/class="subscribe-direct-fallback"/g) || []).length, 1, `${name} should expose one hosted signup fallback`);
  assert.match(page, /class="subscribe-direct-fallback">[\s\S]{0,700}?https:\/\/researchaudio\.io\/subscribe\?utm_source=[^&"]+&amp;utm_medium=[^&"]+&amp;utm_campaign=ai_evidence_lab&amp;utm_content=direct_join/, `${name} hosted signup fallback should preserve page attribution`);
}

for (const [name, page] of [
  ["tools hub", toolsHtml],
  ["embed library", embedsHtml],
  ["voice AI cost per minute guide", voiceCostPerMinuteHtml],
  ["AI receptionist cost worksheet", aiReceptionistCostHtml],
  ["7B versus 13B LLM GPU requirements guide", smallGpuGuideHtml],
  ["70B LLM GPU requirements guide", gpuGuideHtml],
  ["RTX 3060 12GB local LLM guide", rtx3060GuideHtml],
  ["RTX 4060 8GB local LLM guide", rtx4060GuideHtml],
  ["RTX 4060 Ti 16GB local LLM guide", rtx4060Ti16GuideHtml],
  ["RTX 3090 versus RTX 4090 local LLM comparison", rtx3090Vs4090GuideHtml],
  ["RTX 4090 local LLM guide", rtx4090GuideHtml],
  ["RTX 5060 Ti comparison", rtx5060TiComparisonGuideHtml],
  ["RTX 4070 Super comparison", rtx4070SuperComparisonGuideHtml],
  ["Mac mini M4 local LLM guide", macMiniM4GuideHtml],
  ["RTX 5080 local LLM guide", rtx5080GuideHtml],
  ["RTX 5090 local LLM guide", rtx5090GuideHtml],
  ["Qwen2.5 GPU requirements guide", qwenGuideHtml],
  ["Qwen3 GPU requirements guide", qwen3GuideHtml],
  ["gpt-oss hardware requirements guide", gptOssGuideHtml],
  ["DeepSeek V4 Flash GPU requirements guide", deepseekV4GuideHtml],
  ["GLM-5.2 GPU requirements guide", glm52GuideHtml],
  ["Kimi K3 GPU requirements guide", kimiK3GuideHtml],
  ["Gemma 4 GPU requirements guide", gemma4GuideHtml],
  ["DiffusionGemma GPU requirements guide", diffusionGemmaGuideHtml],
]) {
  assert.match(page, /<script type="module" src="\.\.\/reader-share\.js"><\/script>/, `${name} should load the reader sharing loop`);
}

assert.match(readerShareJs, /source: "reader_share"/);
assert.match(readerShareJs, /content: `\$\{slug\}_shared_guide`/);
assert.match(readerShareJs, /navigator\.share/);
assert.match(readerShareJs, /querySelector\("\.subscribe-block"\)/);
assert.match(readerShareJs, /insertAdjacentElement\("beforebegin", section\)/);
assert.match(readerShareJs, /href="#subscribe"/);
assert.match(readerShareJs, /installEvidenceCapture\(\{ trigger: "scroll" \}\)/);
assert.match(embedModeJs, /installEvidenceCapture\(\{ trigger: "interaction" \}\)/);
assert.match(conversionLoopJs, /researchaudio_evidence_rail_dismissed/);
assert.match(conversionLoopJs, /trigger === "interaction"/);
assert.match(conversionLoopJs, /progress < 0\.38/);
assert.match(conversionLoopJs, /href="#subscribe"/);
assert.match(conversionLoopJs, /get\("embed"\) === "1"/);
assert.match(labCss, /\.reader-share-loop/);
assert.match(labCss, /\.reader-share-button/);
assert.match(labCss, /\.evidence-capture-rail/);
assert.match(labCss, /\.evidence-capture-rail\.is-visible/);

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

assert.match(smallGpuGuideHtml, /<title>7B vs 13B LLM GPU Requirements: INT4, INT8 &amp; FP16 \| ResearchAudio<\/title>/);
assert.equal((smallGpuGuideHtml.match(/"@type": "TechArticle"/g) || []).length, 1, "7B versus 13B guide should have one TechArticle schema");
assert.equal((smallGpuGuideHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "7B versus 13B guide should have one FAQPage schema");
assert.doesNotThrow(() => parseStructuredData(smallGpuGuideHtml), "7B versus 13B guide structured data must be valid JSON");
assert.match(smallGpuGuideHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=7b_13b_llm_gpu_requirements&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab/);
assert.match(smallGpuGuideHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(smallGpuGuideHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.equal((smallGpuGuideHtml.match(/class="scenario-card/g) || []).length, 6, "7B versus 13B guide should contain six editable scenarios");
assert.match(smallGpuGuideHtml, /8\.71 GiB/);
assert.match(smallGpuGuideHtml, /13\.26 GiB/);
assert.match(smallGpuGuideHtml, /23\.11 GiB/);
assert.match(smallGpuGuideHtml, /37\.26 GiB/);
assert.doesNotMatch(smallGpuGuideHtml, /TODO|PLACEHOLDER|example\.com/);
for (const question of [
  "How much VRAM does a 7B LLM need?",
  "How much VRAM does a 13B LLM need?",
  "Can a 7B model run on an 8 GB GPU?",
  "Why can two 13B models need different amounts of VRAM?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(smallGpuGuideHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `7B versus 13B visible FAQ question missing: ${question}`);
  assert.match(smallGpuGuideHtml, new RegExp(`"name": "${escapedQuestion}"`), `7B versus 13B FAQ schema question missing: ${question}`);
}

for (const [name, page, title, source, officialUrl, values, questions] of [
  ["RTX 3060 12GB local LLM guide", rtx3060GuideHtml, "What LLM Can an RTX 3060 Run? 12GB VRAM Guide", "rtx_3060_llm_models", "https://www.nvidia.com/en-gb/geforce/graphics-cards/30-series/rtx-3060-3060ti/", ["9.98", "14.56", "14.27", "14.29", "11.18", "10.8"], [
    "What LLM can an RTX 3060 12GB run?",
    "Can an RTX 3060 12GB run Qwen3 8B?",
    "Can an RTX 3060 12GB run Qwen3 14B?",
    "Can an RTX 3060 12GB run gpt-oss-20b?",
  ]],
  ["RTX 4060 8GB local LLM guide", rtx4060GuideHtml, "What LLM Can an RTX 4060 Run? 8GB VRAM Guide", "rtx_4060_llm_models", "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/", ["5.26", "5.93", "7.28", "9.98", "7.26", "7.2"], [
    "What LLM can an RTX 4060 8GB run?",
    "Can an RTX 4060 run Qwen3 8B?",
    "Can an RTX 4060 run Qwen3 8B at 32K context?",
    "Can an RTX 4060 run a 13B model?",
  ]],
  ["RTX 4060 Ti 16GB local LLM guide", rtx4060Ti16GuideHtml, "What LLM Can an RTX 4060 Ti 16GB Run?", "rtx_4060_ti_16gb_llm_models", "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4060-4060ti/", ["9.98", "14.27", "14.29", "14.56", "27.93", "14.4"], [
    "What LLM can an RTX 4060 Ti 16GB run?",
    "Can an RTX 4060 Ti 16GB run Qwen3 14B?",
    "Can an RTX 4060 Ti 16GB run gpt-oss-20b?",
    "How do I tell the RTX 4060 Ti 16GB from the 8GB version?",
  ]],
  ["RTX 3090 versus RTX 4090 local LLM comparison", rtx3090Vs4090GuideHtml, "RTX 3090 vs 4090 for Local LLMs: Does 24GB Fit More?", "rtx_3090_vs_4090_local_llm", "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/", ["14.27", "20.64", "27.93", "14.29", "22.56", "32.60", "21.6"], [
    "Does an RTX 4090 fit larger local LLMs than an RTX 3090?",
    "Can an RTX 3090 or RTX 4090 run Qwen3 30B-A3B?",
    "Can an RTX 3090 or RTX 4090 run Qwen3 32B at 32K?",
    "Which is better for local LLMs, RTX 3090 or RTX 4090?",
  ]],
  ["RTX 4090 local LLM guide", rtx4090GuideHtml, "What LLM Can an RTX 4090 Run? 24GB VRAM Guide", "rtx_4090_llm_models", "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4090/", ["14.27", "20.64", "27.93", "14.29", "22.56", "32.60"], [
    "What LLM can an RTX 4090 run?",
    "Can an RTX 4090 run Qwen3 32B?",
    "Can an RTX 4090 run gpt-oss-20b?",
    "Can an RTX 4090 run a 70B model entirely in VRAM?",
  ]],
  ["RTX 5060 Ti 8GB versus 16GB local LLM comparison", rtx5060TiComparisonGuideHtml, "RTX 5060 Ti 8GB vs 16GB for Local LLMs", "rtx_5060_ti_8gb_vs_16gb_local_llm", "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5060-family/", ["5.26", "5.93", "7.28", "9.98", "14.27", "14.29", "7.2", "14.4"], [
    "Should I buy the RTX 5060 Ti 8GB or 16GB for local LLMs?",
    "Can the RTX 5060 Ti 8GB run Qwen3 8B?",
    "Can the RTX 5060 Ti 16GB run Qwen3 14B?",
    "How do I verify whether an RTX 5060 Ti has 8GB or 16GB?",
  ]],
  ["RTX 4070 Super versus RTX 4070 Ti Super local LLM comparison", rtx4070SuperComparisonGuideHtml, "12GB vs 16GB VRAM for Local LLMs (RTX 4070)", "rtx_4070_super_vs_4070_ti_super_local_llm", "https://www.nvidia.com/en-us/geforce/graphics-cards/40-series/rtx-4070-family/", ["9.98", "14.27", "14.29", "14.56", "27.93", "10.8", "14.4"], [
    "Which is better for local LLMs, RTX 4070 Super or RTX 4070 Ti Super?",
    "What LLM can an RTX 4070 Super 12GB run?",
    "Can an RTX 4070 Ti Super 16GB run Qwen3 14B?",
    "Is 16GB VRAM enough for a 32B local LLM?",
  ]],
  ["RTX 5080 local LLM guide", rtx5080GuideHtml, "What LLM Can an RTX 5080 Run? 16GB VRAM Guide", "rtx_5080_llm_models", "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5080/", ["9.98", "14.27", "14.29", "14.56", "27.93", "10.8"], [
    "What LLM can an RTX 5080 run?",
    "Can an RTX 5080 run Qwen3 14B?",
    "Can an RTX 5080 run gpt-oss-20b?",
    "Can an RTX 5080 run Qwen3 32B?",
  ]],
  ["RTX 5090 local LLM guide", rtx5090GuideHtml, "What LLM Can an RTX 5090 Run? 32GB VRAM Guide", "rtx_5090_llm_models", "https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/", ["20.64", "27.93", "22.56", "46.26", "32.60", "21.6"], [
    "What LLM can an RTX 5090 run?",
    "Can an RTX 5090 run Qwen3 32B?",
    "Can an RTX 5090 run gpt-oss-20b at 128K context?",
    "Can an RTX 5090 run a 70B model entirely in VRAM?",
  ]],
]) {
  assert.match(page, new RegExp(`<title>${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\| ResearchAudio<\\/title>`), `${name} title missing`);
  assert.equal((page.match(/"@type": "TechArticle"/g) || []).length, 1, `${name} should have one TechArticle schema`);
  assert.equal((page.match(/"@type": "FAQPage"/g) || []).length, 1, `${name} should have one FAQPage schema`);
  assert.doesNotThrow(() => parseStructuredData(page), `${name} structured data must be valid JSON`);
  assert.match(page, new RegExp(`https:\\/\\/researchaudio\\.io\\/subscribe\\?utm_source=${source}&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab`), `${name} direct subscribe attribution missing`);
  assert.match(page, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/, `${name} Beehiiv form missing`);
  assert.match(page, /subscribe-forms\.beehiiv\.com\/attribution\.js/, `${name} attribution missing`);
  assert.match(page, /<header class="lab-header"/, `${name} should use the Evidence Lab header`);
  assert.match(page, /<main class="lab-main">/, `${name} should use the responsive Evidence Lab content width`);
  assert.match(page, /<aside class="lab-index"/, `${name} should expose the hardware capacity callout`);
  assert.match(page, /class="scenario-grid guide-scenario-grid"/, `${name} should use the responsive scenario grid`);
  assert.match(page, /<section class="subscribe-block"/, `${name} should use the established signup layout`);
  assert.equal((page.match(/class="scenario-card/g) || []).length, 6, `${name} should contain six evidence scenarios`);
  assert.match(page, new RegExp(officialUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${name} official NVIDIA source missing`);
  for (const value of values) {
    assert.match(page, new RegExp(`${value.replace(".", "\\.")} GiB`), `${name} should expose the ${value} GiB planning value`);
  }
  assert.doesNotMatch(page, /TODO|PLACEHOLDER|example\.com/, `${name} contains placeholder copy`);
  for (const question of questions) {
    const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(page, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `${name} visible FAQ question missing: ${question}`);
    assert.match(page, new RegExp(`"name": "${escapedQuestion}"`), `${name} FAQ schema question missing: ${question}`);
  }
}

assert.match(rtx3090Vs4090GuideHtml, /GEFORCE_RTX_3090_USER_GUIDE_v01\.pdf/, "RTX 3090 versus RTX 4090 comparison should cite NVIDIA's RTX 3090 guide");

assert.match(macMiniM4GuideHtml, /<title>Mac mini M4 for Local LLMs: 16GB to 64GB Guide \| ResearchAudio<\/title>/);
assert.equal((macMiniM4GuideHtml.match(/"@type": "TechArticle"/g) || []).length, 1, "Mac mini guide should have one TechArticle schema");
assert.equal((macMiniM4GuideHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "Mac mini guide should have one FAQ schema");
assert.doesNotThrow(() => parseStructuredData(macMiniM4GuideHtml), "Mac mini guide structured data must be valid JSON");
assert.equal((macMiniM4GuideHtml.match(/class="scenario-card/g) || []).length, 6, "Mac mini guide should contain six editable scenarios");
assert.match(macMiniM4GuideHtml, /https:\/\/support\.apple\.com\/en-us\/121555/);
assert.match(macMiniM4GuideHtml, /https:\/\/github\.com\/ml-explore\/mlx/);
assert.match(macMiniM4GuideHtml, /usableVramPercent=75/);
assert.match(macMiniM4GuideHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=mac_mini_m4_local_llm&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab/);
for (const value of ["9.98", "14.27", "14.29", "27.93", "39.12", "12", "18", "24", "36", "48"]) {
  assert.match(macMiniM4GuideHtml, new RegExp(`${value.replace(".", "\\.")} GiB`), `Mac mini guide should expose the ${value} GiB planning value`);
}
for (const question of [
  "Is a 16GB Mac mini M4 enough for local LLMs?",
  "Should I choose 24GB or 32GB unified memory for local LLMs?",
  "Can a 48GB Mac mini M4 Pro run a 32B local LLM?",
  "Is unified memory the same as GPU VRAM?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(macMiniM4GuideHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `Mac mini visible FAQ question missing: ${question}`);
  assert.match(macMiniM4GuideHtml, new RegExp(`"name": "${escapedQuestion}"`), `Mac mini FAQ schema question missing: ${question}`);
}
assert.match(rtx3060GuideHtml, /rtx-4070-super-vs-4070-ti-super-local-llm/);
assert.match(rtx4060Ti16GuideHtml, /rtx-4070-super-vs-4070-ti-super-local-llm/);
assert.match(rtx5080GuideHtml, /rtx-4070-super-vs-4070-ti-super-local-llm/);
assert.match(finderHtml, /mac-mini-m4-local-llm/);
assert.match(compatibilityHtml, /mac-mini-m4-local-llm/);

assert.match(gptOssGuideHtml, /<title>gpt-oss 20B &amp; 120B Hardware Requirements \| ResearchAudio<\/title>/);
assert.equal((gptOssGuideHtml.match(/"@type": "TechArticle"/g) || []).length, 1, "gpt-oss guide should have one TechArticle schema");
assert.equal((gptOssGuideHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "gpt-oss guide should have one FAQPage schema");
assert.doesNotThrow(() => parseStructuredData(gptOssGuideHtml), "gpt-oss guide structured data must be valid JSON");
assert.match(gptOssGuideHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=gpt_oss_hardware_requirements&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab/);
assert.match(gptOssGuideHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(gptOssGuideHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(gptOssGuideHtml, /utm_content=direct_join/);
assert.match(gptOssGuideHtml, /subscribe-direct-fallback/);
assert.match(labCss, /\.subscribe-direct-fallback/);
assert.equal((gptOssGuideHtml.match(/class="scenario-card/g) || []).length, 4, "gpt-oss guide should contain four editable scenarios");
assert.match(gptOssGuideHtml, /bitsPerParameter=4\.25/);
assert.match(gptOssGuideHtml, /checkpointGiB=12\.8/);
assert.match(gptOssGuideHtml, /checkpointGiB=60\.8/);
assert.match(gptOssGuideHtml, /openai\.com\/index\/introducing-gpt-oss/);
assert.match(gptOssGuideHtml, /deploymentsafety\.openai\.com\/gpt-oss\/architecture/);
assert.match(gptOssGuideHtml, /huggingface\.co\/openai\/gpt-oss-20b\/blob\/main\/config\.json/);
assert.match(gptOssGuideHtml, /huggingface\.co\/openai\/gpt-oss-120b\/blob\/main\/config\.json/);
for (const question of [
  "How much memory does gpt-oss-20b need?",
  "How much GPU memory does gpt-oss-120b need?",
  "Why are active parameters smaller than the memory requirement?",
  "How does 128K context affect gpt-oss memory?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(gptOssGuideHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `gpt-oss visible FAQ question missing: ${question}`);
  assert.match(gptOssGuideHtml, new RegExp(`"name": "${escapedQuestion}"`), `gpt-oss FAQ schema question missing: ${question}`);
}

assert.match(qwen3GuideHtml, /<title>Qwen3 GPU Requirements: 8B, 14B &amp; 32B VRAM \| ResearchAudio<\/title>/);
assert.equal((qwen3GuideHtml.match(/"@type": "TechArticle"/g) || []).length, 1, "Qwen3 guide should have one TechArticle schema");
assert.equal((qwen3GuideHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "Qwen3 guide should have one FAQPage schema");
assert.doesNotThrow(() => parseStructuredData(qwen3GuideHtml), "Qwen3 guide structured data must be valid JSON");
assert.match(qwen3GuideHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=qwen3_gpu_requirements&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab/);
assert.match(qwen3GuideHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(qwen3GuideHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.equal((qwen3GuideHtml.match(/class="scenario-card/g) || []).length, 4, "Qwen3 guide should contain four editable scenarios");
assert.match(qwen3GuideHtml, /parameterBillions=8\.2/);
assert.match(qwen3GuideHtml, /parameterBillions=14\.8/);
assert.match(qwen3GuideHtml, /parameterBillions=32\.8/);
assert.match(qwen3GuideHtml, /parameterBillions=30\.5/);
assert.match(qwen3GuideHtml, /11,001 MB/);
assert.match(qwen3GuideHtml, /15,323 MB/);
assert.match(qwen3GuideHtml, /27,718 MB/);
assert.match(qwen3GuideHtml, /huggingface\.co\/Qwen\/Qwen3-8B/);
assert.match(qwen3GuideHtml, /huggingface\.co\/Qwen\/Qwen3-14B/);
assert.match(qwen3GuideHtml, /huggingface\.co\/Qwen\/Qwen3-32B/);
assert.match(qwen3GuideHtml, /huggingface\.co\/Qwen\/Qwen3-30B-A3B/);
assert.match(qwen3GuideHtml, /qwen\.readthedocs\.io\/en\/stable\/getting_started\/speed_benchmark\.html/);
assert.doesNotMatch(qwen3GuideHtml, /TODO|PLACEHOLDER|example\.com/);
for (const question of [
  "How much GPU memory does Qwen3 8B need?",
  "How much GPU memory does Qwen3 14B need?",
  "How much GPU memory does Qwen3 32B need?",
  "Does Qwen3 30B-A3B only need memory for 3.3B active parameters?",
  "How does 128K context change Qwen3 VRAM requirements?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(qwen3GuideHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `Qwen3 visible FAQ question missing: ${question}`);
  assert.match(qwen3GuideHtml, new RegExp(`"name": "${escapedQuestion}"`), `Qwen3 FAQ schema question missing: ${question}`);
}

assert.match(deepseekV4GuideHtml, /<title>DeepSeek V4 Flash 0731 GPU Requirements \| ResearchAudio<\/title>/);
assert.equal((deepseekV4GuideHtml.match(/"@type": "TechArticle"/g) || []).length, 1, "DeepSeek V4 guide should have one TechArticle schema");
assert.equal((deepseekV4GuideHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "DeepSeek V4 guide should have one FAQPage schema");
assert.doesNotThrow(() => parseStructuredData(deepseekV4GuideHtml), "DeepSeek V4 guide structured data must be valid JSON");
assert.match(deepseekV4GuideHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=deepseek_v4_flash_gpu_requirements&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab/);
assert.match(deepseekV4GuideHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(deepseekV4GuideHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(deepseekV4GuideHtml, /utm_content=direct_join/);
assert.match(deepseekV4GuideHtml, /subscribe-direct-fallback/);
assert.equal((deepseekV4GuideHtml.match(/class="scenario-card/g) || []).length, 4, "DeepSeek V4 guide should contain four editable scenarios");
assert.match(deepseekV4GuideHtml, /parameterBillions=284/);
assert.match(deepseekV4GuideHtml, /checkpointGiB=155\.43/);
assert.match(deepseekV4GuideHtml, /contextTokens=1048576/);
assert.match(deepseekV4GuideHtml, /166,886,535,336 bytes/);
assert.match(deepseekV4GuideHtml, /huggingface\.co\/deepseek-ai\/DeepSeek-V4-Flash-0731/);
assert.match(deepseekV4GuideHtml, /arxiv\.org\/abs\/2606\.19348/);
assert.match(deepseekV4GuideHtml, /DSpark speculative-decoding module/);
assert.doesNotMatch(deepseekV4GuideHtml, /TODO|PLACEHOLDER|example\.com/);
for (const question of [
  "How much GPU memory does DeepSeek V4 Flash need?",
  "Can DeepSeek V4 Flash run on two 80 GB GPUs?",
  "Why does a 13B-active model need the full 155.43 GiB checkpoint?",
  "How does the one-million-token context affect DeepSeek V4 Flash VRAM?",
  "What changed in DeepSeek V4 Flash 0731?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(deepseekV4GuideHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `DeepSeek V4 visible FAQ question missing: ${question}`);
  assert.match(deepseekV4GuideHtml, new RegExp(`"name": "${escapedQuestion}"`), `DeepSeek V4 FAQ schema question missing: ${question}`);
}

assert.match(glm52GuideHtml, /<title>GLM-5\.2 GPU Requirements: 8×H200 FP8 \| ResearchAudio<\/title>/);
assert.equal((glm52GuideHtml.match(/"@type": "TechArticle"/g) || []).length, 1, "GLM-5.2 guide should have one TechArticle schema");
assert.equal((glm52GuideHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "GLM-5.2 guide should have one FAQPage schema");
assert.doesNotThrow(() => parseStructuredData(glm52GuideHtml), "GLM-5.2 guide structured data must be valid JSON");
assert.match(glm52GuideHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=glm_5_2_gpu_requirements&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab/);
assert.match(glm52GuideHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(glm52GuideHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(glm52GuideHtml, /utm_content=direct_join/);
assert.match(glm52GuideHtml, /subscribe-direct-fallback/);
assert.equal((glm52GuideHtml.match(/class="scenario-card/g) || []).length, 4, "GLM-5.2 guide should contain four editable scenarios");
assert.match(glm52GuideHtml, /parameterBillions=753\.38/);
assert.match(glm52GuideHtml, /checkpointGiB=703\.74/);
assert.match(glm52GuideHtml, /checkpointGiB=1403\.19/);
assert.match(glm52GuideHtml, /755,632,050,320 bytes/);
assert.match(glm52GuideHtml, /huggingface\.co\/zai-org\/GLM-5\.2-FP8/);
assert.match(glm52GuideHtml, /recipes\.vllm\.ai\/zai-org\/GLM-5\.2/);
assert.match(glm52GuideHtml, /arxiv\.org\/abs\/2602\.15763/);
assert.doesNotMatch(glm52GuideHtml, /TODO|PLACEHOLDER|example\.com/);
for (const question of [
  "How much GPU memory does GLM-5.2 need?",
  "Can GLM-5.2 run on eight 80 GB GPUs?",
  "How many H200 GPUs does GLM-5.2 need?",
  "What hardware supports the full GLM-5.2 one-million-token context?",
  "How large are the GLM-5.2 BF16 and FP8 checkpoints?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(glm52GuideHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `GLM-5.2 visible FAQ question missing: ${question}`);
  assert.match(glm52GuideHtml, new RegExp(`"name": "${escapedQuestion}"`), `GLM-5.2 FAQ schema question missing: ${question}`);
}

assert.match(kimiK3GuideHtml, /<title>Kimi K3 GPU Requirements: 1\.56 TB, 64\+ Accelerators \| ResearchAudio<\/title>/);
assert.equal((kimiK3GuideHtml.match(/"@type": "TechArticle"/g) || []).length, 1, "Kimi K3 guide should have one TechArticle schema");
assert.equal((kimiK3GuideHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "Kimi K3 guide should have one FAQPage schema");
assert.doesNotThrow(() => parseStructuredData(kimiK3GuideHtml), "Kimi K3 guide structured data must be valid JSON");
assert.match(kimiK3GuideHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=kimi_k3_gpu_requirements&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab/);
assert.match(kimiK3GuideHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(kimiK3GuideHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(kimiK3GuideHtml, /utm_content=direct_join/);
assert.match(kimiK3GuideHtml, /subscribe-direct-fallback/);
assert.equal((kimiK3GuideHtml.match(/class="scenario-card/g) || []).length, 4, "Kimi K3 guide should contain four deployment scenarios");
assert.match(kimiK3GuideHtml, /parameterBillions=2800/);
assert.match(kimiK3GuideHtml, /checkpointGiB=1453\.74/);
assert.match(kimiK3GuideHtml, /1,560,936,091,448 bytes/);
assert.match(kimiK3GuideHtml, /huggingface\.co\/moonshotai\/Kimi-K3/);
assert.match(kimiK3GuideHtml, /kimi\.com\/blog\/kimi-k3/);
assert.doesNotMatch(kimiK3GuideHtml, /TODO|PLACEHOLDER|example\.com/);
for (const question of [
  "How much GPU memory does Kimi K3 need?",
  "Can Kimi K3 run on eight H200 GPUs?",
  "What is the minimum H200 count for Kimi K3?",
  "Why does Moonshot recommend 64 or more accelerators for Kimi K3?",
  "Does Kimi K3 support a one-million-token context window?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(kimiK3GuideHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `Kimi K3 visible FAQ question missing: ${question}`);
  assert.match(kimiK3GuideHtml, new RegExp(`"name": "${escapedQuestion}"`), `Kimi K3 FAQ schema question missing: ${question}`);
}

assert.match(gemma4GuideHtml, /<title>Gemma 4 GPU Requirements: E2B, E4B, 12B, 26B &amp; 31B \| ResearchAudio<\/title>/);
assert.equal((gemma4GuideHtml.match(/"@type": "TechArticle"/g) || []).length, 1, "Gemma 4 guide should have one TechArticle schema");
assert.equal((gemma4GuideHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "Gemma 4 guide should have one FAQPage schema");
assert.doesNotThrow(() => parseStructuredData(gemma4GuideHtml), "Gemma 4 guide structured data must be valid JSON");
assert.match(gemma4GuideHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=gemma_4_gpu_requirements&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab/);
assert.match(gemma4GuideHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(gemma4GuideHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(gemma4GuideHtml, /utm_content=direct_join/);
assert.match(gemma4GuideHtml, /subscribe-direct-fallback/);
assert.equal((gemma4GuideHtml.match(/class="scenario-card/g) || []).length, 4, "Gemma 4 guide should contain four deployment scenarios");
assert.match(gemma4GuideHtml, /checkpointGiB=6\.66/);
assert.match(gemma4GuideHtml, /checkpointGiB=22\.28/);
assert.match(gemma4GuideHtml, /23,919,549,408 bytes/);
assert.match(gemma4GuideHtml, /7,150,994,912 bytes/);
assert.match(gemma4GuideHtml, /ai\.google\.dev\/gemma\/docs\/core/);
assert.match(gemma4GuideHtml, /huggingface\.co\/google\/gemma-4-12B/);
assert.doesNotMatch(gemma4GuideHtml, /TODO|PLACEHOLDER|example\.com/);
for (const question of [
  "How much GPU memory does Gemma 4 12B need?",
  "Can Gemma 4 12B run on an 8 GB GPU?",
  "How much GPU memory does Gemma 4 26B A4B need?",
  "How much GPU memory does Gemma 4 31B need?",
  "Do Gemma 4 memory estimates include KV cache?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(gemma4GuideHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `Gemma 4 visible FAQ question missing: ${question}`);
  assert.match(gemma4GuideHtml, new RegExp(`"name": "${escapedQuestion}"`), `Gemma 4 FAQ schema question missing: ${question}`);
}

assert.match(diffusionGemmaGuideHtml, /<title>DiffusionGemma GPU Requirements: BF16, NVFP4 &amp; 256K \| ResearchAudio<\/title>/);
assert.equal((diffusionGemmaGuideHtml.match(/"@type": "TechArticle"/g) || []).length, 1, "DiffusionGemma guide should have one TechArticle schema");
assert.equal((diffusionGemmaGuideHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "DiffusionGemma guide should have one FAQPage schema");
assert.doesNotThrow(() => parseStructuredData(diffusionGemmaGuideHtml), "DiffusionGemma guide structured data must be valid JSON");
assert.match(diffusionGemmaGuideHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=diffusiongemma_gpu_requirements&amp;utm_medium=organic_guide&amp;utm_campaign=ai_evidence_lab/);
assert.match(diffusionGemmaGuideHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(diffusionGemmaGuideHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(diffusionGemmaGuideHtml, /utm_content=direct_join/);
assert.match(diffusionGemmaGuideHtml, /subscribe-direct-fallback/);
assert.equal((diffusionGemmaGuideHtml.match(/class="scenario-card/g) || []).length, 4, "DiffusionGemma guide should contain four deployment scenarios");
assert.match(diffusionGemmaGuideHtml, /checkpointGiB=17\.53/);
assert.match(diffusionGemmaGuideHtml, /checkpointGiB=48\.10/);
assert.match(diffusionGemmaGuideHtml, /51,647,701,024 bytes/);
assert.match(diffusionGemmaGuideHtml, /18,823,855,888 bytes/);
assert.match(diffusionGemmaGuideHtml, /huggingface\.co\/google\/diffusiongemma-26B-A4B-it/);
assert.match(diffusionGemmaGuideHtml, /huggingface\.co\/nvidia\/diffusiongemma-26B-A4B-it-NVFP4/);
assert.doesNotMatch(diffusionGemmaGuideHtml, /TODO|PLACEHOLDER|example\.com/);
for (const question of [
  "How much GPU memory does DiffusionGemma need?",
  "Can DiffusionGemma run on a 24 GB GPU?",
  "Can DiffusionGemma BF16 run on one 48 GB GPU?",
  "Does DiffusionGemma only store its 3.8B active parameters?",
  "How does 256K context affect DiffusionGemma GPU memory?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(diffusionGemmaGuideHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `DiffusionGemma visible FAQ question missing: ${question}`);
  assert.match(diffusionGemmaGuideHtml, new RegExp(`"name": "${escapedQuestion}"`), `DiffusionGemma FAQ schema question missing: ${question}`);
}

for (const [name, page] of [
  ["scorecard", html],
  ["hub", toolsHtml],
  ["cost calculator", costHtml],
  ["loop diagnostic", loopHtml],
  ["AI task fit diagnostic", taskFitHtml],
  ["AI agent security checklist", securityGuideHtml],
  ["AI benchmark audit checklist", benchmarkGuideHtml],
  ["agent ROI calculator", roiHtml],
  ["LLM API cost calculator", llmCostHtml],
  ["LLM GPU memory calculator", gpuMemoryHtml],
  ["LLM KV cache calculator", kvCacheHtml],
  ["prompt caching calculator", promptCacheHtml],
  ["Codex config generator", codexConfigHtml],
  ["Codex exec command builder", codexExecHtml],
  ["voice AI latency calculator", voiceLatencyHtml],
  ["voice AI cost calculator", voiceCostHtml],
]) {
  assert.match(page, /https:\/\/researchaudio\.io\/subscribe\?utm_source=/, `${name} direct subscribe CTA missing`);
  assert.match(page, /utm_campaign=ai_evidence_lab/, `${name} acquisition campaign missing`);
  assert.match(page, /utm_content=(header_join|hero_join|result_join)/, `${name} CTA placement attribution missing`);
  assert.match(page, /51,000\+/, `${name} subscriber proof missing`);
}

for (const [name, page] of [
  ["scorecard", html],
  ["cost calculator", costHtml],
  ["loop diagnostic", loopHtml],
  ["AI task fit diagnostic", taskFitHtml],
  ["agent ROI calculator", roiHtml],
  ["LLM API cost calculator", llmCostHtml],
  ["LLM GPU memory calculator", gpuMemoryHtml],
  ["LLM KV cache calculator", kvCacheHtml],
  ["prompt caching calculator", promptCacheHtml],
  ["Codex config generator", codexConfigHtml],
  ["Codex exec command builder", codexExecHtml],
  ["voice AI latency calculator", voiceLatencyHtml],
  ["voice AI cost calculator", voiceCostHtml],
]) {
  assert.match(page, /class="result-join"[\s\S]*?href="#subscribe"/, `${name} result CTA must keep visitors on the page`);
  assert.match(page, /<section class="subscribe-(?:block|section)" id="subscribe"/, `${name} inline subscribe destination missing`);
}

for (const [name, page, title] of [
  ["hub", toolsHtml, "Free AI Evaluation Tools for Builders"],
  ["cost calculator", costHtml, "AI Cost per Successful Task Calculator"],
  ["loop diagnostic", loopHtml, "AI Agent Loop Diagnostic Checklist"],
  ["AI task fit diagnostic", taskFitHtml, "AI Task Fit Diagnostic: Error Signal Checklist"],
  ["agent ROI calculator", roiHtml, "AI Agent ROI Calculator with Failure & Review"],
  ["LLM API cost calculator", llmCostHtml, "LLM API Cost Calculator (Input &amp; Output Tokens)"],
  ["LLM GPU memory calculator", gpuMemoryHtml, "LLM GPU Memory Calculator (VRAM &amp; GPU Count)"],
  ["LLM KV cache calculator", kvCacheHtml, "LLM KV Cache Calculator (VRAM &amp; Concurrency)"],
  ["prompt caching calculator", promptCacheHtml, "Prompt Caching Cost Calculator &amp; Break-Even Hit Rate"],
  ["Codex config generator", codexConfigHtml, "Codex CLI config.toml Generator"],
  ["Codex exec command builder", codexExecHtml, "Codex exec Command Builder (--json &amp; Git Check)"],
  ["voice AI latency calculator", voiceLatencyHtml, "Voice AI Architecture: Fast + Slow Model Latency Calculator"],
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
  ["Codex exec command builder", codexExecHtml, [
    "What does codex exec --json output?",
    "How do I fix Not inside a trusted directory in Codex CLI?",
    "Does --skip-git-repo-check disable the Codex sandbox?",
    "How do Codex output schema and last-message files differ?",
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
assert.match(labCss, /\.tool-distribution/);
assert.match(labCss, /\.embed-card:target/);
assert.match(css, /\.result-join/);
assert.equal((loopHtml.match(/type="checkbox"/g) || []).length, 10, "expected ten loop controls");
assert.equal(controls.length, 10, "diagnostic logic and markup should share ten controls");
assert.equal((taskFitHtml.match(/type="checkbox"/g) || []).length, 8, "task-fit diagnostic should render eight controls");
assert.equal(taskFitControls.length, 8, "task-fit logic and markup should share eight controls");
assert.equal(classifyTask([]).status, "NO TARGET");
assert.equal(classifyTask(["target", "judge"]).status, "WEAK SIGNAL");
assert.equal(classifyTask(["target", "judge", "cadence", "evidence"]).status, "FRAGILE");
assert.equal(classifyTask(["target", "judge", "cadence", "evidence", "coverage"]).status, "EXPOSED");
assert.equal(classifyTask(taskFitControls.map((control) => control.name)).status, "READY");
assert.match(taskFitJs, /source: "task_fit_diagnostic_share"/);
assert.match(taskFitJs, /content: `shared_task_fit_\$\{selected\.length\}`/);
assert.equal((taskFitHtml.match(/"@type": "WebApplication"/g) || []).length, 1, "task-fit diagnostic should have WebApplication schema");
assert.equal((taskFitHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "task-fit diagnostic should have FAQ schema");
assert.doesNotThrow(() => parseStructuredData(taskFitHtml), "task-fit structured data must be valid JSON");
assert.match(taskFitHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(taskFitHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(taskFitHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=ai_task_fit_diagnostic&amp;utm_medium=(organic_guide|tool_result)&amp;utm_campaign=ai_evidence_lab/);
assert.match(taskFitHtml, /researchaudio\.io\/p\/einstein-had-no-error-signal\?utm_source=ai_task_fit_diagnostic/);
assert.match(taskFitHtml, /tomzahavy\.com\/files\/llms-cant-jump\.pdf/);
for (const question of [
  "What is an error signal in an AI system?",
  "What makes a task suitable for an AI agent?",
  "Can an LLM choose the goal for an open-ended task?",
  "Is this AI task-fit score a benchmark?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(taskFitHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `task-fit visible FAQ question missing: ${question}`);
  assert.match(taskFitHtml, new RegExp(`"name": "${escapedQuestion}"`), `task-fit FAQ schema question missing: ${question}`);
}
assert.doesNotMatch(taskFitHtml, /TODO|PLACEHOLDER|example\.com/);

const certain = calculateCost({ modelCost: 1, successRate: 100, maxAttempts: 4, reviewMinutes: 0, hourlyCost: 0 });
assert.equal(certain.costPerSuccess, 1, "certain success should cost one attempt");
const retry = calculateCost({ modelCost: 1, successRate: 50, maxAttempts: 2, reviewMinutes: 0, hourlyCost: 0 });
assert.equal(retry.expectedAttempts, 1.5);
assert.equal(retry.eventualSuccess, 0.75);
assert.equal(retry.costPerSuccess, 2);
assert.equal(classifyLoop(0).status, "BLIND");
assert.equal(classifyLoop(7).status, "EXPOSED");
assert.equal(classifyLoop(10).status, "CONTROLLED");

assert.equal(securityControls.length, 12, "agent security checklist should expose twelve controls");
assert.equal(classifyAgentSecurity(0).status, "OPEN");
assert.equal(classifyAgentSecurity(4).status, "PARTIAL");
assert.equal(classifyAgentSecurity(8).status, "GUARDED");
assert.equal(classifyAgentSecurity(12).status, "HARDENED");
assert.match(securityGuideJs, /source: "agent_security_checklist_share"/);
assert.match(securityGuideJs, /content: `shared_security_\$\{score\}`/);
assert.match(securityGuideHtml, /<title>AI Agent Security Checklist: 12 Controls \| ResearchAudio<\/title>/);
assert.equal((securityGuideHtml.match(/type="checkbox"/g) || []).length, 12, "security guide should render twelve control checks");
assert.equal((securityGuideHtml.match(/"@type": "WebApplication"/g) || []).length, 1, "security guide should have WebApplication schema");
assert.equal((securityGuideHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "security guide should have FAQ schema");
assert.doesNotThrow(() => parseStructuredData(securityGuideHtml), "security guide structured data must be valid JSON");
assert.match(securityGuideHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(securityGuideHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(securityGuideHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=ai_agent_security_checklist&amp;utm_medium=(organic_guide|tool_result)&amp;utm_campaign=ai_evidence_lab/);
assert.match(securityGuideHtml, /utm_content=direct_join/);
assert.match(securityGuideHtml, /genai\.owasp\.org/);
assert.match(securityGuideHtml, /code\.claude\.com\/docs\/en\/security/);
assert.match(securityGuideHtml, /airc\.nist\.gov/);
assert.doesNotMatch(securityGuideHtml, /TODO|PLACEHOLDER|example\.com/);

assert.equal(benchmarkControls.length, 12, "benchmark audit should expose twelve reproducibility checks");
assert.equal(classifyBenchmarkAudit(0).status, "CLAIM");
assert.equal(classifyBenchmarkAudit(4).status, "PARTIAL");
assert.equal(classifyBenchmarkAudit(8).status, "DECISION-USEFUL");
assert.equal(classifyBenchmarkAudit(12).status, "REPRODUCIBLE");
assert.match(benchmarkGuideJs, /source: "ai_benchmark_audit_checklist_share"/);
assert.match(benchmarkGuideJs, /content: `shared_benchmark_\$\{score\}`/);
assert.match(benchmarkGuideHtml, /<title>AI Benchmark Audit Checklist: 12 Reproducibility Checks \| ResearchAudio<\/title>/);
assert.equal((benchmarkGuideHtml.match(/type="checkbox"/g) || []).length, 12, "benchmark audit should render twelve protocol checks");
assert.equal((benchmarkGuideHtml.match(/"@type": "WebApplication"/g) || []).length, 1, "benchmark audit should have WebApplication schema");
assert.equal((benchmarkGuideHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "benchmark audit should have FAQ schema");
assert.doesNotThrow(() => parseStructuredData(benchmarkGuideHtml), "benchmark audit structured data must be valid JSON");
assert.match(benchmarkGuideHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(benchmarkGuideHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(benchmarkGuideHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=ai_benchmark_audit_checklist&amp;utm_medium=(organic_guide|tool_result)&amp;utm_campaign=ai_evidence_lab/);
assert.match(benchmarkGuideHtml, /utm_content=direct_join/);
assert.match(benchmarkGuideHtml, /developers\.openai\.com\/api\/docs\/guides\/evaluation-best-practices/);
assert.match(benchmarkGuideHtml, /platform\.claude\.com\/docs\/en\/test-and-evaluate\/develop-tests/);
assert.match(benchmarkGuideHtml, /metr\.org\/blog\/2026-1-29-time-horizon-1-1/);
assert.match(benchmarkGuideHtml, /github\.com\/harbor-framework\/terminal-bench/);
assert.doesNotMatch(benchmarkGuideHtml, /TODO|PLACEHOLDER|example\.com/);

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
  { name: "7B GQA INT4", parameters: 7, layers: 32, kvHeads: 8, target: 8.71 },
  { name: "7B GQA INT8", parameters: 7, layers: 32, kvHeads: 8, bits: 8, target: 12.62 },
  { name: "7B GQA FP16", parameters: 7, layers: 32, kvHeads: 8, bits: 16, target: 20.45 },
  { name: "13B GQA INT4", parameters: 13, layers: 40, kvHeads: 8, target: 13.26 },
  { name: "13B GQA INT8", parameters: 13, layers: 40, kvHeads: 8, bits: 8, target: 20.53 },
  { name: "13B GQA FP16", parameters: 13, layers: 40, kvHeads: 8, bits: 16, target: 35.06 },
  { name: "7B MHA INT4", parameters: 7, layers: 32, kvHeads: 32, target: 23.11 },
  { name: "13B MHA INT4", parameters: 13, layers: 40, kvHeads: 40, target: 37.26 },
]) {
  const result = calculateGpuMemory({
    parameterBillions: scenario.parameters,
    bitsPerParameter: scenario.bits || 4,
    layers: scenario.layers,
    kvHeads: scenario.kvHeads,
    headDimension: 128,
    contextTokens: 32768,
    concurrentSequences: 1,
    kvCacheBits: 16,
    inferenceHeadroom: 20,
    vramPerGpu: 48,
    usableVramPercent: 90,
    availableGpus: 1,
  });
  assert.equal(Number(result.planningTargetGiB.toFixed(2)), scenario.target, `${scenario.name} target should match the guide`);
}
const gptOss20b4k = calculateGpuMemory({
  parameterBillions: 20.91,
  bitsPerParameter: 4.25,
  checkpointGiB: 12.8,
  layers: 24,
  kvHeads: 8,
  headDimension: 64,
  contextTokens: 4096,
  concurrentSequences: 1,
  kvCacheBits: 16,
  inferenceHeadroom: 10,
  vramPerGpu: 16,
  usableVramPercent: 95,
  availableGpus: 1,
});
assert.equal(gptOss20b4k.precisionLabel, "Checkpoint override");
assert.equal(gptOss20b4k.usesCheckpointOverride, true);
assert.equal(gptOss20b4k.weightMemoryGiB, 12.8);
assert.equal(Number(gptOss20b4k.planningTargetGiB.toFixed(2)), 14.29);
assert.equal(gptOss20b4k.minimumGpus, 1);
assert.equal(gptOss20b4k.fitsAvailable, true);
const gptOss120b128k = calculateGpuMemory({
  parameterBillions: 116.83,
  bitsPerParameter: 4.25,
  checkpointGiB: 60.8,
  layers: 36,
  kvHeads: 8,
  headDimension: 64,
  contextTokens: 131072,
  concurrentSequences: 1,
  kvCacheBits: 16,
  inferenceHeadroom: 20,
  vramPerGpu: 80,
  usableVramPercent: 90,
  availableGpus: 2,
});
assert.equal(Number(gptOss120b128k.planningTargetGiB.toFixed(2)), 83.76);
assert.equal(gptOss120b128k.minimumGpus, 2);
assert.equal(gptOss120b128k.fitsAvailable, true);
assert.match(gpuMemoryHtml, /value="4\.25">MXFP4 · 4\.25-bit floor/);
assert.match(gpuMemoryHtml, /name="checkpointGiB"/);
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
for (const scenario of [
  { name: "8B", parameters: 8.2, layers: 36, kvHeads: 8, target: 9.98 },
  { name: "14B", parameters: 14.8, layers: 40, kvHeads: 8, target: 14.27 },
  { name: "32B", parameters: 32.8, layers: 64, kvHeads: 8, target: 27.93 },
  { name: "30B-A3B", parameters: 30.5, layers: 48, kvHeads: 4, target: 20.64 },
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
  assert.equal(Number(result.planningTargetGiB.toFixed(2)), scenario.target, `Qwen3 ${scenario.name} target should match the guide`);
}
for (const scenario of [
  { context: 32768, headroom: 10, target: 173.93 },
  { context: 131072, headroom: 20, target: 199.42 },
  { context: 393216, headroom: 20, target: 225.22 },
  { context: 1048576, headroom: 20, target: 289.72 },
]) {
  const result = calculateGpuMemory({
    parameterBillions: 284,
    bitsPerParameter: 4,
    checkpointGiB: 155.43,
    layers: 43,
    kvHeads: 1,
    headDimension: 512,
    contextTokens: scenario.context,
    concurrentSequences: 1,
    kvCacheBits: 16,
    inferenceHeadroom: scenario.headroom,
    vramPerGpu: 80,
    usableVramPercent: 90,
    availableGpus: 4,
  });
  assert.equal(Number(result.planningTargetGiB.toFixed(2)), scenario.target, `DeepSeek V4 ${scenario.context}-token target should match the guide`);
}
for (const scenario of [
  { name: "FP8 artifact on 8x80", checkpointGiB: 703.74, bits: 8, headroom: 0, vram: 80, gpus: 8, target: 703.74, minimum: 10, fits: false },
  { name: "FP8 on 8xH200", checkpointGiB: 703.74, bits: 8, headroom: 20, vram: 141, gpus: 8, target: 844.49, minimum: 7, fits: true },
  { name: "BF16 on 16xH200", checkpointGiB: 1403.19, bits: 16, headroom: 20, vram: 141, gpus: 16, target: 1683.83, minimum: 14, fits: true },
]) {
  const result = calculateGpuMemory({
    parameterBillions: 753.38,
    bitsPerParameter: scenario.bits,
    checkpointGiB: scenario.checkpointGiB,
    layers: 0,
    kvHeads: 0,
    headDimension: 0,
    contextTokens: 0,
    concurrentSequences: 1,
    kvCacheBits: 8,
    inferenceHeadroom: scenario.headroom,
    vramPerGpu: scenario.vram,
    usableVramPercent: 90,
    availableGpus: scenario.gpus,
  });
  assert.equal(Number(result.planningTargetGiB.toFixed(2)), scenario.target, `GLM-5.2 ${scenario.name} target should match the guide`);
  assert.equal(result.minimumGpus, scenario.minimum, `GLM-5.2 ${scenario.name} minimum GPU count should match the guide`);
  assert.equal(result.fitsAvailable, scenario.fits, `GLM-5.2 ${scenario.name} fit state should match the guide`);
}
for (const scenario of [
  { name: "artifact on 8xH200", headroom: 0, gpus: 8, target: 1453.74, minimum: 12, fits: false },
  { name: "artifact on 12xH200", headroom: 0, gpus: 12, target: 1453.74, minimum: 12, fits: true },
  { name: "reserved floor on 16xH200", headroom: 20, gpus: 16, target: 1744.49, minimum: 14, fits: true },
]) {
  const result = calculateGpuMemory({
    parameterBillions: 2800,
    bitsPerParameter: 4,
    checkpointGiB: 1453.74,
    layers: 0,
    kvHeads: 0,
    headDimension: 0,
    contextTokens: 0,
    concurrentSequences: 1,
    kvCacheBits: 8,
    inferenceHeadroom: scenario.headroom,
    vramPerGpu: 141,
    usableVramPercent: 90,
    availableGpus: scenario.gpus,
  });
  assert.equal(Number(result.planningTargetGiB.toFixed(2)), scenario.target, `Kimi K3 ${scenario.name} target should match the guide`);
  assert.equal(result.minimumGpus, scenario.minimum, `Kimi K3 ${scenario.name} minimum GPU count should match the guide`);
  assert.equal(result.fitsAvailable, scenario.fits, `Kimi K3 ${scenario.name} fit state should match the guide`);
}
assert.match(gpuMemoryHtml, /name="layers"/);
assert.match(gpuMemoryHtml, /name="kvHeads"/);
assert.match(gpuMemoryHtml, /name="headDimension"/);
assert.match(gpuMemoryHtml, /name="contextTokens"/);
assert.match(gpuMemoryHtml, /name="concurrentSequences"/);
assert.match(gpuMemoryHtml, /name="kvCacheBits"/);
assert.match(gpuMemoryHtml, /70b-llm-gpu-requirements/);
assert.match(gpuMemoryHtml, /qwen3-gpu-requirements/);
assert.match(gpuMemoryHtml, /deepseek-v4-flash-gpu-requirements/);
assert.match(gpuMemoryHtml, /glm-5-2-gpu-requirements/);
assert.match(gpuMemoryHtml, /kimi-k3-gpu-requirements/);
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

const defaultCompatibility = calculateCompatibility({
  parameterBillions: 13,
  bitsPerParameter: 4,
  vramPerGpu: 24,
  availableGpus: 1,
  inferenceHeadroom: 20,
  usableVramPercent: 90,
});
assert.equal(Number(defaultCompatibility.planningTargetGiB.toFixed(2)), 7.26);
assert.equal(defaultCompatibility.minimumGpus, 1);
assert.equal(defaultCompatibility.fitsAvailable, true);
const shortCompatibility = calculateCompatibility({
  parameterBillions: 70,
  bitsPerParameter: 4,
  vramPerGpu: 24,
  availableGpus: 1,
  inferenceHeadroom: 20,
  usableVramPercent: 90,
});
assert.equal(Number(shortCompatibility.planningTargetGiB.toFixed(2)), 39.12);
assert.equal(shortCompatibility.minimumGpus, 2);
assert.equal(shortCompatibility.fitsAvailable, false);
const edgeCompatibility = calculateCompatibility({
  parameterBillions: 32,
  bitsPerParameter: 16,
  vramPerGpu: 80,
  availableGpus: 1,
  inferenceHeadroom: 20,
  usableVramPercent: 90,
});
assert.equal(Number(edgeCompatibility.planningTargetGiB.toFixed(2)), 71.53);
assert.equal(edgeCompatibility.minimumGpus, 1);
assert.equal(edgeCompatibility.fitsAvailable, true);
const multiGpuCompatibility = calculateCompatibility({
  parameterBillions: 70,
  bitsPerParameter: 16,
  vramPerGpu: 80,
  availableGpus: 1,
  inferenceHeadroom: 20,
  usableVramPercent: 90,
});
assert.equal(Number(multiGpuCompatibility.planningTargetGiB.toFixed(2)), 156.46);
assert.equal(multiGpuCompatibility.minimumGpus, 3);
assert.equal(multiGpuCompatibility.fitsAvailable, false);
assert.match(compatibilityHtml, /<title>Local LLM GPU Compatibility Checker \| ResearchAudio<\/title>/);
assert.equal((compatibilityHtml.match(/"@type": "WebApplication"/g) || []).length, 1, "compatibility checker should have one WebApplication schema");
assert.equal((compatibilityHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "compatibility checker should have one FAQ schema");
assert.doesNotThrow(() => parseStructuredData(compatibilityHtml), "compatibility checker structured data must be valid JSON");
assert.match(compatibilityHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=local_llm_gpu_compatibility&amp;utm_medium=(tool|tool_result)&amp;utm_campaign=ai_evidence_lab/);
assert.match(compatibilityHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(compatibilityHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(compatibilityHtml, /name="parameterBillions"/);
assert.match(compatibilityHtml, /name="bitsPerParameter"/);
assert.match(compatibilityHtml, /name="vramPerGpu"/);
assert.match(compatibilityHtml, /name="availableGpus"/);
assert.match(compatibilityHtml, /3\.91 GiB/);
assert.match(compatibilityHtml, /39\.12 GiB/);
assert.match(compatibilityHtml, /156\.46 GiB/);
assert.match(compatibilityHtml, /nvidia\.com\/en-us\/geforce\/graphics-cards\/40-series\/rtx-4090/);
assert.match(compatibilityHtml, /nvidia\.com\/en-us\/geforce\/graphics-cards\/50-series\/rtx-5090/);
assert.match(compatibilityHtml, /nvidia\.com\/en-us\/products\/workstations\/rtx-6000/);
assert.match(compatibilityHtml, /nvidia\.com\/en-eu\/data-center\/h200/);
assert.match(compatibilityJs, /local_llm_gpu_compatibility_share/);
assert.match(compatibilityJs, /add_context_and_architecture/);
assert.match(toolsHtml, /local-llm-gpu-compatibility/);
for (const question of [
  "How do I know if my GPU can run a local LLM?",
  "Can a 24 GB GPU run a 70B LLM?",
  "How much VRAM do 7B and 13B models need?",
  "Why does a memory fit not guarantee fast local inference?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(compatibilityHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `compatibility FAQ question missing: ${question}`);
  assert.match(compatibilityHtml, new RegExp(`"name": "${escapedQuestion}"`), `compatibility FAQ schema question missing: ${question}`);
}

const defaultModelFinder = calculateModelFinder({
  vramPerGpu: 12,
  availableGpus: 1,
  bitsPerParameter: 4,
  inferenceHeadroom: 20,
  usableVramPercent: 90,
});
assert.equal(Number(defaultModelFinder.maximumParameterBillions.toFixed(1)), 19.3);
assert.equal(defaultModelFinder.recommended.parameterBillions, 14);
assert.equal(defaultModelFinder.next.parameterBillions, 20);
assert.deepEqual(defaultModelFinder.fittingTiers.map((tier) => tier.parameterBillions), [3, 7, 8, 13, 14]);
assert.deepEqual(recommendOllamaStarter(defaultModelFinder), {
  model: "qwen3:14b",
  artifactSizeGb: 9.3,
  command: "ollama run qwen3:14b",
  officialUrl: "https://ollama.com/library/qwen3",
  label: "Qwen3 14B",
});
const twentyFourGbModelFinder = calculateModelFinder({
  vramPerGpu: 24,
  availableGpus: 1,
  bitsPerParameter: 4,
  inferenceHeadroom: 20,
  usableVramPercent: 90,
});
assert.equal(Number(twentyFourGbModelFinder.maximumParameterBillions.toFixed(1)), 38.7);
assert.equal(twentyFourGbModelFinder.recommended.parameterBillions, 32);
assert.equal(recommendOllamaStarter(twentyFourGbModelFinder).model, "qwen3:32b");
const multiGpuModelFinder = calculateModelFinder({
  vramPerGpu: 24,
  availableGpus: 2,
  bitsPerParameter: 4,
  inferenceHeadroom: 20,
  usableVramPercent: 90,
});
assert.equal(Number(multiGpuModelFinder.maximumParameterBillions.toFixed(1)), 77.3);
assert.equal(multiGpuModelFinder.recommended.parameterBillions, 70);
assert.equal(recommendOllamaStarter(multiGpuModelFinder).model, "qwen3:32b");
assert.match(finderHtml, /<title>What LLM Can I Run\? GPU VRAM Finder \| ResearchAudio<\/title>/);
assert.equal((finderHtml.match(/"@type": "WebApplication"/g) || []).length, 1, "model finder should have one WebApplication schema");
assert.equal((finderHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "model finder should have one FAQ schema");
assert.doesNotThrow(() => parseStructuredData(finderHtml), "model finder structured data must be valid JSON");
assert.match(finderHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=what_llm_can_i_run&amp;utm_medium=(tool|tool_result)&amp;utm_campaign=ai_evidence_lab/);
assert.match(finderHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(finderHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(finderHtml, /name="vramPerGpu"/);
assert.match(finderHtml, /name="availableGpus"/);
assert.match(finderHtml, /name="bitsPerParameter"/);
assert.match(finderHtml, /8 GB/);
assert.match(finderHtml, /12 GB/);
assert.match(finderHtml, /16 GB/);
assert.match(finderHtml, /24 GB/);
assert.match(finderHtml, /38\.7B ceiling/);
assert.match(finderHtml, /227\.1B ceiling/);
assert.match(finderHtml, /Ollama starter command/);
assert.match(finderHtml, /ollama run qwen3:14b/);
assert.match(finderHtml, /id="copy-ollama-command"/);
assert.match(finderHtml, /data-event-content="ollama_starter_command"/);
assert.match(finderHtml, /https:\/\/ollama\.com\/library\/qwen3/);
assert.match(finderJs, /what_llm_can_i_run_share/);
assert.match(finderJs, /add_context_and_architecture/);
assert.match(toolsHtml, /what-llm-can-i-run/);
for (const question of [
  "What LLM can I run with 8 GB of VRAM?",
  "What LLM can I run with 12 GB of VRAM?",
  "What LLM can I run with 24 GB of VRAM?",
  "Why can a model fail even when its weights fit in VRAM?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(finderHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `model finder FAQ question missing: ${question}`);
  assert.match(finderHtml, new RegExp(`"name": "${escapedQuestion}"`), `model finder FAQ schema question missing: ${question}`);
}

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
assert.equal((toolsHtml.match(/class="tool-card"/g) || []).length, 16, "tools hub should contain sixteen instruments");

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
assert.match(codexConfigHtml, /Generate <code>project_doc_fallback_filenames<\/code> and <code>project_doc_max_bytes<\/code> for Codex CLI\./);
assert.match(codexConfigHtml, /href="\.\.\/codex-exec-command-builder\/"/);

assert.equal(
  buildCodexExecCommand(),
  "codex exec --json --ephemeral --color never --sandbox read-only 'Review this repository and return the highest-risk issue.'",
  "Codex exec builder should default to a read-only ephemeral JSONL run with Git validation",
);
assert.equal(shellQuote("it's"), "'it'\\''s'", "Codex exec builder should shell-quote apostrophes");
assert.equal(
  buildCodexExecCommand({
    prompt: "Review it's output",
    sandbox: "workspace-write",
    skipGitRepoCheck: true,
    ignoreUserConfig: true,
    outputSchema: "schemas/review schema.json",
    lastMessageFile: "artifacts/last message.txt",
  }),
  "codex exec --json --ephemeral --color never --sandbox workspace-write --skip-git-repo-check --ignore-user-config --output-schema 'schemas/review schema.json' --output-last-message 'artifacts/last message.txt' 'Review it'\\''s output'",
  "Codex exec builder should emit selected Git, config, schema, and last-message controls",
);
assert.match(
  buildCodexExecCommand({ sandbox: "invalid" }),
  /--sandbox read-only/,
  "Codex exec builder should fall back to the safest supported sandbox",
);
assert.equal((codexExecHtml.match(/"@type": "WebApplication"/g) || []).length, 1, "Codex exec builder should have WebApplication schema");
assert.equal((codexExecHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "Codex exec builder should have FAQ schema");
assert.doesNotThrow(() => parseStructuredData(codexExecHtml), "Codex exec builder structured data must be valid JSON");
assert.match(codexExecHtml, /github\.com\/openai\/codex\/blob\/main\/codex-rs\/exec\/src\/cli\.rs/);
assert.match(codexExecHtml, /utm_source=codex_exec_builder&amp;utm_medium=tool&amp;utm_campaign=ai_evidence_lab/);
assert.match(codexExecHtml, /--skip-git-repo-check/);
assert.match(codexExecHtml, /Build a <code>codex exec --json<\/code> command with an explicit Git check\./);
assert.match(codexExecHtml, /--output-schema/);
assert.match(codexExecHtml, /--output-last-message/);
assert.match(codexExecJs, /utm_source", "codex_exec_builder_share"/);
assert.match(codexExecJs, /utm_campaign", "ai_evidence_lab"/);

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
assert.match(voiceLatencyHtml, /Map fast and slow model latency in one voice AI architecture\./);
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
assert.equal((toolsHtml.match(/class="resource-card"/g) || []).length, 24, "tools hub should contain twenty-four search field notes");
assert.match(toolsHtml, /local-llm-gpu-guide/);
assert.match(toolsHtml, /7b-vs-13b-llm-gpu-requirements/);
assert.match(toolsHtml, /70b-llm-gpu-requirements/);
assert.match(toolsHtml, /rtx-3060-llm-models/);
assert.match(toolsHtml, /rtx-4060-llm-models/);
assert.match(toolsHtml, /rtx-4060-ti-16gb-llm-models/);
assert.match(toolsHtml, /rtx-3090-vs-4090-local-llm/);
assert.match(toolsHtml, /rtx-4090-llm-models/);
assert.match(toolsHtml, /rtx-5060-ti-8gb-vs-16gb-local-llm/);
assert.match(toolsHtml, /rtx-4070-super-vs-4070-ti-super-local-llm/);
assert.match(toolsHtml, /mac-mini-m4-local-llm/);
assert.match(toolsHtml, /rtx-5080-llm-models/);
assert.match(toolsHtml, /rtx-5090-llm-models/);
assert.match(toolsHtml, /qwen2-5-gpu-requirements/);
assert.match(toolsHtml, /qwen3-gpu-requirements/);
assert.match(toolsHtml, /deepseek-v4-flash-gpu-requirements/);
assert.match(toolsHtml, /kimi-k3-gpu-requirements/);
assert.match(toolsHtml, /gemma-4-gpu-requirements/);
assert.match(toolsHtml, /diffusiongemma-gpu-requirements/);
assert.match(toolsHtml, /gpt-oss-hardware-requirements/);
assert.match(toolsHtml, /ai-agent-security-checklist/);
assert.match(toolsHtml, /ai-benchmark-audit-checklist/);
assert.match(toolsHtml, /ai-task-fit-diagnostic/);
assert.match(toolsHtml, /codex-exec-command-builder/);
assert.match(toolsHtml, /ai-evidence-starter-kit/);
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
assert.match(starterHtml, /<meta name="robots" content="noindex, nofollow" \/>/);

assert.match(acquisitionHtml, /<title>Free AI Evaluation Starter Kit: 4 Practical Tests \| ResearchAudio<\/title>/);
assert.match(acquisitionHtml, /<link rel="canonical" href="https:\/\/tools\.researchaudio\.io\/ai-evidence-starter-kit\/" \/>/);
assert.match(acquisitionHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(acquisitionHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
assert.match(acquisitionHtml, /51,000\+/);
assert.match(acquisitionHtml, /One confirmed referral unlocks the AI Launch Evidence Checklist automatically/);
assert.match(acquisitionHtml, /utm_source=ai_evidence_starter_kit&amp;utm_medium=organic_lead_magnet&amp;utm_campaign=ai_evidence_lab/);
assert.equal((acquisitionHtml.match(/class="starter-card"/g) || []).length, 4, "lead magnet should preview four decision tests");
assert.equal((acquisitionHtml.match(/"@type": "Question"/g) || []).length, 3, "lead magnet should expose three FAQ answers in schema");
assert.doesNotThrow(() => parseStructuredData(acquisitionHtml), "lead-magnet structured data must be valid JSON");
assert.doesNotMatch(acquisitionHtml, /noindex|nofollow/, "the acquisition landing page must remain crawlable");

const readerShareUrl = buildReaderShareUrl(
  "https://tools.researchaudio.io/qwen3-gpu-requirements/?utm_source=old#subscribe",
  "qwen3-gpu-requirements",
);
assert.equal(readerShareUrl.searchParams.get("utm_source"), "reader_share");
assert.equal(readerShareUrl.searchParams.get("utm_medium"), "referral");
assert.equal(readerShareUrl.searchParams.get("utm_campaign"), "ai_evidence_lab");
assert.equal(readerShareUrl.searchParams.get("utm_content"), "qwen3-gpu-requirements_shared_guide");
assert.equal(readerShareUrl.hash, "");
assert.match(readerShareJs, /one confirmed signup through your personal referral link in a ResearchAudio email/);
assert.match(conversionLoopJs, /One confirmed referral unlocks the AI Launch Evidence Checklist/);

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
assert.match(starterHtml, /https:\/\/researchaudio\.io\/subscribe\?utm_source=evidence_starter_kit/);
assert.match(starterHtml, /class="join-link" href="#subscribe"/);
assert.match(starterHtml, /id="onboarding-loop"[\s\S]*?hidden/);
assert.match(starterHtml, /data-share-content="onboarding_prompt"/);
assert.match(starterHtml, /subscribe-forms\.beehiiv\.com\/v3\/loader\.js/);
assert.match(starterHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.equal((starterHtml.match(/data-step=/g) || []).length, 4, "starter kit should contain four progress steps");
assert.match(starterJs, /researchaudio_evidence_starter_progress_v1/);
assert.match(starterJs, /new URL\("https:\/\/tools\.researchaudio\.io\/ai-evidence-starter-kit\/"\)/);
assert.match(starterJs, /utm_source", "evidence_starter_share"/);
assert.match(starterJs, /utm_medium", "referral"/);
assert.match(starterJs, /utm_campaign", "ai_evidence_lab"/);
assert.match(starterJs, /utm_medium"\) === "onboarding"/);
assert.match(starterJs, /querySelector\("#onboarding-loop"\)\.hidden = false/);
assert.match(starterJs, /querySelector\("#subscribe"\)\.hidden = true/);

assert.match(deploymentPackHtml, /<title>AI Deployment Decision Pack \| ResearchAudio<\/title>/);
assert.match(deploymentPackHtml, /<meta name="robots" content="noindex, nofollow" \/>/);
assert.match(deploymentPackHtml, /<link rel="canonical" href="https:\/\/tools\.researchaudio\.io\/ai-deployment-pack\/" \/>/);
assert.match(deploymentPackHtml, /One-referral reward \/ private resource/);
assert.match(deploymentPackHtml, /download href="deployment-decision-brief\.md"/);
assert.match(deploymentPackHtml, /download href="ai-launch-evidence-checklist\.md"/);
assert.match(deploymentPackHtml, /download href="production-rollout-gates\.md"/);
assert.match(deploymentPackHtml, /utm_medium=referral_reward&amp;utm_campaign=ai_evidence_lab/);
assert.match(deploymentPackHtml, new RegExp(`data-cf-beacon='[^']*${cloudflareWebAnalyticsToken}[^']*'`));
assert.doesNotMatch(deploymentPackHtml, /data-beehiiv-form|subscribe-forms\.beehiiv\.com/, "the private reward should not ask an existing subscriber to join again");
assert.doesNotMatch(sitemap, /ai-deployment-pack/, "the private referral reward should stay out of the public sitemap");
assert.doesNotMatch(sitemap, /<loc>https:\/\/tools\.researchaudio\.io\/evidence-starter-kit\/<\/loc>/, "the private activation kit should stay out of the public sitemap");
assert.match(deploymentBrief, /Ship when:/);
assert.match(evidenceChecklist, /Cost is calculated per successful outcome/);
assert.match(rolloutGates, /Prompt-injection resistance/);
for (const asset of [deploymentBrief, evidenceChecklist, rolloutGates]) {
  assert.doesNotMatch(asset, /TODO|PLACEHOLDER|example\.com/);
}
assert.match(starterJs, /querySelectorAll\("\[data-share-kit\]"\)/);
assert.doesNotMatch(starterHtml, /TODO|PLACEHOLDER|example\.com/);

for (const [name, page] of [
  ["AI cost per successful task", costHtml],
  ["AI agent loop", loopHtml],
  ["AI task fit", taskFitHtml],
  ["AI agent ROI", roiHtml],
  ["LLM API cost", llmCostHtml],
  ["LLM GPU memory", gpuMemoryHtml],
  ["local LLM GPU compatibility", compatibilityHtml],
  ["hardware-first LLM model finder", finderHtml],
  ["LLM KV cache", kvCacheHtml],
  ["prompt caching", promptCacheHtml],
  ["Codex config", codexConfigHtml],
  ["Codex exec", codexExecHtml],
  ["voice AI latency", voiceLatencyHtml],
  ["voice AI cost", voiceCostHtml],
  ["AI agent security", securityGuideHtml],
  ["AI benchmark audit", benchmarkGuideHtml],
]) {
  assert.match(page, /<script src="\.\.\/embed-mode\.js"><\/script>/, `${name} tool should support embed mode`);
}
assert.match(embedModeJs, /parameters\.get\("embed"\) === "1"/);
assert.match(embedModeJs, /utm_medium", "embedded_tool"/);
assert.match(embedModeJs, /utm_campaign", "ai_evidence_lab"/);
assert.match(embedModeJs, /target = "_blank"/);
assert.match(embedModeJs, /className = "tool-distribution"/);
assert.match(embedModeJs, /utm_content", "embed_this_tool"/);
assert.match(embedModeJs, /libraryUrl\.hash = `embed-\$\{tool\}`/);
assert.match(embedsHtml, /<title>Embed Free AI Tools on Your Website \| ResearchAudio<\/title>/);
assert.match(embedsHtml, /href="https:\/\/researchaudio\.io\/p\/free-ai-tools-to-embed\?utm_source=embed_library&amp;utm_medium=organic_tool&amp;utm_campaign=ai_evidence_lab&amp;utm_content=publisher_guide"/);
assert.equal((embedsHtml.match(/data-widget-url=/g) || []).length, 16, "embed library should offer sixteen widgets");
assert.equal((embedsHtml.match(/data-copy-embed/g) || []).length, 16, "every widget should expose a copy action");
assert.doesNotThrow(() => parseStructuredData(embedsHtml), "embed library structured data must be valid JSON");
assert.equal((embedsHtml.match(/"@type": "ListItem"/g) || []).length, 16, "embed library schema should enumerate sixteen widgets");
assert.equal((embedsHtml.match(/"@type": "WebApplication"/g) || []).length, 16, "every embedded tool should have WebApplication schema");
assert.equal((embedsHtml.match(/"@type": "FAQPage"/g) || []).length, 1, "embed library should have FAQ schema");
for (const pathName of [
  "ai-benchmark-audit-checklist",
  "ai-agent-security-checklist",
  "llm-api-cost-calculator",
  "llm-gpu-memory-calculator",
  "local-llm-gpu-compatibility",
  "what-llm-can-i-run",
  "kv-cache-calculator",
  "voice-ai-cost-calculator",
  "ai-agent-roi-calculator",
  "agent-loop-diagnostic",
  "ai-cost-calculator",
  "ai-task-fit-diagnostic",
  "codex-config-generator",
  "codex-exec-command-builder",
  "prompt-caching-calculator",
  "voice-ai-latency-calculator",
]) {
  assert.match(embedsHtml, new RegExp(`id="embed-${pathName}" data-widget-url="https:\\/\\/tools\\.researchaudio\\.io\\/${pathName}\\/"`), `embed library should deep-link to ${pathName}`);
}
assert.match(embedsHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(embedsHtml, /subscribe-forms\.beehiiv\.com\/attribution\.js/);
for (const platform of ["WordPress", "Webflow", "Ghost", "Beehiiv", "Static HTML"]) {
  assert.match(embedsHtml, new RegExp(`<li>${platform}<\\/li>`), `embed library should name ${platform} compatibility`);
}
for (const question of [
  "How do I embed an AI calculator on my website?",
  "Which website platforms support the AI tool embeds?",
  "Do embedded ResearchAudio tools collect visitor inputs?",
  "Can I embed the AI tools for free?",
]) {
  const escapedQuestion = question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert.match(embedsHtml, new RegExp(`<h3>${escapedQuestion}<\\/h3>`), `embed library FAQ question missing: ${question}`);
  assert.match(embedsHtml, new RegExp(`"name": "${escapedQuestion}"`), `embed library FAQ schema question missing: ${question}`);
}
assert.match(embedsJs, /utm_source/);
assert.match(embedsJs, /utm_medium/);
assert.match(embedsJs, /utm_campaign/);
assert.match(embedsJs, /navigator\.clipboard\.writeText/);
assert.match(toolsHtml, /href="\.\.\/embeds\/"/);
assert.match(partnersHtml, /<title>Partner With ResearchAudio: Newsletter &amp; AI Tool Kit<\/title>/);
assert.match(partnersHtml, /<link rel="canonical" href="https:\/\/tools\.researchaudio\.io\/partners\/" \/>/);
assert.match(partnersHtml, /id="partner-name"/);
assert.match(partnersHtml, /href="https:\/\/app\.beehiiv\.com\/recommendations"/);
assert.match(partnersHtml, /data-copy-target="network-reason"/);
assert.match(partnersHtml, /data-copy-target="magic-link"/);
assert.match(partnersHtml, /data-copy-target="universal-link"/);
assert.equal((partnersHtml.match(/data-copy-snippet=/g) || []).length, 3, "partner kit should provide three copy-ready placements");
assert.equal((partnersHtml.match(/"@type": "Question"/g) || []).length, 4, "partner kit should expose four FAQ answers in schema");
assert.doesNotThrow(() => parseStructuredData(partnersHtml), "partner-kit structured data must be valid JSON");
assert.doesNotMatch(partnersHtml, /noindex|nofollow/, "the partner kit must remain crawlable");
assert.doesNotMatch(partnersHtml, /data-beehiiv-form|subscribe-forms\.beehiiv\.com/, "the publisher kit should not submit a signup form");
assert.match(partnersHtml, /href="\.\.\/embeds\/"/);
assert.match(partnersJs, /https:\/\/magic\.beehiiv\.com\/v1\/\$\{publicationId\}\?email=\{\{email\}\}/);
assert.match(partnersJs, /https:\/\/tools\.researchaudio\.io\/ai-evidence-starter-kit\//);
assert.match(partnersJs, /https:\/\/tools\.researchaudio\.io\/evidence-starter-kit\//);
assert.match(partnersJs, /utm_medium", "partner_referral"/);
assert.match(partnersJs, /utm_medium=magic_link/);
assert.match(partnersJs, /navigator\.clipboard\.writeText/);
assert.match(toolsHtml, /href="\.\.\/partners\/"/);
assert.match(embedsHtml, /href="\.\.\/partners\/"/);

assert.match(toolsHtml, /7B vs 13B LLM GPU requirements/);
assert.match(gpuMemoryHtml, /7b-vs-13b-llm-gpu-requirements/);
assert.match(gpuGuideHtml, /7b-vs-13b-llm-gpu-requirements/);
assert.match(toolsHtml, /Qwen2\.5 GPU requirements/);
assert.match(qwenGuideHtml, /Official Qwen2\.5 7B model card/);
assert.match(qwenGuideHtml, /Official Qwen2\.5 32B model card/);
assert.match(qwenGuideHtml, /Official Qwen2\.5 72B model card/);
assert.match(qwenGuideHtml, /6\.35 GiB/);
assert.match(qwenGuideHtml, /27\.76 GiB/);
assert.match(qwenGuideHtml, /52\.62 GiB/);
assert.match(qwenGuideHtml, /qwen3-gpu-requirements/);
assert.match(toolsHtml, /Qwen3 GPU requirements/);
assert.match(qwen3GuideHtml, /9\.98 GiB/);
assert.match(qwen3GuideHtml, /14\.27 GiB/);
assert.match(qwen3GuideHtml, /27\.93 GiB/);
assert.match(qwen3GuideHtml, /20\.64 GiB/);
assert.match(toolsHtml, /DeepSeek V4 Flash GPU requirements/);
assert.match(deepseekV4GuideHtml, /173\.93 GiB/);
assert.match(deepseekV4GuideHtml, /199\.42 GiB/);
assert.match(deepseekV4GuideHtml, /225\.22 GiB/);
assert.match(deepseekV4GuideHtml, /289\.72 GiB/);
assert.match(deepseekV4GuideHtml, /glm-5-2-gpu-requirements/);
assert.match(toolsHtml, /GLM-5\.2 GPU requirements/);
assert.match(glm52GuideHtml, /SHORT 127\.74 GiB/);
assert.match(glm52GuideHtml, /844\.49 GiB floor/);
assert.match(glm52GuideHtml, /1,683\.83 GiB/);
assert.match(toolsHtml, /Kimi K3 GPU requirements/);
assert.match(kimiK3GuideHtml, /SHORT 438\.54 GiB/);
assert.match(kimiK3GuideHtml, /69\.06 GiB remains/);
assert.match(kimiK3GuideHtml, /1,744\.49 GiB target/);
assert.match(toolsHtml, /Gemma 4 GPU requirements/);
assert.match(gemma4GuideHtml, /6\.7 GB for 12B Q4/);
assert.match(gemma4GuideHtml, /22\.28 GiB/);
assert.match(gemma4GuideHtml, /69\.9 GB/);
assert.match(toolsHtml, /DiffusionGemma GPU requirements/);
assert.match(diffusionGemmaGuideHtml, /48\.10 GiB at BF16/);
assert.match(diffusionGemmaGuideHtml, /17\.53 GiB at NVFP4/);
assert.match(diffusionGemmaGuideHtml, /0\.56 GiB margin/);

const localLlmGuideText = localLlmGuideHtml.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z0-9#]+;/gi, " ").replace(/\s+/g, " ").trim();
assert.ok(localLlmGuideText.split(" ").length >= 2500, "local LLM pillar should provide at least 2,500 words of substantive guidance");
assert.match(localLlmGuideHtml, /"@type": "TechArticle"/);
assert.match(localLlmGuideHtml, /"@type": "BreadcrumbList"/);
assert.match(localLlmGuideHtml, /"@type": "ItemList"/);
assert.match(localLlmGuideHtml, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
assert.match(localLlmGuideHtml, /utm_source=local_llm_gpu_guide/);
for (const target of [
  "llm-gpu-memory-calculator",
  "kv-cache-calculator",
  "what-llm-can-i-run",
  "local-llm-gpu-compatibility",
  "7b-vs-13b-llm-gpu-requirements",
  "70b-llm-gpu-requirements",
  "rtx-3060-llm-models",
  "rtx-4060-llm-models",
  "rtx-4060-ti-16gb-llm-models",
  "rtx-3090-vs-4090-local-llm",
  "rtx-4090-llm-models",
  "rtx-5060-ti-8gb-vs-16gb-local-llm",
  "rtx-4070-super-vs-4070-ti-super-local-llm",
  "mac-mini-m4-local-llm",
  "rtx-5080-llm-models",
  "rtx-5090-llm-models",
  "qwen2-5-gpu-requirements",
  "qwen3-gpu-requirements",
  "gpt-oss-hardware-requirements",
  "gemma-4-gpu-requirements",
  "deepseek-v4-flash-gpu-requirements",
  "diffusiongemma-gpu-requirements",
]) assert.match(localLlmGuideHtml, new RegExp(target), `local LLM pillar should link to ${target}`);

for (const [name, page] of [
  ["LLM GPU memory calculator", gpuMemoryHtml],
  ["KV-cache calculator", kvCacheHtml],
  ["hardware-first model finder", finderHtml],
  ["GPU compatibility checker", compatibilityHtml],
  ["7B versus 13B guide", smallGpuGuideHtml],
  ["70B guide", gpuGuideHtml],
  ["RTX 3060 guide", rtx3060GuideHtml],
  ["RTX 4060 guide", rtx4060GuideHtml],
  ["RTX 4060 Ti guide", rtx4060Ti16GuideHtml],
  ["RTX 3090 versus 4090 guide", rtx3090Vs4090GuideHtml],
  ["RTX 4090 guide", rtx4090GuideHtml],
  ["RTX 5060 Ti comparison", rtx5060TiComparisonGuideHtml],
  ["RTX 4070 Super comparison", rtx4070SuperComparisonGuideHtml],
  ["Mac mini M4 guide", macMiniM4GuideHtml],
  ["RTX 5080 guide", rtx5080GuideHtml],
  ["RTX 5090 guide", rtx5090GuideHtml],
  ["Qwen2.5 guide", qwenGuideHtml],
  ["Qwen3 guide", qwen3GuideHtml],
  ["gpt-oss guide", gptOssGuideHtml],
  ["Gemma 4 guide", gemma4GuideHtml],
  ["DeepSeek V4 guide", deepseekV4GuideHtml],
  ["DiffusionGemma guide", diffusionGemmaGuideHtml],
]) {
  assert.match(page, /href="\.\.\/local-llm-gpu-guide\/"/, `${name} should link back to the canonical local LLM pillar URL`);
}

assert.equal((sitemap.match(/<url>/g) || []).length, 45, "sitemap should contain all forty-five crawlable pages");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(sitemapUrls.length, 45, "sitemap should publish forty-five URL locations");
assert.ok(sitemapUrls.every((url) => new URL(url).origin === brandedToolsOrigin), "every sitemap URL should use the ResearchAudio tools domain");
const crawlablePages = await Promise.all(sitemapUrls.map(async (url) => {
  const pathname = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
  const file = pathname ? path.join(root, pathname, "index.html") : path.join(root, "index.html");
  return [url, await readFile(file, "utf8")];
}));
for (const [url, page] of crawlablePages) {
  assert.doesNotMatch(
    page,
    /href="(?!https?:\/\/|#)[^"]*\?utm_/,
    `${url} should use canonical paths for internal navigation; attribution belongs on external signup, share, and embed links`,
  );
}
assert.ok(sitemapUrls.includes("https://tools.researchaudio.io/partners/"), "sitemap should publish the partner distribution kit");
assert.ok(sitemapUrls.includes("https://tools.researchaudio.io/local-llm-gpu-guide/"), "sitemap should publish the local LLM hardware pillar");
assert.ok(sitemapUrls.includes("https://tools.researchaudio.io/rtx-4070-super-vs-4070-ti-super-local-llm/"), "sitemap should publish the RTX 4070 Super comparison");
assert.ok(sitemapUrls.includes("https://tools.researchaudio.io/mac-mini-m4-local-llm/"), "sitemap should publish the Mac mini M4 guide");
assert.match(robots, /Sitemap: https:\/\/tools\.researchaudio\.io\/sitemap\.xml/);
assert.doesNotMatch(`${sitemap}\n${robots}\n${llms}`, retiredGitHubPagesPath, "discovery files should not expose the retired GitHub Pages path");
assert.match(llms, /AI Cost per Successful Task Calculator/);
assert.match(llms, /AI Agent Loop Diagnostic/);
assert.match(llms, /AI Agent ROI Calculator/);
assert.match(llms, /LLM API Cost Calculator/);
assert.match(llms, /LLM GPU Memory Calculator/);
assert.match(llms, /Local LLM GPU Compatibility Checker/);
assert.match(llms, /What LLM Can I Run on My GPU\?/);
assert.match(llms, /LLM KV Cache Calculator/);
assert.match(llms, /Prompt Caching Cost Calculator/);
assert.match(llms, /Codex CLI config\.toml Generator/);
assert.match(llms, /Codex exec Command Builder/);
assert.match(llms, /Voice AI Latency Calculator/);
assert.match(llms, /AI Voice Agent Cost Calculator/);
assert.match(llms, /Free AI Evaluation Starter Kit/);
assert.match(llms, /https:\/\/tools\.researchaudio\.io\/ai-evidence-starter-kit\//);
assert.doesNotMatch(llms, /https:\/\/tools\.researchaudio\.io\/evidence-starter-kit\//, "llms.txt should advertise the acquisition gate, not the private activation path");
assert.match(llms, /Embeddable AI Tools/);
assert.match(llms, /ResearchAudio Partner Distribution Kit/);
assert.match(llms, /Local LLM GPU and Hardware Guide/);
assert.match(llms, /https:\/\/tools\.researchaudio\.io\/partners\//);
assert.match(llms, /Kimi K3 GPU Requirements/);
assert.match(llms, /Gemma 4 GPU Requirements/);
assert.match(llms, /DiffusionGemma GPU Requirements/);
assert.match(llms, /The Fable 5 Cost Playbook/);
assert.match(llms, /Voice AI Cost per Minute/);
assert.match(llms, /AI Receptionist Cost Worksheet/);
assert.match(llms, /7B vs 13B LLM GPU Requirements/);
assert.match(llms, /70B LLM GPU Requirements/);
assert.match(llms, /RTX 3060 12GB Local LLM Guide/);
assert.match(llms, /RTX 4060 8GB Local LLM Guide/);
assert.match(llms, /RTX 4060 Ti 16GB Local LLM Guide/);
assert.match(llms, /RTX 3090 vs RTX 4090 Local LLM Comparison/);
assert.match(llms, /RTX 4090 Local LLM Guide/);
assert.match(llms, /RTX 5060 Ti 8GB vs 16GB Local LLM Comparison/);
assert.match(llms, /RTX 4070 Super vs RTX 4070 Ti Super Local LLM Comparison/);
assert.match(llms, /Mac mini M4 Local LLM Memory Guide/);
assert.match(llms, /RTX 5080 Local LLM Guide/);
assert.match(llms, /RTX 5090 Local LLM Guide/);
assert.match(llms, /Qwen2\.5 GPU Requirements/);
assert.match(llms, /Qwen3 GPU Requirements/);
assert.match(llms, /DeepSeek V4 Flash GPU Requirements/);
assert.match(llms, /GLM-5\.2 GPU Requirements/);
assert.match(llms, /AI Agent Security Checklist/);
assert.match(llms, /AI Benchmark Audit Checklist/);
assert.match(llms, /AI Task Fit Diagnostic/);
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

console.log("Evidence Lab verified: 16 tools, 1 gated acquisition page, 1 private activation kit, 1 private one-referral reward pack, 1 embed library, 1 partner distribution kit, 24 search field notes, 45 crawlable pages, a 2,500-word local LLM hardware pillar, attributed subscribe and share CTAs, interaction-triggered signup rails, calculation logic, accessibility, responsive CSS, and IndexNow deployment are present.");
