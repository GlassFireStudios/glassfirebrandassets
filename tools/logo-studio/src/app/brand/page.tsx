"use client";

import { useState } from "react";
import PageHeading from "@/components/PageHeading";

// ── Tokens (GlassFire design system — colors_and_type.css) ──────────────────
const PRIMARY = [
  { name: "Fire", hex: "#EE2750", text: "#fff", use: "Primary brand — CTAs, highlights, energy." },
  { name: "Glass", hex: "#00A8E4", text: "#fff", use: "Secondary brand — links, cool contrast." },
  { name: "Black", hex: "#000000", text: "#fff", use: "Deck + hero backgrounds." },
  { name: "Paper", hex: "#F5F5F2", text: "#111", use: "Warm off-white light surface." },
];
const GRADIENTS = [
  { name: "Fire", css: "linear-gradient(180deg, #EF404E 0%, #EE3157 50%, #E50981 100%)", use: "Hero fire treatments." },
  { name: "Glass", css: "linear-gradient(180deg, #00A8E4 0%, #178ACD 55%, #3C5BA9 100%)", use: "Cool hero treatments." },
  { name: "Spark", css: "linear-gradient(110deg, #00A8E4 0%, #3C5BA9 35%, #E50981 65%, #EE2750 100%)", use: "The signature — full glass→fire sweep." },
];
const NEUTRALS = [
  { name: "Black", hex: "#000000" }, { name: "Ink", hex: "#0A0A0C" }, { name: "Graphite", hex: "#1A1A1F" },
  { name: "Iron", hex: "#2A2A30" }, { name: "Steel", hex: "#6E6E76" }, { name: "Fog", hex: "#B8B8BE" },
  { name: "Mist", hex: "#E6E6E8" }, { name: "Paper", hex: "#F5F5F2" }, { name: "Snow", hex: "#FFFFFF" },
];
const SEMANTIC = [
  { name: "Success", hex: "#2FBF71" }, { name: "Warning", hex: "#F2B33D" },
  { name: "Danger", hex: "#EE2750" }, { name: "Info", hex: "#00A8E4" },
];
const SHADOWS = [
  { name: "Shadow SM", css: "0 1px 2px rgba(0,0,0,0.30)" },
  { name: "Shadow MD", css: "0 8px 24px rgba(0,0,0,0.32)" },
  { name: "Shadow LG", css: "0 20px 60px rgba(0,0,0,0.45)" },
  { name: "Fire Glow", css: "0 0 0 1px rgba(238,39,80,0.4), 0 12px 40px rgba(238,39,80,0.35)" },
  { name: "Glass Glow", css: "0 0 0 1px rgba(0,168,228,0.35), 0 12px 40px rgba(0,168,228,0.30)" },
];
const RADII = [
  { name: "XS", v: "2px" }, { name: "SM", v: "4px" }, { name: "MD", v: "8px" },
  { name: "LG", v: "14px" }, { name: "XL", v: "22px" }, { name: "Pill", v: "999px" },
];

// ── Logos ───────────────────────────────────────────────────────────────────
type Bg = "dark" | "light" | "checker";
interface Asset { name: string; preview: string; bg: Bg; usage: string; files: { label: string; path: string }[] }
interface Group { title: string; blurb: string; items: Asset[] }

const G = "Logos/Official Gradient Logo";
const W = "Logos/Variant White";
const B = "Logos/Variant Black";
const C2 = "Logos/Variant 2 Color";
const FAV = "Logos/Favicon";

