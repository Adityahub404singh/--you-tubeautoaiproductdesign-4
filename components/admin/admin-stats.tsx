"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, Video, TrendingUp, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { store } from "@/lib/store"

export function AdminStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    pendingApprovals: 0,
    totalVideos: 0,
    videoRevenue: 0,
    youtubeRevenue: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    if (store) {
      const adminStats = store.getAdminStats()
      setStats(adminStats)
    }
  }, [])

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toString(),
      change: `${stats.activeToday} active today`,
      icon: Users,
      trend: "up",
    },
    {
      title: "Video Revenue",
      value: `$${stats.videoRevenue.toFixed(2)}`,
      change: "Pay-per-video earnings",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "YouTube 10% Share",
      value: `$${stats.youtubeRevenue.toFixed(2)}`,
      change: "Lifetime revenue share",
      icon: TrendingUp,
      trend: "up",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      change: "Combined earnings",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals.toString(),
      change: "Videos awaiting review",
      icon: Clock,
      trend: stats.pendingApprovals > 20 ? "warning" : "normal",
    },
    {
      title: "Total Videos",
      value: stats.totalVideos.toString(),
      change: "All time generated",
      icon: Video,
      trend: "up",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs mt-1 ${stat.trend === "warning" ? "text-yellow-500" : "text-muted-foreground"}`}>
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
