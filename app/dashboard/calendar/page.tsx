"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Eye, Trash2, CheckCircle, Clock, AlertCircle, RefreshCw, Plus } from "lucide-react"
import Link from "next/link"

interface ScheduledVideo {
  id: string
  date: string
  title: string
  status: "live" | "scheduled" | "pending-approval" | "failed" | "approved" | "user-approved" | "rejected"
  duration?: string
  category?: string
  videoUrl?: string
  youtubeUrl?: string
  instagramUrl?: string
}

export default function CalendarPage() {
  const [selectedChannel, setSelectedChannel] = useState("main-channel")
  const [videos, setVideos] = useState<ScheduledVideo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVideos()
  }, [])

  function loadVideos() {
    setLoading(true)
    try {
      // Load from localStorage (same place store.ts saves)
      const stored = localStorage.getItem("videos")
      if (stored) {
        const parsed = JSON.parse(stored)
        const mapped: ScheduledVideo[] = parsed.map((v: any) => ({
          id:           v.id || String(Date.now()),
          date:         v.createdAt || v.date || new Date().toISOString(),
          title:        v.title || "Untitled Video",
          status:       v.status || "pending-approval",
          duration:     v.duration || "",
          category:     v.category || "general",
          videoUrl:     v.videoUrl || "",
          youtubeUrl:   v.youtubeUrl || "",
          instagramUrl: v.instagramUrl || "",
        }))
        // Sort newest first
        mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setVideos(mapped)
      } else {
        setVideos([])
      }
    } catch(e) {
      setVideos([])
    }
    setLoading(false)
  }

  function deleteVideo(id: string) {
    if (!confirm("Delete this video?")) return
    try {
      const stored = localStorage.getItem("videos")
      if (stored) {
        const parsed = JSON.parse(stored)
        const updated = parsed.filter((v: any) => v.id !== id)
        localStorage.setItem("videos", JSON.stringify(updated))
        loadVideos()
      }
    } catch(e) {}
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":          return "bg-green-500/10 text-green-500 border-green-500/20"
      case "approved":
      case "user-approved": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "scheduled":     return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "pending-approval": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "failed":
      case "rejected":      return "bg-red-500/10 text-red-500 border-red-500/20"
      default:              return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "live":
      case "approved":
      case "user-approved": return <CheckCircle className="h-3 w-3" />
      case "pending-approval":
      case "scheduled":     return <Clock className="h-3 w-3" />
      case "failed":
      case "rejected":      return <AlertCircle className="h-3 w-3" />
      default:              return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "live":            return "Live"
      case "approved":        return "Approved"
      case "user-approved":   return "Approved"
      case "pending-approval":return "Pending"
      case "scheduled":       return "Scheduled"
      case "failed":          return "Failed"
      case "rejected":        return "Rejected"
      default:                return status
    }
  }

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      shorts:     "bg-red-500/10 text-red-400",
      tech:       "bg-green-500/10 text-green-400",
      facts:      "bg-cyan-500/10 text-cyan-400",
      motivation: "bg-orange-500/10 text-orange-400",
      horror:     "bg-red-900/20 text-red-300",
      story:      "bg-purple-500/10 text-purple-400",
      finance:    "bg-yellow-500/10 text-yellow-400",
      health:     "bg-emerald-500/10 text-emerald-400",
      top10:      "bg-amber-500/10 text-amber-400",
    }
    return map[cat] || "bg-muted text-muted-foreground"
  }

  const liveCount    = videos.filter(v => v.status === "live").length
  const pendingCount = videos.filter(v => v.status === "pending-approval").length
  const failedCount  = videos.filter(v => v.status === "failed" || v.status === "rejected").length

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader selectedChannel={selectedChannel} onChannelChange={setSelectedChannel} />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Content Calendar</h1>
              <p className="text-muted-foreground mt-1">Your generated videos — {videos.length} total</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={loadVideos}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/dashboard/new-prompt">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Video
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Live / Published</p>
                <p className="text-2xl font-bold text-green-500">{liveCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-muted-foreground">Failed / Rejected</p>
                <p className="text-2xl font-bold text-red-500">{failedCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Video List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                All Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : videos.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No videos yet</p>
                  <Link href="/dashboard/new-prompt">
                    <Button><Plus className="h-4 w-4 mr-2" />Create First Video</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {videos.map((video) => (
                    <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Date */}
                        <div className="flex flex-col items-center justify-center min-w-[52px]">
                          <span className="text-xs text-muted-foreground">
                            {new Date(video.date).toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className="text-xl font-bold">
                            {new Date(video.date).toLocaleDateString("en-US", { day: "numeric" })}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="font-medium leading-tight truncate">{video.title}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {video.category && (
                              <span className={"text-xs px-2 py-0.5 rounded-full " + getCategoryColor(video.category)}>
                                {video.category.toUpperCase()}
                              </span>
                            )}
                            {video.duration && (
                              <span className="text-xs text-muted-foreground">{video.duration}</span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(video.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <Badge className={getStatusColor(video.status)}>
                          {getStatusIcon(video.status)}
                          <span className="ml-1">{getStatusLabel(video.status)}</span>
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 ml-3">
                        {video.youtubeUrl && (
                          <a href={video.youtubeUrl} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="icon" title="View on YouTube">
                              <Eye className="h-4 w-4 text-red-500" />
                            </Button>
                          </a>
                        )}
                        {video.videoUrl && !video.youtubeUrl && (
                          <a href={video.videoUrl} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="icon" title="View Video">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteVideo(video.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
