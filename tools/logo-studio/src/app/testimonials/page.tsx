"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClients } from "@/lib/useClients";
import { slugify } from "@/lib/slug";
import { cdnUrl, CDN_BASE, liveEmbedCode } from "@/lib/embed";
import PageHeading from "@/components/PageHeading";
import { testimonialMarkup, DEFAULT_TESTIMONIAL_OPTIONS, type TestimonialOptions } from "@/lib/testimonial";
import type { ClientEntry, RenderedFile, Testimonial, TestimonialEmbedConfig, TestimonialInvite, TestimonialItem } from "@/lib/types";

type Tab = "links" | "moderate" | "embed" | "deck";

export default function TestimonialsPage() {
  const { clients, branch, repo } = useClients();
  const [tab, setTab] = useState<Tab>("moderate");
  const [pending, setPending] = useState<Testimonial[]>([]);
  const [approved, setApproved] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const logoPath = useCallback((clientName?: string): string | undefined => {
    if (!clientName) return undefined;
    const c = clients.find((x) => x.name === clientName) as ClientEntry | undefined;
    return c ? c.variants.color || c.variants.white || c.variants.black : undefined;
  }, [clients]);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const read = async (folder: string) => {
        const r = await fetch(`/api/folder?path=${encodeURIComponent(folder)}`);
        const { files } = (await r.json()) as { files?: string[] };
        const out = await Promise.all((files || []).filter((f) => f.endsWith(".json")).map(async (f) => {
          const a = await fetch(`/api/asset?path=${encodeURIComponent(f)}`);
          return a.ok ? ((await a.json()) as Testimonial) : null;
        }));
        return out.filter(Boolean) as Testimonial[];
      };
      const [p, a] = await Promise.all([read("Testimonials/pending"), read("Testimonials")]);
      setPending(p.sort((x, y) => y.submittedAt.localeCompare(x.submittedAt)));
      setApproved(a.sort((x, y) => (y.approvedAt || "").localeCompare(x.approvedAt || "")));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLists(); }, [loadLists]);

  async function publish(files: RenderedFile[], deletes: string[], message: string) {
    const res = await fetch("/api/publish", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files, deletes, message, branch, createBranch: false }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Publish failed");
    return data;
  }

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Social Proof" title="Testimonials" sub="Capture client reviews, moderate them, and export polished testimonials for web and decks." />
      <div className="flex gap-2 border-b border-zinc-800 text-sm">
        {(["moderate", "links", "embed", "deck"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-3 py-2 capitalize ${tab === t ? "border-glass text-white" : "border-transparent text-zinc-400"}`}>
            {t === "links" ? "Capture links" : t === "embed" ? "Web embed" : t === "deck" ? "Deck export" : `Moderate${pending.length ? ` (${pending.length})` : ""}`}
          </button>
        ))}
      </div>
      {msg && <p className="text-sm text-fire">{msg}</p>}

      {tab === "links" && <CaptureLinks clients={clients} onCreate={publish} onError={setMsg} />}
      {tab === "moderate" && (
        <Moderate
          pending={pending} approved={approved} loading={loading}
          logoPath={logoPath}
          onApprove={async (t) => {
            try {
              const next: Testimonial = { ...t, status: "approved", approvedAt: new Date().toISOString() };
              await publish(
                [{ path: `Testimonials/${t.slug}.json`, base64: b64(JSON.stringify(next, null, 2)) }],
                [`Testimonials/pending/${t.slug}.json`],
                `Approve testimonial: ${t.company} (${t.name})`,
              );
              await loadLists();
            } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); }
          }}
          onReject={async (t) => {
            if (!confirm(`Reject ${t.name}'s testimonial?`)) return;
            try {
              const dels = [`Testimonials/pending/${t.slug}.json`];
              if (t.headshot) dels.push(t.headshot);
              await publish([], dels, `Reject testimonial: ${t.company} (${t.name})`);
              await loadLists();
            } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); }
          }}
          onDelete={async (t) => {
            if (!confirm(`Delete ${t.name}'s testimonial? This removes it from any live embed.`)) return;
            try {
              const dels = [`Testimonials/${t.slug}.json`];
              if (t.headshot) dels.push(t.headshot);
              await publish([], dels, `Delete testimonial: ${t.company} (${t.name})`);
              await loadLists();
            } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); }
          }}
        />
      )}
      {tab === "embed" && <WebEmbed approved={approved} logoPath={logoPath} repo={repo} branch={branch} onSave={publish} />}
      {tab === "deck" && <DeckExport approved={approved} />}
    </div>
  );
}

