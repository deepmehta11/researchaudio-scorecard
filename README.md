# ResearchAudio Evidence Lab

An evergreen acquisition ecosystem for ResearchAudio. Four browser-local tools turn AI launch claims, workflow economics, agent reliability, and automation business cases into concrete inspections before inviting visitors into the newsletter.

## Live instruments

- `/` — AI Launch Evidence Scorecard: seven gates for decision-ready launch evidence.
- `/ai-cost-calculator/` — retry-adjusted cost per successful AI task.
- `/agent-loop-diagnostic/` — ten production guardrails for agent loops.
- `/ai-agent-roi-calculator/` — AI agent ROI after failure, human review, recurring cost, and implementation payback.
- `/evidence-starter-kit/` — post-signup activation, four-tool progress, referral reward explanation, and attributed sharing.
- `/tools/` — crawlable, interlinked Evidence Lab hub.

Every instrument uses the dedicated Beehiiv acquisition form and keeps user inputs in the browser.

Every main-branch deployment also verifies the site and submits all sitemap URLs to the IndexNow global endpoint after the public ownership key is available. IndexNow speeds discovery by participating search engines; it does not guarantee crawling, indexing, or rankings.

## Growth contract

- Primary metric: new active subscribers attributed to `utm_campaign=ai_evidence_lab` or the legacy `ai_launch_scorecard` launch-instrument campaign.
- Supporting metrics: qualified visits, scorecard completion rate, subscribe conversion rate, and shared-score visits.
- Target model: 400 qualified visits per day at 25% conversion yields 100 subscribers per day. This is a traffic and conversion target, not a launch-day guarantee.
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
2. Match the instrument to the briefing: launch proof, operating cost, agent reliability, or automation ROI.
3. Link it near the first decision table in every relevant ResearchAudio web post.
4. Publish one result card per issue on LinkedIn, X, Reddit, and relevant engineering communities.
5. Redirect new Evidence Lab subscribers into the starter kit, then use its attributed share action and three-referral reward to compound distribution.
6. Review Beehiiv source and campaign breakdowns weekly. Keep only channels that produce active subscribers, not raw clicks.
