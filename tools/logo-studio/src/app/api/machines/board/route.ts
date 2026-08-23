import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadBoard, claimMachine, releaseMachine } from "@/lib/board-store";
import { MACHINES, getStatus } from "@/lib/machines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rows = (board: Awaited<ReturnType<typeof loadBoard>>) =>
  MACHINES.map((m) => ({ ...m, status: getStatus(board, m.id) }));

// GET - board state for signed-in editors.
export const GET = auth(async (req) => {
  if (!req.auth?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    return NextResponse.json({ machines: rows(await loadBoard()) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Board unavailable." },
      { status: 500 },
    );
  }
});

// POST - claim/release using the signed-in identity (no spoofing).
//
// State lives in Postgres now, not in a git commit. Sign-in no longer cuts a
// Vercel build, and the claim is atomic: if two editors click the same machine
// at once, the database serialises them instead of one overwriting the other.
export const POST = auth(async (req) => {
  const user = req.auth?.user;
  if (!user?.email) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let body: { id?: string; action?: "claim" | "release" };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const machine = MACHINES.find((m) => m.id === body.id);
  if (!machine) return NextResponse.json({ error: "Unknown machine." }, { status: 400 });

  try {
    if (body.action === "release") {
      await releaseMachine(machine.id, "released");
    } else {
      await claimMachine(machine.id, { name: user.name || user.email, email: user.email });
    }
    return NextResponse.json({ machines: rows(await loadBoard()) });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed." },
      { status: 500 },
    );
  }
});
