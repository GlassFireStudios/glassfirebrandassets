"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export default function GoogleSignIn() {
  const [next, setNext] = useState("/");
  useEffect(() => { setNext(new URLSearchParams(window.location.search).get("next") || "/"); }, []);

  return (
    <div className="mx-auto mt-24 max-w-sm space-y-5 rounded-lg border border-white/10 bg-graphite/40 p-7">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://cdn.jsdelivr.net/gh/GlassFireStudios/glassfirebrandassets@main/Logos/Variant%20White/GlassFire%20Logo%20White.png" alt="GlassFire" className="h-7 w-auto" />
      <div>
        <h1 className="text-lg font-extrabold">Brand Studio</h1>
        <p className="gf-eyebrow mt-1">Team access</p>
      </div>
      <button onClick={() => signIn("google", { callbackUrl: next })} className="gf-btn gf-btn-fire w-full">Sign in with Google</button>
      <p className="text-xs text-steel">Use your @glassfire.co account.</p>
    </div>
  );
}
