import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // dataUrl save karo
    if (body.dataUrl && body.videoId) {
      const base64 = body.dataUrl.replace(/^data:image\/\w+;base64,/, "")
      const buffer = Buffer.from(base64, "base64")
      const dir = path.join(process.cwd(), "storage", "thumbnails")
      if (!existsSync(dir)) await mkdir(dir, { recursive: true })
      const filename = `thumb_${body.videoId}.jpg`
      const filepath = path.join(dir, filename)
      await writeFile(filepath, buffer)
      return NextResponse.json({ success: true, url: `/storage/thumbnails/${filename}` })
    }

    return NextResponse.json({ error: "dataUrl required" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}