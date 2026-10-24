"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { store, type Video as VideoType } from "@/lib/store"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  XCircle,
  Clock3,
  Video as VideoIcon,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
} from "lucide-react"

type FilterType = "pending" | "approved" | "rejected"

interface VideoApprovalListProps {
  filter: FilterType
}

interface UploadResult {
  success?: boolean
  queued?: boolean
  error?: string
  message?: string
  videoId?: string
  youtubeUrl?: string
  status?: string
}

export function VideoApprovalList({ filter }: VideoApprovalListProps) {
  const { user } = useAuth()
  const [videos, setVideos] = useState<VideoType[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const refreshVideos = useCallback(() => {
    try {
      setVideos(store ? store.getVideos() : [])
    } catch (e) {
      console.error("Could not load videos:", e)
      setError("Videos load nahi ho paaye.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshVideos()

    const onStorage = () => refreshVideos()
    window.addEventListener("storage", onStorage)

    return () => window.removeEventListener("storage", onStorage)
  }, [refreshVideos])

  const filteredVideos = useMemo(() => {
    return videos
      .filter((video) => {
        if (filter === "pending") {
          return (
            video.status === "pending-approval" ||
            (!video.adminApproved &&
              video.status !== "rejected" &&
              video.status !== "live" &&
              video.status !== "failed")
          )
        }

        if (filter === "approved") {
          return video.adminApproved === true && video.status !== "rejected"
        }

        return video.status === "rejected"
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
  }, [videos, filter])

  const handleApprove = async (video: VideoType) => {
    if (!store || !user?.id) {
      setError("Admin session ya local video store available nahi hai.")
      return
    }

    if (!video.videoUrl) {
      setError(
        `"${video.title}" ki video file missing hai. Pehle video generate karke save karo.`,
      )
      return
    }

    if (!video.thumbnailUrl && !video.thumbnail) {
      setError(
        `"${video.title}" ka thumbnail missing hai. Pehle thumbnail generate karo.`,
      )
      return
    }

    if (video.status === "live" && video.youtubeUrl) {
      setMessage("Yeh video pehle se YouTube par publish ho chuka hai.")
      return
    }

    const confirmed = window.confirm(
      `"${video.title}" ko approve karke YouTube par PUBLIC publish karna hai? Agar upload successful hua, video public ho sakta hai.`,
    )

    if (!confirmed) return

    setBusyId(video.id)
    setError("")
    setMessage("YouTube par video upload ho raha hai. Is window ko band mat karo.")

    try {
      // Save admin approval first. Upload success is tracked separately.
      store.adminApproveVideo(video.id, user.id)
      refreshVideos()

      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: video.videoUrl,
          title: video.title,
          description: video.description || "",
          tags: video.tags || [],
          categoryId: "22",
          privacyStatus: "public",
          language: "hi",
        }),
      })

      const result = (await response.json().catch(() => ({}))) as UploadResult

      if (!response.ok || !result.success) {
        if (result.queued) {
          setMessage(
            result.message ||
              "Video upload queue mein add hua hai; abhi Live nahi hai.",
          )
          refreshVideos()
          return
        }

        throw new Error(result.error || result.message || `Upload failed (${response.status})`)
      }

      if (!result.videoId || !result.youtubeUrl) {
        throw new Error(
          "Upload API ne success response diya, lekin YouTube video ID/link nahi mila. YouTube par status verify karo.",
        )
      }

      // Mark Live only when the API confirms public status.
      if (result.status?.toLowerCase() === "public") {
        store.updateVideo(video.id, {
          status: "live",
          youtubeUrl: result.youtubeUrl,
          adminApproved: true,
        })

        setMessage(
          `Video YouTube par publish ho gaya: ${result.youtubeUrl}`,
        )
      } else {
        store.updateVideo(video.id, {
          youtubeUrl: result.youtubeUrl,
          adminApproved: true,
          status: "approved",
        })

        setMessage(
          `YouTube upload complete hai, lekin visibility "${result.status || "unknown"}" hai. Video ko Live mark nahi kiya gaya.`,
        )
      }

      refreshVideos()
    } catch (e) {
      console.error("Approval/upload failed:", e)
      const details =
        e instanceof Error ? e.message : "Unknown error"

      setError(
        `Approval save ho sakta hai, lekin YouTube upload/publish confirm nahi hua: ${details}`,
      )
      refreshVideos()
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = (video: VideoType) => {
    if (!store) {
      setError("Video store available nahi hai.")
      return
    }

    const confirmed = window.confirm(`"${video.title}" ko reject karna hai?`)
    if (!confirmed) return

    setBusyId(video.id)
    setError("")
    setMessage("")

    try {
      store.adminRejectVideo(video.id)
      refreshVideos()
      setMessage("Video reject kar diya gaya.")
    } catch (e) {
      console.error("Rejection failed:", e)
      setError("Video reject nahi ho paaya.")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Videos load ho rahe hain...
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filteredVideos.length} video(s)
        </p>

        <Button variant="outline" onClick={refreshVideos}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {message && (
        <div
          role="status"
          className="break-words rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="break-words rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300"
        >
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      )}

      {filteredVideos.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <VideoIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />

          <h2 className="font-semibold">
            {filter === "pending"
              ? "No videos pending approval"
              : filter === "approved"
                ? "No approved videos"
                : "No rejected videos"}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Videos generate hone ke baad yahan refresh karke dekho.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredVideos.map((video) => {
            const thumbnail = video.thumbnailUrl || video.thumbnail || ""
            const videoUrl = video.videoUrl || ""

            const status =
              video.status === "live"
                ? "Live"
                : video.status === "rejected"
                  ? "Rejected"
                  : video.adminApproved
                    ? "Approved"
                    : "Pending approval"

            return (
              <article
                key={video.id}
                className="overflow-hidden rounded-xl border bg-card"
              >
                <div className="grid grid-cols-1 gap-5 p-4 md:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-lg border bg-black">
                      {thumbnail ? (
                        <a
                          href={thumbnail}
                          target="_blank"
                          rel="noreferrer"
                          title="Open full thumbnail"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbnail}
                            alt={`Thumbnail: ${video.title}`}
                            className="aspect-video w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none"
                            }}
                          />
                        </a>
                      ) : (
                        <div className="flex aspect-video items-center justify-center text-sm text-white">
                          Thumbnail unavailable
                        </div>
                      )}
                    </div>

                    {videoUrl ? (
                      <video
                        key={videoUrl}
                        src={videoUrl}
                        controls
                        preload="metadata"
                        className="aspect-video w-full rounded-lg border bg-black"
                      >
                        Your browser does not support video playback.
                      </video>
                    ) : (
                      <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                        <div>
                          <VideoIcon className="mx-auto mb-2 h-7 w-7" />
                          Actual video file missing
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="break-words text-xl font-bold">
                          {video.title || "Untitled video"}
                        </h2>

                        <p className="mt-1 break-all text-xs text-muted-foreground">
                          ID: {video.id}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={
                          video.status === "rejected"
                            ? "border-red-500/40 text-red-600"
                            : video.status === "live"
                              ? "border-emerald-500/40 text-emerald-600"
                              : video.adminApproved
                                ? "border-blue-500/40 text-blue-600"
                                : "border-amber-500/40 text-amber-600"
                        }
                      >
                        {status === "Live" ? (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        ) : status === "Rejected" ? (
                          <XCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <Clock3 className="mr-1 h-3 w-3" />
                        )}
                        {status}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="mb-1 text-sm font-semibold">
                        Description
                      </h3>
                      <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        {video.description || "No description provided."}
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-1 text-sm font-semibold">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {video.tags?.length ? (
                          video.tags.map((tag, index) => (
                            <Badge
                              key={`${tag}-${index}`}
                              variant="secondary"
                            >
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No tags
                          </span>
                        )}
                      </div>
                    </div>

                    {video.script && (
                      <details className="rounded-lg border p-3">
                        <summary className="cursor-pointer text-sm font-semibold">
                          View script
                        </summary>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                          {video.script}
                        </p>
                      </details>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Created:{" "}
                      {video.createdAt
                        ? new Date(video.createdAt).toLocaleString()
                        : "Unknown"}
                    </div>

                    {video.youtubeUrl && (
                      <a
                        href={video.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 break-all text-sm text-blue-600 underline"
                      >
                        View on YouTube
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    )}

                    {filter === "pending" && (
                      <div className="flex flex-wrap gap-3 border-t pt-4">
                        <Button
                          onClick={() => handleApprove(video)}
                          disabled={busyId === video.id}
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          {busyId === video.id ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          {busyId === video.id
                            ? "Uploading..."
                            : "Approve & Publish"}
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => handleReject(video)}
                          disabled={busyId === video.id}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject Video
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
