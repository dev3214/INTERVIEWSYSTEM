"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Star,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation";


interface Candidate {
  id: string;
  username: string;
  email: string;
  status: string;
  assignedRounds: AssignedRound[];
  [key: string]: any;
}
interface ReviewForm {
  decision: string;
  rating: number;
  feedback: string;
}

// Add types for candidate and round
interface AssignedRound {
  roundNumber: number;
  assignedTo: string;
  assignedToModel: "admins" | "interviewers";
  assignedAt: string;
  responseSubmitted: boolean;
  status: "assigned" | "completed";
  feedback?: string;
  durationMinutes?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  assignedBy?: string; // Added assignedBy field
}

// Helper to fetch user (interviewer/admin/hr) name by ID
async function fetchUserName(userId: string, model: string, role?: string): Promise<string> {
  if (!userId) return "-";
  // Always use admins endpoint for admin and hr
  if (model === 'admins' || role === 'admin' || role === 'hr') {
    const res = await fetch(`/api/admin/admins/${userId}`);
    if (!res.ok) return "-";
    const data = await res.json();
    return data?.username || data?.name || data?.email || "-";
  }
  // Otherwise, use interviewers endpoint
  const res = await fetch(`/api/admin/interviewers/${userId}`);
  if (!res.ok) return "-";
  const data = await res.json();
  return data?.username || data?.name || data?.email || "-";
}

