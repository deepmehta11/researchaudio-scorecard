import { buildAttributedShareUrl, parseSharedChecklist } from "../share-state.js";

const STORAGE_KEY = "researchaudio-agent-security-v1";

export const controls = [
  { name: "goal", next: "Separate trusted goals from untrusted content." },
  { name: "privilege", next: "Reduce every agent and tool identity to least privilege." },
  { name: "approval", next: "Gate irreversible and high-impact actions separately." },
  { name: "sandbox", next: "Isolate filesystem writes and outbound network access." },
  { name: "input", next: "Treat retrieved and user-supplied content as untrusted data." },
  { name: "supply", next: "Record and review the provenance of every tool, MCP server, and plugin." },
  { name: "secrets", next: "Use short-lived scoped credentials and keep them out of model context." },
  { name: "validation", next: "Validate tool inputs, outputs, and postconditions before continuing." },
  { name: "budget", next: "Cap time, spend, retries, concurrency, and delegated work." },
  { name: "trace", next: "Retain a tamper-resistant trail of authority and state changes." },
  { name: "stop", next: "Test cancellation, credential revocation, and child-agent shutdown." },
  { name: "recovery", next: "Define rollback, state invalidation, evidence retention, and safe restart." },
];

export function classifyAgentSecurity(score) {
  if (score >= 11) return { title: "Defense in depth", status: "HARDENED", risk: "Lower", summary: "The authority boundary is layered and observable. Verify it with adversarial tests and a full incident drill." };
  if (score >= 8) return { title: "Guarded, with gaps", status: "GUARDED", risk: "Moderate", summary: "Strong controls are present, but the remaining gaps can still combine into an exploitable path." };
  if (score >= 4) return { title: "Partial containment", status: "PARTIAL", risk: "High", summary: "Some actions are constrained, but hostile input or tool misuse can still cross an unprotected boundary." };
  return { title: "Open authority", status: "OPEN", risk: "Critical", summary: "The agent can act without enough evidence that hostile input or tool misuse will be contained." };
}

const form = typeof document === "undefined" ? null : document.querySelector("#security-form");

if (form) {
  const inputs = [...form.querySelectorAll('input[type="checkbox"]')];
  const scoreNode = document.querySelector("#security-score");
  const statusNode = document.querySelector("#security-status");
  const titleNode = document.querySelector("#security-result-title");
  const summaryNode = document.querySelector("#security-summary");
  const nextNode = document.querySelector("#security-next");
  const riskNode = document.querySelector("#security-risk");
  const shareButton = document.querySelector("#share-security");
  const shareStatus = document.querySelector("#share-status");

  function selectedNames() {
    return inputs.filter((input) => input.checked).map((input) => input.name);
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedNames())); } catch { /* The checklist still works without storage. */ }
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
    const classification = classifyAgentSecurity(score);
    const firstMissing = controls.find((control) => !selected.includes(control.name));
    scoreNode.textContent = String(score);
    statusNode.textContent = classification.status;
    titleNode.textContent = classification.title;
    summaryNode.textContent = classification.summary;
    riskNode.textContent = classification.risk;
    nextNode.textContent = firstMissing ? firstMissing.next : "Run an adversarial test and a full incident-recovery drill.";
    shareButton.disabled = score === 0;
    shareStatus.textContent = "";
    saveState();
  }

  inputs.forEach((input) => input.addEventListener("change", update));
  document.querySelector("#reset-security").addEventListener("click", () => {
    inputs.forEach((input) => { input.checked = false; });
    update();
    inputs[0].focus();
  });

  shareButton.addEventListener("click", async () => {
    const selected = selectedNames();
    const score = selected.length;
    const classification = classifyAgentSecurity(score);
    const url = buildAttributedShareUrl(
      window.location.href,
      { checks: selected },
      { source: "agent_security_checklist_share", content: `shared_security_${score}` },
    );
    const text = `This AI agent path has ${score}/12 enforced security controls: ${classification.title}. Check yours:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Agent Security Checklist", text, url: url.toString() });
        shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        shareStatus.textContent = "Share text copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") shareStatus.textContent = "Copy the page URL to share the checklist.";
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
    shareStatus.textContent = "Shared checklist loaded. Change any control to compare this agent path.";
  }
}
