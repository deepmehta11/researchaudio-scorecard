import { buildAttributedShareUrl, parseSharedChecklist } from "../share-state.js";

const STORAGE_KEY = "researchaudio-benchmark-audit-v1";

export const controls = [
  { name: "suite", next: "Name the benchmark release and exact task set." },
  { name: "model", next: "Pin the exact model or API snapshot and decoding settings." },
  { name: "harness", next: "Publish the prompts, scaffold, tool wiring, and harness version." },
  { name: "budget", next: "Match time, tokens, tools, and retry budgets across systems." },
  { name: "environment", next: "Capture the runtime, dependencies, hardware, dates, and network access." },
  { name: "grader", next: "Define success, tests, rubrics, thresholds, and human review." },
  { name: "distribution", next: "Show that the task mix represents the intended decision." },
  { name: "contamination", next: "Investigate leakage, memorization, invalid tasks, and reward hacking." },
  { name: "uncertainty", next: "Run repeated trials and report the spread or confidence interval." },
  { name: "baseline", next: "Rerun comparison baselines under the identical protocol." },
  { name: "artifacts", next: "Publish per-task outcomes, representative failures, logs, and artifacts." },
  { name: "cost", next: "Report spend, latency, token use, attempts, and human labor." },
];

export function classifyBenchmarkAudit(score) {
  if (score >= 11) return { title: "Reproducible protocol", status: "REPRODUCIBLE", use: "Rerun it", summary: "The protocol is inspectable end to end. Reproduce it independently before extending the conclusion." };
  if (score >= 8) return { title: "Decision-useful", status: "DECISION-USEFUL", use: "Use with bounds", summary: "Most consequential variables are visible. Keep the decision inside the published task distribution and uncertainty." };
  if (score >= 4) return { title: "Partial protocol", status: "PARTIAL", use: "Investigate first", summary: "Some method is visible, but hidden variables can still invalidate a direct comparison or operational decision." };
  return { title: "Headline only", status: "CLAIM", use: "Do not rely on it", summary: "The score is visible, but the protocol is not yet specific enough to reproduce or compare." };
}

const form = typeof document === "undefined" ? null : document.querySelector("#benchmark-form");

if (form) {
  const inputs = [...form.querySelectorAll('input[type="checkbox"]')];
  const scoreNode = document.querySelector("#benchmark-score");
  const statusNode = document.querySelector("#benchmark-status");
  const titleNode = document.querySelector("#benchmark-result-title");
  const summaryNode = document.querySelector("#benchmark-summary");
  const nextNode = document.querySelector("#benchmark-next");
  const useNode = document.querySelector("#benchmark-use");
  const shareButton = document.querySelector("#share-benchmark");
  const shareStatus = document.querySelector("#share-status");

  function selectedNames() {
    return inputs.filter((input) => input.checked).map((input) => input.name);
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedNames())); } catch { /* The audit still works without storage. */ }
  }

  function restoreState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) inputs.forEach((input) => { input.checked = saved.includes(input.name); });
    } catch { /* Ignore unavailable or malformed local state. */ }
  }

  function update() {
    const selected = selectedNames();
    const score = selected.length;
    const classification = classifyBenchmarkAudit(score);
    const firstMissing = controls.find((control) => !selected.includes(control.name));
    scoreNode.textContent = String(score);
    statusNode.textContent = classification.status;
    titleNode.textContent = classification.title;
    summaryNode.textContent = classification.summary;
    useNode.textContent = classification.use;
    nextNode.textContent = firstMissing ? firstMissing.next : "Reproduce the full run independently and document any divergence.";
    shareButton.disabled = score === 0;
    shareStatus.textContent = "";
    saveState();
  }

  inputs.forEach((input) => input.addEventListener("change", update));
  document.querySelector("#reset-benchmark").addEventListener("click", () => {
    inputs.forEach((input) => { input.checked = false; });
    update();
    inputs[0].focus();
  });

  shareButton.addEventListener("click", async () => {
    const selected = selectedNames();
    const score = selected.length;
    const classification = classifyBenchmarkAudit(score);
    const url = buildAttributedShareUrl(
      window.location.href,
      { checks: selected },
      { source: "ai_benchmark_audit_checklist_share", content: `shared_benchmark_${score}` },
    );
    const text = `This AI benchmark claim has ${score}/12 reproducibility checks: ${classification.title}. Audit the protocol:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Benchmark Audit Checklist", text, url: url.toString() });
        shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        shareStatus.textContent = "Benchmark receipt copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") shareStatus.textContent = "Copy the page URL to share this benchmark receipt.";
    }
  });

  const sharedSelection = parseSharedChecklist(
    window.location.search,
    inputs.map((input) => input.name),
  );
  if (sharedSelection === null) {
    restoreState();
  } else {
    inputs.forEach((input) => { input.checked = sharedSelection.includes(input.name); });
  }
  update();
  if (sharedSelection !== null) {
    shareStatus.textContent = "Shared benchmark receipt loaded. Change any field to compare the protocol.";
  }
}
