# AI Deployment Decision Brief

Use one brief per system and per decision. Replace every bracketed field. An empty field is evidence that the decision is not ready.

## Decision

- System or workflow: [name]
- Decision owner: [person]
- Decision date: [YYYY-MM-DD]
- Decision to make: [ship / limited pilot / stop / investigate]
- User outcome: [observable outcome for a defined user]
- Current baseline: [time, cost, quality, or failure rate without this system]
- Target: [measurable improvement and deadline]

## Boundary

- Included users and tasks: [cohort]
- Excluded users and tasks: [explicit exclusions]
- Data the system may access: [sources]
- Actions the system may take: [tools and permissions]
- Actions that always require a human: [decisions]

## Evidence

| Question | Evidence | Owner | Status |
| --- | --- | --- | --- |
| Does the exact runtime meet the target? | [link] | [name] | Pass / Fail / Unknown |
| Does it work on representative inputs? | [link] | [name] | Pass / Fail / Unknown |
| Are failures observable and recoverable? | [link] | [name] | Pass / Fail / Unknown |
| Are permissions and data use acceptable? | [link] | [name] | Pass / Fail / Unknown |
| Does cost per successful outcome beat the baseline? | [link] | [name] | Pass / Fail / Unknown |

## Economics

- Variable cost per attempt: [amount]
- Expected attempts per success: [number]
- Human review minutes per attempt: [minutes]
- Cost per successful outcome: [amount]
- Monthly fixed cost: [amount]
- Maximum acceptable cost: [amount]

## Failure budget

- Maximum acceptable task failure rate: [percentage]
- Maximum unrecovered failures per week: [number]
- Maximum security or privacy incidents: [number]
- Maximum user-visible latency: [time]
- Rollback trigger: [objective condition]

## Decision rule

- Ship when: [all required gates]
- Pilot when: [bounded unknowns and cohort]
- Stop when: [failed premise, safety boundary, or economics]

## Final decision

- Decision: [ship / pilot / stop / investigate]
- Evidence supporting it: [links]
- Remaining unknowns: [list]
- Next review date: [YYYY-MM-DD]
