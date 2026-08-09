import { calculateGpuMemory } from "../llm-gpu-memory-calculator/calculator.js";
import { installEvidenceCapture } from "../conversion-loop.js";

const TOOL_ORIGIN = "https://tools.researchaudio.io";
const TOOL_PATH = "/hugging-face-vram-calculator/";
const HUGGING_FACE_ORIGIN = "https://huggingface.co";
const HUGGING_FACE_API = `${HUGGING_FACE_ORIGIN}/api/models`;
const CAMPAIGN = "ai_evidence_lab";
const MIN_PARAMETERS = 1_000_000;
const MAX_PARAMETERS = 2_000_000_000_000;
const NON_MODEL_PREFIXES = new Set(["collections", "datasets", "docs", "organizations", "settings", "spaces"]);
const PRECISIONS = [
  { bits: 4, label: "INT4" },
  { bits: 8, label: "INT8" },
  { bits: 16, label: "FP16 / BF16" },
];

function modelSegment(value) {
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw new Error("Use a valid owner/model ID or Hugging Face model URL.");
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(decoded)) {
    throw new Error("Use a valid owner/model ID or Hugging Face model URL.");
  }
  return decoded;
}

export function parseHuggingFaceModelId(value) {
  const input = String(value || "").trim();
  if (!input) throw new Error("Enter a Hugging Face owner/model ID or model URL.");

  let pathname = input;
  if (/^https?:\/\//i.test(input)) {
    let url;
    try {
      url = new URL(input);
    } catch {
      throw new Error("Use a valid owner/model ID or Hugging Face model URL.");
    }
    if (!["huggingface.co", "www.huggingface.co"].includes(url.hostname.toLowerCase())) {
      throw new Error("Use a huggingface.co model URL, not another website.");
    }
    pathname = url.pathname;
  }

  const parts = pathname.split("/").filter(Boolean);
  if (parts[0]?.toLowerCase() === "models") parts.shift();
  if (NON_MODEL_PREFIXES.has(parts[0]?.toLowerCase())) {
    throw new Error("Use a Hugging Face model repository, not another Hub resource.");
  }
  if (parts.length < 2) throw new Error("Include both the model owner and repository name.");
  return `${modelSegment(parts[0])}/${modelSegment(parts[1])}`;
}

export function buildHuggingFaceModelApiUrl(modelId) {
  const normalizedId = parseHuggingFaceModelId(modelId);
  const encodedId = normalizedId.split("/").map(encodeURIComponent).join("/");
  const url = new URL(`${HUGGING_FACE_API}/${encodedId}`);
  for (const property of ["safetensors", "config", "pipeline_tag", "library_name", "gated", "private", "lastModified"]) {
    url.searchParams.append("expand[]", property);
  }
  return url;
}

export function normalizeHuggingFaceModel(rawModel) {
  const id = parseHuggingFaceModelId(rawModel?.id);
  const parameters = Number(rawModel?.safetensors?.total);
  if (!Number.isFinite(parameters) || parameters < MIN_PARAMETERS) {
    throw new Error("This repository has no usable public safetensors parameter total. Use the manual GPU calculator with the exact checkpoint instead.");
  }
  if (parameters > MAX_PARAMETERS) {
    throw new Error("This repository reports more than two trillion safetensors parameters. Treat it as an outlier and inspect the checkpoint before sizing hardware.");
  }

  const architecture = Array.isArray(rawModel?.config?.architectures)
    ? rawModel.config.architectures.find((value) => typeof value === "string" && value.trim())
    : null;
  const name = id.split("/").at(-1);
  return {
    id,
    name,
    parameters,
    parameterBillions: parameters / 1_000_000_000,
    architecture: architecture || "Not published in the expanded API response",
    pipelineTag: rawModel?.pipeline_tag || "Not published",
    libraryName: rawModel?.library_name || "Not published",
    gated: Boolean(rawModel?.gated),
    private: Boolean(rawModel?.private),
    lastModified: rawModel?.lastModified || null,
    sourceUrl: `${HUGGING_FACE_ORIGIN}/${id.split("/").map(encodeURIComponent).join("/")}`,
  };
}

