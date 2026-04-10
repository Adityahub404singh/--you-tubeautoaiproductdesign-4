"use client"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { ContentCalendar } from "@/components/dashboard/content-calendar"
import { RecentVideos } from "@/components/dashboard/recent-videos"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth-context"
import { store } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Zap, Instagram, CheckCircle2 } from "lucide-react"
import YouTubeConnect from "@/components/YouTubeConnect"
import VideoGenerateUpload from "@/components/VideoGenerateUpload"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedChannel, setSelectedChannel] = useState("main-channel")
  const [igStatus, setIgStatus] = useState<any>(null)
  const [igLoading, setIgLoading] = useState(true)
  const [igToast, setIgToast] = useState(false)

  useEffect(() => {
    if (user && store) {
      const userChannels = store.getChannels(user.id)
      if (userChannels.length > 0) setSelectedChannel(userChannels[0].id)
    }
  }, [user])

  useEffect(() => {
    if (searchParams?.get("instagram") === "connected") {
      setIgToast(true)
      setTimeout(() => setIgToast(false), 4000)
    }
  }, [searchParams])

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/instagram/status")
        const data = await res.json()
        setIgStatus(data)
      } catch {
        setIgStatus({ connected: false })
      } finally {
        setIgLoading(false)
      }
    }
    check()
  }, [])

  const handleIgConnect = () => { window.location.href = "/api/auth/instagram?action=connect" }
  const handleIgDisconnect = async () => {
    try {
      await fetch("/api/instagram/status", { method: "DELETE" })
      setIgStatus({ connected: false })
    } catch {}
  }

  const freeRemaining = user ? Math.max(0, 10 - (user.freeVideosUsed || 0)) : 0
  const isPaid = user?.plan !== "free" || (user?.paidVideoCredits || 0) > 0
  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (!user) return
    const freeUsed = user.freeVideosUsed || 0
  }, [user, router])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader selectedChannel={selectedChannel} onChannelChange={setSelectedChannel} />
        {igToast && (
          <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-3 rounded-xl shadow-2xl">
            <Instagram className="h-5 w-5" />
            <span className="font-semibold">Instagram Connected! 🎉</span>
          </div>
        )}
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="space-y-6">
            {!isAdmin && !isPaid && freeRemaining <= 3 && (
              <div className={`flex items-center justify-between p-4 rounded-lg border ${freeRemaining === 0 ? "bg-red-500/10 border-red-500/30" : "bg-yellow-500/10 border-yellow-500/30"}`}>
                <div className="flex items-center gap-3">
                  <AlertCircle className={`h-5 w-5 ${freeRemaining === 0 ? "text-red-500" : "text-yellow-500"}`} />
                  <div>
                    {freeRemaining === 0
                      ? <p className="font-medium text-red-500">Free videos exhausted! Upgrade to continue.</p>
                      : <p className="font-medium text-yellow-500">{freeRemaining} free videos remaining</p>}
                    <p className="text-sm text-muted-foreground">Upgrade for more video generation</p>
                  </div>
                </div>
                <Button onClick={() => router.push("/upgrade")} size="sm">
                  <Zap className="h-4 w-4 mr-2" />Upgrade Now
                </Button>
              </div>
            )}
            {!isAdmin && isPaid && (
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Zap className="h-4 w-4 text-green-500" />
                <p className="text-sm text-green-500 font-medium">
                  {user?.plan !== "free" ? user?.plan?.toUpperCase() + " Plan — " : ""}{user?.paidVideoCredits || 0} video credits remaining
                </p>
              </div>
            )}
            <YouTubeConnect />
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Instagram className="h-5 w-5 text-pink-500" />
                <h2 className="text-lg font-semibold">
                  Instagram{" "}
                  {igStatus?.connected
                    ? <span className="text-green-400">Connected ✅</span>
                    : <span className="text-muted-foreground">Not Connected</span>}
                </h2>
              </div>
              {igLoading ? (
                <p className="text-sm text-muted-foreground animate-pulse">Checking status...</p>
              ) : igStatus?.connected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {igStatus.username ? igStatus.username[0].toUpperCase() : "I"}
                    </div>
                    <div>
                      <p className="font-semibold">@{igStatus.username || igStatus.igUserId || "Instagram"}</p>
                      <div className="flex gap-3 text-sm text-muted-foreground mt-0.5">
                        {igStatus.followers !== undefined && (
                          <span>{Number(igStatus.followers).toLocaleString()} followers</span>
                        )}
                        {igStatus.expiresAt && (
                          <span className="text-green-400">
                            Expires: {new Date(igStatus.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400 border border-green-500/30">
                      <CheckCircle2 className="h-3 w-3" /> Live
                    </span>
                    <Button variant="outline" size="sm" onClick={handleIgDisconnect} className="text-xs">Disconnect</Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Auto-post Reels + Feed after every video upload</p>
                    <p className="text-xs text-muted-foreground mt-1 opacity-70">Requires Instagram Business/Creator linked to Facebook Page</p>
                  </div>
                  <Button onClick={handleIgConnect} className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-semibold hover:opacity-90 shrink-0">
                    <Instagram className="h-4 w-4 mr-2" />Connect Instagram
                  </Button>
                </div>
              )}
            </div>
            <VideoGenerateUpload />
            <StatsOverview channelId={selectedChannel} />
            <QuickActions />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2"><ContentCalendar channelId={selectedChannel} /></div>
              <div><RecentVideos channelId={selectedChannel} /></div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
