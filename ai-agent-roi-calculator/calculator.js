import { buildAttributedShareUrl, restoreSharedNumbers } from "../share-state.js";

const DEFAULTS = {
  tasksPerMonth: 2000,
  minutesPerTask: 8,
  hourlyCost: 65,
  automationCoverage: 60,
  successRate: 85,
  reviewMinutes: 1.5,
  runCost: 0.12,
  recurringCost: 1500,
  implementationCost: 25000,
};

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value) || 0));
}

export function calculateAgentRoi(values) {
  const tasksPerMonth = Math.max(0, Number(values.tasksPerMonth) || 0);
  const minutesPerTask = Math.max(0, Number(values.minutesPerTask) || 0);
  const hourlyCost = Math.max(0, Number(values.hourlyCost) || 0);
  const coverage = clamp(values.automationCoverage, 0, 100) / 100;
  const successRate = clamp(values.successRate, 0, 100) / 100;
  const reviewMinutes = Math.max(0, Number(values.reviewMinutes) || 0);
  const runCost = Math.max(0, Number(values.runCost) || 0);
  const recurringCost = Math.max(0, Number(values.recurringCost) || 0);
  const implementationCost = Math.max(0, Number(values.implementationCost) || 0);

  const attemptedTasks = tasksPerMonth * coverage;
  const successfulTasks = attemptedTasks * successRate;
  const manualTasksAfter = tasksPerMonth - successfulTasks;
  const baselineLabor = (tasksPerMonth * minutesPerTask / 60) * hourlyCost;
  const residualLabor = (manualTasksAfter * minutesPerTask / 60) * hourlyCost;
  const reviewLabor = (attemptedTasks * reviewMinutes / 60) * hourlyCost;
  const modelSpend = attemptedTasks * runCost;
  const monthlyCostAfter = residualLabor + reviewLabor + modelSpend + recurringCost;
  const monthlySavings = baselineLabor - monthlyCostAfter;
  const annualNetBenefit = monthlySavings * 12 - implementationCost;
  const paybackMonths = monthlySavings > 0 ? implementationCost / monthlySavings : Infinity;
  const annualRoi = implementationCost > 0
    ? (annualNetBenefit / implementationCost) * 100
    : (annualNetBenefit > 0 ? Infinity : 0);
  const hoursSaved = successfulTasks * minutesPerTask / 60 - attemptedTasks * reviewMinutes / 60;
  const manualCostPerTask = minutesPerTask / 60 * hourlyCost;
  const breakEvenSuccessRate = attemptedTasks > 0 && manualCostPerTask > 0
    ? ((attemptedTasks * (reviewMinutes / 60 * hourlyCost + runCost)) + recurringCost)
      / (attemptedTasks * manualCostPerTask)
    : Infinity;

  return {
    tasksPerMonth,
    coverage,
    successRate,
    attemptedTasks,
    successfulTasks,
    baselineLabor,
    monthlyCostAfter,
    monthlySavings,
    annualNetBenefit,
    paybackMonths,
    annualRoi,
    hoursSaved,
    breakEvenSuccessRate,
  };
}

export function classifyAgentRoi(result) {
  if (result.monthlySavings <= 0) {
    return {
      status: "HOLD",
      title: "The economics do not close",
      note: "Failure, review, and recurring costs exceed the labor released. Narrow the workflow before funding a rollout.",
    };
  }
  if (result.paybackMonths <= 6 && result.annualRoi >= 100) {
    return {
      status: "PILOT",
      title: "Strong bounded-pilot case",
      note: "The base case repays implementation inside six months. Validate coverage and success rate with a controlled production sample.",
    };
  }
  if (result.paybackMonths <= 12 && result.annualRoi > 0) {
    return {
      status: "TEST",
      title: "Testable, assumption-sensitive case",
      note: "The project can repay inside one year, but a modest miss on coverage or review time can erase the return.",
    };
  }
  return {
    status: "WATCH",
    title: "Thin or slow-payback case",
    note: "The model is positive but does not yet justify broad automation. Reduce scope or prove a higher-value task first.",
  };
}

function money(value, maximumFractionDigits = 0) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(value);
}

function months(value) {
  return Number.isFinite(value) ? value.toFixed(1) + " mo" : "No payback";
}

function percent(value) {
  return Number.isFinite(value) ? value.toFixed(0) + "%" : "—";
}