function PreviousRounds({ assignedRounds, currentAdminRoundNumber }: { assignedRounds: AssignedRound[], currentAdminRoundNumber: number }) {
  const [names, setNames] = useState<{ [key: number]: string }>({});
  useEffect(() => {
    async function loadNames() {
      const result: { [key: number]: string } = {};
      for (const round of assignedRounds) {
        if (round.roundNumber < currentAdminRoundNumber) {
          result[round.roundNumber] = await fetchUserName(round.assignedTo, round.assignedToModel);
        }
      }
      setNames(result);
    }
    loadNames();
  }, [assignedRounds, currentAdminRoundNumber]);

  return (
    <div className="space-y-2">
      {assignedRounds.filter((r: AssignedRound) => r.roundNumber < currentAdminRoundNumber).map((round: AssignedRound, idx: number) => {
        let feedback: { decision?: string; rating?: string; feedback?: string } = {};
        try { feedback = round.feedback ? JSON.parse(round.feedback) : {}; } catch {}
        return (
          <div key={idx} className="p-2 border rounded bg-muted">
            <div className="font-semibold">Round {round.roundNumber} ({round.assignedToModel === 'admins' ? 'Admin' : 'Interviewer'}): {names[round.roundNumber] || '-'}</div>
            <div>Date: {round.assignedAt ? new Date(round.assignedAt).toLocaleString() : '-'}</div>
            <div>Decision: {feedback.decision || '-'}</div>
            <div>Rating: {feedback.rating || '-'}</div>
            <div>Feedback: {feedback.feedback || '-'}</div>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({ review, openReviewDialog }: { review: Candidate, openReviewDialog: (review: Candidate) => void }) {
  const router = useRouter();
  const latestRound = review.assignedRounds[review.assignedRounds.length - 1];
  const prevRound = review.assignedRounds.length > 1 ? review.assignedRounds[review.assignedRounds.length - 2] : null;
  const [assignedByName, setAssignedByName] = useState("");
  useEffect(() => {
    if (latestRound?.assignedBy && latestRound?.assignedToModel) {
      fetchUserName(latestRound.assignedBy, latestRound.assignedToModel).then(setAssignedByName);
    } else {
      setAssignedByName("");
    }
  }, [latestRound]);

  let feedback: { score?: string; feedback?: string; decision?: string } = {};
  try {
    feedback = latestRound?.feedback ? JSON.parse(latestRound.feedback) : {};
  } catch {}

  const candidateStatus = (review.status || '').toLowerCase();
  const roundStatus = (latestRound.status || '').toLowerCase();
  const isAccepted = candidateStatus === 'final-accepted' && roundStatus === 'completed' && latestRound.responseSubmitted;
  const isRejected = candidateStatus === 'rejected' && roundStatus === 'completed' && latestRound.responseSubmitted;
  const isCompleted = isAccepted || isRejected;

  return (
    <Card key={review.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={review.candidateAvatar || "/placeholder.svg"} alt={review.name} />
              <AvatarFallback>
                {(review.name ?? "").split(" ").map((n: string) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{review.name}</CardTitle>
              <CardDescription>
                {latestRound ? `Round ${latestRound.roundNumber}` : ""} • {review.domain || ""}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline">{review.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Duration:</span>
            <span>{latestRound?.durationMinutes ?? "-"} minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Time:</span>
            <span>{
              latestRound?.scheduledTime
                ? new Date(`1970-01-01T${latestRound.scheduledTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                : "-"
            }</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Date:</span>
            <span>{latestRound?.scheduledDate ? new Date(latestRound.scheduledDate as string).toLocaleDateString("en-GB") : "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Assigned By:</span>
            <span>{assignedByName || "-"}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="w-1/2"
            onClick={() => router.push(`/admin/candidates/${review.id}?from=reviews`)}
          >
            View Candidate Details
          </Button>
          <Button onClick={() => openReviewDialog(review)} className="w-1/2">
            <Eye className="mr-2 h-4 w-4" />
            {isCompleted ? "Edit Review" : "Review & Decide"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Candidate | null>(null)
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  // Remove filteredReviews and related searchTerm/statusFilter state
  // Use allReviews directly for rendering the list of candidates
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    decision: "",
    rating: 0,
    feedback: "",
  })
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState('pending');

  // Fetch candidates assigned to this admin
  useEffect(() => {
    if (status === "authenticated" && session?.user?._id) {
      setLoading(true);
      fetch("/api/admin/candidates")
        .then(res => res.json())
        .then(data => {
          const adminId = session.user._id;
          // Only candidates with at least one admin round assigned to this admin
          const assigned = (data.candidates || []).filter((candidate: Candidate) => {
            return candidate.assignedRounds.some(
              (r: AssignedRound) => r.assignedToModel === "admins" && r.assignedTo === adminId
            );
          });
          setCandidates(assigned);
        })
        .finally(() => setLoading(false));
    }
  }, [status, session]);

  // Filtering logic
  const filteredCandidates = candidates.filter((candidate: Candidate) => {
    const matchesSearch =
      (candidate.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (candidate.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (candidate.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const adminRounds = candidate.assignedRounds.filter((r: AssignedRound) => r.assignedToModel === "admins");
    if (!adminRounds.length) return false;
    const latestAdminRound = adminRounds[adminRounds.length - 1];

    const candidateStatus = (candidate.status || '').toLowerCase();
    const roundStatus = (latestAdminRound.status || '').toLowerCase();

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'pending') {
      return (
        matchesSearch &&
        candidateStatus !== 'final-accepted' &&
        candidateStatus !== 'rejected' &&
        roundStatus === 'assigned' &&
        !latestAdminRound.responseSubmitted
      );
    }
    if (statusFilter === 'accepted') {
      return (
        matchesSearch &&
        candidateStatus === 'final-accepted' &&
        roundStatus === 'completed' &&
        latestAdminRound.responseSubmitted
      );
    }
    if (statusFilter === 'rejected') {
      return (
        matchesSearch &&
        candidateStatus === 'rejected' &&
        roundStatus === 'completed' &&
        latestAdminRound.responseSubmitted
      );
    }
    return false;
  });

  // Remove filteredReviews and related searchTerm/statusFilter state
  // Use allReviews directly for rendering the list of candidates
  // const filteredReviews = allReviews.filter((review: Candidate) => {
  //   const search = (searchTerm ?? "").toLowerCase();
  //   const statusF = (statusFilter ?? "all").toLowerCase();

  //   // Only include fields that are actually strings
  //   const searchFields = [
  //     typeof review.username === "string" ? review.username : undefined,
  //     typeof review.name === "string" ? review.name : undefined,
  //     typeof review.domain === "string" ? review.domain : undefined,
  //     typeof review.round === "string" ? review.round : undefined,
  //     typeof review.id === "string" ? review.id : review.id?.toString()
  //   ].filter(Boolean);

  //   const matchesSearch = searchFields.some(field =>
  //     field.toLowerCase().includes(search)
  //   );

  //   const matchesStatus =
  //     typeof review.status === "string"
  //       ? statusF === "all" || review.status.toLowerCase().includes(statusF)
  //       : statusF === "all";

  //   return matchesSearch && matchesStatus;
  // });

  const handleReviewSubmit = async () => {
    if (!reviewForm.decision || !reviewForm.feedback) {
      toast({
        title: "Validation Error",
        description: "Please provide decision and feedback",
        variant: "destructive",
      });
      return;
    }
    if (!selectedReview) return;
    // Find the current admin round number
    const adminRounds = selectedReview.assignedRounds.filter((r: AssignedRound) => r.assignedToModel === "admins");
    const currentAdminRound = adminRounds[adminRounds.length - 1];
    if (!currentAdminRound) return;
    try {
      const status = reviewForm.decision === "Accept" ? "final-accepted" : reviewForm.decision === "Reject" ? "rejected" : undefined;
      const res = await fetch("/api/admin/candidates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedReview.id,
          roundNumber: currentAdminRound.roundNumber,
          feedbackData: reviewForm,
          status, // send new status
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");
    toast({
      title: "Review Submitted",
        description: `Review submitted for ${selectedReview.username || selectedReview.email}`,
      });
      setIsReviewDialogOpen(false);
      setSelectedReview(null);
      setReviewForm({ decision: "", rating: 0, feedback: "" });
      // Refetch candidates to update UI
      setLoading(true);
      fetch("/api/admin/candidates")
        .then(res => res.json())
        .then(data => {
          if (!session || !session.user || !session.user._id) return;
          const adminId = session.user._id;
          const assigned = (data.candidates || []).filter((candidate: Candidate) => {
            if (candidate.status !== "assigned-admin") return false;
            const adminRounds = candidate.assignedRounds.filter((r: AssignedRound) => r.assignedToModel === "admins");
            if (!adminRounds.length) return false;
            const latestAdminRound = adminRounds[adminRounds.length - 1];
            return latestAdminRound.assignedTo === adminId;
          });
          setCandidates(assigned);
        })
        .finally(() => setLoading(false));
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  const openReviewDialog = (review: Candidate) => {
    setSelectedReview(review)
    setReviewForm({
      decision: review.decision || "",
      rating: review.rating || 0,
      feedback: review.feedback || "",
    })
    setIsReviewDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending Review":
        return "secondary"
      case "Approved":
        return "default"
      case "Rejected":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case "Proceed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Reject":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star: number) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={interactive ? () => setReviewForm({ ...reviewForm, rating: star }) : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Interview Reviews</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No reviews match your criteria.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {filteredCandidates.map((review) => (
            <ReviewCard key={review.id} review={review} openReviewDialog={openReviewDialog} />
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Interview - {selectedReview?.name || selectedReview?.username}</DialogTitle>
            <DialogDescription>
              for {selectedReview?.workDomain?.name} domain
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-6 py-4">
              {/* Review Form */}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="decision">Decision *</Label>
                  <Select
                    value={reviewForm.decision}
                    onValueChange={(value) => setReviewForm({ ...reviewForm, decision: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Accept">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                          Accept
                        </div>
                      </SelectItem>
                      <SelectItem value="Reject">
                        <div className="flex items-center gap-2">
                          <ThumbsDown className="h-4 w-4 text-red-600" />
                          Reject
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Overall Rating</Label>
                  <div className="flex items-center gap-2">
                    {renderStars(reviewForm.rating, true)}
                    <span className="text-sm text-muted-foreground ml-2">
                      {reviewForm.rating > 0 ? `${reviewForm.rating}/5` : "No rating"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="feedback">Review Feedback *</Label>
                  <Textarea
                    id="feedback"
                    value={reviewForm.feedback}
                    onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                    placeholder="Provide detailed feedback about the candidate's performance..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReviewSubmit}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
