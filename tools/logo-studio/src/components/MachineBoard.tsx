"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Machine, MachineStatus } from "@/lib/machines";

type MachineRow = Machine & { status: MachineStatus };

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return sameDay ? t : `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${t}`;
}

export default function MachineBoard({ token }: { token: string }) {
  const [rows, setRows] = useState<MachineRow[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setName(localStorage.getItem("gf-editor-name") || ""); }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/m/${token}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) { setLoadErr(data.error || "Could not load the board."); return; }
      setRows(data.machines); setLoadErr(null);
    } catch { setLoadErr("Network error."); }
  }, [token]);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000); // keep the board fresh for everyone
    return () => clearInterval(t);
  }, [load]);

  async function act(id: string, action: "claim" | "release") {
    if (action === "claim" && !name.trim()) { nameRef.current?.focus(); return; }
    setBusy(id);
    try {
      const res = await fetch(`/api/m/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) setRows(data.machines);
    } finally { setBusy(null); }
  }

  function saveName(v: string) { setName(v); localStorage.setItem("gf-editor-name", v); }

  if (loadErr) return <p className="text-fire">{loadErr}</p>;

  const mine = rows.find((m) => m.status.current?.name && m.status.current.name === name.trim());

  return (
    <div className="space-y-5">
      <div className="gf-card flex flex-wrap items-center gap-3 p-4">
        <label className="text-xs uppercase tracking-wide text-steel">Your name</label>
        <input ref={nameRef} value={name} onChange={(e) => saveName(e.target.value)} placeholder="e.g. Nate" className="flex-1 rounded-sm border border-white/15 bg-black px-3 py-2 text-sm outline-none focus:border-glass" />
        {mine && <span className="gf-chip" style={{ color: "#2FBF71", borderColor: "rgba(47,191,113,0.4)" }}>On {mine.name}</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((m) => {
          const cur = m.status.current;
          const isMe = !!cur && cur.name === name.trim();
          return (
            <div key={m.id} className="gf-card flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-extrabold uppercase tracking-tight">{m.name}</h3>
                  <p className="text-xs text-steel">{m.role}</p>
                </div>
                <span className="gf-chip">{m.kind}</span>
              </div>

              <dl className="mt-3 space-y-1 text-xs text-fog">
                <div className="flex justify-between gap-3"><dt className="text-steel">CPU</dt><dd className="text-right">{m.cpu}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-steel">RAM</dt><dd className="text-right">{m.ram}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-steel">GPU</dt><dd className="text-right">{m.gpu}</dd></div>
              </dl>

              <div className="mt-4 rounded-sm border px-3 py-2 text-sm" style={cur ? { borderColor: "rgba(238,39,80,0.35)", background: "rgba(238,39,80,0.06)" } : { borderColor: "rgba(47,191,113,0.35)", background: "rgba(47,191,113,0.06)" }}>
                {cur ? (
                  <span className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{ background: "#EE2750" }} /><b className="text-snow">{cur.name}</b><span className="text-steel">· since {fmtTime(cur.since)}</span></span>
                ) : (
                  <span className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full" style={{ background: "#2FBF71" }} /><span className="text-snow">Available</span></span>
                )}
              </div>

              <div className="mt-3">
                {isMe ? (
                  <button onClick={() => act(m.id, "release")} disabled={busy === m.id} className="gf-btn gf-btn-ghost w-full">{busy === m.id ? "…" : "Sign out"}</button>
                ) : cur ? (
                  <button onClick={() => act(m.id, "claim")} disabled={busy === m.id} className="gf-btn gf-btn-ghost w-full">{busy === m.id ? "…" : "Take over"}</button>
                ) : (
                  <button onClick={() => act(m.id, "claim")} disabled={busy === m.id} className="gf-btn gf-btn-fire w-full">{busy === m.id ? "…" : "I'm on this machine"}</button>
                )}
              </div>

              {m.status.history.length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-3">
                  <p className="gf-eyebrow mb-1.5" style={{ color: "#6E6E76" }}>Recent</p>
                  <ul className="space-y-1 text-xs text-fog">
                    {m.status.history.slice(0, 4).map((h, i) => (
                      <li key={i} className="flex justify-between gap-3"><span className="text-snow/80">{h.name}</span><span className="text-steel">{fmtTime(h.start)} – {fmtTime(h.end)}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
