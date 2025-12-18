"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Video, Eye, Clock } from "lucide-react"
import { store } from "@/lib/store"

interface StatsOverviewProps {
  channelId: string
}

export function StatsOverview({ channelId }: StatsOverviewProps) {
  const [stats, setStats] = useState({
    videosThisMonth: 0,
    totalViews: 0,
    watchTime: 0,
    avgEngagement: 0,
  })

  useEffect(() => {
    if (store && channelId) {
      const videos = store.getVideos(channelId)
      const liveVideos = videos.filter((v) => v.status === "live")

      const totalViews = liveVideos.reduce((sum, v) => sum + v.views, 0)
      const totalLikes = liveVideos.reduce((sum, v) => sum + v.likes, 0)
      const avgEngagement = liveVideos.length > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : 0

      setStats({
        videosThisMonth: videos.length,
        totalViews,
        watchTime: Math.floor(totalViews * 0.08), // Estimate: 0.08 hrs per view
        avgEngagement: Number(avgEngagement),
      })
    }
  }, [channelId])

  const statsData = [
    {
      title: "Videos This Month",
      value: stats.videosThisMonth.toString(),
      change: "+3 from last month",
      icon: Video,
      trend: "up",
    },
    {
      title: "Total Views",
      value: stats.totalViews > 1000 ? `${(stats.totalViews / 1000).toFixed(1)}K` : stats.totalViews.toString(),
      change: "+12.5% from last month",
      icon: Eye,
      trend: "up",
    },
    {
      title: "Watch Time",
      value: `${stats.watchTime} hrs`,
      change: "+8.2% from last month",
      icon: Clock,
      trend: "up",
    },
    {
      title: "Avg. Engagement",
      value: `${stats.avgEngagement}%`,
      change: "+0.5% from last month",
      icon: TrendingUp,
      trend: "up",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
