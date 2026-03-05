"use client"
import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar, Loader2, CheckCircle, AlertCircle, Tag } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { store } from "@/lib/store"

function ThumbnailCanvas({ boldText, bgColor, emoji, title }: { boldText: string, bgColor: string, emoji: string, title: string }) {
  return (
    <div
      className="w-full max-w-md rounded-xl overflow-hidden relative"
      style={{ backgroundColor: bgColor, aspectRatio: "16/9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div style={{ fontSize: "60px", marginBottom: "10px" }}>{emoji}</div>
      <div style={{ fontSize: "28px", fontWeight: "900", color: "white", textAlign: "center", textShadow: "2px 2px 4px rgba(0,0,0,0.8)", lineHeight: 1.2 }}>
        {boldText}
      </div>
      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: "8px", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
        {title?.slice(0, 50)}
      </div>
      <div style={{ position: "absolute", bottom: "8px", right: "10px", background: "rgba(0,0,0,0.6)", color: "white", fontSize: "11px", padding: "2px 6px", borderRadius: "4px" }}>
        YouTubeAuto.ai
      </div>
    </div>
  )
}

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

      if (channel && user) {
        store?.createVideo({
          channelId: channel.id,
          title: data.title,
          status: "pending-approval",
          scheduledDate: new Date().toISOString(),
          views: 0, likes: 0, comments: 0,
          thumbnail: data.thumbnail?.boldText || "",
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
                      <p className="text-sm text-muted-foreground mt-1 italic">Hook: {result.hook}</p>
                    </div>

                    {result.thumbnail && (
                      <div>
                        <p className="text-sm font-medium mb-2">??? AI Generated Thumbnail (Copyright-Free):</p>
                        <ThumbnailCanvas
                          boldText={result.thumbnail.boldText}
                          bgColor={result.thumbnail.bgColor}
                          emoji={result.thumbnail.emoji}
                          title={result.title}
                        />
                      </div>
                    )}

                    {result.chapters && result.chapters.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">?? Chapters:</p>
                        <div className="space-y-1">
                          {result.chapters.map((ch: string, i: number) => (
                            <p key={i} className="text-xs text-muted-foreground">{ch}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium mb-1">??? SEO Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.tags?.map((tag: string) => (
                          <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1">?? Description Preview:</p>
                      <p className="text-xs text-muted-foreground bg-background p-2 rounded border">{result.description?.slice(0, 200)}...</p>
                    </div>

                    <p className="text-sm text-muted-foreground">? Video sent for admin approval. Check dashboard for status.</p>
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
