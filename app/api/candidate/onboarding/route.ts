import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/options"
import { connect } from "@/dbConfig/dbConfig"
import candidates from "@/models/candidates"
import { getToken } from "next-auth/jwt"

export async function POST(req: NextRequest) {
  try {
    await connect()

    // Get the session to verify the user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      fullName,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      country,
      preferredDomain,
      totalExperience,
      expectedSalary,
      noticePeriod,
      currentCompany,
      highestDegree,
      institution,
      fieldOfStudy,
      graduationYear,
      gpa,
      skills,
      projects,
      certifications,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      resume
    } = body

    // Validate required fields
    if (!fullName || !phone || !address || !preferredDomain || !totalExperience || !highestDegree || !institution) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 })
    }

    // Check if candidate already exists
    let candidate = await candidates.findOne({ email: session.user.email })

    if (candidate) {
      // Update existing candidate
      const updateData = {
        username: fullName,
        phonenumber: phone,
        dateofBirth: dateOfBirth,
        address,
        city,
        state,
        country,
        workDomain: preferredDomain,
        skills: skills.split(',').map((skill: string) => skill.trim()).filter(Boolean),
        education: [{
          degree: highestDegree,
          institution,
          fieldOfStudy,
          graduationYear,
          gpa
        }],
        professionalDetails: {
          isExperienced: totalExperience !== "0-1",
          yearsOfExperience: totalExperience,
          expectedCTC: expectedSalary,
          noticePeriod,
          currentCompany,
          linkedInUrl: linkedinUrl,
          githubUrl: githubUrl,
        },
        projects,
        certifications,
        portfolioUrl,
        resume,
        lastLogin: new Date()
      }

      candidate = await candidates.findByIdAndUpdate(
        candidate._id,
        updateData,
        { new: true }
      )

      
    } else {
      // Create new candidate
      const candidateData = {
        email: session.user.email,
        username: fullName,
        phonenumber: phone,
        dateofBirth: dateOfBirth,
        address,
        city,
        state,
        country,
        workDomain: preferredDomain,
        role: "candidate",
        skills: skills.split(',').map((skill: string) => skill.trim()).filter(Boolean),
        education: [{
          degree: highestDegree,
          institution,
          fieldOfStudy,
          graduationYear,
          gpa
        }],
        professionalDetails: {
          isExperienced: totalExperience !== "0-1",
          yearsOfExperience: totalExperience,
          expectedCTC: expectedSalary,
          noticePeriod,
          currentCompany,
          linkedInUrl: linkedinUrl,
          githubUrl: githubUrl,
        },
        projects,
        certifications,
        portfolioUrl,
        resume,
        lastLogin: new Date()
      }

      candidate = await candidates.create(candidateData)
      
    }

    // Get the JWT token to update it with the user ID
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (token) {
      // Update the token with the user ID
      token._id = candidate._id.toString()
      token.username = candidate.username
      token.role = candidate.role
      
      // Add college context if available
      if (candidate.collegeId) {
        token.collegeId = candidate.collegeId.toString()
        token.collegeSlug = candidate.collegeSlug
        token.emailDomain = candidate.emailDomain
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile setup completed successfully",
      candidate: {
        _id: candidate._id,
        email: candidate.email,
        username: candidate.username,
        role: candidate.role,
        collegeId: candidate.collegeId,
        collegeSlug: candidate.collegeSlug,
        emailDomain: candidate.emailDomain
      }
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
