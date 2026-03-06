"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Youtube, ExternalLink, Clock, CheckCircle2, AlertTriangle, Video, Loader2, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { store, type Video as VideoType, type Channel } from "@/lib/store"
import Link from "next/link"

const statusConfig: Record<string, { label: string; color: string }> = {
  "live": { label: "🟢 Live on YouTube", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  "approved": { label: "🔵 Approved", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  "pending-approval": { label: "🟡 Pending Approval", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  "uploading": { label: "🔄 Uploading", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  "failed": { label: "🔴 Upload Failed", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  "rejected": { label: "❌ Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  "user-approved": { label: "✅ User Approved", color: "bg-green-500/10 text-green-500 border-green-500/20" },
}

export default function MyVideosPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<VideoType[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState("main-channel")

  useEffect(() => {
    if (!user || !store) return
    const userChannels = store.getChannels(user.id)
    setChannels(userChannels)
    if (userChannels.length > 0) {
      setSelectedChannel(userChannels[0].id)
    }

    // Get all videos for user's channels
    const allVideos: VideoType[] = []
    userChannels.forEach(ch => {
      const chVideos = store.getVideos(ch.id)
      allVideos.push(...chVideos)
    })
    allVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setVideos(allVideos)
  }, [user])

  const getChannelName = (channelId: string) => {
    return channels.find(c => c.id === channelId)?.name || "Unknown Channel"
  }

  const liveVideos = videos.filter(v => v.status === "live")
  const pendingVideos = videos.filter(v => v.status === "pending-approval" || v.status === "approved" || v.status === "uploading")
  const failedVideos = videos.filter(v => v.status === "failed" || v.status === "rejected")

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const VideoCard = ({ video }: { video: VideoType }) => {
    const status = statusConfig[video.status] || statusConfig["pending-approval"]
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm leading-tight line-clamp-2">{video.title}</h3>
            <Badge variant="outline" className={`text-[10px] whitespace-nowrap flex-shrink-0 ${status.color}`}>
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Video className="h-3 w-3" />
            <span>{getChannelName(video.channelId)}</span>
            <span>•</span>
            <span>{formatDate(video.createdAt)}</span>
          </div>

          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {video.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{tag}</span>
              ))}
              {video.tags.length > 4 && (
                <span className="text-[10px] text-muted-foreground">+{video.tags.length - 4} more</span>
              )}
            </div>
          )}

          {video.status === "live" && video.youtubeUrl && (
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg text-sm text-red-500 hover:bg-red-500/20 transition-colors font-medium"
            >
              <Youtube className="h-4 w-4" />
              <span className="flex-1">Watch on YouTube</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {video.status === "live" && video.uploadedAt && (
            <p className="text-xs text-muted-foreground">
              Uploaded: {formatDate(video.uploadedAt)}
            </p>
          )}

          {video.status === "failed" && video.uploadError && (
            <div className="p-2 bg-red-500/10 rounded-md text-xs text-red-500">
              <p className="font-medium">Error: {video.uploadError}</p>
            </div>
          )}

          {video.status === "pending-approval" && (
            <div className="p-2 bg-yellow-500/10 rounded-md text-xs text-yellow-600">
              <Clock className="h-3 w-3 inline mr-1" />
              Waiting for admin to approve this video
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Score: {video.aiScore}/100</span>
            <span>{video.isFree ? "Free" : `₹${(video.cost * 83).toFixed(0)}`}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader selectedChannel={selectedChannel} onChannelChange={setSelectedChannel} />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">My Videos</h1>
                <p className="text-muted-foreground mt-1">
                  {videos.length} total videos • {liveVideos.length} live on YouTube
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/new-prompt">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Video
                </Link>
              </Button>
            </div>

            {liveVideos.length > 0 && (
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-500 font-medium">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>{liveVideos.length} video{liveVideos.length > 1 ? "s" : ""} live on YouTube!</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All ({videos.length})</TabsTrigger>
                <TabsTrigger value="live">Live ({liveVideos.length})</TabsTrigger>
                <TabsTrigger value="pending">Pending ({pendingVideos.length})</TabsTrigger>
                <TabsTrigger value="failed">Failed ({failedVideos.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {videos.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No videos yet</p>
                      <Button asChild className="mt-4">
                        <Link href="/dashboard/new-prompt">Create Your First Video</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {videos.map(video => <VideoCard key={video.id} video={video} />)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="live" className="mt-6">
                {liveVideos.length === 0 ? (
                  <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No live videos yet</p></CardContent></Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {liveVideos.map(video => <VideoCard key={video.id} video={video} />)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="mt-6">
                {pendingVideos.length === 0 ? (
                  <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No pending videos</p></CardContent></Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingVideos.map(video => <VideoCard key={video.id} video={video} />)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="failed" className="mt-6">
                {failedVideos.length === 0 ? (
                  <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No failed videos</p></CardContent></Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {failedVideos.map(video => <VideoCard key={video.id} video={video} />)}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
