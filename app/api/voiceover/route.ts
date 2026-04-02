import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync, statSync } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
const execAsync = promisify(exec)

const VOICES: Record<string, any> = {
  facts:      { voice: "hi-IN-MadhurNeural", rate: "+10%", pitch: "+0Hz"  },
  motivation: { voice: "hi-IN-MadhurNeural", rate: "+5%",  pitch: "-3Hz"  },
  tech:       { voice: "hi-IN-MadhurNeural", rate: "+8%",  pitch: "+0Hz"  },
  story:      { voice: "hi-IN-SwaraNeural",  rate: "-20%", pitch: "-8Hz"  },
  top10:      { voice: "hi-IN-MadhurNeural", rate: "+15%", pitch: "+2Hz"  },
  shorts:     { voice: "hi-IN-SwaraNeural",  rate: "+18%", pitch: "+3Hz"  },
  horror:     { voice: "hi-IN-SwaraNeural",  rate: "-25%", pitch: "-15Hz" },
  general:    { voice: "hi-IN-MadhurNeural", rate: "+5%",  pitch: "+0Hz"  },
}

export async function POST(req: NextRequest) {
  try {
    const { text, category = "general", isShorts = false } = await req.json()
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 })

    const audioDir = path.join(process.cwd(), "storage", "audio")
    if (!existsSync(audioDir)) await mkdir(audioDir, { recursive: true })
    const fileName = "audio_" + Date.now() + ".mp3"
    const filePath = path.join(audioDir, fileName)

    const catKey = (category || "general").toLowerCase()
    const vc = VOICES[catKey] || VOICES.general

    const cleanedText = text
      .replace(/\[HOOK\]/gi,"").replace(/\[SETUP\]/gi,"").replace(/\[BUILDUP\]/gi,"")
      .replace(/\[PEAK\]/gi,"").replace(/\[ENDING\]/gi,"").replace(/\[CTA\]/gi,"")
      .replace(/\[PAUSE\]/gi,". ").replace(/\[EMPHASIS\]/gi,"")
      .replace(/\*\*/g,"").replace(/#{1,6}\s/g,"")
      .replace(/\n+/g,". ").replace(/\s+/g," ").trim()
      .slice(0, isShorts ? 200 : 400)

    console.log("Voice:", catKey, vc.voice, vc.rate)

    try {
      const safeText = cleanedText.replace(/"/g,"'").replace(/\\/g,"").replace(/\n/g," ")
      const pyFile = path.join(audioDir, "tts_" + Date.now() + ".py")
      const outPath = filePath.replace(/\\/g,"\\\\")
      const py = "import asyncio, edge_tts\nasync def go():\n    c = edge_tts.Communicate(text=\"" + safeText + "\", voice=\"" + vc.voice + "\", rate=\"" + vc.rate + "\", pitch=\"" + vc.pitch + "\")\n    await c.save(r\"" + outPath + "\")\n    import os\n    print(\"Done! Size:\", os.path.getsize(r\"" + outPath + "\"), \"bytes\")\nasyncio.run(go())"
      await writeFile(pyFile, py)
      const { stdout } = await execAsync("python \"" + pyFile + "\"", { timeout: 60000 })
      try { const fs = await import("fs/promises"); await fs.unlink(pyFile) } catch {}
      if (stdout.includes("Done!") && existsSync(filePath) && statSync(filePath).size > 1000) {
        console.log("Edge TTS OK!", stdout.trim())
        return NextResponse.json({ success: true, audioUrl: "/storage/audio/" + fileName, provider: "edge-tts" })
      }
    } catch(e: any) { console.log("Edge TTS err:", e.message?.slice(0,80)) }

    try {
      const encoded = encodeURIComponent(cleanedText.slice(0, 200))
      const res = await fetch("https://translate.google.com/translate_tts?ie=UTF-8&q=" + encoded + "&tl=hi&client=tw-ob&ttsspeed=0.85", {
        headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://translate.google.com/" },
        signal: AbortSignal.timeout(15000)
      })
      if (res.ok) {
        const buf = await res.arrayBuffer()
        if (buf.byteLength > 3000) {
          await writeFile(filePath, Buffer.from(buf))
          console.log("Google TTS OK!", buf.byteLength)
          return NextResponse.json({ success: true, audioUrl: "/storage/audio/" + fileName, provider: "google" })
        }
      }
    } catch {}

    await execAsync("ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame \"" + filePath + "\"")
    return NextResponse.json({ success: true, audioUrl: "/storage/audio/" + fileName, provider: "silent" })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}