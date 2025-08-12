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
    // Check if user has a complete profile by checking if they have an _id
    if (!token._id) {
      console.log("🔍 [MIDDLEWARE] New candidate without profile, redirecting to profile page")
      return NextResponse.redirect(new URL("/candidate/profile", request.url));
    }
    
            // For college candidates, ensure they have college context
        if (token.collegeId && (!token.collegeSlug)) {
          console.log("🔍 [MIDDLEWARE] College candidate without college context, redirecting to login")
          return NextResponse.redirect(new URL("/login", request.url));
        }
        
        // For college candidates without college context, force a session refresh
        if (token.role === "candidate" && !token._id && token.email && token.email.includes('@')) {
          // This might be a college candidate - check if they have college context in database
          console.log("🔍 [MIDDLEWARE] Potential college candidate without context, forcing refresh")
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
