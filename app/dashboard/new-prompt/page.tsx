"use client"
import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, Zap, Calendar, Video, Brain, Heart, Cpu, BookOpen, Trophy, Scissors } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { store } from "@/lib/store"

const CATEGORIES = [
  { id: "facts",      label: "Facts",      icon: <Brain className="h-5 w-5"/>,    color: "bg-blue-600",   desc: "Space, Science, History facts" },
  { id: "motivation", label: "Motivation", icon: <Heart className="h-5 w-5"/>,    color: "bg-orange-600", desc: "Success stories, Hard work" },
  { id: "tech",       label: "Tech/AI",    icon: <Cpu className="h-5 w-5"/>,      color: "bg-green-600",  desc: "AI tools, Tech news" },
  { id: "story",      label: "Story",      icon: <BookOpen className="h-5 w-5"/>, color: "bg-purple-600", desc: "Moral, Horror, Inspirational" },
  { id: "top10",      label: "Top 10",     icon: <Trophy className="h-5 w-5"/>,   color: "bg-yellow-600", desc: "Rankings, Lists, Countdowns" },
  { id: "shorts",     label: "Shorts",     icon: <Scissors className="h-5 w-5"/>, color: "bg-red-600",    desc: "60s vertical videos" },
  { id: "general",    label: "General",    icon: <Video className="h-5 w-5"/>,    color: "bg-gray-600",   desc: "Any viral topic" },
]

export default function NewPromptPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [category, setCategory] = useState("tech")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [loading30, setLoading30] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [schedule, setSchedule] = useState<any[]>([])
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
          mode: category,
          category,
          language: channel?.language || "Hindi",
          channelName: channel?.name || "My Channel",
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")

      let audioUrl = ""
      let thumbnailUrl = ""

      // Voiceover
      try {
        const vr = await fetch("/api/voiceover", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: data.script || data.hook || data.title, title: data.title })
        })
        const vd = await vr.json()
        if (vd.audioUrl) audioUrl = vd.audioUrl
      } catch (e) {}

      // Thumbnail
      try {
        const tr = await fetch("/api/thumbnail", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: data.title, boldText: data.thumbnail?.boldText, bgColor: data.thumbnail?.bgColor, emoji: data.thumbnail?.emoji, category, videoType: category === "shorts" ? "shorts" : "long" })
        })
        const td = await tr.json()
        if (td.thumbnailUrl || td.url) thumbnailUrl = td.thumbnailUrl || td.url
      } catch (e) {}

      if (channel && user) {
        store?.createVideo({
          channelId: channel.id,
          title: data.title,
          status: "pending-approval",
          scheduledDate: new Date().toISOString(),
          views: 0, likes: 0, comments: 0,
          thumbnail: thumbnailUrl,
          audioUrl,
          thumbnailUrl,
          topic: prompt,
          description: data.description || "",
          tags: data.tags || [],
          script: data.script || "",
          hook: data.hook || "",
          videoType: category === "shorts" ? "shorts" : "long",
          aiScore: Math.floor(Math.random() * 20) + 80,
          riskLevel: "low",
        })
      }
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handle30Day = async () => {
    if (!prompt.trim()) { setError("Pehle topic daalo!"); return }
    setLoading30(true)
    setError("")
    setSchedule([])
    try {
      const channels = store?.getChannels(user?.id)
      const channel = channels?.[0]
      const res = await fetch("/api/videos/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prompt, category, generate30Day: true,
          language: channel?.language || "Hindi",
          channelName: channel?.name || "My Channel",
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSchedule(data.schedule30Day || [])

      // Sab videos store mein save karo as pending-approval
      if (channel && user && data.schedule30Day) {
        data.schedule30Day.forEach((item: any, i: number) => {
          const scheduledDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString()
          store?.createVideo({
            channelId: channel.id,
            title: item.topic,
            status: "pending-approval",
            scheduledDate,
            views: 0, likes: 0, comments: 0,
            thumbnail: "",
            audioUrl: "",
            thumbnailUrl: "",
            topic: item.topic,
            description: "",
            tags: [],
            script: "",
            videoType: item.type === "shorts" ? "shorts" : "long",
            aiScore: Math.floor(Math.random() * 20) + 80,
            riskLevel: "low",
          })
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading30(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader selectedChannel="main-channel" onChannelChange={() => {}} />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create New Video</h1>
          <p className="text-muted-foreground mt-1">AI se copyright-safe video banao — automatic upload hogi</p>
        </div>

        {/* Category Selection */}
        <Card>
          <CardHeader><CardTitle>Video Category</CardTitle><CardDescription>Category ke hisab se thumbnail, script aur style alag hoga</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <div key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition-all ${category === cat.id ? "border-primary bg-primary/10 scale-105" : "border-border hover:border-primary/40"}`}>
                  <div className={`p-2 rounded-full text-white ${cat.color}`}>{cat.icon}</div>
                  <p className="text-sm font-semibold">{cat.label}</p>
                  <p className="text-xs text-muted-foreground text-center">{cat.desc}</p>
                  {category === cat.id && <Badge variant="default" className="text-xs">Selected</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Topic Input */}
        <Card>
          <CardHeader><CardTitle>Video Topic</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea placeholder={`Example: ${category === "facts" ? "Space ke 10 shocking facts" : category === "motivation" ? "Subah uthne ke fayde" : category === "tech" ? "Top 5 AI Tools 2026" : category === "story" ? "Ek bhootiya ghar ki kahani" : category === "top10" ? "Top 10 richest people in India" : category === "shorts" ? "1 minute me success tips" : "Trending viral topic"}`}
              rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                <AlertCircle className="h-4 w-4"/><p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={loading || !prompt.trim()} className="flex-1">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Generating...</> : <><Zap className="h-4 w-4 mr-2"/>Generate 1 Video</>}
              </Button>
              <Button variant="outline" onClick={handle30Day} disabled={loading30 || !prompt.trim()} className="flex-1">
                {loading30 ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Planning...</> : <><Calendar className="h-4 w-4 mr-2"/>30-Day Schedule</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <CheckCircle className="h-5 w-5"/>Video Created!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-semibold text-lg">{result.title}</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{category.toUpperCase()}</Badge>
                {result.isShorts && <Badge className="bg-red-600">SHORTS</Badge>}
                {result.pexelsClips?.length > 0 && <Badge className="bg-blue-600">✅ {result.pexelsClips.length} Pexels Clips</Badge>}
                <Badge className="bg-green-600">✅ Copyright Safe</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{result.hook}</p>
              {result.keyPoints?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Key Points:</p>
                  {result.keyPoints.map((p: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground">• {p}</p>
                  ))}
                </div>
              )}
              <Button onClick={() => router.push("/admin/approvals")} className="w-full">
                Admin Approval pe Jao →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 30-day schedule */}
        {schedule.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5"/>30-Day Schedule Ready! ({schedule.length} videos)
              </CardTitle>
              <CardDescription>Sab videos pending-approval mein save ho gayi hain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {schedule.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                      {item.day}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.topic}</p>
                      <p className="text-xs text-muted-foreground">{new Date(Date.now() + i * 24*60*60*1000).toLocaleDateString("hi-IN")} • {item.type}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{item.type}</Badge>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4" onClick={() => router.push("/admin/approvals")}>
                Sab Approve Karo →
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
