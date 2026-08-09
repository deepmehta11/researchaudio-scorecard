const parameters = new URLSearchParams(window.location.search);
const isEmbedded = parameters.get("embed") === "1";
const tool = window.location.pathname.split("/").filter(Boolean).at(-1) || "evidence_tool";
const onReady = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
    return;
  }
  callback();
};

if (isEmbedded) {
  document.documentElement.classList.add("embed-mode");

  const normalizeSource = (value) => {
    const source = String(value || "embedded_widget").toLowerCase();
    return /^[a-z0-9][a-z0-9_-]{0,79}$/.test(source) ? source : "embedded_widget";
  };

  const source = normalizeSource(parameters.get("utm_source"));

  onReady(() => {
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

    let lastReportedHeight = 0;
    const reportHeight = () => {
      const height = Math.ceil(Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.getBoundingClientRect().height,
      ));
      if (Math.abs(height - lastReportedHeight) < 2) return;
      lastReportedHeight = height;
      window.parent.postMessage({ type: "researchaudio:resize", tool, height }, "*");
    };

    requestAnimationFrame(reportHeight);
    window.addEventListener("load", reportHeight, { once: true });
    document.fonts?.ready.then(reportHeight).catch(() => {});
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(reportHeight);
      observer.observe(document.body);
    }
  });
} else {
  onReady(() => {
    const intro = document.querySelector(".instrument-shell .instrument-intro");
    if (!intro || document.querySelector(".tool-distribution")) return;

    const libraryUrl = new URL("/embeds/", window.location.origin);
    libraryUrl.searchParams.set("utm_source", tool);
    libraryUrl.searchParams.set("utm_medium", "internal");
    libraryUrl.searchParams.set("utm_campaign", "ai_evidence_lab");
    libraryUrl.searchParams.set("utm_content", "embed_this_tool");
    libraryUrl.hash = `embed-${tool}`;

    const distribution = document.createElement("aside");
    distribution.className = "tool-distribution";
    distribution.setAttribute("aria-label", "Embed this free tool on another website");
    distribution.innerHTML = `
      <div>
        <span>Publish this instrument</span>
        <p>Put this working tool inside an article, documentation page, course, or resource library. It is free to embed and visitor inputs stay in the browser.</p>
      </div>
      <a href="${libraryUrl.toString()}">Get this tool’s embed code →</a>
    `;
    intro.insertAdjacentElement("afterend", distribution);

    import("/conversion-loop.js")
      .then(({ installEvidenceCapture }) => installEvidenceCapture({ trigger: "interaction" }))
      .catch(() => {});
  });
}
