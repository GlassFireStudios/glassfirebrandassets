// Generates a self-contained, embeddable logo carousel (auto-scrolling marquee).
// The same markup powers the in-app live preview (with proxied image URLs) and
// the copy-paste embed snippet (with public raw URLs).

export interface CarouselLogo {
  url: string;
  alt: string;
}

export interface CarouselOptions {
  height: number; // logo height in px
  gap: number; // spacing between logos in px
  duration: number; // seconds for one full loop
  direction: "left" | "right";
  grayscale: boolean; // grayscale, color on hover
  pauseOnHover: boolean;
  background: string; // CSS color or "transparent"
  edgeFade: boolean; // fade the left/right edges
  padding: number; // vertical padding in px
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Build a raw.githubusercontent.com URL for a repo file path. */
export function rawUrl(repo: string, branch: string, path: string): string {
  const enc = path.split("/").map(encodeURIComponent).join("/");
  return `https://raw.githubusercontent.com/${repo}/${branch}/${enc}`;
}

export function carouselMarkup(logos: CarouselLogo[], opts: CarouselOptions): string {
  // Each logo is duplicated so the -50% translate loops seamlessly. Spacing uses
  // margin-right (not flex gap) so the two copies line up exactly.
  const imgs = [...logos, ...logos]
    .map((l, i) => `    <img src="${escapeAttr(l.url)}" alt="${escapeAttr(l.alt)}"${i >= logos.length ? ' aria-hidden="true"' : ""} />`)
    .join("\n");

  const wrapperStyle = [
    `--gf-h:${opts.height}px`,
    `--gf-gap:${opts.gap}px`,
    `--gf-dur:${opts.duration}s`,
    `--gf-pad:${opts.padding}px`,
    `background:${opts.background}`,
  ].join(";");

  return `<!-- GlassFire client logo carousel -->
<div class="gf-logos" style="${wrapperStyle}" data-gray="${opts.grayscale}" data-fade="${opts.edgeFade}" data-dir="${opts.direction}" data-pause="${opts.pauseOnHover}" aria-label="Trusted by">
  <div class="gf-logos__track">
${imgs}
  </div>
</div>
<style>
.gf-logos{overflow:hidden;width:100%;padding:var(--gf-pad) 0;box-sizing:border-box}
.gf-logos[data-fade="true"]{-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.gf-logos__track{display:flex;align-items:center;width:max-content;animation:gf-marquee var(--gf-dur) linear infinite}
.gf-logos[data-dir="right"] .gf-logos__track{animation-direction:reverse}
.gf-logos[data-pause="true"]:hover .gf-logos__track{animation-play-state:paused}
.gf-logos img{height:var(--gf-h);width:auto;flex:0 0 auto;margin-right:var(--gf-gap);object-fit:contain;display:block}
.gf-logos[data-gray="true"] img{filter:grayscale(1);opacity:.7;transition:filter .3s,opacity .3s}
.gf-logos[data-gray="true"] img:hover{filter:none;opacity:1}
@media (prefers-reduced-motion:reduce){.gf-logos__track{animation:none}}
@keyframes gf-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
</style>`;
}
