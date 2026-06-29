"use client";

import { useParams } from "next/navigation";
import MachineBoard from "@/components/MachineBoard";

const LOGO = "https://cdn.jsdelivr.net/gh/GlassFireStudios/glassfirebrandassets@main/Logos/Variant%20White/GlassFire%20Logo%20White.png";

export default function PublicMachinePage() {
  const { token } = useParams<{ token: string }>();
  return (
    <div className="mx-auto max-w-5xl space-y-6 py-2">
      <header className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="GlassFire" className="h-7 w-auto" />
        <div>
          <p className="gf-eyebrow">Edit Bay</p>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Machine Tracker</h1>
          <p className="mt-1 text-sm text-fog">Sign onto the workstation you&rsquo;re editing on so the team can see who&rsquo;s where. This only updates the board — it doesn&rsquo;t log in or out of the actual computer.</p>
        </div>
      </header>
      <MachineBoard endpoint={`/api/m/${token}`} />
    </div>
  );
}
