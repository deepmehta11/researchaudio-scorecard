import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = path.join(root, "trending-local-llms/index.html");
const dataPath = path.join(root, "data/trending-local-llms.json");
const pageUrl = "https://tools.researchaudio.io/trending-local-llms/";
const sourcePageUrl = "https://huggingface.co/models?pipeline_tag=text-generation&sort=trending";
const apiUrl = new URL("https://huggingface.co/api/models");

[
  ["pipeline_tag", "text-generation"],
  ["sort", "trendingScore"],
  ["direction", "-1"],
  ["limit", "50"],
  ["expand[]", "trendingScore"],
  ["expand[]", "downloads"],
  ["expand[]", "likes"],
  ["expand[]", "lastModified"],
  ["expand[]", "safetensors"],
  ["expand[]", "pipeline_tag"],
].forEach(([name, value]) => apiUrl.searchParams.append(name, value));

const excludedArtifact = /(?:^|[-_.])(?:gguf|awq|gptq|exl2|mlx|fp8|bf16|int[248]|[248]bit|w[248](?:a(?:8|16))?)(?:$|[-_.])/i;
const gibibyte = 1024 ** 3;
const reviewedGuideHrefByModelId = new Map([
  ["deepseek-ai/DeepSeek-V4-Flash-0731", "../deepseek-v4-flash-gpu-requirements/"],
  ["deepseek-ai/DeepSeek-V4-Flash", "../deepseek-v4-flash-gpu-requirements/"],
  ["zai-org/GLM-5.2", "../glm-5-2-gpu-requirements/"],
  ["Qwen/Qwen2.5-7B-Instruct", "../qwen2-5-gpu-requirements/"],
  ["LiquidAI/LFM2.5-2.6B", "../models/lfm2-5-2-6b-gpu-requirements/"],
  ["deepgrove/maple-preview", "../models/maple-preview-gpu-requirements/"],
  ["inclusionAI/Ling-3.0-flash", "../models/ling-3-0-flash-gpu-requirements/"],
  ["Kwaipilot/KAT-Coder-V2.5-Dev", "../models/kat-coder-v2-5-dev-gpu-requirements/"],
  ["Akahsizrr/fuse-1-Lite", "../models/fuse-1-lite-gpu-requirements/"],
  ["meta-llama/Llama-3.1-8B-Instruct", "../models/llama-3-1-8b-instruct-gpu-requirements/"],
  ["badtheorylabs/BTL-4", "../models/btl-4-gpu-requirements/"],
  ["microsoft/Phi-3.5-mini-instruct", "../models/phi-3-5-mini-instruct-gpu-requirements/"],
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function modelUrl(id) {
  return `https://huggingface.co/${id.split("/").map(encodeURIComponent).join("/")}`;
}

export function planningGiB(parameters, bits, headroomPercent = 20) {
  return (Number(parameters) * Number(bits) / 8 / gibibyte) * (1 + Number(headroomPercent) / 100);
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function formatGiB(value) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: value >= 100 ? 1 : 2 }).format(value)} GiB`;
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function displayModelName(id) {
  return id.split("/").at(-1).replaceAll("_", " ");
}

function displayAuthor(id) {
  return id.split("/").slice(0, -1).join("/") || "Hugging Face";
}

export function prepareTrendingModels(rawModels, generatedAt = new Date().toISOString()) {
  assert.ok(Array.isArray(rawModels), "Hugging Face response must be an array");

  const models = rawModels
    .filter((model) => model?.pipeline_tag === "text-generation")
    .filter((model) => !excludedArtifact.test(model.id || ""))
    .filter((model) => Number.isFinite(Number(model?.safetensors?.total)))
    .filter((model) => Number(model.safetensors.total) >= 1e9 && Number(model.safetensors.total) <= 2e12)
    .sort((a, b) => Number(b.trendingScore || 0) - Number(a.trendingScore || 0))
    .slice(0, 12)
    .map((model, index) => {
      const parameters = Number(model.safetensors.total);
      return {
        rank: index + 1,
        id: model.id,
        name: displayModelName(model.id),
        author: displayAuthor(model.id),
        url: modelUrl(model.id),
        parameters,
        parameterBillions: round(parameters / 1e9, 2),
        trendingScore: Number(model.trendingScore || 0),
        downloads: Number(model.downloads || 0),
        likes: Number(model.likes || 0),
        lastModified: model.lastModified,
        planningGiB: {
          int4: round(planningGiB(parameters, 4)),
          int8: round(planningGiB(parameters, 8)),
          bf16: round(planningGiB(parameters, 16)),
        },
      };
    });

  assert.ok(models.length >= 8, `expected at least eight valid trending models, received ${models.length}`);
  assert.ok(models.every((model, index) => index === 0 || model.trendingScore <= models[index - 1].trendingScore), "models must remain sorted by trending score");

  return {
    generatedAt,
    source: {
      name: "Hugging Face Hub public models API",
      url: sourcePageUrl,
      query: "text-generation models sorted by trending score",
    },
    method: {
      modelCount: models.length,
      minimumParameters: 1_000_000_000,
      maximumParameters: 2_000_000_000_000,
      excludedArtifactNames: ["GGUF", "AWQ", "GPTQ", "EXL2", "MLX", "FP8", "BF16", "INT2/4/8", "2/4/8BIT", "W2/4/8"],
      weightFormula: "parameters * bits / 8 / 1024^3",
      headroomPercent: 20,
      limitations: "Weight plus headroom only. Excludes KV cache, activations, runtime workspace, file-format overhead, offload, speed, quality, and hardware compatibility.",
    },
    models,
  };
}

function calculatorHref(model) {
  const search = new URLSearchParams({
    parameterBillions: String(model.parameterBillions),
    bitsPerParameter: "4",
    checkpointGiB: "0",
    layers: "0",
    kvHeads: "0",
    headDimension: "0",
    contextTokens: "0",
    concurrentSequences: "1",
    kvCacheBits: "16",
    inferenceHeadroom: "20",
    vramPerGpu: "24",
    usableVramPercent: "90",
    availableGpus: "1",
  });
  return `../llm-gpu-memory-calculator/?${search.toString()}`;
}

export function renderTrendingRows(data) {
  return data.models.map((model) => {
    const modified = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
      .format(new Date(model.lastModified));
    const reviewedGuideHref = reviewedGuideHrefByModelId.get(model.id);
    const nextCheck = reviewedGuideHref
      ? `<a href="${escapeHtml(reviewedGuideHref)}">Read evidence →</a><small><a href="${escapeHtml(calculatorHref(model))}">Open calculator</a></small>`
      : `<a href="${escapeHtml(calculatorHref(model))}">Open plan →</a>`;
    return `              <tr data-model-id="${escapeHtml(model.id.toLowerCase())}">
                <td><span class="trend-rank">#${String(model.rank).padStart(2, "0")}</span></td>
                <th scope="row">
                  <a href="${escapeHtml(model.url)}" rel="noopener">${escapeHtml(model.name)} ↗</a>
                  <small>${escapeHtml(model.author)} · updated ${escapeHtml(modified)}</small>
                </th>
                <td><strong>${escapeHtml(model.parameterBillions)}B</strong></td>
                <td>${escapeHtml(formatGiB(model.planningGiB.int4))}</td>
                <td>${escapeHtml(formatGiB(model.planningGiB.int8))}</td>
                <td>${escapeHtml(formatGiB(model.planningGiB.bf16))}</td>
                <td><strong>${escapeHtml(model.trendingScore)}</strong><small>${escapeHtml(formatCount(model.downloads))} downloads · ${escapeHtml(formatCount(model.likes))} likes</small></td>
                <td>${nextCheck}</td>
              </tr>`;
  }).join("\n");
}

function renderSchema(data) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        "@id": `${pageUrl}#dataset`,
        name: "Trending Local LLM Hardware Index",
        description: "A daily snapshot of trending Hugging Face text-generation models with transparent INT4, INT8, and BF16 weight-plus-headroom planning floors.",
        url: pageUrl,
        dateModified: data.generatedAt,
        creator: { "@type": "Organization", name: "ResearchAudio", url: "https://researchaudio.io/" },
        isBasedOn: data.source.url,
        measurementTechnique: data.method.weightFormula,
        distribution: [{
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: "https://tools.researchaudio.io/data/trending-local-llms.json",
        }],
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#models`,
        name: "Trending text-generation models",
        numberOfItems: data.models.length,
        itemListElement: data.models.map((model) => ({
          "@type": "ListItem",
          position: model.rank,
          url: model.url,
          name: model.id,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "How much VRAM does a trending LLM need?", acceptedAnswer: { "@type": "Answer", text: "Start with total parameter count multiplied by bits per parameter, converted to binary GiB, then add cache, runtime workspace, and measured headroom. This index shows a weight-plus-20-percent-headroom floor rather than a deployment guarantee." } },
          { "@type": "Question", name: "Does a mixture-of-experts active parameter count determine VRAM?", acceptedAnswer: { "@type": "Answer", text: "No. Active parameters can describe compute per token, while resident weights still need storage or an explicit offload path. The index uses the Hub safetensors total parameter count as the weight-floor input." } },
          { "@type": "Question", name: "Is Hugging Face trending score a benchmark?", acceptedAnswer: { "@type": "Answer", text: "No. It is a discovery signal from the Hub. It does not prove model quality, safety, speed, licensing suitability, or production readiness." } },
        ],
      },
    ],
  };
  return `    <script type="application/ld+json">\n${JSON.stringify(schema, null, 6).replaceAll("<", "\\u003c")}\n    </script>`;
}

