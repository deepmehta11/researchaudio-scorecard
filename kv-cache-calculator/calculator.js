import { buildAttributedShareUrl, restoreSharedNumbers } from "../share-state.js";

export const MODEL_PRESETS = {
  "qwen2.5-7b": {
    label: "Qwen2.5 7B",
    layers: 28,
    attentionHeads: 28,
    kvHeads: 4,
    headDimension: 128,
  },
  "qwen2.5-32b": {
    label: "Qwen2.5 32B",
    layers: 64,
    attentionHeads: 40,
    kvHeads: 8,
    headDimension: 128,
  },
  "qwen2.5-72b": {
    label: "Qwen2.5 72B",
    layers: 80,
    attentionHeads: 64,
    kvHeads: 8,
    headDimension: 128,
  },
  "mistral-7b-v0.3": {
    label: "Mistral 7B v0.3",
    layers: 32,
    attentionHeads: 32,
    kvHeads: 8,
    headDimension: 128,
  },
};

const DEFAULTS = {
  modelPreset: "qwen2.5-7b",
  layers: 28,
  attentionHeads: 28,
  kvHeads: 4,
  headDimension: 128,
  contextTokens: 32768,
  concurrentSequences: 1,
  kvCacheBits: 16,
  availableKvVramGiB: 16,
};

const PRECISION_LABELS = {
  4: "4-bit KV",
  8: "8-bit KV",
  16: "16-bit KV",
  32: "32-bit KV",
};

function nonNegative(value) {
  return Math.max(0, Number(value) || 0);
}

function wholeNumber(value) {
  return Math.floor(nonNegative(value));
}

function supportedBits(value) {
  const bits = Number(value);
  return Object.hasOwn(PRECISION_LABELS, bits) ? bits : DEFAULTS.kvCacheBits;
}

export function calculateKvCache({
  layers,
  attentionHeads,
  kvHeads,
  headDimension,
  contextTokens,
  concurrentSequences,
  kvCacheBits,
  availableKvVramGiB,
}) {
  const layerCount = wholeNumber(layers);
  const queryHeads = wholeNumber(attentionHeads);
  const keyValueHeads = wholeNumber(kvHeads);
  const keyValueHeadDimension = wholeNumber(headDimension);
  const sequenceLength = wholeNumber(contextTokens);
  const sequences = Math.max(1, wholeNumber(concurrentSequences));
  const cacheBits = supportedBits(kvCacheBits);
  const cacheBytes = cacheBits / 8;
  const availableGiB = nonNegative(availableKvVramGiB);
  const hasArchitecture = layerCount > 0 && queryHeads > 0 && keyValueHeads > 0 && keyValueHeadDimension > 0;
  const validHeadRatio = hasArchitecture && queryHeads >= keyValueHeads;
  const bytesPerToken = hasArchitecture
    ? 2 * layerCount * keyValueHeads * keyValueHeadDimension * cacheBytes
    : 0;
  const bytesPerSequence = bytesPerToken * sequenceLength;
  const totalBytes = bytesPerSequence * sequences;
  const perSequenceGiB = bytesPerSequence / (1024 ** 3);
  const totalGiB = totalBytes / (1024 ** 3);
  const mhaBytesPerToken = hasArchitecture
    ? 2 * layerCount * queryHeads * keyValueHeadDimension * cacheBytes
    : 0;
  const mhaTotalGiB = (mhaBytesPerToken * sequenceLength * sequences) / (1024 ** 3);
  const gqaReduction = validHeadRatio ? queryHeads / keyValueHeads : 0;
  const gqaSavingsGiB = validHeadRatio ? Math.max(0, mhaTotalGiB - totalGiB) : 0;
  const maxFullContextSequences = perSequenceGiB > 0 && availableGiB > 0
    ? Math.floor(availableGiB / perSequenceGiB)
    : 0;

  return {
    layerCount,
    queryHeads,
    keyValueHeads,
    keyValueHeadDimension,
    sequenceLength,
    sequences,
    cacheBits,
    cacheBytes,
    cachePrecisionLabel: PRECISION_LABELS[cacheBits],
    availableGiB,
    hasArchitecture,
    validHeadRatio,
    bytesPerToken,
    bytesPerSequence,
    totalBytes,
    perSequenceGiB,
    totalGiB,
    mhaTotalGiB,
    gqaReduction,
    gqaSavingsGiB,
    maxFullContextSequences,
    totalCachedTokens: sequenceLength * sequences,
  };
}

