import { buildAttributedShareUrl } from "./share-state.js";

const BADGE_ORIGIN = "https://tools.researchaudio.io";

export function buildEvidenceBadgeMarkdown(href, selectedChecks) {
  const checks = [...new Set(selectedChecks)];
  const score = Math.min(7, checks.length);
  const destination = buildAttributedShareUrl(
    href,
    { checks },
    {
      source: "evidence_badge",
      medium: "project_readme",
      content: `score_${score}`,
      hash: "scorecard",
    },
  );
  const badgeUrl = `${BADGE_ORIGIN}/badges/evidence-${score}.svg`;

  return `[![ResearchAudio evidence ${score}/7](${badgeUrl})](${destination})`;
}
