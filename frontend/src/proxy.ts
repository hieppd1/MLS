import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy for MLS Next.js App (Next.js 16 — renamed from middleware).
 * Injects x-pathname into request headers so generateMetadata()
 * can build canonical/hreflang URLs without depending on URL segments.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Clone request headers and inject x-pathname
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Match all paths except Next.js internals, API routes and static files
  matcher: [
    "/((?!_next|_vercel|api|.*\\..*).*)",
  ],
};
