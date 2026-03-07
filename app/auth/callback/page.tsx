"use client"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")
    
    if (error || !code) {
      router.push("/dashboard?youtube=denied")
      return
    }

    // API route ko call karo with code
    fetch(`/api/auth/callback?code=${code}&${searchParams.toString()}`)
      .then(r => {
        if (r.redirected) window.location.href = r.url
        else router.push("/dashboard?youtube=connected")
      })
      .catch(() => router.push("/dashboard?youtube=error"))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p className="text-lg">YouTube connect ho raha hai...</p>
      </div>
    </div>
  )
}
