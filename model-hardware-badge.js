const BADGE_ORIGIN = "https://tools.researchaudio.io";
const CAMPAIGN = "ai_evidence_lab";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatFloor(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: value >= 100 ? 1 : 2 }).format(value);
}

function badgeLabel(model) {
  const name = String(model.name);
  return name.length > 34 ? `${name.slice(0, 31)}...` : name;
}

function int4Floor(model) {
  const int4 = model.precision?.find((item) => Number(item.bits) === 4);
  if (!int4 || !Number.isFinite(Number(int4.floorGiB))) throw new Error(`${model.slug || model.name} requires an INT4 floor for its badge`);
  return Number(int4.floorGiB);
}

export function buildModelHardwareBadgeDestination(model) {
  const destination = new URL(model.url);
  destination.searchParams.set("utm_source", "model_badge");
  destination.searchParams.set("utm_medium", "model_card");
  destination.searchParams.set("utm_campaign", CAMPAIGN);
  destination.searchParams.set("utm_content", model.slug);
  destination.hash = "hardware-plan";
  return destination.toString();
}

export function buildModelHardwareBadgeMarkdown(model) {
  const floor = formatFloor(int4Floor(model));
  const badgeUrl = `${BADGE_ORIGIN}/badges/models/${model.slug}.svg`;
  const alt = `${model.name} INT4 floor ${floor} GiB - ResearchAudio`;
  return `[![${alt}](${badgeUrl})](${buildModelHardwareBadgeDestination(model)})`;
}

export function buildModelHardwareBadgeSvg(model) {
  const floor = formatFloor(int4Floor(model));
  const accessibleTitle = `${model.name} source-backed INT4 planning floor: ${floor} GiB`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="52" viewBox="0 0 620 52" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(accessibleTitle)}</title>
  <desc id="desc">ResearchAudio hardware evidence badge. Parameter-derived weight memory plus twenty percent planning headroom; cache and runtime costs are excluded.</desc>
  <rect width="620" height="52" rx="6" fill="#102b2a"/>
  <rect x="414" width="206" height="52" rx="6" fill="#e6f049"/>
  <rect x="414" width="6" height="52" fill="#2c5dff"/>
  <text x="18" y="21" fill="#ffffff" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14" font-weight="700">${escapeXml(badgeLabel(model))}</text>
  <text x="18" y="39" fill="#a8bfbb" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10">SOURCE-BACKED HARDWARE PLAN · RESEARCHAUDIO</text>
  <text x="434" y="21" fill="#102b2a" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="700">INT4 + 20% FLOOR</text>
  <text x="434" y="41" fill="#102b2a" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="19" font-weight="700">${escapeXml(floor)} GiB</text>
</svg>
`;
}

async function copyBadge(container) {
  const output = container.querySelector("[data-model-badge-output]");
  const status = container.querySelector("[data-model-badge-status]");
  try {
    await navigator.clipboard.writeText(output.value);
    status.textContent = "Model-card badge copied.";
  } catch {
    status.textContent = "Copy was blocked. Select the Markdown and copy it manually.";
    output.focus();
    output.select();
  }
}

export function initializeModelHardwareBadges(root = document) {
  root.querySelectorAll("[data-model-badge]").forEach((container) => {
    const button = container.querySelector("[data-copy-model-badge]");
    if (!button) return;
    button.addEventListener("click", () => copyBadge(container));
  });
}

if (typeof document !== "undefined") initializeModelHardwareBadges();
