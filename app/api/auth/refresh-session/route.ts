import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../[...nextauth]/options"
import { connect } from "@/dbConfig/dbConfig"
import candidates from "@/models/candidates"
import College from "@/models/colleges"

export async function POST(req: NextRequest) {
  try {
    await connect()

    // Get the current session
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the user in database
    const user = await candidates.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return updated user data
    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        collegeId: user.collegeId?.toString(),
        collegeSlug: user.collegeSlug,
        emailDomain: user.emailDomain
      }
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const redirectTo = searchParams.get('redirect')
    const collegeId = searchParams.get('collegeId')
    const collegeSlug = searchParams.get('collegeSlug')
    
    await connect()
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    
    // Get the latest user data from database
    const user = await candidates.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    
    
    
    // If we have college context in URL params, ensure it's in the database
    if (collegeId && collegeSlug && (!user.collegeId || !user.collegeSlug)) {
      await candidates.findByIdAndUpdate(user._id, {
        collegeId: collegeId,
        collegeSlug: collegeSlug
      })
    }
    
    // For college candidates without college context, try to detect and add it
    if (!user.collegeId && user.email && user.email.includes('@')) {
      const emailDomain = user.email.split('@')[1]
      const college = await College.findOne({ emailDomain })
      if (college) {
        await candidates.findByIdAndUpdate(user._id, {
          collegeId: college._id,
          collegeSlug: college.slug,
          emailDomain: college.emailDomain
        })
        // Update user object for this request
        user.collegeId = college._id
        user.collegeSlug = college.slug
        user.emailDomain = college.emailDomain
      }
    }
    
    // Force NextAuth to refresh the session by setting a cookie
    const response = NextResponse.redirect(new URL(redirectTo || "/candidate/profile", req.url))
    
    // Set a flag to force session refresh
    response.cookies.set('force-session-refresh', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 // 1 minute
    })
    
    return response
    
  } catch (error: any) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
}
