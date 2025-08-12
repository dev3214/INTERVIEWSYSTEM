"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Users, CheckCircle, Calendar, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function InterviewerDashboard() {
  const stats = [
    {
      title: "Assigned Candidates",
      value: "8",
      description: "Active interviews",
      icon: Users,
    },
    {
      title: "Pending Reviews",
      value: "3",
      description: "Awaiting feedback",
      icon: MessageSquare,
    },
    {
      title: "Completed Today",
      value: "2",
      description: "Interviews finished",
      icon: CheckCircle,
    },
    {
      title: "Scheduled",
      value: "5",
      description: "Upcoming this week",
      icon: Calendar,
    },
  ]

  const assignedCandidates = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice.johnson@email.com",
      domain: "React",
      status: "In Progress",
      roundsCompleted: 3,
      totalRounds: 4,
      lastActivity: "2 hours ago",
      avatar: "/placeholder.svg?height=40&width=40",
      nextRound: "Final Technical",
      scheduledDate: "2024-01-22",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob.smith@email.com",
      domain: "Node.js",
      status: "Pending Review",
      roundsCompleted: 4,
      totalRounds: 4,
      lastActivity: "1 day ago",
      avatar: "/placeholder.svg?height=40&width=40",
      nextRound: "Review Complete",
      scheduledDate: null,
    },
    {
      id: 3,
      name: "Carol Davis",
      email: "carol.davis@email.com",
      domain: "Python",
      status: "Scheduled",
      roundsCompleted: 2,
      totalRounds: 4,
      lastActivity: "3 days ago",
      avatar: "/placeholder.svg?height=40&width=40",
      nextRound: "System Design",
      scheduledDate: "2024-01-25",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "secondary"
      case "Pending Review":
        return "default"
      case "Scheduled":
        return "outline"
      case "Completed":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Interviewer Dashboard</h2>
          <p className="text-sm md:text-base text-muted-foreground">Manage your assigned candidates and interviews</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Pending Reviews
            </CardTitle>
            <CardDescription>You have 3 interviews waiting for your feedback and evaluation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/interviewer/reviews">Review Interviews</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-green-600" />
              Schedule Interviews
            </CardTitle>
            <CardDescription>Schedule new interview rounds for your assigned candidates.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/interviewer/schedule">Schedule Interviews</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Candidates */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Assigned Candidates</CardTitle>
          <CardDescription>Candidates assigned to you for interview and evaluation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignedCandidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <Avatar className="flex-shrink-0">
                  <AvatarImage src={candidate.avatar || "/placeholder.svg"} alt={candidate.name} />
                  <AvatarFallback>
                    {candidate.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-medium text-sm md:text-base">{candidate.name}</h4>
                    <Badge variant="outline">{candidate.domain}</Badge>
                    <Badge variant={getStatusColor(candidate.status)}>{candidate.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{candidate.email}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Progress: {candidate.roundsCompleted}/{candidate.totalRounds} rounds
                    </span>
                    <span>Last activity: {candidate.lastActivity}</span>
                    {candidate.scheduledDate && <span>Next: {candidate.scheduledDate}</span>}
                  </div>

                  <Progress value={(candidate.roundsCompleted / candidate.totalRounds) * 100} className="h-2" />
                </div>

                <div className="flex flex-col items-end gap-2 w-full lg:w-auto">
                  <div className="text-sm font-medium text-center lg:text-right">{candidate.nextRound}</div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                    <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                      <Link href={`/interviewer/candidates/${candidate.id}`}>View Details</Link>
                    </Button>
                    {candidate.status === "Pending Review" && (
                      <Button asChild size="sm" className="w-full sm:w-auto">
                        <Link href={`/interviewer/review/${candidate.id}`}>Review</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
          <CardDescription>Latest updates from your interviews</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="flex-1">
                Completed interview with <strong>Bob Smith</strong> - System Design round
              </span>
              <span className="text-muted-foreground">2 hours ago</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="flex-1">
                Scheduled interview with <strong>Carol Davis</strong> for tomorrow
              </span>
              <span className="text-muted-foreground">1 day ago</span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm">
              <MessageSquare className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <span className="flex-1">
                Added feedback for <strong>Alice Johnson</strong> - Coding Challenge
              </span>
              <span className="text-muted-foreground">2 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
