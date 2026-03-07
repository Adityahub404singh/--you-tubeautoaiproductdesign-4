"use client"
import { useEffect, useState } from "react"
import { store, type Video, getVideoFromIndexedDB, deleteVideoFromIndexedDB, addNotification } from "@/lib/store"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Eye, TrendingUp, AlertTriangle, CheckCircle2, Upload, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface VideoApprovalListProps {
  filter: "pending" | "approved" | "rejected"
}

function generateThumb(title: string): string {
  try {
    const canvas = document.createElement("canvas")
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext("2d")
    if (!ctx) return ""
    const W = 1280, H = 720
    ctx.fillStyle = "#0f0f0f"
    ctx.fillRect(0, 0, W, H)
    const rg = ctx.createLinearGradient(W*0.4,0,W,H)
    rg.addColorStop(0,"#1a1a2e")
    rg.addColorStop(1,"#16213e")
    ctx.fillStyle = rg
    ctx.fillRect(W*0.4,0,W*0.6,H)
    const g = ctx.createLinearGradient(0,0,W*0.75,0)
    g.addColorStop(0,"rgba(0,0,0,0.92)")
    g.addColorStop(0.6,"rgba(0,0,0,0.55)")
    g.addColorStop(1,"rgba(0,0,0,0)")
    ctx.fillStyle = g
    ctx.fillRect(0,0,W,H)
    ctx.fillStyle = "#FF0000"
    ctx.fillRect(0,0,14,H)
    ctx.fillStyle = "rgba(255,0,0,0.18)"
    ctx.fillRect(40, H*0.18, W*0.58, H*0.58)
    ctx.fillStyle = "#FF0000"
    ctx.fillRect(48, H*0.18+14, 110, 38)
    ctx.fillStyle = "#FFFFFF"
    ctx.font = "bold 20px Arial"
    ctx.textAlign = "left"
    ctx.fillText("VIRAL", 62, H*0.18+40)
    ctx.fillStyle = "#FFFFFF"
    ctx.shadowColor = "rgba(0,0,0,0.9)"
    ctx.shadowBlur = 10
    ctx.font = "bold 58px Arial"
    const words = title.toUpperCase().split(" ")
    let line = "", y = H*0.18+95
    for(let i=0;i<words.length;i++){
      const t = line+words[i]+" "
      if(ctx.measureText(t).width > W*0.58-40 && i>0){
        ctx.fillText(line.trim(),60,y)
        line=words[i]+" "
        y+=70
        if(y>H*0.76-80) break
      } else { line=t }
    }
    ctx.fillText(line.trim(),60,y)
    ctx.shadowBlur=0
    ctx.strokeStyle="#FF0000"
    ctx.lineWidth=3
    ctx.beginPath()
    ctx.moveTo(60,y+22)
    ctx.lineTo(W*0.58,y+22)
    ctx.stroke()
    ctx.fillStyle="#FF0000"
    ctx.fillRect(W-160,H-58,130,40)
    ctx.fillStyle="#FFFFFF"
    ctx.font="bold 18px Arial"
    ctx.textAlign="center"
    ctx.fillText("YouTube",W-95,H-30)
    return canvas.toDataURL("image/jpeg",0.85)
  } catch(e){ return "" }
}

function VideoThumb({ video }: { video: Video }) {
  const [src, setSrc] = useState<string>("")
  useEffect(() => {
    const url = generateThumb(video.title)
    setSrc(url)
    if(url) store?.updateVideo(video.id, { thumbnail: url })
  }, [video.id, video.title])
  if (!src) return <div className="w-full h-full bg-gray-900 flex items-center justify-center"><span className="text-white text-xs">Loading...</span></div>
  return <img src={src} alt={video.title} className="w-full h-full object-cover" />
}

