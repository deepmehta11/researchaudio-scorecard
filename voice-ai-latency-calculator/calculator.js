import { buildAttributedShareUrl, restoreSharedNumbers } from "../share-state.js";

const DEFAULTS = {
  endpointMs: 280,
  transcriptionMs: 220,
  contextMs: 120,
  fastModelMs: 180,
  slowModelMs: 650,
  ttsMs: 160,
  playoutMs: 60,
};

function nonNegative(value) {
  return Math.max(0, Number(value) || 0);
}

export function calculateVoiceLatency(values) {
  const endpointMs = nonNegative(values.endpointMs);
  const transcriptionMs = nonNegative(values.transcriptionMs);
  const contextMs = nonNegative(values.contextMs);
  const fastModelMs = nonNegative(values.fastModelMs);
  const slowModelMs = nonNegative(values.slowModelMs);
  const ttsMs = nonNegative(values.ttsMs);
  const playoutMs = nonNegative(values.playoutMs);

  const transcriptReadyMs = endpointMs + transcriptionMs;
  const slowBranchMs = contextMs + slowModelMs;
  const firstBranchMs = Math.min(fastModelMs, slowBranchMs);
  const firstBranch = fastModelMs <= slowBranchMs ? "fast" : "slow";
  const parallelFirstAudioMs = transcriptReadyMs + firstBranchMs + ttsMs + playoutMs;
  const sequentialFirstAudioMs = transcriptReadyMs + slowBranchMs + ttsMs + playoutMs;
  const deepReasoningReadyMs = transcriptReadyMs + slowBranchMs;
  const firstTextReadyMs = transcriptReadyMs + firstBranchMs;
  const handoffGapMs = Math.max(0, deepReasoningReadyMs - firstTextReadyMs);
  const parallelSavingsMs = Math.max(0, sequentialFirstAudioMs - parallelFirstAudioMs);
  const preModelShare = parallelFirstAudioMs > 0 ? transcriptReadyMs / parallelFirstAudioMs : 0;

  return {
    endpointMs,
    transcriptionMs,
    contextMs,
    fastModelMs,
    slowModelMs,
    ttsMs,
    playoutMs,
    transcriptReadyMs,
    slowBranchMs,
    firstBranchMs,
    firstBranch,
    firstTextReadyMs,
    parallelFirstAudioMs,
    sequentialFirstAudioMs,
    deepReasoningReadyMs,
    handoffGapMs,
    parallelSavingsMs,
    preModelShare,
  };
}

export function classifyVoiceLatency(milliseconds) {
  if (milliseconds <= 600) {
    return {
      status: "FAST",
      title: "Fast-turn territory",
      note: "The first audible response lands inside a tight planning band. Validate it with production traces and interruption tests.",
    };
  }
  if (milliseconds <= 1000) {
    return {
      status: "CONVERSATIONAL",
      title: "Conversational planning band",
      note: "The pipeline can feel responsive if turn detection is stable and the first spoken words are useful.",
    };
  }
  if (milliseconds <= 1500) {
    return {
      status: "NOTICEABLE",
      title: "The pause will be noticeable",
      note: "Remove latency before the model, shorten the first branch, or begin speech with a safe partial response.",
    };
  }
  return {
    status: "SLOW",
    title: "The interaction will feel delayed",
    note: "Treat this as an architecture problem. Profile end-of-turn detection, transcription, model startup, TTS, and playout separately.",
  };
}

