import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const segments = resolvedParams.path || []
    const filePath = path.join(process.cwd(), "storage", "audio", ...segments)
    if (!existsSync(filePath)) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const file = await readFile(filePath)
    return new NextResponse(file, { headers: { "Content-Type": "audio/mpeg" } })
  } catch (e) {
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}