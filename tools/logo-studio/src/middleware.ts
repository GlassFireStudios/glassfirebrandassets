import { NextRequest, NextResponse } from "next/server";
import { auth, googleConfigured } from "@/auth";
import { AUTH_COOKIE, expectedToken } from "@/lib/auth";

// Routes that are always open: the auth endpoints, the login page, and the
// token-gated public pages (testimonial capture + machine board display).
function isPublic(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/r/") ||
    pathname.startsWith("/api/r/") ||
    pathname.startsWith("/m/") ||
    pathname.startsWith("/api/m/")
  );
}

function redirectToLogin(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

// Google sign-in gate (used once AUTH_GOOGLE_ID is configured).
const googleGate = auth((req) => {
  if (isPublic(req.nextUrl.pathname)) return NextResponse.next();
  if (req.auth) return NextResponse.next();
  return redirectToLogin(req);
});

// Fallback shared-password gate (the original behavior).
async function passwordGate(req: NextRequest) {
  const token = await expectedToken();
  if (!token) return NextResponse.next(); // no password set -> open
  if (isPublic(req.nextUrl.pathname)) return NextResponse.next();
  if (req.cookies.get(AUTH_COOKIE)?.value === token) return NextResponse.next();
  return redirectToLogin(req);
}

export default (googleConfigured ? googleGate : passwordGate) as typeof passwordGate;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|icon.png|apple-icon.png).*)"],
};