function milliseconds(value) {
  return `${Math.round(value).toLocaleString("en-US")} ms`;
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

const form = typeof document === "undefined" ? null : document.querySelector("#latency-form");

if (form) {
  const fields = Object.fromEntries(
    [...form.elements].filter((element) => element.name).map((element) => [element.name, element]),
  );
  const output = {
    hero: document.querySelector("#hero-latency"),
    firstAudio: document.querySelector("#first-audio"),
    sequential: document.querySelector("#sequential-audio"),
    savings: document.querySelector("#parallel-savings"),
    deepReady: document.querySelector("#deep-ready"),
    branch: document.querySelector("#first-branch"),
    handoff: document.querySelector("#handoff-gap"),
    preModelShare: document.querySelector("#pre-model-share"),
    status: document.querySelector("#latency-status"),
    title: document.querySelector("#latency-title"),
    note: document.querySelector("#latency-note"),
    tapeSummary: document.querySelector("#tape-summary"),
    shareStatus: document.querySelector("#share-status"),
  };

  function readInputs() {
    return Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value]));
  }

  function updateTape(selector, stages) {
    const tape = document.querySelector(selector);
    for (const [name, value] of Object.entries(stages)) {
      const segment = tape.querySelector(`[data-stage="${name}"]`);
      segment.style.setProperty("--stage-ms", Math.max(24, value));
      segment.querySelector("b").textContent = milliseconds(value);
    }
  }

  const sharedValues = restoreSharedNumbers(fields, window.location.search);

  function update() {
    const result = calculateVoiceLatency(readInputs());
    const classification = classifyVoiceLatency(result.parallelFirstAudioMs);

    output.hero.textContent = Math.round(result.parallelFirstAudioMs).toLocaleString("en-US");
    output.firstAudio.textContent = milliseconds(result.parallelFirstAudioMs);
    output.sequential.textContent = milliseconds(result.sequentialFirstAudioMs);
    output.savings.textContent = milliseconds(result.parallelSavingsMs);
    output.deepReady.textContent = milliseconds(result.deepReasoningReadyMs);
    output.branch.textContent = result.firstBranch === "fast" ? "Fast model" : "Slow branch";
    output.handoff.textContent = milliseconds(result.handoffGapMs);
    output.preModelShare.textContent = percent(result.preModelShare);
    output.status.textContent = classification.status;
    output.title.textContent = classification.title;
    output.note.textContent = classification.note;
    output.tapeSummary.textContent = `Parallel first audio: ${milliseconds(result.parallelFirstAudioMs)}. Sequential slow-model path: ${milliseconds(result.sequentialFirstAudioMs)}. Parallel architecture saves ${milliseconds(result.parallelSavingsMs)} in this estimate.`;
    output.shareStatus.textContent = "";

    updateTape("#parallel-tape", {
      endpoint: result.endpointMs,
      transcript: result.transcriptionMs,
      branch: result.firstBranchMs,
      tts: result.ttsMs,
      playout: result.playoutMs,
    });
    updateTape("#sequential-tape", {
      endpoint: result.endpointMs,
      transcript: result.transcriptionMs,
      context: result.contextMs,
      slow: result.slowModelMs,
      tts: result.ttsMs,
      playout: result.playoutMs,
    });
  }

  form.addEventListener("input", update);
  document.querySelector("#reset-latency").addEventListener("click", () => {
    Object.entries(DEFAULTS).forEach(([name, value]) => { fields[name].value = value; });
    update();
    fields.endpointMs.focus();
  });

  document.querySelector("#share-latency").addEventListener("click", async () => {
    const result = calculateVoiceLatency(readInputs());
    const url = buildAttributedShareUrl(
      window.location.href,
      readInputs(),
      { source: "voice_latency_share", content: "shared_latency_budget" },
    );
    const text = `This voice AI pipeline reaches first audio in ${milliseconds(result.parallelFirstAudioMs)} and saves ${milliseconds(result.parallelSavingsMs)} versus the sequential slow-model path. Inspect the budget:`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Voice AI Latency Budget", text, url: url.toString() });
        output.shareStatus.textContent = "Share sheet opened.";
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        output.shareStatus.textContent = "Latency budget copied.";
      }
    } catch (error) {
      if (error?.name !== "AbortError") output.shareStatus.textContent = "Copy the page URL to share this latency budget.";
    }
  });

  update();
  if (Object.keys(sharedValues).length > 0) {
    output.shareStatus.textContent = "Shared latency budget loaded. Change any stage to compare architectures.";
  }
}
