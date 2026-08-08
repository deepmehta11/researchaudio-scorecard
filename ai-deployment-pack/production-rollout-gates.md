# AI Production Rollout Gates

Every required gate needs a threshold, owner, evidence link, and rollback condition.

| Gate | Required threshold | Evidence | Owner | Status |
| --- | --- | --- | --- | --- |
| User outcome | [target] | [link] | [name] | Pass / Fail / Unknown |
| Task success rate | [percentage] | [link] | [name] | Pass / Fail / Unknown |
| Unrecovered failure rate | [percentage] | [link] | [name] | Pass / Fail / Unknown |
| P95 user-visible latency | [time] | [link] | [name] | Pass / Fail / Unknown |
| Cost per successful outcome | [amount] | [link] | [name] | Pass / Fail / Unknown |
| Human review burden | [minutes or percentage] | [link] | [name] | Pass / Fail / Unknown |
| Permission boundary | [policy] | [link] | [name] | Pass / Fail / Unknown |
| Prompt-injection resistance | [test target] | [link] | [name] | Pass / Fail / Unknown |
| Sensitive-data handling | [policy] | [link] | [name] | Pass / Fail / Unknown |
| Trace and audit coverage | [percentage] | [link] | [name] | Pass / Fail / Unknown |
| Rollback rehearsal | [date and result] | [link] | [name] | Pass / Fail / Unknown |
| Manual fallback | [availability target] | [link] | [name] | Pass / Fail / Unknown |

## Launch cohort

- Users included: [cohort]
- Users excluded: [cohort]
- Start date: [YYYY-MM-DD]
- Review window: [duration]
- Maximum volume: [requests, users, or cases]

## Monitoring

- Primary outcome dashboard: [link]
- Failure review queue: [link]
- Security alerts: [link]
- Cost alerts: [link]
- On-call owner: [person]

## Rollback

- Automatic rollback conditions: [conditions]
- Manual rollback conditions: [conditions]
- Rollback owner: [person]
- Maximum rollback time: [time]
- User communication owner: [person]
- Manual fallback: [procedure]

## Post-launch decision

- Expand when: [conditions]
- Hold when: [conditions]
- Roll back when: [conditions]
- Next review date: [YYYY-MM-DD]
