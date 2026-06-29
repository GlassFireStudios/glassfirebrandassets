import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { commitChanges, getTextFile } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || "main";

// Returns the long, unguessable public-link token for the machine tracker,
// creating + committing one on first use. Authed (behind the app password).
export async function GET() {
  const raw = await getTextFile("Machines/_access.json");
  if (raw) {
    try { const t = JSON.parse(raw).token; if (t) return NextResponse.json({ token: t }); } catch { /* recreate */ }
  }
  const token = (randomUUID() + randomUUID()).replace(/-/g, "");
  try {
    await commitChanges(
      [{ path: "Machines/_access.json", base64: Buffer.from(JSON.stringify({ token }, null, 2), "utf-8").toString("base64") }],
      [], "Create machine tracker access link", BASE_BRANCH, false,
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to create link." }, { status: 500 });
  }
  return NextResponse.json({ token });
}
