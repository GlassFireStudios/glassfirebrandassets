"use client";

import { useState } from "react";

// ── Brand colors ────────────────────────────────────────────────────────────
const COLORS = [
  { name: "Fire Red", hex: "#EE2750", text: "#fff", use: "Primary accent — CTAs, highlights, key actions and energy." },
  { name: "Glass Blue", hex: "#00A8E4", text: "#fff", use: "Secondary accent — links, supporting highlights, cool contrast." },
  { name: "Ink Black", hex: "#000000", text: "#fff", use: "Primary background. Pair with the white or full-color logo." },
  { name: "White", hex: "#FFFFFF", text: "#111", use: "Light backgrounds and text on dark. Use the black or color logo on white." },
];
const GRADIENT = "linear-gradient(135deg, #EE2750 0%, #00A8E4 100%)";

// ── Logo groups ─────────────────────────────────────────────────────────────
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
    blurb: "The default GlassFire mark. Use it wherever there's enough contrast — ideal on white, light, or muted dark surfaces. Prefer SVG for web/print; PNG for quick placement.",
    items: [
      { name: "Primary Logo", preview: `${G}/GlassFire Logo Color.png`, bg: "dark", usage: "The main wordmark with built-in clear space. Your go-to in most places.", files: [{ label: "SVG", path: `${G}/GlassFire Logo Color.svg` }, { label: "PNG", path: `${G}/GlassFire Logo Color.png` }] },
      { name: "Primary Logo — No Padding", preview: `${G}/GlassFire Logo Color NoPadding.png`, bg: "dark", usage: "Same mark with no built-in clear space — when you're setting spacing manually.", files: [{ label: "SVG", path: `${G}/GlassFire Logo Color NoPadding.svg` }, { label: "PNG", path: `${G}/GlassFire Logo Color NoPadding.png` }] },
      { name: "Icon / Symbol", preview: `${G}/GlassFire Icon Color.png`, bg: "dark", usage: "Mark only — avatars, app tiles, and tight spaces where the wordmark won't fit.", files: [{ label: "SVG", path: `${G}/GlassFire Icon Color.svg` }, { label: "PNG", path: `${G}/GlassFire Icon Color.png` }] },
      { name: "Lockups (flattened JPG)", preview: `${G}/GlassFire Logo Color on White.jpg`, bg: "light", usage: "Pre-composed on solid black or white — for places that can't use transparency.", files: [{ label: "Logo / Black", path: `${G}/GlassFire Logo Color on Black.jpg` }, { label: "Logo / White", path: `${G}/GlassFire Logo Color on White.jpg` }, { label: "Icon / Black", path: `${G}/GlassFire Icon Color on Black.jpg` }, { label: "Icon / White", path: `${G}/GlassFire Icon Color on White.jpg` }] },
    ],
  },
  {
    title: "White (Reversed)",
    blurb: "For dark, photographic, or brand-color backgrounds where the full-color mark wouldn't read. The cleanest monochrome reverse.",
    items: [
      { name: "Logo — White", preview: `${W}/GlassFire Logo White.png`, bg: "dark", usage: "Use on dark/busy backgrounds and over the smoke background.", files: [{ label: "SVG", path: `${W}/GlassFire Logo White.svg` }, { label: "PNG", path: `${W}/GlassFire Logo White.png` }] },
      { name: "Icon — White", preview: `${W}/GlassFire Icon White.png`, bg: "dark", usage: "White mark only for tight, dark placements.", files: [{ label: "SVG", path: `${W}/GlassFire Icon White.svg` }, { label: "PNG", path: `${W}/GlassFire Icon White.png` }] },
    ],
  },
  {
    title: "Black (Mono)",
    blurb: "For light backgrounds and single-color / print reproduction where color isn't available.",
    items: [
      { name: "Logo — Black", preview: `${B}/GlassFire Logo Black.png`, bg: "light", usage: "Use on white/light backgrounds, mono print, faxes, engraving.", files: [{ label: "SVG", path: `${B}/GlassFire Logo Black.svg` }, { label: "PNG", path: `${B}/GlassFire Logo Black.png` }] },
      { name: "Icon — Black", preview: `${B}/GlassFire Icon Black.png`, bg: "light", usage: "Black mark only for tight, light placements.", files: [{ label: "SVG", path: `${B}/GlassFire Icon Black.svg` }, { label: "PNG", path: `${B}/GlassFire Icon Black.png` }] },
    ],
  },
  {
    title: "Alternate Color (Variant 2)",
    blurb: "A secondary color treatment. Use only when the primary mark doesn't suit the context — keep the primary as default.",
    items: [
      { name: "Logo — 2 Color", preview: `${C2}/GlassFire Logo 2 Color.png`, bg: "checker", usage: "Alternate color wordmark.", files: [{ label: "PNG", path: `${C2}/GlassFire Logo 2 Color.png` }] },
      { name: "Icon — 2 Color", preview: `${C2}/GlassFire Icon 2 Color.png`, bg: "checker", usage: "Alternate color icon.", files: [{ label: "PNG", path: `${C2}/GlassFire Icon 2 Color.png` }] },
    ],
  },
  {
    title: "Favicon & App Icon",
    blurb: "Tiny placements: browser tabs and mobile home-screen / web-clip icons.",
    items: [
      { name: "Favicon", preview: `${FAV}/Favicon Logo.png`, bg: "dark", usage: "Browser tab icon.", files: [{ label: "SVG", path: `${FAV}/Favicon Logo.svg` }, { label: "PNG", path: `${FAV}/Favicon Logo.png` }] },
      { name: "Web Clip", preview: `${FAV}/Webclip Logo.png`, bg: "dark", usage: "Mobile home-screen / web-clip icon.", files: [{ label: "SVG", path: `${FAV}/Webclip Logo.svg` }, { label: "PNG", path: `${FAV}/Webclip Logo.png` }] },
    ],
  },
];

