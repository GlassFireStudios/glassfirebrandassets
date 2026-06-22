"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) router.push(next);
    else setError(true);
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-24 max-w-sm space-y-5 rounded-lg border border-white/10 bg-graphite/40 p-7">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="https://cdn.jsdelivr.net/gh/GlassFireStudios/glassfirebrandassets@main/Logos/Variant%20White/GlassFire%20Logo%20White.png" alt="GlassFire" className="h-7 w-auto" />
      <div>
        <h1 className="text-lg font-extrabold">Brand Studio</h1>
        <p className="gf-eyebrow mt-1">Internal access only</p>
      </div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-sm border border-white/15 bg-black px-3 py-2.5 outline-none focus:border-glass"
        autoFocus
      />
      {error && <p className="text-sm text-fire">Incorrect password.</p>}
      <button type="submit" disabled={busy} className="gf-btn gf-btn-fire w-full">
        {busy ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
