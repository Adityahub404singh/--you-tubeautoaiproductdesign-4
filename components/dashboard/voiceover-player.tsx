"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square, Volume2, Mic } from "lucide-react"

interface VoiceoverPlayerProps {
  script: string
  title: string
}

export default function VoiceoverPlayer({ script, title }: VoiceoverPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = () => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(script.slice(0, 1000))
    utterance.lang = "hi-IN"
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setPlaying(true)
  }

  const pause = () => {
    window.speechSynthesis.pause()
    setPlaying(false)
  }

  const resume = () => {
    window.speechSynthesis.resume()
    setPlaying(true)
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    setPlaying(false)
  }

  if (!supported) return (
    <div className="p-3 bg-yellow-500/10 rounded-lg text-xs text-yellow-500">
      Browser voiceover supported nahi hai. Chrome use karein.
    </div>
  )

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Mic className="h-4 w-4 text-red-500" />
        <span className="text-sm font-semibold">AI Voiceover</span>
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">FREE</span>
      </div>

      <div className="flex items-center gap-2">
        {!playing ? (
          <Button onClick={speak} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
            <Play className="h-4 w-4 mr-2" />Play Script
          </Button>
        ) : (
          <>
            <Button onClick={pause} size="sm" variant="outline">
              <Pause className="h-4 w-4 mr-2" />Pause
            </Button>
            <Button onClick={resume} size="sm" variant="outline">
              <Play className="h-4 w-4 mr-2" />Resume
            </Button>
          </>
        )}
        <Button onClick={stop} size="sm" variant="ghost">
          <Square className="h-4 w-4 mr-2" />Stop
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        🎙️ Hindi/English voice • Browser built-in • No API needed
      </p>
    </div>
  )
}
