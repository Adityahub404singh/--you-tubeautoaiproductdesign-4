import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const { text, title } = await req.json()
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 })

    const apiKey = process.env.ELEVENLABS_API_KEY
    
    // ElevenLabs try karo
    if (apiKey && !apiKey.includes("xxxx")) {
      try {
        const voiceId = "21m00Tcm4TlvDq8ikWAM"
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: { "xi-api-key": apiKey, "Content-Type": "application/json", "Accept": "audio/mpeg" },
          body: JSON.stringify({
            text: text.slice(0, 800),
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          })
        })
        if (res.ok) {
          const buffer = await res.arrayBuffer()
          const audioDir = path.join(process.cwd(), "storage", "audio")
          if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true })
          const fileName = `audio_${Date.now()}.mp3`
          await writeFile(path.join(audioDir, fileName), Buffer.from(buffer))
          return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "elevenlabs" })
        }
      } catch (e) { console.log("ElevenLabs failed, trying Groq TTS...") }
    }

    // Groq TTS fallback
    try {
      const groqKey = process.env.GROQ_API_KEY
      if (groqKey) {
        const res = await fetch("https://api.groq.com/openai/v1/audio/speech", {
          method: "POST",
          headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "playai-tts-arabic", voice: "Fritz-PlayAI", input: text.slice(0, 800), response_format: "mp3" })
        })
        if (res.ok) {
          const buffer = await res.arrayBuffer()
          const audioDir = path.join(process.cwd(), "storage", "audio")
          if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true })
          const fileName = `audio_${Date.now()}.mp3`
          await writeFile(path.join(audioDir, fileName), Buffer.from(buffer))
          return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "groq" })
        }
      }
    } catch (e) { console.log("Groq TTS failed too") }

    // Last fallback - dummy silent audio (FFmpeg handle kar lega)
    const audioDir = path.join(process.cwd(), "storage", "audio")
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true })
    
    // 60 second silent MP3 banao FFmpeg se
    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    const execAsync = promisify(exec)
    const fileName = `audio_${Date.now()}.mp3`
    const filePath = path.join(audioDir, fileName)
    await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "${filePath}"`)
    
    return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "silent" })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 })
  }
}
