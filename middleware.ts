import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("🔍 [MIDDLEWARE] ===== MIDDLEWARE STARTED =====")
  console.log("🔍 [MIDDLEWARE] Request URL:", request.nextUrl.pathname)
  console.log("🔍 [MIDDLEWARE] Request method:", request.method)
  
  const token = await getToken({ req:request, secret: process.env.NEXTAUTH_SECRET })
  console.log("🔍 [MIDDLEWARE] Token data:", {
    hasToken: !!token,
    role: token?.role,
    email: token?.email,
    collegeId: token?.collegeId,
    collegeSlug: token?.collegeSlug
  })

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isCandidatePage = request.nextUrl.pathname.startsWith("/candidate");
  
  console.log("🔍 [MIDDLEWARE] Page type:", {
    isAuthPage,
    isCandidatePage,
    pathname: request.nextUrl.pathname
  })

  if (!token && !isAuthPage) {
    console.log("🔍 [MIDDLEWARE] No token and not auth page - redirecting to login")
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPage) {
    console.log("🔍 [MIDDLEWARE] Has token and is auth page - redirecting to home")
    return NextResponse.redirect(new URL("/", request.url));
  }

  // For candidate pages, check if user has college context
  if (token && isCandidatePage && token.role === "candidate") {
    // Check if user has a complete profile by checking if they have an _id
    if (!token._id) {
      return NextResponse.redirect(new URL("/candidate/profile", request.url));
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

  // Check for college login page access restrictions
  if (token && isAuthPage && token.role === "candidate" && token.collegeId) {
    const pathname = request.nextUrl.pathname;
    console.log("🔍 [MIDDLEWARE] Checking college login restrictions for pathname:", pathname)
    
    if (pathname.startsWith("/login/") && pathname !== "/login/") {
      const collegeSlug = pathname.split("/")[2]; // Extract college slug from /login/college-slug
      console.log("🔍 [MIDDLEWARE] College slug from URL:", collegeSlug)
      console.log("🔍 [MIDDLEWARE] User's college slug:", token.collegeSlug)
      
      // If user is already logged in with a different college, redirect them
      if (token.collegeSlug && token.collegeSlug !== collegeSlug) {
        console.log("❌ [MIDDLEWARE] College mismatch - redirecting with error")
        const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000';
        const redirectUrl = `${baseUrl}/login/${collegeSlug}?error=${encodeURIComponent(`You are already logged in with ${token.collegeSlug}. Please logout first to access this college portal.`)}`;
        console.log("🔍 [MIDDLEWARE] Redirect URL:", redirectUrl)
        return NextResponse.redirect(new URL(redirectUrl));
      }
    }
  }

  console.log("✅ [MIDDLEWARE] ===== MIDDLEWARE COMPLETED - ALLOWING REQUEST =====")
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
