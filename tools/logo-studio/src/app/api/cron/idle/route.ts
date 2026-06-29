import { NextRequest, NextResponse } from "next/server";
import { commitChanges, getTextFile } from "@/lib/github";
import { MACHINES, release, type BoardState } from "@/lib/machines";
import { slackDM } from "@/lib/slack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || "main";
const BOARD_PATH = "Machines/board.json";
const WARN_AFTER_MS = Number(process.env.MACHINE_IDLE_HOURS || 8) * 3600_000;
const GRACE_MS = Number(process.env.MACHINE_IDLE_GRACE_MIN || 30) * 60_000;

// Hourly Vercel Cron. Warns an editor in Slack once they've been signed onto a
// machine longer than the threshold, then auto–signs them out after a grace
// period. Presence only — it never touches the real computer.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await getTextFile(BOARD_PATH);
  if (!raw) return NextResponse.json({ ok: true, actions: [] });
  let board: BoardState;
  try { board = JSON.parse(raw); } catch { return NextResponse.json({ ok: true, actions: [] }); }

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const actions: string[] = [];
  let changed = false;

  for (const m of MACHINES) {
    const s = board.machines[m.id];
    if (!s?.current) continue;
    const age = now - new Date(s.current.since).getTime();
    if (age < WARN_AFTER_MS) continue;
    const hours = Math.round(age / 3600_000);
    const email = s.current.email;

    if (!s.current.warnedAt) {
      if (email) await slackDM(email, `👋 You've been signed onto *${m.name}* for ~${hours}h. Still editing? If not, you'll be auto–signed out in ${Math.round(GRACE_MS / 60_000)} min — open the Machine Tracker to stay on.`);
      s.current.warnedAt = nowIso;
      changed = true;
      actions.push(`warned ${m.name}`);
    } else if (now - new Date(s.current.warnedAt).getTime() >= GRACE_MS) {
      if (email) await slackDM(email, `Signed you out of *${m.name}* after ~${hours}h. If you're still on it, just sign back in.`);
      board.machines[m.id] = release(s, nowIso);
      changed = true;
      actions.push(`released ${m.name}`);
    }
  }

  if (changed) {
    try {
      await commitChanges([{ path: BOARD_PATH, base64: Buffer.from(JSON.stringify(board, null, 2), "utf-8").toString("base64") }], [],
        `Idle check: ${actions.join(", ")}`, BASE_BRANCH, false);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "commit failed", actions }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true, actions });
}
