import { NextResponse } from "next/server"
import { connect } from "@/dbConfig/dbConfig"
import College from "@/models/colleges"
import Domain from "@/models/domains"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  try {
    await connect()
    
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get("slug")

    let query = {}
    if (slug) {
      query = { slug: slug.toLowerCase() }
    }

    const colleges = await College.find(query)
      .populate('domains', 'domainname')
      .lean()

    const formattedColleges = colleges.map((college) => ({
      id: String(college._id),
      name: college.name,
      slug: college.slug,
      emailDomain: college.emailDomain,
      domains: Array.isArray(college.domains) 
        ? college.domains.map((domain: any) => domain?.domainname || 'Unknown Domain')
        : [],
      logo: college.logo,
      status: college.status,
      createdAt: college.createdAt,
      updatedAt: college.updatedAt,
    }))

    return NextResponse.json({ 
      success: true,
      colleges: formattedColleges 
    })
  } catch (error: any) {
    console.error("Error fetching colleges:", error)
    return NextResponse.json(
      { error: "Failed to fetch colleges", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connect()
    const body = await req.json()
    const { name, slug, emailDomain, domains } = body

    // Validate required fields
    if (!name || !slug || !emailDomain || !domains || domains.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingCollege = await College.findOne({ slug })
    if (existingCollege) {
      return NextResponse.json(
        { error: "College with this slug already exists" },
        { status: 400 }
      )
    }

    // Check if email domain already exists
    const existingEmailDomain = await College.findOne({ emailDomain })
    if (existingEmailDomain) {
      return NextResponse.json(
        { error: "College with this email domain already exists" },
        { status: 400 }
      )
    }

    // Validate that all domains exist
    const domainIds = domains.map((domainId: string) => domainId)
    const existingDomains = await Domain.find({ _id: { $in: domainIds } })
    if (existingDomains.length !== domains.length) {
      return NextResponse.json(
        { error: "One or more domains do not exist" },
        { status: 400 }
      )
    }

    const college = new College({
      name,
      slug: slug.toLowerCase(),
      emailDomain: emailDomain.toLowerCase(),
      domains: domainIds,
      status: "active",
    })

    await college.save()

    return NextResponse.json(
      { message: "College created successfully", college: college },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating college:", error)
    return NextResponse.json(
      { error: "Failed to create college", details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connect()
    const body = await req.json()
    const { id, name, slug, emailDomain, domains, status } = body

    if (!id) {
      return NextResponse.json(
        { error: "College ID is required" },
        { status: 400 }
      )
    }

    const college = await College.findById(id)
    if (!college) {
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      )
    }

    // Check if slug already exists (excluding current college)
    if (slug && slug !== college.slug) {
      const existingCollege = await College.findOne({ slug, _id: { $ne: id } })
      if (existingCollege) {
        return NextResponse.json(
          { error: "College with this slug already exists" },
          { status: 400 }
        )
      }
    }

    // Check if email domain already exists (excluding current college)
    if (emailDomain && emailDomain !== college.emailDomain) {
      const existingEmailDomain = await College.findOne({ 
        emailDomain, 
        _id: { $ne: id } 
      })
      if (existingEmailDomain) {
        return NextResponse.json(
          { error: "College with this email domain already exists" },
          { status: 400 }
        )
      }
    }

    // Validate domains if provided
    if (domains && domains.length > 0) {
      const domainIds = domains.map((domainId: string) => domainId)
      const existingDomains = await Domain.find({ _id: { $in: domainIds } })
      if (existingDomains.length !== domains.length) {
        return NextResponse.json(
          { error: "One or more domains do not exist" },
          { status: 400 }
        )
      }
    }

    // Update fields
    if (name) college.name = name
    if (slug) college.slug = slug.toLowerCase()
    if (emailDomain) college.emailDomain = emailDomain.toLowerCase()
    if (domains) college.domains = domains
    if (status) college.status = status

    await college.save()

    return NextResponse.json(
      { message: "College updated successfully", college: college }
    )
  } catch (error: any) {
    console.error("Error updating college:", error)
    return NextResponse.json(
      { error: "Failed to update college", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connect()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "College ID is required" },
        { status: 400 }
      )
    }

    const college = await College.findByIdAndDelete(id)
    if (!college) {
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: "College deleted successfully" }
    )
  } catch (error: any) {
    console.error("Error deleting college:", error)
    return NextResponse.json(
      { error: "Failed to delete college", details: error.message },
      { status: 500 }
    )
  }
}
