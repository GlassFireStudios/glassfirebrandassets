import { NextRequest, NextResponse } from "next/server";
import { commitChanges, getTextFile } from "@/lib/github";
import { MACHINES, claim, release, getStatus, type BoardState } from "@/lib/machines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || "main";
const BOARD_PATH = "Machines/board.json";

async function validToken(token: string): Promise<boolean> {
  const raw = await getTextFile("Machines/_access.json");
  if (!raw) return false;
  try { return JSON.parse(raw).token === token && !!token; } catch { return false; }
}

async function loadBoard(): Promise<BoardState> {
  const raw = await getTextFile(BOARD_PATH);
  if (!raw) return { machines: {} };
  try { return JSON.parse(raw) as BoardState; } catch { return { machines: {} }; }
}

function b64(s: string) { return Buffer.from(s, "utf-8").toString("base64"); }

// GET — current board state for the tracker.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await validToken(token))) return NextResponse.json({ error: "Invalid link." }, { status: 403 });
  const board = await loadBoard();
  return NextResponse.json({ machines: MACHINES.map((m) => ({ ...m, status: getStatus(board, m.id) })) });
}

interface Body { id?: string; action?: "claim" | "release"; name?: string }

// POST — sign on / sign off a machine. Presence only; never touches the real PC.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await validToken(token))) return NextResponse.json({ error: "Invalid link." }, { status: 403 });

  let body: Body;
  try { body = (await req.json()) as Body; } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const machine = MACHINES.find((m) => m.id === body.id);
  if (!machine) return NextResponse.json({ error: "Unknown machine." }, { status: 400 });
  const name = (body.name || "").trim();
  if (body.action === "claim" && !name) return NextResponse.json({ error: "Add your name first." }, { status: 400 });

  const board = await loadBoard();
  const now = new Date().toISOString();
  const status = getStatus(board, machine.id);
  board.machines[machine.id] = body.action === "release" ? release(status, now) : claim(status, name, now);

  try {
    await commitChanges(
      [{ path: BOARD_PATH, base64: b64(JSON.stringify(board, null, 2)) }],
      [], `Machine ${machine.name}: ${name || "session"} ${body.action === "release" ? "signed out" : "signed in"}`,
      BASE_BRANCH, false,
    );
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Update failed." }, { status: 500 });
  }
  return NextResponse.json({ machines: MACHINES.map((m) => ({ ...m, status: getStatus(board, m.id) })) });
}
