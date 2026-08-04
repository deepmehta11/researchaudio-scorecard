const STORAGE_KEY = "researchaudio-agent-loop-v1";

export const controls = [
  { name: "success", next: "Define a machine-checkable success condition." },
  { name: "cap", next: "Cap every retry path by attempts, time, tokens, or cost." },
  { name: "state", next: "Inspect current state before the loop chooses another action." },
  { name: "output", next: "Validate tool outputs and postconditions before continuing." },
  { name: "failure", next: "Route retryable, permanent, policy, and input failures differently." },
  { name: "checkpoint", next: "Checkpoint useful state so recovery does not replay the workflow." },
  { name: "budget", next: "Add explicit budget and latency guards." },
  { name: "escalation", next: "Define when and how the loop escalates to a human." },
  { name: "termination", next: "Test success, exhaustion, cancellation, timeout, and repeated failure." },
  { name: "trace", next: "Retain the inputs, actions, state changes, and stop reason." },
];

export function classifyLoop(score) {
  if (score >= 9) return { title: "Production-controlled loop", status: "CONTROLLED", risk: "Low", summary: "The loop has strong operational containment. Verify these controls against live traces and incident drills." };
  if (score >= 7) return { title: "Controlled, with gaps", status: "EXPOSED", risk: "Moderate", summary: "The major guardrails exist, but one missing control can still make recovery or explanation unreliable." };
  if (score >= 4) return { title: "Bounded, not resilient", status: "FRAGILE", risk: "High", summary: "The loop has partial containment, but failure paths still depend on luck or operator intuition." };
  return { title: "Blind loop", status: "BLIND", risk: "Critical", summary: "The workflow can act, but there is not enough control to trust how it stops or recovers." };
}

const form = typeof document === "undefined" ? null : document.querySelector("#loop-form");

if (form) {
  const inputs = [...form.querySelectorAll('input[type="checkbox"]')];
  const scoreNode = document.querySelector("#loop-score");
  const statusNode = document.querySelector("#loop-status");
  const titleNode = document.querySelector("#loop-result-title");
  const summaryNode = document.querySelector("#loop-summary");
  const nextNode = document.querySelector("#loop-next");
  const riskNode = document.querySelector("#loop-risk");
  const shareButton = document.querySelector("#share-loop");
  const shareStatus = document.querySelector("#share-status");

  function selectedNames() {
    return inputs.filter((input) => input.checked).map((input) => input.name);
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedNames())); } catch { /* The diagnostic still works without storage. */ }
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
    const classification = classifyLoop(score);
    const firstMissing = controls.find((control) => !selected.includes(control.name));
    scoreNode.textContent = String(score);
    statusNode.textContent = classification.status;
    titleNode.textContent = classification.title;
    summaryNode.textContent = classification.summary;
    riskNode.textContent = classification.risk;
    nextNode.textContent = firstMissing ? firstMissing.next : "Run an incident drill and verify the trace proves every control.";
    shareButton.disabled = score === 0;
    shareStatus.textContent = "";
    saveState();
  }

  inputs.forEach((input) => input.addEventListener("change", update));
  document.querySelector("#reset-loop").addEventListener("click", () => {
    inputs.forEach((input) => { input.checked = false; });
    update();
    inputs[0].focus();
  });

  shareButton.addEventListener("click", async () => {
    const score = selectedNames().length;
    const classification = classifyLoop(score);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("utm_source", "loop_diagnostic_share");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", "ai_evidence_lab");
    const text = `This AI agent loop has ${score}/10 verified guardrails: ${classification.title}. Inspect yours:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Agent Loop Diagnostic", text, url: url.toString() });
        shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        shareStatus.textContent = "Share text copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") shareStatus.textContent = "Copy the page URL to share the diagnosis.";
    }
  });

  restoreState();
  update();
}
