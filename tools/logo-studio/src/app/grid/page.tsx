"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { imageToCanvas, loadImage, trimBounds, cropToBounds, canvasToBase64, canvasToDataUrl } from "@/lib/image";
import { renderGrid, type GridItem } from "@/lib/grid";
import { slugify } from "@/lib/slug";
import { useClients } from "@/lib/useClients";
import LogoOrderPanel from "@/components/LogoOrderPanel";
import { gridMarkup, liveEmbedCode, rawUrl, type EmbedLogo, type HoverStyle } from "@/lib/embed";
import type { ClientEntry, EmbedConfig, RenderedFile, VariantName } from "@/lib/types";

type WatermarkVariant = "none" | "color" | "white" | "black";

const WATERMARK_PATHS: Record<Exclude<WatermarkVariant, "none">, string> = {
  white: "Logos/Variant White/GlassFire Logo White.png",
  black: "Logos/Variant Black/GlassFire Logo Black.png",
  color: "Logos/Official Gradient Logo/GlassFire Logo Color.png",
};

const ASPECTS: { label: string; w: number; h: number }[] = [
  { label: "16:9", w: 1920, h: 1080 },
  { label: "16:10", w: 1920, h: 1200 },
  { label: "4:3", w: 1440, h: 1080 },
  { label: "1:1", w: 1080, h: 1080 },
  { label: "4:5", w: 1080, h: 1350 },
  { label: "9:16", w: 1080, h: 1920 },
];

const BG_PRESETS: { label: string; value: string }[] = [
  { label: "Black", value: "#000000" },
  { label: "Ink", value: "#0b0b0d" },
  { label: "White", value: "#ffffff" },
  { label: "Fire Red", value: "#EE2750" },
  { label: "Glass Blue", value: "#00A8E4" },
  { label: "Transparent", value: "transparent" },
];

