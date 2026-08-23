// Machine tracker state, in Postgres.
//
// WHY THIS REPLACED THE OLD DESIGN
// --------------------------------
// The board used to live in Machines/board.json and every sign-in committed it
// to this repo through the GitHub API. That had three problems:
//
//   1. This repo is PUBLIC. board.json published named, timestamped presence
//      history for the whole team, and git history kept every version of it.
//   2. A commit to main cuts a Vercel production build. Each click cost a ~30s
//      deploy; the team was generating 15+ a day.
//   3. It read the board, mutated it, then committed. Two editors clicking in
//      the same window raced: one clobbered the other, or got a 409.
//
// State now lives in the `brandstudio` schema on the shared GlassFire Supabase
// project, one row per session. "Who is on machine X" is the row with
// ended_at IS NULL, and a partial unique index makes that an invariant the
// database enforces, so a double-claim fails atomically instead of silently.
//
// Reached over PostgREST with plain fetch rather than @supabase/supabase-js, so
// this needs no new dependency. Same pattern as displayconductor's release
// workflow. The service-role key is server-only and never reaches the browser.
//
// See SHARED_SUPABASE_RULES.md before changing anything about the schema.

import type { BoardState, MachineStatus } from "./machines";

const SCHEMA = "brandstudio";

function config() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Machine tracker is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return { url: url.replace(/\/+$/, ""), key };
}

/** Call a Postgres function in the brandstudio schema. */
async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { url, key } = config();
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      // Both profiles are needed: Content- for the request body's schema,
      // Accept- for the response. Without them PostgREST looks in `public`.
      "Content-Profile": SCHEMA,
      "Accept-Profile": SCHEMA,
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`brandstudio.${fn} failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

/** The whole board, shaped exactly like the old board.json so the UI is
 *  unchanged. Shaping happens in Postgres, so the response size does not grow
 *  with the table and there is no 1,000-row cap to page past. */
export async function loadBoard(): Promise<BoardState> {
  const machines = await rpc<Record<string, MachineStatus>>("board");
  return { machines: machines || {} };
}

/** Sign an editor onto a machine. Takeover of an occupied machine is handled
 *  inside one function call, so concurrent clicks serialise. */
export async function claimMachine(
  machineId: string,
  who: { name: string; email?: string },
): Promise<void> {
  await rpc("claim_machine", {
    p_machine_id: machineId,
    p_name: who.name,
    p_email: who.email ?? null,
  });
}

/** Sign off. Idempotent: releasing an empty machine is a no-op, not an error. */
export async function releaseMachine(
  machineId: string,
  reason: "released" | "idle" | "admin" = "released",
): Promise<void> {
  await rpc("release_machine", { p_machine_id: machineId, p_reason: reason });
}

/** Mark that the idle cron has nudged the current occupant, so it only warns
 *  once per session. */
export async function warnMachine(machineId: string): Promise<void> {
  await rpc("warn_machine", { p_machine_id: machineId });
}
