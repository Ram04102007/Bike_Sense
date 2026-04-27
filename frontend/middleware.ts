// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// import { NextResponse } from "next/server";

// const isPublicRoute = createRouteMatcher([
//   "/",
//   "/auth/login",
//   "/auth/signup",
//   "/api/health",
// ]);

// const isAdminRoute    = createRouteMatcher(["/admin(.*)"]);
// const isConsumerRoute = createRouteMatcher(["/consumer(.*)"]);

// export default clerkMiddleware(async (auth, req) => {
//   const { userId, sessionClaims } = await auth();

//   // Allow public routes
//   if (isPublicRoute(req)) return;

//   // Require auth for protected routes
//   if (!userId) {
//     return NextResponse.redirect(new URL("/auth/login", req.url));
//   }

//   const role = (sessionClaims?.unsafeMetadata as any)?.role;

//   // Role-based route protection
//   if (isAdminRoute(req) && role !== "admin") {
//     return NextResponse.redirect(new URL("/consumer/home", req.url));
//   }
//   if (isConsumerRoute(req) && role !== "consumer") {
//     return NextResponse.redirect(new URL("/admin/dashboard", req.url));
//   }
// });

// export const config = {
//   matcher: ["/((?!_next|.*\\..*).*)"],
// };

import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};