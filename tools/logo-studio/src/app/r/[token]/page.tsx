"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { cdnUrl } from "@/lib/embed";

const GOOGLE_REVIEW_URL = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "";
const REPO = "GlassFireStudios/glassfirebrandassets";
const BRANCH = "main";
const SMOKE_BG = cdnUrl(REPO, BRANCH, "Backgrounds/Official Brand Background/16x9 4k Bkgd.jpg");
const LOGO = cdnUrl(REPO, BRANCH, "Logos/Variant White/GlassFire Logo White.png");

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

export default function CapturePage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<{ company: string; role: string; open: boolean } | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
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

  // Downscale + center-crop to a small square JPEG so the upload stays tiny
  // (raw phone photos blow past the serverless request-body limit).
  async function onPickHeadshot(file: File) {
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      URL.revokeObjectURL(url);
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setHeadshot({ base64: dataUrl.split(",")[1], ext: "jpg", preview: dataUrl });
    } catch { setSubmitErr("Could not read that image — try another."); }
  }

  async function submit() {
    setSubmitErr(null);
    if (!rating) { setSubmitErr("Please tap a star rating."); return; }
    if (!name.trim() || !quote.trim()) { setSubmitErr("Please add your name and a few words."); return; }
    if (invite?.open && !company.trim()) { setSubmitErr("Please tell us your company."); return; }
    if (!consent) { setSubmitErr("Please tick the permission box so we can use your words."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/r/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role, company, quote, rating, consent, website, headshotBase64: headshot?.base64, headshotExt: headshot?.ext }),
      });
      let data: { error?: string } = {};
      try { data = await res.json(); } catch { /* non-JSON (e.g. 413) */ }
      if (res.ok) setDone(true);
      else setSubmitErr(data.error || `Submission failed (${res.status}). Please try again.`);
    } catch { setSubmitErr("Network error — please try again."); }
    finally { setSubmitting(false); }
  }

  function postToGoogle() {
    navigator.clipboard.writeText(quote).then(() => setCopied(true)).catch(() => {});
    window.open(GOOGLE_REVIEW_URL, "_blank", "noopener");
  }

  if (loading) return <Shell><p className="text-zinc-300">Loading…</p></Shell>;
  if (loadErr) return <Shell><p className="text-fire">{loadErr}</p></Shell>;

  if (done) {
    const fiveStar = rating === 5;
    return (
      <Shell>
        <div className="space-y-5 text-center">
          <div className="text-5xl">{fiveStar ? "🎉" : "🙏"}</div>
          <h1 className="text-2xl font-bold text-white">Thank you, {name.split(" ")[0]}!</h1>
          <p className="text-zinc-300">Your testimonial has been sent to the GlassFire team. We really appreciate it.</p>
          {GOOGLE_REVIEW_URL && fiveStar ? (
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-200">You made our day. Would you share it on Google too? It helps us a lot.</p>
              <button onClick={postToGoogle} className="rounded-lg bg-gradient-to-r from-fire to-glass px-4 py-2 font-medium text-white shadow-lg">
                {copied ? "Copied — paste it on Google ↗" : "Post my review to Google"}
              </button>
              <p className="text-xs text-zinc-400">We&rsquo;ll copy your words to your clipboard and open Google so you can paste &amp; post.</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">A member of our team will follow up personally — thank you for the honest feedback.</p>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="w-full space-y-5">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-white">Share your experience</h1>
          <p className="text-sm text-zinc-300">A quick word about working with GlassFire.</p>
        </div>

        <Field label="Your rating">
          <div className="flex gap-1.5 text-4xl" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= (hover || rating);
              return (
                <button key={n} type="button" aria-label={`${n} stars`} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}
                  className={`transition-transform hover:scale-110 ${active ? "text-fire drop-shadow-[0_0_10px_rgba(238,39,80,0.7)]" : "text-zinc-600"}`}>★</button>
              );
            })}
          </div>
        </Field>

        <Field label="Your testimonial">
          <textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={5} placeholder="What did we help you achieve? What was it like working with us?" className={inputCls} />
        </Field>

        {invite?.open && (
          <Field label="Your company"><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className={inputCls} /></Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Your name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
          <Field label="Role / title"><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Marketing Director" className={inputCls} /></Field>
        </div>

        <Field label="Photo (optional)">
          <div className="flex items-center gap-3">
            {headshot && <img src={headshot.preview} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-glass/40" />}
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onPickHeadshot(e.target.files[0])} className="text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-zinc-100" />
          </div>
        </Field>

        {/* Honeypot — hidden from humans */}
        <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="absolute left-[-9999px]" aria-hidden />

        <label className="flex items-start gap-2 text-sm text-zinc-200">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          I give GlassFire permission to share this testimonial (with my name, role, company{headshot ? ", and photo" : ""}) on their website and marketing.
        </label>

        {submitErr && <p className="text-sm text-fire">{submitErr}</p>}
        <button onClick={submit} disabled={submitting} className="w-full rounded-lg bg-gradient-to-r from-fire to-glass px-4 py-3 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50">
          {submitting ? "Sending…" : "Send testimonial"}
        </button>
      </div>
    </Shell>
  );
}

const inputCls = "w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-glass";

// Full-bleed smoke background + GlassFire logo + glass card.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: `url("${SMOKE_BG}")` }} />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/55 to-black/85" />
      <div className="relative flex min-h-[85vh] w-full flex-col items-center justify-center gap-6 py-6">
        <img src={LOGO} alt="GlassFire" className="h-9 w-auto drop-shadow-lg" />
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/50 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {children}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
