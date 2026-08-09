import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  buildModelHardwareBadgeDestination,
  buildModelHardwareBadgeMarkdown,
  buildModelHardwareBadgeSvg,
} from "../model-hardware-badge.js";
import { planningGiB } from "./update-trending-models.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(root, "data/reviewed-model-hardware-pages.json");
const trendingPath = path.join(root, "data/trending-local-llms.json");
const outputDataPath = path.join(root, "data/model-hardware-pages.json");
const modelsRoot = path.join(root, "models");
const modelBadgesRoot = path.join(root, "badges/models");
const sitemapPath = path.join(root, "sitemap.xml");
const llmsPath = path.join(root, "llms.txt");
const siteOrigin = "https://tools.researchaudio.io";
const publicationOrigin = "https://researchaudio.io";
const beehiivFormId = "cbe3aea9-de92-41ca-92c2-691e3be5f2a4";
const usablePercent = 90;
const headroomPercent = 20;
const gpuTiersGiB = [8, 12, 16, 24, 32, 48, 80, 96, 141];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function round(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

function formatGiB(value) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: value >= 100 ? 1 : 2 }).format(value)} GiB`;
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

function modelApiUrl(id) {
  return `https://huggingface.co/api/models/${id.split("/").map(encodeURIComponent).join("/")}`;
}

function modelHubUrl(id) {
  return `https://huggingface.co/${id.split("/").map(encodeURIComponent).join("/")}`;
}

function firstSingleGpuTier(floorGiB) {
  return gpuTiersGiB.find((capacity) => capacity * usablePercent / 100 >= floorGiB) || null;
}

function minimumGpuCount(floorGiB, capacityGiB) {
  return Math.ceil(floorGiB / (capacityGiB * usablePercent / 100));
}

function calculatorHref(model, { bits = 4, vramPerGpu = 24, prefix = "../../" } = {}) {
  const search = new URLSearchParams({
    parameterBillions: String(model.parameterBillions),
    bitsPerParameter: String(bits),
    checkpointGiB: "0",
    layers: "0",
    kvHeads: "0",
    headDimension: "0",
    contextTokens: "0",
    concurrentSequences: "1",
    kvCacheBits: "16",
    inferenceHeadroom: String(headroomPercent),
    vramPerGpu: String(vramPerGpu),
    usableVramPercent: String(usablePercent),
    availableGpus: "1",
  });
  return `${prefix}llm-gpu-memory-calculator/?${search.toString()}`;
}

function replaceBlock(document, startMarker, endMarker, content) {
  const start = document.indexOf(startMarker);
  const end = document.indexOf(endMarker);
  assert.ok(start !== -1 && end !== -1 && end > start, `missing generated block ${startMarker}`);
  return `${document.slice(0, start + startMarker.length)}\n${content}\n${document.slice(end)}`;
}

