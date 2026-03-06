"use client"
import { useEffect, useState, useRef } from "react"
import { store, type Video } from "@/lib/store"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Eye, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface VideoApprovalListProps {
  filter: "pending" | "approved" | "rejected"
}

// â”€â”€â”€ Canvas Thumbnail Generator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function generateThumbnailDataURL(title: string): string {
  const canvas = document.createElement("canvas")
  canvas.width = 1280
  canvas.height = 720
  const ctx = canvas.getContext("2d")
  if (!ctx) return "/placeholder.svg"

  const W = canvas.width
  const H = canvas.height

  // Background
  ctx.fillStyle = "#0f0f0f"
  ctx.fillRect(0, 0, W, H)

  // Right side gradient
  const rightGrad = ctx.createLinearGradient(W * 0.4, 0, W, H)
  rightGrad.addColorStop(0, "#1a1a2e")
  rightGrad.addColorStop(1, "#16213e")
  ctx.fillStyle = rightGrad
  ctx.fillRect(W * 0.4, 0, W * 0.6, H)

  // Dark overlay left
  const grad = ctx.createLinearGradient(0, 0, W * 0.75, 0)
  grad.addColorStop(0, "rgba(0,0,0,0.92)")
  grad.addColorStop(0.6, "rgba(0,0,0,0.55)")
  grad.addColorStop(1, "rgba(0,0,0,0.0)")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Red left bar
  ctx.fillStyle = "#FF0000"
  ctx.fillRect(0, 0, 14, H)

  // Red box background
  ctx.fillStyle = "rgba(255, 0, 0, 0.18)"
  ctx.beginPath()
  const bx = 40, by = H * 0.18, bw = W * 0.58, bh = H * 0.58, r = 18
  ctx.moveTo(bx + r, by)
  ctx.lineTo(bx + bw - r, by)
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r)
  ctx.lineTo(bx + bw, by + bh - r)
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh)
  ctx.lineTo(bx + r, by + bh)
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r)
  ctx.lineTo(bx, by + r)
  ctx.quadraticCurveTo(bx, by, bx + r, by)
  ctx.closePath()
  ctx.fill()

  // VIRAL badge
  ctx.fillStyle = "#FF0000"
  ctx.beginPath()
  ctx.roundRect(bx + 8, by + 14, 110, 38, 8)
  ctx.fill()
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "bold 20px Arial Black, Arial"
  ctx.textAlign = "left"
  ctx.fillText("â–¶ VIRAL", bx + 18, by + 40)

  // Title word wrap
  ctx.fillStyle = "#FFFFFF"
  ctx.shadowColor = "rgba(0,0,0,0.9)"
  ctx.shadowBlur = 10
  ctx.font = "bold 58px Arial Black, Arial"
  ctx.textAlign = "left"

  const words = title.toUpperCase().split(" ")
  let line = ""
  let y = by + 95
  const maxW = bw - 40
  const lineH = 70

  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " "
    if (ctx.measureText(test).width > maxW && i > 0) {
      ctx.fillText(line.trim(), bx + 20, y)
      line = words[i] + " "
      y += lineH
      if (y > by + bh - 80) break
    } else {
      line = test
    }
  }
  ctx.fillText(line.trim(), bx + 20, y)
  ctx.shadowBlur = 0

  // Divider
  ctx.strokeStyle = "#FF0000"
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(bx + 20, y + 22)
  ctx.lineTo(bx + bw - 40, y + 22)
  ctx.stroke()

  // YouTube badge
  ctx.fillStyle = "#FF0000"
  ctx.beginPath()
  ctx.roundRect(W - 160, H - 58, 130, 40, 8)
  ctx.fill()
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "bold 18px Arial Black, Arial"
  ctx.textAlign = "center"
  ctx.fillText("â–¶ YouTube", W - 95, H - 30)

  return canvas.toDataURL("image/jpeg", 0.85)
}

// â”€â”€â”€ Thumbnail component with canvas fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function VideoThumbnail({ video }: { video: Video }) {
  const [src, setSrc] = useState<string>("")

  

  return (
    <img
      src={src}
      alt={video.title}
      className="w-full h-full object-cover"
      onError={() => setSrc("/placeholder.svg")}
    />
  )
}

