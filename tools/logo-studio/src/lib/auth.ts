// Lightweight shared-password gate for internal use. If APP_PASSWORD is unset
// the app is open (useful for local dev); set it in production + ideally also
// enable Vercel Deployment Protection.

export const AUTH_COOKIE = "gf_auth";

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The cookie value we expect for an authenticated session, or null if no
 *  password is configured (open access). */
export async function expectedToken(): Promise<string | null> {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return null;
  return sha256Hex(`gf-logo-studio::${pw}`);
}
