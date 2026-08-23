import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { loadBoard, claimMachine, releaseMachine } from "@/lib/board-store";
import { MACHINES, getStatus } from "@/lib/machines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The no-login tracker. /m/ is exempted in middleware, so this token is the ONLY
// gate. It used to be read from Machines/_access.json in this PUBLIC repo, which
// meant the gate was published on the internet. It now comes from the
// environment, and the previously committed value is burned.
function validToken(token: string): boolean {
  const expected = process.env.MACHINE_TRACKER_TOKEN;
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  // Constant-time compare, length-guarded (timingSafeEqual throws on a mismatch).
  return a.length === b.length && timingSafeEqual(a, b);
}

const rows = (board: Awaited<ReturnType<typeof loadBoard>>) =>
  MACHINES.map((m) => ({ ...m, status: getStatus(board, m.id) }));

// GET - current board state for the tracker.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!validToken(token)) return NextResponse.json({ error: "Invalid link." }, { status: 403 });
  try {
    return NextResponse.json({ machines: rows(await loadBoard()) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Board unavailable." }, { status: 500 });
  }
}

interface Body { id?: string; action?: "claim" | "release"; name?: string }

// POST - sign on / sign off a machine. Presence only; never touches the real PC.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!validToken(token)) return NextResponse.json({ error: "Invalid link." }, { status: 403 });

  let body: Body;
  try { body = (await req.json()) as Body; } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const machine = MACHINES.find((m) => m.id === body.id);
  if (!machine) return NextResponse.json({ error: "Unknown machine." }, { status: 400 });

  const name = (body.name || "").trim();
  if (body.action !== "release" && !name) {
    return NextResponse.json({ error: "Add your name first." }, { status: 400 });
  }

  try {
    if (body.action === "release") await releaseMachine(machine.id, "released");
    else await claimMachine(machine.id, { name });
    return NextResponse.json({ machines: rows(await loadBoard()) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Update failed." }, { status: 500 });
  }
}
