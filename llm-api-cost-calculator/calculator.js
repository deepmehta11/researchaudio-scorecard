import { buildAttributedShareUrl, restoreSharedNumbers } from "../share-state.js";

const DEFAULTS = {
  requestsPerMonth: 100000,
  inputTokens: 1200,
  outputTokens: 300,
  inputPricePerMillion: 1,
  outputPricePerMillion: 5,
  cacheHitRate: 30,
  cacheDiscount: 75,
  retryOverhead: 8,
  otherCostPerRequest: 0,
};

function nonNegative(value) {
  return Math.max(0, Number(value) || 0);
}

function percentage(value) {
  return Math.min(100, nonNegative(value)) / 100;
}

export function calculateLlmApiCost({
  requestsPerMonth,
  inputTokens,
  outputTokens,
  inputPricePerMillion,
  outputPricePerMillion,
  cacheHitRate,
  cacheDiscount,
  retryOverhead,
  otherCostPerRequest,
}) {
  const requests = nonNegative(requestsPerMonth);
  const inputTokensPerRequest = nonNegative(inputTokens);
  const outputTokensPerRequest = nonNegative(outputTokens);
  const inputPrice = nonNegative(inputPricePerMillion);
  const outputPrice = nonNegative(outputPricePerMillion);
  const cacheRate = percentage(cacheHitRate);
  const discount = percentage(cacheDiscount);
  const retryRate = Math.min(10, nonNegative(retryOverhead) / 100);
  const otherPerRequest = nonNegative(otherCostPerRequest);
  const retryMultiplier = 1 + retryRate;

  const baseInputTokens = requests * inputTokensPerRequest;
  const baseOutputTokens = requests * outputTokensPerRequest;
  const billedInputTokens = baseInputTokens * retryMultiplier;
  const billedOutputTokens = baseOutputTokens * retryMultiplier;
  const effectiveInputPrice = inputPrice * (1 - cacheRate * discount);
  const inputSpend = (billedInputTokens / 1_000_000) * effectiveInputPrice;
  const outputSpend = (billedOutputTokens / 1_000_000) * outputPrice;
  const otherSpend = requests * retryMultiplier * otherPerRequest;
  const totalCost = inputSpend + outputSpend + otherSpend;
  const baseCost = totalCost / retryMultiplier;
  const retrySpend = totalCost - baseCost;
  const cacheSavings = (billedInputTokens / 1_000_000) * inputPrice * cacheRate * discount;
  const totalTokens = billedInputTokens + billedOutputTokens;
  const costPerRequest = requests === 0 ? 0 : totalCost / requests;

  return {
    requests,
    retryMultiplier,
    billedInputTokens,
    billedOutputTokens,
    totalTokens,
    effectiveInputPrice,
    inputSpend,
    outputSpend,
    otherSpend,
    retrySpend,
    cacheSavings,
    totalCost,
    costPerRequest,
  };
}

function money(value) {
  if (value > 0 && value < 0.01) return `$${value.toFixed(4)}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function compactNumber(value) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function statusFor(result) {
  if (result.requests === 0) return "IDLE";
  if (result.retrySpend > result.totalCost * 0.1) return "RETRY WATCH";
  if (result.cacheSavings > result.totalCost * 0.05) return "CACHE-AWARE";
  return "BASELINE";
}

function noteFor(result) {
  if (result.requests === 0) return "Add expected request volume to produce a monthly estimate.";
  const outputShare = result.outputSpend / (result.totalCost || 1);
  if (result.retrySpend > result.totalCost * 0.1) return "Retries add more than 10% to this estimate. Measure retry causes before committing the budget.";
  if (outputShare > 0.6) return "Output tokens dominate the bill. Test shorter responses and tighter stop conditions before changing models.";
  if (result.cacheSavings > result.totalCost * 0.1) return "Prompt caching materially changes this estimate. Confirm the provider's cache rules and observed hit rate.";
  return "Treat this as a budget baseline. Replace assumptions with token and retry observations from production traces.";
}

const form = typeof document === "undefined" ? null : document.querySelector("#llm-cost-form");

if (form) {
  const fields = Object.fromEntries([...form.elements].filter((element) => element.name).map((element) => [element.name, element]));
  const output = {
    total: document.querySelector("#monthly-api-cost"),
    perRequest: document.querySelector("#cost-per-request"),
    input: document.querySelector("#input-spend"),
    output: document.querySelector("#output-spend"),
    other: document.querySelector("#other-spend"),
    retry: document.querySelector("#retry-spend"),
    cache: document.querySelector("#cache-savings"),
    tokens: document.querySelector("#monthly-tokens"),
    note: document.querySelector("#llm-cost-note"),
    status: document.querySelector("#llm-cost-status"),
    shareStatus: document.querySelector("#share-status"),
  };

  function readInputs() {
    return Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value]));
  }

  const sharedValues = restoreSharedNumbers(fields, window.location.search);

  function update() {
    const result = calculateLlmApiCost(readInputs());
    output.total.textContent = money(result.totalCost);
    output.perRequest.textContent = money(result.costPerRequest);
    output.input.textContent = money(result.inputSpend);
    output.output.textContent = money(result.outputSpend);
    output.other.textContent = money(result.otherSpend);
    output.retry.textContent = money(result.retrySpend);
    output.cache.textContent = money(result.cacheSavings);
    output.tokens.textContent = compactNumber(result.totalTokens);
    output.note.textContent = noteFor(result);
    output.status.textContent = statusFor(result);
    output.shareStatus.textContent = "";
  }

  form.addEventListener("input", update);
  document.querySelector("#reset-llm-cost").addEventListener("click", () => {
    Object.entries(DEFAULTS).forEach(([name, value]) => { fields[name].value = value; });
    update();
    fields.requestsPerMonth.focus();
  });

  document.querySelector("#share-llm-cost").addEventListener("click", async () => {
    const result = calculateLlmApiCost(readInputs());
    const url = buildAttributedShareUrl(
      window.location.href,
      readInputs(),
      { source: "llm_cost_share", content: "shared_llm_cost_result" },
    );
    const text = `My estimated LLM API bill is ${money(result.totalCost)} per month, including caching and retry overhead. Calculate yours:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "LLM API Cost Calculator", text, url: url.toString() });
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
    output.shareStatus.textContent = "Shared budget loaded. Change any input to compare your workload.";
  }
}
