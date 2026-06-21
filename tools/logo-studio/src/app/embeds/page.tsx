"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { liveEmbedCode, staticMarkupFromConfig } from "@/lib/embed";
import { useClients } from "@/lib/useClients";
import type { EmbedConfig, TestimonialEmbedConfig } from "@/lib/types";

type AnyEmbed = EmbedConfig | TestimonialEmbedConfig;

export default function EmbedsPage() {
  const { repo, branch } = useClients();
  const [items, setItems] = useState<AnyEmbed[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/folder?path=${encodeURIComponent("Embeds")}`);
      const { files } = (await res.json()) as { files?: string[] };
      const configs = await Promise.all(
        (files || []).filter((f) => f.endsWith(".json")).map(async (f) => {
          const r = await fetch(`/api/asset?path=${encodeURIComponent(f)}`);
          return r.ok ? ((await r.json()) as AnyEmbed) : null;
        }),
      );
      setItems(configs.filter(Boolean) as AnyEmbed[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  async function remove(cfg: AnyEmbed) {
    if (!confirm(`Delete embed "${cfg.name}"? Sites using it will stop rendering.`)) return;
    setBusy(cfg.slug);
    setMsg(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [], deletes: [`Embeds/${cfg.slug}.json`], message: `Remove embed: ${cfg.slug}`, branch, createBranch: false }),
      });
      const data = await res.json();
      if (res.ok) await load();
      else setMsg(data.error);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saved Embeds</h1>
      <p className="text-sm text-zinc-400">Live carousels, grids &amp; testimonials. Edit one and re-save, and every site using it updates automatically.</p>
      {msg && <p className="text-sm text-fire">{msg}</p>}
      {loading && <p className="text-sm text-zinc-500">Loading…</p>}
      {!loading && !items.length && <p className="text-sm text-zinc-500">No saved embeds yet. Create one in the Carousel or Grid builder.</p>}

      <div className="space-y-4">
        {items.map((cfg) => {
          const code = liveEmbedCode(cfg.slug, repo, branch);
          const staticHtml = staticMarkupFromConfig(cfg, repo, branch);
          const count = cfg.type === "testimonial" ? `${cfg.items.length} testimonials` : `${cfg.logos.length} logos`;
          const editHref = cfg.type === "testimonial" ? "/testimonials" : `/${cfg.type}?embed=${cfg.slug}`;
          return (
            <div key={cfg.slug} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{cfg.name} <span className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs capitalize text-zinc-400">{cfg.type}</span></p>
                  <p className="text-xs text-zinc-600">{count} · <code>{cfg.slug}</code></p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Link href={editHref} className="rounded-lg border border-zinc-700 px-3 py-1.5 hover:border-glass">Edit</Link>
                  <button onClick={() => remove(cfg)} disabled={busy === cfg.slug} className="rounded-lg border border-fire/40 px-3 py-1.5 text-fire hover:bg-fire/10 disabled:opacity-50">Delete</button>
                </div>
              </div>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Live embed (auto-updates)</p>
              <textarea readOnly value={code} className="mt-1 h-20 w-full rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-300" />
              <button onClick={() => copy(code, cfg.slug)} className="mt-2 rounded-lg bg-glass px-3 py-1.5 text-sm font-medium text-black">{copied === cfg.slug ? "Copied!" : "Copy live embed"}</button>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-zinc-500">Full static HTML (best for SEO — paste &amp; replace)</summary>
                <textarea readOnly value={staticHtml} className="mt-2 h-48 w-full rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-300" />
                <button onClick={() => copy(staticHtml, `${cfg.slug}-static`)} className="mt-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:border-glass">{copied === `${cfg.slug}-static` ? "Copied!" : "Copy full static HTML"}</button>
                <p className="mt-1 text-xs text-zinc-600">Re-save this embed after editing, then copy this and replace the old block on your page. Images served via jsDelivr CDN.</p>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
