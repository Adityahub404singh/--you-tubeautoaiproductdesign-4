// app/api/voiceover/route.ts - FIXED rates
import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts"

// Rate: how fast (+% = faster, -% = slower)
const VOICE_CONFIG: Record<string, any> = {
  facts:      { voice: "hi-IN-MadhurNeural", rate: "+12%", pitch: "+2Hz",  desc: "Facts — confident male"     },
  motivation: { voice: "hi-IN-MadhurNeural", rate: "+8%",  pitch: "+0Hz",  desc: "Motivation — powerful male" },
  tech:       { voice: "hi-IN-MadhurNeural", rate: "+15%", pitch: "+1Hz",  desc: "Tech — fast energetic"      },
  story:      { voice: "hi-IN-SwaraNeural",  rate: "+15%", pitch: "+0Hz",  desc: "Story — clear female"       },
  top10:      { voice: "hi-IN-MadhurNeural", rate: "+15%", pitch: "+3Hz",  desc: "Top10 — exciting countdown" },
  shorts:     { voice: "hi-IN-SwaraNeural",  rate: "+20%", pitch: "+5Hz",  desc: "Shorts — fast hype female"  },
  horror:     { voice: "hi-IN-SwaraNeural",  rate: "+15%", pitch: "-5Hz",  desc: "Horror — clear with depth"  },
  finance:    { voice: "hi-IN-MadhurNeural", rate: "+8%",  pitch: "+0Hz",  desc: "Finance — clear serious"    },
  health:     { voice: "hi-IN-SwaraNeural",  rate: "+10%", pitch: "+2Hz",  desc: "Health — warm female"       },
  general:    { voice: "hi-IN-MadhurNeural", rate: "+10%", pitch: "+0Hz",  desc: "General — balanced"         },
  typography: { voice: "hi-IN-SwaraNeural",  rate: "+15%", pitch: "+2Hz",  desc: "Typography — clear fast"    },
}

async function translateToHindi(text: string): Promise<string> {
  if (!text || text.length < 3) return text
  const hindiRatio = (text.match(/[\u0900-\u097F]/g) || []).length / (text.replace(/\s/g, "").length || 1)
  if (hindiRatio > 0.25) return text
  try {
    const chunks: string[] = text.match(/.{1,400}/g) || [text]
    const results: string[] = []
    for (const chunk of chunks) {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q=${encodeURIComponent(chunk)}`
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) })
      if (!res.ok) { results.push(chunk); continue }
      const data = await res.json()
      const translated = (data[0] || []).map((d: any) => d?.[0] || "").join("")
      results.push(translated || chunk)
    }
    return results.join(" ")
  } catch { return text }
}

function cleanForTTS(text: string): string {
  return text
    .replace(/\[HOOK[^\]]*\]/gi, "").replace(/\[SETUP[^\]]*\]/gi, "")
    .replace(/\[BUILDUP[^\]]*\]/gi, "").replace(/\[PEAK[^\]]*\]/gi, "")
    .replace(/\[ENDING[^\]]*\]/gi, "").replace(/\[CTA[^\]]*\]/gi, "")
    .replace(/\[EMPHASIS[^\]]*\]/gi, "").replace(/\[PAUSE\]/gi, ". ")
    .replace(/\[.*?\]/gi, "").replace(/\*\*/g, "").replace(/\*/g, "")
    .replace(/#{1,6}\s/g, "").replace(/`/g, "")
    .replace(/\u2014/g, ", ").replace(/\u2013/g, ", ")
    .replace(/\u2018|\u2019/g, "").replace(/\u201C|\u201D/g, "")
    .replace(/[^\x20-\x7E\u0900-\u097F\u0964\u0965\n.!?,;: ]/g, " ")
    .replace(/\n+/g, ". ").replace(/\.{2,}/g, ".").replace(/\s+/g, " ").trim()
}

export async function POST(req: NextRequest) {
  try {
    const { text, category = "general", isShorts = false, translateHindi = true } = await req.json()
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 })

    const audioDir = path.join(process.cwd(), "storage", "audio")
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true })

    const ts = Date.now()
    const fileName = `audio_${ts}.mp3`
    const filePath = path.join(audioDir, fileName)

    const catKey = (category || "general").toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "")
    const config = VOICE_CONFIG[catKey] || VOICE_CONFIG.general
    const maxLen = isShorts ? 450 : 3500

    let processedText = text
    if (translateHindi) {
      console.log("Translating to Hindi...")
      processedText = await translateToHindi(text)
      console.log(`Translated: "${processedText.slice(0, 80)}..."`)
    }

    const cleanedText = cleanForTTS(processedText).slice(0, maxLen)
    console.log(`Voice: ${catKey} | ${config.voice} | Rate:${config.rate} | Pitch:${config.pitch}`)
    console.log(`Text (${cleanedText.length}): "${cleanedText.slice(0, 100)}..."`)

    // Primary: MS Edge TTS
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
            console.log(`Edge TTS OK! ${(buffer.length / 1024).toFixed(0)}KB | ${config.desc}`)
            resolve()
          } else { reject(new Error("Audio too small: " + buffer.length)) }
        })
        readable.audioStream.on("error", reject)
        setTimeout(() => reject(new Error("TTS timeout")), 90000)
      })
      return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "msedge-tts", voice: config.voice, category: catKey, translated: translateHindi && processedText !== text })
    } catch (e: any) { console.log("msedge-tts failed:", e.message) }

    // Fallback: Google TTS
    try {
      const shortText = cleanedText.slice(0, 200)
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(shortText)}&tl=hi&client=tw-ob`
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }, signal: AbortSignal.timeout(15000) })
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer())
        if (buffer.length > 1000) {
          await writeFile(filePath, buffer)
          console.log(`Google TTS fallback! ${(buffer.length / 1024).toFixed(0)}KB`)
          return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "google-translate-tts", translated: translateHindi })
        }
      }
    } catch (e: any) { console.log("Google TTS failed:", e.message) }

    // Fallback: Silent audio
    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    const execAsync = promisify(exec)
    const FFMPEG = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe"
    await execAsync(`"${FFMPEG}" -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "${filePath}"`, { timeout: 15000 })
    console.log("Silent audio fallback")
    return NextResponse.json({ success: true, audioUrl: `/storage/audio/${fileName}`, provider: "silent", warning: "All TTS failed" })

  } catch (error: any) {
    console.error("Voice error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
