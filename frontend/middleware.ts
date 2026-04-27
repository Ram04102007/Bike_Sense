import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Passthrough middleware — Clerk auth is handled client-side.
// To re-enable server-side Clerk middleware, set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
// in Vercel environment variables and uncomment the Clerk middleware below.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};