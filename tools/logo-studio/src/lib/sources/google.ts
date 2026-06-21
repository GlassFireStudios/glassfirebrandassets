// Optional "search the whole web" layer via Google Programmable Search (Custom
// Search JSON API). Requires GOOGLE_CSE_KEY + GOOGLE_CSE_ID. Free tier: 100
// queries/day. https://developers.google.com/custom-search/v1/overview

import type { LogoCandidate } from "../types";

interface CseItem {
  link?: string;
  title?: string;
  mime?: string;
  image?: { contextLink?: string };
}

export async function googleImageCandidates(query: string): Promise<LogoCandidate[]> {
  const key = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) return [];

  try {
    const params = new URLSearchParams({
      key,
      cx,
      q: `${query} logo transparent png`,
      searchType: "image",
      num: "8",
      imgType: "clipart",
      safe: "active",
    });
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: CseItem[] };
    return (data.items || [])
      .filter((i) => i.link)
      .map((i, idx) => {
        const fmt = (i.mime || "").split("/")[1] || (i.link!.endsWith(".svg") ? "svg" : "png");
        return {
          id: `g-${idx}-${i.link}`,
          source: "google" as const,
          name: i.title || query,
          imageUrl: i.link!,
          kind: "logo",
          format: fmt,
          // Web results are unknown — let the user remove the background.
          transparent: fmt === "png" || fmt === "svg",
        } satisfies LogoCandidate;
      });
  } catch {
    return [];
  }
}
