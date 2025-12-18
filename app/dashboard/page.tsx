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

export default function DashboardPage() {
  const { user } = useAuth()
  const [selectedChannel, setSelectedChannel] = useState("main-channel")
  const [channels, setChannels] = useState<any[]>([])

  useEffect(() => {
    if (user && store) {
      const userChannels = store.getChannels(user.id)
      setChannels(userChannels)
      if (userChannels.length > 0) {
        setSelectedChannel(userChannels[0].id)
      }
    }
  }, [user])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader selectedChannel={selectedChannel} onChannelChange={setSelectedChannel} />

        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="space-y-8">
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
