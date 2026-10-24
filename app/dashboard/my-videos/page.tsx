"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Film,
  ImageOff,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Video,
  Youtube,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { store, type Video as VideoType, type Channel } from "@/lib/store"

type TabKey = "all" | "live" | "pending" | "failed"

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  live: {
    label: "Live on YouTube",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    icon: CheckCircle2,
  },
  approved: {
    label: "Approved",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    icon: CheckCircle2,
  },
  "pending-approval": {
    label: "Pending approval",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    icon: Clock3,
  },
  uploading: {
    label: "Uploading",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-400",
    icon: LoaderCircle,
  },
  "user-approved": {
    label: "User approved",
    className: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    icon: CheckCircle2,
  },
  failed: {
    label: "Upload failed",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    icon: AlertTriangle,
  },
  rejected: {
    label: "Rejected",
    className: "border-red-500/30 bg-red-500/10 text-red-400",
    icon: AlertTriangle,
  },
}

function createFallbackThumbnail(title: string, topic = ""): string {
  try {
    const canvas = document.createElement("canvas")
    canvas.width = 1280
    canvas.height = 720

    const ctx = canvas.getContext("2d")
    if (!ctx) return ""

    const gradient = ctx.createLinearGradient(0, 0, 1280, 720)
    gradient.addColorStop(0, "#09090b")
    gradient.addColorStop(0.55, "#17111f")
    gradient.addColorStop(1, "#321014")

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1280, 720)

    // Decorative background elements.
    ctx.fillStyle = "rgba(239, 68, 68, 0.10)"
    ctx.beginPath()
    ctx.arc(1110, 110, 300, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "#ef4444"
    ctx.fillRect(0, 0, 14, 720)
    ctx.fillRect(64, 76, 128, 8)

    // Brand label.
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 26px Arial"
    ctx.textAlign = "left"
    ctx.fillText("YouTubeAuto.ai", 64, 130)

    ctx.fillStyle = "#f87171"
    ctx.font = "bold 20px Arial"
    ctx.fillText("VIDEO PREVIEW", 64, 190)

    // Wrap long titles without overflowing the canvas.
    const text = (title || topic || "Your next video").trim().toUpperCase()
    const words = text.split(/\s+/)
    const maxWidth = 1080
    const lineHeight = 76
    const lines: string[] = []
    let line = ""

    ctx.font = "bold 56px Arial"

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word

      if (ctx.measureText(candidate).width > maxWidth && line) {
        lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }

    if (line) lines.push(line)

    const visibleLines = lines.slice(0, 4)
    let y = 300

    for (const item of visibleLines) {
      let output = item

      while (ctx.measureText(output).width > maxWidth && output.length > 3) {
        output = `${output.slice(0, -4)}...`
      }

      ctx.fillStyle = "#ffffff"
      ctx.fillText(output, 64, y)
      y += lineHeight
    }

    // Bottom accent and preview label.
    ctx.fillStyle = "rgba(255,255,255,0.12)"
    ctx.fillRect(64, 620, 1152, 1)

    ctx.fillStyle = "#ef4444"
    ctx.beginPath()
    ctx.roundRect(64, 646, 170, 42, 10)
    ctx.fill()

    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 18px Arial"
    ctx.fillText("VIDEO", 111, 673)

    ctx.textAlign = "right"
    ctx.fillStyle = "#d4d4d8"
    ctx.font = "18px Arial"
    ctx.fillText("Thumbnail preview", 1216, 674)

    return canvas.toDataURL("image/jpeg", 0.88)
  } catch {
    return ""
  }
}

function VideoThumbnail({ video }: { video: VideoType }) {
  const [src, setSrc] = useState("")
  const [usingFallback, setUsingFallback] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    setSrc("")
    setUsingFallback(false)
    setImageFailed(false)

    const original =
      video.thumbnailUrl?.trim() || video.thumbnail?.trim() || ""

    // Keep the actual thumbnail whenever it exists.
    if (
      original &&
      (original.startsWith("/") ||
        original.startsWith("https://") ||
        original.startsWith("http://") ||
        original.startsWith("data:image/"))
    ) {
      setSrc(original)
      return
    }

    const fallback = createFallbackThumbnail(video.title, video.topic)

    if (!cancelled) {
      setUsingFallback(true)
      if (fallback) setSrc(fallback)
      else setImageFailed(true)
    }

    return () => {
      cancelled = true
    }
  }, [video.id, video.title, video.topic, video.thumbnail, video.thumbnailUrl])

  const handleImageError = () => {
    // A missing real thumbnail should never leave a broken-image icon.
    if (!usingFallback) {
      const fallback = createFallbackThumbnail(video.title, video.topic)
      setUsingFallback(true)

      if (fallback) {
        setSrc(fallback)
      } else {
        setImageFailed(true)
      }
      return
    }

    setImageFailed(true)
  }

  if (!src || imageFailed) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950 text-zinc-400">
        <ImageOff className="h-8 w-8" />
        <span className="text-xs">Thumbnail unavailable</span>
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
      <img
        src={src}
        alt={`${video.title || "Video"} thumbnail`}
        loading="lazy"
        decoding="async"
        onError={handleImageError}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />

      {usingFallback && (
        <div className="absolute bottom-2 left-2 rounded-md border border-white/10 bg-black/70 px-2 py-1 text-[10px] text-white/80 backdrop-blur">
          Preview thumbnail
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
    </div>
  )
}

