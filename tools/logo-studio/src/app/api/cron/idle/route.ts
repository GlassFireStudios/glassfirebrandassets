import { NextRequest, NextResponse } from "next/server";
import { loadBoard, releaseMachine, warnMachine } from "@/lib/board-store";
import { MACHINES } from "@/lib/machines";
import { slackDM } from "@/lib/slack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WARN_AFTER_MS = Number(process.env.MACHINE_IDLE_HOURS || 8) * 3600_000;
const GRACE_MS = Number(process.env.MACHINE_IDLE_GRACE_MIN || 30) * 60_000;

// Hourly Vercel Cron. Warns an editor in Slack once they have been signed onto a
// machine longer than the threshold, then auto-signs them out after a grace
// period. Presence only - it never touches the real computer.
//
// This used to commit board.json on every action, so a quiet overnight run still
// cut Vercel builds. It now writes rows.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let board;
  try { board = await loadBoard(); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Board unavailable." }, { status: 500 }); }

  const now = Date.now();
  const actions: string[] = [];

  for (const m of MACHINES) {
    const s = board.machines[m.id];
    if (!s?.current) continue;

    const age = now - new Date(s.current.since).getTime();
    if (age < WARN_AFTER_MS) continue;

    const hours = Math.round(age / 3600_000);
    const email = s.current.email;

    if (!s.current.warnedAt) {
      if (email) {
        await slackDM(email, `👋 You've been signed onto *${m.name}* for ~${hours}h. Still editing? If not, you'll be auto-signed out in ${Math.round(GRACE_MS / 60_000)} min — open the Machine Tracker to stay on.`);
      }
      await warnMachine(m.id);
      actions.push(`warned ${m.name}`);
    } else if (now - new Date(s.current.warnedAt).getTime() >= GRACE_MS) {
      if (email) {
        await slackDM(email, `Signed you out of *${m.name}* after ~${hours}h. If you're still on it, just sign back in.`);
      }
      await releaseMachine(m.id, "idle");
      actions.push(`released ${m.name}`);
    }
  }

  return NextResponse.json({ ok: true, actions });
}
