"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import MachineBoard from "@/components/MachineBoard";

export default function MachinesClient({ user, googleConfigured }: { user: { name: string; email: string } | null; googleConfigured: boolean }) {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try { const r = await fetch("/api/machines/token"); const d = await r.json(); if (r.ok) setToken(d.token); } catch { /* ignore */ }
    })();
  }, []);

  const link = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/m/${token}` : "";

  return (
    <div className="space-y-5">
      {user && (
        <div className="flex items-center gap-3 text-sm text-steel">
          Signed in as <b className="text-snow">{user.email}</b>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-fire hover:underline">Sign out</button>
        </div>
      )}

      {!user && !googleConfigured && (
        <div className="gf-card p-4 text-sm text-fog">
          <p className="font-semibold text-snow">Google sign-in isn&rsquo;t set up yet</p>
          <p className="mt-1">Editors can use the public link below for now. Once you add the Google OAuth credentials, this page switches to verified per-editor accounts automatically.</p>
        </div>
      )}

      <div className="gf-card space-y-2 p-4">
        <p className="gf-eyebrow">Public display link — no login</p>
        {token ? (
          <div className="flex flex-wrap gap-2">
            <input readOnly value={link} className="flex-1 rounded-sm border border-white/10 bg-black px-3 py-2 font-mono text-xs text-zinc-300" />
            <button onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="gf-btn gf-btn-fire">{copied ? "Copied!" : "Copy link"}</button>
          </div>
        ) : <p className="text-sm text-steel">Loading link…</p>}
        <p className="text-xs text-steel">Long &amp; unguessable — good for a wall display or sharing the board read-along. Signed-in editors should use this page.</p>
      </div>

      {user ? <MachineBoard endpoint="/api/machines/board" user={user} /> : token ? <MachineBoard endpoint={`/api/m/${token}`} /> : null}
    </div>
  );
}
