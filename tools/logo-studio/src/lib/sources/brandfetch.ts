// Brandfetch: the best logo-specific source. Search returns multiple brand
// matches; each brand exposes color/light/dark and logo/symbol/icon variants.
// Docs: https://docs.brandfetch.com/

import type { LogoCandidate } from "../types";

const SEARCH_URL = "https://api.brandfetch.io/v2/search";
const BRAND_URL = "https://api.brandfetch.io/v2/brands";

interface SearchHit {
  brandId?: string;
  name?: string;
  domain?: string;
  icon?: string;
}

interface BrandFormat {
  src?: string;
  format?: string;
  background?: string | null;
  width?: number | null;
  height?: number | null;
}

interface BrandLogo {
  type?: string; // logo | symbol | icon | other
  theme?: string; // light | dark
  formats?: BrandFormat[];
}

export async function brandfetchSearch(query: string): Promise<LogoCandidate[]> {
  const clientId = process.env.BRANDFETCH_CLIENT_ID;
  const apiKey = process.env.BRANDFETCH_API_KEY;
  if (!clientId && !apiKey) return [];

  const candidates: LogoCandidate[] = [];
  let hits: SearchHit[] = [];
  try {
    const url = `${SEARCH_URL}/${encodeURIComponent(query)}${clientId ? `?c=${clientId}` : ""}`;
    const res = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      cache: "no-store",
    });
    if (res.ok) hits = (await res.json()) as SearchHit[];
  } catch {
    // ignore — fall through with whatever we have
  }

  // Use each search hit's icon as a quick candidate.
  for (const h of hits.slice(0, 6)) {
    if (h.icon && h.domain) {
      candidates.push({
        id: `bf-icon-${h.domain}`,
        source: "brandfetch",
        name: h.name || h.domain,
        domain: h.domain,
        imageUrl: h.icon,
        kind: "icon",
        format: h.icon.endsWith(".svg") ? "svg" : "png",
        transparent: true,
      });
    }
  }

  // For the best matches, pull full brand detail to enumerate logo variants.
  if (apiKey) {
    const top = hits.filter((h) => h.domain).slice(0, 4);
    const details = await Promise.all(
      top.map(async (h) => {
        try {
          const res = await fetch(`${BRAND_URL}/${h.domain}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
            cache: "no-store",
          });
          if (!res.ok) return null;
          return { hit: h, data: (await res.json()) as { logos?: BrandLogo[] } };
        } catch {
          return null;
        }
      }),
    );

    for (const d of details) {
      if (!d) continue;
      const { hit, data } = d;
      for (const logo of data.logos || []) {
        for (const fmt of logo.formats || []) {
          if (!fmt.src) continue;
          if (fmt.format === "ico") continue;
          candidates.push({
            id: `bf-${hit.domain}-${logo.type}-${logo.theme}-${fmt.format}`,
            source: "brandfetch",
            name: hit.name || hit.domain || query,
            domain: hit.domain,
            imageUrl: fmt.src,
            kind: logo.type,
            theme: logo.theme,
            format: fmt.format,
            transparent: fmt.format !== "jpeg" && fmt.format !== "jpg" && !fmt.background,
          });
        }
      }
    }
  }

  return dedupe(candidates);
}

function dedupe(list: LogoCandidate[]): LogoCandidate[] {
  const seen = new Set<string>();
  return list.filter((c) => {
    if (seen.has(c.imageUrl)) return false;
    seen.add(c.imageUrl);
    return true;
  });
}
