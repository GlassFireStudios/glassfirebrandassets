"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const GOOGLE_REVIEW_URL = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "";

export default function CapturePage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<{ company: string; role: string; open: boolean } | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [headshot, setHeadshot] = useState<{ base64: string; ext: string; preview: string } | null>(null);
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/r/${token}`);
        const data = await res.json();
        if (!res.ok) setLoadErr(data.error || "This link is invalid.");
        else { setInvite(data); setRole(data.role || ""); if (!data.open) setCompany(data.company || ""); }
      } catch { setLoadErr("Could not load this link."); }
      finally { setLoading(false); }
    })();
  }, [token]);

  async function onPickHeadshot(file: File) {
    const buf = await file.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    setHeadshot({ base64: btoa(bin), ext, preview: URL.createObjectURL(file) });
  }

  async function submit() {
    setSubmitErr(null);
    if (!name.trim() || !quote.trim()) { setSubmitErr("Please add your name and a few words."); return; }
    if (invite?.open && !company.trim()) { setSubmitErr("Please tell us your company."); return; }
    if (!consent) { setSubmitErr("Please tick the permission box so we can use your words."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/r/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, company, quote, rating, consent, website, headshotBase64: headshot?.base64, headshotExt: headshot?.ext }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else setSubmitErr(data.error || "Something went wrong.");
    } catch { setSubmitErr("Network error — please try again."); }
    finally { setSubmitting(false); }
  }

  function postToGoogle() {
    navigator.clipboard.writeText(quote).then(() => setCopied(true)).catch(() => {});
    window.open(GOOGLE_REVIEW_URL, "_blank", "noopener");
  }

  if (loading) return <Centered><p className="text-zinc-400">Loading…</p></Centered>;
  if (loadErr) return <Centered><p className="text-fire">{loadErr}</p></Centered>;

  if (done) {
    return (
      <Centered>
        <div className="space-y-5 text-center">
          <div className="text-4xl">🎉</div>
          <h1 className="text-2xl font-bold">Thank you, {name.split(" ")[0]}!</h1>
          <p className="text-zinc-400">Your testimonial has been sent to the GlassFire team. We really appreciate it.</p>
          {GOOGLE_REVIEW_URL && (
            <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <p className="text-sm text-zinc-300">Would you share it on Google too? It helps us a lot.</p>
              <button onClick={postToGoogle} className="rounded-lg bg-glass px-4 py-2 font-medium text-black">
                {copied ? "Copied — paste it on Google ↗" : "Post my review to Google"}
              </button>
              <p className="text-xs text-zinc-500">We&rsquo;ll copy your words to your clipboard and open Google so you can paste &amp; post.</p>
            </div>
          )}
        </div>
      </Centered>
    );
  }

  return (
    <Centered>
      <div className="w-full space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Share your experience</h1>
          <p className="text-sm text-zinc-400">{invite?.company ? `A quick word about working with GlassFire, from ${invite.company}.` : "A quick word about working with GlassFire."}</p>
        </div>

        <Field label="Your rating">
          <div className="flex gap-1 text-3xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`} className={n <= rating ? "text-glass" : "text-zinc-700"}>★</button>
            ))}
          </div>
        </Field>

        <Field label="Your testimonial">
          <textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={5} placeholder="What did we help you achieve? What was it like working with us?" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm" />
        </Field>

        {invite?.open && (
          <Field label="Your company"><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" /></Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Your name"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" /></Field>
          <Field label="Role / title"><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Marketing Director" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm" /></Field>
        </div>

        <Field label="Photo (optional)">
          <div className="flex items-center gap-3">
            {headshot && <img src={headshot.preview} alt="" className="h-12 w-12 rounded-full object-cover" />}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onPickHeadshot(e.target.files[0])} className="text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-zinc-200" />
          </div>
        </Field>

        {/* Honeypot — hidden from humans */}
        <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="absolute left-[-9999px]" aria-hidden />

        <label className="flex items-start gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          I give GlassFire permission to share this testimonial (with my name, role, company{headshot ? ", and photo" : ""}) on their website and marketing.
        </label>

        {submitErr && <p className="text-sm text-fire">{submitErr}</p>}
        <button onClick={submit} disabled={submitting} className="w-full rounded-lg bg-fire px-4 py-3 font-medium text-white disabled:opacity-50">
          {submitting ? "Sending…" : "Send testimonial"}
        </button>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">{label}</label>
      {children}
    </div>
  );
}
