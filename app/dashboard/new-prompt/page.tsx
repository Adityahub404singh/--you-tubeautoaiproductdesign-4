"use client"
// app/dashboard/new-prompt/page.tsx
import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Loader2, CheckCircle, AlertCircle, Zap, Calendar,
  Video, Brain, Heart, Cpu, BookOpen, Trophy, Scissors,
  Mic, Eye, Music, Sparkles, ChevronRight
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { store } from "@/lib/store"

const CATEGORIES = [
  { id: "facts",      label: "Facts",      icon: <Brain className="h-5 w-5"/>,    color: "bg-blue-600",   border: "border-blue-500",   desc: "Space, Science, History", voiceStyle: "Energetic + Fast",      voiceSpeed: "1.1x",  scriptHook: "Kya tum jaante ho ki...", examplePrompts: ["Space ke 5 shocking facts","Human body ka secret","Ancient Egypt mystery"], emoji: "🧠" },
  { id: "motivation", label: "Motivation", icon: <Heart className="h-5 w-5"/>,    color: "bg-orange-600", border: "border-orange-500", desc: "Success, Hard work",    voiceStyle: "Powerful + Confident",  voiceSpeed: "1.0x",  scriptHook: "Agar tum ruk gaye...",    examplePrompts: ["Subah uthne ke fayde","Success ka secret","Never give up story"],     emoji: "💪" },
  { id: "tech",       label: "Tech/AI",    icon: <Cpu className="h-5 w-5"/>,      color: "bg-green-600",  border: "border-green-500",  desc: "AI tools, Tech news",   voiceStyle: "Clear + Professional",  voiceSpeed: "1.05x", scriptHook: "Ye AI sab badal dega...", examplePrompts: ["Top 5 AI Tools 2026","ChatGPT vs Claude","Future of AI in India"],    emoji: "🤖" },
  { id: "story",      label: "Story",      icon: <BookOpen className="h-5 w-5"/>, color: "bg-purple-600", border: "border-purple-500", desc: "Horror, Mystery, Moral", voiceStyle: "Deep + Whisper",        voiceSpeed: "0.85x", scriptHook: "Kal raat jo hua...",      examplePrompts: ["Haunted school story","Ghost mirror horror","Mysterious forest night"], emoji: "👁️" },
  { id: "top10",      label: "Top 10",     icon: <Trophy className="h-5 w-5"/>,   color: "bg-yellow-600", border: "border-yellow-500", desc: "Rankings, Lists",       voiceStyle: "Energetic + Countdown", voiceSpeed: "1.1x",  scriptHook: "Number 1 pe koi nahi socha...", examplePrompts: ["Top 10 richest Indians","Top 10 AI tools 2026","Top 10 scary places"], emoji: "🏆" },
  { id: "shorts",     label: "Shorts",     icon: <Scissors className="h-5 w-5"/>, color: "bg-red-600",    border: "border-red-500",    desc: "60s vertical videos",   voiceStyle: "Fast + High Energy",    voiceSpeed: "1.15x", scriptHook: "Wait for it...",          examplePrompts: ["1 minute success tip","Quick life hack","Shocking 30 second fact"],   emoji: "⚡" },
  { id: "general",    label: "General",    icon: <Video className="h-5 w-5"/>,    color: "bg-gray-600",   border: "border-gray-500",   desc: "Any viral topic",       voiceStyle: "Balanced + Clear",      voiceSpeed: "1.0x",  scriptHook: "Ye jaanna zaroori hai...",examplePrompts: ["Viral topic today","Trending news India","Interesting world facts"],   emoji: "🔥" },
]

const STEPS = [
  { id: "script",    label: "Script Writing",   icon: <Brain className="h-4 w-4"/> },
  { id: "voice",     label: "Voice Generation", icon: <Mic className="h-4 w-4"/>   },
  { id: "thumbnail", label: "Thumbnail Design", icon: <Eye className="h-4 w-4"/>   },
  { id: "video",     label: "Video Assembly",   icon: <Video className="h-4 w-4"/> },
]

