// Renders testimonial web embeds. Same CSS powers the in-app preview, the static
// copy-paste snippet, and the public embed.js loader (kept in sync by hand).

import type { TestimonialItem } from "./types";

export interface TestimonialOptions {
  layout: "wall" | "carousel" | "card" | "spotlight";
  columns: number; // wall columns
  accent: string; // stars / quote-mark color
  background: string; // outer background (gradient ok)
  cardBg: string; // card background
  textColor: string; // quote text color
  mutedColor: string; // name/role color
  showRating: boolean;
  showLogo: boolean;
  heading: string; // spotlight heading
  showPlay: boolean; // spotlight video-style play badge
}

// A dark brand gradient that echoes the GlassFire site's testimonial section.
export const SPOTLIGHT_BG = "linear-gradient(125deg, #0b2b2b 0%, #06201f 55%, #0a1414 100%)";

export const DEFAULT_TESTIMONIAL_OPTIONS: TestimonialOptions = {
  layout: "wall",
  columns: 3,
  accent: "#EE2750",
  background: "transparent",
  cardBg: "#111114",
  textColor: "#f4f4f5",
  mutedColor: "#a1a1aa",
  showRating: true,
  showLogo: true,
  heading: "About Our Work",
  showPlay: false,
};

function esc(s: string): string {
  return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stars(rating: number, accent: string): string {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  let out = "";
  for (let i = 0; i < 5; i++) out += `<span${i < n ? ` style="color:${accent}"` : ""}>★</span>`;
  return `<div class="gft-stars" aria-label="${n} out of 5 stars">${out}</div>`;
}

function card(t: TestimonialItem, o: TestimonialOptions): string {
  const rating = o.showRating && t.rating ? stars(t.rating, o.accent) : "";
  const avatar = t.headshotUrl ? `<img class="gft-avatar" src="${esc(t.headshotUrl)}" alt="${esc(t.name)}" loading="lazy" decoding="async" />` : "";
  const logo = o.showLogo && t.logoUrl ? `<img class="gft-logo" src="${esc(t.logoUrl)}" alt="${esc(t.company)} logo" loading="lazy" decoding="async" />` : "";
  const roleLine = [t.role, t.company].filter(Boolean).join(", ");
  return `    <figure class="gft-card">
      ${rating}
      <blockquote class="gft-quote">${esc(t.quote)}</blockquote>
      <figcaption class="gft-cap">
        ${avatar}
        <div class="gft-id"><span class="gft-name">${esc(t.name)}</span><span class="gft-role">${esc(roleLine)}</span></div>
        ${logo}
      </figcaption>
    </figure>`;
}

function spotlightRow(t: TestimonialItem, o: TestimonialOptions): string {
  const media = t.headshotUrl
    ? `<div class="gft-spot__media" style="background-image:url(&quot;${esc(t.headshotUrl)}&quot;)">${o.showPlay ? '<span class="gft-spot__play">▶</span>' : ""}<span class="gft-spot__co">${esc(t.company)}</span></div>`
    : `<div class="gft-spot__media gft-spot__media--blank" style="background:${o.background || SPOTLIGHT_BG}"><span class="gft-spot__co">${esc(t.company)}</span></div>`;
  const roleLine = [t.role, t.company].filter(Boolean).join(", ");
  const avatar = t.headshotUrl ? `<img src="${esc(t.headshotUrl)}" alt="${esc(t.name)}" loading="lazy" decoding="async" />` : "";
  const rating = o.showRating && t.rating ? `<div class="gft-stars" style="font-size:18px">${"★".repeat(t.rating)}</div>` : "";
  return `  <div class="gft-spot__row">
    ${media}
    <figure class="gft-spot__card">
      <div class="gft-spot__mark" style="color:${o.accent}">&ldquo;</div>
      <figcaption class="gft-spot__person">
        ${avatar}
        <div><div class="gft-spot__name">${esc(t.name)}</div><div class="gft-spot__role">${esc(roleLine)}</div></div>
      </figcaption>
      ${rating}
      <blockquote class="gft-spot__quote">${esc(t.quote)}</blockquote>
    </figure>
  </div>`;
}

const CSS = (o: TestimonialOptions) => `
.gft{--gft-accent:${o.accent};--gft-card:${o.cardBg};--gft-text:${o.textColor};--gft-muted:${o.mutedColor};box-sizing:border-box;width:100%;background:${o.background};padding:24px}
.gft *{box-sizing:border-box}
.gft-wall{display:grid;gap:20px;grid-template-columns:repeat(var(--gft-cols,3),1fr)}
.gft-carousel{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:8px}
.gft-carousel .gft-card{flex:0 0 min(360px,80%);scroll-snap-align:start}
.gft-single{max-width:680px;margin:0 auto}
.gft-card{display:flex;flex-direction:column;gap:14px;background:var(--gft-card);border-radius:16px;padding:24px}
.gft-stars{font-size:15px;letter-spacing:2px;color:#3f3f46}
.gft-quote{margin:0;font-size:17px;line-height:1.55;color:var(--gft-text);font-weight:450}
.gft-quote::before{content:"\\201C"}.gft-quote::after{content:"\\201D"}
.gft-cap{display:flex;align-items:center;gap:12px;margin-top:auto}
.gft-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover;flex:0 0 auto}
.gft-id{display:flex;flex-direction:column;min-width:0}
.gft-name{font-weight:600;color:var(--gft-text);font-size:14px}
.gft-role{color:var(--gft-muted);font-size:13px}
.gft-logo{height:24px;width:auto;margin-left:auto;object-fit:contain;opacity:.9;flex:0 0 auto}
/* Spotlight — matches the GlassFire site testimonial section */
.gft-spot{padding:clamp(20px,4vw,44px)}
.gft-spot__h{margin:0 0 28px;text-align:center;font-size:clamp(28px,5vw,54px);font-weight:800;letter-spacing:-.01em;text-transform:uppercase;color:#fff;line-height:1.05}
.gft-spot__row{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:24px;align-items:stretch}
.gft-spot__row + .gft-spot__row{margin-top:24px}
.gft-spot__media{position:relative;border-radius:16px;overflow:hidden;min-height:340px;background-size:cover;background-position:center}
.gft-spot__media::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.7),rgba(0,0,0,0) 55%)}
.gft-spot__co{position:absolute;left:22px;bottom:18px;z-index:1;color:#fff;font-weight:800;font-size:clamp(18px,2.4vw,26px);text-shadow:0 2px 10px rgba(0,0,0,.55)}
.gft-spot__play{position:absolute;left:18px;top:18px;z-index:1;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;backdrop-filter:blur(4px)}
.gft-spot__card{background:#fff;border-radius:18px;padding:clamp(22px,3vw,38px);display:flex;flex-direction:column;gap:18px;justify-content:center}
.gft-spot__mark{font-family:Georgia,serif;font-weight:700;font-size:72px;line-height:.6;height:34px}
.gft-spot__person{display:flex;align-items:center;gap:14px}
.gft-spot__person img{width:60px;height:60px;border-radius:8px;object-fit:cover}
.gft-spot__name{font-weight:700;color:#111;font-size:18px}
.gft-spot__role{color:#6b7280;font-size:15px}
.gft-spot__quote{margin:0;color:#1f2937;font-size:clamp(16px,1.6vw,19px);line-height:1.6;font-weight:500}
.gft-spot__quote::before{content:"\\201C"}.gft-spot__quote::after{content:"\\201D"}
@media(max-width:760px){.gft-wall{grid-template-columns:1fr}.gft-spot__row{grid-template-columns:1fr}.gft-spot__media{min-height:240px}}
`;

export function testimonialMarkup(items: TestimonialItem[], o: TestimonialOptions): string {
  if (o.layout === "spotlight") {
    const rows = items.map((t) => spotlightRow(t, o)).join("\n");
    const heading = o.heading ? `  <h2 class="gft-spot__h">${esc(o.heading)}</h2>\n` : "";
    const bg = o.background && o.background !== "transparent" ? o.background : SPOTLIGHT_BG;
    return `<!-- GlassFire testimonials -->
<div class="gft gft-spot" style="background:${bg}" aria-label="Client testimonials">
${heading}${rows}
</div>
<style>${CSS({ ...o, background: bg })}</style>`;
  }
  const cards = items.map((t) => card(t, o)).join("\n");
  const layoutClass = o.layout === "carousel" ? "gft-carousel" : o.layout === "card" ? "gft-single" : "gft-wall";
  const inner = o.layout === "card" ? `<div class="gft-single">${cards}</div>` : `<div class="${layoutClass}" style="--gft-cols:${o.columns}">\n${cards}\n  </div>`;
  return `<!-- GlassFire testimonials -->
<div class="gft" aria-label="Client testimonials">
  ${inner}
</div>
<style>${CSS(o)}</style>`;
}
