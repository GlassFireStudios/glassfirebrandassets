import { NextRequest, NextResponse } from "next/server";
import { commitChanges, getTextFile } from "@/lib/github";
import { slugify } from "@/lib/slug";
import type { RenderedFile, Testimonial, TestimonialInvite } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || "main";
const MAX_HEADSHOT_BYTES = 3 * 1024 * 1024;

async function loadInvite(token: string): Promise<TestimonialInvite | null> {
  const raw = await getTextFile(`Testimonials/_invites/${token}.json`);
  if (!raw) return null;
  try { return JSON.parse(raw) as TestimonialInvite; } catch { return null; }
}

// GET — returns the invite so the public form can pre-fill company/role.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await loadInvite(token);
  if (!invite) return NextResponse.json({ error: "This capture link is invalid or expired." }, { status: 404 });
  return NextResponse.json({ company: invite.company, role: invite.role ?? "", clientName: invite.clientName ?? "" });
}

interface SubmitBody {
  name?: string;
  role?: string;
  quote?: string;
  rating?: number;
  consent?: boolean;
  headshotBase64?: string; // no data: prefix
  headshotExt?: string; // png | jpg | jpeg | webp
  website?: string; // honeypot — must stay empty
}

// POST — accepts a client's submission and stores it as pending for moderation.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await loadInvite(token);
  if (!invite) return NextResponse.json({ error: "This capture link is invalid or expired." }, { status: 404 });

  let body: SubmitBody;
  try { body = (await req.json()) as SubmitBody; } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  if (body.website) return NextResponse.json({ ok: true }); // bot trap — pretend success
  const name = (body.name || "").trim();
  const quote = (body.quote || "").trim();
  if (!name || !quote) return NextResponse.json({ error: "Name and testimonial are required." }, { status: 400 });
  if (!body.consent) return NextResponse.json({ error: "Please confirm we may use your testimonial." }, { status: 400 });

  const slug = `${slugify(invite.company)}-${slugify(name)}-${Date.now().toString(36).slice(-4)}`;
  const files: RenderedFile[] = [];
  let headshotPath: string | undefined;

  if (body.headshotBase64) {
    const ext = ["png", "jpg", "jpeg", "webp"].includes((body.headshotExt || "").toLowerCase()) ? body.headshotExt!.toLowerCase() : "png";
    if (Buffer.byteLength(body.headshotBase64, "base64") > MAX_HEADSHOT_BYTES) {
      return NextResponse.json({ error: "Headshot is too large (max 3MB)." }, { status: 400 });
    }
    headshotPath = `Testimonials/headshots/${slug}.${ext}`;
    files.push({ path: headshotPath, base64: body.headshotBase64 });
  }

  const rating = typeof body.rating === "number" ? Math.max(1, Math.min(5, Math.round(body.rating))) : undefined;
  const testimonial: Testimonial = {
    slug,
    name,
    role: (body.role || invite.role || "").trim() || undefined,
    company: invite.company,
    clientName: invite.clientName || undefined,
    quote,
    rating,
    headshot: headshotPath,
    consent: true,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  files.push({
    path: `Testimonials/pending/${slug}.json`,
    base64: Buffer.from(JSON.stringify(testimonial, null, 2), "utf-8").toString("base64"),
  });

  try {
    await commitChanges(files, [], `Testimonial submission: ${invite.company} (${name})`, BASE_BRANCH, false);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Submission failed." }, { status: 500 });
  }
}
