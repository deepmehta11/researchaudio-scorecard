import { buildAttributedShareUrl, parseSharedChecklist } from "../share-state.js";

const STORAGE_KEY = "researchaudio-ai-task-fit-v1";

export const controls = [
  { name: "target", next: "Name the desired end state before choosing a model or agent." },
  { name: "evidence", next: "Choose the reference source, dataset, or observation the workflow can inspect." },
  { name: "judge", next: "Write a pass/fail rule that does not depend on the model grading itself." },
  { name: "cadence", next: "Return validation early enough to change the next action." },
  { name: "coverage", next: "Add failed cases and edge cases, not only examples of success." },
  { name: "intervention", next: "Give the workflow a safe way to test an idea against the environment." },
  { name: "bounds", next: "Fix the allowed tools, actions, data, time, and spend." },
  { name: "premises", next: "Assign a human owner for changing the goal or inventing new premises." },
];

export function classifyTask(selected = []) {
  const names = new Set(selected);
  const score = names.size;

  if (!names.has("target")) {
    return {
      title: "The task still needs a jump",
      status: "NO TARGET",
      risk: "Very high",
      summary: "The workflow is being asked to invent what success means. Keep premise selection with a human, or redesign the task around an explicit target.",
    };
  }

  if (!names.has("judge") || !names.has("cadence")) {
    return {
      title: "The error signal is too weak",
      status: "WEAK SIGNAL",
      risk: "High",
      summary: "A target exists, but the workflow cannot reliably tell whether an action moved toward it in time to correct course.",
    };
  }

  if (score >= 7) {
    return {
      title: "Execution-ready task",
      status: "READY",
      risk: "Lower",
      summary: "The task has a target, usable feedback, and bounded execution. Validate the design with real traces before increasing autonomy.",
    };
  }

  if (score >= 5) {
    return {
      title: "Partially framed task",
      status: "EXPOSED",
      risk: "Moderate",
      summary: "The core feedback loop exists, but missing evidence, coverage, intervention, or ownership can still make the result brittle.",
    };
  }

  return {
    title: "Poorly framed task",
    status: "FRAGILE",
    risk: "High",
    summary: "The workflow has a target and feedback, but too few surrounding constraints to make autonomous execution dependable.",
  };
}

const form = typeof document === "undefined" ? null : document.querySelector("#task-fit-form");

if (form) {
  const inputs = [...form.querySelectorAll('input[type="checkbox"]')];
  const scoreNode = document.querySelector("#task-fit-score");
  const statusNode = document.querySelector("#task-fit-status");
  const titleNode = document.querySelector("#task-fit-result-title");
  const summaryNode = document.querySelector("#task-fit-summary");
  const nextNode = document.querySelector("#task-fit-next");
  const riskNode = document.querySelector("#task-fit-risk");
  const shareButton = document.querySelector("#share-task-fit");
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
    const classification = classifyTask(selected);
    const firstMissing = controls.find((control) => !selected.includes(control.name));
    scoreNode.textContent = String(selected.length);
    statusNode.textContent = classification.status;
    titleNode.textContent = classification.title;
    summaryNode.textContent = classification.summary;
    riskNode.textContent = classification.risk;
    nextNode.textContent = firstMissing ? firstMissing.next : "Run the task on a small, reversible case and inspect the trace.";
    shareButton.disabled = selected.length === 0;
    shareStatus.textContent = "";
    saveState();
  }

  inputs.forEach((input) => input.addEventListener("change", update));
  document.querySelector("#reset-task-fit").addEventListener("click", () => {
    inputs.forEach((input) => { input.checked = false; });
    update();
    inputs[0].focus();
  });

  shareButton.addEventListener("click", async () => {
    const selected = selectedNames();
    const classification = classifyTask(selected);
    const url = buildAttributedShareUrl(
      window.location.href,
      { checks: selected },
      { source: "task_fit_diagnostic_share", content: `shared_task_fit_${selected.length}` },
    );
    const text = `This AI task has ${selected.length}/8 framing controls: ${classification.title}. Check yours:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Task Fit Diagnostic", text, url: url.toString() });
        shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        shareStatus.textContent = "Share text copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") shareStatus.textContent = "Copy the page URL to share the diagnosis.";
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
    shareStatus.textContent = "Shared diagnosis loaded. Change any answer to compare the task.";
  }
}
