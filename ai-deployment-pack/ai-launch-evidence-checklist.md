# AI Launch Evidence Checklist

Mark each item Pass, Fail, or Unknown. Unknown is not a pass.

## Claim and access

- [ ] The headline claim is written as a falsifiable statement.
- [ ] The exact model, version, checkpoint, runtime, and date are named.
- [ ] Inputs, evaluation prompts, tools, and important settings are available.
- [ ] The tested product is available under the same conditions being promoted.

## Evaluation

- [ ] The benchmark measures the user outcome we care about.
- [ ] Representative failures are preserved and categorized.
- [ ] Baselines include the current human or software workflow.
- [ ] Results can be reproduced by someone outside the launch team.
- [ ] Statistical uncertainty and sample size are visible.

## Economics

- [ ] Cost is calculated per successful outcome, not per token or attempt.
- [ ] Retries, attached calls, review labor, and fixed costs are included.
- [ ] Latency and throughput are measured on the intended deployment path.
- [ ] The pricing and usage assumptions have a dated source.

## Operations and safety

- [ ] Permissions are least-privilege and auditable.
- [ ] Termination, budgets, retries, and recovery are explicit.
- [ ] Prompt injection and untrusted tool output have been tested.
- [ ] A human owns premise changes and high-impact actions.
- [ ] Monitoring, rollback, and the manual fallback are rehearsed.

## Rights and constraints

- [ ] Training data, input data, and output rights are understood.
- [ ] Model and dependency licenses allow the intended use.
- [ ] Data retention, residency, and deletion meet policy.
- [ ] Important limitations appear beside the claim, not in fine print.

## Decision

- Pass count: [number]
- Fail count: [number]
- Unknown count: [number]
- Blocking evidence owner: [person]
- Decision: [ship / pilot / stop / investigate]
