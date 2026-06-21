// Generates embeddable logo carousels & grids. The same CSS powers the in-app
// live preview, the static (frozen) copy-paste snippet, and the public embed.js
// loader used for live/auto-updating embeds.

export type HoverStyle = "none" | "grayscale" | "white" | "black";

export interface EmbedLogo {
  url: string; // resting-variant image URL (or repo path for live configs)
  colorUrl?: string; // color image URL, used when a hover style reveals color
  alt: string;
  scale?: number; // per-logo size multiplier (optical balancing)
  sideTrim?: number; // px trimmed off each side to tighten spacing (carousel)
}

/** Inline per-logo style: optical scale (keeps row height) + side trim. */
function logoStyle(l: EmbedLogo, withTrim: boolean): string {
  const parts: string[] = [];
  if (l.scale && l.scale !== 1) parts.push(`height:calc(var(--gf-h) * ${l.scale})`);
  if (withTrim && l.sideTrim) parts.push(`margin-left:-${l.sideTrim}px;margin-right:calc(var(--gf-gap) - ${l.sideTrim}px)`);
  return parts.length ? ` style="${parts.join(";")}"` : "";
}

export interface CarouselOptions {
  height: number;
  gap: number;
  duration: number;
  direction: "left" | "right";
  hoverStyle: HoverStyle;
  pauseOnHover: boolean;
  background: string;
  edgeFade: boolean;
  padding: number;
  rows: number; // 1–3 scrolling rows
  mirrorRows: boolean; // alternate each row's direction
  rowGap: number; // vertical gap between rows (px)
}

