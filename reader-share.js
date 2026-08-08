import { buildAttributedShareUrl } from "./share-state.js";
import { installEvidenceCapture } from "./conversion-loop.js";

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
  const url = buildReaderShareUrl(canonical, slug);
  const title = document.title.split("|")[0].trim() || document.querySelector("h1")?.textContent.trim();
  const description = document.querySelector('meta[name="description"]')?.content.trim() || "A practical ResearchAudio evidence guide.";
  const text = `${title} — ${description}`;

  const section = document.createElement("section");
  section.className = "reader-share-loop";
  section.setAttribute("aria-labelledby", "reader-share-title");
  section.innerHTML = `
    <div>
      <p class="eyebrow">One useful link, one new reader</p>
      <h2 id="reader-share-title">Send this evidence to one teammate.</h2>
      <p>If this resolved a real question, share the exact guide. The attributed link lets ResearchAudio measure which evidence travels without exposing your inputs.</p>
    </div>
    <div class="reader-share-actions">
      <button type="button" class="reader-share-button">Share this guide</button>
      <a href="#subscribe">Get the next teardown free →</a>
      <p class="reader-share-status" aria-live="polite"></p>
    </div>
  `;

  const button = section.querySelector(".reader-share-button");
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