// â”€â”€â”€ Approve Success Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ApproveToast({ title, onClose }: { title: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4">
      <CheckCircle2 className="h-5 w-5" />
      <div>
        <p className="font-semibold text-sm">Video Approved! âœ…</p>
        <p className="text-xs opacity-80 line-clamp-1">{title}</p>
        <p className="text-xs opacity-70 mt-0.5">User ko dashboard mein dikh jayega</p>
      </div>
    </div>
  )
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function VideoApprovalList({ filter }: VideoApprovalListProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [toast, setToast] = useState<{ id: string; title: string } | null>(null)
  const { user } = useAuth()

  const loadVideos = () => {
    if (!store) return
    const allVideos = store.getVideos()
    let filtered: Video[] = []
    if (filter === "pending") {
      filtered = allVideos.filter((v) => v.status === "pending-approval")
    } else if (filter === "approved") {
      filtered = allVideos.filter((v) => v.adminApproved === true)
    } else if (filter === "rejected") {
      filtered = allVideos.filter((v) => v.status === "rejected")
    }
    setVideos(filtered)
  }

  useEffect(() => { loadVideos() }, [filter])

  const handleApprove = (video: Video) => {
    if (!store || !user) return
    store.adminApproveVideo(video.id, user.id)
    setToast({ id: video.id, title: video.title })
    loadVideos()
  }

  const handleReject = (videoId: string) => {
    if (!store) return
    store.adminRejectVideo(videoId)
    loadVideos()
  }

  const handleBulkApproveLowRisk = () => {
    if (!store || !user) return
    const lowRiskIds = videos.filter(v => v.riskLevel === "low").map(v => v.id)
    store.bulkApproveVideos(lowRiskIds, user.id)
    setToast({ id: "bulk", title: `${lowRiskIds.length} videos approved!` })
    loadVideos()
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500"
    if (score >= 70) return "text-yellow-500"
    return "text-red-500"
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
    <>
      {toast && (
        <ApproveToast
          title={toast.title}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-4">
        {filter === "pending" && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {videos.length} videos pending â€¢{" "}
              {videos.filter(v => v.riskLevel === "low").length} low risk â€¢{" "}
              {videos.filter(v => v.riskLevel === "high").length} high risk
            </p>
            <Button size="sm" variant="outline" onClick={handleBulkApproveLowRisk}>
              <Check className="h-4 w-4 mr-2" />
              Bulk Approve Low Risk
            </Button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => {
            const channel = store?.getChannels().find((c) => c.id === video.channelId)
            const channelUser = store?.getUserById(channel?.userId || "")
            return (
              <Card
                key={video.id}
                className={`overflow-hidden ${video.riskLevel === "high" ? "border-red-500/50" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                    <Badge variant="outline" className={getScoreColor(video.aiScore)}>
                      {video.aiScore}/100
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{channelUser?.name || "Unknown"}</span>
                    <span>â€¢</span>
                    <span>{channel?.name || "Unknown"}</span>
                    {video.riskLevel === "high" && (
                      <Badge variant="destructive" className="text-xs py-0">
                        <AlertTriangle className="h-3 w-3 mr-1" />High Risk
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* â”€â”€ Thumbnail (canvas generated) â”€â”€ */}
                  <div className="aspect-video bg-secondary rounded-md overflow-hidden relative">
                    <VideoThumbnail video={video} />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="sm">
                        <Eye className="h-4 w-4 mr-2" />Preview
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost:</span>
                      <span className="font-medium">{video.isFree ? "Free" : "Rs." + (video.cost * 83).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scheduled:</span>
                      <span className="font-medium">{new Date(video.scheduledDate).toLocaleDateString()}</span>
                    </div>
                    {video.adminApproved && video.adminApprovedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Approved:</span>
                        <span className="font-medium text-green-500">
                          {new Date(video.adminApprovedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Approve ke baad next step info */}
                  {filter === "approved" && (
                    <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md text-xs text-green-500">
                      <CheckCircle2 className="h-3 w-3" />
                      User dashboard mein dikh raha hai â€” YouTube upload ready
                    </div>
                  )}

                  {video.aiScore >= 85 && (
                    <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md text-xs text-green-500">
                      <TrendingUp className="h-3 w-3" />
                      High viral potential detected
                    </div>
                  )}
                </CardContent>

                {filter === "pending" && (
                  <CardFooter className="gap-2 pt-3">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleApprove(video)}
                    >
                      <Check className="h-4 w-4 mr-2" />Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleReject(video.id)}
                    >
                      <X className="h-4 w-4 mr-2" />Reject
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </>
  )
}


