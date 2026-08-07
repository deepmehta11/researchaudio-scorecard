const DEFAULTS = {
  prompt: "Review this repository and return the highest-risk issue.",
  sandbox: "read-only",
  json: true,
  ephemeral: true,
  skipGitRepoCheck: false,
  ignoreUserConfig: false,
  outputSchema: "",
  lastMessageFile: "",
};

const SANDBOX_MODES = new Set(["read-only", "workspace-write", "danger-full-access"]);

export function shellQuote(value) {
  const normalized = String(value ?? "").replaceAll("\0", "").trim();
  return `'${normalized.replaceAll("'", `'\\''`)}'`;
}

function cleanPath(value) {
  return String(value ?? "").replaceAll("\0", "").trim().slice(0, 500);
}

export function buildCodexExecCommand(values = {}) {
  const prompt = String(values.prompt ?? "").trim() || DEFAULTS.prompt;
  const sandbox = SANDBOX_MODES.has(values.sandbox) ? values.sandbox : DEFAULTS.sandbox;
  const outputSchema = cleanPath(values.outputSchema);
  const lastMessageFile = cleanPath(values.lastMessageFile);
  const tokens = ["codex", "exec"];

  if (values.json !== false) tokens.push("--json");
  if (values.ephemeral !== false) tokens.push("--ephemeral");
  tokens.push("--color", "never", "--sandbox", sandbox);
  if (values.skipGitRepoCheck === true) tokens.push("--skip-git-repo-check");
  if (values.ignoreUserConfig === true) tokens.push("--ignore-user-config");
  if (outputSchema) tokens.push("--output-schema", shellQuote(outputSchema));
  if (lastMessageFile) tokens.push("--output-last-message", shellQuote(lastMessageFile));
  tokens.push(shellQuote(prompt));

  return tokens.join(" ");
}

if (typeof document !== "undefined") {
  const form = document.querySelector("#codex-exec-form");
  const fields = Object.fromEntries([...form.elements].filter((element) => element.name).map((element) => [element.name, element]));
  const commandOutput = document.querySelector("#command-output");
  const commandStatus = document.querySelector("#command-status");
  const commandNote = document.querySelector("#command-note");
  const outputMode = document.querySelector("#output-mode");
  const gitGuard = document.querySelector("#git-guard");
  const sessionMode = document.querySelector("#session-mode");
  const sandboxSummary = document.querySelector("#sandbox-summary");
  const copyStatus = document.querySelector("#command-copy-status");

  function readValues() {
    return {
      prompt: fields.prompt.value,
      sandbox: fields.sandbox.value,
      json: fields.json.checked,
      ephemeral: fields.ephemeral.checked,
      skipGitRepoCheck: fields.skipGitRepoCheck.checked,
      ignoreUserConfig: fields.ignoreUserConfig.checked,
      outputSchema: fields.outputSchema.value,
      lastMessageFile: fields.lastMessageFile.value,
    };
  }

  function render() {
    const values = readValues();
    commandOutput.textContent = buildCodexExecCommand(values);
    outputMode.textContent = values.json ? "JSONL" : "Text";
    gitGuard.textContent = values.skipGitRepoCheck ? "Skipped" : "Required";
    sessionMode.textContent = values.ephemeral ? "Not saved" : "Saved";
    sandboxSummary.textContent = values.sandbox;
    commandStatus.textContent = values.sandbox === "danger-full-access" ? "HIGH AUTHORITY" : values.skipGitRepoCheck ? "CHECK TARGET" : "BOUNDED";
    commandNote.textContent = values.skipGitRepoCheck
      ? "Git validation is disabled. Confirm the working directory before running this command."
      : "Run this from the repository you intend Codex to inspect.";
    copyStatus.textContent = "";
  }

  function applyUrlState() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("prompt")) fields.prompt.value = params.get("prompt").slice(0, 1000);
    if (SANDBOX_MODES.has(params.get("sandbox"))) fields.sandbox.value = params.get("sandbox");
    for (const name of ["json", "ephemeral", "skipGitRepoCheck", "ignoreUserConfig"]) {
      if (params.has(name)) fields[name].checked = params.get(name) === "1";
    }
    if (params.has("schema")) fields.outputSchema.value = params.get("schema").slice(0, 500);
    if (params.has("last")) fields.lastMessageFile.value = params.get("last").slice(0, 500);
  }

  async function copyText(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      copyStatus.textContent = successMessage;
      return true;
    } catch {
      copyStatus.textContent = "Copy was blocked. Select the generated command and copy it manually.";
      return false;
    }
  }

  document.querySelector("#copy-command").addEventListener("click", () => {
    copyText(commandOutput.textContent, "Command copied. Verify the working directory before running it.");
  });

  document.querySelector("#share-command").addEventListener("click", async () => {
    const values = readValues();
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("prompt", values.prompt);
    url.searchParams.set("sandbox", values.sandbox);
    url.searchParams.set("json", values.json ? "1" : "0");
    url.searchParams.set("ephemeral", values.ephemeral ? "1" : "0");
    url.searchParams.set("skipGitRepoCheck", values.skipGitRepoCheck ? "1" : "0");
    url.searchParams.set("ignoreUserConfig", values.ignoreUserConfig ? "1" : "0");
    if (values.outputSchema) url.searchParams.set("schema", values.outputSchema);
    if (values.lastMessageFile) url.searchParams.set("last", values.lastMessageFile);
    url.searchParams.set("utm_source", "codex_exec_builder_share");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", "ai_evidence_lab");
    url.searchParams.set("utm_content", "shared_command");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Codex exec command builder",
          text: "Build a Codex exec command for JSONL automation, sandboxing, and structured output.",
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

  document.querySelector("#reset-command").addEventListener("click", () => {
    fields.prompt.value = DEFAULTS.prompt;
    fields.sandbox.value = DEFAULTS.sandbox;
    fields.json.checked = DEFAULTS.json;
    fields.ephemeral.checked = DEFAULTS.ephemeral;
    fields.skipGitRepoCheck.checked = DEFAULTS.skipGitRepoCheck;
    fields.ignoreUserConfig.checked = DEFAULTS.ignoreUserConfig;
    fields.outputSchema.value = DEFAULTS.outputSchema;
    fields.lastMessageFile.value = DEFAULTS.lastMessageFile;
    render();
  });

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  applyUrlState();
  render();
}