export function calculateHuggingFaceVramPlan(model) {
  return PRECISIONS.map(({ bits, label }) => {
    const result = calculateGpuMemory({
      parameterBillions: model.parameterBillions,
      bitsPerParameter: bits,
      checkpointGiB: 0,
      layers: 0,
      kvHeads: 0,
      headDimension: 0,
      contextTokens: 0,
      concurrentSequences: 1,
      kvCacheBits: 16,
      inferenceHeadroom: 20,
      vramPerGpu: 24,
      usableVramPercent: 90,
      availableGpus: 1,
    });
    return {
      bits,
      label,
      weightGiB: result.weightMemoryGiB,
      planningGiB: result.planningTargetGiB,
    };
  });
}

function attributionSlug(modelId) {
  return modelId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72);
}

export function buildModelLookupUrl(modelId) {
  const url = new URL(TOOL_PATH, TOOL_ORIGIN);
  url.searchParams.set("model", parseHuggingFaceModelId(modelId));
  return url;
}

export function buildModelCardBadgeDestination(model) {
  const url = buildModelLookupUrl(model.id);
  url.searchParams.set("utm_source", "hf_model_card_badge");
  url.searchParams.set("utm_medium", "model_card");
  url.searchParams.set("utm_campaign", CAMPAIGN);
  url.searchParams.set("utm_content", attributionSlug(model.id));
  url.hash = "vram-plan";
  return url.toString();
}

function formatGiB(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: value >= 100 ? 1 : 2 }).format(value);
}

export function buildModelCardBadgeMarkdown(model) {
  const int4 = calculateHuggingFaceVramPlan(model).find(({ bits }) => bits === 4);
  const alt = `${model.name} source-backed INT4 floor ${formatGiB(int4.planningGiB)} GiB - ResearchAudio`;
  return `[![${alt}](${TOOL_ORIGIN}/model-card-vram-badge.svg)](${buildModelCardBadgeDestination(model)})`;
}

export async function fetchHuggingFaceModel(value, { fetchImpl = fetch, signal } = {}) {
  const modelId = parseHuggingFaceModelId(value);
  const response = await fetchImpl(buildHuggingFaceModelApiUrl(modelId), {
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal,
    headers: { Accept: "application/json" },
  });
  if (response.status === 404) throw new Error(`Hugging Face could not find ${modelId}. Check the owner and repository name.`);
  if (response.status === 429) throw new Error("The public Hugging Face API is rate-limited right now. Wait a minute and try again.");
  if (!response.ok) throw new Error(`Hugging Face returned ${response.status}. Try the repository again shortly.`);
  return normalizeHuggingFaceModel(await response.json());
}

function copyText(value, field) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  field.focus();
  field.select();
  document.execCommand("copy");
  return Promise.resolve();
}

function calculatorUrl(model) {
  const url = new URL("../llm-gpu-memory-calculator/", window.location.href);
  const values = {
    parameterBillions: model.parameterBillions,
    bitsPerParameter: 4,
    checkpointGiB: 0,
    layers: 0,
    kvHeads: 0,
    headDimension: 0,
    contextTokens: 0,
    concurrentSequences: 1,
    kvCacheBits: 16,
    inferenceHeadroom: 20,
    vramPerGpu: 24,
    usableVramPercent: 90,
    availableGpus: 1,
    utm_source: "hugging_face_vram_calculator",
    utm_medium: "tool_result",
    utm_campaign: CAMPAIGN,
    utm_content: attributionSlug(model.id),
  };
  for (const [name, value] of Object.entries(values)) url.searchParams.set(name, value);
  return url.toString();
}

const form = typeof document === "undefined" ? null : document.querySelector("#hf-model-form");

