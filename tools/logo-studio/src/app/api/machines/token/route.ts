import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the shareable no-login link token for the machine tracker.
//
// This used to MINT a token and COMMIT it to Machines/_access.json. That file
// lives in a PUBLIC repo, and /m/[token] is exempted in middleware, so the only
// thing gating the tracker was a secret published on the internet. The token is
// now an environment variable, and the one that was committed must be treated
// as burned: set a NEW value for MACHINE_TRACKER_TOKEN, do not reuse it.
//
// Generate one with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
export const GET = auth(async (req) => {
  if (!req.auth?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const token = process.env.MACHINE_TRACKER_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Share link is not configured: set MACHINE_TRACKER_TOKEN." },
      { status: 503 },
    );
  }
  return NextResponse.json({ token });
});
