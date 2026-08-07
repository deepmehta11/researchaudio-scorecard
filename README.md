# ResearchAudio Evidence Lab

An evergreen acquisition ecosystem for ResearchAudio. Sixteen browser-local tools, twenty-one practical field guides, and a self-serve embed library turn AI task framing, benchmark and launch claims, token budgets, voice latency and outcome economics, hardware-first local LLM discovery, GPU and KV-cache sizing, cache economics, workflow economics, agent reliability and security, automation business cases, and Codex workflows into concrete inspections before inviting visitors into the daily briefing.

Live at `https://tools.researchaudio.io/`, a branded ResearchAudio subdomain connected to the Beehiiv publication at `https://researchaudio.io/`.

## Live instruments

- `/` — AI Launch Evidence Scorecard: seven gates for decision-ready launch evidence.
- `/ai-cost-calculator/` — retry-adjusted cost per successful AI task.
- `/agent-loop-diagnostic/` — ten production guardrails for agent loops.
- `/ai-task-fit-diagnostic/` — eight checks for whether an AI workflow has a defined target, usable error signal, bounded execution, and human ownership of premise changes.
- `/ai-agent-roi-calculator/` — AI agent ROI after failure, human review, recurring cost, and implementation payback.
- `/llm-api-cost-calculator/` — monthly LLM API budget after input/output tokens, caching, retries, and attached usage costs.
- `/prompt-caching-calculator/` — cache-read and cache-write economics with a break-even hit-rate calculation.
- `/codex-config-generator/` — copy-ready Codex CLI project document fallbacks and instruction byte limits.
- `/codex-exec-command-builder/` — shell-safe Codex exec commands for JSONL automation, ephemeral sessions, sandbox selection, response schemas, last-message files, and deliberate non-Git execution.
- `/voice-ai-latency-calculator/` — first-audio latency across endpointing, transcription, parallel fast and slow model branches, TTS, and playout.
- `/kv-cache-calculator/` — exact KV-cache memory per token, full-context sequence, concurrency level, and GQA/MHA architecture.
- `/voice-ai-cost-calculator/` — loaded cost per AI-resolved call after platform, telephony, STT, TTS, LLM, fixed fees, and human handoffs.
- `/voice-ai-cost-per-minute/` — crawlable field note with the full stack-rate formula and editable sensitivity scenarios.
- `/ai-receptionist-cost/` — crawlable monthly worksheet with after-hours, appointment, and high-volume call scenarios.
- `/70b-llm-gpu-requirements/` — crawlable INT4, INT8, and FP16 guide with explicit 32K KV-cache scenarios.
- `/rtx-3060-llm-models/` — hardware-first 12 GB guide separating the generic 14B INT4 weight tier from exact Qwen3 and gpt-oss context-memory boundaries.
- `/rtx-4060-llm-models/` — hardware-first 8 GB guide showing where Qwen3 8B crosses from a 4K and 8K fit into 16K and 32K full-cache shortfalls.
- `/rtx-4060-ti-16gb-llm-models/` — variant-specific 16 GB guide exposing the narrow Qwen3 14B and short-context gpt-oss-20b planning fits.
- `/rtx-3090-vs-4090-local-llm/` — buyer-focused comparison showing that both 24 GB cards share a model-fit ceiling and that runtime value needs workload-specific measurement.
- `/rtx-4090-llm-models/` — hardware-first 24 GB guide with generic precision floors plus exact Qwen3 and gpt-oss deployment boundaries.
- `/rtx-5060-ti-8gb-vs-16gb-local-llm/` — variant comparison showing where doubling VRAM changes exact Qwen3 and gpt-oss fit decisions.
- `/rtx-5080-llm-models/` — hardware-first 16 GB guide exposing razor-thin Qwen3 14B and short-context gpt-oss-20b paper fits.
- `/rtx-5090-llm-models/` — hardware-first 32 GB guide showing where Qwen3 32B and a 128K gpt-oss-20b profile cross into narrow one-card fits.
- `/qwen2-5-gpu-requirements/` — crawlable Qwen2.5 7B, 32B, and 72B matrix across INT4, INT8, BF16, 32K KV cache, and 128K context.
- `/qwen3-gpu-requirements/` — crawlable Qwen3 8B, 14B, 32B, and 30B-A3B matrix with exact 32K cache math, MoE memory boundaries, and first-party runtime checks.
- `/gpt-oss-hardware-requirements/` — primary-source gpt-oss-20b and gpt-oss-120b GPU memory guide with MXFP4, checkpoint, 4K, and 128K scenarios.
- `/deepseek-v4-flash-gpu-requirements/` — primary-source DeepSeek V4 Flash 0731 guide with the exact mixed-precision artifact and editable 32K-to-1M deployment comparisons.
- `/glm-5-2-gpu-requirements/` — primary-source GLM-5.2 guide with exact FP8 and BF16 artifact totals plus supported 8xH200 and 8xB200 deployment tiers.
- `/kimi-k3-gpu-requirements/` — primary-source Kimi K3 guide with the exact 1,453.74 GiB MXFP4 artifact, an 8xH200 shortfall, a 12xH200 raw floor, and Moonshot's 64-plus-accelerator serving recommendation.
- `/gemma-4-gpu-requirements/` — primary-source Gemma 4 family matrix for E2B, E4B, 12B, 26B A4B, and 31B across BF16, SFP8, and Q4_0, with exact 12B checkpoint checks.
- `/diffusiongemma-gpu-requirements/` — primary-source DiffusionGemma 26B A4B guide with exact 48.10 GiB BF16 and 17.53 GiB NVIDIA NVFP4 artifacts plus explicit 256K context boundaries.
- `/ai-agent-security-checklist/` — interactive 12-point control review grounded in current OWASP, Anthropic, and NIST primary guidance.
- `/ai-benchmark-audit-checklist/` — interactive 12-point reproducibility review grounded in current OpenAI, Anthropic, METR, and Terminal-Bench primary sources.
- `/llm-gpu-memory-calculator/` — model-weight VRAM, optional architecture-aware KV cache, runtime headroom, usable memory, and minimum GPU count.
- `/local-llm-gpu-compatibility/` — browser-local 7B, 13B, 32B, and 70B weight-floor fit checks across common 8 GB to 141 GB GPU profiles, with preserved state into the architecture-aware calculator.
- `/what-llm-can-i-run/` — browser-local inverse model finder that starts with 8 GB to 141 GB of available VRAM and returns the largest listed INT4, INT8, or FP16 parameter tier below a conservative arithmetic ceiling.
- `/evidence-starter-kit/` — post-signup activation, four-tool progress, referral reward explanation, and attributed sharing.
- `/tools/` — crawlable, interlinked Evidence Lab hub.
- `/embeds/` — copy-ready, source-attributed iframe widgets plus a self-serve installation guide for WordPress, Webflow, Ghost, Beehiiv, and static sites. Every tool page deep-links publishers to its exact widget, and the library publishes a sixteen-tool application index with matching FAQ schema for search discovery.

