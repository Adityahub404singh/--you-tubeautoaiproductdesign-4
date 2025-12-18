"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { youtubeAuth } from "@/lib/youtube-auth"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const success = youtubeAuth?.handleCallback(hash)
      if (success) {
        router.push("/dashboard/channels?connected=true")
      } else {
        router.push("/dashboard/channels?error=auth_failed")
      }
    } else {
      router.push("/dashboard/channels")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Connecting your YouTube account...</p>
      </div>
    </div>
  )
}
