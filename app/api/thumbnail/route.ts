import { NextRequest, NextResponse } from "next/server"
import { mkdir } from "fs/promises"
import { existsSync } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)
const FFMPEG = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe"

const THEMES: Record<string, any> = {
  psychology:      { bg:"0a0015", accent:"8B5CF6" },
  stoicism:        { bg:"1a1a1a", accent:"9E9E9E" },
  quotes:          { bg:"1a0a00", accent:"FFC107" },
  businesslessons: { bg:"001a0a", accent:"2196F3" },
  storytelling:    { bg:"1a0005", accent:"E53935" },
  startupstories:  { bg:"001020", accent:"00BCD4" },
  luxury:          { bg:"0a0800", accent:"FFD700" },
  history:         { bg:"100800", accent:"C08552" },
  pov:             { bg:"000a1a", accent:"00FFFF" },
  horror:          { bg:"0a0000", accent:"FF0000" },
  ainews:          { bg:"000a20", accent:"0057FF" },
  motivation:      { bg:"0a0500", accent:"FF6B00" },
  general:         { bg:"050010", accent:"FF4081" },
}

function safe(t: string, max = 22): string {
  return (t || "").replace(/['"\\<>|@#]/g, "").replace(/[^\x20-\x7E]/g, "").slice(0, max).trim()
}

export async function POST(req: NextRequest) {
  try {
    const { title, boldText, category, videoType } = await req.json()
    const isShorts = videoType === "shorts"
    const W = isShorts ? 1080 : 1280
    const H = isShorts ? 1920 : 720

    const thumbDir = path.join(process.cwd(), "storage", "thumbnails")
    if (!existsSync(thumbDir)) await mkdir(thumbDir, { recursive: true })

    const fileName = `thumb_${Date.now()}.jpg`
    const filePath = path.join(thumbDir, fileName)

    const catKey = (category || "general").toLowerCase().replace(/[^a-z]/g, "")
    const theme = THEMES[catKey] || THEMES.general

    const line1 = safe((boldText || title || "VIRAL").toUpperCase().split(/\s+/).slice(0, 3).join(" "), 20)
    const line2 = safe((title || "").toUpperCase().split(/\s+/).slice(3, 7).join(" "), 26)
    const cy = Math.round(H / 2)
    const cx = Math.round(W / 2)
    const fs1 = isShorts ? 100 : 76
    const fs2 = isShorts ? 60 : 44
    const y1 = cy - (isShorts ? 120 : 80)
    const y2 = cy + (isShorts ? 40 : 25)

    const fontFile = path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Bold.ttf")
    const farg = existsSync(fontFile) ? `fontfile='${fontFile.replace(/\\/g,"/").replace(/:/g,"\\:")}':` : ""

    const f = [
      `color=c=0x${theme.bg}:s=${W}x${H}[bg]`,
      `[bg]drawbox=x=0:y=0:w=${Math.round(W*0.013)}:h=${H}:color=0x${theme.accent}:t=fill[b2]`,
      `[b2]drawbox=x=${cx-200}:y=${y1-30}:w=400:h=${isShorts?300:220}:color=0x${theme.accent}@0.12:t=fill[b3]`,
      `[b3]drawtext=${farg}fontsize=${fs1}:fontcolor=white:text='${line1}':x=(w-text_w)/2:y=${y1}:shadowcolor=black:shadowx=4:shadowy=4[t1]`,
      line2 ? `[t1]drawtext=${farg}fontsize=${fs2}:fontcolor=0x${theme.accent}:text='${line2}':x=(w-text_w)/2:y=${y2}:shadowcolor=black:shadowx=2:shadowy=2[out]` : `[t1]copy[out]`,
    ].join(";")

    try {
      await execAsync(`"${FFMPEG}" -y -f lavfi -i nullsrc=s=${W}x${H} -filter_complex "${f}" -map "[out]" -vframes 1 -q:v 2 "${filePath}"`, { timeout: 25000 })
    } catch {
      await execAsync(`"${FFMPEG}" -y -f lavfi -i "color=c=0x${theme.bg}:s=${W}x${H}" -vf "drawtext=fontsize=${fs1}:fontcolor=white:text='${line1}':x=(w-text_w)/2:y=(h-text_h)/2" -vframes 1 -q:v 2 "${filePath}"`, { timeout: 15000 })
    }

    return NextResponse.json({
      success: true,
      thumbnailUrl: `/storage/thumbnails/${fileName}`,
      url: `/storage/thumbnails/${fileName}`,
    })
  } catch (error: any) {
    console.error("Thumbnail error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
