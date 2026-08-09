import { calculateGpuMemory } from "../llm-gpu-memory-calculator/calculator.js";

export const MODEL_TIERS = [3, 7, 8, 13, 14, 20, 27, 32, 70, 120];

const OLLAMA_STARTERS = [
  { minimumCapacityGiB: 65, model: "gpt-oss:120b", artifactSizeGb: 65, label: "gpt-oss 120B", officialUrl: "https://ollama.com/library/gpt-oss" },
  { minimumCapacityGiB: 20, model: "qwen3:32b", artifactSizeGb: 20, label: "Qwen3 32B", officialUrl: "https://ollama.com/library/qwen3" },
  { minimumCapacityGiB: 14, model: "gpt-oss:20b", artifactSizeGb: 14, label: "gpt-oss 20B", officialUrl: "https://ollama.com/library/gpt-oss" },
  { minimumCapacityGiB: 9.3, model: "qwen3:14b", artifactSizeGb: 9.3, label: "Qwen3 14B", officialUrl: "https://ollama.com/library/qwen3" },
  { minimumCapacityGiB: 5.2, model: "qwen3:8b", artifactSizeGb: 5.2, label: "Qwen3 8B", officialUrl: "https://ollama.com/library/qwen3" },
  { minimumCapacityGiB: 2.5, model: "qwen3:4b", artifactSizeGb: 2.5, label: "Qwen3 4B", officialUrl: "https://ollama.com/library/qwen3" },
  { minimumCapacityGiB: 1.4, model: "qwen3:1.7b", artifactSizeGb: 1.4, label: "Qwen3 1.7B", officialUrl: "https://ollama.com/library/qwen3" },
];

const DEFAULTS = {
  vramPerGpu: 12,
  availableGpus: 1,
  bitsPerParameter: 4,
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
  12: "12 GB GPU profile",
  16: "16 GB GPU profile",
  24: "24 GB GPU profile",
  32: "32 GB GPU profile",
  48: "48 GB GPU profile",
  80: "80 GB GPU profile",
  141: "141 GB GPU profile",
};

function positiveInteger(value, fallback = 1) {
  return Math.max(1, Math.floor(Number(value) || fallback));
}

function readAllowedNumber(search, name, allowed, fallback) {
  const candidate = Number(search.get(name));
  return allowed.includes(candidate) ? candidate : fallback;
}

function tierEstimate(parameterBillions, options) {
  return calculateGpuMemory({
    parameterBillions,
    bitsPerParameter: options.bitsPerParameter,
    checkpointGiB: 0,
    layers: 0,
    kvHeads: 0,
    headDimension: 0,
    contextTokens: 0,
    concurrentSequences: 1,
    kvCacheBits: 16,
    inferenceHeadroom: options.inferenceHeadroom,
    vramPerGpu: options.vramPerGpu,
    usableVramPercent: options.usableVramPercent,
    availableGpus: options.availableGpus,
  });
}

export function calculateModelFinder({
  vramPerGpu,
  availableGpus,
  bitsPerParameter,
  inferenceHeadroom = DEFAULTS.inferenceHeadroom,
  usableVramPercent = DEFAULTS.usableVramPercent,
}) {
  const options = {
    vramPerGpu: Number(vramPerGpu),
    availableGpus: positiveInteger(availableGpus),
    bitsPerParameter: Number(bitsPerParameter),
    inferenceHeadroom: Number(inferenceHeadroom),
    usableVramPercent: Number(usableVramPercent),
  };
  const availableCapacityGiB = options.vramPerGpu * options.availableGpus * (options.usableVramPercent / 100);
  const weightCapacityGiB = availableCapacityGiB / (1 + options.inferenceHeadroom / 100);
  const maximumParameterBillions = weightCapacityGiB * (1024 ** 3) * 8 / options.bitsPerParameter / 1e9;
  const tiers = MODEL_TIERS.map((parameterBillions) => ({
    parameterBillions,
    ...tierEstimate(parameterBillions, options),
  }));
  const fittingTiers = tiers.filter((tier) => tier.fitsAvailable);
  const recommended = fittingTiers.at(-1) || null;
  const next = recommended
    ? tiers.find((tier) => tier.parameterBillions > recommended.parameterBillions) || null
    : tiers[0];

  return {
    ...options,
    availableCapacityGiB,
    weightCapacityGiB,
    maximumParameterBillions,
    tiers,
    fittingTiers,
    recommended,
    next,
  };
}

export function recommendOllamaStarter(result) {
  const capacity = Number(result?.availableCapacityGiB);
  const starter = OLLAMA_STARTERS.find(({ minimumCapacityGiB }) => capacity >= minimumCapacityGiB)
    || OLLAMA_STARTERS.at(-1);
  return {
    model: starter.model,
    artifactSizeGb: starter.artifactSizeGb,
    command: `ollama run ${starter.model}`,
    officialUrl: starter.officialUrl,
    label: starter.label,
  };
}

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

function gib(value) {
  return `${formatNumber(value)} GiB`;
}

const form = typeof document === "undefined" ? null : document.querySelector("#model-finder-form");

