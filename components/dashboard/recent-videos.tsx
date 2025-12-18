"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreVertical, Eye, ThumbsUp, MessageSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { store, type Video } from "@/lib/store"

interface RecentVideosProps {
  channelId: string
}

export function RecentVideos({ channelId }: RecentVideosProps) {
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    if (store && channelId) {
      const channelVideos = store.getVideos(channelId)
      const liveVideos = channelVideos.filter((v) => v.status === "live").slice(0, 3)
      setVideos(liveVideos)
    }
  }, [channelId])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return `${diffDays} days ago`
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Recent Videos</CardTitle>
        <CardDescription>Your latest published content</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {videos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>No published videos yet</p>
            </div>
          ) : (
            videos.map((video) => (
              <div key={video.id} className="flex gap-3">
                <img
                  src={video.thumbnail || "/placeholder.svg?height=80&width=140"}
                  alt={video.title}
                  className="h-20 w-[140px] rounded-md object-cover"
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-tight text-balance">{video.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {video.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {video.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {video.comments}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(video.scheduledDate)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Analytics</DropdownMenuItem>
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
