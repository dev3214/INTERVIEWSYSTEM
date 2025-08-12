import { NextRequest, NextResponse } from "next/server"
import { connect } from "@/dbConfig/dbConfig"
import Domain from "@/models/domains"
import College from "@/models/colleges"

export async function GET(req: NextRequest) {
  try {
    await connect()
    
    const { searchParams } = new URL(req.url)
    const collegeId = searchParams.get("collegeId")
    
    if (!collegeId) {
      return NextResponse.json({ error: "College ID is required" }, { status: 400 })
    }

    // Find the college and get its domains
    const college = await College.findById(collegeId)
    if (!college) {
      return NextResponse.json({ error: "College not found" }, { status: 404 })
    }

    // Get the domain IDs for this college
    const collegeDomainIds = college.domains || []

    // Fetch only the domains that belong to this college
    const domains = await Domain.find({
      _id: { $in: collegeDomainIds }
    }).select('_id domainname description isActive')

    return NextResponse.json({
      success: true,
      domains: domains
    })

  } catch (error: any) {
    console.error("Error fetching college domains:", error)
    return NextResponse.json(
      { error: "Failed to fetch domains" },
      { status: 500 }
    )
  }
}

