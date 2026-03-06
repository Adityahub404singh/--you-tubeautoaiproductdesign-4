"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { store, type User, getFreeVideosRemaining, getVideosUsed } from "@/lib/store"

export function RecentUsers() {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (store) {
      const allUsers = store.getUsers().filter((u) => u.role !== "admin")
      // Sort by created date, most recent first
      const sorted = allUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setUsers(sorted.slice(0, 10))
    }
  }, [])

  const getTimeSince = (date: string) => {
    const now = new Date()
    const created = new Date(date)
    const diffMs = now.getTime() - created.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const isActive = (lastActive: string) => {
    const now = new Date()
    const last = new Date(lastActive)
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Users</CardTitle>
        <CardDescription>Latest user signups and activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No users yet</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.name}</p>
                    <Badge variant={user.plan === "agency" ? "default" : user.plan === "pro" ? "secondary" : "outline"}>
                      {user.plan}
                    </Badge>
                    {!isActive(user.lastActive) && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{user.email}</span>
                    <span>{getVideosUsed(user)} videos</span>
                    <span>Joined {getTimeSince(user.createdAt)}</span>
                    {getFreeVideosRemaining(user) > 0 && (
                      <span className="text-accent">{getFreeVideosRemaining(user)} free remaining</span>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                    <DropdownMenuItem>Change Plan</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Suspend Account</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
