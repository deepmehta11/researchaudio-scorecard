const parameters = new URLSearchParams(window.location.search);
const isEmbedded = parameters.get("embed") === "1";

if (isEmbedded) {
  document.documentElement.classList.add("embed-mode");

  const normalizeSource = (value) => {
    const source = String(value || "embedded_widget").toLowerCase();
    return /^[a-z0-9][a-z0-9_-]{0,79}$/.test(source) ? source : "embedded_widget";
  };

  const source = normalizeSource(parameters.get("utm_source"));
  const tool = window.location.pathname.split("/").filter(Boolean).at(-1) || "evidence_tool";

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('a[href^="https://researchaudio.io/subscribe"]').forEach((link) => {
      const url = new URL(link.href);
      url.searchParams.set("utm_source", source);
      url.searchParams.set("utm_medium", "embedded_tool");
      url.searchParams.set("utm_campaign", "ai_evidence_lab");
      url.searchParams.set("utm_content", `${tool}_join`);
      link.href = url.toString();
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });

    const fullToolUrl = new URL(window.location.href);
    fullToolUrl.searchParams.delete("embed");
    fullToolUrl.searchParams.set("utm_source", source);
    fullToolUrl.searchParams.set("utm_medium", "embedded_tool");
    fullToolUrl.searchParams.set("utm_campaign", "ai_evidence_lab");
    fullToolUrl.searchParams.set("utm_content", `${tool}_open_full`);

    const attribution = document.createElement("div");
    attribution.className = "embed-attribution";
    attribution.innerHTML = `
      <a class="embed-brand" href="https://tools.researchaudio.io/tools/?utm_source=${encodeURIComponent(source)}&amp;utm_medium=embedded_tool&amp;utm_campaign=ai_evidence_lab&amp;utm_content=${encodeURIComponent(tool)}_brand" target="_blank" rel="noopener noreferrer">
        <span aria-hidden="true">RA</span>
        <strong>Free tool by ResearchAudio</strong>
      </a>
      <a class="embed-open" href="${fullToolUrl.toString()}" target="_blank" rel="noopener noreferrer">Open full tool ↗</a>
    `;
    document.body.prepend(attribution);
  });
}
