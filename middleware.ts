// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session and trying to access protected routes
  const protectedPaths = [
    "/dashboard",
    "/bookings",
    "/facilities/add",
    "/dashboard/facility-bookings",
    "/dashboard/booking-requests",
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  // Redirect from protected routes if not logged in
  if (!session && isProtectedPath) {
    const redirectUrl = new URL("/auth/login", req.url);
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle auth routes - redirect to dashboard if already logged in
  const isAuthPath = req.nextUrl.pathname.startsWith("/auth/");
  if (session && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

// Run the middleware on these paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/bookings/:path*",
    "/facilities/add",
    "/facilities/:id/edit",
    "/auth/:path*",
  ],
};
