import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, readFile } from "fs/promises"
import { existsSync, statSync } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
const execAsync = promisify(exec)

function processScriptForVoice(text: string, isShorts: boolean): string {
  let processed = text
    .replace(/\[PAUSE\]/g, ". ")
    .replace(/\[EMPHASIS\]/g, "")
    .replace(/\[SPEED_UP\]/g, "")
    .replace(/\[SLOW_DOWN\]/g, ". ")
    .replace(/\*\*/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\n+/g, ". ")
    .replace(/[।!]{2,}/g, "! ")
    .replace(/\s+/g, " ")
    .trim()

  // Shorts ke liye short karo
  if (isShorts) return processed.slice(0, 250)
  return processed.slice(0, 450)
}

async function googleTTS(text: string, lang: string, filePath: string): Promise<boolean> {
  const speeds = [0.85, 0.9, 0.8]
  
  for (const speed of speeds) {
    try {
      const encoded = encodeURIComponent(text.slice(0, 200))
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob&ttsspeed=${speed}`
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/",
          "Accept": "audio/mpeg, audio/*, */*",
          "Accept-Language": "hi-IN,hi;q=0.9,en;q=0.8"
        },
        signal: AbortSignal.timeout(15000)
      })
      if (res.ok) {
        const buffer = await res.arrayBuffer()
        if (buffer.byteLength > 3000) {
          await writeFile(filePath, Buffer.from(buffer))
          console.log(`✅ Google TTS! Lang:${lang} Speed:${speed} Size:${buffer.byteLength}`)
          return true
        }
      }
    } catch(e) { continue }
  }
  return false
}

async function generateSilentAudio(filePath: string, duration: number = 60): Promise<void> {
  await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration} -q:a 9 -acodec libmp3lame "${filePath}"`)
}

export async function POST(req: NextRequest) {
  try {
    const { text, title, isShorts = false } = await req.json()
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 })

    const audioDir = path.join(process.cwd(), "storage", "audio")
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true })
    const fileName = `audio_${Date.now()}.mp3`
    const filePath = path.join(audioDir, fileName)

    const processedText = processScriptForVoice(text, isShorts)
    console.log("Processing voice for:", processedText.slice(0, 80) + "...")

    // 1. Hindi TTS try karo
    const hiSuccess = await googleTTS(processedText, "hi", filePath)
    if (hiSuccess) {
      return NextResponse.json({ 
        success: true, 
        audioUrl: `/storage/audio/${fileName}`, 
        provider: "google-hi",
        size: statSync(filePath).size
      })
    }

    // 2. Hindi-India try karo
    const hiInSuccess = await googleTTS(processedText, "hi-IN", filePath)
    if (hiInSuccess) {
      return NextResponse.json({ 
        success: true, 
        audioUrl: `/storage/audio/${fileName}`, 
        provider: "google-hi-IN",
        size: statSync(filePath).size
      })
    }

    // 3. OpenAI TTS fallback
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${openaiKey}`, 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ 
            model: "tts-1", 
            voice: "onyx",
            input: processedText.slice(0, 4096), 
            speed: isShorts ? 1.1 : 0.9
          }),
          signal: AbortSignal.timeout(30000)
        })
        if (res.ok) {
          const buffer = await res.arrayBuffer()
          await writeFile(filePath, Buffer.from(buffer))
          console.log("✅ OpenAI TTS success!")
          return NextResponse.json({ 
            success: true, 
            audioUrl: `/storage/audio/${fileName}`, 
            provider: "openai",
            size: buffer.byteLength
          })
        }
      } catch(e) { console.log("OpenAI TTS failed") }
    }

    // 4. Silent fallback
    await generateSilentAudio(filePath, isShorts ? 60 : 180)
    console.log("⚠️ Silent fallback used")
    return NextResponse.json({ 
      success: true, 
      audioUrl: `/storage/audio/${fileName}`, 
      provider: "silent" 
    })

  } catch (error: any) {
    console.error("Voiceover error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
