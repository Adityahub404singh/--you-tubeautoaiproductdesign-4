"use client"
import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { store } from "@/lib/store"

export default function NewPromptPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [contentMode, setContentMode] = useState("daily-prompt")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const channels = store?.getChannels(user?.id)
      const channel = channels?.[0]

      const res = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prompt,
          language: channel?.language || "Hindi",
          channelName: channel?.name || "My Channel",
          category: channel?.category || "Tech"
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")

      // Save to store
      if (channel && user) {
        store?.createVideo({
          channelId: channel.id,
          title: data.title,
          status: "pending-approval",
          scheduledDate: new Date().toISOString(),
          views: 0, likes: 0, comments: 0,
          thumbnail: data.thumbnailUrl,
          topic: prompt,
        })
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader selectedChannel="main-channel" onChannelChange={() => {}} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Create New Content</h1>
            <p className="text-muted-foreground mt-1">Generate videos with AI automation</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Content Generation</CardTitle>
                <CardDescription>Choose your content creation mode and provide instructions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Content Mode</Label>
                  <RadioGroup value={contentMode} onValueChange={setContentMode}>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg">
                      <RadioGroupItem value="daily-prompt" id="daily-prompt" />
                      <div className="space-y-1">
                        <Label htmlFor="daily-prompt" className="cursor-pointer">Daily Prompt (Single Video)</Label>
                        <p className="text-sm text-muted-foreground">Create one video based on your daily topic</p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">Video Topic</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Example: Top 5 AI Tools in 2026 that every student should know"
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {result && (
                  <div className="space-y-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-500 font-medium">
                      <CheckCircle className="h-5 w-5" />
                      Video Generated Successfully!
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{result.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{result.hook}</p>
                    </div>
                    {result.thumbnailUrl && (
                      <img src={result.thumbnailUrl} alt="Thumbnail" className="rounded-lg w-full max-w-md" />
                    )}
                    <div>
                      <p className="text-sm font-medium mb-1">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.tags?.map((tag: string) => (
                          <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Video sent for admin approval. Check dashboard for status.</p>
                  </div>
                )}

                <div className="flex items-center gap-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <p className="text-sm">Video will be added to your content calendar after approval</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : "Generate Video"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
