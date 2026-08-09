const DISMISS_KEY_PREFIX = "researchaudio_evidence_rail_dismissed";
const DEFAULT_OFFER = {
  signal: "Next evidence",
  title: "The next useful check should find you.",
  description: "Join free. One confirmed referral unlocks the AI Launch Evidence Checklist.",
  action: "Join free",
  href: "#subscribe",
  ariaLabel: "Join the ResearchAudio newsletter",
};

function storageKey() {
  const slug = window.location.pathname.split("/").filter(Boolean).at(-1) || "scorecard";
  return `${DISMISS_KEY_PREFIX}:${slug}`;
}

function wasDismissed() {
  try {
    return window.sessionStorage.getItem(storageKey()) === "1";
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    window.sessionStorage.setItem(storageKey(), "1");
  } catch {
    // The rail still dismisses when browser storage is unavailable.
  }
}

function applyOffer(rail, offer, isCustomOffer) {
  if (rail.dataset.offerPriority === "custom" && !isCustomOffer) return;

  rail.setAttribute("aria-label", offer.ariaLabel);
  rail.querySelector(".evidence-capture-signal b").textContent = offer.signal;
  rail.querySelector(".evidence-capture-copy strong").textContent = offer.title;
  rail.querySelector(".evidence-capture-copy span").textContent = offer.description;
  const action = rail.querySelector(".evidence-capture-action");
  action.textContent = offer.action;
  action.href = offer.href;
  rail.dataset.offerPriority = isCustomOffer ? "custom" : "default";
}

export function installEvidenceCapture({ trigger = "scroll", offer = DEFAULT_OFFER } = {}) {
  if (new URLSearchParams(window.location.search).get("embed") === "1") return;

  const subscribe = document.querySelector(".subscribe-block");
  if (!subscribe || wasDismissed()) return;
  const captureOffer = { ...DEFAULT_OFFER, ...offer };
  const isCustomOffer = offer !== DEFAULT_OFFER;
  const existingRail = document.querySelector(".evidence-capture-rail");
  if (existingRail) {
    applyOffer(existingRail, captureOffer, isCustomOffer);
    return;
  }

  const rail = document.createElement("aside");
  rail.className = "evidence-capture-rail";
  rail.innerHTML = `
    <div class="evidence-capture-signal" aria-hidden="true"><span></span><b></b></div>
    <div class="evidence-capture-copy">
      <strong></strong>
      <span></span>
    </div>
    <a class="evidence-capture-action"></a>
    <button class="evidence-capture-dismiss" type="button" aria-label="Dismiss signup prompt">×</button>
  `;
  applyOffer(rail, captureOffer, isCustomOffer);
  document.body.append(rail);

  let activated = false;
  let completed = false;
  const show = () => {
    activated = true;
    if (!completed) rail.classList.add("is-visible");
  };
  const hide = () => rail.classList.remove("is-visible");

  rail.querySelector(".evidence-capture-dismiss").addEventListener("click", () => {
    completed = true;
    rememberDismissal();
    hide();
  });

  rail.querySelector(".evidence-capture-action").addEventListener("click", () => {
    completed = true;
    hide();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          completed = true;
          hide();
        } else if (activated && !completed) {
          show();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(subscribe);
  }

  if (trigger === "interaction") {
    const instrument = document.querySelector(".instrument-shell") || document.querySelector("main");
    const activateAfterUse = (event) => {
      if (!event.target.closest("input, select, textarea, button")) return;
      if (event.target.closest(".evidence-capture-rail")) return;
      show();
      instrument.removeEventListener("input", activateAfterUse, true);
      instrument.removeEventListener("change", activateAfterUse, true);
      instrument.removeEventListener("click", activateAfterUse, true);
    };
    instrument.addEventListener("input", activateAfterUse, true);
    instrument.addEventListener("change", activateAfterUse, true);
    instrument.addEventListener("click", activateAfterUse, true);
    return;
  }

  const activateAfterDepth = () => {
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const progress = (window.scrollY + window.innerHeight) / documentHeight;
    if (progress < 0.38) return;
    show();
    window.removeEventListener("scroll", activateAfterDepth);
  };
  window.addEventListener("scroll", activateAfterDepth, { passive: true });
  activateAfterDepth();
}
