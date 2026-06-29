import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { commitChanges, getTextFile } from "@/lib/github";
import { MACHINES, claim, release, getStatus, type BoardState } from "@/lib/machines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || "main";
const BOARD_PATH = "Machines/board.json";

async function loadBoard(): Promise<BoardState> {
  const raw = await getTextFile(BOARD_PATH);
  if (!raw) return { machines: {} };
  try { return JSON.parse(raw) as BoardState; } catch { return { machines: {} }; }
}
const rows = (board: BoardState) => MACHINES.map((m) => ({ ...m, status: getStatus(board, m.id) }));
const b64 = (s: string) => Buffer.from(s, "utf-8").toString("base64");

// GET — board state for signed-in editors.
export const GET = auth(async (req) => {
  if (!req.auth?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  return NextResponse.json({ machines: rows(await loadBoard()) });
});

// POST — claim/release using the signed-in identity (no spoofing).
export const POST = auth(async (req) => {
  const user = req.auth?.user;
  if (!user?.email) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let body: { id?: string; action?: "claim" | "release" };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const machine = MACHINES.find((m) => m.id === body.id);
  if (!machine) return NextResponse.json({ error: "Unknown machine." }, { status: 400 });

  const board = await loadBoard();
  const now = new Date().toISOString();
  const status = getStatus(board, machine.id);
  const who = { name: user.name || user.email, email: user.email };
  board.machines[machine.id] = body.action === "release" ? release(status, now) : claim(status, who, now);

  try {
    await commitChanges([{ path: BOARD_PATH, base64: b64(JSON.stringify(board, null, 2)) }], [],
      `Machine ${machine.name}: ${who.name} ${body.action === "release" ? "signed out" : "signed in"}`, BASE_BRANCH, false);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Update failed." }, { status: 500 });
  }
  return NextResponse.json({ machines: rows(board) });
});
