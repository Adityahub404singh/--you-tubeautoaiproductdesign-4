"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, Eye, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { store, type Video } from "@/lib/store"

interface ContentCalendarProps {
  channelId: string
}

export function ContentCalendar({ channelId }: ContentCalendarProps) {
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    if (store && channelId) {
      const channelVideos = store.getVideos(channelId)
      setVideos(channelVideos.slice(0, 10)) // Show first 10
    }
  }, [channelId])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Live
          </Badge>
        )
      case "scheduled":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        )
      case "ready":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        )
      case "generating":
        return (
          <Badge variant="secondary">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Generating
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Calendar</CardTitle>
            <CardDescription>Upcoming and recent video schedule</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {videos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No videos scheduled yet. Complete onboarding to generate your 30-day calendar!</p>
            </div>
          ) : (
            videos.map((video) => (
              <div
                key={video.id}
                className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-balance">{video.title}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(video.scheduledDate)}
                    </span>
                    {video.status === "live" && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.views} views
                      </span>
                    )}
                  </div>
                </div>
                <div>{getStatusBadge(video.status)}</div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
