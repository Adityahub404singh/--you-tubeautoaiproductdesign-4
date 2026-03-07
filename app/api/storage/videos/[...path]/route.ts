import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: filePath } = await params
    const fullPath = path.join(process.cwd(), "storage", "videos", ...filePath)
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
    const file = await readFile(fullPath)
    return new NextResponse(file, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": file.length.toString(),
        "Accept-Ranges": "bytes",
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}