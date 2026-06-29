"use client";

import { useEffect, useState } from "react";
import PageHeading from "@/components/PageHeading";
import CharacterPortrait from "@/components/CharacterPortrait";
import { cdnUrl } from "@/lib/embed";
import { MACHINES, characterImagePath, type Machine, type MachineStatus } from "@/lib/machines";

const REPO = "GlassFireStudios/glassfirebrandassets";
type Row = Machine & { status?: MachineStatus };

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return sameDay ? t : `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${t}`;
}

export default function CharactersPage() {
  const [rows, setRows] = useState<Row[]>(MACHINES);

  useEffect(() => {
    (async () => {
      try {
        const t = await fetch("/api/machines/token").then((r) => r.json());
        if (!t.token) return;
        const data = await fetch(`/api/m/${t.token}`, { cache: "no-store" }).then((r) => r.json());
        if (data.machines) setRows(data.machines);
      } catch { /* keep static */ }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeading eyebrow="Edit Bay" title="Characters" sub="The crew behind the workstations. Each machine is named for a Firefly character — here's who they are and the rig they run." />
      <p className="text-xs text-steel">Portraits upload to <code>Machines/characters/&lt;id&gt;.jpg</code> (e.g. <code>kaylee.jpg</code>). Until then, each shows a placeholder.</p>

      <div className="space-y-6">
        {rows.map((m) => {
          const cur = m.status?.current;
          return (
            <div key={m.id} id={m.id} className="gf-card grid scroll-mt-24 gap-0 overflow-hidden md:grid-cols-[260px_1fr]">
              <CharacterPortrait src={cdnUrl(REPO, "main", characterImagePath(m.id))} name={m.name} className="h-60 w-full md:h-full" />
              <div className="space-y-3 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-extrabold uppercase tracking-tight">{m.name}</h2>
                    <p className="text-sm text-fire">{m.role}</p>
                  </div>
                  <span className="gf-chip">{m.kind}</span>
                </div>
                <p className="text-sm text-fog">{m.bio}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-fog">
                  <span><span className="text-steel">CPU</span> {m.cpu}</span>
                  <span><span className="text-steel">RAM</span> {m.ram}</span>
                  <span><span className="text-steel">GPU</span> {m.gpu}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 text-sm">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: cur ? "#EE2750" : "#2FBF71" }} />
                  {cur ? <span><b className="text-snow">{cur.name}</b> <span className="text-steel">· on now since {fmtTime(cur.since)}</span></span> : <span className="text-snow">Available</span>}
                </div>
                {m.status?.history?.length ? (
                  <p className="text-xs text-steel">Last: {m.status.history[0].name} · {fmtTime(m.status.history[0].start)} – {fmtTime(m.status.history[0].end)}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
