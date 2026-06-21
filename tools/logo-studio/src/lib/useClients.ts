"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClientEntry } from "./types";

/** Loads the client logos discovered in the repo (shared by Grid + Carousel). */
export function useClients() {
  const [clients, setClients] = useState<ClientEntry[]>([]);
  const [branch, setBranch] = useState("main");
  const [repo, setRepo] = useState("GlassFireStudios/glassfirebrandassets");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/manifest");
      const data = await res.json();
      if (data.error) setError(data.error);
      else {
        setClients(data.clients || []);
        setBranch(data.branch || "main");
        if (data.repo) setRepo(data.repo);
      }
    } catch {
      setError("Failed to load logos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { clients, branch, repo, error, loading, reload };
}
