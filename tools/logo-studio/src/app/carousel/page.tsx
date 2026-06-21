"use client";

import { useMemo, useState } from "react";
import { useClients } from "@/lib/useClients";
import LogoOrderPanel from "@/components/LogoOrderPanel";
import { carouselMarkup, rawUrl, type CarouselLogo, type CarouselOptions } from "@/lib/embed";
import type { ClientEntry, VariantName } from "@/lib/types";

export default function CarouselPage() {
  const { clients, branch, repo, error } = useClients();
  const [order, setOrder] = useState<string[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [variant, setVariant] = useState<VariantName>("white");

  const [height, setHeight] = useState(44);
  const [gap, setGap] = useState(72);
  const [duration, setDuration] = useState(40);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [grayscale, setGrayscale] = useState(true);
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [edgeFade, setEdgeFade] = useState(true);
  const [background, setBackground] = useState("transparent");
  const [padding, setPadding] = useState(24);
  const [previewBg, setPreviewBg] = useState("#0b0b0d");
  const [copied, setCopied] = useState(false);

  // Seed selection once clients load.
  if (!seeded && clients.length) {
    setOrder(clients.map((c) => c.name));
    setSeeded(true);
  }

  function resolvePath(c: ClientEntry): string | undefined {
    return c.variants[variant] || c.variants.white || c.variants.color || c.variants.black;
  }

  const opts: CarouselOptions = { height, gap, duration, direction, grayscale, pauseOnHover, background, edgeFade, padding };

  const chosen = useMemo(
    () => order.map((n) => clients.find((c) => c.name === n)).filter(Boolean) as ClientEntry[],
    [order, clients],
  );

  // Preview uses same-origin proxied URLs (works even for a private repo).
  const previewLogos: CarouselLogo[] = chosen
    .map((c) => { const p = resolvePath(c); return p ? { url: `/api/asset?path=${encodeURIComponent(p)}`, alt: c.alt || `${c.name} logo` } : null; })
    .filter(Boolean) as CarouselLogo[];

  // Embed snippet uses public raw URLs so it loads on an external site.
  const embedLogos: CarouselLogo[] = chosen
    .map((c) => { const p = resolvePath(c); return p ? { url: rawUrl(repo, branch, p), alt: c.alt || `${c.name} logo` } : null; })
    .filter(Boolean) as CarouselLogo[];

  const previewHtml = useMemo(() => carouselMarkup(previewLogos, opts), [previewLogos, opts]);
  const embedCode = useMemo(() => carouselMarkup(embedLogos, opts), [embedLogos, opts]);

  async function copy() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const blob = new Blob([
      `<!doctype html><html><head><meta charset="utf-8"><title>Logo carousel</title></head><body style="margin:0;background:${previewBg}">\n${embedCode}\n</body></html>`,
    ], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "glassfire-logo-carousel.html";
    a.click();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Carousel Builder</h1>
      <p className="text-sm text-zinc-400">
        An embeddable auto-scrolling logo strip for your website. Configure it, copy the snippet,
        and paste it into any page.
      </p>
      {error && <p className="text-sm text-fire">{error}</p>}

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

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} /> Grayscale → color on hover</label>
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
            Preview background:
            {["#0b0b0d", "#ffffff", "#EE2750", "#00A8E4"].map((c) => (
              <button key={c} onClick={() => setPreviewBg(c)} className={`h-5 w-5 rounded border ${previewBg === c ? "border-glass" : "border-zinc-700"}`} style={{ background: c }} />
            ))}
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-800" style={{ background: previewBg }}>
            {previewLogos.length ? (
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <p className="p-8 text-center text-zinc-500">Select logos to preview the carousel.</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={copy} disabled={!embedLogos.length} className="rounded-lg bg-glass px-4 py-2 font-medium text-black disabled:opacity-50">{copied ? "Copied!" : "Copy embed code"}</button>
            <button onClick={download} disabled={!embedLogos.length} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-glass">Download .html</button>
          </div>

          <details className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <summary className="cursor-pointer text-sm font-medium">Embed code</summary>
            <textarea readOnly value={embedCode} className="mt-3 h-64 w-full rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-300" />
            <p className="mt-2 text-xs text-zinc-500">
              The snippet loads logos from <code>raw.githubusercontent.com/{repo}</code>. The repo
              must be <strong>public</strong> for these to display on an external site; if it&rsquo;s
              private, make it public or host the logo files elsewhere.
            </p>
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