const GROUPS: Group[] = [
  {
    title: "Primary — Full Color",
    blurb: "The default GlassFire mark. Use wherever there's enough contrast — ideal on white, light, or muted dark surfaces. Prefer SVG; PNG for quick placement.",
    items: [
      { name: "Primary Logo", preview: `${G}/GlassFire Logo Color.png`, bg: "dark", usage: "The main wordmark with built-in clear space.", files: [{ label: "SVG", path: `${G}/GlassFire Logo Color.svg` }, { label: "PNG", path: `${G}/GlassFire Logo Color.png` }] },
      { name: "No Padding", preview: `${G}/GlassFire Logo Color NoPadding.png`, bg: "dark", usage: "No built-in clear space — when you set spacing yourself.", files: [{ label: "SVG", path: `${G}/GlassFire Logo Color NoPadding.svg` }, { label: "PNG", path: `${G}/GlassFire Logo Color NoPadding.png` }] },
      { name: "Icon / Symbol", preview: `${G}/GlassFire Icon Color.png`, bg: "dark", usage: "Mark only — avatars, app tiles, tight spaces.", files: [{ label: "SVG", path: `${G}/GlassFire Icon Color.svg` }, { label: "PNG", path: `${G}/GlassFire Icon Color.png` }] },
      { name: "Lockups (JPG)", preview: `${G}/GlassFire Logo Color on White.jpg`, bg: "light", usage: "Pre-composed on solid black/white where transparency isn't supported.", files: [{ label: "Logo / Black", path: `${G}/GlassFire Logo Color on Black.jpg` }, { label: "Logo / White", path: `${G}/GlassFire Logo Color on White.jpg` }, { label: "Icon / Black", path: `${G}/GlassFire Icon Color on Black.jpg` }, { label: "Icon / White", path: `${G}/GlassFire Icon Color on White.jpg` }] },
    ],
  },
  {
    title: "White (Reversed)",
    blurb: "For dark, photographic, or brand-color backgrounds where the full-color mark wouldn't read.",
    items: [
      { name: "Logo — White", preview: `${W}/GlassFire Logo White.png`, bg: "dark", usage: "Use on dark/busy backgrounds and the smoke background.", files: [{ label: "SVG", path: `${W}/GlassFire Logo White.svg` }, { label: "PNG", path: `${W}/GlassFire Logo White.png` }] },
      { name: "Icon — White", preview: `${W}/GlassFire Icon White.png`, bg: "dark", usage: "White mark only for tight, dark placements.", files: [{ label: "SVG", path: `${W}/GlassFire Icon White.svg` }, { label: "PNG", path: `${W}/GlassFire Icon White.png` }] },
    ],
  },
  {
    title: "Black (Mono)",
    blurb: "For light backgrounds and single-color / print reproduction.",
    items: [
      { name: "Logo — Black", preview: `${B}/GlassFire Logo Black.png`, bg: "light", usage: "White/light backgrounds, mono print.", files: [{ label: "SVG", path: `${B}/GlassFire Logo Black.svg` }, { label: "PNG", path: `${B}/GlassFire Logo Black.png` }] },
      { name: "Icon — Black", preview: `${B}/GlassFire Icon Black.png`, bg: "light", usage: "Black mark only for tight, light placements.", files: [{ label: "SVG", path: `${B}/GlassFire Icon Black.svg` }, { label: "PNG", path: `${B}/GlassFire Icon Black.png` }] },
    ],
  },
  {
    title: "Alternate (Variant 2) & Utility",
    blurb: "A secondary color treatment plus favicon / web-clip marks. Keep the primary as default.",
    items: [
      { name: "Logo — 2 Color", preview: `${C2}/GlassFire Logo 2 Color.png`, bg: "checker", usage: "Alternate color wordmark.", files: [{ label: "PNG", path: `${C2}/GlassFire Logo 2 Color.png` }] },
      { name: "Icon — 2 Color", preview: `${C2}/GlassFire Icon 2 Color.png`, bg: "checker", usage: "Alternate color icon.", files: [{ label: "PNG", path: `${C2}/GlassFire Icon 2 Color.png` }] },
      { name: "Favicon", preview: `${FAV}/Favicon Logo.png`, bg: "dark", usage: "Browser tab icon.", files: [{ label: "SVG", path: `${FAV}/Favicon Logo.svg` }, { label: "PNG", path: `${FAV}/Favicon Logo.png` }] },
      { name: "Web Clip", preview: `${FAV}/Webclip Logo.png`, bg: "dark", usage: "Mobile home-screen icon.", files: [{ label: "SVG", path: `${FAV}/Webclip Logo.svg` }, { label: "PNG", path: `${FAV}/Webclip Logo.png` }] },
    ],
  },
];

