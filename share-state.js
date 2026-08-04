const SAFE_PARAMETER = /^[a-z][a-zA-Z0-9_]{0,63}$/;

function shareValue(value) {
  const normalized = Array.isArray(value) ? value.join(",") : String(value ?? "").trim();
  return normalized && normalized.length <= 256 ? normalized : null;
}

export function buildAttributedShareUrl(
  href,
  state,
  { source, content, campaign = "ai_evidence_lab", hash = "" },
) {
  const url = new URL(href);
  url.search = "";
  url.hash = "";

  for (const [name, value] of Object.entries(state)) {
    const normalized = shareValue(value);
    if (SAFE_PARAMETER.test(name) && normalized !== null) url.searchParams.set(name, normalized);
  }

  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  url.searchParams.set("utm_content", content);
  if (hash) url.hash = hash;
  return url;
}

export function parseSharedNumbers(search, bounds) {
  const params = new URLSearchParams(search);
  const restored = {};

  for (const [name, range] of Object.entries(bounds)) {
    if (!params.has(name)) continue;
    const raw = params.get(name)?.trim();
    if (!raw) continue;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) continue;
    const minimum = Number.isFinite(range.min) ? range.min : -Infinity;
    const maximum = Number.isFinite(range.max) ? range.max : Infinity;
    restored[name] = String(Math.min(maximum, Math.max(minimum, parsed)));
  }

  return restored;
}

export function restoreSharedNumbers(fields, search) {
  const bounds = Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, {
    min: input.min === "" ? -Infinity : Number(input.min),
    max: input.max === "" ? Infinity : Number(input.max),
  }]));
  const restored = parseSharedNumbers(search, bounds);
  Object.entries(restored).forEach(([name, value]) => { fields[name].value = value; });
  return restored;
}

export function parseSharedChecklist(search, validNames, parameter = "checks") {
  const params = new URLSearchParams(search);
  if (!params.has(parameter)) return null;
  const valid = new Set(validNames);
  return [...new Set(
    (params.get(parameter) || "")
      .split(",")
      .map((name) => name.trim())
      .filter((name) => valid.has(name)),
  )];
}