Every instrument uses the dedicated Beehiiv acquisition form and keeps user inputs in the browser.

Every acquisition page also exposes a page-attributed hosted signup fallback above the embed, so visitors can still join when third-party form loading is delayed or blocked.

Every result share is restorable: the recipient opens the sender's exact score, diagnosis, budget, or business case with referral UTMs intact instead of landing on a blank default tool.

Every main-branch deployment also verifies the site and submits all sitemap URLs to the IndexNow global endpoint after the public ownership key is available. IndexNow speeds discovery by participating search engines; it does not guarantee crawling, indexing, or rankings.

## Growth contract

- Primary metric: new active subscribers attributed to `utm_campaign=ai_evidence_lab` or the legacy `ai_launch_scorecard` launch-instrument campaign.
- Supporting metrics: qualified visits, scorecard completion rate, subscribe conversion rate, and shared-score visits.
- Target model: ResearchAudio does not yet have an observed organic signup rate. At a 3% planning assumption, 100 subscribers per day requires about 3,333 qualified visits per day; replace the assumption as soon as measured conversion data exists.
- Stage gates: first 10 attributable organic signups, then a stable page-level conversion rate, then 25 per day, then 100 per day. Page launches and visits do not count as subscriber outcomes.
- Source contract: every distributed URL must include `utm_source`, `utm_medium`, `utm_campaign=ai_evidence_lab`, and a meaningful `utm_content` value.
- Subscriber system of record: Beehiiv publication `ResearchAudio` and form `AI Launch Evidence Scorecard — web acquisition`.
- Traffic source of truth: Cloudflare Web Analytics uses the same privacy-first site tag on `researchaudio.io` and `tools.researchaudio.io` to report page views and referrers. It does not replace Beehiiv conversion attribution.
- Weekly funnel review: compare tool page views and referrers in Cloudflare with new active Beehiiv subscriptions attributed to `ai_evidence_lab`; optimize pages with qualified traffic and no signup conversion before adding more pages.

## Local verification

```bash
node scripts/verify-site.mjs
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Distribution loop

1. Deploy on `main`; the workflow verifies the site and notifies IndexNow of every sitemap URL.
2. Match the instrument to the briefing: launch proof, operating cost, agent reliability, voice latency, or automation ROI.
3. Link it near the first decision table in every relevant ResearchAudio web post.
4. Publish one result card per issue on LinkedIn, X, Reddit, and relevant engineering communities.
5. Redirect new Evidence Lab subscribers into the starter kit, then use its attributed share action and three-referral reward to compound distribution.
6. Offer the sixteen-widget embed library to technical publishers; each tool keeps a visible ResearchAudio credit and rewrites signup links to the publisher-specific `embed_*` source.
7. Review Beehiiv source and campaign breakdowns weekly. Keep only channels that produce active subscribers, not raw clicks.
