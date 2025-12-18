"use client"

import { AdminHeader } from "@/components/admin/admin-header"
import { AdminStats } from "@/components/admin/admin-stats"
import { RevenueChart } from "@/components/admin/revenue-chart"
import { UserGrowthChart } from "@/components/admin/user-growth-chart"
import { RecentUsers } from "@/components/admin/recent-users"
import { SystemHealth } from "@/components/admin/system-health"
import { AdminRoute } from "@/components/auth/admin-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Users, Video, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <AdminHeader />

        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">Monitor platform performance and user activity</p>
              </div>
              <Button asChild>
                <Link href="/admin/approvals">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Review Approvals
                </Link>
              </Button>
            </div>

            {/* Stats Overview */}
            <AdminStats />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
                    <Link href="/admin/approvals">
                      <CheckCircle className="h-6 w-6" />
                      <span className="text-sm">Approve Videos</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Manage Users</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                    <Video className="h-6 w-6" />
                    <span className="text-sm">Video Analytics</span>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent">
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-sm">Revenue Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <RevenueChart />
              <UserGrowthChart />
            </div>

            {/* Bottom Section */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RecentUsers />
              </div>
              <div>
                <SystemHealth />
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminRoute>
  )
}
