"use client";

import { useCallback, useEffect, useState } from "react";
import { imageToCanvas, loadImage, canvasToBase64 } from "@/lib/image";
import { buildAll } from "@/lib/pipeline";
import { defaultAlt, defaultTitle, slugify, variantFileName } from "@/lib/slug";
import type { ClientEntry, ClientLogoMeta, ClientManifest, RenderedFile, VariantName } from "@/lib/types";

const ALL_SIZES = ["@1x", "@2x", "@3x"];

function enc(obj: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj, null, 2))));
}

export default function ManagePage() {
  const [clients, setClients] = useState<ClientEntry[]>([]);
  const [meta, setMeta] = useState<Record<string, ClientLogoMeta>>({});
  const [branch, setBranch] = useState("main");
  const [toMain, setToMain] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; url?: string; error?: boolean } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<{ alt: string; title: string; domain: string }>({ alt: "", title: "", domain: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/manifest");
    const data = await res.json();
    if (data.error) { setMsg({ text: data.error, error: true }); return; }
    setClients(data.clients || []);
    setBranch(data.branch || "main");
    const m: Record<string, ClientLogoMeta> = {};
    for (const c of (data.manifest?.clients || []) as ClientLogoMeta[]) m[c.slug || c.name] = c;
    setMeta(m);
  }, []);

  useEffect(() => { load(); }, [load]);

  function targetBranch(): { branch: string; createBranch: boolean } {
    return toMain ? { branch, createBranch: false } : { branch: "logo-management", createBranch: true };
  }

  async function getManifest(): Promise<ClientManifest> {
    const res = await fetch("/api/manifest");
    const data = await res.json();
    return data.manifest || { generator: "glassfire-logo-studio", updatedAt: "", clients: [] };
  }

  function metaFor(c: ClientEntry): ClientLogoMeta | undefined {
    return meta[c.slug || slugify(c.name)] || meta[c.name];
  }

  function thumbPath(c: ClientEntry): string | undefined {
    return c.variants.white || c.variants.color || c.variants.black;
  }

  function startEdit(c: ClientEntry) {
    const m = metaFor(c);
    setEditing(c.name);
    setForm({
      alt: m?.alt || defaultAlt(c.name),
      title: m?.title || defaultTitle(c.name),
      domain: m?.domain || "",
    });
  }

  const saveMeta = useCallback(async (c: ClientEntry) => {
    setBusy(c.name);
    setMsg(null);
    try {
      const slug = c.slug || slugify(c.name);
      const manifest = await getManifest();
      const idx = manifest.clients.findIndex((m) => m.slug === slug || m.name === c.name);
      const base: ClientLogoMeta = idx >= 0 ? manifest.clients[idx] : {
        name: c.name, slug, alt: "", title: "", source: "edit",
        variants: Object.keys(c.variants) as VariantName[], sizes: ALL_SIZES,
        box: { width: 150, height: 50 }, addedAt: new Date().toISOString(),
      };
      const updated: ClientLogoMeta = { ...base, alt: form.alt, title: form.title, domain: form.domain || undefined };
      if (idx >= 0) manifest.clients[idx] = updated; else manifest.clients.push(updated);
      manifest.updatedAt = new Date().toISOString();

      const writes: RenderedFile[] = [{ path: "client-logos.json", base64: enc(manifest) }];
      if (!c.legacy) writes.push({ path: `Client Logos/${c.name}/${slug}.json`, base64: enc(updated) });

      const { branch: tb, createBranch } = targetBranch();
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: writes, message: `Update ${c.name} metadata`, branch: tb, createBranch }),
      });
      const data = await res.json();
      if (res.ok) { setMsg({ text: `Updated ${c.name} metadata.`, url: data.htmlUrl }); setEditing(null); await load(); }
      else setMsg({ text: data.error, error: true });
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Save failed", error: true });
    } finally {
      setBusy(null);
    }
  }, [form, toMain, branch, load]);

  const backfill = useCallback(async (c: ClientEntry) => {
    setBusy(c.name);
    setMsg(null);
    try {
      const present = Object.keys(c.variants) as VariantName[];
      const missing = (["white", "black"] as VariantName[]).filter((v) => !present.includes(v));
      if (!missing.length) { setMsg({ text: `${c.name} already has white + black.` }); return; }
      const srcVariant = (["color", "white", "black"] as VariantName[]).find((v) => present.includes(v))!;

      const folderRes = await fetch(`/api/folder?path=${encodeURIComponent(`Client Logos/${c.name}`)}`);
      const { files } = (await folderRes.json()) as { files: string[] };
      const srcFiles = files.filter((f) => new RegExp(`-${srcVariant}(@[23]x)?\\.png$`, "i").test(f));
      const pick = srcFiles.find((f) => /@3x/.test(f)) || srcFiles.find((f) => /@2x/.test(f)) || srcFiles[0] || c.variants[srcVariant];
      if (!pick) throw new Error("No source file found.");

      const img = await loadImage(`/api/asset?path=${encodeURIComponent(pick)}`, false);
      const master = imageToCanvas(img);
      const result = buildAll(master, { variants: missing, sizeLabels: ALL_SIZES, paddingRatio: 0.08 });

      const slug = c.slug || slugify(c.name);
      const folder = `Client Logos/${c.name}`;
      const writes: RenderedFile[] = [];
      for (const v of result.variants) for (const s of v.sizes) {
        writes.push({ path: `${folder}/${variantFileName(slug, v.variant, s.label)}`, base64: canvasToBase64(s.canvas) });
      }

      const manifest = await getManifest();
      const idx = manifest.clients.findIndex((m) => m.slug === slug || m.name === c.name);
      const merged = new Set<VariantName>([...present, ...missing]);
      if (idx >= 0) manifest.clients[idx].variants = [...merged];
      else manifest.clients.push({ name: c.name, slug, alt: defaultAlt(c.name), title: defaultTitle(c.name), source: "backfill", variants: [...merged], sizes: ALL_SIZES, box: { width: 150, height: 50 }, addedAt: new Date().toISOString() });
      manifest.updatedAt = new Date().toISOString();
      writes.push({ path: "client-logos.json", base64: enc(manifest) });

      const { branch: tb, createBranch } = targetBranch();
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: writes, message: `Backfill ${missing.join("/")} variants for ${c.name}`, branch: tb, createBranch }),
      });
      const data = await res.json();
      if (res.ok) { setMsg({ text: `Added ${missing.join(" + ")} for ${c.name}.`, url: data.htmlUrl }); await load(); }
      else setMsg({ text: data.error, error: true });
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Backfill failed", error: true });
    } finally {
      setBusy(null);
    }
  }, [toMain, branch, load]);

  const remove = useCallback(async (c: ClientEntry) => {
    if (!confirm(`Delete all logo files for "${c.name}"?`)) return;
    setBusy(c.name);
    setMsg(null);
    try {
      let deletes: string[] = [];
      if (c.legacy) deletes = Object.values(c.variants).filter(Boolean) as string[];
      else {
        const folderRes = await fetch(`/api/folder?path=${encodeURIComponent(`Client Logos/${c.name}`)}`);
        const { files } = (await folderRes.json()) as { files: string[] };
        deletes = files;
      }
      if (!deletes.length) throw new Error("No files found to delete.");

      const slug = c.slug || slugify(c.name);
      const manifest = await getManifest();
      manifest.clients = manifest.clients.filter((m) => m.slug !== slug && m.name !== c.name);
      manifest.updatedAt = new Date().toISOString();
      const writes: RenderedFile[] = [{ path: "client-logos.json", base64: enc(manifest) }];

      const { branch: tb, createBranch } = targetBranch();
      const res = await fetch("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: writes, deletes, message: `Remove ${c.name} client logo`, branch: tb, createBranch }),
      });
      const data = await res.json();
      if (res.ok) { setMsg({ text: `Deleted ${c.name}.`, url: data.htmlUrl }); await load(); }
      else setMsg({ text: data.error, error: true });
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Delete failed", error: true });
    } finally {
      setBusy(null);
    }
  }, [toMain, branch, load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Logo Management</h1>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" checked={toMain} onChange={(e) => setToMain(e.target.checked)} />
          Commit directly to {branch}
        </label>
      </div>
      <p className="text-sm text-zinc-500">{toMain ? `Changes commit to ${branch}.` : "Changes commit to a logo-management branch for review."}</p>

      {msg && <p className={`text-sm ${msg.error ? "text-fire" : "text-green-400"}`}>{msg.text} {msg.url && <a className="underline" href={msg.url} target="_blank" rel="noreferrer">view commit</a>}</p>}

      <div className="space-y-2">
        {clients.map((c) => {
          const present = Object.keys(c.variants) as VariantName[];
          const missingBW = (["white", "black"] as VariantName[]).filter((v) => !present.includes(v));
          const colorMissing = !present.includes("color");
          const tp = thumbPath(c);
          const isEditing = editing === c.name;
          const m = metaFor(c);
          return (
            <div key={c.name} className="rounded-xl border border-zinc-800 bg-zinc-900/30">
              <div className="flex items-center gap-4 p-3">
                <div className="checker flex h-12 w-24 flex-none items-center justify-center rounded-md">
                  {tp ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/asset?path=${encodeURIComponent(tp)}`} alt={m?.alt || c.name} className="max-h-9 max-w-[88px] object-contain" />
                  ) : <span className="text-xs text-zinc-600">—</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}{c.legacy && <span className="ml-1 text-xs text-zinc-600">(legacy)</span>}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {(["color", "white", "black"] as VariantName[]).map((v) => (
                      <span key={v} className={`rounded px-1.5 py-0.5 text-xs capitalize ${present.includes(v) ? "bg-glass/15 text-glass" : "bg-zinc-800 text-zinc-600"}`}>{v}</span>
                    ))}
                    {m?.alt && <span className="ml-1 truncate text-xs text-zinc-500">{m.alt}</span>}
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <button onClick={() => (isEditing ? setEditing(null) : startEdit(c))} disabled={busy === c.name} className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs hover:border-glass disabled:opacity-50">{isEditing ? "Close" : "Edit"}</button>
                  {missingBW.length > 0 && <button onClick={() => backfill(c)} disabled={busy === c.name} className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs hover:border-glass disabled:opacity-50">{busy === c.name ? "…" : `Add ${missingBW.join("/")}`}</button>}
                  {colorMissing && <span className="text-xs text-zinc-600" title="Color can't be reconstructed from a silhouette — re-add via Intake.">color needs intake</span>}
                  <button onClick={() => remove(c)} disabled={busy === c.name} className="rounded-lg border border-fire/40 px-2.5 py-1 text-xs text-fire hover:bg-fire/10 disabled:opacity-50">Delete</button>
                </div>
              </div>

              {isEditing && (
                <div className="border-t border-zinc-800 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-500">Alt text (SEO)</label>
                      <input value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-glass" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide text-zinc-500">Title</label>
                      <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-glass" />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-wide text-zinc-500">Domain</label>
                      <input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-glass" />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => saveMeta(c)} disabled={busy === c.name} className="rounded-lg bg-glass px-4 py-1.5 text-sm font-medium text-black disabled:opacity-50">{busy === c.name ? "Saving…" : "Save metadata"}</button>
                    <button onClick={() => setEditing(null)} className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!clients.length && <p className="text-sm text-zinc-500">No client logos found.</p>}
      </div>
    </div>
  );
}
