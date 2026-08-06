import { buildAttributedShareUrl, restoreSharedNumbers } from "../share-state.js";

const DEFAULTS = {
  callsPerMonth: 5000,
  minutesPerCall: 4,
  platformPerMinute: 0.05,
  telephonyPerMinute: 0.014,
  sttPerMinute: 0.006,
  ttsPerMinute: 0.03,
  llmPerMinute: 0.005,
  fixedMonthlyCost: 200,
  resolutionRate: 70,
  handoffMinutes: 6,
  humanHourlyCost: 30,
  humanCostPerCall: 4,
};

function nonNegative(value) {
  return Math.max(0, Number(value) || 0);
}

function percentage(value) {
  return Math.min(100, nonNegative(value)) / 100;
}

export function calculateVoiceAiCost({
  callsPerMonth,
  minutesPerCall,
  platformPerMinute,
  telephonyPerMinute,
  sttPerMinute,
  ttsPerMinute,
  llmPerMinute,
  fixedMonthlyCost,
  resolutionRate,
  handoffMinutes,
  humanHourlyCost,
  humanCostPerCall,
}) {
  const calls = nonNegative(callsPerMonth);
  const callMinutes = nonNegative(minutesPerCall);
  const resolution = percentage(resolutionRate);
  const perMinuteStackCost = [
    platformPerMinute,
    telephonyPerMinute,
    sttPerMinute,
    ttsPerMinute,
    llmPerMinute,
  ].reduce((sum, value) => sum + nonNegative(value), 0);
  const fixedCost = nonNegative(fixedMonthlyCost);
  const monthlyMinutes = calls * callMinutes;
  const variableAiCost = monthlyMinutes * perMinuteStackCost;
  const aiMonthlyCost = variableAiCost + fixedCost;
  const resolvedCalls = calls * resolution;
  const unresolvedCalls = calls - resolvedCalls;
  const handoffCostPerUnresolvedCall = nonNegative(handoffMinutes) / 60 * nonNegative(humanHourlyCost);
  const humanHandoffCost = unresolvedCalls * handoffCostPerUnresolvedCall;
  const loadedMonthlyCost = aiMonthlyCost + humanHandoffCost;
  const aiCostPerCall = calls > 0 ? aiMonthlyCost / calls : 0;
  const loadedCostPerCall = calls > 0 ? loadedMonthlyCost / calls : 0;
  const costPerResolvedCall = resolvedCalls > 0 ? loadedMonthlyCost / resolvedCalls : null;
  const humanBaselinePerCall = nonNegative(humanCostPerCall);
  const humanBaselineMonthlyCost = calls * humanBaselinePerCall;
  const monthlySavings = humanBaselineMonthlyCost - loadedMonthlyCost;
  const breakEvenDenominator = humanBaselinePerCall + handoffCostPerUnresolvedCall;
  const breakEvenResolutionRate = calls > 0 && breakEvenDenominator > 0
    ? (aiCostPerCall + handoffCostPerUnresolvedCall) / breakEvenDenominator
    : null;

  return {
    calls,
    callMinutes,
    resolution,
    perMinuteStackCost,
    monthlyMinutes,
    variableAiCost,
    aiMonthlyCost,
    resolvedCalls,
    unresolvedCalls,
    handoffCostPerUnresolvedCall,
    humanHandoffCost,
    loadedMonthlyCost,
    aiCostPerCall,
    loadedCostPerCall,
    costPerResolvedCall,
    humanBaselinePerCall,
    humanBaselineMonthlyCost,
    monthlySavings,
    breakEvenResolutionRate,
  };
}

function currency(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Math.min(2, maximumFractionDigits),
    maximumFractionDigits,
  }).format(value);
}

