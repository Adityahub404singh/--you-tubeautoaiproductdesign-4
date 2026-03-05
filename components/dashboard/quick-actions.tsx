"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, RefreshCw, Settings, Calendar, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function QuickActions() {
  const { user } = useAuth()
  const router = useRouter()

  const canCreateVideo = () => {
    if (!user) return false
    if (user.role === "admin") return true
    if (user.plan !== "free") return true
    if ((user.paidVideoCredits || 0) > 0) return true
    if ((user.freeVideosUsed || 0) < 10) return true
    return false
  }

  const handleNewPrompt = () => {
    if (canCreateVideo()) {
      router.push("/dashboard/new-prompt")
    } else {
      router.push("/upgrade")
    }
  }

  const allowed = canCreateVideo()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Manage your content automation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleNewPrompt} className="relative">
            {allowed
              ? <Plus className="h-4 w-4 mr-2" />
              : <Lock className="h-4 w-4 mr-2" />
            }
            {allowed ? "New Prompt" : "Upgrade to Create"}
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
        {!allowed && (
          <p className="text-sm text-muted-foreground mt-3">
            Free limit reached (10/10 videos used). <Link href="/upgrade" className="text-primary underline">Upgrade now</Link> to create more videos.
          </p>
        )}
      </CardContent>
    </Card>
  )
}