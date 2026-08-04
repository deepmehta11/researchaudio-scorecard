const DEFAULTS = {
  fallbackFiles: ["TEAM_GUIDE.md", "CLAUDE.md"],
  maxBytes: 65536,
};

const FILENAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export function normalizeFallbackFiles(values) {
  const seen = new Set();
  const candidates = Array.isArray(values) ? values : [values];

  return candidates
    .flatMap((value) => String(value ?? "").split(/[\n,]+/))
    .map((value) => value.trim())
    .filter((value) => value && value !== "." && value !== ".." && FILENAME_PATTERN.test(value))
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function normalizeMaxBytes(value) {
  const parsed = Math.round(Number(value) || 32768);
  return Math.min(1048576, Math.max(1024, parsed));
}

export function buildCodexConfig({ fallbackFiles, maxBytes }) {
  const files = normalizeFallbackFiles(fallbackFiles);
  const byteLimit = normalizeMaxBytes(maxBytes);
  const fileList = files.map((file) => JSON.stringify(file)).join(", ");

  return `project_doc_fallback_filenames = [${fileList}]\nproject_doc_max_bytes = ${byteLimit}`;
}

function formatBytes(value) {
  const kibibytes = normalizeMaxBytes(value) / 1024;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(kibibytes)} KiB`;
}

if (typeof document !== "undefined") {
  const form = document.querySelector("#codex-config-form");
  const checkboxes = [...form.querySelectorAll('input[name="fallbackFile"]')];
  const customFiles = document.querySelector("#custom-fallback-files");
  const maxBytes = document.querySelector("#project-doc-max-bytes");
  const output = document.querySelector("#config-output");
  const fallbackCount = document.querySelector("#fallback-count");
  const byteLimit = document.querySelector("#byte-limit");
  const status = document.querySelector("#config-status");
  const note = document.querySelector("#config-note");
  const copyStatus = document.querySelector("#copy-status");
  const copyButton = document.querySelector("#copy-config");
  const shareButton = document.querySelector("#share-config");
  const resetButton = document.querySelector("#reset-config");

  function selectedFiles() {
    return normalizeFallbackFiles([
      ...checkboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value),
      customFiles.value,
    ]);
  }

  function render() {
    const files = selectedFiles();
    const bytes = normalizeMaxBytes(maxBytes.value);
    output.textContent = buildCodexConfig({ fallbackFiles: files, maxBytes: bytes });
    fallbackCount.textContent = String(files.length);
    byteLimit.textContent = formatBytes(bytes);
    status.textContent = files.length ? "READY" : "VALID";
    note.textContent = files.length
      ? `Codex checks AGENTS.md before ${files.length === 1 ? "this fallback name" : "these ordered fallback names"}.`
      : "An empty fallback list is valid; Codex will use its standard AGENTS.md discovery order.";
    copyStatus.textContent = "";
  }

  function applyUrlState() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("files")) {
      const sharedFiles = normalizeFallbackFiles(params.get("files"));
      checkboxes.forEach((checkbox) => {
        checkbox.checked = sharedFiles.some((file) => file.toLowerCase() === checkbox.value.toLowerCase());
      });
      const common = new Set(checkboxes.map((checkbox) => checkbox.value.toLowerCase()));
      customFiles.value = sharedFiles.filter((file) => !common.has(file.toLowerCase())).join(", ");
    }
    if (["32768", "65536", "131072", "262144"].includes(params.get("bytes"))) {
      maxBytes.value = params.get("bytes");
    }
  }

  async function copyText(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      copyStatus.textContent = successMessage;
      return true;
    } catch {
      copyStatus.textContent = "Copy was blocked. Select the generated snippet and copy it manually.";
      return false;
    }
  }

  copyButton.addEventListener("click", () => {
    copyText(output.textContent, "Copied. Paste it into config.toml and start a new Codex session.");
  });

  shareButton.addEventListener("click", async () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("files", selectedFiles().join(","));
    url.searchParams.set("bytes", String(normalizeMaxBytes(maxBytes.value)));
    url.searchParams.set("utm_source", "codex_config_share");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", "ai_evidence_lab");
    url.searchParams.set("utm_content", "shared_setup");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Codex CLI config.toml generator",
          text: "Generate project_doc_fallback_filenames and project_doc_max_bytes settings for Codex CLI.",
          url: url.toString(),
        });
        copyStatus.textContent = "Setup shared.";
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    await copyText(url.toString(), "Share link copied.");
  });

  resetButton.addEventListener("click", () => {
    checkboxes.forEach((checkbox) => {
      checkbox.checked = DEFAULTS.fallbackFiles.includes(checkbox.value);
    });
    customFiles.value = "";
    maxBytes.value = String(DEFAULTS.maxBytes);
    render();
  });

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  applyUrlState();
  render();
}