async function fetchModelDetails(modelId, fetchImpl) {
  const response = await fetchImpl(modelApiUrl(modelId), {
    headers: {
      accept: "application/json",
      "user-agent": "ResearchAudio-Reviewed-Model-Guides/1.0 (+https://tools.researchaudio.io/models/)",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Hugging Face model API failed for ${modelId} with ${response.status}`);
  return response.json();
}

export function buildGuideModel(editorial, metadata, trendingData, generatedAt) {
  assert.equal(metadata.id, editorial.modelId, `source id mismatch for ${editorial.modelId}`);
  assert.equal(metadata.pipeline_tag, "text-generation", `${editorial.modelId} must be a text-generation repository`);
  assert.ok(Number.isFinite(Number(metadata?.safetensors?.total)), `${editorial.modelId} requires a public safetensors total`);

  const parameters = Number(metadata.safetensors.total);
  assert.ok(parameters >= 1e9 && parameters <= 2e12, `${editorial.modelId} parameter total is outside the reviewed range`);

  const currentTrending = trendingData.models.find((candidate) => candidate.id === editorial.modelId) || null;
  const precision = [4, 8, 16].map((bits) => {
    const rawGiB = round(planningGiB(parameters, bits, 0));
    const floorGiB = round(planningGiB(parameters, bits, headroomPercent));
    return {
      label: bits === 4 ? "INT4" : bits === 8 ? "INT8" : "BF16",
      bits,
      rawGiB,
      floorGiB,
      firstSingleGpuGiB: firstSingleGpuTier(floorGiB),
      gpu24Count: minimumGpuCount(floorGiB, 24),
    };
  });

  const languages = asArray(metadata?.cardData?.language);
  const baseModels = asArray(metadata?.cardData?.base_model);
  const architecture = asArray(metadata?.config?.architectures).at(0) || null;
  const license = metadata?.cardData?.license || null;

  assert.ok(architecture, `${editorial.modelId} requires a source-reported architecture`);
  assert.ok(license, `${editorial.modelId} requires source-reported license metadata`);

  const model = {
    ...editorial,
    url: `${siteOrigin}/models/${editorial.slug}/`,
    hubUrl: modelHubUrl(editorial.modelId),
    apiUrl: modelApiUrl(editorial.modelId),
    name: editorial.modelId.split("/").at(-1).replaceAll("_", " "),
    author: editorial.modelId.split("/").slice(0, -1).join("/"),
    generatedAt,
    parameters,
    parameterBillions: round(parameters / 1e9),
    downloads: Number(metadata.downloads || 0),
    likes: Number(metadata.likes || 0),
    createdAt: metadata.createdAt,
    lastModified: metadata.lastModified,
    library: metadata.library_name || null,
    modelType: metadata?.config?.model_type || null,
    architecture,
    license,
    licenseName: metadata?.cardData?.license_name || null,
    languages,
    baseModels,
    gated: metadata.gated || false,
    currentTrendingRank: currentTrending?.rank || null,
    currentTrendingScore: currentTrending?.trendingScore ?? null,
    precision,
  };
  model.badge = {
    imageUrl: `${siteOrigin}/badges/models/${editorial.slug}.svg`,
    destinationUrl: buildModelHardwareBadgeDestination(model),
    markdown: buildModelHardwareBadgeMarkdown(model),
  };
  return model;
}

function renderPrecisionRows(model) {
  return model.precision.map((item) => `              <tr>
                <th scope="row">${escapeHtml(item.label)}</th>
                <td>${item.bits} bits</td>
                <td>${escapeHtml(formatGiB(item.rawGiB))}</td>
                <td><strong>${escapeHtml(formatGiB(item.floorGiB))}</strong></td>
                <td>${item.firstSingleGpuGiB ? `${item.firstSingleGpuGiB} GB` : "No listed single-card tier"}</td>
                <td>${item.gpu24Count}</td>
                <td><a href="${escapeHtml(calculatorHref(model, { bits: item.bits }))}">Edit plan →</a></td>
              </tr>`).join("\n");
}

function renderCapacityRows(model) {
  const int4 = model.precision.find((item) => item.bits === 4);
  return gpuTiersGiB.map((capacity) => {
    const usable = round(capacity * usablePercent / 100);
    const margin = round(usable - int4.floorGiB);
    const status = margin >= 0 ? `Clears by ${formatGiB(margin)}` : `Short by ${formatGiB(Math.abs(margin))}`;
    return `              <tr>
                <th scope="row">${capacity} GB</th>
                <td>${formatGiB(usable)}</td>
                <td class="${margin >= 0 ? "fit-pass" : "fit-short"}">${escapeHtml(status)}</td>
                <td>${minimumGpuCount(int4.floorGiB, capacity)}</td>
              </tr>`;
  }).join("\n");
}

function renderSourceFacts(model) {
  const languageText = model.languages.length ? model.languages.join(", ") : "Not declared in card metadata";
  const baseModelText = model.baseModels.length ? model.baseModels.join(", ") : "Not declared in card metadata";
  const gatedText = model.gated ? `Yes (${model.gated === true ? "gated" : model.gated})` : "No";
  return `          <dl class="model-fact-grid">
            <div><dt>Repository</dt><dd>${escapeHtml(model.modelId)}</dd></div>
            <div><dt>Safetensors total</dt><dd>${escapeHtml(model.parameterBillions)}B parameters</dd></div>
            <div><dt>Architecture</dt><dd>${escapeHtml(model.architecture)}</dd></div>
            <div><dt>Model type</dt><dd>${escapeHtml(model.modelType || "Not declared")}</dd></div>
            <div><dt>Library</dt><dd>${escapeHtml(model.library || "Not declared")}</dd></div>
            <div><dt>License metadata</dt><dd>${escapeHtml(model.licenseName || model.license)}</dd></div>
            <div><dt>Access gated</dt><dd>${escapeHtml(gatedText)}</dd></div>
            <div><dt>Base model</dt><dd>${escapeHtml(baseModelText)}</dd></div>
            <div><dt>Languages</dt><dd>${escapeHtml(languageText)}</dd></div>
            <div><dt>Created</dt><dd>${escapeHtml(formatDate(model.createdAt))}</dd></div>
            <div><dt>Last modified</dt><dd>${escapeHtml(formatDate(model.lastModified))}</dd></div>
            <div><dt>Hub signal</dt><dd>${escapeHtml(formatCount(model.downloads))} downloads · ${escapeHtml(formatCount(model.likes))} likes${model.currentTrendingRank ? ` · daily rank #${model.currentTrendingRank}` : ""}</dd></div>
          </dl>`;
}

function renderRelatedCards(model, relatedModels) {
  return relatedModels.map((related) => {
    const int4 = related.precision.find((item) => item.bits === 4);
    return `          <a class="resource-card model-related-card" href="../${escapeHtml(related.slug)}/">
            <span class="instrument-code">${escapeHtml(related.parameterBillions)}B · ${escapeHtml(formatGiB(int4.floorGiB))} INT4 floor</span>
            <h2>${escapeHtml(related.name)}</h2>
            <p>${escapeHtml(related.whyThisPage)}</p>
            <b>Review ${escapeHtml(related.name)} →</b>
          </a>`;
  }).join("\n");
}

function renderModelSchema(model) {
  const int4 = model.precision.find((item) => item.bits === 4);
  const faq = [
    {
      question: `How much VRAM does ${model.name} need?`,
      answer: `${model.name} has ${model.parameterBillions} billion safetensors parameters in the public Hub metadata. The weight-plus-${headroomPercent}%-headroom floors are ${formatGiB(model.precision[0].floorGiB)} at INT4, ${formatGiB(model.precision[1].floorGiB)} at INT8, and ${formatGiB(model.precision[2].floorGiB)} at BF16. These estimates exclude KV cache, activations, runtime workspace, fragmentation, offload, and speed.`,
    },
    {
      question: `Can ${model.name} run on one GPU?`,
      answer: int4.firstSingleGpuGiB
        ? `The first listed card tier whose 90%-usable budget clears the INT4 weight floor is ${int4.firstSingleGpuGiB} GB. That is an arithmetic starting point, not a runtime guarantee.`
        : "The INT4 weight floor does not clear any single-card tier in the comparison. A supported sharding or offload plan is required.",
    },
    {
      question: `Does the Hugging Face signal prove ${model.name} is good?`,
      answer: "No. Downloads, likes, and trending position are discovery signals. They do not prove task quality, safety, speed, runtime compatibility, or licensing suitability.",
    },
  ];

  return {
    faq,
    json: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "TechArticle",
          headline: `${model.name} GPU and VRAM Requirements`,
          description: model.whyThisPage,
          url: model.url,
          datePublished: model.reviewedAt,
          dateModified: model.generatedAt,
          author: { "@type": "Organization", name: "ResearchAudio", url: `${publicationOrigin}/` },
          publisher: { "@type": "Organization", name: "ResearchAudio", url: `${publicationOrigin}/` },
          isBasedOn: model.hubUrl,
          about: [model.modelId, `${model.parameterBillions} billion parameters`, "GPU memory", "local LLM inference"],
          mainEntityOfPage: model.url,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "ResearchAudio tools", item: `${siteOrigin}/tools/` },
            { "@type": "ListItem", position: 2, name: "Model hardware pages", item: `${siteOrigin}/models/` },
            { "@type": "ListItem", position: 3, name: model.name, item: model.url },
          ],
        },
        {
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        },
      ],
    },
  };
}

export function renderModelPage(model, relatedModels) {
  const schema = renderModelSchema(model);
  const attributionSource = `model_${model.slug.replaceAll("-", "_")}`;
  const subscriptionBase = `${publicationOrigin}/subscribe?utm_source=${attributionSource}&amp;utm_medium=organic_model_guide&amp;utm_campaign=ai_evidence_lab`;
  const int4 = model.precision.find((item) => item.bits === 4);
  const singleCardSummary = int4.firstSingleGpuGiB
    ? `${int4.firstSingleGpuGiB} GB is the first listed single-card tier that clears the conservative INT4 floor.`
    : "No listed single-card tier clears the conservative INT4 floor.";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(model.name)} GPU &amp; VRAM Requirements (INT4, INT8, BF16) | ResearchAudio</title>
    <meta name="description" content="Source-backed ${escapeHtml(model.name)} GPU memory requirements: ${escapeHtml(model.parameterBillions)}B parameters, ${escapeHtml(formatGiB(int4.floorGiB))} INT4 floor, precision table, card-fit matrix, and editable calculator." />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeHtml(model.url)}" />
    <link rel="icon" href="../../favicon.svg" type="image/svg+xml" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(model.name)} GPU &amp; VRAM Requirements" />
    <meta property="og:description" content="${escapeHtml(singleCardSummary)} Inspect the source, assumptions, and editable plan." />
    <meta property="og:url" content="${escapeHtml(model.url)}" />
    <meta property="og:image" content="${siteOrigin}/social-card.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&amp;family=Instrument+Sans:wght@400;500;600;700&amp;family=Newsreader:opsz,wght@6..72,600;6..72,700&amp;display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../../lab.css" />
    <script type="application/ld+json">
${JSON.stringify(schema.json, null, 6).replaceAll("<", "\\u003c")}
    </script>
  </head>
  <body>
    <a class="skip-link" href="#hardware-plan">Skip to the hardware plan</a>
    <header class="lab-header">
      <a class="wordmark" href="${publicationOrigin}/?utm_source=${attributionSource}&amp;utm_medium=organic_model_guide&amp;utm_campaign=ai_evidence_lab&amp;utm_content=wordmark"><span class="wordmark-mark">RA</span><span>ResearchAudio</span></a>
      <nav class="lab-nav" aria-label="Primary navigation">
        <a href="../">All models</a>
        <a href="../../trending-local-llms/">Daily index</a>
        <a href="../../llm-gpu-memory-calculator/">Calculator</a>
        <a class="join-link" href="${subscriptionBase}&amp;utm_content=header_join">Join free</a>
      </nav>
    </header>

    <main class="lab-main">
      <section class="lab-hero model-guide-hero" aria-labelledby="hero-title">
        <div>
          <p class="eyebrow">Reviewed repository / hardware evidence</p>
          <h1 id="hero-title">${escapeHtml(model.name)}: GPU &amp; VRAM requirements</h1>
          <p class="hero-deck">${escapeHtml(model.editorialSummary)}</p>
          <a class="hero-join-link" href="#hardware-plan">See the precision plan →</a>
          <a class="hero-join-link" href="${escapeHtml(model.hubUrl)}" rel="noopener">Inspect the source repository →</a>
        </div>
        <aside class="lab-index" aria-label="Source-backed model summary">
          <span>Safetensors total</span>
          <strong>${escapeHtml(model.parameterBillions)}B</strong>
          <p>${escapeHtml(formatGiB(int4.floorGiB))} INT4 weight-plus-headroom floor. ${escapeHtml(singleCardSummary)}</p>
        </aside>
      </section>

      <section class="comparison-section model-decision" aria-labelledby="decision-title">
        <div>
          <p class="eyebrow">Decision summary</p>
          <h2 id="decision-title">Where the memory boundary actually lands.</h2>
        </div>
        <div class="method-copy">
          <p>${escapeHtml(model.capacityDecision)}</p>
          <p><strong>Why this page exists.</strong> ${escapeHtml(model.whyThisPage)}</p>
        </div>
      </section>

      <section class="comparison-section" id="hardware-plan" aria-labelledby="plan-title">
        <div class="resource-heading">
          <div>
            <p class="eyebrow">Weights first / precision by precision</p>
            <h2 id="plan-title">The reproducible memory floor.</h2>
          </div>
          <p>Every row uses ${escapeHtml(model.parameterBillions)}B parameters × bits ÷ 8 ÷ 1024³, then adds ${headroomPercent}% planning headroom. The single-card tier assumes ${usablePercent}% of labeled VRAM is available.</p>
        </div>
        <div class="comparison-table-wrap model-table-wrap">
          <table>
            <thead><tr><th>Mode</th><th>Bits</th><th>Raw weights</th><th>+ ${headroomPercent}% floor</th><th>First single-card tier</th><th>24 GB GPU count*</th><th>Calculator</th></tr></thead>
            <tbody>
${renderPrecisionRows(model)}
            </tbody>
          </table>
        </div>
        <p class="table-note">*GPU count is capacity division against ${usablePercent}% usable VRAM. It does not prove the runtime can shard the model, avoid replication, or deliver acceptable interconnect performance.</p>
      </section>

      <section class="comparison-section" aria-labelledby="fit-title">
        <div class="resource-heading">
          <div>
            <p class="eyebrow">INT4 card-fit matrix</p>
            <h2 id="fit-title">Test the floor against common memory tiers.</h2>
          </div>
          <p>Positive margin means the INT4 weight-plus-headroom floor fits inside the declared usable budget. It is not leftover context capacity: cache, runtime workspace, and system allocations are still unknown.</p>
        </div>
        <div class="comparison-table-wrap model-table-wrap">
          <table>
            <thead><tr><th>Card memory</th><th>${usablePercent}% usable</th><th>One-card result</th><th>Capacity-only count</th></tr></thead>
            <tbody>
${renderCapacityRows(model)}
            </tbody>
          </table>
        </div>
      </section>

      <section class="method-section" aria-labelledby="source-title">
        <div>
          <p class="eyebrow">Public source record</p>
          <h2 id="source-title">What the repository declares.</h2>
          <p class="model-source-note">Metadata refreshed ${escapeHtml(formatDate(model.generatedAt))}. Open the source before relying on any field.</p>
          <a class="guide-link" href="${escapeHtml(model.hubUrl)}" rel="noopener">Open ${escapeHtml(model.modelId)} →</a>
        </div>
        <div>
${renderSourceFacts(model)}
        </div>
      </section>

      <section class="principle-strip model-caution" aria-label="Deployment boundaries">
        <p class="eyebrow">Do not confuse capacity with deployment</p>
        <p><strong>Repository-specific caution.</strong><br />${escapeHtml(model.deploymentCaution)}</p>
        <p><strong>Formula boundary.</strong><br />No KV cache, activations, graph capture, allocator fragmentation, offload, operating-system reserve, throughput, latency, or power is included.</p>
        <p><strong>Source boundary.</strong><br />Hub trend, downloads, and likes help discover repositories. They are not a benchmark, endorsement, security review, or license opinion.</p>
      </section>

      <section class="comparison-section model-next-checks" aria-labelledby="checks-title">
        <div>
          <p class="eyebrow">Before downloading weights</p>
          <h2 id="checks-title">Three checks specific to this repository.</h2>
        </div>
        <ol class="model-check-list">
          ${model.nextChecks.map((check) => `<li>${escapeHtml(check)}</li>`).join("\n          ")}
        </ol>
      </section>

      <section class="model-badge-section" aria-labelledby="badge-title" data-model-badge>
        <div>
          <p class="eyebrow">Passive backlink / model-card distribution</p>
          <h2 id="badge-title">Let the repository carry its hardware evidence.</h2>
          <p>Add this passive SVG badge to a README, model card, documentation page, or benchmark report. It states the source-backed ${escapeHtml(model.name)} INT4 floor and links to the assumptions—not to a download or quality claim.</p>
          <p><strong>Why this repository benefits.</strong> ${escapeHtml(model.badgePitch)}</p>
        </div>
        <div class="model-badge-console">
          <a class="model-badge-preview" href="${escapeHtml(model.badge.destinationUrl)}">
            <img src="${escapeHtml(model.badge.imageUrl)}" alt="${escapeHtml(model.name)} source-backed INT4 planning floor badge" width="620" height="52" />
          </a>
          <label for="model-badge-${escapeHtml(model.slug)}">Markdown for a README or model card</label>
          <textarea id="model-badge-${escapeHtml(model.slug)}" rows="4" readonly data-model-badge-output>${escapeHtml(model.badge.markdown)}</textarea>
          <button class="action-button model-badge-copy" type="button" data-copy-model-badge>Copy model-card badge</button>
          <p class="share-status" role="status" data-model-badge-status></p>
          <small>Badge visits use <code>utm_source=model_badge</code>, <code>utm_medium=model_card</code>, and this repository’s slug. Copying does not submit or store anything.</small>
        </div>
      </section>

      <section class="resource-section" aria-labelledby="related-title">
        <div class="resource-heading">
          <div><p class="eyebrow">Nearest reviewed parameter totals</p><h2 id="related-title">Compare before choosing hardware.</h2></div>
          <p>These pages use the same formula and source rules, making the capacity boundary comparable without pretending the models have equivalent quality or runtime behavior.</p>
        </div>
        <div class="resource-grid model-related-grid">
${renderRelatedCards(model, relatedModels)}
        </div>
      </section>

      <section class="guide-section" aria-labelledby="faq-title">
        <div class="guide-intro">
          <p class="eyebrow">${escapeHtml(model.name)} FAQ</p>
          <h2 id="faq-title">Three answers with the assumptions attached.</h2>
          <p>Use these as a first-pass hardware screen. Replace parameter arithmetic with exact artifact bytes and architecture-aware cache inputs before deployment.</p>
          <a class="guide-link" href="${escapeHtml(calculatorHref(model))}">Open the editable GPU calculator →</a>
        </div>
        <div class="faq-list">
          ${schema.faq.map((item) => `<article class="faq-item"><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></article>`).join("\n          ")}
        </div>
      </section>

      <section class="subscribe-block" id="subscribe" aria-labelledby="subscribe-title">
        <div>
          <p class="eyebrow">Evidence before infrastructure</p>
          <h2 id="subscribe-title">Get the next model decision brief.</h2>
          <p>ResearchAudio turns model releases, checkpoint claims, memory boundaries, and serving constraints into practical decisions for engineers and builders.</p>
        </div>
        <div class="subscribe-form-shell">
          <p class="subscribe-direct-fallback"><strong>Prefer the hosted signup page?</strong><a href="${subscriptionBase}&amp;utm_content=direct_join">Join ResearchAudio free →</a></p>
          <script async src="https://subscribe-forms.beehiiv.com/v3/loader.js" data-beehiiv-form="${beehiivFormId}"></script>
          <noscript><p>JavaScript is required for the signup form. <a href="${subscriptionBase}&amp;utm_content=noscript_join">Subscribe directly on ResearchAudio.</a></p></noscript>
        </div>
      </section>
    </main>

    <footer class="lab-footer">
      <p>ResearchAudio / evidence-led AI briefings for engineers and builders.</p>
      <div class="footer-links"><a href="../">All model pages</a><a href="../../trending-local-llms/">Daily index</a><a href="../../local-llm-gpu-guide/">Hardware guide</a><a href="${publicationOrigin}/?utm_source=${attributionSource}&amp;utm_medium=organic_model_guide&amp;utm_campaign=ai_evidence_lab&amp;utm_content=footer">Latest briefings</a></div>
    </footer>
    <script type="module" src="../../reader-share.js"></script>
    <script type="module" src="../../model-hardware-badge.js"></script>
    <script async src="https://subscribe-forms.beehiiv.com/attribution.js"></script>
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"c20a9e29828c471c92ed7c2284901e05","spa":false}'></script>
  </body>
</html>
`;
}

function renderHubCard(model) {
  const int4 = model.precision.find((item) => item.bits === 4);
  return `          <article class="resource-card model-cluster-card">
            <span class="instrument-code">${escapeHtml(model.parameterBillions)}B parameters · ${escapeHtml(formatGiB(int4.floorGiB))} INT4 floor</span>
            <h2><a href="./${escapeHtml(model.slug)}/">${escapeHtml(model.name)}</a></h2>
            <p>${escapeHtml(model.whyThisPage)}</p>
            <dl><div><dt>First INT4 tier</dt><dd>${int4.firstSingleGpuGiB ? `${int4.firstSingleGpuGiB} GB` : "Multi-GPU or offload"}</dd></div><div><dt>Architecture</dt><dd>${escapeHtml(model.architecture)}</dd></div></dl>
            <a class="guide-link" href="./${escapeHtml(model.slug)}/">Open the reviewed plan →</a>
          </article>`;
}

export function renderModelsHub(data) {
  const listSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Reviewed Local LLM Hardware Pages",
    description: "Repository-specific local LLM hardware pages with public safetensors totals, transparent precision floors, GPU fit matrices, and source boundaries.",
    url: `${siteOrigin}/models/`,
    dateModified: data.generatedAt,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: data.models.length,
      itemListElement: data.models.map((model, index) => ({ "@type": "ListItem", position: index + 1, name: model.name, url: model.url })),
    },
  };

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Local LLM Model Hardware Pages: VRAM by Repository | ResearchAudio</title>
    <meta name="description" content="Reviewed local LLM GPU and VRAM pages using public repository metadata, transparent INT4, INT8, and BF16 weight floors, card-fit matrices, and editable calculators." />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${siteOrigin}/models/" />
    <link rel="icon" href="../favicon.svg" type="image/svg+xml" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Reviewed Local LLM Hardware Pages" />
    <meta property="og:description" content="Repository-specific parameter totals, precision floors, GPU fit boundaries, and source checks." />
    <meta property="og:url" content="${siteOrigin}/models/" />
    <meta property="og:image" content="${siteOrigin}/social-card.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&amp;family=Instrument+Sans:wght@400;500;600;700&amp;family=Newsreader:opsz,wght@6..72,600;6..72,700&amp;display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../lab.css" />
    <script type="application/ld+json">
${JSON.stringify(listSchema, null, 6).replaceAll("<", "\\u003c")}
    </script>
  </head>
  <body>
    <a class="skip-link" href="#reviewed-models">Skip to reviewed models</a>
    <header class="lab-header">
      <a class="wordmark" href="${publicationOrigin}/?utm_source=model_hardware_hub&amp;utm_medium=organic_hub&amp;utm_campaign=ai_evidence_lab&amp;utm_content=wordmark"><span class="wordmark-mark">RA</span><span>ResearchAudio</span></a>
      <nav class="lab-nav" aria-label="Primary navigation"><a href="../trending-local-llms/">Daily index</a><a href="../local-llm-gpu-guide/">Hardware guide</a><a href="../tools/">All tools</a><a class="join-link" href="${publicationOrigin}/subscribe?utm_source=model_hardware_hub&amp;utm_medium=organic_hub&amp;utm_campaign=ai_evidence_lab&amp;utm_content=header_join">Join free</a></nav>
    </header>
    <main class="lab-main">
      <section class="lab-hero model-hub-hero" aria-labelledby="hero-title">
        <div><p class="eyebrow">Reviewed model hardware cluster</p><h1 id="hero-title">Start with the repository, not the model-size rumor.</h1><p class="hero-deck">Eight source-backed hardware pages turn public safetensors totals into comparable INT4, INT8, and BF16 floors. Every page names its license metadata, architecture, usable-memory rule, and missing deployment costs.</p><a class="hero-join-link" href="#reviewed-models">Browse reviewed pages →</a><a class="hero-join-link" href="../trending-local-llms/">See today’s model queue →</a></div>
        <aside class="lab-index"><span>Reviewed batch</span><strong>${data.models.length}</strong><p>New trending repositories are not published automatically. Each URL requires a distinct hardware decision and editorial review.</p></aside>
      </section>
      <section class="principle-strip"><p class="eyebrow">Publication gate</p><p><strong>Source-backed.</strong><br />Public repository metadata and safetensors totals are linked on every page.</p><p><strong>Decision-specific.</strong><br />Each page resolves a distinct memory or card-tier boundary.</p><p><strong>Not deployment proof.</strong><br />Weight fit never stands in for cache, runtime support, speed, quality, or licensing review.</p></section>
      <section class="resource-section" id="reviewed-models" aria-labelledby="models-title">
        <div class="resource-heading"><div><p class="eyebrow">Initial reviewed batch</p><h2 id="models-title">Repository-specific GPU plans.</h2></div><p>Compare the INT4 floor and architecture at a glance, then open the page for the full precision ladder, card-fit matrix, source record, limitations, and prefilled calculator.</p></div>
        <div class="resource-grid model-cluster-grid">
${data.models.map(renderHubCard).join("\n")}
        </div>
      </section>
      <section class="method-section"><div><p class="eyebrow">One method across the cluster</p><h2>Comparable arithmetic, explicit uncertainty.</h2></div><div class="method-copy"><p><strong>Weight calculation.</strong> Total safetensors parameters × bits ÷ eight ÷ 1024³. A shared ${headroomPercent}% allowance is added before comparing with hardware.</p><p><strong>Usable capacity.</strong> The first single-card tier must fit inside ${usablePercent}% of labeled VRAM. This creates a reproducible screen without claiming that every runtime reserves the same amount.</p><p><strong>Progressive rollout.</strong> The batch remains intentionally small. Search indexing, useful visits, and attributed subscriptions must be measured before more reviewed pages are added.</p><p><strong>Daily refresh.</strong> Public downloads, likes, modification dates, parameter totals, license metadata, and architecture are checked again by the scheduled source refresh. A failed or incomplete response cannot overwrite the last verified site.</p></div></section>
      <section class="subscribe-block" id="subscribe"><div><p class="eyebrow">The next useful model decision</p><h2>Get evidence, not another release headline.</h2><p>ResearchAudio translates model claims and infrastructure boundaries into practical decisions for engineers and builders.</p></div><div class="subscribe-form-shell"><p class="subscribe-direct-fallback"><strong>Prefer the hosted signup page?</strong><a href="${publicationOrigin}/subscribe?utm_source=model_hardware_hub&amp;utm_medium=organic_hub&amp;utm_campaign=ai_evidence_lab&amp;utm_content=direct_join">Join ResearchAudio free →</a></p><script async src="https://subscribe-forms.beehiiv.com/v3/loader.js" data-beehiiv-form="${beehiivFormId}"></script><noscript><p>JavaScript is required for the signup form. <a href="${publicationOrigin}/subscribe?utm_source=model_hardware_hub&amp;utm_medium=organic_hub&amp;utm_campaign=ai_evidence_lab&amp;utm_content=noscript_join">Subscribe directly on ResearchAudio.</a></p></noscript></div></section>
    </main>
    <footer class="lab-footer"><p>ResearchAudio / evidence-led AI briefings for engineers and builders.</p><div class="footer-links"><a href="../trending-local-llms/">Daily index</a><a href="../llm-gpu-memory-calculator/">GPU calculator</a><a href="../local-llm-gpu-guide/">Hardware guide</a><a href="${publicationOrigin}/?utm_source=model_hardware_hub&amp;utm_medium=organic_hub&amp;utm_campaign=ai_evidence_lab&amp;utm_content=footer">Latest briefings</a></div></footer>
    <script type="module" src="../reader-share.js"></script>
    <script async src="https://subscribe-forms.beehiiv.com/attribution.js"></script>
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"c20a9e29828c471c92ed7c2284901e05","spa":false}'></script>
  </body>
</html>
`;
}

function mainTextTokens(page) {
  const main = page.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] || "";
  return main
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .toLowerCase()
    .match(/[a-z0-9]+(?:[.-][a-z0-9]+)*/g) || [];
}

function ngrams(tokens, size = 5) {
  const result = new Set();
  for (let index = 0; index <= tokens.length - size; index += 1) result.add(tokens.slice(index, index + size).join(" "));
  return result;
}

export function assertProgrammaticQuality(renderedPages, registry) {
  assert.ok(renderedPages.length > 0 && renderedPages.length <= 50, "reviewed rollout must remain between one and fifty pages");
  assert.equal(renderedPages.length, registry.pages.length, "every reviewed record must render exactly one page");

  const pageSignals = renderedPages.map(({ model, html }) => {
    const tokens = mainTextTokens(html);
    const editorialTokens = [model.editorialSummary, model.capacityDecision, model.deploymentCaution, model.whyThisPage, model.badgePitch, ...model.nextChecks].join(" ").match(/\S+/g) || [];
    assert.ok(tokens.length >= 550, `${model.slug} must contain at least 550 main-content words`);
    assert.ok(editorialTokens.length >= 150, `${model.slug} requires at least 150 words of reviewed model-specific analysis`);
    assert.match(html, new RegExp(`<link rel="canonical" href="${model.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.match(html, /data-beehiiv-form="cbe3aea9-de92-41ca-92c2-691e3be5f2a4"/);
    assert.match(html, new RegExp(`utm_source=model_${model.slug.replaceAll("-", "_")}`));
    return { model, tokens, grams: ngrams(tokens) };
  });

  let minimumPairwiseUniqueness = 1;
  for (let left = 0; left < pageSignals.length; left += 1) {
    for (let right = left + 1; right < pageSignals.length; right += 1) {
      const a = pageSignals[left].grams;
      const b = pageSignals[right].grams;
      const shared = [...a].filter((value) => b.has(value)).length;
      const uniqueness = 1 - shared / Math.min(a.size, b.size);
      minimumPairwiseUniqueness = Math.min(minimumPairwiseUniqueness, uniqueness);
      assert.ok(
        uniqueness >= 0.4,
        `${pageSignals[left].model.slug} and ${pageSignals[right].model.slug} are ${Math.round(uniqueness * 100)}% unique; reviewed pages must remain at least 40% unique`,
      );
    }
  }

  return {
    pageCount: pageSignals.length,
    minimumWords: Math.min(...pageSignals.map((page) => page.tokens.length)),
    minimumPairwiseUniqueness: round(minimumPairwiseUniqueness, 3),
  };
}

