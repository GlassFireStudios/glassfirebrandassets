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
    <form onSubmit={submit} className="mx-auto mt-20 max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">GlassFire Logo Studio</h1>
      <p className="text-sm text-zinc-400">Internal access only.</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-glass"
        autoFocus
      />
      {error && <p className="text-sm text-fire">Incorrect password.</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-glass py-2 font-medium text-black disabled:opacity-50"
      >
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
