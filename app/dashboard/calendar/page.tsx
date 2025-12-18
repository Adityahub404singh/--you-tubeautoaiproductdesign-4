"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react"

const videoSchedule = [
  {
    id: 1,
    date: "2024-01-15",
    title: "AI Revolution: GPT-5 Changes Everything",
    status: "published",
    views: "12.5K",
    duration: "4:32",
  },
  {
    id: 2,
    date: "2024-01-16",
    title: "Top 5 Tech Gadgets You Need in 2024",
    status: "scheduled",
    time: "2:00 PM",
    duration: "5:15",
  },
  {
    id: 3,
    date: "2024-01-17",
    title: "Startup Funding Hits Record High",
    status: "pending",
    time: "2:00 PM",
    duration: "3:48",
  },
  {
    id: 4,
    date: "2024-01-18",
    title: "Tesla's New AI Chip: Game Changer?",
    status: "scheduled",
    time: "2:00 PM",
    duration: "4:52",
  },
  {
    id: 5,
    date: "2024-01-19",
    title: "Meta's AR Glasses: Hands-On Review",
    status: "scheduled",
    time: "2:00 PM",
    duration: "6:20",
  },
  {
    id: 6,
    date: "2024-01-20",
    title: "Why Everyone's Talking About Quantum Computing",
    status: "scheduled",
    time: "2:00 PM",
    duration: "4:15",
  },
]

export default function CalendarPage() {
  const [selectedChannel, setSelectedChannel] = useState("main-channel")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "scheduled":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="h-4 w-4" />
      case "scheduled":
        return <Clock className="h-4 w-4" />
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader selectedChannel={selectedChannel} onChannelChange={setSelectedChannel} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Content Calendar</h1>
              <p className="text-muted-foreground mt-1">View and manage your scheduled videos</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                <Calendar className="h-3 w-3 mr-1" />
                30-Day View
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {videoSchedule.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col items-center justify-center min-w-[60px]">
                        <span className="text-sm font-medium">
                          {new Date(video.date).toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className="text-2xl font-bold">
                          {new Date(video.date).toLocaleDateString("en-US", { day: "numeric" })}
                        </span>
                      </div>

                      <div className="flex-1 space-y-1">
                        <h3 className="font-medium leading-tight">{video.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>Duration: {video.duration}</span>
                          {video.time && <span>• {video.time}</span>}
                          {video.views && <span>• {video.views} views</span>}
                        </div>
                      </div>

                      <Badge className={getStatusColor(video.status)}>
                        {getStatusIcon(video.status)}
                        <span className="ml-1 capitalize">{video.status}</span>
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