function replaceBlock(document, startMarker, endMarker, content) {
  const start = document.indexOf(startMarker);
  const end = document.indexOf(endMarker);
  assert.ok(start !== -1 && end !== -1 && end > start, `missing generated block ${startMarker}`);
  return `${document.slice(0, start + startMarker.length)}\n${content}\n${document.slice(end)}`;
}

export async function updateTrendingIndex({ fetchImpl = fetch, generatedAt = new Date().toISOString() } = {}) {
  const response = await fetchImpl(apiUrl, {
    headers: {
      accept: "application/json",
      "user-agent": "ResearchAudio-Hardware-Index/1.0 (+https://tools.researchaudio.io/trending-local-llms/)",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Hugging Face models API failed with ${response.status}`);

  const data = prepareTrendingModels(await response.json(), generatedAt);
  const existingPage = await readFile(pagePath, "utf8");
  const updatedLabel = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(data.generatedAt));

  let nextPage = replaceBlock(
    existingPage,
    "<!-- TRENDING_SCHEMA:START -->",
    "<!-- TRENDING_SCHEMA:END -->",
    renderSchema(data),
  );
  nextPage = replaceBlock(
    nextPage,
    "<!-- TRENDING_UPDATED:START -->",
    "<!-- TRENDING_UPDATED:END -->",
    `          <time datetime="${escapeHtml(data.generatedAt)}">Refreshed ${escapeHtml(updatedLabel)} UTC</time>`,
  );
  nextPage = replaceBlock(
    nextPage,
    "<!-- TRENDING_MODELS:START -->",
    "<!-- TRENDING_MODELS:END -->",
    renderTrendingRows(data),
  );

  await mkdir(path.dirname(dataPath), { recursive: true });
  await Promise.all([
    writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8"),
    writeFile(pagePath, nextPage, "utf8"),
  ]);

  return data;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = await updateTrendingIndex();
  console.log(`Trending model index refreshed with ${data.models.length} models at ${data.generatedAt}.`);
}
