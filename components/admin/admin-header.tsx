"use client"

import { Button } from "@/components/ui/button"
import { Youtube, Settings, LogOut, LayoutDashboard, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { store } from "@/lib/store"

export function AdminHeader() {
  const { logout } = useAuth()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (store) {
      const stats = store.getAdminStats()
      setPendingCount(stats.pendingApprovals)
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <Youtube className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">YouTubeAuto.ai</span>
              <span className="text-xs text-muted-foreground ml-2 px-2 py-1 bg-primary/10 rounded">ADMIN</span>
            </Link>

            <nav className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="relative">
                <Link href="/admin/approvals">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approvals
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">
                      {pendingCount}
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">User Dashboard</Link>
              </Button>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
