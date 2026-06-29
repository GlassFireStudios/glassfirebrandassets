"use client";

import { useEffect, useState } from "react";
import PageHeading from "@/components/PageHeading";
import MachineBoard from "@/components/MachineBoard";

export default function MachinesPage() {
  const [token, setToken] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/machines/token");
        const data = await res.json();
        if (res.ok) setToken(data.token); else setErr(data.error || "Could not load the share link.");
      } catch { setErr("Network error."); }
    })();
  }, []);

  const link = token ? `${window.location.origin}/m/${token}` : "";

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Edit Bay" title="Machine Tracker" sub="See who's on which editing workstation. Share the public link with editors — no login needed. (Presence only; it doesn't touch the actual machines.)" />

      <div className="gf-card space-y-2 p-4">
        <p className="gf-eyebrow">Public link — no login</p>
        {err && <p className="text-sm text-fire">{err}</p>}
        {token ? (
          <div className="flex flex-wrap gap-2">
            <input readOnly value={link} className="flex-1 rounded-sm border border-white/10 bg-black px-3 py-2 font-mono text-xs text-zinc-300" />
            <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="gf-btn gf-btn-fire">{copied ? "Copied!" : "Copy link"}</button>
          </div>
        ) : !err && <p className="text-sm text-steel">Loading link…</p>}
        <p className="text-xs text-steel">Anyone with this link can view the board and sign in/out — it&rsquo;s long and unguessable, so it stays private to whoever you share it with.</p>
      </div>

      {token && <MachineBoard token={token} />}
    </div>
  );
}
