"use client"

import { useEffect, useState } from "react"
import { store, type Video } from "@/lib/store"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Eye, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface VideoApprovalListProps {
  filter: "pending" | "approved" | "rejected"
}

export function VideoApprovalList({ filter }: VideoApprovalListProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const { user } = useAuth()

  const loadVideos = () => {
    if (!store) return

    const allVideos = store.getVideos()
    let filtered: Video[] = []

    if (filter === "pending") {
      filtered = allVideos.filter((v) => v.status === "pending-approval")
    } else if (filter === "approved") {
      filtered = allVideos.filter((v) => v.approved === true)
    } else if (filter === "rejected") {
      filtered = allVideos.filter((v) => v.status === "failed")
    }

    setVideos(filtered)
  }

  useEffect(() => {
    loadVideos()
  }, [filter])

  const handleApprove = (videoId: string) => {
    if (!store || !user) return
    store.approveVideo(videoId, user.id)
    loadVideos()
  }

  const handleReject = (videoId: string) => {
    if (!store) return
    store.rejectVideo(videoId)
    loadVideos()
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500"
    if (score >= 70) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 85) return "High Quality"
    if (score >= 70) return "Good Quality"
    return "Needs Review"
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No videos in this category</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => {
        const channel = store?.getChannels().find((c) => c.id === video.channelId)
        const channelUser = store?.getUserById(channel?.userId || "")

        return (
          <Card key={video.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                <Badge variant="outline" className={getScoreColor(video.aiScore)}>
                  {video.aiScore}/100
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{channelUser?.name}</span>
                <span>•</span>
                <span>{channel?.name}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="aspect-video bg-secondary rounded-md overflow-hidden relative">
                <img
                  src={video.thumbnail || "/placeholder.svg"}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">AI Score:</span>
                  <span className={`font-medium ${getScoreColor(video.aiScore)}`}>{getScoreBadge(video.aiScore)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">${video.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Scheduled:</span>
                  <span className="font-medium">{new Date(video.scheduledDate).toLocaleDateString()}</span>
                </div>
                {video.approved && video.approvedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Approved:</span>
                    <span className="font-medium text-green-500">
                      {new Date(video.approvedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {video.aiScore >= 85 && (
                <div className="flex items-center gap-2 p-2 bg-accent/10 rounded-md text-xs text-accent">
                  <TrendingUp className="h-3 w-3" />
                  <span>High viral potential detected</span>
                </div>
              )}
            </CardContent>

            {filter === "pending" && (
              <CardFooter className="gap-2 pt-3">
                <Button variant="default" size="sm" className="flex-1" onClick={() => handleApprove(video.id)}>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleReject(video.id)}>
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </CardFooter>
            )}
          </Card>
        )
      })}
    </div>
  )
}
