// Clearbit Logo API: domain -> logo, no API key required.
// https://logo.clearbit.com/<domain>

import type { LogoCandidate } from "../types";

/** Guess a domain from a free-text query like "Coca Cola" -> "cocacola.com".
 *  Only used as a low-confidence fallback; explicit domains are preferred. */
function guessDomain(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/.test(q)) return q; // already a domain
  const compact = q.replace(/[^a-z0-9]/g, "");
  if (!compact) return null;
  return `${compact}.com`;
}

export function clearbitCandidates(query: string, domains: string[] = []): LogoCandidate[] {
  const set = new Set<string>(domains.filter(Boolean));
  const guessed = guessDomain(query);
  if (guessed) set.add(guessed);

  return [...set].map((domain) => ({
    id: `cb-${domain}`,
    source: "clearbit" as const,
    name: query,
    domain,
    imageUrl: `https://logo.clearbit.com/${domain}?size=512&format=png`,
    kind: "logo",
    format: "png",
    transparent: true,
  }));
}