function count(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function percent(value) {
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

function statusFor(result) {
  if (result.calls === 0 || result.resolvedCalls === 0) return "ADD INPUTS";
  if (result.humanBaselinePerCall === 0) return "MODELED";
  return result.costPerResolvedCall <= result.humanBaselinePerCall ? "BELOW BASELINE" : "ABOVE BASELINE";
}

function noteFor(result) {
  if (result.calls === 0) return "Add monthly call volume to calculate voice-agent economics.";
  if (result.resolvedCalls === 0) return "A zero resolution rate produces no AI-resolved calls. Add a measured resolution rate.";
  if (result.humanBaselinePerCall === 0) return "Add the current human cost per resolved call to create a break-even comparison.";
  if (result.breakEvenResolutionRate !== null && result.breakEvenResolutionRate > 1) {
    return "Even 100% resolution would not beat the stated human baseline. Reduce stack or fixed cost before scaling.";
  }
  if (result.costPerResolvedCall <= result.humanBaselinePerCall) {
    return "The loaded cost beats the stated human baseline by " + currency(result.humanBaselinePerCall - result.costPerResolvedCall) + " per AI-resolved call. Validate resolution quality before scaling.";
  }
  return "The current stack needs about " + percent(result.breakEvenResolutionRate) + " resolution to beat the stated human cost per resolved call.";
}

const form = typeof document === "undefined" ? null : document.querySelector("#voice-cost-form");

if (form) {
  const fields = Object.fromEntries([...form.elements].filter((element) => element.name).map((element) => [element.name, element]));
  const output = {
    primary: document.querySelector("#cost-per-resolution"),
    status: document.querySelector("#voice-cost-status"),
    monthly: document.querySelector("#loaded-monthly-cost"),
    stack: document.querySelector("#stack-cost-minute"),
    aiCall: document.querySelector("#ai-cost-call"),
    resolved: document.querySelector("#resolved-calls"),
    handoff: document.querySelector("#handoff-cost"),
    savings: document.querySelector("#monthly-savings"),
    note: document.querySelector("#voice-cost-note"),
    shareStatus: document.querySelector("#share-status"),
  };

  function readInputs() {
    return Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value]));
  }

  const sharedValues = restoreSharedNumbers(fields, window.location.search);

  function update() {
    const result = calculateVoiceAiCost(readInputs());
    output.primary.textContent = result.costPerResolvedCall === null ? "—" : currency(result.costPerResolvedCall);
    output.status.textContent = statusFor(result);
    output.monthly.textContent = currency(result.loadedMonthlyCost, 0);
    output.stack.textContent = currency(result.perMinuteStackCost, 3);
    output.aiCall.textContent = currency(result.aiCostPerCall, 3);
    output.resolved.textContent = count(result.resolvedCalls);
    output.handoff.textContent = currency(result.humanHandoffCost, 0);
    output.savings.textContent = (result.monthlySavings >= 0 ? "+" : "−") + currency(Math.abs(result.monthlySavings), 0);
    output.note.textContent = noteFor(result);
    output.shareStatus.textContent = "";
  }

  form.addEventListener("input", update);
  document.querySelector("#reset-voice-cost").addEventListener("click", () => {
    Object.entries(DEFAULTS).forEach(([name, value]) => { fields[name].value = value; });
    update();
    fields.callsPerMonth.focus();
  });

  document.querySelector("#share-voice-cost").addEventListener("click", async () => {
    const result = calculateVoiceAiCost(readInputs());
    const url = buildAttributedShareUrl(
      window.location.href,
      readInputs(),
      { source: "voice_cost_share", content: "shared_voice_cost_result" },
    );
    const resultText = result.costPerResolvedCall === null ? "not yet calculable" : currency(result.costPerResolvedCall);
    const text = "My loaded voice AI cost is " + resultText + " per AI-resolved call. Model your stack:";
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Voice Agent Cost Calculator", text, url: url.toString() });
        output.shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(text + " " + url);
        output.shareStatus.textContent = "Share text copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") output.shareStatus.textContent = "Copy the page URL to share this cost model.";
    }
  });

  update();
  if (Object.keys(sharedValues).length > 0) {
    output.shareStatus.textContent = "Shared voice cost model loaded. Change any input to compare stacks.";
  }
}
