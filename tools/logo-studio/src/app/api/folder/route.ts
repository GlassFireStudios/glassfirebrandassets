import { NextRequest, NextResponse } from "next/server";
import { listDir } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lists the files within a repo folder (one level). Used by the Manage tab to
// enumerate every file belonging to a client before deleting.
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path", files: [] }, { status: 400 });
  const entries = await listDir(path);
  const files = entries.filter((e) => e.type === "file").map((e) => e.path);
  return NextResponse.json({ files });
}
