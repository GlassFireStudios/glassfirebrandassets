import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { getConfig } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Streams a repo asset by path (same-origin, so the grid canvas stays
// untainted). Works for private repos too, since it uses the server PAT.
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return new NextResponse("Missing path", { status: 400 });

  try {
    const cfg = getConfig();
    const gh = new Octokit({ auth: cfg.token });
    const res = await gh.repos.getContent({
      owner: cfg.owner,
      repo: cfg.repo,
      path,
      ref: req.nextUrl.searchParams.get("ref") || cfg.baseBranch,
    });
    if (Array.isArray(res.data) || res.data.type !== "file" || !res.data.content) {
      return new NextResponse("Not a file", { status: 404 });
    }
    const buf = Buffer.from(res.data.content, "base64");
    const ext = path.split(".").pop()?.toLowerCase();
    const type =
      ext === "svg" ? "image/svg+xml" :
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
      "image/png";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Fetch failed", { status: 502 });
  }
}
