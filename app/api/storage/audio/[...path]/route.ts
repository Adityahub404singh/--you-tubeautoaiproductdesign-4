import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: filePath } = await params
    const fullPath = path.join(process.cwd(), "storage", "audio", ...filePath)
    if (!existsSync(fullPath)) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const file = await readFile(fullPath)
    return new NextResponse(file, { headers: { "Content-Type": "audio/mpeg" } })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}