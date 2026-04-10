import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"

const VOICE_CONFIG: Record<string, any> = {
  facts:      { voice: "hi-IN-MadhurNeural", rate: "+10%", pitch: "+2Hz"  },
  motivation: { voice: "hi-IN-MadhurNeural", rate: "+3%",  pitch: "-2Hz"  },
  tech:       { voice: "hi-IN-MadhurNeural", rate: "+8%",  pitch: "+0Hz"  },
  story:      { voice: "hi-IN-SwaraNeural",  rate: "-15%", pitch: "-5Hz"  },
  top10:      { voice: "hi-IN-MadhurNeural", rate: "+10%", pitch: "+3Hz"  },
  shorts:     { voice: "hi-IN-SwaraNeural",  rate: "+15%", pitch: "+3Hz"  },
  horror:     { voice: "hi-IN-SwaraNeural",  rate: "-22%", pitch: "-10Hz" },
  finance:    { voice: "hi-IN-MadhurNeural", rate: "+5%",  pitch: "+1Hz"  },
  health:     { voice: "hi-IN-SwaraNeural",  rate: "+4%",  pitch: "+2Hz"  },
  general:    { voice: "hi-IN-MadhurNeural", rate: "+6%",  pitch: "+0Hz"  },
}

function cleanForTTS(text: string): string {
  return text
    .replace(/\[HOOK[^\]]*\]/gi, "")
    .replace(/\[SETUP[^\]]*\]/gi, "")
    .replace(/\[BUILDUP[^\]]*\]/gi, "")
    .replace(/\[PEAK[^\]]*\]/gi, "")
    .replace(/\[ENDING[^\]]*\]/gi, "")
    .replace(/\[CTA[^\]]*\]/gi, "")
    .replace(/\[EMPHASIS[^\]]*\]/gi, "")
    .replace(/\[PAUSE\]/gi, ". ")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/`/g, "")
    .replace(/\u2014/g, ", ")
    .replace(/\u2013/g, ", ")
    .replace(/\u2018/g, "")
    .replace(/\u2019/g, "")
    .replace(/\u201C/g, "")
    .replace(/\u201D/g, "")
    .replace(/[^\x20-\x7E\u0900-\u097F\u0964\u0965\n.!?,;: ]/g, " ")
    .replace(/\n+/g, ". ")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const { text, category = "general", isShorts = false } = await req.json()
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 })

    const audioDir = path.join(process.cwd(), "storage", "audio")
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true })

    const ts = Date.now()
    const fileName = `audio_${ts}.mp3`
    const filePath = path.join(audioDir, fileName)

    const catKey = (category || "general").toLowerCase().replace(/\s+/g, "")
    const config = VOICE_CONFIG[catKey] || VOICE_CONFIG.general
    const maxLen = isShorts ? 350 : 2500
    const cleanedText = cleanForTTS(text).slice(0, maxLen)

    console.log(`Voice: ${catKey} | ${config.voice} | Rate:${config.rate} | Pitch:${config.pitch}`)
    console.log(`Text: "${cleanedText.slice(0, 80)}..."`)

    // Try msedge-tts
    try {
      const tts = new MsEdgeTTS()
      await tts.setMetadata(config.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
      const readable = tts.toStream(cleanedText)
      const chunks: Buffer[] = []
      await new Promise<void>((resolve, reject) => {
        readable.audioStream.on("data", (chunk: Buffer) => chunks.push(chunk))
        readable.audioStream.on("end", async () => {
          const buffer = Buffer.concat(chunks)
          if (buffer.length > 5000) {
            await writeFile(filePath, buffer)
            console.log(`Edge TTS OK! Size: ${buffer.length} bytes`)
            resolve()
          } else {
            reject(new Error("Audio too small: " + buffer.length))
          }
        })
        readable.audioStream.on("error", reject)
        setTimeout(() => reject(new Error("TTS timeout")), 60000)
      })
      return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "msedge-tts", voice: config.voice })
    } catch(e: any) { console.log("msedge-tts failed:", e.message) }

    // Fallback: Google Translate TTS
    try {
      const encodedText = encodeURIComponent(cleanedText.slice(0, 200))
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=hi&client=tw-ob`
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(15000)
      })
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer())
        if (buffer.length > 1000) {
          await writeFile(filePath, buffer)
          console.log(`Google TTS fallback! Size: ${buffer.length}`)
          return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "google-translate" })
        }
      }
    } catch(e: any) { console.log("Google TTS failed:", e.message) }

    // Silent fallback
    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    const execAsync = promisify(exec)
    const FFMPEG = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe"
    await execAsync(`"${FFMPEG}" -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "${filePath}"`)
    return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "silent" })

  } catch (error: any) {
    console.error("Voice error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
