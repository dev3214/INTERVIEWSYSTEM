import { connect } from "@/dbConfig/dbConfig"
import candidates from "@/models/candidates"
import { type NextRequest, NextResponse } from "next/server"
import Domain from "@/models/domains"
import Round from "@/models/rounds"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/options"

export async function PUT(req: NextRequest) {
  try {
    // Connect to database
    await connect()

    // Get the current session
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reqBody = await req.json()
    const { workDomain } = reqBody

    if (!workDomain || !workDomain.id || !workDomain.name) {
      return NextResponse.json({ 
        error: "Work domain with id and name is required", 
        success: false 
      }, { status: 400 })
    }

    // Find the candidate by email
    const existingCandidate = await candidates.findOne({ email: session.user.email })
    if (!existingCandidate) {
      return NextResponse.json({ 
        error: "Candidate not found", 
        success: false 
      }, { status: 404 })
    }

    // Defensive: ensure progress is always an array
    if (!Array.isArray(existingCandidate.progress)) {
      existingCandidate.progress = [];
    }

    // --- Domain Change Logic ---
    const previousDomainId = existingCandidate.workDomain?.id?.toString();
    const newDomainId = workDomain.id.toString();

    if (newDomainId !== previousDomainId) {
      // Mark previous domain's progress as 'abandoned' if it exists
      if (previousDomainId) {
        const previousProgress = existingCandidate.progress.find((p: any) => p.domainId?.toString() === previousDomainId);
        if (previousProgress) {
          previousProgress.status = 'abandoned';
        }
      }
      
      // Find or create progress for the new domain
      let newDomainProgress = existingCandidate.progress.find((p: any) => p.domainId?.toString() === newDomainId);
      if (newDomainProgress) {
        // If returning to a domain, mark it as in-progress
        newDomainProgress.status = 'in-progress';
      } else {
        // If it's a completely new domain, add a new progress entry
        existingCandidate.progress.push({
          domainId: workDomain.id,
          domainName: workDomain.name,
          currentround: 0,
          currentroundname: "",
          status: 'in-progress'
        });
      }

      // --- Recalculate top-level status for the new domain ---
      const domainDoc = await Domain.findById(newDomainId).lean() as { rounds?: any[] };
      const totalRounds = domainDoc && Array.isArray(domainDoc.rounds) ? domainDoc.rounds.length : 0;
      newDomainProgress = existingCandidate.progress.find((p: any) => p.domainId?.toString() === newDomainId);
      if (newDomainProgress && totalRounds > 0 && newDomainProgress.currentround >= totalRounds) {
        newDomainProgress.status = "completed";
        existingCandidate.status = "waiting-for-assignment";
      } else {
        existingCandidate.status = "in-progress";
      }
    }

    // Update only the work domain and progress
    const updatedCandidate = await candidates.findOneAndUpdate(
      { _id: existingCandidate._id },
      {
        workDomain: { id: workDomain.id, name: workDomain.name },
        progress: existingCandidate.progress,
        status: existingCandidate.status,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )

    return NextResponse.json({
      message: "Work domain updated successfully",
      candidate: updatedCandidate,
      success: true,
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error updating work domain:", error)
    return NextResponse.json({ 
      error: error.message || "Internal Server Error", 
      success: false 
    }, { status: 500 })
  }
}
