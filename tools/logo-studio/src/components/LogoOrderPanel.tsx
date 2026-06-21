"use client";

import { useState } from "react";
import type { ClientEntry } from "@/lib/types";

interface Props {
  clients: ClientEntry[];
  /** Ordered list of selected client names. */
  order: string[];
  onChange: (order: string[]) => void;
}

// Ordered, drag-to-reorder selection of client logos. Shared by the Grid and
// Carousel builders so the export order is fully controllable.
export default function LogoOrderPanel({ clients, order, onChange }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inOrder = order.filter((n) => clients.some((c) => c.name === n));
  const available = clients.filter((c) => !order.includes(c.name));

  function move(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    const next = [...inOrder];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">In order ({inOrder.length})</p>
        <div className="flex gap-2 text-xs">
          <button className="text-glass" onClick={() => onChange(clients.map((c) => c.name))}>All</button>
          <button className="text-zinc-500" onClick={() => onChange([])}>None</button>
        </div>
      </div>

      <p className="text-xs text-zinc-600">Drag to reorder.</p>
      <ul className="max-h-60 space-y-1 overflow-auto rounded-lg border border-zinc-800 p-2">
        {inOrder.map((name, i) => {
          const c = clients.find((x) => x.name === name);
          return (
            <li
              key={name}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIndex !== null) move(dragIndex, i); setDragIndex(null); }}
              onDragEnd={() => setDragIndex(null)}
              className={`flex cursor-grab items-center gap-2 rounded-md border border-transparent bg-zinc-900/60 px-2 py-1.5 text-sm active:cursor-grabbing ${dragIndex === i ? "opacity-40" : ""}`}
            >
              <span className="select-none text-zinc-600">⠿</span>
              <span className="w-5 text-xs text-zinc-500">{i + 1}</span>
              <span className="flex-1 truncate">{name}</span>
              {c?.legacy && <span className="text-xs text-zinc-600">white only</span>}
              <div className="flex items-center gap-1 text-zinc-500">
                <button title="Move up" onClick={() => move(i, i - 1)} disabled={i === 0} className="px-1 disabled:opacity-30">↑</button>
                <button title="Move down" onClick={() => move(i, i + 1)} disabled={i === inOrder.length - 1} className="px-1 disabled:opacity-30">↓</button>
                <button title="Remove" onClick={() => onChange(inOrder.filter((n) => n !== name))} className="px-1 text-fire">✕</button>
              </div>
            </li>
          );
        })}
        {!inOrder.length && <li className="px-1 py-2 text-sm text-zinc-500">No logos selected.</li>}
      </ul>

      {available.length > 0 && (
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Add logos</p>
          <div className="flex flex-wrap gap-1.5">
            {available.map((c) => (
              <button
                key={c.name}
                onClick={() => onChange([...inOrder, c.name])}
                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-glass"
              >
                + {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
