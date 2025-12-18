"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, RefreshCw, Settings, Calendar } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Manage your content automation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/new-prompt">
              <Plus className="h-4 w-4 mr-2" />
              New Prompt
            </Link>
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Calendar
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/calendar">
              <Calendar className="h-4 w-4 mr-2" />
              View Full Calendar
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/channels">
              <Settings className="h-4 w-4 mr-2" />
              Channel Settings
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