function Toast({ title, type, message, onClose }: { title: string; type?: string; message?: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose,5000); return ()=>clearTimeout(t) },[onClose])
  const isError = type === "upload-error"
  
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl ${
      isError ? "bg-red-600" : "bg-green-600"
    } text-white max-w-sm`}>
      {isError ? <AlertTriangle className="h-5 w-5 flex-shrink-0" /> : <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
      <div className="min-w-0">
        <p className="font-semibold text-sm">
          {isError ? "❌ Upload Failed" : "✅ Success"}
        </p>
        <p className="text-xs opacity-80 line-clamp-1">{title}</p>
        {message && <p className="text-xs opacity-70 mt-0.5 line-clamp-2">{message}</p>}
      </div>
    </div>
  )
}

export function VideoApprovalList({ filter }: VideoApprovalListProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const [toast, setToast] = useState<{ id: string; title: string; type?: "upload-success" | "upload-error"; message?: string } | null>(null)
  const [uploadingVideos, setUploadingVideos] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  const loadVideos = () => {
    if (!store) return
    const all = store.getVideos()
    if (filter === "pending") setVideos(all.filter(v => v.status === "pending-approval"))
    else if (filter === "approved") setVideos(all.filter(v => v.adminApproved === true))
    else setVideos(all.filter(v => v.status === "rejected"))
  }

  useEffect(() => { loadVideos() }, [filter])

  // Auto-upload video to YouTube after admin approval (client-side to access IndexedDB)
  const autoUploadVideo = async (video: Video) => {
    // Check if video has a file stored in IndexedDB
    if (!video.videoFileId) {
      setToast({ 
        id: video.id, 
        title: video.title, 
        type: "upload-error",
        message: "No video file uploaded by user. User must upload a video file first." 
      })
      return
    }

    // Get the ORIGINAL USER's YouTube token (stored with the video)
    const userAccessToken = video.youtubeAccessToken
    if (!userAccessToken) {
      setToast({ 
        id: video.id, 
        title: video.title, 
        type: "upload-error",
        message: "YouTube not connected. User must connect YouTube in Channels settings." 
      })
      return
    }

    // Get channel info for category
    const channel = store?.getChannels().find(c => c.id === video.channelId)
    
    setUploadingVideos(prev => new Set(prev).add(video.id))

    try {
      // Get video file from IndexedDB (client-side access)
      const videoFile = await getVideoFromIndexedDB(video.videoFileId)
      if (!videoFile) {
        throw new Error("Video file not found. Please re-upload.")
      }

      // Prepare metadata
      const title = video.title?.slice(0, 100) || "Untitled Video"
      const description = video.description || "Generated by YouTubeAuto.ai"
      const tags = video.tags?.slice(0, 15) || []
      const categoryId = channel?.category || "28"

      // Create multipart upload request for YouTube Data API v3
      const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const metadata = {
        snippet: { title, description, tags, categoryId },
        status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
      }

      const metadataString = JSON.stringify(metadata)
      const videoBuffer = await videoFile.arrayBuffer()
      
      const parts: string[] = []
      parts.push(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataString}\r\n`)
      parts.push(`--${boundary}\r\nContent-Type: ${videoFile.type || "video/mp4"}\r\n\r\n`)
      
      const metadataPart = new TextEncoder().encode(parts[0])
      const videoPart = new Uint8Array(videoBuffer)
      const endingPart = new TextEncoder().encode(`\r\n--${boundary}--\r\n`)
      const body = new Blob([metadataPart, videoPart, endingPart], { type: `multipart/related; boundary=${boundary}` })

      // Upload to YouTube using ORIGINAL USER's token
      const youtubeResponse = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: body,
        }
      )

      if (!youtubeResponse.ok) {
        const errorText = await youtubeResponse.text()
        console.error("YouTube API error:", errorText)
        if (youtubeResponse.status === 401) throw new Error("YouTube authentication expired. Please reconnect in Channels settings.")
        if (youtubeResponse.status === 403) throw new Error("YouTube upload permission denied. Check channel permissions.")
        throw new Error(`YouTube upload failed: ${youtubeResponse.status}`)
      }

      const youtubeData = await youtubeResponse.json()
      
      // Clean up IndexedDB after successful upload
      await deleteVideoFromIndexedDB(video.videoFileId)

      const youtubeVideoId = youtubeData.id
      const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`

      // Update video with YouTube info
      store?.updateVideo(video.id, {
        status: "live",
        youtubeVideoId,
        youtubeUrl,
        uploadedAt: new Date().toISOString(),
      })

      // Send notification to user
      const channel = store?.getChannels().find(c => c.id === video.channelId)
      const channelUser = store?.getUserById(channel?.userId || "")
      if (channelUser) {
        addNotification({
          userId: channelUser.id,
          type: "video-live",
          title: "🎉 Video Published!",
          message: `Your video "${video.title}" is now live on YouTube!`,
          videoId: video.id,
          youtubeUrl: youtubeUrl,
        })
        
        // Send email notification to user
        if (channelUser.email) {
          fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: channelUser.email,
              type: "video-live",
              subject: `🎉 Your video "${video.title}" is now live on YouTube!`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">🎉 Video Published!</h1>
                  </div>
                  <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 12px 12px;">
                    <p style="font-size: 16px; color: #333;">Great news, ${channelUser.name}!</p>
                    <p style="font-size: 16px; color: #333;">Your video <strong>"${video.title}"</strong> has been successfully uploaded to YouTube!</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0; text-align: center;">
                      <p style="margin: 0; color: #666; margin-bottom: 15px;">Check out your video on YouTube:</p>
                      <a href="${youtubeUrl}" style="display: inline-block; background: #ff0000; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">View on YouTube</a>
                    </div>
                    <p style="margin-top: 30px; font-size: 14px; color: #999;">Thank you for using YouTubeAuto.ai!</p>
                  </div>
                </body>
                </html>
              `
            })
          }).catch(err => console.error("Email send failed:", err))
        }
      }

      setToast({ 
        id: video.id, 
        title: video.title, 
        type: "upload-success",
        message: `Uploaded to YouTube: ${youtubeUrl}`
      })
      loadVideos()
    } catch (err: any) {
      store?.updateVideo(video.id, {
        status: "failed",
        uploadError: err.message,
      })

      // Send failure notification to user
      const channel = store?.getChannels().find(c => c.id === video.channelId)
      const channelUser = store?.getUserById(channel?.userId || "")
      if (channelUser) {
        addNotification({
          userId: channelUser.id,
          type: "video-failed",
          title: "❌ Upload Failed",
          message: `Your video "${video.title}" failed to upload: ${err.message}`,
          videoId: video.id,
        })
        
        // Send email notification for failure
        if (channelUser.email) {
          fetch("/api/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: channelUser.email,
              type: "video-failed",
              subject: `❌ Video Upload Failed: ${video.title}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">⚠️ Upload Failed</h1>
                  </div>
                  <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 12px 12px;">
                    <p style="font-size: 16px; color: #333;">Hi ${channelUser.name},</p>
                    <p style="font-size: 16px; color: #333;">Unfortunately, your video <strong>"${video.title}"</strong> failed to upload to YouTube.</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
                      <p style="margin: 0; color: #666;"><strong>Error:</strong> ${err.message}</p>
                    </div>
                    <p style="margin: 20px 0; color: #666;">Please check the following and try again:</p>
                    <ul style="color: #666; text-align: left; margin: 20px 0;">
                      <li>Make sure your YouTube account is connected</li>
                      <li>Check that your video file is valid (MP4, MOV, AVI, WMV, WebM)</li>
                      <li>Ensure video is under 2GB</li>
                    </ul>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/channels" style="display: inline-block; background: #4a5568; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold;">Go to Channels Settings</a>
                    <p style="margin-top: 30px; font-size: 14px; color: #999;">Need help? Contact support@youtubeauto.ai</p>
                  </div>
                </body>
                </html>
              `
            })
          }).catch(emailErr => console.error("Email send failed:", emailErr))
        }
      }

      setToast({ 
        id: video.id, 
        title: video.title, 
        type: "upload-error",
        message: err.message || "Upload failed" 
      })
    } finally {
      setUploadingVideos(prev => {
        const next = new Set(prev)
        next.delete(video.id)
        return next
      })
    }
  }

  const handleApprove = async (video: Video) => {
    if (!store || !user) return
    store.adminApproveVideo(video.id, user.id)
    setToast({ id: video.id, title: video.title, type: "upload-success", message: "Video approved!" })
    loadVideos()
    
    // Send notification and email to user that video is being processed
    const channel = store.getChannels().find(c => c.id === video.channelId)
    const channelUser = store.getUserById(channel?.userId || "")
    if (channelUser) {
      // In-app notification for approval
      addNotification({
        userId: channelUser.id,
        type: "video-approved",
        title: "✅ Video Approved!",
        message: `Your video "${video.title}" has been approved and is being processed for upload!`,
        videoId: video.id,
      })
      
      // Email notification for approval
      if (channelUser.email) {
        fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: channelUser.email,
            type: "video-approved",
            subject: `✅ Your video "${video.title}" has been approved!`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0;">✅ Video Approved!</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 12px 12px;">
                  <p style="font-size: 16px; color: #333;">Hi ${channelUser.name},</p>
                  <p style="font-size: 16px; color: #333;">Great news! Your video <strong>"${video.title}"</strong> has been approved and is now being processed for upload to YouTube.</p>
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
                    <p style="margin: 0; color: #666;">We'll send you another email once your video is live on YouTube!</p>
                  </div>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: #4a5568; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">View Dashboard</a>
                  <p style="margin-top: 20px; font-size: 14px; color: #999;">Stay tuned! 🚀</p>
                  <p style="margin-top: 30px; font-size: 14px; color: #999;">Thank you for using YouTubeAuto.ai!</p>
                </div>
              </body>
              </html>
            `
          })
        }).catch(err => console.error("Approval email failed:", err))
      }
    }
    
    // Auto-upload using server API
    setTimeout(async () => {
      setUploadingVideos(prev => new Set(prev).add(video.id))
      try {
        const genRes = await fetch("/api/video/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioUrl: video.audioUrl || "", thumbnailUrl: video.thumbnailUrl || video.thumbnail || "", title: video.title }),
        })
        const genData = await genRes.json()
        if (!genData.success) throw new Error(genData.error || "Video generation failed")
        const upRes = await fetch("/api/youtube/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: `http://localhost:3000${genData.videoUrl}`, title: video.title, description: video.description || "", tags: video.tags || [], privacyStatus: "public", language: "hi" }),
        })
        const upData = await upRes.json()
        if (!upData.success) throw new Error(upData.error || "YouTube upload failed")
        store?.updateVideo(video.id, { status: "live", youtubeVideoId: upData.videoId, youtubeUrl: upData.youtubeUrl, uploadedAt: new Date().toISOString() })
        setToast({ id: video.id, title: video.title, type: "upload-success", message: `Live: ${upData.youtubeUrl}` })
        loadVideos()
      } catch (err: any) {
        store?.updateVideo(video.id, { status: "failed", uploadError: err.message })
        setToast({ id: video.id, title: video.title, type: "upload-error", message: err.message })
      } finally {
        setUploadingVideos(prev => { const n = new Set(prev); n.delete(video.id); return n })
      }
    }, 500)
  }

  const handleReject = (videoId: string) => {
    if (!store) return
    store.adminRejectVideo(videoId)
    loadVideos()
  }

  const handleBulk = () => {
    if (!store || !user) return
    const ids = videos.filter(v => v.riskLevel === "low").map(v => v.id)
    store.bulkApproveVideos(ids, user.id)
    setToast({ id: "bulk", title: `${ids.length} videos approved!` })
    loadVideos()
  }

  const scoreColor = (s: number) => s >= 85 ? "text-green-500" : s >= 70 ? "text-yellow-500" : "text-red-500"

  if (videos.length === 0) return (
    <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No videos in this category</p></CardContent></Card>
  )

  return (
    <>
      {toast && <Toast title={toast.title} onClose={() => setToast(null)} />}
      <div className="space-y-4">
        {filter === "pending" && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{videos.length} videos pending • {videos.filter(v=>v.riskLevel==="low").length} low risk • {videos.filter(v=>v.riskLevel==="high").length} high risk</p>
            <Button size="sm" variant="outline" onClick={handleBulk}><Check className="h-4 w-4 mr-2" />Bulk Approve Low Risk</Button>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map(video => {
            const channel = store?.getChannels().find(c => c.id === video.channelId)
            const channelUser = store?.getUserById(channel?.userId || "")
            return (
              <Card key={video.id} className={`overflow-hidden ${video.riskLevel === "high" ? "border-red-500/50" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                    <Badge variant="outline" className={scoreColor(video.aiScore)}>{video.aiScore}/100</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{channelUser?.name || "Unknown"}</span><span>•</span><span>{channel?.name || "Unknown"}</span>
                    {video.riskLevel === "high" && <Badge variant="destructive" className="text-xs py-0"><AlertTriangle className="h-3 w-3 mr-1" />High Risk</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="aspect-video bg-secondary rounded-md overflow-hidden relative">
                    <VideoThumb video={video} />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="sm"><Eye className="h-4 w-4 mr-2" />Preview</Button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Cost:</span><span className="font-medium">{video.isFree ? "Free" : "Rs."+(video.cost*83).toFixed(0)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Scheduled:</span><span className="font-medium">{new Date(video.scheduledDate).toLocaleDateString()}</span></div>
                  </div>
                  {/* Video Status - Live on YouTube */}
                  {video.status === "live" && video.youtubeUrl && (
                    <a 
                      href={video.youtubeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md text-xs text-green-500 hover:bg-green-500/20"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="line-clamp-1">LIVE on YouTube</span>
                    </a>
                  )}

                  {/* Video Status - Upload Failed with Retry Button */}
                  {video.status === "failed" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-md text-xs text-red-500">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="line-clamp-1">Upload Failed: {video.uploadError || "Unknown error"}</span>
                      </div>
                      {video.videoFileId && video.youtubeAccessToken && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => autoUploadVideo(video)}
                          disabled={uploadingVideos.has(video.id)}
                        >
                          {uploadingVideos.has(video.id) ? (
                            <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Retrying...</>
                          ) : (
                            <><Upload className="h-3 w-3 mr-1" /> Retry Upload</>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Video Status - Currently Uploading */}
                  {uploadingVideos.has(video.id) && (
                    <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-md text-xs text-blue-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Uploading to YouTube...</span>
                    </div>
                  )}

                  {/* Video Status - Ready to Upload */}
                  {video.status === "approved" && video.videoFileId && !video.youtubeUrl && !uploadingVideos.has(video.id) && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-md text-xs text-yellow-500">
                      <Upload className="h-3 w-3" />
                      <span>Ready to upload</span>
                    </div>
                  )}

                  {/* Video Status - No Video File */}
                  {video.status === "approved" && !video.videoFileId && (
                    <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-md text-xs text-orange-500">
                      <AlertTriangle className="h-3 w-3" />
                      <span>No video file - user must upload</span>
                    </div>
                  )}

                  {video.aiScore >= 85 && video.status !== "live" && <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md text-xs text-green-500"><TrendingUp className="h-3 w-3" />High viral potential</div>}
                </CardContent>
                {filter === "pending" && (
                  <CardFooter className="gap-2 pt-3">
                    <Button variant="default" size="sm" className="flex-1" onClick={() => handleApprove(video)}><Check className="h-4 w-4 mr-2" />Approve</Button>
                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleReject(video.id)}><X className="h-4 w-4 mr-2" />Reject</Button>
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



