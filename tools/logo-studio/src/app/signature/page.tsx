"use client";

import { useMemo, useRef, useState } from "react";
import PageHeading from "@/components/PageHeading";
import { buildSignatureHtml, signaturePlainText, type SignatureFields } from "@/lib/signature";

const DEFAULTS: SignatureFields = {
  name: "Nate Glass",
  title: "Founder | Producer | Cinematographer",
  phone: "253.514.2017",
  email: "nate@glassfire.co",
  website: "www.glassfire.co",
  social: "@glassfirestudios",
  socialUrl: "https://instagram.com/glassfirestudios",
  logo: "both",
  logoSize: "m",
  accent: "glass",
};

export default function SignaturePage() {
  const [f, setF] = useState<SignatureFields>(DEFAULTS);
  const [copied, setCopied] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const set = <K extends keyof SignatureFields>(k: K, v: SignatureFields[K]) => setF((p) => ({ ...p, [k]: v }));

  const html = useMemo(() => buildSignatureHtml(f), [f]);
  const plain = useMemo(() => signaturePlainText(f), [f]);

  async function copyRich() {
    try {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      flash("rich");
    } catch {
      // Fallback: select the live preview and copy the rendered selection.
      const node = previewRef.current;
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand("copy");
        sel?.removeAllRanges();
        flash("rich");
      }
    }
  }
  async function copySource() { await navigator.clipboard.writeText(html); flash("src"); }
  function flash(k: string) { setCopied(k); setTimeout(() => setCopied(""), 1600); }

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Brand" title="Email Signature" sub="Build a Gmail-ready HTML signature with the GlassFire logo and brand colors, then paste it straight into your inbox." />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Controls */}
        <div className="space-y-4">
          <Field label="Name"><input value={f.name} onChange={(e) => set("name", e.target.value)} className={input} /></Field>
          <Field label="Title"><input value={f.title} onChange={(e) => set("title", e.target.value)} className={input} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mobile"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} className={input} /></Field>
            <Field label="Email"><input value={f.email} onChange={(e) => set("email", e.target.value)} className={input} /></Field>
          </div>
          <Field label="Website"><input value={f.website} onChange={(e) => set("website", e.target.value)} className={input} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Social label"><input value={f.social} onChange={(e) => set("social", e.target.value)} className={input} /></Field>
            <Field label="Social link"><input value={f.socialUrl} onChange={(e) => set("socialUrl", e.target.value)} className={input} /></Field>
          </div>
          <Field label="Logo">
            <div className="grid grid-cols-2 gap-2">
              {(["both", "icon", "wordmark", "none"] as const).map((l) => (
                <button key={l} onClick={() => set("logo", l)} className={`rounded-sm border px-2 py-1.5 text-sm capitalize ${f.logo === l ? "border-glass bg-glass/10" : "border-white/15 text-fog"}`}>{l}</button>
              ))}
            </div>
          </Field>
          {f.logo !== "none" && (
            <Field label="Logo size">
              <div className="flex gap-2">
                {(["s", "m", "l"] as const).map((s) => (
                  <button key={s} onClick={() => set("logoSize", s)} className={`flex-1 rounded-sm border px-2 py-1.5 text-sm uppercase ${f.logoSize === s ? "border-glass bg-glass/10" : "border-white/15 text-fog"}`}>{s}</button>
                ))}
              </div>
            </Field>
          )}
          <Field label="Name color">
            <div className="flex gap-2">
              {(["glass", "fire"] as const).map((a) => (
                <button key={a} onClick={() => set("accent", a)} className={`flex-1 rounded-sm border px-2 py-1.5 text-sm capitalize ${f.accent === a ? "border-glass bg-glass/10" : "border-white/15 text-fog"}`}>{a}</button>
              ))}
            </div>
          </Field>
        </div>

        {/* Preview + export */}
        <div className="min-w-0 space-y-4">
          <div>
            <p className="gf-eyebrow mb-2">Preview</p>
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white p-7">
              <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={copyRich} className="gf-btn gf-btn-fire">{copied === "rich" ? "Copied!" : "Copy signature"}</button>
            <button onClick={copySource} className="gf-btn gf-btn-ghost">{copied === "src" ? "Copied!" : "Copy HTML source"}</button>
          </div>

          <div className="gf-card space-y-2 p-4 text-sm text-fog">
            <p className="font-semibold text-snow">Add it to Gmail</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Click <b>Copy signature</b> above.</li>
              <li>In Gmail: <b>Settings</b> (gear) → <b>See all settings</b> → <b>General</b> → <b>Signature</b>.</li>
              <li>Create or select a signature, click into the box, and <b>paste</b> (Cmd/Ctrl+V).</li>
              <li>Scroll down and <b>Save Changes</b>. (Recipients see the logo once they load images.)</li>
            </ol>
          </div>

          <details>
            <summary className="cursor-pointer text-sm text-fog">HTML source</summary>
            <textarea readOnly value={html} className="mt-2 h-40 w-full rounded-sm border border-white/10 bg-black p-3 font-mono text-xs text-zinc-300" />
          </details>
        </div>
      </div>
    </div>
  );
}

const input = "w-full rounded-sm border border-white/15 bg-black px-3 py-2 text-sm outline-none focus:border-glass";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-xs uppercase tracking-wide text-steel">{label}</label>{children}</div>;
}
