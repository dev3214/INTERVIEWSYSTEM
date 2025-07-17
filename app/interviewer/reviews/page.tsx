"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import toast from "react-hot-toast"
import { Search, MessageSquare, Calendar, Edit } from "lucide-react"

interface Review {
  id: number;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  workDomain: string;
  round: string;
  rating: string;
  recommendation: string;
  technicalSkills: string;
  communicationSkills: string;
  problemSolving: string;
  feedback: string;
  reviewDate: string;
  status: string;
}

interface ReviewData {
  rating: string;
  feedback: string;
  recommendation: string;
  technicalSkills: string;
  communicationSkills: string;
  problemSolving: string;
}

const reviews: Review[] = [
  {
    id: 1,
    candidateName: "Alice Johnson",
    candidateEmail: "alice.johnson@email.com",
    candidateAvatar: "/placeholder.svg?height=40&width=40",
    workDomain: "React",
    round: "React Advanced",
    rating: "excellent",
    recommendation: "strongly-recommend",
    technicalSkills: "excellent",
    communicationSkills: "good",
    problemSolving: "excellent",
    feedback:
      "Excellent technical skills with deep understanding of React concepts. Great problem-solving approach and clean code implementation.",
    reviewDate: "2024-01-20",
    status: "Submitted",
  },
  {
    id: 2,
    candidateName: "Bob Smith",
    candidateEmail: "bob.smith@email.com",
    candidateAvatar: "/placeholder.svg?height=40&width=40",
    workDomain: "Node.js",
    round: "System Design",
    rating: "good",
    recommendation: "recommend",
    technicalSkills: "good",
    communicationSkills: "excellent",
    problemSolving: "good",
    feedback:
      "Strong system design knowledge with good communication skills. Could improve on handling edge cases in implementation.",
    reviewDate: "2024-01-19",
    status: "Submitted",
  },
  {
    id: 3,
    candidateName: "Carol Davis",
    candidateEmail: "carol.davis@email.com",
    candidateAvatar: "/placeholder.svg?height=40&width=40",
    workDomain: "Python",
    round: "Python Advanced",
    rating: "",
    recommendation: "",
    technicalSkills: "",
    communicationSkills: "",
    problemSolving: "",
    feedback: "",
    reviewDate: "",
    status: "Pending",
  },
]

