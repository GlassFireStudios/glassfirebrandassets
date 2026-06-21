import { NextRequest, NextResponse } from "next/server";
import { brandfetchSearch } from "@/lib/sources/brandfetch";
import { clearbitCandidates } from "@/lib/sources/clearbit";
import { googleImageCandidates } from "@/lib/sources/google";
import type { LogoCandidate } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ candidates: [] });

  const [brandfetch, google] = await Promise.all([
    brandfetchSearch(q).catch(() => [] as LogoCandidate[]),
    googleImageCandidates(q).catch(() => [] as LogoCandidate[]),
  ]);

  // Feed any domains Brandfetch discovered into Clearbit as extra candidates.
  const domains = [...new Set(brandfetch.map((c) => c.domain).filter(Boolean) as string[])];
  const clearbit = clearbitCandidates(q, domains);

  // Brandfetch first (highest quality), then Clearbit, then web results.
  const candidates = [...brandfetch, ...clearbit, ...google];

  const sources = {
    brandfetch: brandfetch.length,
    clearbit: clearbit.length,
    google: google.length,
    brandfetchConfigured: Boolean(process.env.BRANDFETCH_CLIENT_ID || process.env.BRANDFETCH_API_KEY),
    googleConfigured: Boolean(process.env.GOOGLE_CSE_KEY && process.env.GOOGLE_CSE_ID),
  };

  return NextResponse.json({ candidates, sources });
}
