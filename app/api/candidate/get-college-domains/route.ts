import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"
import { connect } from "@/dbConfig/dbConfig"
import candidates from "@/models/candidates"
import domains from "@/models/domains"
import College from "@/models/colleges"

export async function GET(req: NextRequest) {
  try {
    await connect()
    
    // Get the current session
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the candidate in database
    const candidate = await candidates.findOne({ email: session.user.email })
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    

    let domainsList
    if (candidate.collegeId) {
      // Candidate has college context - get college-specific domains
      const college = await College.findById(candidate.collegeId)
      if (college && college.domains && college.domains.length > 0) {
        // Get domains that belong to this college
        domainsList = await domains.find({
          _id: { $in: college.domains }
        }).select('_id domainname description isActive')
        
      } else {
        // College has no domains assigned - get all domains
        domainsList = await domains.find({}).select('_id domainname description isActive')
        
      }
    } else {
      // Candidate has no college context - get all domains
      domainsList = await domains.find({}).select('_id domainname description isActive')
      
    }

    // Ensure we always return an array
    if (!domainsList || domainsList.length === 0) {
      domainsList = []
    }

    return NextResponse.json({
      success: true,
      domains: domainsList,
      hasCollegeContext: !!candidate.collegeId,
      collegeSlug: candidate.collegeSlug
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
