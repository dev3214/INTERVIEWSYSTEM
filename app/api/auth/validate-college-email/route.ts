import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getToken } from "next-auth/jwt"
import { authOptions } from "../[...nextauth]/options"
import { connect } from "@/dbConfig/dbConfig"
import candidates from "@/models/candidates"
import College from "@/models/colleges"

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 [DEBUG] validate-college-email called")
    const { searchParams } = new URL(req.url)
    const collegeSlug = searchParams.get("collegeSlug")
    console.log("🔍 [DEBUG] collegeSlug:", collegeSlug)

    if (!collegeSlug) {
      console.log("❌ [DEBUG] No collegeSlug provided")
      const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
      return NextResponse.redirect(new URL("/login", baseUrl))
    }

    // Connect to database first
    await connect()

    // Find college using the slug from URL
    const college = await College.findOne({ slug: collegeSlug })
    console.log("🔍 [DEBUG] Found college:", college?.name || "Not found")
    
    if (!college) {
      console.log("❌ [DEBUG] College not found for slug:", collegeSlug)
      const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
      return NextResponse.redirect(new URL("/login", baseUrl))
    }

    // Get the current session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
      return NextResponse.redirect(new URL("/login", baseUrl))
    }

    const userEmail = session.user.email
    console.log("🔍 [DEBUG] User email:", userEmail)

    // Extract email domain from user's email
    const userEmailDomain = userEmail.split('@')[1]
    console.log("🔍 [DEBUG] User email domain:", userEmailDomain)
    console.log("🔍 [DEBUG] College email domain:", college.emailDomain)

    // Validate email domain against college's email domain
    if (userEmailDomain !== college.emailDomain) {
      console.log("❌ [DEBUG] Email domain mismatch")
      // Email domain doesn't match - redirect back to college login with error
      const errorMessage = `Only @${college.emailDomain} emails are allowed for ${college.name}. Please use your college email address.`
      const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
      const redirectUrl = `${baseUrl}/login/${collegeSlug}?error=${encodeURIComponent(errorMessage)}`
      
      // First, delete the user if they exist (to prevent any access)
      const existingUser = await candidates.findOne({ email: userEmail })
      if (existingUser) {
        await candidates.findByIdAndDelete(existingUser._id)
      }
      
      // Clear the session by setting a response with cleared cookies
      const response = NextResponse.redirect(new URL(redirectUrl))
      
      // Clear the NextAuth session cookies
      response.cookies.delete('next-auth.session-token')
      response.cookies.delete('next-auth.csrf-token')
      response.cookies.delete('next-auth.callback-url')
      response.cookies.delete('__Secure-next-auth.session-token')
      response.cookies.delete('__Secure-next-auth.csrf-token')
      response.cookies.delete('__Secure-next-auth.callback-url')
      
      return response
    }

    
    // Email domain is valid - create or update user with college context
    let user = await candidates.findOne({ email: userEmail })
    
    if (user) {
      // Update existing user with college context
      await candidates.findByIdAndUpdate(user._id, {
        collegeId: college._id,
        collegeSlug: college.slug,
        emailDomain: college.emailDomain
      })
    } else {
      // Create new user with college context
      user = await candidates.create({
        email: userEmail,
        username: session.user.username || userEmail.split('@')[0],
        password: "",
        role: "candidate",
        collegeId: college._id,
        collegeSlug: college.slug,
        emailDomain: college.emailDomain
      })
    }

    // Force a session refresh by redirecting to a special endpoint that will refresh and redirect
    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
    const refreshUrl = `${baseUrl}/api/auth/refresh-session?redirect=/candidate/profile&collegeId=${college._id}&collegeSlug=${college.slug}`
    return NextResponse.redirect(new URL(refreshUrl))

  } catch (error: any) {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL("/login", baseUrl))
  }
}
