"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Zap,
  ShieldCheck,
  LayoutDashboard,
  RefreshCw,
} from "lucide-react"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { StatsOverview } from "@/components/dashboard/stats-overview"
import { ContentCalendar } from "@/components/dashboard/content-calendar"
import { RecentVideos } from "@/components/dashboard/recent-videos"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuth } from "@/lib/auth-context"
import { store } from "@/lib/store"
import { Button } from "@/components/ui/button"
import YouTubeConnect from "@/components/YouTubeConnect"
import VideoGenerateUpload from "@/components/VideoGenerateUpload"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [selectedChannel, setSelectedChannel] = useState("main-channel")
  const [channelsLoaded, setChannelsLoaded] = useState(false)

  useEffect(() => {
    if (!user?.id || !store) {
      setChannelsLoaded(true)
      return
    }

    try {
      const userChannels = store.getChannels(user.id)

      if (userChannels.length > 0) {
        setSelectedChannel(userChannels[0].id)
      }
    } catch (error) {
      console.error("Could not load user channels:", error)
    } finally {
      setChannelsLoaded(true)
    }
  }, [user])

  const freeRemaining = user
    ? Math.max(0, 10 - (user.freeVideosUsed || 0))
    : 0

  const paidCredits = user?.paidVideoCredits || 0
  const isPaid = user?.plan !== "free" || paidCredits > 0
  const isAdmin = user?.role === "admin"
  const showFreeLimit = !isAdmin && !isPaid && freeRemaining <= 3

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <DashboardHeader
          selectedChannel={selectedChannel}
          onChannelChange={setSelectedChannel}
        />

        <main className="mx-auto max-w-[1600px] space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Dashboard introduction */}
          <section className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Workspace / Dashboard</span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Your Content Dashboard
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Generate videos, manage your channels, and track your content
                  workflow from one place.
                </p>
              </div>

              {isAdmin ? (
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400">
                  <ShieldCheck className="h-4 w-4" />
                  Admin account
                </div>
              ) : (
                <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/70 px-4 py-2 text-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {user?.plan && user.plan !== "free"
                      ? `${user.plan.toUpperCase()} Plan`
                      : "Free Plan"}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Free plan usage warning */}
          {showFreeLimit && (
            <section
              className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                freeRemaining === 0
                  ? "border-red-500/30 bg-red-500/5"
                  : "border-amber-500/30 bg-amber-500/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  className={`mt-0.5 h-5 w-5 shrink-0 ${
                    freeRemaining === 0
                      ? "text-red-500"
                      : "text-amber-500"
                  }`}
                />

                <div>
                  <p className="font-semibold">
                    {freeRemaining === 0
                      ? "Free video limit reached"
                      : `${freeRemaining} free video${
                          freeRemaining === 1 ? "" : "s"
                        } remaining`}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Upgrade your plan to access additional video generation
                    credits.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => router.push("/upgrade")}
                className="shrink-0"
              >
                <Zap className="mr-2 h-4 w-4" />
                View Plans
              </Button>
            </section>
          )}

          {/* Paid plan credits */}
          {!isAdmin && isPaid && (
            <section className="flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Zap className="h-5 w-5 text-emerald-500" />
              </div>

              <div>
                <p className="font-semibold text-emerald-500">
                  {user?.plan && user.plan !== "free"
                    ? `${user.plan.toUpperCase()} Plan`
                    : "Video credits"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {paidCredits} paid video credit
                  {paidCredits === 1 ? "" : "s"} remaining
                </p>
              </div>
            </section>
          )}

          {/* Channel connection */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Channel connection
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your YouTube connection before publishing videos.
              </p>
            </div>

            <YouTubeConnect />
          </section>

          {/* Video generation */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Create content
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start generating and preparing your next video.
              </p>
            </div>

            <VideoGenerateUpload />
          </section>

          {/* Statistics */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Performance overview
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review your channel activity and video statistics.
              </p>
            </div>

            <StatsOverview channelId={selectedChannel} />
          </section>

          {/* Quick actions */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Quick actions
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Jump straight into your common tasks.
              </p>
            </div>

            <QuickActions />
          </section>

          {/* Calendar and recent videos */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Content activity
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                View your publishing schedule and recently created videos.
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="min-w-0 lg:col-span-2">
                <ContentCalendar channelId={selectedChannel} />
              </div>

              <div className="min-w-0">
                <RecentVideos channelId={selectedChannel} />
              </div>
            </div>
          </section>

          {!channelsLoaded && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Loading channel preferences...
            </p>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
