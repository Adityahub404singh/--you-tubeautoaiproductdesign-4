"use client"

import { AdminHeader } from "@/components/admin/admin-header"
import { AdminRoute } from "@/components/auth/admin-route"
import { PromptManager } from "@/components/admin/prompt-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PromptsPage() {
  const promptHistory = [
    {
      id: 1,
      date: "2024-12-18",
      successRate: "68%",
      avgViews: "12.4K",
      status: "active",
    },
    {
      id: 2,
      date: "2024-12-15",
      successRate: "62%",
      avgViews: "10.8K",
      status: "archived",
    },
    {
      id: 3,
      date: "2024-12-12",
      successRate: "71%",
      avgViews: "14.2K",
      status: "archived",
    },
  ]

  return (
    <AdminRoute>
      <div className="min-h-screen bg-background">
        <AdminHeader />

        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Prompt Management</h1>
              <p className="text-muted-foreground mt-1">Update AI prompts and track performance</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <PromptManager />
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Prompt History</CardTitle>
                    <CardDescription>Previous prompt versions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {promptHistory.map((prompt) => (
                        <div key={prompt.id} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{prompt.date}</span>
                            <Badge variant={prompt.status === "active" ? "default" : "secondary"}>
                              {prompt.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Success</p>
                              <p className="font-medium">{prompt.successRate}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Avg Views</p>
                              <p className="font-medium">{prompt.avgViews}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminRoute>
  )
}
