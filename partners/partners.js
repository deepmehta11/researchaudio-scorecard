const publicationId = "9aaf56f4-fea5-48a7-b644-86a05f7e366e";
const campaign = "ai_evidence_lab";
const partnerInput = document.querySelector("#partner-name");
const sourcePreview = document.querySelector("#partner-source-preview");
const magicLinkOutput = document.querySelector("#magic-link");
const universalLinkOutput = document.querySelector("#universal-link");
const universalPreview = document.querySelector("#universal-preview");

const toSourceSlug = (value) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "newsletter-name";
};

const buildLinks = (partnerName) => {
  const partnerSlug = toSourceSlug(partnerName);
  const source = `partner_${partnerSlug}`;
  const universalUrl = new URL("https://tools.researchaudio.io/ai-evidence-starter-kit/");
  universalUrl.searchParams.set("utm_source", source);
  universalUrl.searchParams.set("utm_medium", "partner_referral");
  universalUrl.searchParams.set("utm_campaign", campaign);
  universalUrl.searchParams.set("utm_content", "partner_kit");

  const redirectUrl = new URL("https://tools.researchaudio.io/evidence-starter-kit/");
  redirectUrl.searchParams.set("utm_source", "magic_link_success");
  redirectUrl.searchParams.set("utm_medium", "partner");
  redirectUrl.searchParams.set("utm_campaign", campaign);
  redirectUrl.searchParams.set("utm_content", partnerSlug);

  const magicLink = [
    `https://magic.beehiiv.com/v1/${publicationId}?email={{email}}`,
    `redirect_to=${encodeURIComponent(redirectUrl.toString())}`,
    `utm_source=${encodeURIComponent(source)}`,
    "utm_medium=magic_link",
    `utm_campaign=${campaign}`,
    "utm_content=partner_kit",
  ].join("&");

  return { magicLink, source, universalLink: universalUrl.toString() };
};

const updateLinks = () => {
  const links = buildLinks(partnerInput.value);
  sourcePreview.textContent = `Traffic source: ${links.source}`;
  magicLinkOutput.value = links.magicLink;
  universalLinkOutput.value = links.universalLink;
  universalPreview.href = links.universalLink;
};

const copyText = async (text, statusElement, successMessage) => {
  try {
    await navigator.clipboard.writeText(text);
    statusElement.textContent = successMessage;
  } catch {
    statusElement.textContent = "Copy was blocked. Select the text and copy it manually.";
  }
};

partnerInput.addEventListener("input", updateLinks);

document.querySelectorAll("[data-copy-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.copyTarget;
    const output = document.querySelector(`#${targetId}`);
    const status = document.querySelector(`[data-status-for="${targetId}"]`);
    copyText(output.value, status, "Link copied.");
  });
});

document.querySelectorAll("[data-copy-snippet]").forEach((button) => {
  button.addEventListener("click", () => {
    const snippetId = button.dataset.copySnippet;
    const body = document.querySelector(`[data-copy-body="${snippetId}"]`);
    const status = document.querySelector(`[data-status-for="${snippetId}"]`);
    const snippet = body.textContent.replace("{link}", universalLinkOutput.value);
    copyText(snippet, status, "Copy ready to paste.");
  });
});

updateLinks();