function gib(value) {
  if (value === 0) return "0 GiB";
  if (value < 0.01) return `${(value * 1024).toFixed(1)} MiB`;
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} GiB`;
}

function kib(value) {
  return `${(value / 1024).toLocaleString("en-US", { maximumFractionDigits: 1 })} KiB`;
}

function integer(value) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function ratio(value) {
  return value ? `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}×` : "—";
}

function statusFor(result) {
  if (!result.hasArchitecture || result.sequenceLength === 0) return "ADD INPUTS";
  if (!result.validHeadRatio) return "CHECK HEADS";
  if (result.availableGiB > 0 && result.maxFullContextSequences === 0) return "CAPACITY WATCH";
  if (result.sequences > 1) return "CONCURRENCY";
  return "BASELINE";
}

function noteFor(result) {
  if (!result.hasArchitecture) return "Add layers, attention heads, KV heads, and head dimension to calculate cache memory.";
  if (!result.validHeadRatio) return "KV heads cannot exceed total attention heads. Check the exact model configuration.";
  if (result.sequenceLength === 0) return "Add a cached context length to calculate memory per sequence.";
  if (result.availableGiB > 0 && result.maxFullContextSequences === 0) return "One full-context sequence exceeds the VRAM reserved for KV cache. Reduce context, precision, or cache residency.";
  if (result.gqaReduction > 1) return `Grouped-query attention uses ${ratio(result.gqaReduction)} fewer KV heads than full multi-head attention in this architecture.`;
  return "This architecture uses one KV head per attention head, so grouped-query attention does not reduce the cache.";
}

const form = typeof document === "undefined" ? null : document.querySelector("#kv-cache-form");

if (form) {
  const fields = Object.fromEntries([...form.elements].filter((element) => element.name).map((element) => [element.name, element]));
  const output = {
    status: document.querySelector("#kv-cache-status"),
    total: document.querySelector("#total-kv-cache"),
    perToken: document.querySelector("#kv-per-token"),
    perSequence: document.querySelector("#kv-per-sequence"),
    cachedTokens: document.querySelector("#cached-tokens"),
    mha: document.querySelector("#mha-cache"),
    reduction: document.querySelector("#gqa-reduction"),
    savings: document.querySelector("#gqa-savings"),
    maxSequences: document.querySelector("#max-sequences"),
    precision: document.querySelector("#kv-precision"),
    note: document.querySelector("#kv-cache-note"),
    shareStatus: document.querySelector("#share-status"),
  };

  function readInputs() {
    return Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value]));
  }

  const sharedValues = restoreSharedNumbers(fields, window.location.search);
  const sharedPreset = new URLSearchParams(window.location.search).get("modelPreset");
  if (sharedPreset === "custom" || Object.hasOwn(MODEL_PRESETS, sharedPreset)) {
    fields.modelPreset.value = sharedPreset;
  }

  function applyPreset(name) {
    const preset = MODEL_PRESETS[name];
    if (!preset) return;
    for (const [field, value] of Object.entries(preset)) {
      if (field !== "label") fields[field].value = value;
    }
  }

  function update() {
    const result = calculateKvCache(readInputs());
    output.status.textContent = statusFor(result);
    output.total.textContent = gib(result.totalGiB);
    output.perToken.textContent = result.bytesPerToken ? kib(result.bytesPerToken) : "0 KiB";
    output.perSequence.textContent = gib(result.perSequenceGiB);
    output.cachedTokens.textContent = integer(result.totalCachedTokens);
    output.mha.textContent = gib(result.mhaTotalGiB);
    output.reduction.textContent = ratio(result.gqaReduction);
    output.savings.textContent = gib(result.gqaSavingsGiB);
    output.maxSequences.textContent = integer(result.maxFullContextSequences);
    output.precision.textContent = result.cachePrecisionLabel;
    output.note.textContent = noteFor(result);
    output.shareStatus.textContent = "";
  }

  fields.modelPreset.addEventListener("change", () => {
    applyPreset(fields.modelPreset.value);
    update();
  });

  for (const name of ["layers", "attentionHeads", "kvHeads", "headDimension"]) {
    fields[name].addEventListener("input", () => {
      const preset = MODEL_PRESETS[fields.modelPreset.value];
      if (!preset) return;
      const stillMatches = ["layers", "attentionHeads", "kvHeads", "headDimension"]
        .every((field) => Number(fields[field].value) === preset[field]);
      if (!stillMatches) fields.modelPreset.value = "custom";
    });
  }

  form.addEventListener("input", update);

  document.querySelector("#reset-kv-cache").addEventListener("click", () => {
    Object.entries(DEFAULTS).forEach(([name, value]) => { fields[name].value = value; });
    update();
    fields.modelPreset.focus();
  });

  document.querySelector("#share-kv-cache").addEventListener("click", async () => {
    const result = calculateKvCache(readInputs());
    const url = buildAttributedShareUrl(
      window.location.href,
      readInputs(),
      { source: "kv_cache_share", content: "shared_kv_cache_result" },
    );
    const text = `This KV-cache plan needs ${gib(result.totalGiB)} for ${integer(result.sequences)} full-context sequence${result.sequences === 1 ? "" : "s"}. Calculate yours:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "LLM KV Cache Calculator", text, url: url.toString() });
        output.shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        output.shareStatus.textContent = "Share text copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") output.shareStatus.textContent = "Copy the page URL to share this cache plan.";
    }
  });

  update();
  if (Object.keys(sharedValues).length > 0 || sharedPreset) {
    output.shareStatus.textContent = "Shared cache plan loaded. Change any input to compare the workload.";
  }
}
