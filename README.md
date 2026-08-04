# ResearchAudio Evidence Lab

An evergreen acquisition ecosystem for ResearchAudio. Three browser-local tools turn AI launch claims, workflow economics, and agent reliability into concrete inspections before inviting visitors into the newsletter.

## Live instruments

- `/` — AI Launch Evidence Scorecard: seven gates for decision-ready launch evidence.
- `/ai-cost-calculator/` — retry-adjusted cost per successful AI task.
- `/agent-loop-diagnostic/` — ten production guardrails for agent loops.
- `/tools/` — crawlable, interlinked Evidence Lab hub.

Every instrument uses the dedicated Beehiiv acquisition form and keeps user inputs in the browser.

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

1. Match the instrument to the briefing: launch proof, operating cost, or agent reliability.
2. Link it near the first decision table in every relevant ResearchAudio web post.
3. Publish one result card per issue on LinkedIn, X, Reddit, and relevant engineering communities.
4. Use built-in share actions; each carries tool-specific referral attribution.
5. Review Beehiiv source and campaign breakdowns weekly. Keep only channels that produce active subscribers, not raw clicks.