export interface GridEmbedOptions {
  columns: number;
  gap: number;
  padding: number;
  cellHeight: number;
  background: string;
  hoverStyle: HoverStyle;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function rawUrl(repo: string, branch: string, path: string): string {
  const enc = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${repo}/${branch}/${enc}`;
}

/** Optional custom image CDN base (e.g. a Bunny pull zone on your own domain,
 *  https://cdn.glassfire.co). When set, it serves repo-relative image paths
 *  directly; otherwise we fall back to the free jsDelivr CDN. */
export const CDN_BASE = (process.env.NEXT_PUBLIC_CDN_BASE || "").replace(/\/$/, "");

/** Production image URL. Uses the configured custom CDN (Bunny) when present,
 *  else jsDelivr — never raw.githubusercontent, which isn't a CDN. */
export function cdnUrl(repo: string, branch: string, path: string): string {
  const enc = path.split("/").map(encodeURIComponent).join("/");
  if (CDN_BASE) return `${CDN_BASE}/${enc}`;
  return `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${enc}`;
}

// Shared hover-effect CSS (matches embed.js).
const HOVER_CSS =
  ".gf-fx img{transition:filter .35s ease,opacity .35s ease}" +
  ".gf-fx[data-hover=grayscale] img{filter:grayscale(1);opacity:.7}" +
  ".gf-fx[data-hover=white] img{filter:brightness(0) invert(1)}" +
  ".gf-fx[data-hover=black] img{filter:brightness(0)}" +
  ".gf-fx[data-hover=grayscale] img:hover,.gf-fx[data-hover=white] img:hover,.gf-fx[data-hover=black] img:hover{filter:none;opacity:1}";

function src(l: EmbedLogo, hover: HoverStyle): string {
  return hover !== "none" && l.colorUrl ? l.colorUrl : l.url;
}

export function carouselMarkup(logos: EmbedLogo[], o: CarouselOptions): string {
  const rows = Math.max(1, Math.min(3, o.rows || 1));
  const rowsHtml: string[] = [];
  for (let r = 0; r < rows; r++) {
    const rowLogos = logos.filter((_, i) => i % rows === r);
    const imgs = [...rowLogos, ...rowLogos]
      .map((l, i) => `      <img src="${escapeAttr(src(l, o.hoverStyle))}" alt="${escapeAttr(l.alt)}"${i >= rowLogos.length ? ' aria-hidden="true"' : ""}${logoStyle(l, true)} />`)
      .join("\n");
    const dir = o.mirrorRows && r % 2 === 1 ? (o.direction === "left" ? "right" : "left") : o.direction;
    rowsHtml.push(`  <div class="gf-logos__row" data-dir="${dir}">\n    <div class="gf-logos__track">\n${imgs}\n    </div>\n  </div>`);
  }

  const wrapperStyle = `--gf-h:${o.height}px;--gf-gap:${o.gap}px;--gf-dur:${o.duration}s;--gf-pad:${o.padding}px;--gf-rowgap:${o.rowGap ?? 24}px;background:${o.background}`;

  return `<!-- GlassFire client logo carousel -->
<div class="gf-logos gf-fx" style="${wrapperStyle}" data-fade="${o.edgeFade}" data-pause="${o.pauseOnHover}" data-hover="${o.hoverStyle}" aria-label="Trusted by">
${rowsHtml.join("\n")}
</div>
<style>
.gf-logos{overflow:hidden;width:100%;padding:var(--gf-pad) 0;box-sizing:border-box}
.gf-logos[data-fade="true"]{-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.gf-logos__row + .gf-logos__row{margin-top:var(--gf-rowgap)}
.gf-logos__track{display:flex;align-items:center;width:max-content;animation:gf-marquee var(--gf-dur) linear infinite}
.gf-logos__row[data-dir="right"] .gf-logos__track{animation-direction:reverse}
.gf-logos[data-pause="true"]:hover .gf-logos__track{animation-play-state:paused}
.gf-logos img{height:var(--gf-h);width:auto;flex:0 0 auto;margin-right:var(--gf-gap);object-fit:contain;display:block}
@media (prefers-reduced-motion:reduce){.gf-logos__track{animation:none}}
@keyframes gf-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
${HOVER_CSS}
</style>`;
}

export function gridMarkup(logos: EmbedLogo[], o: GridEmbedOptions): string {
  const cells = logos
    .map((l) => `    <div class="gf-grid__cell"><img src="${escapeAttr(src(l, o.hoverStyle))}" alt="${escapeAttr(l.alt)}"${logoStyle(l, false)} /></div>`)
    .join("\n");
  const wrapperStyle = `--gf-cols:${o.columns};--gf-gap:${o.gap}px;--gf-pad:${o.padding}px;--gf-h:${o.cellHeight}px;background:${o.background}`;
  return `<!-- GlassFire client logo grid -->
<div class="gf-grid gf-fx" style="${wrapperStyle}" data-hover="${o.hoverStyle}" aria-label="Trusted by">
${cells}
</div>
<style>
.gf-grid{display:grid;gap:var(--gf-gap);padding:var(--gf-pad);box-sizing:border-box;grid-template-columns:repeat(var(--gf-cols),1fr)}
.gf-grid__cell{display:flex;align-items:center;justify-content:center}
.gf-grid img{height:var(--gf-h);max-width:100%;width:auto;object-fit:contain;display:block}
${HOVER_CSS}
</style>`;
}

/** Builds the full, self-contained static HTML for a saved embed config,
 *  with images served from the jsDelivr CDN. Paste-and-replace on a page. */
export function staticMarkupFromConfig(
  cfg: { type: "carousel" | "grid"; logos: { url: string; colorUrl?: string; alt: string; scale?: number; sideTrim?: number }[]; options: Record<string, unknown> },
  repo: string,
  branch: string,
): string {
  const logos: EmbedLogo[] = cfg.logos.map((l) => ({
    url: cdnUrl(repo, branch, l.url),
    colorUrl: l.colorUrl ? cdnUrl(repo, branch, l.colorUrl) : undefined,
    alt: l.alt,
    scale: l.scale,
    sideTrim: l.sideTrim,
  }));
  const o = cfg.options;
  if (cfg.type === "grid") {
    return gridMarkup(logos, {
      columns: Number(o.columns) || 5,
      gap: Number(o.gap) || 40,
      padding: Number(o.padding) || 32,
      cellHeight: Number(o.cellHeight) || 56,
      background: String(o.background ?? "transparent"),
      hoverStyle: (o.hoverStyle as HoverStyle) || "none",
    });
  }
  return carouselMarkup(logos, {
    height: Number(o.height) || 44,
    gap: Number(o.gap) || 72,
    duration: Number(o.duration) || 40,
    direction: (o.direction as "left" | "right") || "left",
    hoverStyle: (o.hoverStyle as HoverStyle) || "none",
    pauseOnHover: o.pauseOnHover !== false,
    background: String(o.background ?? "transparent"),
    edgeFade: o.edgeFade !== false,
    padding: Number(o.padding) || 24,
    rows: Number(o.rows) || 1,
    mirrorRows: o.mirrorRows !== false,
    rowGap: Number(o.rowGap) || 24,
  });
}

/** The live (auto-updating) embed snippet that references a saved config. */
export function liveEmbedCode(slug: string, repo: string, branch = "main"): string {
  return `<div class="gf-embed" data-embed="${slug}"></div>
<script src="https://cdn.jsdelivr.net/gh/${repo}@${branch}/embed.js" defer></script>`;
}
