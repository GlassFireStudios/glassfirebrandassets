import { NextRequest, NextResponse } from "next/server";
import { publishFiles } from "@/lib/github";
import type { PublishRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: PublishRequest;
  try {
    body = (await req.json()) as PublishRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { files, message, branch, createBranch } = body;
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }
  if (!message || !branch) {
    return NextResponse.json({ error: "message and branch are required." }, { status: 400 });
  }

  // Guard: keep writes inside the asset folders.
  const allowed = ["Client Logos/", "Logos/", "Grids/"];
  const bad = files.find((f) => !allowed.some((p) => f.path.startsWith(p)));
  if (bad) {
    return NextResponse.json(
      { error: `Path "${bad.path}" is outside the allowed asset folders.` },
      { status: 400 },
    );
  }

  try {
    const result = await publishFiles(files, message, branch, createBranch ?? true);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Publish failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
