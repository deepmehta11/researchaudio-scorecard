import { buildAttributedShareUrl, parseSharedChecklist } from "./share-state.js";
import { buildEvidenceBadgeMarkdown } from "./scorecard-badge.js";

const STORAGE_KEY = "researchaudio-evidence-score-v1";

const checks = [
  {
    name: "access",
    next: "Verify that someone can access the thing being announced.",
  },
  {
    name: "claim",
    next: "Rewrite the main claim as a number or outcome another team can test.",
  },
  {
    name: "baseline",
    next: "Name the baseline and confirm both results used the same conditions.",
  },
  {
    name: "cost",
    next: "Find the price, latency, compute, or token cost behind the headline result.",
  },
  {
    name: "failure",
    next: "Look for documented failure cases, limitations, and untested conditions.",
  },
  {
    name: "reproduction",
    next: "Find enough methods, data, code, prompts, or logs to reproduce the result.",
  },
  {
    name: "owner",
    next: "Record the responsible team, product version, and evaluation date.",
  },
];

const classifications = [
  {
    min: 0,
    title: "Untested claim",
    state: "UNTESTED",
    summary: "Start with the proof you can verify. The score updates as you complete each check.",
  },
  {
    min: 1,
    title: "Marketing claim",
    state: "CLAIM",
    summary: "There is not enough evidence yet to plan, buy, or build around this announcement.",
  },
  {
    min: 3,
    title: "Promising, under-proven",
    state: "PARTIAL",
    summary: "The launch has signal, but a bounded independent test should come before commitment.",
  },
  {
    min: 5,
    title: "Decision-ready",
    state: "USABLE",
    summary: "There is enough evidence for a real evaluation with clearly named open questions.",
  },
  {
    min: 7,
    title: "Evidence-complete",
    state: "VERIFIED",
    summary: "An independent team has a fair chance to reproduce the result and audit its limits.",
  },
];

const form = document.querySelector("#evidence-form");
const inputs = [...form.querySelectorAll('input[type="checkbox"]')];
const heroScore = document.querySelector("#hero-score");
const resultScore = document.querySelector("#result-score");
const resultTitle = document.querySelector("#result-title");
const resultSummary = document.querySelector("#result-summary");
const meterState = document.querySelector("#meter-state");
const meterCaption = document.querySelector("#meter-caption");
const nextAction = document.querySelector("#next-action");
const signalBars = [...document.querySelectorAll("#signal-grid span")];
const shareButton = document.querySelector("#share-score");
const badgeButton = document.querySelector("#copy-readme-badge");
const shareStatus = document.querySelector("#share-status");
const resetButton = document.querySelector("#reset-score");

function currentClassification(score) {
  return [...classifications].reverse().find((item) => score >= item.min);
}

function selectedNames() {
  return inputs.filter((input) => input.checked).map((input) => input.name);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedNames()));
  } catch {
    // The scorecard still works when storage is unavailable.
  }
}

function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return;
    inputs.forEach((input) => {
      input.checked = saved.includes(input.name);
    });
  } catch {
    // Ignore malformed or blocked local storage.
  }
}

function updateScore() {
  const score = inputs.filter((input) => input.checked).length;
  const classification = currentClassification(score);
  const firstMissing = checks.find((check) => !selectedNames().includes(check.name));

  heroScore.textContent = String(score);
  resultScore.textContent = String(score);
  resultTitle.textContent = classification.title;
  resultSummary.textContent = classification.summary;
  meterState.textContent = classification.state;
  meterCaption.textContent = classification.summary;
  nextAction.textContent = firstMissing
    ? firstMissing.next
    : "Run the same seven checks against the next launch and compare the evidence quality.";
  shareButton.disabled = score === 0;
  badgeButton.disabled = score === 0;

  signalBars.forEach((bar, index) => {
    const active = index < score;
    bar.classList.toggle("active", active);
    bar.style.height = active ? `${38 + index * 8}%` : `${14 + index * 2}%`;
  });

  shareStatus.textContent = "";
  saveState();
}

async function shareScore() {
  const selected = selectedNames();
  const score = selected.length;
  const classification = currentClassification(score);
  const url = buildAttributedShareUrl(
    window.location.href,
    { checks: selected },
    { source: "scorecard_share", content: `shared_score_${score}`, hash: "scorecard" },
  );

  const text = `This AI launch scored ${score}/7: ${classification.title}. Run the ResearchAudio evidence check:`;

  try {
    if (navigator.share) {
      await navigator.share({ title: "AI Launch Evidence Scorecard", text, url: url.toString() });
      shareStatus.textContent = "Share sheet opened.";
      return;
    }

    await navigator.clipboard.writeText(`${text} ${url}`);
    shareStatus.textContent = "Share text copied.";
  } catch (error) {
    if (error?.name !== "AbortError") {
      shareStatus.textContent = "Copy the page URL to share your score.";
    }
  }
}

async function copyReadmeBadge() {
  const selected = selectedNames();
  const score = selected.length;

  try {
    await navigator.clipboard.writeText(buildEvidenceBadgeMarkdown(window.location.href, selected));
    shareStatus.textContent = `README badge copied for this ${score}/7 result.`;
  } catch {
    shareStatus.textContent = "Clipboard access is unavailable. Use Share this exact score instead.";
  }
}

inputs.forEach((input) => input.addEventListener("change", updateScore));
shareButton.addEventListener("click", shareScore);
badgeButton.addEventListener("click", copyReadmeBadge);
resetButton.addEventListener("click", () => {
  inputs.forEach((input) => {
    input.checked = false;
  });
  updateScore();
  inputs[0].focus();
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
updateScore();
if (sharedSelection !== null) {
  shareStatus.textContent = "Shared score loaded. Change any check to compare your assessment.";
}
