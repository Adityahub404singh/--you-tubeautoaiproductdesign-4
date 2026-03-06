"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, Loader2, Mic } from "lucide-react"

interface VoiceoverPlayerProps {
  script: string
  title: string
}

export default function VoiceoverPlayer({ script, title }: VoiceoverPlayerProps) {
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const generateVoice = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: script.slice(0, 800), title })
      })
      const data = await res.json()
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl)
      } else {
        setError(data.error || "Generation failed")
      }
    } catch (e) {
      setError("Network error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Mic className="h-4 w-4 text-red-500" />
        <span className="text-sm font-semibold">AI Voiceover</span>
        <span className="text-xs text-muted-foreground">(ElevenLabs)</span>
      </div>
      {!audioUrl ? (
        <Button onClick={generateVoice} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white" size="sm">
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Volume2 className="h-4 w-4 mr-2" />Generate Voiceover</>}
        </Button>
      ) : (
        <div className="space-y-2">
          <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} className="hidden" />
          <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
            <Button size="sm" variant="ghost" onClick={togglePlay} className="h-8 w-8 p-0 rounded-full bg-red-600 hover:bg-red-700">
              {playing ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
            </Button>
            <span className="text-xs text-muted-foreground flex-1">Script Preview (first 30 sec)</span>
            <a href={audioUrl} download={`${title}-voiceover.mp3`} className="text-xs text-blue-400 hover:underline">Download</a>
          </div>
          <Button onClick={generateVoice} disabled={loading} variant="outline" size="sm" className="w-full text-xs">Regenerate</Button>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <p className="text-xs text-muted-foreground">🎙️ AI voice Hindi/English • Download MP3</p>
    </div>
  )
}
