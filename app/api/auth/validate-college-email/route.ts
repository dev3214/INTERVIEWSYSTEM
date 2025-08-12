import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getToken } from "next-auth/jwt"
import { authOptions } from "../[...nextauth]/options"
import { connect } from "@/dbConfig/dbConfig"
import candidates from "@/models/candidates"
import College from "@/models/colleges"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const collegeSlug = searchParams.get("collegeSlug")

    if (!collegeSlug) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Connect to database first
    await connect()

    // Find college using the slug from URL
    const college = await College.findOne({ slug: collegeSlug })
    
    if (!college) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Get the current session
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    const userEmail = session.user.email

    // Extract email domain from user's email
    const userEmailDomain = userEmail.split('@')[1]

    // Validate email domain against college's email domain
    if (userEmailDomain !== college.emailDomain) {
      // Email domain doesn't match - redirect back to college login with error
      const errorMessage = `Only @${college.emailDomain} emails are allowed for ${college.name}. Please use your college email address.`
      const redirectUrl = `/login/${collegeSlug}?error=${encodeURIComponent(errorMessage)}`
      
      // First, delete the user if they exist (to prevent any access)
      const existingUser = await candidates.findOne({ email: userEmail })
      if (existingUser) {
        await candidates.findByIdAndDelete(existingUser._id)
      }
      
      // Clear the session by setting a response with cleared cookies
      const response = NextResponse.redirect(new URL(redirectUrl, req.url))
      
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
    const refreshUrl = `/api/auth/refresh-session?redirect=/candidate/profile&collegeId=${college._id}&collegeSlug=${college.slug}`
    return NextResponse.redirect(new URL(refreshUrl, req.url))

  } catch (error: any) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
}
