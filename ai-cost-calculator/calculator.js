import { buildAttributedShareUrl, restoreSharedNumbers } from "../share-state.js";

const DEFAULTS = {
  modelCost: 0.18,
  successRate: 72,
  maxAttempts: 3,
  reviewMinutes: 4,
  hourlyCost: 75,
};

export function calculateCost({ modelCost, successRate, maxAttempts, reviewMinutes, hourlyCost }) {
  const cost = Math.max(0, Number(modelCost) || 0);
  const probability = Math.min(1, Math.max(0.001, (Number(successRate) || 0) / 100));
  const attempts = Math.min(20, Math.max(1, Math.round(Number(maxAttempts) || 1)));
  const reviewTime = Math.max(0, Number(reviewMinutes) || 0);
  const reviewerCost = Math.max(0, Number(hourlyCost) || 0);
  const failureProbability = 1 - probability;
  const eventualSuccess = 1 - failureProbability ** attempts;
  const expectedAttempts = Array.from({ length: attempts }, (_, index) => failureProbability ** index)
    .reduce((sum, value) => sum + value, 0);
  const modelSpend = cost * expectedAttempts;
  const reviewSpend = (reviewTime / 60) * reviewerCost;
  const costPerSuccess = (modelSpend + reviewSpend) / eventualSuccess;

  return { probability, attempts, eventualSuccess, expectedAttempts, modelSpend, reviewSpend, costPerSuccess };
}

function money(value) {
  if (value < 1) return `$${value.toFixed(3)}`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function noteFor(result) {
  const humanShare = result.reviewSpend / (result.modelSpend + result.reviewSpend || 1);
  if (result.eventualSuccess < 0.8) return "More than one in five tasks still fails within the retry limit. Improve the workflow before scaling traffic.";
  if (humanShare > 0.8) return "Human review dominates this workflow. Improve review tooling before chasing cheaper model tokens.";
  if (result.expectedAttempts > 1.5) return "Retries are materially changing the economics. Track failure classes, not only aggregate success rate.";
  return "This workflow is economically controlled. Validate the same assumptions with production traces before committing volume.";
}

const form = typeof document === "undefined" ? null : document.querySelector("#cost-form");

if (form) {
  const fields = Object.fromEntries([...form.elements].filter((element) => element.name).map((element) => [element.name, element]));
  const output = {
    cost: document.querySelector("#cost-per-success"),
    eventual: document.querySelector("#eventual-success"),
    attempts: document.querySelector("#expected-attempts"),
    model: document.querySelector("#model-spend"),
    review: document.querySelector("#review-spend"),
    note: document.querySelector("#cost-note"),
    status: document.querySelector("#cost-status"),
    shareStatus: document.querySelector("#share-status"),
  };

  function readInputs() {
    return Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value]));
  }

  const sharedValues = restoreSharedNumbers(fields, window.location.search);

  function update() {
    const result = calculateCost(readInputs());
    output.cost.textContent = money(result.costPerSuccess);
    output.eventual.textContent = `${(result.eventualSuccess * 100).toFixed(1)}%`;
    output.attempts.textContent = result.expectedAttempts.toFixed(2);
    output.model.textContent = money(result.modelSpend);
    output.review.textContent = money(result.reviewSpend);
    output.note.textContent = noteFor(result);
    output.status.textContent = result.eventualSuccess >= 0.9 ? "CONTROLLED" : result.eventualSuccess >= 0.8 ? "EXPOSED" : "FRAGILE";
    output.shareStatus.textContent = "";
  }

  form.addEventListener("input", update);
  document.querySelector("#reset-cost").addEventListener("click", () => {
    Object.entries(DEFAULTS).forEach(([name, value]) => { fields[name].value = value; });
    update();
    fields.modelCost.focus();
  });

  document.querySelector("#share-cost").addEventListener("click", async () => {
    const result = calculateCost(readInputs());
    const url = buildAttributedShareUrl(
      window.location.href,
      readInputs(),
      { source: "cost_calculator_share", content: "shared_cost_result" },
    );
    const text = `This AI workflow costs about ${money(result.costPerSuccess)} per successful task after retries and review. Calculate yours:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Cost per Successful Task Calculator", text, url: url.toString() });
        output.shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        output.shareStatus.textContent = "Share text copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") output.shareStatus.textContent = "Copy the page URL to share the calculator.";
    }
  });

  update();
  if (Object.keys(sharedValues).length > 0) {
    output.shareStatus.textContent = "Shared estimate loaded. Change any input to compare your workflow.";
  }
}
