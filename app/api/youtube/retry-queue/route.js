// app/api/youtube/retry-queue/route.js
// Auto-retry queued YouTube uploads

import { NextResponse } from "next/server"
import { readdir, readFile, unlink } from "fs/promises"
import { existsSync, statSync, readFileSync } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)
const QUEUE_DIR = path.join(process.cwd(), "storage", "ready_to_upload")

async function getAccessToken() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/youtube/refresh-token`, { method: "POST" })
    if (res.ok) { const d = await res.json(); return d.accessToken || null }
  } catch {}
  return null
}

async function uploadVideo(videoPath, metadata, token) {
  const fileBuffer = readFileSync(videoPath)
  const fileSize   = fileBuffer.length
  const initRes    = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": fileSize.toString(),
      },
      body: JSON.stringify({
        snippet: { title: metadata.title || "Video", description: metadata.description || "", tags: metadata.tags || [], categoryId: "22" },
        status:  { privacyStatus: metadata.privacyStatus || "public", selfDeclaredMadeForKids: false },
      }),
    }
  )
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}))
    if (err?.error?.errors?.[0]?.reason === "uploadLimitExceeded") throw new Error("QUOTA_EXCEEDED")
    throw new Error(err?.error?.message || "Init failed: " + initRes.status)
  }
  const uploadUrl = initRes.headers.get("location")
  if (!uploadUrl) throw new Error("No upload URL")

  // Upload in chunks
  const CHUNK = 5 * 1024 * 1024
  let offset = 0, videoId = null
  while (offset < fileSize && !videoId) {
    const end   = Math.min(offset + CHUNK, fileSize)
    const chunk = fileBuffer.slice(offset, end)
    const res   = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Length": chunk.length.toString(), "Content-Range": `bytes ${offset}-${end-1}/${fileSize}`, "Content-Type": "video/mp4" },
      body: chunk, signal: AbortSignal.timeout(120000),
    })
    if (res.status === 200 || res.status === 201) { const d = await res.json(); videoId = d.id; break }
    if (res.status === 308) { const range = res.headers.get("Range"); offset = range ? parseInt(range.split("-")[1])+1 : end; continue }
    throw new Error("Upload failed: " + res.status)
  }
  if (!videoId) throw new Error("No video ID")
  return videoId
}

// GET — check queue
export async function GET() {
  try {
    if (!existsSync(QUEUE_DIR)) return NextResponse.json({ queued: 0, items: [] })
    const files = (await readdir(QUEUE_DIR)).filter(f => f.endsWith(".json"))
    const items = []
    for (const f of files) {
      try {
        const d = JSON.parse(await readFile(path.join(QUEUE_DIR, f), "utf8"))
        items.push({ file: f, title: d.metadata?.title, queuedAt: d.queuedAt, size: d.videoSize })
      } catch {}
    }
    return NextResponse.json({ queued: items.length, items })
  } catch(e) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}

// POST — process queue
export async function POST(req) {
  try {
    const { processAll = false } = await req.json().catch(() => ({}))
    if (!existsSync(QUEUE_DIR)) return NextResponse.json({ processed: 0, message: "Queue empty" })

    const files = (await readdir(QUEUE_DIR)).filter(f => f.endsWith(".json"))
    if (files.length === 0) return NextResponse.json({ processed: 0, message: "Queue empty" })
    console.log(`📋 Queue: ${files.length} videos`)

    const token = await getAccessToken()
    if (!token) return NextResponse.json({ error: "No YouTube token — reconnect YouTube" }, { status: 401 })

    // Quick quota check
    const check = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id&mine=true", { headers: { Authorization: `Bearer ${token}` } })
    if (!check.ok) {
      const err = await check.json().catch(() => ({}))
      if (JSON.stringify(err).includes("quota")) return NextResponse.json({ error: "YouTube quota still exceeded. Try tomorrow.", quotaExceeded: true }, { status: 429 })
    }

    const toProcess = processAll ? files : files.slice(0, 1)
    const results = []

    for (const file of toProcess) {
      const filePath = path.join(QUEUE_DIR, file)
      try {
        const queued = JSON.parse(await readFile(filePath, "utf8"))
        if (!existsSync(queued.videoPath)) {
          await unlink(filePath)
          results.push({ file, status: "skipped", reason: "file missing" })
          continue
        }
        console.log(`📤 Uploading: ${queued.metadata?.title}`)
        const videoId = await uploadVideo(queued.videoPath, queued.metadata, token)
        await unlink(filePath)
        results.push({ file, status: "uploaded", videoId, url: `https://youtube.com/watch?v=${videoId}` })
        console.log(`✅ Queued upload: ${videoId}`)
        if (toProcess.length > 1) await new Promise(r => setTimeout(r, 3000))
      } catch(e) {
        if (e.message === "QUOTA_EXCEEDED") { results.push({ file, status: "quota_exceeded" }); break }
        results.push({ file, status: "failed", reason: e.message })
        console.log(`❌ Failed (${file}): ${e.message}`)
      }
    }

    const uploaded  = results.filter(r => r.status === "uploaded").length
    const remaining = files.length - uploaded
    return NextResponse.json({ success: true, processed: uploaded, remaining, results })
  } catch(e) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
