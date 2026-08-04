# ResearchAudio AI Launch Evidence Scorecard

An evergreen acquisition tool for ResearchAudio. Visitors score an AI launch against seven evidence gates, receive an immediate classification, and can subscribe through the dedicated Beehiiv form.

## Growth contract

- Primary metric: new active subscribers attributed to `utm_campaign=ai_launch_scorecard`.
- Supporting metrics: qualified visits, scorecard completion rate, subscribe conversion rate, and shared-score visits.
- Target model: 400 qualified visits per day at 25% conversion yields 100 subscribers per day. This is a traffic and conversion target, not a launch-day guarantee.
- Source contract: every distributed URL must include `utm_source`, `utm_medium`, `utm_campaign=ai_launch_scorecard`, and a meaningful `utm_content` value.
- Subscriber system of record: Beehiiv publication `ResearchAudio` and form `AI Launch Evidence Scorecard — web acquisition`.

## Local verification

```bash
node scripts/verify-site.mjs
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Distribution loop

1. Link the tool from every launch teardown near the first evidence table.
2. Publish one score card per issue on LinkedIn, X, Reddit, and relevant engineering communities.
3. Use the built-in share action to carry `scorecard_share / referral` attribution.
4. Review Beehiiv source and campaign breakdowns weekly. Keep only channels that produce active subscribers, not raw clicks.
