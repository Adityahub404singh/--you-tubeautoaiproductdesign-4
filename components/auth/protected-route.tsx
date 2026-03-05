"use client"
import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

const FREE_ROUTES = ["/dashboard", "/dashboard/settings", "/dashboard/channels", "/upgrade", "/onboarding"]
const PAID_ONLY_ROUTES = ["/dashboard/new-prompt", "/dashboard/calendar", "/dashboard/billing"]

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!user) { router.push("/login"); return }

    // Free users: freeVideosUsed >= 10 aur no paid credits = upgrade pe bhejo
    const isPayingUser = user.plan !== "free" || user.paidVideoCredits > 0
    const hasFreeVideos = user.freeVideosUsed < 10
    const canAccess = isPayingUser || hasFreeVideos || user.role === "admin"

    if (!canAccess && PAID_ONLY_ROUTES.some(r => pathname.startsWith(r))) {
      router.push("/upgrade")
    }
  }, [user, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null
  return <>{children}</>
}
