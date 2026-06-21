"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  imageToCanvas,
  loadImage,
  looksLikeSolidBackground,
  hasTransparency,
  removeBackground,
  canvasToBase64,
  canvasToDataUrl,
  type BgRemovalMode,
} from "@/lib/image";
import { buildAll, type BuildResult } from "@/lib/pipeline";
import { defaultAlt, defaultTitle, slugify, variantFileName } from "@/lib/slug";
import type {
  ClientLogoMeta,
  ClientManifest,
  LogoCandidate,
  RenderedFile,
  VariantName,
} from "@/lib/types";

const ALL_VARIANTS: VariantName[] = ["color", "white", "black"];
const ALL_SIZES = ["@1x", "@2x", "@3x"];

function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  c.getContext("2d")!.drawImage(src, 0, 0);
  return c;
}

export default function IntakePage() {
  // Search
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<LogoCandidate[]>([]);
  const [sourcesInfo, setSourcesInfo] = useState<Record<string, unknown> | null>(null);
  const [urlInput, setUrlInput] = useState("");

  // Selected source
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sourceLoaded, setSourceLoaded] = useState(false);
  const [loadingSource, setLoadingSource] = useState(false);
  const [sourceErr, setSourceErr] = useState<string | null>(null);

  // Metadata
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [alt, setAlt] = useState("");
  const [title, setTitle] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [altEdited, setAltEdited] = useState(false);

  // Options
  const [removeBg, setRemoveBg] = useState(false);
  const [tolerance, setTolerance] = useState(10);
  const [bgMode, setBgMode] = useState<BgRemovalMode>("edges");
  const [variants, setVariants] = useState<VariantName[]>([...ALL_VARIANTS]);
  const [sizes, setSizes] = useState<string[]>([...ALL_SIZES]);
  const [padding, setPadding] = useState(8);
  const [fitToLogo, setFitToLogo] = useState(false);
  const [preserveDetail, setPreserveDetail] = useState(true);

  // Build output
  const [build, setBuild] = useState<BuildResult | null>(null);

  // Publish
  const [branch, setBranch] = useState("");
  const [toMain, setToMain] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ htmlUrl?: string; error?: string } | null>(null);

  const slug = useMemo(() => slugify(name || "logo"), [name]);

  // Keep alt/title/branch in sync with the name until the user edits alt.
  useEffect(() => {
    if (!altEdited) {
      setAlt(name ? defaultAlt(name) : "");
      setTitle(name ? defaultTitle(name) : "");
    }
    setBranch(`logo-intake/${slugify(name || "client")}`);
  }, [name, altEdited, slug]);

  const runSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setCandidates([]);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCandidates(data.candidates || []);
      setSourcesInfo(data.sources || null);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const adoptSource = useCallback(
    async (canvas: HTMLCanvasElement, meta: Partial<LogoCandidate>) => {
      sourceCanvasRef.current = canvas;
      setSourceLoaded(true);
      const ctx = canvas.getContext("2d")!;
      const transparent = hasTransparency(ctx, canvas.width, canvas.height);
      const solid = !transparent && looksLikeSolidBackground(canvas);
      // Auto-enable background removal for JPEGs / opaque solid-bg sources.
      setRemoveBg(!transparent && (solid || meta.format === "jpeg" || meta.format === "jpg"));
      if (meta.name) setName((n) => n || meta.name!);
      if (meta.domain) setDomain(meta.domain);
      if (meta.source) setSourceLabel(meta.source);
      if (meta.imageUrl) setSourceUrl(meta.imageUrl);
    },
    [],
  );

  const selectCandidate = useCallback(
    async (c: LogoCandidate) => {
      setLoadingSource(true);
      setSourceErr(null);
      try {
        const img = await loadImage(c.imageUrl, true);
        const canvas = imageToCanvas(img);
        setName(c.name || "");
        await adoptSource(canvas, c);
      } catch {
        setSourceErr("Couldn't load that image. Try another candidate or upload a file.");
      } finally {
        setLoadingSource(false);
      }
    },
    [adoptSource],
  );

  const onUpload = useCallback(
    async (file: File) => {
      setLoadingSource(true);
      setSourceErr(null);
      try {
        const url = URL.createObjectURL(file);
        const img = await loadImage(url, false);
        const canvas = imageToCanvas(img);
        URL.revokeObjectURL(url);
        const isJpeg = /jpe?g$/i.test(file.type) || /\.jpe?g$/i.test(file.name);
        await adoptSource(canvas, {
          source: "upload",
          format: isJpeg ? "jpeg" : file.name.split(".").pop(),
          imageUrl: file.name,
        });
      } catch {
        setSourceErr("Couldn't read that file.");
      } finally {
        setLoadingSource(false);
      }
    },
    [adoptSource],
  );

  const loadFromUrl = useCallback(async () => {
    if (!urlInput.trim()) return;
    await selectCandidate({
      id: "url",
      source: "url",
      name: name || "",
      imageUrl: urlInput.trim(),
      format: urlInput.endsWith(".jpg") || urlInput.endsWith(".jpeg") ? "jpeg" : "png",
    });
  }, [urlInput, name, selectCandidate]);

  // Rebuild variants whenever source or options change.
  useEffect(() => {
    const src = sourceCanvasRef.current;
    if (!src || !sourceLoaded) {
      setBuild(null);
      return;
    }
    const master = cloneCanvas(src);
    if (removeBg) removeBackground(master, tolerance, bgMode);
    const result = buildAll(master, {
      variants,
      sizeLabels: sizes,
      paddingRatio: padding / 100,
      fitToLogo,
      preserveDetail,
    });
    setBuild(result);
  }, [sourceLoaded, removeBg, tolerance, bgMode, variants, sizes, padding, fitToLogo, preserveDetail]);

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const publish = useCallback(async () => {
    if (!build || !build.variants.length) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const folder = `Client Logos/${name}`;
      const files: RenderedFile[] = [];
      for (const v of build.variants) {
        for (const s of v.sizes) {
          files.push({
            path: `${folder}/${variantFileName(slug, v.variant, s.label)}`,
            base64: canvasToBase64(s.canvas, "image/png"),
          });
        }
      }

      // Sidecar metadata.
      const meta: ClientLogoMeta = {
        name,
        slug,
        domain: domain || undefined,
        alt,
        title,
        source: sourceLabel || "upload",
        sourceUrl: sourceUrl || undefined,
        variants: build.variants.map((v) => v.variant),
        sizes,
        box: { width: 150, height: 50 },
        addedAt: new Date().toISOString(),
      };
      files.push({
        path: `${folder}/${slug}.json`,
        base64: btoa(unescape(encodeURIComponent(JSON.stringify(meta, null, 2)))),
      });

      // Merge into the root manifest.
      const mres = await fetch("/api/manifest");
      const mdata = await mres.json();
      const existing: ClientManifest = mdata.manifest || {
        generator: "glassfire-logo-studio",
        updatedAt: "",
        clients: [],
      };
      const others = (existing.clients || []).filter((c) => c.slug !== slug);
      const manifest: ClientManifest = {
        generator: "glassfire-logo-studio",
        updatedAt: new Date().toISOString(),
        clients: [...others, meta].sort((a, b) => a.name.localeCompare(b.name)),
      };
      files.push({
        path: "client-logos.json",
        base64: btoa(unescape(encodeURIComponent(JSON.stringify(manifest, null, 2)))),
      });

      const targetBranch = toMain ? mdata.branch || "main" : branch;
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files,
          message: `Add ${name} client logo (${build.variants.map((v) => v.variant).join("/")})`,
          branch: targetBranch,
          createBranch: true,
        }),
      });
      const data = await res.json();
      if (res.ok) setPublishResult({ htmlUrl: data.htmlUrl });
      else setPublishResult({ error: data.error || "Publish failed." });
    } catch (e) {
      setPublishResult({ error: e instanceof Error ? e.message : "Publish failed." });
    } finally {
      setPublishing(false);
    }
  }, [build, name, slug, domain, alt, title, sourceLabel, sourceUrl, sizes, toMain, branch]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Logo Intake</h1>

      {/* SEARCH */}
      <section className="space-y-3">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Search a client — e.g. Coca Cola, Walmart, nfl.com"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-glass"
          />
          <button
            onClick={runSearch}
            disabled={searching}
            className="rounded-lg bg-glass px-4 font-medium text-black disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>

        {sourcesInfo && (
          <p className="text-xs text-zinc-500">
            Brandfetch: {String(sourcesInfo.brandfetch)} · Clearbit: {String(sourcesInfo.clearbit)} · Google:{" "}
            {String(sourcesInfo.google)}
            {!sourcesInfo.brandfetchConfigured && " · (Brandfetch key not set)"}
            {!sourcesInfo.googleConfigured && " · (Google CSE not set)"}
          </p>
        )}

        {candidates.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {candidates.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCandidate(c)}
                className="checker flex aspect-[3/2] items-center justify-center rounded-lg border border-zinc-700 p-2 transition hover:border-glass"
                title={`${c.name} · ${c.source}${c.kind ? ` · ${c.kind}` : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/image-proxy?url=${encodeURIComponent(c.imageUrl)}`}
                  alt={c.name}
                  className="max-h-full max-w-full object-contain"
                />
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-2 hover:border-glass">
            Upload file
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            />
          </label>
          <span className="text-zinc-600">or</span>
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste an image URL"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-glass"
          />
          <button onClick={loadFromUrl} className="rounded-lg border border-zinc-700 px-3 py-2 hover:border-glass">
            Load
          </button>
        </div>
        {loadingSource && <p className="text-sm text-zinc-400">Loading image…</p>}
        {sourceErr && <p className="text-sm text-fire">{sourceErr}</p>}
      </section>

      {sourceLoaded && (
        <>
          {/* OPTIONS */}
          <section className="grid gap-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} />
                  Remove background (for JPEGs / solid backgrounds)
                </label>
                {removeBg && (
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="text-sm text-zinc-400">Tolerance: {tolerance}%</label>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={tolerance}
                        onChange={(e) => setTolerance(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <div className="flex gap-2">
                        {(["edges", "all"] as BgRemovalMode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => setBgMode(m)}
                            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${
                              bgMode === m ? "border-glass bg-glass/10 text-white" : "border-zinc-700 text-zinc-400"
                            }`}
                          >
                            {m === "edges" ? "Edges only" : "All matching color"}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-zinc-600">
                        {bgMode === "edges"
                          ? "Removes background from the outside in; keeps same-colored shapes inside the logo."
                          : "Removes the background color everywhere — including pockets trapped inside the logo."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="font-medium">Variants</p>
                <div className="mt-2 flex gap-2">
                  {ALL_VARIANTS.map((v) => (
                    <button
                      key={v}
                      onClick={() => toggle(variants, v, setVariants)}
                      className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                        variants.includes(v) ? "border-glass bg-glass/10 text-white" : "border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <label className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                  <input type="checkbox" checked={preserveDetail} onChange={(e) => setPreserveDetail(e.target.checked)} />
                  Preserve inner detail in white/black
                </label>
                <p className="text-xs text-zinc-600">
                  Keeps internal detail (e.g. the lettering inside a badge) by knocking it out
                  instead of flattening to a solid shape. Turn off for a plain silhouette.
                </p>
              </div>

              <div>
                <p className="font-medium">Sizes</p>
                <div className="mt-2 flex gap-2">
                  {ALL_SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggle(sizes, s, setSizes)}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        sizes.includes(s) ? "border-glass bg-glass/10 text-white" : "border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {s} ({150 * (ALL_SIZES.indexOf(s) + 1)}×{50 * (ALL_SIZES.indexOf(s) + 1)})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-medium">Box shape</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setFitToLogo(false)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${!fitToLogo ? "border-glass bg-glass/10 text-white" : "border-zinc-700 text-zinc-400"}`}
                  >
                    Standard 3:1
                  </button>
                  <button
                    onClick={() => setFitToLogo(true)}
                    className={`rounded-lg border px-3 py-1.5 text-sm ${fitToLogo ? "border-glass bg-glass/10 text-white" : "border-zinc-700 text-zinc-400"}`}
                  >
                    Fit to logo
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-600">
                  {fitToLogo
                    ? "Box width follows the logo's shape — fills edge-to-edge with no cropping or dead space."
                    : "Fixed 3:1 box (matches the existing library). Wide logos leave space top/bottom."}
                </p>
              </div>

              <div>
                <label className="text-sm text-zinc-400">
                  Padding inside box: {padding}%{padding < 0 && " (overscan — bleeds past the box)"}
                </label>
                <input
                  type="range"
                  min={-25}
                  max={25}
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-zinc-600">
                  Negative bleeds the logo past the box edges (crops the long side). To fill
                  without cropping, use &ldquo;Fit to logo&rdquo; above.
                </p>
              </div>
            </div>

            {/* METADATA */}
            <div className="space-y-3">
              <div>
                <label className="text-sm text-zinc-400">Client name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-glass"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Alt text (SEO)</label>
                <input
                  value={alt}
                  onChange={(e) => {
                    setAlt(e.target.value);
                    setAltEdited(true);
                  }}
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-glass"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-zinc-400">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-glass"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-400">Domain</label>
                  <input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-glass"
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Files will be saved as <code className="text-zinc-400">Client Logos/{name || "Name"}/{slug}-&lt;variant&gt;.png</code>
              </p>
            </div>
          </section>

          {/* PREVIEW */}
          {build && build.variants.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Preview</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {build.variants.map((v) => {
                  const largest = v.sizes[v.sizes.length - 1];
                  const onDark = v.variant !== "black";
                  return (
                    <div key={v.variant} className="space-y-2">
                      <p className="text-sm capitalize text-zinc-400">{v.variant}</p>
                      <div
                        className={`flex h-28 items-center justify-center rounded-lg border border-zinc-700 ${
                          onDark ? "bg-zinc-900" : "bg-zinc-200"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={canvasToDataUrl(largest.canvas)} alt={`${name} ${v.variant}`} className="max-h-20" />
                      </div>
                      <p className="text-xs text-zinc-600">{v.sizes.map((s) => s.label).join(" · ")}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* PUBLISH */}
          <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="text-lg font-semibold">Publish to repo</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={toMain} onChange={(e) => setToMain(e.target.checked)} />
                Commit directly to main
              </label>
              {!toMain && (
                <>
                  <span className="text-zinc-500">Branch:</span>
                  <input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 outline-none focus:border-glass"
                  />
                </>
              )}
            </div>
            <button
              onClick={publish}
              disabled={publishing || !build?.variants.length || !name}
              className="rounded-lg bg-fire px-5 py-2 font-medium text-white disabled:opacity-50"
            >
              {publishing ? "Publishing…" : "Publish logo set"}
            </button>
            {publishResult?.htmlUrl && (
              <p className="text-sm text-green-400">
                Published ·{" "}
                <a className="underline" href={publishResult.htmlUrl} target="_blank" rel="noreferrer">
                  view commit
                </a>
              </p>
            )}
            {publishResult?.error && <p className="text-sm text-fire">{publishResult.error}</p>}
          </section>
        </>
      )}
    </div>
  );
}
