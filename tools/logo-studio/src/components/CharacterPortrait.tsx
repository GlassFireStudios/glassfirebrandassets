"use client";

import { useState } from "react";

// Shows the uploaded portrait; until one exists (or if it fails to load), falls
// back to a branded initial so the page looks intentional either way.
export default function CharacterPortrait({ src, name, className = "" }: { src: string; name: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className={`flex items-center justify-center bg-graphite text-5xl font-extrabold text-steel ${className}`} aria-label={name}>
        {name.charAt(0)}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} onError={() => setErr(true)} className={`object-cover ${className}`} />;
}
