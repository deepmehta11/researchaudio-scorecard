import { buildAttributedShareUrl, restoreSharedNumbers } from "../share-state.js";

const DEFAULTS = {
  requestsPerMonth: 100000,
  reusableInputTokens: 8000,
  uncachedPricePerMillion: 3,
  cacheReadPricePerMillion: 0.3,
  cacheWritePricePerMillion: 3.75,
  cacheHitRate: 80,
};

function nonNegative(value) {
  return Math.max(0, Number(value) || 0);
}

function percentage(value) {
  return Math.min(100, nonNegative(value)) / 100;
}

export function calculatePromptCacheSavings({
  requestsPerMonth,
  reusableInputTokens,
  uncachedPricePerMillion,
  cacheReadPricePerMillion,
  cacheWritePricePerMillion,
  cacheHitRate,
}) {
  const requests = nonNegative(requestsPerMonth);
  const tokensPerRequest = nonNegative(reusableInputTokens);
  const uncachedPrice = nonNegative(uncachedPricePerMillion);
  const cacheReadPrice = nonNegative(cacheReadPricePerMillion);
  const cacheWritePrice = nonNegative(cacheWritePricePerMillion);
  const hitRate = percentage(cacheHitRate);
  const hitRequests = requests * hitRate;
  const missRequests = requests - hitRequests;
  const reusableTokens = requests * tokensPerRequest;
  const cacheReadTokens = hitRequests * tokensPerRequest;
  const cacheWriteTokens = missRequests * tokensPerRequest;
  const uncachedCost = (reusableTokens / 1_000_000) * uncachedPrice;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * cacheReadPrice;
  const cacheWriteCost = (cacheWriteTokens / 1_000_000) * cacheWritePrice;
  const cachedCost = cacheReadCost + cacheWriteCost;
  const savings = uncachedCost - cachedCost;
  const savingsRate = uncachedCost === 0 ? 0 : savings / uncachedCost;
  const costPerRequest = requests === 0 ? 0 : cachedCost / requests;

  let breakEvenHitRate = null;
  if (cacheWritePrice <= uncachedPrice) {
    breakEvenHitRate = 0;
  } else if (cacheReadPrice < uncachedPrice && cacheWritePrice > cacheReadPrice) {
    const threshold = (cacheWritePrice - uncachedPrice) / (cacheWritePrice - cacheReadPrice);
    if (threshold < 1) breakEvenHitRate = Math.max(0, threshold);
  }

  return {
    requests,
    tokensPerRequest,
    hitRate,
    hitRequests,
    missRequests,
    reusableTokens,
    cacheReadTokens,
    cacheWriteTokens,
    uncachedCost,
    cacheReadCost,
    cacheWriteCost,
    cachedCost,
    savings,
    savingsRate,
    costPerRequest,
    breakEvenHitRate,
  };
}

function money(value) {
  if (Math.abs(value) > 0 && Math.abs(value) < 0.01) return `${value < 0 ? "-" : ""}$${Math.abs(value).toFixed(4)}`;
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
  if (result.savings <= 0) return "COSTS MORE";
  if (result.breakEvenHitRate !== null && result.hitRate <= result.breakEvenHitRate) return "BELOW BREAK-EVEN";
  if (result.savingsRate >= 0.5) return "HIGH LEVERAGE";
  return "SAVING";
}

function noteFor(result) {
  if (result.requests === 0) return "Add expected request volume to model prompt-cache economics.";
  if (result.breakEvenHitRate === null) return "These read and write prices cannot beat the uncached baseline at any hit rate. Check the current provider rates.";
  if (result.savings <= 0) return `This workload needs more than ${(result.breakEvenHitRate * 100).toFixed(1)}% cache hits to save money.`;
  if (result.savingsRate >= 0.5) return "Caching removes more than half of the reusable-input baseline. Validate that these tokens are actually eligible and stable.";
  return "Caching saves money in this scenario. Confirm the observed hit rate, cache lifetime, and write behavior in production traces.";
}

const form = typeof document === "undefined" ? null : document.querySelector("#prompt-cache-form");

if (form) {
  const fields = Object.fromEntries([...form.elements].filter((element) => element.name).map((element) => [element.name, element]));
  const output = {
    savings: document.querySelector("#monthly-cache-savings"),
    cachedCost: document.querySelector("#cached-input-cost"),
    uncachedCost: document.querySelector("#uncached-input-cost"),
    savingsRate: document.querySelector("#cache-savings-rate"),
    breakEven: document.querySelector("#break-even-hit-rate"),
    readCost: document.querySelector("#cache-read-spend"),
    writeCost: document.querySelector("#cache-write-spend"),
    requests: document.querySelector("#cache-request-split"),
    note: document.querySelector("#prompt-cache-note"),
    status: document.querySelector("#prompt-cache-status"),
    shareStatus: document.querySelector("#share-status"),
  };

  function readInputs() {
    return Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value]));
  }

  const sharedValues = restoreSharedNumbers(fields, window.location.search);

  function update() {
    const result = calculatePromptCacheSavings(readInputs());
    output.savings.textContent = money(result.savings);
    output.cachedCost.textContent = money(result.cachedCost);
    output.uncachedCost.textContent = money(result.uncachedCost);
    output.savingsRate.textContent = `${(result.savingsRate * 100).toFixed(1)}%`;
    output.breakEven.textContent = result.breakEvenHitRate === null ? "Not reachable" : `${(result.breakEvenHitRate * 100).toFixed(1)}%`;
    output.readCost.textContent = money(result.cacheReadCost);
    output.writeCost.textContent = money(result.cacheWriteCost);
    output.requests.textContent = `${compactNumber(result.hitRequests)} hit / ${compactNumber(result.missRequests)} miss`;
    output.note.textContent = noteFor(result);
    output.status.textContent = statusFor(result);
    output.shareStatus.textContent = "";
  }

  form.addEventListener("input", update);
  document.querySelector("#reset-prompt-cache").addEventListener("click", () => {
    Object.entries(DEFAULTS).forEach(([name, value]) => { fields[name].value = value; });
    update();
    fields.requestsPerMonth.focus();
  });

  document.querySelector("#share-prompt-cache").addEventListener("click", async () => {
    const result = calculatePromptCacheSavings(readInputs());
    const url = buildAttributedShareUrl(
      window.location.href,
      readInputs(),
      { source: "prompt_cache_share", content: "shared_prompt_cache_result" },
    );
    const text = `Prompt caching changes this workload by ${money(result.savings)} per month at a ${(result.hitRate * 100).toFixed(1)}% hit rate. Calculate yours:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Prompt Caching Savings Calculator", text, url: url.toString() });
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
    output.shareStatus.textContent = "Shared cache scenario loaded. Change any input to compare your workload.";
  }
}
