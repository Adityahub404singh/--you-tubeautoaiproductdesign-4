"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Youtube, ExternalLink, Clock, CheckCircle2, AlertTriangle, Video, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { store, type Video as VideoType, type Channel } from "@/lib/store"
import Link from "next/link"

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  "live": { label: "Live on YouTube", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  "approved": { label: "Approved", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: CheckCircle2 },
  "pending-approval": { label: "Pending Approval", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  "uploading": { label: "Uploading...", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Clock },
  "failed": { label: "Upload Failed", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertTriangle },
  "rejected": { label: "Rejected", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertTriangle },
  "user-approved": { label: "User Approved", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
}

function VideoThumb({ video }: { video: VideoType }) {
  const [src, setSrc] = useState<string>("")
  useEffect(() => {
    if (video.thumbnail?.startsWith("data:") || video.thumbnail?.startsWith("http") || video.thumbnail?.startsWith("/")) {
      setSrc(video.thumbnail)
      return
    }
    try {
      const canvas = document.createElement("canvas")
      canvas.width = 1280; canvas.height = 720
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#0f0f0f"; ctx.fillRect(0, 0, 1280, 720)
      const g = ctx.createLinearGradient(0, 0, 1280, 720)
      g.addColorStop(0, "#1a1a2e"); g.addColorStop(1, "#16213e")
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720)
      ctx.fillStyle = "#FF0000"; ctx.fillRect(0, 0, 14, 720)
      ctx.fillStyle = "#FF0000"; ctx.fillRect(48, 130, 110, 38)
      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 20px Arial"; ctx.textAlign = "left"
      ctx.fillText("VIRAL", 62, 156)
      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 52px Arial"
      const words = video.title.toUpperCase().split(" ")
      let line = "", y = 220
      for (let i = 0; i < words.length; i++) {
        const t = line + words[i] + " "
        if (ctx.measureText(t).width > 700 && i > 0) { ctx.fillText(line.trim(), 60, y); line = words[i] + " "; y += 65; if (y > 500) break }
        else { line = t }
      }
      ctx.fillText(line.trim(), 60, y)
      ctx.fillStyle = "#FF0000"; ctx.fillRect(1120, 662, 130, 40)
      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 18px Arial"; ctx.textAlign = "center"
      ctx.fillText("YouTube", 1185, 690)
      setSrc(canvas.toDataURL("image/jpeg", 0.85))
    } catch (e) { setSrc("") }
  }, [video.id, video.title])
  if (!src) return <div className="w-full h-full bg-gray-900 flex items-center justify-center"><Video className="h-8 w-8 text-gray-600" /></div>
  return <img src={src} alt={video.title} className="w-full h-full object-cover" />
}

export default function MyVideosPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<VideoType[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!user || !store) return
    const userChannels = store.getChannels(user.id)
    setChannels(userChannels)
    const allVideos: VideoType[] = []
    userChannels.forEach(ch => {
      const chVideos = store?.getVideos(ch.id) ?? []
      allVideos.push(...chVideos)
    })
    allVideos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setVideos(allVideos)
  }, [user])

  const getChannelName = (channelId: string) => channels.find(c => c.id === channelId)?.name || "Unknown"

  const filtered = activeTab === "all" ? videos
    : activeTab === "live" ? videos.filter(v => v.status === "live")
    : activeTab === "pending" ? videos.filter(v => ["pending-approval","approved","uploading","user-approved"].includes(v.status))
    : videos.filter(v => ["failed","rejected"].includes(v.status))

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Videos</h1>
              <p className="text-muted-foreground mt-1">
                {videos.length} total videos &bull; {videos.filter(v => v.status === "live").length} live on YouTube
              </p>
            </div>
            <Link href="/dashboard/new-prompt">
              <Button className="gap-2 bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4" /> Create New Video
              </Button>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: "all", label: `All (${videos.length})` },
              { key: "live", label: `Live (${videos.filter(v => v.status === "live").length})` },
              { key: "pending", label: `Pending (${videos.filter(v => ["pending-approval","approved","uploading","user-approved"].includes(v.status)).length})` },
              { key: "failed", label: `Failed (${videos.filter(v => ["failed","rejected"].includes(v.status)).length})` },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Video className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
              <p className="text-muted-foreground mb-6">Create your first AI video now!</p>
              <Link href="/dashboard/new-prompt">
                <Button className="bg-red-600 hover:bg-red-700">Create Your First Video</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(video => {
                const cfg = statusConfig[video.status] || statusConfig["pending-approval"]
                const Icon = cfg.icon
                return (
                  <div key={video.id} className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative bg-gray-900">
                      <VideoThumb video={video} />
                      <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm leading-tight mb-2 line-clamp-2">{video.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Youtube className="h-3 w-3 text-red-500" />
                        <span>{getChannelName(video.channelId)}</span>
                        <span>&bull;</span>
                        <span>{formatDate(video.createdAt)}</span>
                      </div>
                      {video.tags && video.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {video.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">{tag}</span>
                          ))}
                          {video.tags.length > 3 && <span className="px-2 py-0.5 bg-muted rounded text-xs">+{video.tags.length - 3}</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Score:</span>
                          <span className="text-xs font-bold text-green-500">{video.aiScore || 0}/100</span>
                        </div>
                        {video.youtubeUrl && (
                          <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400">
                            <ExternalLink className="h-3 w-3" /> View on YouTube
                          </a>
                        )}
                        {video.status === "failed" && video.uploadError && (
                          <span className="text-xs text-red-400 line-clamp-1">{video.uploadError}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}