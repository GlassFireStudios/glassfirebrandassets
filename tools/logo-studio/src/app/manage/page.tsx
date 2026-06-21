"use client";

import { useCallback, useEffect, useState } from "react";
import { imageToCanvas, loadImage, canvasToBase64 } from "@/lib/image";
import { buildAll } from "@/lib/pipeline";
import { slugify, variantFileName } from "@/lib/slug";
import type { ClientLogoMeta, ClientManifest, RenderedFile, VariantName } from "@/lib/types";

interface DiscoveredClient {
  name: string;
  slug?: string;
  alt?: string;
  variants: Partial<Record<VariantName, string>>;
  legacy?: boolean;
}

const ALL_SIZES = ["@1x", "@2x", "@3x"];

export default function ManagePage() {
  const [clients, setClients] = useState<DiscoveredClient[]>([]);
  const [branch, setBranch] = useState("main");
  const [toMain, setToMain] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; url?: string; error?: boolean } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/manifest");
    const data = await res.json();
    if (data.error) { setMsg({ text: data.error, error: true }); return; }
    setClients(data.clients || []);
    setBranch(data.branch || "main");
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

  // Generate the missing white/black variants from an existing source.
  const backfill = useCallback(async (c: DiscoveredClient) => {
    setBusy(c.name);
    setMsg(null);
    try {
      const present = Object.keys(c.variants) as VariantName[];
      const missing = (["white", "black"] as VariantName[]).filter((v) => !present.includes(v));
      if (!missing.length) { setMsg({ text: `${c.name} already has white + black.` }); return; }

      // Pick the best source: prefer color, then white, then black.
      const srcVariant = (["color", "white", "black"] as VariantName[]).find((v) => present.includes(v))!;

      // Find the highest-resolution source file in the folder.
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
      for (const v of result.variants) {
        for (const s of v.sizes) {
          writes.push({ path: `${folder}/${variantFileName(slug, v.variant, s.label)}`, base64: canvasToBase64(s.canvas) });
        }
      }

      // Update the manifest entry's variant list.
      const manifest = await getManifest();
      const idx = manifest.clients.findIndex((m) => m.slug === slug || m.name === c.name);
      const merged = new Set<VariantName>([...present, ...missing]);
      if (idx >= 0) {
        manifest.clients[idx].variants = [...merged];
      } else {
        const meta: ClientLogoMeta = {
          name: c.name, slug, alt: c.alt || `${c.name} logo — GlassFire client`, title: `${c.name} logo`,
          source: "backfill", variants: [...merged], sizes: ALL_SIZES, box: { width: 150, height: 50 }, addedAt: new Date().toISOString(),
        };
        manifest.clients.push(meta);
      }
      manifest.updatedAt = new Date().toISOString();
      writes.push({ path: "client-logos.json", base64: btoa(unescape(encodeURIComponent(JSON.stringify(manifest, null, 2)))) });

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

  const remove = useCallback(async (c: DiscoveredClient) => {
    if (!confirm(`Delete all logo files for "${c.name}"? This removes them from the repo.`)) return;
    setBusy(c.name);
    setMsg(null);
    try {
      let deletes: string[] = [];
      if (c.legacy) {
        deletes = Object.values(c.variants).filter(Boolean) as string[];
      } else {
        const folderRes = await fetch(`/api/folder?path=${encodeURIComponent(`Client Logos/${c.name}`)}`);
        const { files } = (await folderRes.json()) as { files: string[] };
        deletes = files;
      }
      if (!deletes.length) throw new Error("No files found to delete.");

      const slug = c.slug || slugify(c.name);
      const manifest = await getManifest();
      manifest.clients = manifest.clients.filter((m) => m.slug !== slug && m.name !== c.name);
      manifest.updatedAt = new Date().toISOString();
      const writes: RenderedFile[] = [{ path: "client-logos.json", base64: btoa(unescape(encodeURIComponent(JSON.stringify(manifest, null, 2)))) }];

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
      <p className="text-sm text-zinc-500">
        {toMain ? `Changes commit to ${branch}.` : "Changes commit to a logo-management branch for review."}
      </p>

      {msg && (
        <p className={`text-sm ${msg.error ? "text-fire" : "text-green-400"}`}>
          {msg.text} {msg.url && <a className="underline" href={msg.url} target="_blank" rel="noreferrer">view commit</a>}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/60 text-left text-zinc-400">
            <tr>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Variants</th>
              <th className="px-4 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => {
              const present = Object.keys(c.variants) as VariantName[];
              const missingBW = (["white", "black"] as VariantName[]).filter((v) => !present.includes(v));
              const colorMissing = !present.includes("color");
              return (
                <tr key={c.name} className="border-t border-zinc-800">
                  <td className="px-4 py-2">{c.name}{c.legacy && <span className="ml-1 text-xs text-zinc-600">(legacy)</span>}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1.5">
                      {(["color", "white", "black"] as VariantName[]).map((v) => (
                        <span key={v} className={`rounded px-1.5 py-0.5 text-xs capitalize ${present.includes(v) ? "bg-glass/15 text-glass" : "bg-zinc-800 text-zinc-600"}`}>{v}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-2">
                      {missingBW.length > 0 && (
                        <button
                          onClick={() => backfill(c)}
                          disabled={busy === c.name}
                          className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs hover:border-glass disabled:opacity-50"
                          title={`Generate ${missingBW.join(" + ")} from existing artwork`}
                        >
                          {busy === c.name ? "Working…" : `Add ${missingBW.join("/")}`}
                        </button>
                      )}
                      {colorMissing && (
                        <span className="text-xs text-zinc-600" title="Color can't be reconstructed from a silhouette — re-add via Intake.">color needs intake</span>
                      )}
                      <button
                        onClick={() => remove(c)}
                        disabled={busy === c.name}
                        className="rounded-lg border border-fire/40 px-2.5 py-1 text-xs text-fire hover:bg-fire/10 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!clients.length && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-zinc-500">No client logos found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
