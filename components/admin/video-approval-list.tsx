"use client"
// components/admin/video-approval-list.tsx
// PRO APPROVAL SYSTEM - Generate -> Upload -> YouTube + Instagram auto flow
import { useEffect, useState, useCallback } from "react"
import { store, type Video, addNotification } from "@/lib/store"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check, X, Eye, TrendingUp, AlertTriangle, CheckCircle2,
  Upload, Loader2, Play, ExternalLink, Clock, Zap
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface VideoApprovalListProps {
  filter: "pending" | "approved" | "rejected"
}

function Toast({ title, type, message, onClose }: {
  title: string; type?: string; message?: string; onClose: () => void
}) {
  useEffect(() => { const t = setTimeout(onClose, 6000); return () => clearTimeout(t) }, [onClose])
  const isError = type === "upload-error"
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl max-w-sm ${isError ? "bg-red-600" : "bg-green-600"} text-white`}>
      {isError ? <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5"/> : <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5"/>}
      <div>
        <p className="font-semibold text-sm">{title}</p>
        {message && <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{message}</p>}
      </div>
    </div>
  )
}

function VideoThumbnail({ video }: { video: Video }) {
  const [src, setSrc] = useState(video.thumbnailUrl || video.thumbnail || "")

  useEffect(() => {
    if (src) return
    try {
      const canvas = document.createElement("canvas")
      canvas.width = 1280; canvas.height = 720
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const g = ctx.createLinearGradient(0, 0, 1280, 720)
      g.addColorStop(0, "#0f0f1a"); g.addColorStop(1, "#1a0a2e")
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720)
      ctx.fillStyle = "#FF4081"; ctx.fillRect(0, 0, 12, 720)
      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 52px sans-serif"
      ctx.textAlign = "left"
      const words = (video.title || "").toUpperCase().split(" ")
      let line = "", y = 280
      for (const w of words) {
        const t = line + w + " "
        if (ctx.measureText(t).width > 900 && line) { ctx.fillText(line.trim(), 60, y); line = w + " "; y += 68 }
        else line = t
      }
      ctx.fillText(line.trim(), 60, y)
      ctx.fillStyle = "#FF4081"; ctx.fillRect(60, y + 16, 400, 4)
      const url = canvas.toDataURL("image/jpeg", 0.85)
      setSrc(url)
    } catch {}
  }, [video.title, src])

  if (!src) return (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <span className="text-white/40 text-xs">No Preview</span>
    </div>
  )
  return <img src={src} alt={video.title} className="w-full h-full object-cover"/>
}

function StatusBadge({ video, uploading }: { video: Video; uploading: boolean }) {
  if (uploading) return (
    <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-md text-xs text-blue-400">
      <Loader2 className="h-3 w-3 animate-spin"/> Uploading...
    </div>
  )
  if (video.status === "live" && video.youtubeUrl) return (
    <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md text-xs text-green-400 hover:bg-green-500/20">
      <CheckCircle2 className="h-3 w-3"/> LIVE on YouTube
      <ExternalLink className="h-3 w-3 ml-auto"/>
    </a>
  )
  if (video.status === "failed") return (
    <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-md text-xs text-red-400">
      <AlertTriangle className="h-3 w-3"/>
      <span className="line-clamp-1">{video.uploadError || "Upload failed"}</span>
    </div>
  )
  if (video.status === "uploading") return (
    <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-md text-xs text-yellow-400">
      <Clock className="h-3 w-3"/> Processing...
    </div>
  )
  if (video.videoUrl) return (
    <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded-md text-xs text-purple-400">
      <Play className="h-3 w-3"/> Video Ready
    </div>
  )
  return null
}

export function VideoApprovalList({ filter }: VideoApprovalListProps) {
  const { user } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [uploadingVideos, setUploadingVideos] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ id: string; title: string; type?: string; message?: string } | null>(null)
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null)

  const loadVideos = useCallback(() => {
    if (!store) return
    const all = store.getVideos()
    const filtered = filter === "pending"
      ? all.filter(v => v.status === "pending-approval")
      : filter === "approved"
        ? all.filter(v => ["approved","user-approved","uploading","live","failed"].includes(v.status))
        : all.filter(v => v.status === "rejected")
    setVideos(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }, [filter])

  useEffect(() => { loadVideos() }, [loadVideos])

  const notify = (video: Video, type: "video-live" | "video-failed" | "video-approved" | "video-rejected", msg: string, url?: string) => {
    const channel = store?.getChannels().find(c => c.id === video.channelId)
    const cu = store?.getUserById(channel?.userId || "")
    if (!cu) return
    addNotification({ userId: cu.id, type, title: type === "video-live" ? "Video Live!" : type === "video-approved" ? "Video Approved!" : "Upload Failed", message: msg, videoId: video.id, youtubeUrl: url })
  }

  const generateAndUpload = async (video: Video) => {
    setUploadingVideos(prev => new Set(prev).add(video.id))
    store?.updateVideo(video.id, { status: "uploading" })
    loadVideos()

    try {
      // Step 1: Generate video file
      let videoUrl = video.videoUrl || ""
      if (!videoUrl) {
        const catMap: Record<string, string> = { fact: "facts", motiv: "motivation", tech: "tech", ai: "tech", story: "story", top: "top10", short: "shorts" }
        const topicLow = (video.topic || "").toLowerCase()
        const catKey = Object.keys(catMap).find(k => topicLow.includes(k)) ? catMap[Object.keys(catMap).find(k => topicLow.includes(k))!] : "general"
        const genRes = await fetch("/api/video/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioUrl: video.audioUrl || "",
            thumbnailUrl: video.thumbnailUrl || video.thumbnail || "",
            title: video.title,
            script: video.script || video.description || video.title,
            hook: video.hook || "",
            videoType: video.videoType || "long",
            category: catKey,
          })
        })
        const genData = await genRes.json()
        if (!genData.success) throw new Error(genData.error || "Video generation failed")
        videoUrl = genData.videoUrl
        store?.updateVideo(video.id, { videoUrl })
        if (!videoUrl) throw new Error("Video URL missing after generation")
      }

      // Step 2: Upload to YouTube
      const upRes = await fetch("/api/youtube/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: videoUrl.startsWith("http") ? videoUrl : `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${videoUrl}`,
          title: video.title || video.topic || "Untitled Video",
          description: video.description || "AI Generated by YouTubeAuto.ai\n\n#viral #trending #hindi #india",
          tags: video.tags || [],
          privacyStatus: "public",
          language: "hi",
          videoType: video.videoType || "long",
          scheduledTime: video.scheduledTime || null,
        })
      })
      const upData = await upRes.json()
      if (!upData.success) throw new Error(upData.error || "YouTube upload failed")

      store?.updateVideo(video.id, {
        status: "live",
        youtubeVideoId: upData.videoId,
        youtubeUrl: upData.youtubeUrl,
        uploadedAt: new Date().toISOString(),
      })
      notify(video, "video-live", `"${video.title}" is now LIVE on YouTube!`, upData.youtubeUrl)
      setToast({ id: video.id, title: "Video Live on YouTube!", type: "upload-success", message: upData.youtubeUrl })
      loadVideos()

      // Step 2.5: Upload to Cloudinary (BEFORE Instagram needs the file)
      let publicVideoUrl = videoUrl.startsWith("http") ? videoUrl : `https://hyperaemic-jann-involuntary.ngrok-free.dev${videoUrl}`
      try {
        const cdnRes = await fetch("/api/storage/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl, videoId: video.id })
        })
        const cdnData = await cdnRes.json()
        if (cdnData.success) {
          publicVideoUrl = cdnData.cloudUrl
          console.log("Cloudinary URL:", publicVideoUrl)
        }
      } catch(e) { console.log("Cloudinary failed, using local URL") }

      // Step 3: Upload to Instagram Reels
      try {
        const igRes = await fetch("/api/instagram/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: publicVideoUrl,
            caption: `${video.title || video.topic}\n\n${video.description || ""}`,
            title: video.title,
            category: video.videoType || "general",
            hashtags: Array.isArray(video.tags) ? video.tags.slice(0, 5) : [],
          })
        })
        const igData = await igRes.json()
        if (igData.success) {
          console.log("Instagram published! ID:", igData.postId)
          store?.updateVideo(video.id, { instagramUrl: igData.instagramUrl } as any)
          setToast({ id: video.id + "_ig", title: "Also on Instagram!", type: "upload-success", message: igData.instagramUrl })
        } else {
          console.log("Instagram upload skipped:", igData.error)
        }
      } catch(igErr: any) {
        console.log("Instagram upload failed (non-critical):", igErr.message)
      }

      // Step 4: Cleanup local file AFTER all uploads
      try {
        await fetch("/api/storage/cleanup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl, videoId: video.id })
        })
      } catch(e) {}

    } catch (err: any) {
      console.error("Upload error:", err.message)
      store?.updateVideo(video.id, { status: "failed", uploadError: err.message })
      notify(video, "video-failed", `Upload failed: ${err.message}`)
      setToast({ id: video.id, title: "Upload Failed", type: "upload-error", message: err.message })
      loadVideos()
    } finally {
      setUploadingVideos(prev => { const n = new Set(prev); n.delete(video.id); return n })
    }
  }

  const handleApprove = async (video: Video) => {
    if (!store || !user) return
    store.adminApproveVideo(video.id, user.id)
    notify(video, "video-approved", `"${video.title}" has been approved!`)
    setToast({ id: video.id, title: "Approved!", message: "Generating & uploading..." })
    loadVideos()
    setTimeout(() => generateAndUpload(video), 500)
  }

  const handleReject = (videoId: string) => {
    if (!store) return
    store.adminRejectVideo(videoId)
    loadVideos()
  }

  const handleBulkApprove = () => {
    if (!store || !user) return
    const lowRisk = videos.filter(v => v.riskLevel === "low" && v.status === "pending-approval")
    store.bulkApproveVideos(lowRisk.map(v => v.id), user.id)
    setToast({ id: "bulk", title: `${lowRisk.length} videos approved!` })
    loadVideos()
    lowRisk.forEach((v, i) => setTimeout(() => generateAndUpload(v), i * 2000))
  }

  const scoreColor = (s: number) => s >= 85 ? "text-green-400" : s >= 70 ? "text-yellow-400" : "text-red-400"

  if (videos.length === 0) return (
    <Card>
      <CardContent className="py-16 text-center">
        <p className="text-muted-foreground text-lg">No videos here</p>
        <p className="text-muted-foreground text-sm mt-1">
          {filter === "pending" ? "Generate new videos from the dashboard!" : `No ${filter} videos yet`}
        </p>
      </CardContent>
    </Card>
  )

  return (
    <>
      {toast && <Toast title={toast.title} type={toast.type} message={toast.message} onClose={() => setToast(null)}/>}

      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewVideo(null)}>
          <div className="bg-background rounded-xl max-w-2xl w-full p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold line-clamp-1">{previewVideo.title}</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewVideo(null)}>X</Button>
            </div>
            {previewVideo.videoUrl ? (
              <video controls src={previewVideo.videoUrl} className="w-full rounded-lg" autoPlay/>
            ) : previewVideo.audioUrl ? (
              <div className="space-y-2">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <VideoThumbnail video={previewVideo}/>
                </div>
                <audio controls src={previewVideo.audioUrl} className="w-full"/>
              </div>
            ) : (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <VideoThumbnail video={previewVideo}/>
              </div>
            )}
            {previewVideo.hook && (
              <p className="text-sm text-muted-foreground italic">Hook: "{previewVideo.hook}"</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filter === "pending" && videos.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {videos.length} pending{" "}
              <span className="text-green-400">{videos.filter(v=>v.riskLevel==="low").length} low risk</span>{" "}
              <span className="text-red-400">{videos.filter(v=>v.riskLevel==="high").length} high risk</span>
            </p>
            <Button size="sm" onClick={handleBulkApprove} className="gap-2">
              <Zap className="h-4 w-4"/>
              Bulk Approve Low Risk
            </Button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map(video => {
            const channel = store?.getChannels().find(c => c.id === video.channelId)
            const channelUser = store?.getUserById(channel?.userId || "")
            const isUploading = uploadingVideos.has(video.id)

            return (
              <Card key={video.id} className={`overflow-hidden transition-all ${video.riskLevel === "high" ? "border-red-500/40" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold line-clamp-2 flex-1">{video.title}</CardTitle>
                    <Badge variant="outline" className={`text-xs flex-shrink-0 ${scoreColor(video.aiScore)}`}>
                      {video.aiScore}/100
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span>{channelUser?.name || "Unknown"}</span>
                    <span>-</span>
                    <span>{channel?.name || "Unknown"}</span>
                    {video.videoType === "shorts" && <Badge className="bg-red-600 text-white text-xs py-0">Shorts</Badge>}
                    {video.riskLevel === "high" && (
                      <Badge variant="destructive" className="text-xs py-0">
                        <AlertTriangle className="h-3 w-3 mr-1"/>High Risk
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="aspect-video bg-secondary rounded-md overflow-hidden relative group">
                    <VideoThumbnail video={video}/>
                    <div
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => setPreviewVideo(video)}
                    >
                      <div className="bg-white/20 backdrop-blur rounded-full p-3">
                        <Play className="h-5 w-5 text-white"/>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Scheduled:</span>
                      <span className="font-medium text-foreground">
                        {new Date(video.scheduledDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Cost:</span>
                      <span className="font-medium text-foreground">{video.isFree ? "Free" : `Rs.${(video.cost * 83).toFixed(0)}`}</span>
                    </div>
                    {video.hook && (
                      <p className="text-muted-foreground italic line-clamp-1">"{video.hook}"</p>
                    )}
                  </div>

                  <StatusBadge video={video} uploading={isUploading}/>

                  {video.aiScore >= 85 && video.status !== "live" && !isUploading && (
                    <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md text-xs text-green-400">
                      <TrendingUp className="h-3 w-3"/> High viral potential
                    </div>
                  )}

                  {video.status === "failed" && !isUploading && (
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => generateAndUpload(video)}>
                      <Upload className="h-3 w-3 mr-1"/> Retry Upload
                    </Button>
                  )}
                </CardContent>

                {filter === "pending" && (
                  <CardFooter className="gap-2 pt-0">
                    <Button
                      variant="default" size="sm" className="flex-1"
                      onClick={() => handleApprove(video)}
                      disabled={isUploading}
                    >
                      {isUploading
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Processing...</>
                        : <><Check className="h-4 w-4 mr-2"/>Approve & Upload</>
                      }
                    </Button>
                    <Button
                      variant="destructive" size="sm" className="flex-1"
                      onClick={() => handleReject(video.id)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4 mr-2"/>Reject
                    </Button>
                  </CardFooter>
                )}

                {filter === "approved" && video.status !== "live" && !isUploading && (
                  <CardFooter className="pt-0">
                    <Button
                      variant="outline" size="sm" className="w-full"
                      onClick={() => generateAndUpload(video)}
                    >
                      <Upload className="h-4 w-4 mr-2"/>
                      {video.videoUrl ? "Upload to YouTube" : "Generate & Upload"}
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





