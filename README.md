# ResearchAudio Evidence Lab

An evergreen acquisition ecosystem for ResearchAudio. Twelve browser-local tools, six practical field guides, and a self-serve embed library turn AI benchmark and launch claims, token budgets, voice latency and outcome economics, GPU and KV-cache sizing, cache economics, workflow economics, agent reliability and security, automation business cases, and Codex configuration into concrete inspections before inviting visitors into the daily briefing.

Live at `https://tools.researchaudio.io/`, a branded ResearchAudio subdomain connected to the Beehiiv publication at `https://researchaudio.io/`.

## Live instruments

- `/` — AI Launch Evidence Scorecard: seven gates for decision-ready launch evidence.
- `/ai-cost-calculator/` — retry-adjusted cost per successful AI task.
- `/agent-loop-diagnostic/` — ten production guardrails for agent loops.
- `/ai-agent-roi-calculator/` — AI agent ROI after failure, human review, recurring cost, and implementation payback.
- `/llm-api-cost-calculator/` — monthly LLM API budget after input/output tokens, caching, retries, and attached usage costs.
- `/prompt-caching-calculator/` — cache-read and cache-write economics with a break-even hit-rate calculation.
- `/codex-config-generator/` — copy-ready Codex CLI project document fallbacks and instruction byte limits.
- `/voice-ai-latency-calculator/` — first-audio latency across endpointing, transcription, parallel fast and slow model branches, TTS, and playout.
- `/kv-cache-calculator/` — exact KV-cache memory per token, full-context sequence, concurrency level, and GQA/MHA architecture.
- `/voice-ai-cost-calculator/` — loaded cost per AI-resolved call after platform, telephony, STT, TTS, LLM, fixed fees, and human handoffs.
- `/voice-ai-cost-per-minute/` — crawlable field note with the full stack-rate formula and editable sensitivity scenarios.
- `/ai-receptionist-cost/` — crawlable monthly worksheet with after-hours, appointment, and high-volume call scenarios.
- `/70b-llm-gpu-requirements/` — crawlable INT4, INT8, and FP16 guide with explicit 32K KV-cache scenarios.
- `/qwen2-5-gpu-requirements/` — crawlable Qwen2.5 7B, 32B, and 72B matrix across INT4, INT8, BF16, 32K KV cache, and 128K context.
- `/ai-agent-security-checklist/` — interactive 12-point control review grounded in current OWASP, Anthropic, and NIST primary guidance.
- `/ai-benchmark-audit-checklist/` — interactive 12-point reproducibility review grounded in current OpenAI, Anthropic, METR, and Terminal-Bench primary sources.
- `/llm-gpu-memory-calculator/` — model-weight VRAM, optional architecture-aware KV cache, runtime headroom, usable memory, and minimum GPU count.
- `/evidence-starter-kit/` — post-signup activation, four-tool progress, referral reward explanation, and attributed sharing.
- `/tools/` — crawlable, interlinked Evidence Lab hub.
- `/embeds/` — copy-ready, source-attributed iframe widgets for publishers who want a benchmark audit, security checklist, or working calculator inside an article, documentation page, or resource library.

Every instrument uses the dedicated Beehiiv acquisition form and keeps user inputs in the browser.

Every result share is restorable: the recipient opens the sender's exact score, diagnosis, budget, or business case with referral UTMs intact instead of landing on a blank default tool.

Every main-branch deployment also verifies the site and submits all sitemap URLs to the IndexNow global endpoint after the public ownership key is available. IndexNow speeds discovery by participating search engines; it does not guarantee crawling, indexing, or rankings.

## Growth contract

- Primary metric: new active subscribers attributed to `utm_campaign=ai_evidence_lab` or the legacy `ai_launch_scorecard` launch-instrument campaign.
- Supporting metrics: qualified visits, scorecard completion rate, subscribe conversion rate, and shared-score visits.
- Target model: ResearchAudio does not yet have an observed organic signup rate. At a 3% planning assumption, 100 subscribers per day requires about 3,333 qualified visits per day; replace the assumption as soon as measured conversion data exists.
- Stage gates: first 10 attributable organic signups, then a stable page-level conversion rate, then 25 per day, then 100 per day. Page launches and visits do not count as subscriber outcomes.
- Source contract: every distributed URL must include `utm_source`, `utm_medium`, `utm_campaign=ai_evidence_lab`, and a meaningful `utm_content` value.
- Subscriber system of record: Beehiiv publication `ResearchAudio` and form `AI Launch Evidence Scorecard — web acquisition`.

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
6. Offer the seven-widget embed library to technical publishers; each checklist and calculator keeps a visible ResearchAudio credit and rewrites signup links to the publisher-specific `embed_*` source.
7. Review Beehiiv source and campaign breakdowns weekly. Keep only channels that produce active subscribers, not raw clicks.
