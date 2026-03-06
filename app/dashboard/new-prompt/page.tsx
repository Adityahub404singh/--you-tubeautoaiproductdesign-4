"use client"
import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ThumbnailPreview } from "@/components/dashboard/thumbnail-preview"
import { Calendar, Loader2, CheckCircle, AlertCircle, Volume2, Video, FileText, Presentation } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { store } from "@/lib/store"

export default function NewPromptPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [contentMode, setContentMode] = useState("daily-prompt")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const contentModes = [
    {
      id: "daily-prompt",
      icon: <FileText className="h-5 w-5" />,
      title: "Daily Prompt (Single Video)",
      desc: "Create one video based on your daily topic"
    },
    {
      id: "slide-video",
      icon: <Presentation className="h-5 w-5" />,
      title: "Slide Video",
      desc: "Create a video with slides and voiceover"
    },
    {
      id: "shorts",
      icon: <Video className="h-5 w-5" />,
      title: "YouTube Shorts",
      desc: "Create a 60-second short video script"
    },
    {
      id: "series",
      icon: <Calendar className="h-5 w-5" />,
      title: "Video Series (5 Videos)",
      desc: "Create a 5-part video series on a topic"
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    setAudioUrl(null)

    try {
      const channels = store?.getChannels(user?.id)
      const channel = channels?.[0]

      const res = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prompt,
          mode: contentMode,
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

  const handleGenerateVoice = async () => {
    if (!result?.script) return
    setVoiceLoading(true)
    setError("")
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: result.script })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Voice generation failed")

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))],
        { type: "audio/mpeg" }
      )
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVoiceLoading(false)
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

                {/* Content Mode Selection */}
                <div className="space-y-3">
                  <Label>Content Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {contentModes.map((mode) => (
                      <div
                        key={mode.id}
                        onClick={() => setContentMode(mode.id)}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          contentMode === mode.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className={contentMode === mode.id ? "text-primary" : "text-muted-foreground"}>
                          {mode.icon}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{mode.title}</p>
                          <p className="text-xs text-muted-foreground">{mode.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                        <p className="text-sm font-medium mb-2">??? AI Thumbnail (Copyright-Free):</p>
                        <ThumbnailPreview
                          boldText={result.thumbnail.boldText}
                          bgColor={result.thumbnail.bgColor}
                          emoji={result.thumbnail.emoji}
                          title={result.title}
                        />
                      </div>
                    )}

                    {/* Voice Section */}
                    <div className="p-3 bg-background rounded-lg border space-y-3">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-primary" />
                        AI Voiceover (ElevenLabs)
                      </p>
                      {!audioUrl ? (
                        <Button type="button" variant="outline" size="sm" onClick={handleGenerateVoice} disabled={voiceLoading}>
                          {voiceLoading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating Voice...</>
                          ) : (
                            <><Volume2 className="h-4 w-4 mr-2" />Generate Voiceover</>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-green-500">? Voice generated!</p>
                          <audio controls className="w-full" src={audioUrl}>
                            Your browser does not support audio.
                          </audio>
                        </div>
                      )}
                    </div>

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