export default function InterviewerReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [reviewData, setReviewData] = useState<ReviewData>({
    rating: "",
    feedback: "",
    recommendation: "",
    technicalSkills: "",
    communicationSkills: "",
    problemSolving: "",
  })

  const filteredReviews = reviews.filter((review: Review) => {
    const matchesSearch = review.candidateName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || review.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "bg-green-100 text-green-800"
      case "good":
        return "bg-blue-100 text-blue-800"
      case "average":
        return "bg-yellow-100 text-yellow-800"
      case "below-average":
        return "bg-orange-100 text-orange-800"
      case "poor":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAddReview = (review: Review) => {
    setSelectedReview(review)
    setReviewData({
      rating: review.rating || "",
      feedback: review.feedback || "",
      recommendation: review.recommendation || "",
      technicalSkills: review.technicalSkills || "",
      communicationSkills: review.communicationSkills || "",
      problemSolving: review.problemSolving || "",
    })
    setIsReviewDialogOpen(true)
  }

  const handleSubmitReview = () => {
    if (!reviewData.rating || !reviewData.feedback) {
      toast("Please provide rating and feedback")
      return
    }

    if (selectedReview) {
    toast(`Review ${selectedReview.status === "Pending" ? "submitted" : "updated"} for ${selectedReview.candidateName}`)
    }

    setIsReviewDialogOpen(false)
    setSelectedReview(null)
  }

  const formatRating = (rating: string) => {
    switch (rating) {
      case "excellent":
        return "Excellent"
      case "good":
        return "Good"
      case "average":
        return "Average"
      case "below-average":
        return "Below Average"
      case "poor":
        return "Poor"
      default:
        return "Not Rated"
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">My Reviews</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {filteredReviews.map((review) => (
          <Card key={review.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.candidateAvatar || "/placeholder.svg"} alt={review.candidateName} />
                  <AvatarFallback>
                    {review.candidateName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-xl">{review.candidateName}</CardTitle>
                    <Badge variant="outline">{review.workDomain}</Badge>
                    <Badge className={getStatusColor(review.status)}>{review.status}</Badge>
                  </div>
                  <CardDescription>
                    {review.candidateEmail} • {review.round}
                  </CardDescription>
                </div>
                <div className="text-right">
                  {review.rating && (
                    <>
                      <Badge className={getRatingColor(review.rating)}>{formatRating(review.rating)}</Badge>
                      <div className="text-sm text-muted-foreground mt-1">Overall Rating</div>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {review.status === "Submitted" && (
                <>
                  {/* Skills Breakdown */}
                  <div>
                    <h4 className="font-medium mb-2">Skills Assessment</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-2 border rounded-lg">
                        <div className="text-xs font-medium">Technical</div>
                        <Badge variant="outline" className={getRatingColor(review.technicalSkills)}>
                          {formatRating(review.technicalSkills)}
                        </Badge>
                      </div>
                      <div className="text-center p-2 border rounded-lg">
                        <div className="text-xs font-medium">Communication</div>
                        <Badge variant="outline" className={getRatingColor(review.communicationSkills)}>
                          {formatRating(review.communicationSkills)}
                        </Badge>
                      </div>
                      <div className="text-center p-2 border rounded-lg">
                        <div className="text-xs font-medium">Problem Solving</div>
                        <Badge variant="outline" className={getRatingColor(review.problemSolving)}>
                          {formatRating(review.problemSolving)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <h4 className="font-medium mb-2">Feedback</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm">{review.feedback}</p>
                    </div>
                  </div>

                  {/* Review Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Reviewed on {new Date(review.reviewDate).toLocaleDateString()}</span>
                  </div>
                </>
              )}

              {review.status === "Pending" && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Review Required</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    This candidate is waiting for your review to proceed to the next round.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {review.status === "Pending" ? (
                  <Button onClick={() => handleAddReview(review)} className="flex-1">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Add Review
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => handleAddReview(review)} className="flex-1">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Review
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No reviews found matching your criteria.</p>
        </div>
      )}

      {/* Add/Edit Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReview?.status === "Pending" ? "Add Review" : "Edit Review"} for {selectedReview?.candidateName}
            </DialogTitle>
            <DialogDescription>
              Provide your evaluation and feedback for this candidate's performance in {selectedReview?.round}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="rating">Overall Rating *</Label>
                <Select
                  value={reviewData.rating}
                  onValueChange={(value) => setReviewData({ ...reviewData, rating: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent (9-10)</SelectItem>
                    <SelectItem value="good">Good (7-8)</SelectItem>
                    <SelectItem value="average">Average (5-6)</SelectItem>
                    <SelectItem value="below-average">Below Average (3-4)</SelectItem>
                    <SelectItem value="poor">Poor (1-2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recommendation">Recommendation *</Label>
                <Select
                  value={reviewData.recommendation}
                  onValueChange={(value) => setReviewData({ ...reviewData, recommendation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recommendation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strongly-recommend">Strongly Recommend</SelectItem>
                    <SelectItem value="recommend">Recommend</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="not-recommend">Do Not Recommend</SelectItem>
                    <SelectItem value="strongly-not-recommend">Strongly Do Not Recommend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="technical">Technical Skills</Label>
                <Select
                  value={reviewData.technicalSkills}
                  onValueChange={(value) => setReviewData({ ...reviewData, technicalSkills: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="communication">Communication</Label>
                <Select
                  value={reviewData.communicationSkills}
                  onValueChange={(value) => setReviewData({ ...reviewData, communicationSkills: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="problemSolving">Problem Solving</Label>
                <Select
                  value={reviewData.problemSolving}
                  onValueChange={(value) => setReviewData({ ...reviewData, problemSolving: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="feedback">Detailed Feedback *</Label>
              <Textarea
                id="feedback"
                value={reviewData.feedback}
                onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                placeholder="Provide detailed feedback about the candidate's performance, strengths, areas for improvement..."
                className="min-h-[120px]"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Round:</strong> {selectedReview?.round} • <strong>Domain:</strong> {selectedReview?.workDomain}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Your review will be used to determine the candidate's progression to the next round.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview}>
              {selectedReview?.status === "Pending" ? "Submit Review" : "Update Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