export default function GridPage() {
  const { clients, branch, repo, error } = useClients();
  const [order, setOrder] = useState<string[]>([]);
  const initialized = useRef(false);
  const [variant, setVariant] = useState<VariantName>("white");

  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [columns, setColumns] = useState<number | "auto">("auto");
  const [gap, setGap] = useState(48);
  const [outerPad, setOuterPad] = useState(96);
  const [logoPad, setLogoPad] = useState(10);
  const [stagger, setStagger] = useState(0);

  const [background, setBackground] = useState("#000000");
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [bgImageName, setBgImageName] = useState<string | null>(null);

  const [title, setTitle] = useState("TRUSTED BY");
  const [titleColor, setTitleColor] = useState("#ffffff");
  const [titleSize, setTitleSize] = useState(72);
  const [watermarkVariant, setWatermarkVariant] = useState<WatermarkVariant>("white");

  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [preview, setPreview] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const renderedRef = useRef<HTMLCanvasElement | null>(null);

  const cellCache = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const wmCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ htmlUrl?: string; error?: string } | null>(null);

  // HTML / live embed (CSS grid, separate from the raster PNG export)
  const [embedHover, setEmbedHover] = useState<HoverStyle>("none");
  const [embedCols, setEmbedCols] = useState(5);
  const [embedCellH, setEmbedCellH] = useState(56);
  const [embedName, setEmbedName] = useState("");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [savingEmbed, setSavingEmbed] = useState(false);
  const [embedSaved, setEmbedSaved] = useState<{ slug?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState("");

  // Seed the order with all clients once they load.
  useEffect(() => {
    if (!initialized.current && clients.length) {
      setOrder(clients.map((c) => c.name));
      initialized.current = true;
    }
  }, [clients]);

  function resolvePath(c: ClientEntry, v: VariantName): string | undefined {
    return c.variants[v] || c.variants.white || c.variants.color || c.variants.black;
  }

  const ensureCell = useCallback(async (c: ClientEntry, v: VariantName) => {
    const key = `${c.name}|${v}`;
    if (cellCache.current.has(key)) return cellCache.current.get(key)!;
    const path = resolvePath(c, v);
    if (!path) throw new Error(`No logo for ${c.name}`);
    const img = await loadImage(`/api/asset?path=${encodeURIComponent(path)}`, false);
    const cv = imageToCanvas(img);
    const b = trimBounds(cv);
    const tight = b ? cropToBounds(cv, b) : cv;
    cellCache.current.set(key, tight);
    return tight;
  }, []);

  const ensureWatermark = useCallback(async (v: WatermarkVariant) => {
    if (v === "none") return null;
    if (wmCache.current.has(v)) return wmCache.current.get(v)!;
    const img = await loadImage(`/api/asset?path=${encodeURIComponent(WATERMARK_PATHS[v])}`, false);
    wmCache.current.set(v, img);
    return img;
  }, []);

  const build = useCallback(async () => {
    setBuilding(true);
    setErr(null);
    try {
      const chosen = order.map((n) => clients.find((c) => c.name === n)).filter(Boolean) as ClientEntry[];
      if (!chosen.length) { setPreview(null); return; }
      const items: GridItem[] = [];
      for (const c of chosen) items.push({ canvas: await ensureCell(c, variant), name: c.name });
      const wm = await ensureWatermark(watermarkVariant);
      const canvas = renderGrid(items, {
        width, height, columns,
        gapX: gap, gapY: gap,
        outerPadding: outerPad,
        logoPadding: logoPad / 100,
        background: bgImageName ? "transparent" : background,
        backgroundImage: bgImageName ? bgImageRef.current : null,
        title: title || undefined,
        titleColor, titleSize,
        staggerAmount: stagger,
        watermark: wm,
      });
      renderedRef.current = canvas;
      setPreview(canvasToDataUrl(canvas, format === "jpeg" ? "image/jpeg" : "image/png"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Build failed");
    } finally {
      setBuilding(false);
    }
  }, [clients, order, variant, width, height, columns, gap, outerPad, logoPad, stagger, background, bgImageName, title, titleColor, titleSize, watermarkVariant, format, ensureCell, ensureWatermark]);

  useEffect(() => {
    if (clients.length) build();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build]);

  async function onBgUpload(file: File) {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url, false);
    bgImageRef.current = img;
    setBgImageName(file.name);
  }

  function download() {
    if (!renderedRef.current) return;
    const a = document.createElement("a");
    a.href = canvasToDataUrl(renderedRef.current, format === "jpeg" ? "image/jpeg" : "image/png");
    a.download = `glassfire-${slugify(title || "logo-grid")}.${format}`;
    a.click();
  }

  async function publish() {
    if (!renderedRef.current) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      const file: RenderedFile = {
        path: `Grids/${slugify(title || "logo-grid")}-${stamp}.${format}`,
        base64: canvasToBase64(renderedRef.current, format === "jpeg" ? "image/jpeg" : "image/png"),
      };
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [file], message: `Add logo grid: ${title || "untitled"}`, branch, createBranch: false }),
      });
      const data = await res.json();
      if (res.ok) setPublishResult({ htmlUrl: data.htmlUrl });
      else setPublishResult({ error: data.error });
    } catch (e) {
      setPublishResult({ error: e instanceof Error ? e.message : "Publish failed" });
    } finally {
      setPublishing(false);
    }
  }

  // Load a saved grid embed for editing (?embed=slug).
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("embed");
    if (!slug) return;
    (async () => {
      const res = await fetch(`/api/asset?path=${encodeURIComponent(`Embeds/${slug}.json`)}`);
      if (!res.ok) return;
      const cfg: EmbedConfig = await res.json();
      const o = cfg.options as Record<string, unknown>;
      setOrder(cfg.logos.map((l) => l.name));
      initialized.current = true;
      setEmbedName(cfg.name);
      setEditingSlug(cfg.slug);
      if (typeof o.variant === "string") setVariant(o.variant as VariantName);
      if (typeof o.columns === "number") setEmbedCols(o.columns);
      if (typeof o.gap === "number") setGap(o.gap);
      if (typeof o.padding === "number") setOuterPad(o.padding);
      if (typeof o.cellHeight === "number") setEmbedCellH(o.cellHeight);
      if (typeof o.background === "string") setBackground(o.background);
      if (typeof o.hoverStyle === "string") setEmbedHover(o.hoverStyle as HoverStyle);
    })();
  }, []);

  const chosen = useMemo(() => order.map((n) => clients.find((c) => c.name === n)).filter(Boolean) as ClientEntry[], [order, clients]);
  const evp = (c: ClientEntry) => c.variants[variant] || c.variants.white || c.variants.color || c.variants.black;
  const ecp = (c: ClientEntry) => c.variants.color || c.variants.white || c.variants.black;
  const embedLogos = (urlFor: (p: string) => string): EmbedLogo[] =>
    chosen.map((c) => { const v = evp(c); const col = ecp(c); return v ? { url: urlFor(v), colorUrl: col ? urlFor(col) : undefined, alt: c.alt || `${c.name} logo` } : null; }).filter(Boolean) as EmbedLogo[];
  const gridEmbedOpts = { columns: embedCols, gap, padding: outerPad, cellHeight: embedCellH, background: bgImageName ? "transparent" : background, hoverStyle: embedHover };
  const embedPreviewHtml = useMemo(() => gridMarkup(embedLogos((p) => `/api/asset?path=${encodeURIComponent(p)}`), gridEmbedOpts), [chosen, embedCols, gap, outerPad, embedCellH, background, embedHover, variant, bgImageName]); // eslint-disable-line react-hooks/exhaustive-deps
  const embedStaticCode = useMemo(() => gridMarkup(embedLogos((p) => rawUrl(repo, branch, p)), gridEmbedOpts), [chosen, embedCols, gap, outerPad, embedCellH, background, embedHover, variant, bgImageName, repo, branch]); // eslint-disable-line react-hooks/exhaustive-deps

  async function copyText(text: string, key: string) { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); }

  async function saveEmbed() {
    const slug = slugify(embedName || "grid");
    if (!slug || !chosen.length) return;
    setSavingEmbed(true); setEmbedSaved(null);
    try {
      const cfg: EmbedConfig = {
        type: "grid", name: embedName || slug, slug,
        logos: chosen.map((c) => { const v = evp(c)!; const col = ecp(c); return { name: c.name, url: v, colorUrl: col, alt: c.alt || `${c.name} logo` }; }),
        options: { columns: embedCols, gap, padding: outerPad, cellHeight: embedCellH, background, hoverStyle: embedHover, variant },
        updatedAt: new Date().toISOString(),
      };
      const file: RenderedFile = { path: `Embeds/${slug}.json`, base64: btoa(unescape(encodeURIComponent(JSON.stringify(cfg, null, 2)))) };
      const res = await fetch("/api/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files: [file], message: `${editingSlug ? "Update" : "Add"} grid embed: ${slug}`, branch, createBranch: false }) });
      const data = await res.json();
      if (res.ok) { setEmbedSaved({ slug }); setEditingSlug(slug); } else setEmbedSaved({ error: data.error });
    } catch (e) { setEmbedSaved({ error: e instanceof Error ? e.message : "Save failed" }); }
    finally { setSavingEmbed(false); }
  }
  const liveGridCode = embedSaved?.slug ? liveEmbedCode(embedSaved.slug, repo, branch) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Grid Builder</h1>
      {(err || error) && <p className="text-sm text-fire">{err || error}</p>}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-5">
          <LogoOrderPanel clients={clients} order={order} onChange={setOrder} />

          <Field label="Logo variant">
            <div className="flex gap-2">
              {(["white", "black", "color"] as VariantName[]).map((v) => (
                <button key={v} onClick={() => setVariant(v)} className={`flex-1 rounded-lg border px-2 py-1.5 text-sm capitalize ${variant === v ? "border-glass bg-glass/10" : "border-zinc-700 text-zinc-400"}`}>{v}</button>
              ))}
            </div>
          </Field>

          <Field label="Resolution">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {ASPECTS.map((a) => {
                const active = width === a.w && height === a.h;
                return <button key={a.label} onClick={() => { setWidth(a.w); setHeight(a.h); }} className={`rounded-lg border px-2 py-1 text-xs ${active ? "border-glass bg-glass/10" : "border-zinc-700 text-zinc-400"}`}>{a.label}</button>;
              })}
            </div>
            <div className="flex items-center gap-2">
              <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm" />
              <span className="text-zinc-500">×</span>
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm" />
            </div>
          </Field>

          <Field label="Background">
            <div className="flex flex-wrap gap-2">
              {BG_PRESETS.map((b) => (
                <button key={b.value} onClick={() => { setBackground(b.value); setBgImageName(null); }} className={`rounded-lg border px-2 py-1 text-xs ${!bgImageName && background === b.value ? "border-glass" : "border-zinc-700 text-zinc-400"}`}>{b.label}</button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input value={background} onChange={(e) => { setBackground(e.target.value); setBgImageName(null); }} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm" />
              <input type="color" value={background.startsWith("#") ? background : "#000000"} onChange={(e) => { setBackground(e.target.value); setBgImageName(null); }} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label className="cursor-pointer rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:border-glass">
                Upload PNG
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onBgUpload(e.target.files[0])} />
              </label>
              {bgImageName && <span className="flex items-center gap-1 text-xs text-zinc-400">{bgImageName}<button onClick={() => setBgImageName(null)} className="text-fire">✕</button></span>}
            </div>
          </Field>

          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm" />
            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              size <input type="number" value={titleSize} onChange={(e) => setTitleSize(Number(e.target.value))} className="w-16 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1" />
              color <input type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} />
            </div>
          </Field>

          <Field label="Watermark">
            <div className="flex gap-2">
              {(["none", "color", "white", "black"] as WatermarkVariant[]).map((v) => (
                <button key={v} onClick={() => setWatermarkVariant(v)} className={`flex-1 rounded-lg border px-1.5 py-1.5 text-xs capitalize ${watermarkVariant === v ? "border-glass bg-glass/10" : "border-zinc-700 text-zinc-400"}`}>{v}</button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Columns (${columns})`}>
              <select value={String(columns)} onChange={(e) => setColumns(e.target.value === "auto" ? "auto" : Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm">
                <option value="auto">Auto</option>
                {[2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Gap"><input type="number" value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm" /></Field>
            <Field label="Outer padding"><input type="number" value={outerPad} onChange={(e) => setOuterPad(Number(e.target.value))} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm" /></Field>
            <Field label={`Logo padding ${logoPad}%`}><input type="range" min={-25} max={30} value={logoPad} onChange={(e) => setLogoPad(Number(e.target.value))} className="w-full" /></Field>
          </div>

          <Field label={`Stagger ${stagger}px${stagger === 0 ? " (off)" : ""}`}>
            <input type="range" min={0} max={200} value={stagger} onChange={(e) => setStagger(Number(e.target.value))} className="w-full" />
          </Field>
        </div>

        <div className="space-y-4">
          <div className="checker flex min-h-[300px] items-center justify-center rounded-xl border border-zinc-800 p-3">
            {building && <p className="text-zinc-400">Building…</p>}
            {!building && preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Logo grid preview" className="max-h-[65vh] max-w-full object-contain" />
            )}
            {!building && !preview && <p className="text-zinc-500">Select clients to build a grid.</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-zinc-500">{width}×{height}</span>
            <div className="flex gap-2 text-sm">
              {(["png", "jpeg"] as const).map((f) => (
                <button key={f} onClick={() => setFormat(f)} className={`rounded-lg border px-3 py-1.5 uppercase ${format === f ? "border-glass bg-glass/10" : "border-zinc-700 text-zinc-400"}`}>{f}</button>
              ))}
            </div>
            <span className="text-xs text-zinc-500">{format === "png" ? "Transparent supported" : "Flattened on background"}</span>
            <button onClick={download} disabled={!preview} className="rounded-lg bg-glass px-4 py-2 font-medium text-black disabled:opacity-50">Download</button>
            <button onClick={publish} disabled={!preview || publishing} className="rounded-lg bg-fire px-4 py-2 font-medium text-white disabled:opacity-50">
              {publishing ? "Publishing…" : `Publish to Grids/ (${branch})`}
            </button>
          </div>
          {publishResult?.htmlUrl && <p className="text-sm text-green-400">Published · <a className="underline" href={publishResult.htmlUrl} target="_blank" rel="noreferrer">view commit</a></p>}
          {publishResult?.error && <p className="text-sm text-fire">{publishResult.error}</p>}

          {/* HTML / LIVE EMBED (responsive CSS grid) */}
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="font-medium">Embed as live HTML grid</p>
            <p className="text-xs text-zinc-500">A responsive CSS grid for the web (separate from the PNG above). Auto-updates when re-saved.</p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-zinc-500">Hover:</span>
              {(["none", "grayscale", "white", "black"] as HoverStyle[]).map((h) => (
                <button key={h} onClick={() => setEmbedHover(h)} className={`rounded-lg border px-2 py-1 text-xs capitalize ${embedHover === h ? "border-glass bg-glass/10" : "border-zinc-700 text-zinc-400"}`}>{h}</button>
              ))}
              <label className="flex items-center gap-1 text-xs text-zinc-400">Cols <input type="number" value={embedCols} onChange={(e) => setEmbedCols(Number(e.target.value))} className="w-14 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1" /></label>
              <label className="flex items-center gap-1 text-xs text-zinc-400">Logo h <input type="number" value={embedCellH} onChange={(e) => setEmbedCellH(Number(e.target.value))} className="w-16 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-1" /></label>
            </div>
            <div className="checker overflow-hidden rounded-lg border border-zinc-800">
              {chosen.length ? <div dangerouslySetInnerHTML={{ __html: embedPreviewHtml }} /> : <p className="p-4 text-sm text-zinc-500">Select logos.</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input value={embedName} onChange={(e) => setEmbedName(e.target.value)} placeholder="Name e.g. RFP grid — Acme" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
              <button onClick={saveEmbed} disabled={savingEmbed || !chosen.length || !embedName} className="rounded-lg bg-fire px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{savingEmbed ? "Saving…" : editingSlug ? "Update embed" : "Save embed"}</button>
            </div>
            {embedSaved?.error && <p className="text-sm text-fire">{embedSaved.error}</p>}
            {liveGridCode && (
              <div className="space-y-2">
                <p className="text-sm text-green-400">Saved as <code>{embedSaved!.slug}</code>.</p>
                <textarea readOnly value={liveGridCode} className="h-20 w-full rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-300" />
                <button onClick={() => copyText(liveGridCode, "live")} className="rounded-lg bg-glass px-3 py-1.5 text-sm font-medium text-black">{copied === "live" ? "Copied!" : "Copy live embed"}</button>
              </div>
            )}
            <details>
              <summary className="cursor-pointer text-sm text-zinc-400">Static HTML snippet</summary>
              <textarea readOnly value={embedStaticCode} className="mt-2 h-40 w-full rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-300" />
              <button onClick={() => copyText(embedStaticCode, "static")} className="mt-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:border-glass">{copied === "static" ? "Copied!" : "Copy static HTML"}</button>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">{label}</label>
      {children}
    </div>
  );
}
