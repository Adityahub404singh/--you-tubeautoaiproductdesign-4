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
import { useRouter } from "next/navigation"
import { AlertCircle, Zap } from "lucide-react"
import YouTubeConnect from "@/components/YouTubeConnect"
import VideoGenerateUpload from "@/components/VideoGenerateUpload"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedChannel, setSelectedChannel] = useState("main-channel")

  useEffect(() => {
    if (user && store) {
      const userChannels = store.getChannels(user.id)
      if (userChannels.length > 0) setSelectedChannel(userChannels[0].id)
    }
  }, [user])

  const freeRemaining = user ? Math.max(0, 10 - (user.freeVideosUsed || 0)) : 0
  const isPaid = user?.plan !== "free" || (user?.paidVideoCredits || 0) > 0
  const isAdmin = user?.role === "admin"
useEffect(() => {
  if (!user) return;

  const freeUsed = user.freeVideosUsed || 0;

  if (user.plan === "free" && freeUsed >= 10) {
    router.replace("/upgrade");
  }

}, [user, router]);
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader selectedChannel={selectedChannel} onChannelChange={setSelectedChannel} />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="space-y-6">
            {!isAdmin && !isPaid && freeRemaining <= 3 && (
              <div className={`flex items-center justify-between p-4 rounded-lg border ${freeRemaining === 0 ? "bg-red-500/10 border-red-500/30" : "bg-yellow-500/10 border-yellow-500/30"}`}>
                <div className="flex items-center gap-3">
                  <AlertCircle className={`h-5 w-5 ${freeRemaining === 0 ? "text-red-500" : "text-yellow-500"}`} />
                  <div>
                    {freeRemaining === 0
                      ? <p className="font-medium text-red-500">Free videos exhausted! Upgrade to continue.</p>
                      : <p className="font-medium text-yellow-500">{freeRemaining} free videos remaining</p>
                    }
                    <p className="text-sm text-muted-foreground">Upgrade for more video generation</p>
                  </div>
                </div>
                <Button onClick={() => router.push("/upgrade")} size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            )}
            {!isAdmin && isPaid && (
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Zap className="h-4 w-4 text-green-500" />
                <p className="text-sm text-green-500 font-medium">
                  {user?.plan !== "free" ? user?.plan?.toUpperCase() + " Plan" : ""} - {user?.paidVideoCredits || 0} video credits remaining
                </p>
              </div>
            )}
            <YouTubeConnect />
            <VideoGenerateUpload />
            <StatsOverview channelId={selectedChannel} />
            <QuickActions />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ContentCalendar channelId={selectedChannel} />
              </div>
              <div>
                <RecentVideos channelId={selectedChannel} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}