const BACKGROUNDS: Asset[] = [
  { name: "Smoke Background", preview: "Backgrounds/Official Brand Background/16x9 4k Bkgd.jpg", bg: "dark", usage: "The official brand background. Base layer for slides, sections, and the white logo.", files: [{ label: "16:9 · 4K", path: "Backgrounds/Official Brand Background/16x9 4k Bkgd.jpg" }] },
  { name: "Logo + Background", preview: "Backgrounds/Official Brand Logo + Background/16x9 4k.jpg", bg: "dark", usage: "Ready-made branded canvases — slide cards, Zoom backgrounds, banners.", files: [{ label: "16:9 · HD", path: "Backgrounds/Official Brand Logo + Background/16x9 HD.jpg" }, { label: "16:9 · 4K", path: "Backgrounds/Official Brand Logo + Background/16x9 4k.jpg" }, { label: "32:9 · 8K", path: "Backgrounds/Official Brand Logo + Background/32x9 8K.jpg" }] },
];

const asset = (p: string) => `/api/asset?path=${encodeURIComponent(p)}`;

async function download(path: string) {
  const res = await fetch(asset(path));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = path.split("/").pop() || "asset"; a.click();
  URL.revokeObjectURL(url);
}

export default function BrandPage() {
  const [copied, setCopied] = useState("");
  const copy = (v: string) => { navigator.clipboard.writeText(v); setCopied(v); setTimeout(() => setCopied(""), 1200); };

  return (
    <div className="space-y-14">
      <PageHeading eyebrow="Design System" title="Brand Guide" sub="GlassFire's design system — colors, gradients, type, logos, and backgrounds with usage guidance. Everything's downloadable; prefer SVG for crisp scaling." />

      {/* COLORS */}
      <section className="space-y-6">
        <SectionTitle n="01" title="Color" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRIMARY.map((c) => (
            <button key={c.name} onClick={() => copy(c.hex)} className="gf-card gf-card-hover overflow-hidden text-left">
              <div className="flex h-24 items-end p-3" style={{ background: c.hex, color: c.text }}>
                <span className="text-xs font-semibold uppercase tracking-wider">{copied === c.hex ? "Copied!" : c.hex}</span>
              </div>
              <div className="space-y-1 p-3">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-steel">{c.use}</p>
              </div>
            </button>
          ))}
        </div>

        <div>
          <p className="gf-eyebrow mb-2">Gradients</p>
          <div className="grid gap-3 md:grid-cols-3">
            {GRADIENTS.map((g) => (
              <button key={g.name} onClick={() => copy(g.css)} className="gf-card gf-card-hover overflow-hidden text-left">
                <div className="h-24" style={{ background: g.css }} />
                <div className="space-y-1 p-3">
                  <div className="flex items-center justify-between"><p className="font-semibold">{g.name}</p><span className="text-[11px] text-steel">{copied === g.css ? "Copied!" : "Copy CSS"}</span></div>
                  <p className="text-xs text-steel">{g.use}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="gf-eyebrow mb-2">Neutral Scale</p>
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            {NEUTRALS.map((n) => (
              <button key={n.name} onClick={() => copy(n.hex)} title={`${n.name} ${n.hex}`} className="group relative h-16 flex-1" style={{ background: n.hex }}>
                <span className="absolute inset-x-0 bottom-1 text-center text-[9px] font-semibold uppercase tracking-wide opacity-0 transition group-hover:opacity-100" style={{ color: ["#000000", "#0A0A0C", "#1A1A1F", "#2A2A30"].includes(n.hex) ? "#fff" : "#000" }}>{copied === n.hex ? "✓" : n.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="gf-eyebrow mb-2">Semantic</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SEMANTIC.map((s) => (
              <button key={s.name} onClick={() => copy(s.hex)} className="gf-card gf-card-hover flex items-center gap-3 p-3 text-left">
                <span className="h-8 w-8 rounded" style={{ background: s.hex }} />
                <div><p className="text-sm font-semibold">{s.name}</p><code className="text-[11px] text-steel">{copied === s.hex ? "Copied!" : s.hex}</code></div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TYPOGRAPHY */}
      <section className="space-y-5">
        <SectionTitle n="02" title="Typography" />
        <p className="text-sm text-fog">Poppins. Display is heavy (800/900), all-caps, tightly tracked; body is Poppins Regular.</p>
        <div className="gf-card space-y-6 p-6">
          <div>
            <p className="gf-eyebrow mb-2">Display / H1</p>
            <p className="text-4xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl">The Clarity of <span className="gf-text-spark">Glass</span></p>
          </div>
          <div className="gf-rule" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div><p className="gf-eyebrow mb-1">H2</p><p className="text-3xl font-extrabold uppercase tracking-tight">Trusted by the best</p></div>
            <div><p className="gf-eyebrow mb-1">H3</p><p className="text-xl font-bold uppercase tracking-wide">Capabilities</p></div>
            <div><p className="gf-eyebrow mb-1">Lead</p><p className="text-lg text-snow/90">Cinematic content and brand storytelling that ignites emotion.</p></div>
            <div><p className="gf-eyebrow mb-1">Body</p><p className="text-fog">We craft commercials, documentaries, events, and branded content for ambitious teams.</p></div>
          </div>
          <div className="gf-rule" />
          <div className="flex flex-wrap gap-6 text-3xl font-extrabold uppercase tracking-tight">
            <span className="gf-text-fire">Fire</span>
            <span className="gf-text-glass">Glass</span>
            <span className="gf-text-spark">Spark</span>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section className="space-y-8">
        <SectionTitle n="03" title="Logos" />
        {GROUPS.map((g) => (
          <div key={g.title} className="space-y-3">
            <div>
              <h3 className="text-lg font-bold uppercase tracking-wide">{g.title}</h3>
              <p className="max-w-3xl text-sm text-fog">{g.blurb}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((it) => <AssetCard key={it.name} a={it} copy={copy} copied={copied} />)}
            </div>
          </div>
        ))}
      </section>

      {/* BACKGROUNDS */}
      <section className="space-y-4">
        <SectionTitle n="04" title="Backgrounds" />
        <div className="grid gap-4 sm:grid-cols-2">
          {BACKGROUNDS.map((a) => <AssetCard key={a.name} a={a} wide copy={copy} copied={copied} />)}
        </div>
      </section>

      {/* ELEVATION & RADII */}
      <section className="space-y-6">
        <SectionTitle n="05" title="Elevation & Radii" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SHADOWS.map((s) => (
            <button key={s.name} onClick={() => copy(s.css)} className="rounded-lg p-4 text-left" style={{ background: "#1A1A1F" }}>
              <div className="mb-3 h-16 rounded-md bg-black" style={{ boxShadow: s.css }} />
              <p className="text-sm font-semibold">{s.name}</p>
              <p className="text-[11px] text-steel">{copied === s.css ? "Copied!" : "Copy CSS"}</p>
            </button>
          ))}
        </div>
        <div>
          <p className="gf-eyebrow mb-2">Corner Radii — sharp</p>
          <div className="flex flex-wrap gap-4">
            {RADII.map((r) => (
              <div key={r.name} className="text-center">
                <div className="h-16 w-16 border border-glass/50 bg-graphite" style={{ borderRadius: r.v }} />
                <p className="mt-1 text-xs text-fog">{r.name}</p>
                <code className="text-[10px] text-steel">{r.v}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUTTONS */}
      <section className="space-y-4">
        <SectionTitle n="06" title="Buttons & Chips" />
        <div className="gf-card flex flex-wrap items-center gap-4 p-6">
          <button className="gf-btn gf-btn-fire">Get a Quote</button>
          <button className="gf-btn gf-btn-glass">Watch Showreel</button>
          <button className="gf-btn gf-btn-ghost">Learn More</button>
          <span className="gf-chip">New</span>
          <span className="gf-chip" style={{ color: "#EE2750", borderColor: "rgba(238,39,80,0.4)" }}>Fire</span>
          <span className="gf-chip" style={{ color: "#00A8E4", borderColor: "rgba(0,168,228,0.4)" }}>Glass</span>
        </div>
      </section>

      {/* USAGE */}
      <section className="space-y-4">
        <SectionTitle n="07" title="Usage & Clear Space" />
        <div className="grid gap-4 md:grid-cols-2">
          <Guide title="Do" tone="ok" items={[
            "Use the full-color logo by default; white on dark/photographic backgrounds and black for mono/print.",
            "Keep clear space around the logo at least the height of the icon.",
            "Prefer SVG so the mark stays crisp at any size.",
            "Reserve the spark gradient for hero moments — never behind body text.",
          ]} />
          <Guide title="Don't" tone="no" items={[
            "Don't recolor, stretch, rotate, or add effects to the logo.",
            "Don't place the color logo on busy or low-contrast backgrounds.",
            "Don't rebuild the wordmark in another font.",
            "Don't crowd the logo or shrink it below legibility.",
          ]} />
        </div>
        <p className="text-xs text-steel">Raw files live in <code>Logos/</code>, <code>Backgrounds/</code>, and <code>GlassFire Design System/</code> in the brand-assets repo.</p>
      </section>
    </div>
  );
}

function SectionTitle({ n, title }: { n: string; title: string }) {
  return <div className="flex items-baseline gap-3 border-b border-white/10 pb-2"><span className="font-mono text-sm text-glass">{n}</span><h2 className="text-xl font-extrabold uppercase tracking-tight">{title}</h2></div>;
}

function AssetCard({ a, wide, copy, copied }: { a: Asset; wide?: boolean; copy: (v: string) => void; copied: string }) {
  const bgCls = a.bg === "light" ? "bg-white" : a.bg === "checker" ? "checker" : "bg-[#0b0b0d]";
  return (
    <div className="gf-card overflow-hidden">
      <div className={`flex ${wide ? "h-44" : "h-36"} items-center justify-center p-6 ${bgCls}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(a.preview)} alt={a.name} className="max-h-full max-w-full object-contain" />
      </div>
      <div className="space-y-2 p-4">
        <p className="font-semibold">{a.name}</p>
        <p className="text-xs text-steel">{a.usage}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {a.files.map((f) => (
            <button key={f.path} onClick={() => download(f.path)} className="rounded-sm border border-white/15 px-2.5 py-1 text-xs text-fog transition hover:border-glass hover:text-white">↓ {f.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Guide({ title, tone, items }: { title: string; tone: "ok" | "no"; items: string[] }) {
  return (
    <div className={`rounded-lg border p-4 ${tone === "ok" ? "border-green-900/60 bg-green-950/20" : "border-fire/30 bg-fire/5"}`}>
      <p className={`mb-2 font-bold uppercase tracking-wide ${tone === "ok" ? "text-green-400" : "text-fire"}`}>{title}</p>
      <ul className="space-y-1.5 text-sm text-fog">
        {items.map((i) => <li key={i} className="flex gap-2"><span className={tone === "ok" ? "text-green-400" : "text-fire"}>{tone === "ok" ? "✓" : "✕"}</span>{i}</li>)}
      </ul>
    </div>
  );
}