function scenario(values, adjustments) {
  return calculateAgentRoi({
    ...values,
    automationCoverage: clamp(Number(values.automationCoverage) + adjustments.coverage, 0, 100),
    successRate: clamp(Number(values.successRate) + adjustments.success, 0, 100),
    reviewMinutes: Math.max(0, Number(values.reviewMinutes) * adjustments.review),
    runCost: Math.max(0, Number(values.runCost) * adjustments.cost),
    recurringCost: Math.max(0, Number(values.recurringCost) * adjustments.recurring),
  });
}

const form = typeof document === "undefined" ? null : document.querySelector("#roi-form");

if (form) {
  const fields = Object.fromEntries(
    [...form.elements].filter((element) => element.name).map((element) => [element.name, element]),
  );
  const output = {
    savings: document.querySelector("#monthly-savings"),
    roi: document.querySelector("#annual-roi"),
    payback: document.querySelector("#payback"),
    successful: document.querySelector("#successful-tasks"),
    after: document.querySelector("#cost-after"),
    breakEven: document.querySelector("#break-even-success"),
    status: document.querySelector("#roi-status"),
    title: document.querySelector("#roi-title"),
    note: document.querySelector("#roi-note"),
    shareStatus: document.querySelector("#share-status"),
    conservativeSavings: document.querySelector("#conservative-savings"),
    conservativePayback: document.querySelector("#conservative-payback"),
    baseSavings: document.querySelector("#base-savings"),
    basePayback: document.querySelector("#base-payback"),
    upsideSavings: document.querySelector("#upside-savings"),
    upsidePayback: document.querySelector("#upside-payback"),
  };

  function readInputs() {
    return Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value]));
  }

  const sharedValues = restoreSharedNumbers(fields, window.location.search);

  function update() {
    const values = readInputs();
    const result = calculateAgentRoi(values);
    const classification = classifyAgentRoi(result);
    const conservative = scenario(values, { coverage: -15, success: -15, review: 1.5, cost: 1.2, recurring: 1.2 });
    const upside = scenario(values, { coverage: 10, success: 5, review: 0.75, cost: 0.9, recurring: 0.9 });

    output.savings.textContent = money(result.monthlySavings);
    output.roi.textContent = percent(result.annualRoi);
    output.payback.textContent = months(result.paybackMonths);
    output.successful.textContent = Math.round(result.successfulTasks).toLocaleString("en-US");
    output.after.textContent = money(result.monthlyCostAfter);
    output.breakEven.textContent = result.breakEvenSuccessRate <= 1
      ? percent(result.breakEvenSuccessRate * 100)
      : "Above 100%";
    output.status.textContent = classification.status;
    output.title.textContent = classification.title;
    output.note.textContent = classification.note;
    output.conservativeSavings.textContent = money(conservative.monthlySavings);
    output.conservativePayback.textContent = months(conservative.paybackMonths);
    output.baseSavings.textContent = money(result.monthlySavings);
    output.basePayback.textContent = months(result.paybackMonths);
    output.upsideSavings.textContent = money(upside.monthlySavings);
    output.upsidePayback.textContent = months(upside.paybackMonths);
    output.shareStatus.textContent = "";
  }

  form.addEventListener("input", update);
  document.querySelector("#reset-roi").addEventListener("click", () => {
    Object.entries(DEFAULTS).forEach(([name, value]) => { fields[name].value = value; });
    update();
    fields.tasksPerMonth.focus();
  });

  document.querySelector("#share-roi").addEventListener("click", async () => {
    const result = calculateAgentRoi(readInputs());
    const url = buildAttributedShareUrl(
      window.location.href,
      readInputs(),
      { source: "agent_roi_share", content: "shared_roi_result" },
    );
    const text = "This AI agent case models " + money(result.monthlySavings)
      + " in monthly net savings with " + months(result.paybackMonths)
      + " payback after failures and review. Stress-test yours:";

    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Agent ROI Stress Test", text, url: url.toString() });
        output.shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(text + " " + url.toString());
        output.shareStatus.textContent = "Share text copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") output.shareStatus.textContent = "Copy the page URL to share the stress test.";
    }
  });

  update();
  if (Object.keys(sharedValues).length > 0) {
    output.shareStatus.textContent = "Shared business case loaded. Change any input to compare your assumptions.";
  }
}
