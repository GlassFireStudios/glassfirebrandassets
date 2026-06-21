// Renders testimonial web embeds. Same CSS powers the in-app preview, the static
// copy-paste snippet, and the public embed.js loader (kept in sync by hand).

import type { TestimonialItem } from "./types";

export interface TestimonialOptions {
  layout: "wall" | "carousel" | "card";
  columns: number; // wall columns
  accent: string; // stars / quote-mark color
  background: string; // outer background
  cardBg: string; // card background
  textColor: string; // quote text color
  mutedColor: string; // name/role color
  showRating: boolean;
  showLogo: boolean;
}

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
@media(max-width:720px){.gft-wall{grid-template-columns:1fr}}
`;

export function testimonialMarkup(items: TestimonialItem[], o: TestimonialOptions): string {
  const cards = items.map((t) => card(t, o)).join("\n");
  const layoutClass = o.layout === "carousel" ? "gft-carousel" : o.layout === "card" ? "gft-single" : "gft-wall";
  const inner = o.layout === "card" ? `<div class="gft-single">${cards}</div>` : `<div class="${layoutClass}" style="--gft-cols:${o.columns}">\n${cards}\n  </div>`;
  return `<!-- GlassFire testimonials -->
<div class="gft" aria-label="Client testimonials">
  ${inner}
</div>
<style>${CSS(o)}</style>`;
}