function b64(s: string) { return btoa(unescape(encodeURIComponent(s))); }
function assetUrl(p?: string) { return p ? `/api/asset?path=${encodeURIComponent(p)}` : undefined; }

// ─── Capture links ──────────────────────────────────────────────────────────
function CaptureLinks({ clients, onCreate, onError }: { clients: ClientEntry[]; onCreate: (f: RenderedFile[], d: string[], m: string) => Promise<unknown>; onError: (s: string) => void }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [clientName, setClientName] = useState("");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  async function createInvite(invite: TestimonialInvite, message: string) {
    setBusy(true); setLink("");
    try {
      await onCreate([{ path: `Testimonials/_invites/${invite.token}.json`, base64: b64(JSON.stringify(invite, null, 2)) }], [], message);
      setLink(`${window.location.origin}/r/${invite.token}`);
    } catch (e) { onError(e instanceof Error ? e.message : "Failed to create link"); }
    finally { setBusy(false); }
  }

  function create() {
    if (!company.trim()) return;
    const token = `${slugify(company)}-${Math.random().toString(36).slice(2, 7)}`;
    createInvite({ token, company: company.trim(), role: role.trim() || undefined, clientName: clientName || undefined, createdAt: new Date().toISOString() }, `Create capture link: ${company}`);
  }

  function createUniversal() {
    const token = `share-${Math.random().toString(36).slice(2, 7)}`;
    createInvite({ token, open: true, createdAt: new Date().toISOString() }, "Create universal capture link");
  }

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-sm text-zinc-400">Generate a personalized link to send a client. They fill it in; submissions land in <b>Moderate</b> for your approval.</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company"><input value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" /></Field>
        <Field label="Default role (optional)"><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. CEO" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" /></Field>
      </div>
      <Field label="Attach logo from library (optional)">
        <select value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
          <option value="">— none —</option>
          {clients.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </Field>
      <button onClick={create} disabled={busy || !company.trim()} className="rounded-lg bg-fire px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? "Creating…" : "Create capture link"}</button>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-sm font-medium">Universal link (for mass email)</p>
        <p className="mt-1 text-xs text-zinc-500">One reusable link anyone can use — they enter their own company too. Perfect for a newsletter or bulk send. Everything still goes through <b>Moderate</b> before it&rsquo;s live.</p>
        <button onClick={createUniversal} disabled={busy} className="mt-3 rounded-lg border border-glass px-4 py-2 text-sm font-medium text-glass disabled:opacity-50">{busy ? "Creating…" : "Create universal link"}</button>
      </div>

      {link && (
        <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-sm text-green-400">Send this to your client:</p>
          <div className="flex gap-2">
            <input readOnly value={link} className="flex-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 font-mono text-xs text-zinc-300" />
            <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="rounded-lg bg-glass px-3 py-2 text-sm font-medium text-black">{copied ? "Copied!" : "Copy"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Moderate ───────────────────────────────────────────────────────────────
function Moderate({ pending, approved, loading, logoPath, onApprove, onReject, onDelete }: {
  pending: Testimonial[]; approved: Testimonial[]; loading: boolean; logoPath: (n?: string) => string | undefined;
  onApprove: (t: Testimonial) => void; onReject: (t: Testimonial) => void; onDelete: (t: Testimonial) => void;
}) {
  if (loading) return <p className="text-sm text-zinc-500">Loading…</p>;
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-medium">Pending ({pending.length})</h2>
        {!pending.length && <p className="text-sm text-zinc-500">Nothing waiting for review.</p>}
        {pending.map((t) => <Row key={t.slug} t={t} logo={logoPath(t.clientName)} actions={<>
          <button onClick={() => onApprove(t)} className="rounded-lg bg-green-600/80 px-3 py-1.5 text-sm font-medium text-white">Approve</button>
          <button onClick={() => onReject(t)} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300">Reject</button>
        </>} />)}
      </section>
      <section className="space-y-3">
        <h2 className="font-medium">Approved ({approved.length})</h2>
        {!approved.length && <p className="text-sm text-zinc-500">No approved testimonials yet.</p>}
        {approved.map((t) => <Row key={t.slug} t={t} logo={logoPath(t.clientName)} actions={
          <button onClick={() => onDelete(t)} className="rounded-lg border border-fire/40 px-3 py-1.5 text-sm text-fire">Delete</button>
        } />)}
      </section>
    </div>
  );
}

function Row({ t, logo, actions }: { t: Testimonial; logo?: string; actions: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      {t.headshot ? <img src={assetUrl(t.headshot)} alt="" className="h-11 w-11 rounded-full object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-800 text-sm text-zinc-500">{t.name.charAt(0)}</div>}
      <div className="min-w-0 flex-1">
        {t.rating ? <div className="text-xs text-glass">{"★".repeat(t.rating)}<span className="text-zinc-700">{"★".repeat(5 - t.rating)}</span></div> : null}
        <p className="text-sm text-zinc-200">“{t.quote}”</p>
        <p className="mt-1 text-xs text-zinc-500">{[t.name, t.role, t.company].filter(Boolean).join(" · ")}</p>
      </div>
      {logo && <img src={assetUrl(logo)} alt="" className="h-5 w-auto max-w-[80px] object-contain opacity-70" />}
      <div className="flex flex-col gap-2">{actions}</div>
    </div>
  );
}

// ─── Web embed builder ──────────────────────────────────────────────────────
function WebEmbed({ approved, logoPath, repo, branch, onSave }: {
  approved: Testimonial[]; logoPath: (n?: string) => string | undefined; repo: string; branch: string;
  onSave: (f: RenderedFile[], d: string[], m: string) => Promise<unknown>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [opts, setOpts] = useState<TestimonialOptions>(DEFAULT_TESTIMONIAL_OPTIONS);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ slug?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState("");

  const chosen = useMemo(() => selected.map((s) => approved.find((t) => t.slug === s)).filter(Boolean) as Testimonial[], [selected, approved]);

  const itemsFor = (urlFor: (p: string) => string, withImg = true): TestimonialItem[] =>
    chosen.map((t) => {
      const lp = logoPath(t.clientName);
      return {
        quote: t.quote, name: t.name, role: t.role, company: t.company, rating: t.rating,
        headshotUrl: withImg && t.headshot ? urlFor(t.headshot) : undefined,
        logoUrl: withImg && lp ? urlFor(lp) : undefined,
      };
    });

  const previewHtml = useMemo(() => testimonialMarkup(itemsFor((p) => `/api/asset?path=${encodeURIComponent(p)}`), opts), [chosen, opts]); // eslint-disable-line react-hooks/exhaustive-deps
  const staticHtml = useMemo(() => testimonialMarkup(itemsFor((p) => cdnUrl(repo, branch, p)), opts), [chosen, opts, repo, branch]); // eslint-disable-line react-hooks/exhaustive-deps

  async function copy(text: string, key: string) { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); }

  async function save() {
    const slug = slugify(name || "testimonials");
    if (!slug || !chosen.length) return;
    setSaving(true); setSaved(null);
    try {
      const cfg: TestimonialEmbedConfig = {
        type: "testimonial", name: name || slug, slug,
        items: chosen.map((t) => {
          const lp = logoPath(t.clientName);
          return { quote: t.quote, name: t.name, role: t.role, company: t.company, rating: t.rating, headshotUrl: t.headshot, logoUrl: lp };
        }),
        options: { ...opts },
        ...(CDN_BASE ? { cdnBase: CDN_BASE } : {}),
        updatedAt: new Date().toISOString(),
      };
      await onSave([{ path: `Embeds/${slug}.json`, base64: b64(JSON.stringify(cfg, null, 2)) }], [], `Save testimonial embed: ${slug}`);
      setSaved({ slug });
    } catch (e) { setSaved({ error: e instanceof Error ? e.message : "Save failed" }); }
    finally { setSaving(false); }
  }

  const liveCode = saved?.slug ? liveEmbedCode(saved.slug, repo, branch) : null;

  if (!approved.length) return <p className="text-sm text-zinc-500">Approve some testimonials first.</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Include</p>
          <div className="max-h-56 space-y-1 overflow-auto rounded-lg border border-zinc-800 p-2">
            {approved.map((t) => (
              <label key={t.slug} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selected.includes(t.slug)} onChange={(e) => setSelected((s) => e.target.checked ? [...s, t.slug] : s.filter((x) => x !== t.slug))} />
                <span className="truncate">{t.name} · {t.company}</span>
              </label>
            ))}
          </div>
        </div>
        <Field label="Layout">
          <div className="grid grid-cols-2 gap-2">
            {(["spotlight", "wall", "carousel", "card"] as const).map((l) => (
              <button key={l} onClick={() => setOpts((o) => ({ ...o, layout: l }))} className={`rounded-lg border px-2 py-1.5 text-sm capitalize ${opts.layout === l ? "border-glass bg-glass/10" : "border-zinc-700 text-zinc-400"}`}>{l}</button>
            ))}
          </div>
          {opts.layout === "spotlight" && <p className="mt-1 text-xs text-zinc-600">Featured layout matching the GlassFire site.</p>}
        </Field>
        {opts.layout === "wall" && (
          <Field label={`Columns ${opts.columns}`}><input type="range" min={1} max={4} value={opts.columns} onChange={(e) => setOpts((o) => ({ ...o, columns: Number(e.target.value) }))} className="w-full" /></Field>
        )}
        {opts.layout === "spotlight" && (
          <>
            <Field label="Heading"><input value={opts.heading} onChange={(e) => setOpts((o) => ({ ...o, heading: e.target.value }))} placeholder="About Our Work" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={opts.showPlay} onChange={(e) => setOpts((o) => ({ ...o, showPlay: e.target.checked }))} /> Video play badge on photo</label>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Accent"><input type="color" value={opts.accent} onChange={(e) => setOpts((o) => ({ ...o, accent: e.target.value }))} className="h-9 w-full rounded" /></Field>
          <Field label="Card bg"><input type="color" value={opts.cardBg} onChange={(e) => setOpts((o) => ({ ...o, cardBg: e.target.value }))} className="h-9 w-full rounded" /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={opts.showRating} onChange={(e) => setOpts((o) => ({ ...o, showRating: e.target.checked }))} /> Show star ratings</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={opts.showLogo} onChange={(e) => setOpts((o) => ({ ...o, showLogo: e.target.checked }))} /> Show company logos</label>
      </div>

      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#0b0b0d]">
          {chosen.length ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <p className="p-8 text-center text-zinc-500">Select testimonials to preview.</p>}
        </div>
        <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="font-medium">Live embed (auto-updates)</p>
          <div className="flex flex-wrap items-center gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name e.g. Homepage testimonials" className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" />
            <button onClick={save} disabled={saving || !chosen.length || !name} className="rounded-lg bg-fire px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Saving…" : "Save embed"}</button>
          </div>
          {saved?.error && <p className="text-sm text-fire">{saved.error}</p>}
          {liveCode && (
            <div className="space-y-2">
              <p className="text-sm text-green-400">Saved as <code>{saved!.slug}</code>.</p>
              <textarea readOnly value={liveCode} className="h-20 w-full rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-300" />
              <button onClick={() => copy(liveCode, "live")} className="rounded-lg bg-glass px-3 py-1.5 text-sm font-medium text-black">{copied === "live" ? "Copied!" : "Copy live embed"}</button>
            </div>
          )}
          <details>
            <summary className="cursor-pointer text-sm text-zinc-400">Full static HTML (best for SEO)</summary>
            <textarea readOnly value={staticHtml} className="mt-2 h-48 w-full rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-300" />
            <button onClick={() => copy(staticHtml, "static")} className="mt-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm hover:border-glass">{copied === "static" ? "Copied!" : "Copy static HTML"}</button>
          </details>
        </div>
      </div>
    </div>
  );
}

// ─── Deck export (PNG quote card) ───────────────────────────────────────────
function DeckExport({ approved }: { approved: Testimonial[] }) {
  const [slug, setSlug] = useState("");
  const [heading, setHeading] = useState("About Our Work");
  const [accent, setAccent] = useState("#EE2750");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = approved.find((x) => x.slug === slug);

  // Spotlight slide — mirrors the GlassFire site testimonial section.
  const draw = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !t) return;
    const W = 1600, H = 900;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0b2b2b"); g.addColorStop(0.55, "#06201f"); g.addColorStop(1, "#0a1414");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Heading
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.font = "800 62px sans-serif";
    ctx.fillText((heading || "").toUpperCase(), W / 2, 66);
    ctx.textAlign = "left";

    const top = 200, mh = 580, mx = 110, mw = 540;
    const cx = mx + mw + 40, cw = W - cx - 110;
    const hs = t.headshot ? await loadImg(assetUrl(t.headshot)!) : null;

    // Left media
    roundRect(ctx, mx, top, mw, mh, 20); ctx.save(); ctx.clip();
    if (hs) drawCover(ctx, hs, mx, top, mw, mh); else { ctx.fillStyle = "#0a1414"; ctx.fillRect(mx, top, mw, mh); }
    const og = ctx.createLinearGradient(0, top + mh, 0, top + mh - 260);
    og.addColorStop(0, "rgba(0,0,0,.8)"); og.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = og; ctx.fillRect(mx, top, mw, mh);
    ctx.restore();
    ctx.fillStyle = "#fff"; ctx.textBaseline = "alphabetic"; ctx.font = "800 38px sans-serif";
    ctx.fillText(t.company, mx + 30, top + mh - 34);

    // Right white card
    roundRect(ctx, cx, top, cw, mh, 22); ctx.fillStyle = "#fff"; ctx.fill();
    const pad = 48;
    ctx.fillStyle = accent; ctx.textBaseline = "top"; ctx.font = "700 120px Georgia, serif";
    ctx.fillText("“", cx + pad, top + 18);

    let py = top + 158, tx = cx + pad;
    if (hs) { const s = 74; roundRect(ctx, tx, py, s, s, 10); ctx.save(); ctx.clip(); drawCover(ctx, hs, tx, py, s, s); ctx.restore(); tx += s + 18; }
    ctx.fillStyle = "#111"; ctx.font = "700 30px sans-serif"; ctx.fillText(t.name, tx, py + 8);
    ctx.fillStyle = "#6b7280"; ctx.font = "24px sans-serif"; ctx.fillText([t.role, t.company].filter(Boolean).join(", "), tx, py + 46);

    py += 116;
    ctx.fillStyle = "#1f2937"; ctx.font = "500 30px sans-serif";
    const maxW = cw - pad * 2, lh = 46; let line = "", yy = py;
    for (const w of (`“${t.quote}”`).split(/\s+/)) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, cx + pad, yy); line = w; yy += lh; }
      else line = test;
    }
    if (line) ctx.fillText(line, cx + pad, yy);
  }, [t, heading, accent]);

  useEffect(() => { draw(); }, [draw]);

  function download() {
    const canvas = canvasRef.current; if (!canvas || !t) return;
    const a = document.createElement("a");
    a.download = `testimonial-${t.slug}.png`; a.href = canvas.toDataURL("image/png"); a.click();
  }

  if (!approved.length) return <p className="text-sm text-zinc-500">Approve some testimonials first.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Testimonial">
          <select value={slug} onChange={(e) => setSlug(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm">
            <option value="">— choose —</option>
            {approved.map((x) => <option key={x.slug} value={x.slug}>{x.name} · {x.company}</option>)}
          </select>
        </Field>
        <Field label="Heading"><input value={heading} onChange={(e) => setHeading(e.target.value)} className="w-44 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" /></Field>
        <Field label="Accent"><input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-16 rounded" /></Field>
        <button onClick={download} disabled={!t} className="rounded-lg bg-fire px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Download PNG (16:9)</button>
      </div>
      <canvas ref={canvasRef} className="w-full rounded-xl border border-zinc-800" />
      {!t && <p className="text-sm text-zinc-500">Pick a testimonial to render a slide-ready card.</p>}
    </div>
  );
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src; });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draw an image as object-fit: cover into the target rect.
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.width / img.height, r = w / h;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">{label}</label>{children}</div>;
}