export default function NewPromptPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [category, setCategory]         = useState("tech")
  const [prompt, setPrompt]             = useState("")
  const [loading, setLoading]           = useState(false)
  const [loading30, setLoading30]       = useState(false)
  const [result, setResult]             = useState<any>(null)
  const [schedule, setSchedule]         = useState<any[]>([])
  const [error, setError]               = useState("")
  const [currentStep, setCurrentStep]   = useState("")
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const selectedCat = CATEGORIES.find(c => c.id === category) || CATEGORIES[0]

  const markStep = (step: string) => {
    setCurrentStep(step)
    setCompletedSteps(prev => [...prev, step])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    setCompletedSteps([])

    try {
      const channels = store?.getChannels(user?.id)
      const channel  = channels?.[0]

      // Step 1: Script
      setCurrentStep("script")
      const res  = await fetch("/api/videos/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: prompt, mode: category, category, language: channel?.language || "Hindi", channelName: channel?.name || "My Channel" })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Script generation failed")
      markStep("script")

      // Step 2: Voice
      setCurrentStep("voice")
      let audioUrl = ""
      try {
        const vr = await fetch("/api/voiceover", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: data.script || data.hook || data.title, title: data.title, category, isShorts: category === "shorts" })
        })
        const vd = await vr.json()
        if (vd.audioUrl) audioUrl = vd.audioUrl
      } catch {}
      markStep("voice")

      // Step 3: Thumbnail
      setCurrentStep("thumbnail")
      let thumbnailUrl = ""
      try {
        const tr = await fetch("/api/thumbnail", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: data.title, topic: prompt, boldText: data.thumbnail?.boldText, bgColor: data.thumbnail?.bgColor, emoji: data.thumbnail?.emoji || selectedCat.emoji, category, videoType: category === "shorts" ? "shorts" : "long" })
        })
        const td = await tr.json()
        if (td.thumbnailUrl || td.url) thumbnailUrl = td.thumbnailUrl || td.url
      } catch {}
      markStep("thumbnail")

      // Step 4: Video
      setCurrentStep("video")
      let videoUrl = ""
      if (audioUrl) {
        try {
          const vgr = await fetch("/api/video/generate", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioUrl, thumbnailUrl, title: data.title, script: data.script, hook: data.hook, keyPoints: data.keyPoints, videoType: category === "shorts" ? "shorts" : "long", category })
          })
          const vgd = await vgr.json()
          if (vgd.videoUrl) videoUrl = vgd.videoUrl
        } catch {}
      }
      markStep("video")

      // Save to store — aiScore is handled by store.createVideo internally
      if (channel && user) {
        store?.createVideo({
          channelId:     channel.id,
          title:         data.title,
          status:        "pending-approval",
          scheduledDate: new Date().toISOString(),
          views: 0, likes: 0, comments: 0,
          thumbnail:     thumbnailUrl,
          audioUrl,
          thumbnailUrl,
          videoUrl,
          topic:         prompt,
          description:   data.description || "",
          tags:          data.tags || [],
          script:        data.script || "",
          hook:          data.hook || "",
          videoType:     category === "shorts" ? "shorts" : "long",
        })
      }

      setResult({ ...data, audioUrl, thumbnailUrl, videoUrl })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setCurrentStep("")
    }
  }

  const handle30Day = async () => {
    if (!prompt.trim()) { setError("Pehle topic daalo!"); return }
    setLoading30(true)
    setError("")
    setSchedule([])
    try {
      const channels = store?.getChannels(user?.id)
      const channel  = channels?.[0]
      const res = await fetch("/api/videos/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: prompt, category, generate30Day: true, language: channel?.language || "Hindi", channelName: channel?.name || "My Channel" })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSchedule(data.schedule30Day || [])

      if (channel && user && data.schedule30Day) {
        data.schedule30Day.forEach((item: any, i: number) => {
          store?.createVideo({
            channelId:     channel.id,
            title:         item.topic,
            status:        "pending-approval",
            scheduledDate: new Date(Date.now() + i * 86400000).toISOString(),
            views: 0, likes: 0, comments: 0,
            thumbnail: "", audioUrl: "", thumbnailUrl: "", videoUrl: "",
            topic:     item.topic,
            description: "", tags: [], script: "",
            hook:      item.hook || "",
            videoType: item.type === "shorts" ? "shorts" : "long",
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

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create New Video</h1>
            <p className="text-muted-foreground mt-1">AI se cinematic copyright-safe video → auto upload 🚀</p>
          </div>
          <Badge variant="outline" className="hidden sm:flex items-center gap-1">
            <Sparkles className="h-3 w-3"/> Pro System
          </Badge>
        </div>

        {/* Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Video Category</CardTitle>
            <CardDescription>Category se script style, voice emotion aur visual mood decide hota hai</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <div key={cat.id} onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${category === cat.id ? `${cat.border} bg-primary/10 scale-105 shadow-lg` : "border-border hover:border-primary/40"}`}>
                  <div className={`p-2 rounded-full text-white ${cat.color}`}>{cat.icon}</div>
                  <p className="text-sm font-semibold">{cat.label}</p>
                  <p className="text-xs text-muted-foreground text-center leading-tight">{cat.desc}</p>
                  {category === cat.id && <Badge variant="default" className="text-xs px-2">✓ Selected</Badge>}
                </div>
              ))}
            </div>

            {/* Selected category info */}
            <div className={`mt-4 p-3 rounded-lg border ${selectedCat.border} bg-primary/5`}>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Mic className="h-3.5 w-3.5 text-muted-foreground"/>
                  <span className="text-muted-foreground">Voice:</span>
                  <span className="font-medium">{selectedCat.voiceStyle}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Music className="h-3.5 w-3.5 text-muted-foreground"/>
                  <span className="text-muted-foreground">Speed:</span>
                  <span className="font-medium">{selectedCat.voiceSpeed}</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Topic Input */}
        <Card>
          <CardHeader>
            <CardTitle>Video Topic</CardTitle>
            <CardDescription>Short topic likho — AI poora script banayega</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={`Example: ${selectedCat.examplePrompts[0]}`}
              rows={3} value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="resize-none"
            />

            {/* Quick examples */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center">Quick:</span>
              {selectedCat.examplePrompts.map((ex, i) => (
                <button key={i} type="button" onClick={() => setPrompt(ex)}
                  className="text-xs px-2 py-1 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  {ex}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                <AlertCircle className="h-4 w-4 flex-shrink-0"/>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Progress steps */}
            {loading && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                {STEPS.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${completedSteps.includes(step.id) ? "bg-green-500 text-white" : currentStep === step.id ? "bg-primary text-white animate-pulse" : "bg-muted text-muted-foreground"}`}>
                      {completedSteps.includes(step.id) ? <CheckCircle className="h-3.5 w-3.5"/> : currentStep === step.id ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : step.icon}
                    </div>
                    <span className={`text-sm ${completedSteps.includes(step.id) ? "text-green-500" : currentStep === step.id ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      {step.label}{currentStep === step.id && "..."}{completedSteps.includes(step.id) && " ✓"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={loading || !prompt.trim()} className="flex-1">
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Generating...</> : <><Zap className="h-4 w-4 mr-2"/>Generate Video</>}
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
                <CheckCircle className="h-5 w-5"/>Video Ready! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.thumbnailUrl && (
                <img src={result.thumbnailUrl} alt="Thumbnail" className="w-full max-w-sm rounded-lg border"/>
              )}
              <p className="font-semibold text-lg">{result.title}</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{category.toUpperCase()}</Badge>
                {category === "shorts" && <Badge className="bg-red-600">SHORTS ⚡</Badge>}
                <Badge className="bg-green-600">✅ Copyright Safe</Badge>
                {result.audioUrl && <Badge className="bg-blue-600">🎤 Voice Ready</Badge>}
                {result.videoUrl && <Badge className="bg-purple-600">🎬 Video Ready</Badge>}
              </div>
              {result.hook && (
                <div className="p-3 bg-background/50 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Hook:</p>
                  <p className="text-sm italic">"{result.hook}"</p>
                </div>
              )}
              {result.keyPoints?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Script Points:</p>
                  {result.keyPoints.slice(0, 5).map((p: string, i: number) => (
                    <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5"/>{p}
                    </p>
                  ))}
                </div>
              )}
              {result.audioUrl && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Voice Preview:</p>
                  <audio controls src={result.audioUrl} className="w-full h-10"/>
                </div>
              )}
              <Button onClick={() => router.push("/admin/approvals")} className="w-full">
                Review & Approve →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 30-day schedule */}
        {schedule.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5"/>30-Day Schedule! ({schedule.length} videos)
              </CardTitle>
              <CardDescription>Sab videos pending-approval mein save hain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {schedule.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold flex-shrink-0">{item.day}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.topic}</p>
                      <p className="text-xs text-muted-foreground">{new Date(Date.now() + i * 86400000).toLocaleDateString("hi-IN")} • {item.type}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">{item.type === "shorts" ? "⚡" : "🎬"}</Badge>
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
