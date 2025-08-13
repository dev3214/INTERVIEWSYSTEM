import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getToken } from "next-auth/jwt"
import { authOptions } from "../[...nextauth]/options"
import { connect } from "@/dbConfig/dbConfig"
import candidates from "@/models/candidates"
import College from "@/models/colleges"

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 [VALIDATE-COLLEGE] ===== VALIDATE COLLEGE EMAIL STARTED =====")
    console.log("🔍 [VALIDATE-COLLEGE] Request URL:", req.url)
    console.log("🔍 [VALIDATE-COLLEGE] Request headers:", Object.fromEntries(req.headers.entries()))
    
    const { searchParams } = new URL(req.url)
    const collegeSlug = searchParams.get("collegeSlug")
    console.log("🔍 [VALIDATE-COLLEGE] College slug from URL:", collegeSlug)

    if (!collegeSlug) {
      console.log("❌ [VALIDATE-COLLEGE] No collegeSlug provided in URL")
      const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
      console.log("🔍 [VALIDATE-COLLEGE] Redirecting to base login with baseUrl:", baseUrl)
      return NextResponse.redirect(new URL("/login", baseUrl))
    }

    // Connect to database first
    console.log("🔍 [VALIDATE-COLLEGE] Connecting to database...")
    await connect()
    console.log("✅ [VALIDATE-COLLEGE] Database connected successfully")

    // Find college using the slug from URL
    console.log("🔍 [VALIDATE-COLLEGE] Searching for college with slug:", collegeSlug)
    const college = await College.findOne({ slug: collegeSlug })
    console.log("🔍 [VALIDATE-COLLEGE] College search result:", {
      found: !!college,
      name: college?.name,
      id: college?._id,
      emailDomain: college?.emailDomain,
      slug: college?.slug
    })
    
    if (!college) {
      console.log("❌ [VALIDATE-COLLEGE] College not found for slug:", collegeSlug)
      const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
      console.log("🔍 [VALIDATE-COLLEGE] Redirecting to base login with baseUrl:", baseUrl)
      return NextResponse.redirect(new URL("/login", baseUrl))
    }

    // Get the current session
    console.log("🔍 [VALIDATE-COLLEGE] Getting server session...")
    const session = await getServerSession(authOptions)
    console.log("🔍 [VALIDATE-COLLEGE] Session data:", {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      collegeId: session?.user?.collegeId,
      collegeSlug: session?.user?.collegeSlug
    })
    
    if (!session?.user?.email) {
      console.log("❌ [VALIDATE-COLLEGE] No session or user email found")
      const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
      console.log("🔍 [VALIDATE-COLLEGE] Redirecting to base login with baseUrl:", baseUrl)
      return NextResponse.redirect(new URL("/login", baseUrl))
    }

    // Check if user already has a session with a different college context
    if (session.user.collegeId && session.user.collegeSlug !== collegeSlug) {
      console.log("❌ [VALIDATE-COLLEGE] Session has different college context:", {
        currentCollege: session.user.collegeSlug,
        requestedCollege: collegeSlug
      })
      const errorMessage = `You are already logged in with ${session.user.collegeSlug}. Please logout first to access a different college portal.`
      const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
      const redirectUrl = `${baseUrl}/login/${collegeSlug}?error=${encodeURIComponent(errorMessage)}`
      console.log("🔍 [VALIDATE-COLLEGE] Redirecting with error:", redirectUrl)
      
      // Clear the session
      const response = NextResponse.redirect(new URL(redirectUrl))
      response.cookies.delete('next-auth.session-token')
      response.cookies.delete('next-auth.csrf-token')
      response.cookies.delete('next-auth.callback-url')
      response.cookies.delete('__Secure-next-auth.session-token')
      response.cookies.delete('__Secure-next-auth.csrf-token')
      response.cookies.delete('__Secure-next-auth.callback-url')
      
      return response
    }

    const userEmail = session.user.email
    console.log("🔍 [VALIDATE-COLLEGE] User email:", userEmail)

    // Extract email domain from user's email
    const userEmailDomain = userEmail.split('@')[1]
    console.log("🔍 [VALIDATE-COLLEGE] Email domain comparison:", {
      userEmailDomain: userEmailDomain,
      collegeEmailDomain: college.emailDomain,
      match: userEmailDomain === college.emailDomain
    })

    // Validate email domain against college's email domain
    if (userEmailDomain !== college.emailDomain) {
      console.log("❌ [VALIDATE-COLLEGE] Email domain mismatch - access denied")
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
    console.log("🔍 [VALIDATE-COLLEGE] Email domain valid - processing user creation/update")
    let user = await candidates.findOne({ email: userEmail })
    console.log("🔍 [VALIDATE-COLLEGE] Existing user check:", {
      found: !!user,
      userId: user?._id,
      existingCollegeId: user?.collegeId,
      existingCollegeSlug: user?.collegeSlug
    })
    
    if (user) {
      // Check if user already belongs to a different college
      if (user.collegeId && user.collegeId.toString() !== college._id.toString()) {
        console.log("❌ [VALIDATE-COLLEGE] User already belongs to different college:", {
          existingCollege: user.collegeSlug,
          requestedCollege: college.slug
        })
        const errorMessage = `You are already registered with ${user.collegeSlug}. You cannot access multiple college portals.`
        const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
        const redirectUrl = `${baseUrl}/login/${collegeSlug}?error=${encodeURIComponent(errorMessage)}`
        console.log("🔍 [VALIDATE-COLLEGE] Redirecting with college conflict error:", redirectUrl)
        
        // Clear the session
        const response = NextResponse.redirect(new URL(redirectUrl))
        response.cookies.delete('next-auth.session-token')
        response.cookies.delete('next-auth.csrf-token')
        response.cookies.delete('next-auth.callback-url')
        response.cookies.delete('__Secure-next-auth.session-token')
        response.cookies.delete('__Secure-next-auth.csrf-token')
        response.cookies.delete('__Secure-next-auth.callback-url')
        
        return response
      }
      
      // Update existing user with college context (if same college or no college)
      console.log("✅ [VALIDATE-COLLEGE] Updating existing user with college context")
      await candidates.findByIdAndUpdate(user._id, {
        collegeId: college._id,
        collegeSlug: college.slug,
        emailDomain: college.emailDomain
      })
      console.log("✅ [VALIDATE-COLLEGE] User updated successfully")
    } else {
      // Create new user with college context
      console.log("✅ [VALIDATE-COLLEGE] Creating new user with college context")
      user = await candidates.create({
        email: userEmail,
        username: session.user.username || userEmail.split('@')[0],
        password: "",
        role: "candidate",
        collegeId: college._id,
        collegeSlug: college.slug,
        emailDomain: college.emailDomain
      })
      console.log("✅ [VALIDATE-COLLEGE] New user created successfully:", user._id)
    }

    // Force a session refresh by redirecting to a special endpoint that will refresh and redirect
    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
    const refreshUrl = `${baseUrl}/api/auth/refresh-session?redirect=/candidate/profile&collegeId=${college._id}&collegeSlug=${college.slug}`
    console.log("✅ [VALIDATE-COLLEGE] Authentication successful - redirecting to refresh session")
    console.log("🔍 [VALIDATE-COLLEGE] Refresh URL:", refreshUrl)
    console.log("🔍 [VALIDATE-COLLEGE] ===== VALIDATE COLLEGE EMAIL COMPLETED =====")
    return NextResponse.redirect(new URL(refreshUrl))

  } catch (error: any) {
    console.log("❌ [VALIDATE-COLLEGE] Exception occurred:", error)
    console.log("🔍 [VALIDATE-COLLEGE] Error stack:", error.stack)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3000'
    console.log("🔍 [VALIDATE-COLLEGE] Redirecting to base login due to error with baseUrl:", baseUrl)
    return NextResponse.redirect(new URL("/login", baseUrl))
  }
}
