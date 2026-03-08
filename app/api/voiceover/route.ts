import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const { text, title } = await req.json()
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 })

    const audioDir = path.join(process.cwd(), "storage", "audio")
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true })
    const fileName = `audio_${Date.now()}.mp3`
    const filePath = path.join(audioDir, fileName)

    // Google Translate TTS (FREE - no API key needed!)
    try {
      const encodedText = encodeURIComponent(text.slice(0, 200))
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=hi&client=tw-ob`
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
      })
      if (res.ok) {
        const buffer = await res.arrayBuffer()
        if (buffer.byteLength > 1000) {
          await writeFile(filePath, Buffer.from(buffer))
          console.log("✅ Google TTS success! Size:", buffer.byteLength)
          return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "google" })
        }
      }
    } catch (e) { console.log("Google TTS failed:", e) }

    // ElevenLabs try
    const elKey = process.env.ELEVENLABS_API_KEY
    if (elKey) {
      try {
        const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
          method: "POST",
          headers: { "xi-api-key": elKey, "Content-Type": "application/json", "Accept": "audio/mpeg" },
          body: JSON.stringify({ text: text.slice(0, 800), model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
        })
        if (res.ok) {
          const buffer = await res.arrayBuffer()
          await writeFile(filePath, Buffer.from(buffer))
          console.log("✅ ElevenLabs success!")
          return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "elevenlabs" })
        }
      } catch (e) { console.log("ElevenLabs failed") }
    }

    // Silent fallback
    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    const execAsync = promisify(exec)
    await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "${filePath}"`)
    console.log("⚠️ Silent audio fallback")
    return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "silent" })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
