import { buildAttributedShareUrl } from "./share-state.js";
import { installEvidenceCapture } from "./conversion-loop.js";

const GATED_VRAM_WORKSHEET_URL = "https://researchaudio.io/p/local-llm-vram-worksheet";
const GATED_AI_DECISION_MEMO_URL = "https://researchaudio.io/p/ai-launch-decision-memo";
const LOCAL_LLM_TOPIC = /\b(?:local\s+llm|vram|gpu\s+(?:memory|requirements?)|kv[\s-]?cache|unified\s+memory)\b/i;
const ATTRIBUTION_VALUE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

function normalizedSlug(pathname) {
  return pathname.split("/").filter(Boolean).at(-1) || "evidence_lab";
}

export function buildReaderShareUrl(href, slug = normalizedSlug(new URL(href).pathname)) {
  return buildAttributedShareUrl(
    href,
    {},
    {
      source: "reader_share",
      content: `${slug}_shared_guide`,
      hash: "",
    },
  );
}

export function buildCommunityShareUrl(href, slug = normalizedSlug(new URL(href).pathname)) {
  return buildAttributedShareUrl(
    href,
    {},
    {
      source: "community_share",
      medium: "community_referral",
      content: `${slug}_community_post`,
      hash: "",
    },
  );
}

export function buildCommunityShareText(title, description, url) {
  return `${title}\n\n${description}\n\nEvidence, assumptions, and working tools:\n${url}`;
}

export function isLocalLlmTopic(...values) {
  return LOCAL_LLM_TOPIC.test(values.filter(Boolean).join(" "));
}

function channelAttribution(search, fallback) {
  const params = new URLSearchParams(search);
  const source = params.get("utm_source")?.trim();
  const medium = params.get("utm_medium")?.trim();
  return {
    source: source && ATTRIBUTION_VALUE.test(source) ? source : fallback.source,
    medium: medium && ATTRIBUTION_VALUE.test(medium) ? medium : fallback.medium,
  };
}

export function buildGatedArticleUrl(slug, search = "") {
  const channel = channelAttribution(search, {
    source: slug,
    medium: "evidence_lab_referral",
  });
  return buildAttributedShareUrl(
    GATED_VRAM_WORKSHEET_URL,
    { utm_term: slug },
    {
      ...channel,
      campaign: "local_llm_vram_gate",
      content: "worksheet_unlock",
      hash: "",
    },
  );
}

export function buildDecisionMemoUrl(slug, search = "") {
  const channel = channelAttribution(search, {
    source: slug,
    medium: "evidence_lab_referral",
  });
  return buildAttributedShareUrl(
    GATED_AI_DECISION_MEMO_URL,
    { utm_term: slug },
    {
      ...channel,
      campaign: "ai_launch_decision_memo_gate",
      content: "decision_memo_unlock",
      hash: "",
    },
  );
}

export function buildSubscribeUrl(href, slug, search = "") {
  const destination = new URL(href);
  const channel = channelAttribution(search, {
    source: destination.searchParams.get("utm_source") || slug,
    medium: destination.searchParams.get("utm_medium") || "evidence_lab_referral",
  });
  return buildAttributedShareUrl(
    destination,
    { utm_term: slug },
    {
      ...channel,
      campaign: destination.searchParams.get("utm_campaign") || "ai_evidence_lab",
      content: destination.searchParams.get("utm_content") || "direct_join",
      hash: destination.hash,
    },
  );
}

function copyText(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  document.execCommand("copy");
  field.remove();
  return Promise.resolve();
}

function installReaderShareLoop() {
  if (new URLSearchParams(window.location.search).get("embed") === "1") return;

  const subscribe = document.querySelector(".subscribe-block");
  if (!subscribe || document.querySelector(".reader-share-loop")) return;

  const canonical = document.querySelector('link[rel="canonical"]')?.href || window.location.href;
  const slug = normalizedSlug(window.location.pathname);
  const search = window.location.search;
  const url = buildReaderShareUrl(canonical, slug);
  const communityUrl = buildCommunityShareUrl(canonical, slug);
  const title = document.title.split("|")[0].trim() || document.querySelector("h1")?.textContent.trim();
  const description = document.querySelector('meta[name="description"]')?.content.trim() || "A practical ResearchAudio evidence guide.";
  const text = `${title} — ${description}`;
  const communityText = buildCommunityShareText(title, description, communityUrl);
  const leadMagnet = isLocalLlmTopic(slug, title, description)
    ? {
        href: buildGatedArticleUrl(slug, search),
        label: "Unlock the free VRAM worksheet →",
        note: "Read the two-sentence preview, then use your email to unlock the formulas, 8–32 GB table, and buying checklist.",
      }
    : {
        href: buildDecisionMemoUrl(slug, search),
        label: "Unlock the free AI decision memo →",
        note: "Read the two-sentence preview, then use your email to unlock the six-line Adopt, Pilot, Watch, or Pass template.",
      };

  document.querySelectorAll('a[href^="https://researchaudio.io/subscribe"]').forEach((link) => {
    link.href = buildSubscribeUrl(link.href, slug, search);
  });
  document.querySelectorAll(".result-gated-link").forEach((link) => {
    link.href = leadMagnet.href;
  });

  const section = document.createElement("section");
  section.className = "reader-share-loop";
  section.setAttribute("aria-labelledby", "reader-share-title");
  section.innerHTML = `
    <div>
      <p class="eyebrow">One useful link, one new reader</p>
      <h2 id="reader-share-title">Send this evidence to one teammate.</h2>
      <p>If this resolved a real question, share the exact guide. The attributed link lets ResearchAudio measure which evidence travels without exposing your inputs.</p>
      <p><strong>Subscriber reward:</strong> one confirmed signup through your personal referral link in a ResearchAudio email unlocks the AI Launch Evidence Checklist automatically.</p>
    </div>
    <div class="reader-share-actions">
      <a class="reader-gated-article-link" href="${leadMagnet.href}">${leadMagnet.label}</a>
      <p class="reader-gated-article-note">${leadMagnet.note}</p>
      <button type="button" class="reader-share-button">Share this guide</button>
      <button type="button" class="reader-community-button">Copy community post</button>
      <a href="#subscribe">Get the next teardown free →</a>
      <p class="reader-share-note">For a relevant Reddit, Hacker News, Slack, or forum thread. Add your own context; do not spam.</p>
      <p class="reader-share-status" aria-live="polite"></p>
    </div>
  `;

  const button = section.querySelector(".reader-share-button");
  const communityButton = section.querySelector(".reader-community-button");
  const status = section.querySelector(".reader-share-status");
  button.addEventListener("click", async () => {
    status.textContent = "";
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: url.toString() });
        status.textContent = "Share sheet opened.";
        return;
      }

      await copyText(`${text} ${url}`);
      status.textContent = "Attributed link copied.";
    } catch (error) {
      if (error?.name !== "AbortError") status.textContent = `Copy this link: ${url}`;
    }
  });

  communityButton.addEventListener("click", async () => {
    status.textContent = "";
    try {
      await copyText(communityText);
      status.textContent = "Community post copied. Add your own context before sharing.";
    } catch {
      status.textContent = `Copy this link: ${communityUrl}`;
    }
  });

  subscribe.insertAdjacentElement("beforebegin", section);
  installEvidenceCapture({ trigger: "scroll" });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installReaderShareLoop, { once: true });
  } else {
    installReaderShareLoop();
  }
}
