import { calculateGpuMemory } from "../llm-gpu-memory-calculator/calculator.js";

const DEFAULTS = {
  parameterBillions: 13,
  bitsPerParameter: 4,
  vramPerGpu: 24,
  availableGpus: 1,
  inferenceHeadroom: 20,
  usableVramPercent: 90,
};

const PRECISION_LABELS = {
  4: "INT4",
  8: "INT8",
  16: "FP16 / BF16",
};

const GPU_LABELS = {
  8: "8 GB GPU profile",
  12: "RTX 3060 12 GB profile",
  16: "16 GB GPU profile",
  24: "RTX 4090 24 GB profile",
  32: "RTX 5090 32 GB profile",
  48: "RTX 6000 Ada 48 GB profile",
  80: "A100 / H100 80 GB profile",
  141: "H200 141 GB profile",
};

export function calculateCompatibility({
  parameterBillions,
  bitsPerParameter,
  vramPerGpu,
  availableGpus,
  inferenceHeadroom = DEFAULTS.inferenceHeadroom,
  usableVramPercent = DEFAULTS.usableVramPercent,
}) {
  return calculateGpuMemory({
    parameterBillions,
    bitsPerParameter,
    checkpointGiB: 0,
    layers: 0,
    kvHeads: 0,
    headDimension: 0,
    contextTokens: 0,
    concurrentSequences: 1,
    kvCacheBits: 16,
    inferenceHeadroom,
    vramPerGpu,
    usableVramPercent,
    availableGpus,
  });
}

function gib(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value) + " GiB";
}

function positiveInteger(value, fallback = 1) {
  return Math.max(1, Math.floor(Number(value) || fallback));
}

function readAllowedNumber(search, name, allowed, fallback) {
  const candidate = Number(search.get(name));
  return allowed.includes(candidate) ? candidate : fallback;
}

const form = typeof document === "undefined" ? null : document.querySelector("#compatibility-form");

if (form) {
  const fields = Object.fromEntries([...form.elements].filter((element) => element.name).map((element) => [element.name, element]));
  const output = {
    status: document.querySelector("#compatibility-status"),
    minimum: document.querySelector("#minimum-gpus"),
    weights: document.querySelector("#compatibility-weights"),
    target: document.querySelector("#compatibility-target"),
    usable: document.querySelector("#compatibility-usable"),
    capacity: document.querySelector("#compatibility-capacity"),
    margin: document.querySelector("#compatibility-margin"),
    profile: document.querySelector("#compatibility-profile"),
    note: document.querySelector("#compatibility-note"),
    fullCalculator: document.querySelector("#open-full-calculator"),
    shareStatus: document.querySelector("#share-status"),
  };

  const search = new URLSearchParams(window.location.search);
  fields.parameterBillions.value = readAllowedNumber(search, "parameterBillions", [7, 13, 32, 70], DEFAULTS.parameterBillions);
  fields.bitsPerParameter.value = readAllowedNumber(search, "bitsPerParameter", [4, 8, 16], DEFAULTS.bitsPerParameter);
  fields.vramPerGpu.value = readAllowedNumber(search, "vramPerGpu", [8, 12, 16, 24, 32, 48, 80, 141], DEFAULTS.vramPerGpu);
  fields.availableGpus.value = positiveInteger(search.get("availableGpus"), DEFAULTS.availableGpus);
  fields.inferenceHeadroom.value = readAllowedNumber(search, "inferenceHeadroom", [10, 20, 30], DEFAULTS.inferenceHeadroom);
  fields.usableVramPercent.value = readAllowedNumber(search, "usableVramPercent", [80, 90, 95], DEFAULTS.usableVramPercent);

  function values() {
    return Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, Number(input.value)]));
  }

  function calculatorUrl(current) {
    const url = new URL("../llm-gpu-memory-calculator/", window.location.href);
    Object.entries({
      ...current,
      checkpointGiB: 0,
      layers: 0,
      kvHeads: 0,
      headDimension: 0,
      contextTokens: 0,
      concurrentSequences: 1,
      kvCacheBits: 16,
      utm_source: "local_llm_gpu_compatibility",
      utm_medium: "tool_result",
      utm_campaign: "ai_evidence_lab",
      utm_content: "add_context_and_architecture",
    }).forEach(([name, value]) => url.searchParams.set(name, value));
    return url;
  }

  function update() {
    const current = values();
    current.availableGpus = positiveInteger(current.availableGpus);
    const result = calculateCompatibility(current);
    const fits = result.fitsAvailable;
    const marginPrefix = result.capacityMarginGiB >= 0 ? "+" : "−";
    const precision = PRECISION_LABELS[result.bits];

    output.status.textContent = fits ? "FITS FLOOR" : "SHORT";
    output.minimum.textContent = new Intl.NumberFormat("en-US").format(result.minimumGpus);
    output.weights.textContent = gib(result.weightMemoryGiB);
    output.target.textContent = gib(result.planningTargetGiB);
    output.usable.textContent = gib(result.usablePerGpuGiB);
    output.capacity.textContent = gib(result.availableCapacityGiB);
    output.margin.textContent = marginPrefix + gib(Math.abs(result.capacityMarginGiB));
    output.profile.textContent = GPU_LABELS[result.gpuVram] || `${result.gpuVram} GB profile`;
    output.note.textContent = fits
      ? `The ${result.parameterBillions}B ${precision} weight floor fits this aggregate capacity with the selected reserve. Add the exact architecture and context before treating it as a deployment plan.`
      : `The selected hardware is ${gib(Math.abs(result.capacityMarginGiB))} short of the weight-plus-headroom floor. This estimate needs at least ${result.minimumGpus} GPU${result.minimumGpus === 1 ? "" : "s"} at this usable capacity.`;
    output.fullCalculator.href = calculatorUrl(current).toString();
    output.shareStatus.textContent = "";
  }

  form.addEventListener("input", update);

  document.querySelector("#reset-compatibility").addEventListener("click", () => {
    Object.entries(DEFAULTS).forEach(([name, value]) => { fields[name].value = value; });
    update();
    fields.parameterBillions.focus();
  });

  document.querySelector("#share-compatibility").addEventListener("click", async () => {
    const current = values();
    const result = calculateCompatibility(current);
    const url = new URL(window.location.href);
    Object.entries(current).forEach(([name, value]) => url.searchParams.set(name, value));
    url.searchParams.set("utm_source", "local_llm_gpu_compatibility_share");
    url.searchParams.set("utm_medium", "shared_tool");
    url.searchParams.set("utm_campaign", "ai_evidence_lab");
    url.searchParams.set("utm_content", `${current.parameterBillions}b_${current.bitsPerParameter}bit_${current.vramPerGpu}gb`);
    const text = `My ${current.parameterBillions}B ${PRECISION_LABELS[current.bitsPerParameter]} weight-floor estimate needs ${result.minimumGpus} GPU${result.minimumGpus === 1 ? "" : "s"}. Check your hardware:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Local LLM GPU Compatibility Checker", text, url: url.toString() });
        output.shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        output.shareStatus.textContent = "Compatibility result copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") output.shareStatus.textContent = "Copy the page URL to share this result.";
    }
  });

  update();
}
