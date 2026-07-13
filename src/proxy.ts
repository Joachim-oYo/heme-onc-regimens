import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/authConstants";

/**
 * Edge proxy (formerly "middleware") provides a fast first line of defense: it
 * redirects unauthenticated page requests for /edit to /login. It only checks
 * that the session cookie is *present* (the Edge runtime lacks node:crypto for
 * the HMAC check). Authoritative validation happens on the Node runtime in the
 * /edit page (server component) and in every mutating API route via
 * requireAdmin().
 */
export function proxy(req: NextRequest) {
  const hasCookie = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/edit/:path*"],
};
