"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Youtube, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { store, type Video, type Channel } from "@/lib/store"

interface RecentVideosProps {
  channelId: string
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  "live": { label: "Live", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  "approved": { label: "Approved", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <Clock className="h-3 w-3" /> },
  "pending-approval": { label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: <Clock className="h-3 w-3" /> },
  "uploading": { label: "Uploading", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  "failed": { label: "Failed", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <AlertTriangle className="h-3 w-3" /> },
  "rejected": { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <AlertTriangle className="h-3 w-3" /> },
}

export function RecentVideos({ channelId }: RecentVideosProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [channel, setChannel] = useState<Channel | null>(null)

  useEffect(() => {
    if (store && channelId) {
      const channelVideos = store.getVideos(channelId)
      const sorted = channelVideos
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      setVideos(sorted)

      const channels = store.getChannels()
      const ch = channels.find(c => c.id === channelId)
      if (ch) setChannel(ch)
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
        <CardDescription>
          {channel ? `Channel: ${channel.name}` : "Your latest content"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {videos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>No videos yet</p>
              <p className="text-xs mt-1">Create your first video from New Prompt</p>
            </div>
          ) : (
            videos.map((video) => {
              const status = statusConfig[video.status] || statusConfig["pending-approval"]
              return (
                <div key={video.id} className="space-y-2 p-3 rounded-lg border bg-card">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-tight">{video.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${status.color}`}>
                          <span className="mr-1">{status.icon}</span>
                          {status.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(video.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {video.status === "live" && video.youtubeUrl && (
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-red-500/10 rounded-md text-xs text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Youtube className="h-3.5 w-3.5" />
                      <span className="flex-1">Watch on YouTube</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {video.status === "failed" && video.uploadError && (
                    <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-md text-xs text-red-500">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      <span className="line-clamp-1">{video.uploadError}</span>
                    </div>
                  )}

                  {video.status === "pending-approval" && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-md text-xs text-yellow-600">
                      <Clock className="h-3 w-3" />
                      <span>Waiting for admin approval</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
