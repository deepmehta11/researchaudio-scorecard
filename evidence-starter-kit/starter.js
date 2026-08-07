const STORAGE_KEY = "researchaudio_evidence_starter_progress_v1";
const checks = [...document.querySelectorAll("[data-step]")];
const progressCount = document.querySelector("#progress-count");
const progressBar = document.querySelector("#progress-bar");

function readProgress() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function renderProgress(progress) {
  checks.forEach((check) => { check.checked = progress.has(check.dataset.step); });
  progressCount.textContent = `${progress.size} / ${checks.length} complete`;
  progressBar.style.width = `${(progress.size / checks.length) * 100}%`;
}

const progress = readProgress();
renderProgress(progress);

checks.forEach((check) => {
  check.addEventListener("change", () => {
    if (check.checked) progress.add(check.dataset.step);
    else progress.delete(check.dataset.step);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...progress]));
    renderProgress(progress);
  });
});

const currentUrl = new URL(window.location.href);
if (currentUrl.searchParams.get("utm_medium") === "onboarding") {
  document.querySelector("#starter-context").textContent = "You're in. Start with one decision, run the four tests, then pass the lab to the teammate who needs the result.";
  document.querySelector("#onboarding-loop").hidden = false;
  document.querySelector("#subscribe").hidden = true;
  const headerAction = document.querySelector(".join-link");
  headerAction.href = "#onboarding-loop";
  headerAction.textContent = "Share the kit";
}

document.querySelectorAll("[data-share-kit]").forEach((button) => {
  button.addEventListener("click", async () => {
    const shareStatus = button.closest("[data-share-panel]").querySelector(".share-status");
    const url = new URL("https://tools.researchaudio.io/evidence-starter-kit/");
    url.searchParams.set("utm_source", "evidence_starter_share");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", "ai_evidence_lab");
    url.searchParams.set("utm_content", button.dataset.shareContent);
    const text = "Four free tests for the AI claim, operating cost, agent loop, and business case:";

    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Evidence Starter Kit", text, url: url.toString() });
        shareStatus.textContent = "Share options opened.";
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        shareStatus.textContent = "Starter kit link copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") shareStatus.textContent = "Copy the page URL to share the starter kit.";
    }
  });
});
