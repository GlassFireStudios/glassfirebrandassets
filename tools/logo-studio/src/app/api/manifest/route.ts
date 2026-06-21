import { NextResponse } from "next/server";
import { getConfig, getTextFile, listDir } from "@/lib/github";
import type { ClientManifest, VariantName } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DiscoveredClient {
  name: string;
  slug?: string;
  alt?: string;
  variants: Partial<Record<VariantName, string>>; // variant -> repo path (@1x)
  legacy?: boolean;
}

// Discover every client logo currently in the repo by scanning "Client Logos".
// New clients live in per-client folders; legacy ones are flat white PNGs.
export async function GET() {
  let branch = "main";
  let repo = "GlassFireStudios/glassfirebrandassets";
  try {
    const cfg = getConfig();
    branch = cfg.baseBranch;
    repo = `${cfg.owner}/${cfg.repo}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "GitHub not configured.";
    return NextResponse.json({ error: msg, clients: [] }, { status: 500 });
  }

  const manifestText = await getTextFile("client-logos.json");
  let manifest: ClientManifest | null = null;
  try {
    manifest = manifestText ? (JSON.parse(manifestText) as ClientManifest) : null;
  } catch {
    manifest = null;
  }
  const metaByName = new Map((manifest?.clients || []).map((c) => [c.name, c]));

  const entries = await listDir("Client Logos");
  const clients: DiscoveredClient[] = [];

  for (const e of entries) {
    if (e.type === "dir") {
      const files = await listDir(e.path);
      const variants: Partial<Record<VariantName, string>> = {};
      for (const f of files) {
        if (!/\.png$/i.test(f.name)) continue;
        if (/@[23]x/i.test(f.name)) continue; // canonical @1x only
        const m = f.name.match(/-(color|white|black)\.png$/i);
        if (m) variants[m[1].toLowerCase() as VariantName] = f.path;
      }
      if (Object.keys(variants).length) {
        const meta = metaByName.get(e.name);
        clients.push({ name: e.name, slug: meta?.slug, alt: meta?.alt, variants });
      }
    } else if (/\.png$/i.test(e.name) && !e.name.startsWith(".")) {
      clients.push({
        name: e.name.replace(/\.png$/i, ""),
        variants: { white: e.path },
        legacy: true,
      });
    }
  }

  clients.sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ branch, repo, clients, manifest });
}
