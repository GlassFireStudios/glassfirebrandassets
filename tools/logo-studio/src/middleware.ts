import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, expectedToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = await expectedToken();
  if (!token) return NextResponse.next(); // no password configured -> open

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/api/login")) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === token) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