function formatDate(value?: string) {
  if (!value) return "Date unavailable"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

function VideoCard({
  video,
  channelName,
}: {
  video: VideoType
  channelName: string
}) {
  const config = statusConfig[video.status] || statusConfig["pending-approval"]
  const StatusIcon = config.icon

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 transition duration-300 hover:-translate-y-1 hover:border-red-500/30 hover:shadow-xl hover:shadow-red-950/20">
      <div className="relative overflow-hidden">
        <VideoThumbnail video={video} />

        <div className="absolute left-3 top-3 rounded-md border border-white/10 bg-black/65 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur">
          {video.videoType === "shorts"
            ? "Shorts"
            : video.videoType === "long"
              ? "Long video"
              : "Video"}
        </div>

        <Badge
          variant="outline"
          className={`absolute right-3 top-3 max-w-[75%] gap-1 truncate backdrop-blur ${config.className}`}
        >
          <StatusIcon
            className={`h-3 w-3 shrink-0 ${
              video.status === "uploading" ? "animate-spin" : ""
            }`}
          />
          <span className="truncate">{config.label}</span>
        </Badge>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h2
            className="line-clamp-2 min-h-10 break-words text-sm font-semibold leading-5 text-white"
            title={video.title}
          >
            {video.title || "Untitled video"}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Youtube className="h-3.5 w-3.5 shrink-0 text-red-500" />
              <span className="max-w-[150px] truncate">{channelName}</span>
            </span>
            <span className="text-zinc-600">•</span>
            <span>{formatDate(video.createdAt)}</span>
          </div>
        </div>

        {video.description && (
          <p className="line-clamp-2 text-xs leading-5 text-zinc-400">
            {video.description}
          </p>
        )}

        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="max-w-full truncate rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-300"
              >
                {tag}
              </span>
            ))}
            {video.tags.length > 3 && (
              <span className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-400">
                +{video.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              AI score
            </p>
            <p className="mt-0.5 text-sm font-semibold text-zinc-200">
              {Number.isFinite(video.aiScore) ? video.aiScore : 0}
              <span className="text-zinc-500">/100</span>
            </p>
          </div>

          {video.status === "live" && video.youtubeUrl ? (
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
            >
              <Youtube className="h-3.5 w-3.5" />
              Watch video
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : video.youtubeUrl ? (
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs text-zinc-300 transition hover:text-white"
            >
              View link <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>

        {video.status === "failed" && video.uploadError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs leading-5 text-red-300">
            <p className="mb-1 font-semibold">Upload issue</p>
            <p className="break-words">{video.uploadError}</p>
          </div>
        )}
      </div>
    </article>
  )
}

export default function MyVideosPage() {
  const { user } = useAuth()

  const [videos, setVideos] = useState<VideoType[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const [selectedChannel, setSelectedChannel] = useState("main-channel")
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const refreshVideos = useCallback(() => {
    if (!user?.email || !store) {
      setChannels([])
      setVideos([])
      setLoaded(true)
      return
    }

    const localUser = store.getUserByEmail(user.email)

    if (!localUser) {
      setChannels([])
      setVideos([])
      setLoaded(true)
      console.warn(
        "My Videos: no local Store profile matches the signed-in email."
      )
      return
    }

    store.repairOrphanedChannelsForSingleUser(localUser.id)

    const userChannels = store.getChannels(localUser.id)
    setChannels(userChannels)

    const channelIds = new Set(userChannels.map((channel) => channel.id))

    const userVideos = store
      .getVideos()
      .filter((video) => channelIds.has(video.channelId))
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })

    setVideos(userVideos)
    setLoaded(true)
  }, [user?.email])

  useEffect(() => {
    refreshVideos()

    const handleStorage = () => refreshVideos()
    const handleFocus = () => refreshVideos()

    window.addEventListener("storage", handleStorage)
    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("focus", handleFocus)
    }
  }, [refreshVideos])

  const counts = useMemo(
    () => ({
      all: videos.length,
      live: videos.filter((video) => video.status === "live").length,
      pending: videos.filter((video) =>
        ["pending-approval", "approved", "uploading", "user-approved"].includes(
          video.status
        )
      ).length,
      failed: videos.filter((video) =>
        ["failed", "rejected"].includes(video.status)
      ).length,
    }),
    [videos]
  )

  const filteredVideos = useMemo(() => {
    let result = videos

    if (activeTab === "live") {
      result = result.filter((video) => video.status === "live")
    } else if (activeTab === "pending") {
      result = result.filter((video) =>
        ["pending-approval", "approved", "uploading", "user-approved"].includes(
          video.status
        )
      )
    } else if (activeTab === "failed") {
      result = result.filter((video) =>
        ["failed", "rejected"].includes(video.status)
      )
    }

    const query = searchQuery.trim().toLowerCase()

    if (query) {
      result = result.filter((video) => {
        const channelName =
          channels.find((channel) => channel.id === video.channelId)?.name || ""

        return (
          video.title?.toLowerCase().includes(query) ||
          video.topic?.toLowerCase().includes(query) ||
          channelName.toLowerCase().includes(query) ||
          video.tags?.some((tag) => tag.toLowerCase().includes(query))
        )
      })
    }

    return result
  }, [videos, channels, activeTab, searchQuery])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      refreshVideos()
    } finally {
      window.setTimeout(() => setIsRefreshing(false), 350)
    }
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All videos", count: counts.all },
    { key: "live", label: "Live", count: counts.live },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "failed", label: "Failed", count: counts.failed },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <DashboardHeader
          selectedChannel={selectedChannel}
          onChannelChange={setSelectedChannel}
        />

        <main className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8">
          <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-950 to-red-950/30 p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-red-600/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300">
                  <Film className="h-3.5 w-3.5" />
                  Your content library
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  My Videos
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                  Manage your generated content, review publishing status, and
                  open videos that are live on YouTube.
                </p>

                <div className="mt-5 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-zinc-300">
                    {counts.all} total
                  </span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">
                    {counts.live} live
                  </span>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-amber-300">
                    {counts.pending} pending
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${
                      isRefreshing ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>

                <Button asChild className="bg-red-600 text-white hover:bg-red-500">
                  <Link href="/dashboard/new-prompt">
                    <Plus className="mr-2 h-4 w-4" />
                    Create video
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Total videos",
                value: counts.all,
                icon: Video,
                color: "text-white",
              },
              {
                label: "Live on YouTube",
                value: counts.live,
                icon: Youtube,
                color: "text-emerald-400",
              },
              {
                label: "Awaiting action",
                value: counts.pending,
                icon: Clock3,
                color: "text-amber-400",
              },
              {
                label: "Failed / rejected",
                value: counts.failed,
                icon: AlertTriangle,
                color: "text-red-400",
              },
            ].map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 sm:p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-zinc-400 sm:text-sm">
                      {item.label}
                    </p>
                    <Icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                  </div>
                  <p className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    {item.value}
                  </p>
                </div>
              )
            })}
          </section>

          <section className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold">Your library</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Search by title, topic, tag, or channel.
                </p>
              </div>

              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search your videos..."
                  className="border-white/10 bg-black pl-9 text-white placeholder:text-zinc-600 focus-visible:ring-red-500/50"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? "bg-red-600 text-white shadow-lg shadow-red-950/20"
                      : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                      activeTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-black/40 text-zinc-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {!loaded ? (
              <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-zinc-400">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Loading your videos...
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-4 py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  {searchQuery ? (
                    <Search className="h-7 w-7 text-zinc-500" />
                  ) : (
                    <Film className="h-7 w-7 text-zinc-500" />
                  )}
                </div>

                <h3 className="text-lg font-semibold">
                  {searchQuery
                    ? "No matching videos"
                    : activeTab === "live"
                      ? "No videos live yet"
                      : activeTab === "pending"
                        ? "No pending videos"
                        : activeTab === "failed"
                          ? "No failed videos"
                          : "Your library is ready for its first video"}
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                  {searchQuery
                    ? "Try a different title, topic, tag, or channel name."
                    : channels.length === 0
                      ? "No channels are associated with this local profile. Check your channel setup and account."
                      : activeTab === "live"
                        ? "Once a video is successfully published, it will appear here."
                        : "Create a video to see its thumbnail, review status, and publishing details here."}
                </p>

                {searchQuery ? (
                  <Button
                    variant="outline"
                    className="mt-5 border-white/15 text-white hover:bg-white/10"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                ) : activeTab === "all" ? (
                  <Button asChild className="mt-5 bg-red-600 hover:bg-red-500">
                    <Link href="/dashboard/new-prompt">
                      <Plus className="mr-2 h-4 w-4" />
                      Create your first video
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-5 border-white/15 text-white hover:bg-white/10"
                    onClick={() => setActiveTab("all")}
                  >
                    View all videos
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between py-4 text-xs text-zinc-500">
                  <span>
                    Showing {filteredVideos.length} of {videos.length} videos
                  </span>
                  <span className="hidden sm:inline">
                    Newest videos first
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredVideos.map((video) => {
                    const channelName =
                      channels.find(
                        (channel) => channel.id === video.channelId
                      )?.name || "Unknown channel"

                    return (
                      <VideoCard
                        key={video.id}
                        video={video}
                        channelName={channelName}
                      />
                    )
                  })}
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </ProtectedRoute>
  )
}