if (form) {
  const fields = Object.fromEntries([...form.elements].filter((element) => element.name).map((element) => [element.name, element]));
  const output = {
    status: document.querySelector("#finder-status"),
    tier: document.querySelector("#finder-tier"),
    ceiling: document.querySelector("#finder-ceiling"),
    capacity: document.querySelector("#finder-capacity"),
    target: document.querySelector("#finder-target"),
    margin: document.querySelector("#finder-margin"),
    next: document.querySelector("#finder-next"),
    profile: document.querySelector("#finder-profile"),
    fitList: document.querySelector("#finder-fit-list"),
    note: document.querySelector("#finder-note"),
    ollamaModel: document.querySelector("#ollama-model"),
    ollamaCommand: document.querySelector("#ollama-command"),
    ollamaSource: document.querySelector("#ollama-source"),
    fullCalculator: document.querySelector("#open-model-calculator"),
    shareStatus: document.querySelector("#share-status"),
  };

  const search = new URLSearchParams(window.location.search);
  fields.vramPerGpu.value = readAllowedNumber(search, "vramPerGpu", [8, 12, 16, 24, 32, 48, 80, 141], DEFAULTS.vramPerGpu);
  fields.availableGpus.value = positiveInteger(search.get("availableGpus"), DEFAULTS.availableGpus);
  fields.bitsPerParameter.value = readAllowedNumber(search, "bitsPerParameter", [4, 8, 16], DEFAULTS.bitsPerParameter);
  fields.inferenceHeadroom.value = readAllowedNumber(search, "inferenceHeadroom", [10, 20, 30], DEFAULTS.inferenceHeadroom);
  fields.usableVramPercent.value = readAllowedNumber(search, "usableVramPercent", [80, 90, 95], DEFAULTS.usableVramPercent);

  function values() {
    return Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, Number(input.value)]));
  }

  function calculatorUrl(current, parameterBillions) {
    const url = new URL("../llm-gpu-memory-calculator/", window.location.href);
    Object.entries({
      ...current,
      parameterBillions,
      checkpointGiB: 0,
      layers: 0,
      kvHeads: 0,
      headDimension: 0,
      contextTokens: 0,
      concurrentSequences: 1,
      kvCacheBits: 16,
      utm_source: "what_llm_can_i_run",
      utm_medium: "tool_result",
      utm_campaign: "ai_evidence_lab",
      utm_content: "add_context_and_architecture",
    }).forEach(([name, value]) => url.searchParams.set(name, value));
    return url;
  }

  function update() {
    const current = values();
    current.availableGpus = positiveInteger(current.availableGpus);
    const result = calculateModelFinder(current);
    const recommended = result.recommended;
    const starter = recommendOllamaStarter(result);
    const precision = PRECISION_LABELS[result.bitsPerParameter];

    output.status.textContent = recommended ? `UP TO ${recommended.parameterBillions}B FLOOR` : "BELOW 3B FLOOR";
    output.tier.textContent = recommended ? recommended.parameterBillions : "<3";
    output.ceiling.textContent = `${formatNumber(result.maximumParameterBillions, 1)}B`;
    output.capacity.textContent = gib(result.availableCapacityGiB);
    output.target.textContent = recommended ? gib(recommended.planningTargetGiB) : "—";
    output.margin.textContent = recommended ? `+${gib(recommended.capacityMarginGiB)}` : "—";
    output.next.textContent = result.next ? `${result.next.parameterBillions}B` : "Above 120B";
    output.profile.textContent = `${result.availableGpus} × ${GPU_LABELS[result.vramPerGpu] || `${result.vramPerGpu} GB GPU profile`}`;
    output.fitList.textContent = result.fittingTiers.length
      ? result.fittingTiers.map((tier) => `${tier.parameterBillions}B`).join(" · ")
      : "No listed tier clears this floor";
    output.note.textContent = recommended
      ? `A ${recommended.parameterBillions}B ${precision} weight floor clears the selected reserve. This is a capacity result, not a named-model, context-window, runtime-support, or speed guarantee.`
      : `The selected reserve does not leave enough capacity for this page's smallest 3B ${precision} tier. Try more VRAM, more GPUs, or a lower-bit artifact.`;
    output.ollamaModel.textContent = `${starter.label} · ${starter.artifactSizeGb}GB official artifact`;
    output.ollamaCommand.textContent = starter.command;
    output.ollamaSource.href = starter.officialUrl;
    output.fullCalculator.href = calculatorUrl(current, recommended?.parameterBillions || 3).toString();
    output.shareStatus.textContent = "";
  }

  form.addEventListener("input", update);

  document.querySelector("#reset-finder").addEventListener("click", () => {
    Object.entries(DEFAULTS).forEach(([name, value]) => { fields[name].value = value; });
    update();
    fields.vramPerGpu.focus();
  });

  document.querySelector("#share-finder").addEventListener("click", async () => {
    const current = values();
    const result = calculateModelFinder(current);
    const url = new URL(window.location.href);
    Object.entries(current).forEach(([name, value]) => url.searchParams.set(name, value));
    url.searchParams.set("utm_source", "what_llm_can_i_run_share");
    url.searchParams.set("utm_medium", "shared_tool");
    url.searchParams.set("utm_campaign", "ai_evidence_lab");
    url.searchParams.set("utm_content", `${current.availableGpus}x_${current.vramPerGpu}gb_${current.bitsPerParameter}bit`);
    const tier = result.recommended ? `${result.recommended.parameterBillions}B` : "below 3B";
    const text = `My ${current.availableGpus} × ${current.vramPerGpu} GB setup clears up to the ${tier} ${PRECISION_LABELS[current.bitsPerParameter]} weight floor under my selected reserve:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "What LLM can I run on my GPU?", text, url: url.toString() });
        output.shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        output.shareStatus.textContent = "Model-fit result copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") output.shareStatus.textContent = "Copy the page URL to share this result.";
    }
  });

  document.querySelector("#copy-ollama-command").addEventListener("click", async () => {
    const starter = recommendOllamaStarter(calculateModelFinder(values()));
    try {
      await navigator.clipboard.writeText(starter.command);
      output.shareStatus.textContent = `Copied: ${starter.command}`;
    } catch {
      output.shareStatus.textContent = `Copy this command: ${starter.command}`;
    }
  });

  update();
}