if (form) {
  const input = document.querySelector("#hf-model-input");
  const submit = document.querySelector("#lookup-model");
  const status = document.querySelector("#lookup-status");
  const error = document.querySelector("#lookup-error");
  const result = document.querySelector("#hf-model-result");
  const badgeOutput = document.querySelector("#hf-badge-markdown");
  const badgeStatus = document.querySelector("#hf-badge-status");
  const permalinkOutput = document.querySelector("#hf-model-permalink");
  let currentModel = null;

  const outputs = {
    name: document.querySelector("#hf-model-name"),
    id: document.querySelector("#hf-model-id"),
    parameters: document.querySelector("#hf-model-parameters"),
    architecture: document.querySelector("#hf-model-architecture"),
    pipeline: document.querySelector("#hf-model-pipeline"),
    library: document.querySelector("#hf-model-library"),
    access: document.querySelector("#hf-model-access"),
    modified: document.querySelector("#hf-model-modified"),
    source: document.querySelector("#hf-model-source"),
    calculator: document.querySelector("#hf-open-calculator"),
    badgePreview: document.querySelector("#hf-badge-preview"),
  };

  function setLoading(loading) {
    form.setAttribute("aria-busy", String(loading));
    submit.disabled = loading;
    submit.textContent = loading ? "Reading public metadata…" : "Inspect model and build badge";
  }

  function showError(message) {
    currentModel = null;
    result.hidden = true;
    status.textContent = "LOOKUP NEEDS ATTENTION";
    error.textContent = message;
    error.hidden = false;
  }

  function renderModel(model) {
    currentModel = model;
    const plan = calculateHuggingFaceVramPlan(model);
    const lookupUrl = buildModelLookupUrl(model.id);
    const badgeDestination = buildModelCardBadgeDestination(model);
    const markdown = buildModelCardBadgeMarkdown(model);

    outputs.name.textContent = model.name;
    outputs.id.textContent = model.id;
    outputs.parameters.textContent = `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(model.parameterBillions)}B`;
    outputs.architecture.textContent = model.architecture;
    outputs.pipeline.textContent = model.pipelineTag;
    outputs.library.textContent = model.libraryName;
    outputs.access.textContent = model.private ? "Private metadata" : model.gated ? "Public metadata / gated weights" : "Public";
    outputs.modified.textContent = model.lastModified ? new Date(model.lastModified).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Not published";
    outputs.source.href = model.sourceUrl;
    outputs.source.textContent = `Open ${model.id} on Hugging Face ↗`;
    outputs.calculator.href = calculatorUrl(model);
    outputs.badgePreview.href = badgeDestination;
    badgeOutput.value = markdown;
    permalinkOutput.value = lookupUrl.toString();
    for (const precision of plan) {
      document.querySelector(`[data-plan-weight="${precision.bits}"]`).textContent = `${formatGiB(precision.weightGiB)} GiB`;
      document.querySelector(`[data-plan-floor="${precision.bits}"]`).textContent = `${formatGiB(precision.planningGiB)} GiB`;
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("model", model.id);
    history.replaceState({}, "", nextUrl);
    status.textContent = "SOURCE METADATA FOUND";
    error.hidden = true;
    result.hidden = false;
    badgeStatus.textContent = "";
  }

  async function lookup(value) {
    setLoading(true);
    status.textContent = "READING HUGGING FACE";
    error.hidden = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      renderModel(await fetchHuggingFaceModel(value, { signal: controller.signal }));
    } catch (lookupError) {
      showError(lookupError?.name === "AbortError" ? "The public Hugging Face API did not respond within 12 seconds. Try again." : lookupError.message);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    lookup(input.value);
  });

  document.querySelectorAll("[data-example-model]").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.dataset.exampleModel;
      lookup(input.value);
    });
  });

  document.querySelector("#copy-hf-badge").addEventListener("click", async () => {
    if (!currentModel) return;
    try {
      await copyText(badgeOutput.value, badgeOutput);
      badgeStatus.textContent = "Tracked model-card badge copied.";
    } catch {
      badgeOutput.focus();
      badgeOutput.select();
      badgeStatus.textContent = "Copy was blocked. Select the Markdown and copy it manually.";
    }
  });

  document.querySelector("#copy-hf-permalink").addEventListener("click", async () => {
    if (!currentModel) return;
    try {
      await copyText(permalinkOutput.value, permalinkOutput);
      badgeStatus.textContent = "Source lookup permalink copied.";
    } catch {
      permalinkOutput.focus();
      permalinkOutput.select();
      badgeStatus.textContent = "Copy was blocked. Select the permalink and copy it manually.";
    }
  });

  installEvidenceCapture({ trigger: "interaction" });

  const requestedModel = new URLSearchParams(window.location.search).get("model");
  if (requestedModel) {
    input.value = requestedModel;
    lookup(requestedModel);
  }
}
