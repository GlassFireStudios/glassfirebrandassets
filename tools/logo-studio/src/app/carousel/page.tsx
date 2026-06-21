"use client";

import { useEffect, useMemo, useState } from "react";
import { useClients } from "@/lib/useClients";
import LogoOrderPanel from "@/components/LogoOrderPanel";
import { carouselMarkup, cdnUrl, liveEmbedCode, type CarouselOptions, type EmbedLogo, type HoverStyle } from "@/lib/embed";
import { slugify } from "@/lib/slug";
import type { ClientEntry, EmbedConfig, RenderedFile, VariantName } from "@/lib/types";

const HOVERS: { id: HoverStyle; label: string }[] = [
  { id: "grayscale", label: "Grayscale → color" },
  { id: "white", label: "White → color" },
  { id: "black", label: "Black → color" },
  { id: "none", label: "Static" },
];

export default function CarouselPage() {
  const { clients, branch, repo, error } = useClients();
  const [order, setOrder] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [variant, setVariant] = useState<VariantName>("white");

  const [hoverStyle, setHoverStyle] = useState<HoverStyle>("grayscale");
  const [height, setHeight] = useState(44);
  const [gap, setGap] = useState(72);
  const [duration, setDuration] = useState(40);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [edgeFade, setEdgeFade] = useState(true);
  const [background, setBackground] = useState("transparent");
  const [padding, setPadding] = useState(24);
  const [rows, setRows] = useState(1);
  const [mirrorRows, setMirrorRows] = useState(true);
  const [rowGap, setRowGap] = useState(24);
  const [previewBg, setPreviewBg] = useState("#0b0b0d");

  const [embedName, setEmbedName] = useState("");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ slug?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState("");

  if (!seeded && clients.length) { setOrder(clients.map((c) => c.name)); setSeeded(true); }

  // Load an existing saved embed for editing (?embed=slug).
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("embed");
    if (!slug) return;
    (async () => {
      const res = await fetch(`/api/asset?path=${encodeURIComponent(`Embeds/${slug}.json`)}`);
      if (!res.ok) return;
      const cfg: EmbedConfig = await res.json();
      const o = cfg.options as unknown as CarouselOptions & { variant?: VariantName };
      setOrder(cfg.logos.map((l) => l.name));
      setSeeded(true);
      setEmbedName(cfg.name);
      setEditingSlug(cfg.slug);
      if (o.variant) setVariant(o.variant);
      setHoverStyle(o.hoverStyle ?? "grayscale");
      setHeight(o.height); setGap(o.gap); setDuration(o.duration);
      setDirection(o.direction); setPauseOnHover(o.pauseOnHover);
      setEdgeFade(o.edgeFade); setBackground(o.background); setPadding(o.padding);
      if (o.rows) setRows(o.rows);
      if (typeof o.mirrorRows === "boolean") setMirrorRows(o.mirrorRows);
      if (typeof o.rowGap === "number") setRowGap(o.rowGap);
    })();
  }, []);

  const variantPath = (c: ClientEntry) => c.variants[variant] || c.variants.white || c.variants.color || c.variants.black;
  const colorPath = (c: ClientEntry) => c.variants.color || c.variants.white || c.variants.black;

  const opts: CarouselOptions = { height, gap, duration, direction, hoverStyle, pauseOnHover, background, edgeFade, padding, rows, mirrorRows, rowGap };
  const chosen = useMemo(() => order.map((n) => clients.find((c) => c.name === n)).filter(Boolean) as ClientEntry[], [order, clients]);

  function logosFor(urlFor: (p: string) => string): EmbedLogo[] {
    return chosen.map((c) => {
      const vp = variantPath(c); const cp = colorPath(c);
      return vp ? { url: urlFor(vp), colorUrl: cp ? urlFor(cp) : undefined, alt: c.alt || `${c.name} logo` } : null;
    }).filter(Boolean) as EmbedLogo[];
  }

  const previewLogos = logosFor((p) => `/api/asset?path=${encodeURIComponent(p)}`);
  const staticLogos = logosFor((p) => cdnUrl(repo, branch, p));
  const previewHtml = useMemo(() => carouselMarkup(previewLogos, opts), [previewLogos, opts]);
  const staticCode = useMemo(() => carouselMarkup(staticLogos, opts), [staticLogos, opts]);

  async function copy(text: string, which: string) {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(""), 1500);
  }

  async function saveEmbed() {
    const slug = slugify(embedName || "carousel");
    if (!slug || !chosen.length) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const cfg: EmbedConfig = {
        type: "carousel",
        name: embedName || slug,
        slug,
        logos: chosen.map((c) => {
          const vp = variantPath(c)!; const cp = colorPath(c);
          return { name: c.name, url: vp, colorUrl: cp, alt: c.alt || `${c.name} logo` };
        }),
        options: { ...opts, variant },
        updatedAt: new Date().toISOString(),
      };
      const file: RenderedFile = {
        path: `Embeds/${slug}.json`,
        base64: btoa(unescape(encodeURIComponent(JSON.stringify(cfg, null, 2)))),
      };
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [file], message: `${editingSlug ? "Update" : "Add"} carousel embed: ${slug}`, branch, createBranch: false }),
      });
      const data = await res.json();
      if (res.ok) { setSaveResult({ slug }); setEditingSlug(slug); }
      else setSaveResult({ error: data.error });
    } catch (e) {
      setSaveResult({ error: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  const liveCode = saveResult?.slug ? liveEmbedCode(saveResult.slug, repo, branch) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Carousel Builder</h1>
      <p className="text-sm text-zinc-400">An embeddable auto-scrolling logo strip. Build it, then copy a static snippet or save a live embed that auto-updates.</p>
      {error && <p className="text-sm text-fire">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-5">
          <LogoOrderPanel clients={clients} order={order} onChange={setOrder} />

          <Field label="Resting style → hover reveals color">
            <div className="grid grid-cols-2 gap-2">
              {HOVERS.map((h) => (
                <button key={h.id} onClick={() => setHoverStyle(h.id)} className={`rounded-lg border px-2 py-1.5 text-xs ${hoverStyle === h.id ? "border-glass bg-glass/10" : "border-zinc-700 text-zinc-400"}`}>{h.label}</button>
              ))}
            </div>
          </Field>

          {hoverStyle === "none" && (
            <Field label="Static variant">
              <div className="flex gap-2">
                {(["white", "black", "color"] as VariantName[]).map((v) => (
                  <button key={v} onClick={() => setVariant(v)} className={`flex-1 rounded-lg border px-2 py-1.5 text-sm capitalize ${variant === v ? "border-glass bg-glass/10" : "border-zinc-700 text-zinc-400"}`}>{v}</button>
                ))}
              </div>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Logo height ${height}px`}><input type="range" min={20} max={120} value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full" /></Field>
            <Field label={`Gap ${gap}px`}><input type="range" min={16} max={160} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full" /></Field>
            <Field label={`Speed ${duration}s/loop`}><input type="range" min={10} max={120} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full" /></Field>
            <Field label={`Padding ${padding}px`}><input type="range" min={0} max={80} value={padding} onChange={(e) => setPadding(Number(e.target.value))} className="w-full" /></Field>
          </div>

          <Field label="Direction">
            <div className="flex gap-2">
              {(["left", "right"] as const).map((d) => (
                <button key={d} onClick={() => setDirection(d)} className={`flex-1 rounded-lg border px-2 py-1.5 text-sm capitalize ${direction === d ? "border-glass bg-glass/10" : "border-zinc-700 text-zinc-400"}`}>{d}</button>
              ))}
            </div>
          </Field>

          <Field label="Rows">
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button key={n} onClick={() => setRows(n)} className={`flex-1 rounded-lg border px-2 py-1.5 text-sm ${rows === n ? "border-glass bg-glass/10" : "border-zinc-700 text-zinc-400"}`}>{n}</button>
              ))}
            </div>
            <p className="mt-1 text-xs text-zinc-600">Logos are split evenly across rows.</p>
          </Field>
          {rows > 1 && (
            <>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mirrorRows} onChange={(e) => setMirrorRows(e.target.checked)} /> Alternate row directions</label>
              <Field label={`Row gap ${rowGap}px`}><input type="range" min={0} max={80} value={rowGap} onChange={(e) => setRowGap(Number(e.target.value))} className="w-full" /></Field>
            </>
          )}

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={pauseOnHover} onChange={(e) => setPauseOnHover(e.target.checked)} /> Pause on hover</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={edgeFade} onChange={(e) => setEdgeFade(e.target.checked)} /> Fade edges</label>
          </div>

          <Field label="Background (CSS)">
            <div className="flex items-center gap-2">
              <input value={background} onChange={(e) => setBackground(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm" />
              <button onClick={() => setBackground("transparent")} className="rounded-lg border border-zinc-700 px-2 py-1.5 text-xs hover:border-glass">clear</button>
            </div>
          </Field>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            Preview bg:
            {["#0b0b0d", "#ffffff", "#EE2750", "#00A8E4"].map((c) => (
              <button key={c} onClick={() => setPreviewBg(c)} className={`h-5 w-5 rounded border ${previewBg === c ? "border-glass" : "border-zinc-700"}`} style={{ background: c }} />
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-800" style={{ background: previewBg }}>
            {previewLogos.length ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <p className="p-8 text-center text-zinc-500">Select logos to preview.</p>}
          </div>

          {/* SAVE LIVE EMBED */}
          <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="font-medium">Live embed (auto-updates)</p>
            <div className="flex flex-wrap items-center gap-2">
              <input value={embedName} onChange={(e) => setEmbedName(e.target.value)} placeholder="Name e.g. Homepage carousel" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
              <button onClick={saveEmbed} disabled={saving || !chosen.length || !embedName} className="rounded-lg bg-fire px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {saving ? "Saving…" : editingSlug ? "Update embed" : "Save embed"}
              </button>
            </div>
            {saveResult?.error && <p className="text-sm text-fire">{saveResult.error}</p>}
            {liveCode && (
              <div className="space-y-2">
                <p className="text-sm text-green-400">Saved as <code>{saveResult!.slug}</code>. Paste this on your site:</p>
                <textarea readOnly value={liveCode} className="h-24 w-full rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-300" />
                <button onClick={() => copy(liveCode, "live")} className="rounded-lg bg-glass px-3 py-1.5 text-sm font-medium text-black">{copied === "live" ? "Copied!" : "Copy live embed"}</button>
                <p className="text-xs text-zinc-500">Edit it anytime here and re-save — sites using it update automatically. (Requires embed.js on the <code>{branch}</code> branch.)</p>
              </div>
            )}
          </div>

          <details className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <summary className="cursor-pointer text-sm font-medium">Static (frozen) HTML snippet</summary>
            <textarea readOnly value={staticCode} className="mt-3 h-64 w-full rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-300" />
            <button onClick={() => copy(staticCode, "static")} className="mt-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:border-glass">{copied === "static" ? "Copied!" : "Copy static HTML"}</button>
            <p className="mt-2 text-xs text-zinc-500">Self-contained — won&rsquo;t change when you add logos. Loads from <code>raw.githubusercontent.com/{repo}</code> (repo must be public).</p>
          </details>
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
