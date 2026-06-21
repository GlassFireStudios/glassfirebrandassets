import { NextRequest, NextResponse } from "next/server";
import { commitChanges } from "@/lib/github";
import type { PublishRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = ["Client Logos/", "Logos/", "Grids/", "Embeds/", "client-logos.json"];

function withinAllowed(path: string): boolean {
  return ALLOWED.some((p) => (p.endsWith("/") ? path.startsWith(p) : path === p));
}

export async function POST(req: NextRequest) {
  let body: PublishRequest;
  try {
    body = (await req.json()) as PublishRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { files, deletes = [], message, branch, createBranch } = body;
  if ((!Array.isArray(files) || files.length === 0) && deletes.length === 0) {
    return NextResponse.json({ error: "Nothing to commit." }, { status: 400 });
  }
  if (!message || !branch) {
    return NextResponse.json({ error: "message and branch are required." }, { status: 400 });
  }

  // Guard: keep all writes + deletes inside the asset folders.
  const badWrite = (files || []).find((f) => !withinAllowed(f.path));
  if (badWrite) {
    return NextResponse.json({ error: `Path "${badWrite.path}" is outside the allowed folders.` }, { status: 400 });
  }
  const badDelete = deletes.find((p) => !withinAllowed(p));
  if (badDelete) {
    return NextResponse.json({ error: `Delete path "${badDelete}" is outside the allowed folders.` }, { status: 400 });
  }

  try {
    const result = await commitChanges(files || [], deletes, message, branch, createBranch ?? true);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Publish failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
