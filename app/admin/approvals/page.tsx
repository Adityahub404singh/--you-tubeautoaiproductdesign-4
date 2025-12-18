"use client"

import { AdminHeader } from "@/components/admin/admin-header"
import { AdminRoute } from "@/components/auth/admin-route"
import { VideoApprovalList } from "@/components/admin/video-approval-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ApprovalsPage() {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <AdminHeader />

        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Video Approvals</h1>
              <p className="text-muted-foreground mt-1">Review and approve videos before they go live</p>
            </div>

            <Tabs defaultValue="pending" className="w-full">
              <TabsList>
                <TabsTrigger value="pending">Pending Approval</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6">
                <VideoApprovalList filter="pending" />
              </TabsContent>

              <TabsContent value="approved" className="mt-6">
                <VideoApprovalList filter="approved" />
              </TabsContent>

              <TabsContent value="rejected" className="mt-6">
                <VideoApprovalList filter="rejected" />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AdminRoute>
  )
}