const BACKGROUNDS: Asset[] = [
  { name: "Smoke Background", preview: "Backgrounds/Official Brand Background/16x9 4k Bkgd.jpg", bg: "dark", usage: "The official brand background. Base layer for slides, sections, and the white logo.", files: [{ label: "16:9 · 4K", path: "Backgrounds/Official Brand Background/16x9 4k Bkgd.jpg" }] },
  { name: "Logo + Background", preview: "Backgrounds/Official Brand Logo + Background/16x9 4k.jpg", bg: "dark", usage: "Ready-made branded canvases — slide title cards, Zoom backgrounds, banners.", files: [{ label: "16:9 · HD", path: "Backgrounds/Official Brand Logo + Background/16x9 HD.jpg" }, { label: "16:9 · 4K", path: "Backgrounds/Official Brand Logo + Background/16x9 4k.jpg" }, { label: "32:9 · 8K", path: "Backgrounds/Official Brand Logo + Background/32x9 8K.jpg" }] },
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
  const copy = (hex: string) => { navigator.clipboard.writeText(hex); setCopied(hex); setTimeout(() => setCopied(""), 1200); };

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Brand Guide</h1>
        <p className="max-w-2xl text-zinc-400">The GlassFire design system — logos, colors, and backgrounds with usage guidance. Everything here is downloadable. Always prefer the vector (SVG) files for crisp scaling.</p>
      </header>

      {/* COLORS */}
      <section className="space-y-4">
        <SectionTitle n="01" title="Colors" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLORS.map((c) => (
            <button key={c.hex} onClick={() => copy(c.hex)} className="overflow-hidden rounded-xl border border-zinc-800 text-left transition hover:border-glass">
              <div className="flex h-28 items-end p-3" style={{ background: c.hex, color: c.text }}>
                <span className="text-sm font-medium">{copied === c.hex ? "Copied!" : "Click to copy"}</span>
              </div>
              <div className="space-y-1 p-3">
                <div className="flex items-center justify-between"><span className="font-medium">{c.name}</span><code className="text-xs text-zinc-500">{c.hex}</code></div>
                <p className="text-xs text-zinc-500">{c.use}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <div className="flex h-20 items-end p-3 text-white" style={{ background: GRADIENT }}><span className="text-sm font-medium">Brand Gradient</span></div>
          <p className="p-3 text-xs text-zinc-500">Fire → Glass. The signature gradient from the logo. Use sparingly for hero moments and emphasis (buttons, key headlines) — never behind body text.</p>
        </div>
      </section>

      {/* LOGOS */}
      <section className="space-y-8">
        <SectionTitle n="02" title="Logos" />
        {GROUPS.map((g) => (
          <div key={g.title} className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold">{g.title}</h3>
              <p className="max-w-3xl text-sm text-zinc-400">{g.blurb}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((it) => <AssetCard key={it.name} a={it} />)}
            </div>
          </div>
        ))}
      </section>

      {/* BACKGROUNDS */}
      <section className="space-y-4">
        <SectionTitle n="03" title="Backgrounds" />
        <div className="grid gap-4 sm:grid-cols-2">
          {BACKGROUNDS.map((a) => <AssetCard key={a.name} a={a} wide />)}
        </div>
      </section>

      {/* USAGE */}
      <section className="space-y-4">
        <SectionTitle n="04" title="Usage & Clear Space" />
        <div className="grid gap-4 md:grid-cols-2">
          <Guide title="Do" tone="ok" items={[
            "Use the full-color logo by default; switch to white on dark/photographic backgrounds and black for mono/print.",
            "Keep clear space around the logo at least the height of the icon.",
            "Prefer SVG so the mark stays crisp at any size.",
            "Use the smoke background as the base layer, with the white logo on top.",
          ]} />
          <Guide title="Don't" tone="no" items={[
            "Don't recolor, stretch, rotate, or add effects to the logo.",
            "Don't place the color logo on busy or low-contrast backgrounds.",
            "Don't rebuild the wordmark in another font.",
            "Don't crowd the logo or shrink it below legibility.",
          ]} />
        </div>
        <p className="text-xs text-zinc-500">Need the raw files? Everything lives in <code>Logos/</code> and <code>Backgrounds/</code> in the brand-assets repo.</p>
      </section>
    </div>
  );
}