function relatedFor(model, models) {
  return models
    .filter((candidate) => candidate.modelId !== model.modelId)
    .sort((left, right) => Math.abs(Math.log(left.parameters / model.parameters)) - Math.abs(Math.log(right.parameters / model.parameters)))
    .slice(0, 3);
}

function renderSitemapEntries(data) {
  const date = data.generatedAt.slice(0, 10);
  const urls = [
    { url: `${siteOrigin}/models/`, priority: "0.9" },
    ...data.models.map((model) => ({ url: model.url, priority: "0.8" })),
  ];
  return urls.map((entry) => `  <url>
    <loc>${escapeHtml(entry.url)}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("\n");
}

function renderLlmsEntries(data) {
  return `### Reviewed repository hardware pages

- Model Hardware Pages: ${siteOrigin}/models/
  A quality-gated hub of repository-specific GPU and VRAM plans. New trending repositories are not published automatically.
${data.models.map((model) => `- ${model.name} GPU Requirements: ${model.url}\n  ${model.whyThisPage}`).join("\n")}`;
}

export async function generateModelHardwarePages({ fetchImpl = fetch, generatedAt = new Date().toISOString() } = {}) {
  const [registryJson, trendingJson, sitemap, llms] = await Promise.all([
    readFile(registryPath, "utf8"),
    readFile(trendingPath, "utf8"),
    readFile(sitemapPath, "utf8"),
    readFile(llmsPath, "utf8"),
  ]);
  const registry = JSON.parse(registryJson);
  const trendingData = JSON.parse(trendingJson);

  assert.equal(registry.version, 1, "review registry version must be one");
  assert.ok(Array.isArray(registry.pages), "review registry pages must be an array");
  assert.equal(new Set(registry.pages.map((page) => page.modelId)).size, registry.pages.length, "reviewed model ids must be unique");
  assert.equal(new Set(registry.pages.map((page) => page.slug)).size, registry.pages.length, "reviewed slugs must be unique");
  for (const page of registry.pages) {
    assert.match(page.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${page.modelId} requires a lowercase hyphenated slug`);
    assert.ok(page.slug.length < 80, `${page.modelId} slug should remain short`);
    for (const key of ["searchIntent", "editorialSummary", "capacityDecision", "deploymentCaution", "whyThisPage", "badgePitch"]) {
      assert.ok(typeof page[key] === "string" && page[key].trim(), `${page.modelId} requires ${key}`);
    }
    assert.ok(Array.isArray(page.nextChecks) && page.nextChecks.length === 3, `${page.modelId} requires exactly three reviewed next checks`);
    assert.ok(page.nextChecks.every((check) => typeof check === "string" && check.trim()), `${page.modelId} next checks must be non-empty strings`);
  }

  const metadata = await Promise.all(registry.pages.map((page) => fetchModelDetails(page.modelId, fetchImpl)));
  const models = registry.pages.map((page, index) => buildGuideModel({ ...page, reviewedAt: registry.reviewedAt }, metadata[index], trendingData, generatedAt));
  const data = {
    generatedAt,
    source: {
      name: "Hugging Face Hub public model API",
      urlTemplate: "https://huggingface.co/api/models/{repository}",
      fields: ["safetensors.total", "config.architectures", "config.model_type", "cardData.license", "cardData.language", "cardData.base_model", "downloads", "likes", "createdAt", "lastModified", "gated"],
    },
    method: {
      weightFormula: "parameters * bits / 8 / 1024^3",
      headroomPercent,
      usableVramPercent: usablePercent,
      gpuTiersGiB,
      publicationGate: registry.reviewPolicy,
      limitations: "Capacity math only. Excludes KV cache, activations, runtime workspace, fragmentation, offload, interconnect, speed, quality, safety, and license interpretation.",
    },
    models,
  };

  const renderedPages = models.map((model) => ({ model, html: renderModelPage(model, relatedFor(model, models)) }));
  const quality = assertProgrammaticQuality(renderedPages, registry);
  data.quality = quality;
  const hubHtml = renderModelsHub(data);
  const nextSitemap = replaceBlock(sitemap, "<!-- MODEL_HARDWARE_PAGES:START -->", "<!-- MODEL_HARDWARE_PAGES:END -->", renderSitemapEntries(data));
  const nextLlms = replaceBlock(llms, "<!-- MODEL_HARDWARE_PAGES:START -->", "<!-- MODEL_HARDWARE_PAGES:END -->", renderLlmsEntries(data));

  await mkdir(modelsRoot, { recursive: true });
  await mkdir(modelBadgesRoot, { recursive: true });
  await Promise.all(renderedPages.map(({ model }) => mkdir(path.join(modelsRoot, model.slug), { recursive: true })));
  await Promise.all([
    writeFile(outputDataPath, `${JSON.stringify(data, null, 2)}\n`, "utf8"),
    writeFile(path.join(modelsRoot, "index.html"), hubHtml, "utf8"),
    ...renderedPages.map(({ model, html }) => writeFile(path.join(modelsRoot, model.slug, "index.html"), html, "utf8")),
    ...models.map((model) => writeFile(path.join(modelBadgesRoot, `${model.slug}.svg`), buildModelHardwareBadgeSvg(model), "utf8")),
    writeFile(sitemapPath, nextSitemap, "utf8"),
    writeFile(llmsPath, nextLlms, "utf8"),
  ]);

  return data;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const data = await generateModelHardwarePages();
  console.log(`Generated ${data.models.length} reviewed model hardware pages; minimum pairwise uniqueness ${Math.round(data.quality.minimumPairwiseUniqueness * 100)}%.`);
}
