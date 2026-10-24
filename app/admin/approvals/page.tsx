"use client"

import { AdminHeader } from "@/components/admin/admin-header"
import { AdminRoute } from "@/components/auth/admin-route"
import { VideoApprovalList } from "@/components/admin/video-approval-list"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function ApprovalsPage() {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <AdminHeader />

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
          <header>
            <h1 className="text-3xl font-bold">Video Approvals</h1>
            <p className="mt-2 text-muted-foreground">
              Har video ka thumbnail aur actual video review karo.
              Admin approval ke bina publishing nahi honi chahiye.
            </p>
          </header>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending Approval
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <VideoApprovalList filter="pending" />
            </TabsContent>

            <TabsContent value="approved">
              <VideoApprovalList filter="approved" />
            </TabsContent>

            <TabsContent value="rejected">
              <VideoApprovalList filter="rejected" />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AdminRoute>
  )
}