function SectionTitle({ n, title }: { n: string; title: string }) {
  return <div className="flex items-baseline gap-3 border-b border-zinc-800 pb-2"><span className="text-sm font-mono text-glass">{n}</span><h2 className="text-xl font-bold">{title}</h2></div>;
}

function AssetCard({ a, wide }: { a: Asset; wide?: boolean }) {
  const bgCls = a.bg === "light" ? "bg-white" : a.bg === "checker" ? "checker" : "bg-[#0b0b0d]";
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className={`flex ${wide ? "h-44" : "h-36"} items-center justify-center p-6 ${bgCls}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(a.preview)} alt={a.name} className="max-h-full max-w-full object-contain" />
      </div>
      <div className="space-y-2 p-4">
        <p className="font-medium">{a.name}</p>
        <p className="text-xs text-zinc-500">{a.usage}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {a.files.map((f) => (
            <button key={f.path} onClick={() => download(f.path)} className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-glass hover:text-white">↓ {f.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Guide({ title, tone, items }: { title: string; tone: "ok" | "no"; items: string[] }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "ok" ? "border-green-900/60 bg-green-950/20" : "border-fire/30 bg-fire/5"}`}>
      <p className={`mb-2 font-semibold ${tone === "ok" ? "text-green-400" : "text-fire"}`}>{title}</p>
      <ul className="space-y-1.5 text-sm text-zinc-300">
        {items.map((i) => <li key={i} className="flex gap-2"><span className={tone === "ok" ? "text-green-400" : "text-fire"}>{tone === "ok" ? "✓" : "✕"}</span>{i}</li>)}
      </ul>
    </div>
  );
}
