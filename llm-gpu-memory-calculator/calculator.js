import { buildAttributedShareUrl, restoreSharedNumbers } from "../share-state.js";

const DEFAULTS = {
  parameterBillions: 70,
  bitsPerParameter: 4,
  inferenceHeadroom: 20,
  vramPerGpu: 24,
  usableVramPercent: 90,
  availableGpus: 2,
};

const PRECISION_LABELS = {
  4: "INT4",
  8: "INT8",
  16: "FP16 / BF16",
  32: "FP32",
};

function nonNegative(value) {
  return Math.max(0, Number(value) || 0);
}

function boundedPercentage(value, fallback = 0) {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) ? parsed : fallback;
  return Math.min(100, Math.max(0, normalized)) / 100;
}

function supportedBits(value) {
  const bits = Number(value);
  return Object.hasOwn(PRECISION_LABELS, bits) ? bits : DEFAULTS.bitsPerParameter;
}

export function calculateGpuMemory({
  parameterBillions,
  bitsPerParameter,
  inferenceHeadroom,
  vramPerGpu,
  usableVramPercent,
  availableGpus,
}) {
  const parameters = nonNegative(parameterBillions) * 1_000_000_000;
  const bits = supportedBits(bitsPerParameter);
  const headroomRate = Math.min(3, nonNegative(inferenceHeadroom) / 100);
  const gpuVram = nonNegative(vramPerGpu);
  const usableRate = boundedPercentage(usableVramPercent, 90);
  const gpuCount = Math.floor(nonNegative(availableGpus));
  const weightMemoryGiB = (parameters * bits / 8) / (1024 ** 3);
  const planningTargetGiB = weightMemoryGiB * (1 + headroomRate);
  const usablePerGpuGiB = gpuVram * usableRate;
  const minimumGpus = planningTargetGiB > 0 && usablePerGpuGiB > 0
    ? Math.ceil(planningTargetGiB / usablePerGpuGiB)
    : 0;
  const availableCapacityGiB = usablePerGpuGiB * gpuCount;
  const capacityMarginGiB = availableCapacityGiB - planningTargetGiB;
  const fitsAvailable = planningTargetGiB > 0
    && minimumGpus > 0
    && gpuCount >= minimumGpus;

  return {
    parameterBillions: parameters / 1_000_000_000,
    bits,
    precisionLabel: PRECISION_LABELS[bits],
    headroomRate,
    gpuVram,
    usableRate,
    gpuCount,
    weightMemoryGiB,
    planningTargetGiB,
    usablePerGpuGiB,
    minimumGpus,
    availableCapacityGiB,
    capacityMarginGiB,
    fitsAvailable,
  };
}

function gib(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value) + " GiB";
}

function statusFor(result) {
  if (result.planningTargetGiB === 0 || result.minimumGpus === 0) return "ADD INPUTS";
  return result.fitsAvailable ? "FITS" : "SHORT";
}

function noteFor(result) {
  if (result.planningTargetGiB === 0) return "Add a model parameter count to create a GPU memory estimate.";
  if (result.usablePerGpuGiB === 0) return "Add usable VRAM per GPU to calculate a minimum device count.";
  if (result.headroomRate < 0.1) return "This plan leaves less than 10% inference headroom. Validate runtime allocations and KV cache before deployment.";
  if (!result.fitsAvailable) {
    const missing = Math.max(0, result.minimumGpus - result.gpuCount);
    return "This estimate needs " + missing + " more GPU" + (missing === 1 ? "" : "s") + " at the stated usable VRAM.";
  }
  return "The capacity estimate fits. Benchmark the exact artifact, context length, concurrency, and serving runtime before reserving hardware.";
}

const form = typeof document === "undefined" ? null : document.querySelector("#gpu-memory-form");

if (form) {
  const fields = Object.fromEntries([...form.elements].filter((element) => element.name).map((element) => [element.name, element]));
  const output = {
    minimum: document.querySelector("#minimum-gpus"),
    status: document.querySelector("#gpu-memory-status"),
    weights: document.querySelector("#weight-memory"),
    planning: document.querySelector("#planning-target"),
    usable: document.querySelector("#usable-per-gpu"),
    capacity: document.querySelector("#available-capacity"),
    margin: document.querySelector("#capacity-margin"),
    format: document.querySelector("#weight-format"),
    note: document.querySelector("#gpu-memory-note"),
    shareStatus: document.querySelector("#share-status"),
  };

  function readInputs() {
    return Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value]));
  }

  const sharedValues = restoreSharedNumbers(fields, window.location.search);
  if (!Object.hasOwn(PRECISION_LABELS, Number(fields.bitsPerParameter.value))) {
    fields.bitsPerParameter.value = DEFAULTS.bitsPerParameter;
  }

  function update() {
    const result = calculateGpuMemory(readInputs());
    output.minimum.textContent = new Intl.NumberFormat("en-US").format(result.minimumGpus);
    output.status.textContent = statusFor(result);
    output.weights.textContent = gib(result.weightMemoryGiB);
    output.planning.textContent = gib(result.planningTargetGiB);
    output.usable.textContent = gib(result.usablePerGpuGiB);
    output.capacity.textContent = gib(result.availableCapacityGiB);
    output.margin.textContent = (result.capacityMarginGiB >= 0 ? "+" : "−") + gib(Math.abs(result.capacityMarginGiB));
    output.format.textContent = result.precisionLabel;
    output.note.textContent = noteFor(result);
    output.shareStatus.textContent = "";
  }

  form.addEventListener("input", update);
  document.querySelector("#reset-gpu-memory").addEventListener("click", () => {
    Object.entries(DEFAULTS).forEach(([name, value]) => { fields[name].value = value; });
    update();
    fields.parameterBillions.focus();
  });

  document.querySelector("#share-gpu-memory").addEventListener("click", async () => {
    const result = calculateGpuMemory(readInputs());
    const url = buildAttributedShareUrl(
      window.location.href,
      readInputs(),
      { source: "gpu_memory_share", content: "shared_gpu_memory_plan" },
    );
    const text = "My " + result.parameterBillions + "B " + result.precisionLabel + " model estimate needs " + result.minimumGpus + " GPU" + (result.minimumGpus === 1 ? "" : "s") + ". Check yours:";
    try {
      if (navigator.share) {
        await navigator.share({ title: "LLM GPU Memory Calculator", text, url: url.toString() });
        output.shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(text + " " + url);
        output.shareStatus.textContent = "Share text copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") output.shareStatus.textContent = "Copy the page URL to share the VRAM plan.";
    }
  });

  update();
  if (Object.keys(sharedValues).length > 0) {
    output.shareStatus.textContent = "Shared VRAM plan loaded. Change any input to compare hardware.";
  }
}
