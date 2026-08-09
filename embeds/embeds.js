const publisherInput = document.querySelector("#publisher-name");
const sourcePreview = document.querySelector("#source-preview");
const cards = [...document.querySelectorAll("[data-widget-url]")];

function sourceSlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);
  return slug || "partner-site";
}

function widgetSource() {
  return `embed_${sourceSlug(publisherInput.value)}`;
}

function resizeFrame(event) {
  if (event.origin !== "https://tools.researchaudio.io") return;
  const data = event.data || {};
  if (data.type !== "researchaudio:resize" || !data.tool) return;
  const frame = document.getElementById(`researchaudio-${data.tool}`);
  if (!frame) return;
  const fallback = Number(frame.getAttribute("height")) || 640;
  frame.style.height = `${Math.max(640, Math.min(4800, Number(data.height) || fallback))}px`;
}

window.addEventListener("message", resizeFrame);

function buildEmbedCode(card) {
  const url = new URL(card.dataset.widgetUrl);
  const tool = url.pathname.split("/").filter(Boolean).at(-1);
  url.searchParams.set("embed", "1");
  url.searchParams.set("utm_source", widgetSource());
  url.searchParams.set("utm_medium", "embedded_tool");
  url.searchParams.set("utm_campaign", "ai_evidence_lab");
  url.searchParams.set("utm_content", tool);

  const frame = `<iframe id="researchaudio-${tool}" src="${url.toString()}" title="${card.dataset.widgetName}" loading="lazy" width="100%" height="${card.dataset.widgetHeight}" style="width:100%;max-width:980px;border:1px solid #a8bfbb;border-radius:0" allow="clipboard-write"></iframe>`;
  const resize = `<script>window.addEventListener("message",function(event){if(event.origin !== "https://tools.researchaudio.io")return;var data=event.data||{};if(data.type!=="researchaudio:resize"||data.tool!=="${tool}")return;var frame=document.getElementById("researchaudio-${tool}");if(!frame)return;var fallback=Number(frame.getAttribute("height"))||${card.dataset.widgetHeight};frame.style.height=Math.max(640,Math.min(4800,Number(data.height)||fallback))+"px";});</script>`;
  return `${frame}\n${resize}`;
}

function render() {
  sourcePreview.textContent = `Traffic source: ${widgetSource()}`;
  cards.forEach((card) => {
    card.querySelector("[data-embed-code]").textContent = buildEmbedCode(card);
    card.querySelector("[data-copy-status]").textContent = "";
  });
}

publisherInput.addEventListener("input", render);

cards.forEach((card) => {
  card.querySelector("[data-copy-embed]").addEventListener("click", async () => {
    const status = card.querySelector("[data-copy-status]");
    const code = buildEmbedCode(card);
    try {
      await navigator.clipboard.writeText(code);
      status.textContent = `${card.dataset.widgetName} embed code copied.`;
    } catch {
      status.textContent = "Select and copy the iframe code shown below.";
    }
  });
});

render();
