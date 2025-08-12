import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req:request, secret: process.env.NEXTAUTH_SECRET })

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isCandidatePage = request.nextUrl.pathname.startsWith("/candidate");

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // For candidate pages, check if user has college context
  if (token && isCandidatePage && token.role === "candidate") {
    // If user does not yet have an _id, allow access to the profile page so they can finish onboarding
    if (!token._id) {
      if (request.nextUrl.pathname !== "/candidate/profile") {
        return NextResponse.redirect(new URL("/candidate/profile", request.url));
      }
      // Already on profile page; let the request through to avoid redirect loop
      return NextResponse.next();
    }
    
            // For college candidates, ensure they have college context
        if (token.collegeId && (!token.collegeSlug)) {
          return NextResponse.redirect(new URL("/login", request.url));
        }
        
        // For college candidates without college context, force a session refresh
        if (token.role === "candidate" && !token._id && token.email && token.email.includes('@')) {
          // This might be a college candidate - check if they have college context in database
          return NextResponse.redirect(new URL(`/api/auth/refresh-session?redirect=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
        }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
