import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { existsSync, createReadStream } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)
const GRAPH   = "https://graph.facebook.com/v19.0"
const FFMPEG  = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe"
const FFPROBE = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffprobe.exe"

const CAT_TAGS = {
  psychology:      "#psychology #mentalhealth #mindset #hindi #india #viral #shorts #brain #psychologyfacts #darkpsychology",
  stoicism:        "#stoicism #philosophy #mindset #hindi #india #viral #motivation #discipline #wisdom #stoic",
  quotes:          "#quotes #motivation #hindi #india #viral #inspiration #quotesoftheday #positivity #mindset #shorts",
  businesslessons: "#business #entrepreneur #startup #hindi #india #viral #money #success #motivation #investing",
  storytelling:    "#story #emotional #hindi #india #kahani #reels #viral #shorts #feelings #desi",
  startupstories:  "#startup #entrepreneur #success #hindi #india #viral #business #tech #founder #hustle",
  luxury:          "#luxury #lifestyle #rich #hindi #india #viral #wealth #premium #expensive #exclusive",
  history:         "#history #india #facts #hindi #viral #itihas #interesting #knowledge #education #shorts",
  pov:             "#pov #viral #hindi #india #reels #shorts #ai #scifi #future #immersive",
  horror:          "#horror #scary #bhoot #hindi #india #horrorreels #viral #shorts #creepy #ghost",
  ainews:          "#ai #technology #tech #hindi #india #viral #chatgpt #future #news #trending",
  motivation:      "#motivation #success #mindset #hindi #india #viral #inspiration #hustle #believe #goals",
  facts:           "#facts #amazingfacts #hindi #india #viral #knowledge #shorts #interesting #didyouknow #science",
  general:         "#viral #trending #india #reels #foryoupage #hindi #shorts #explore #desi #content",
}

async function getVideoDuration(input) {
  try {
    const { stdout } = await execAsync(`"${FFPROBE}" -v error -show_entries format=duration -of csv=p=0 "${input}"`, { timeout: 15000 })
    return parseFloat(stdout.trim()) || 0
  } catch { return 30 }
}

async function encodeForInstagram(inputPath, outputPath, maxDur) {
  const duration = await getVideoDuration(inputPath)
  const trimDur  = Math.min(duration || 60, maxDur)
  console.log("Encoding for Instagram: " + trimDur.toFixed(1) + "s")
  try {
    await execAsync(
      `"${FFMPEG}" -y -i "${inputPath}" -t ${trimDur} ` +
      `-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30" ` +
      `-c:v libx264 -profile:v baseline -level:v 3.1 ` +
      `-pix_fmt yuv420p -b:v 3500k -maxrate 3500k -bufsize 7000k ` +
      `-bf 0 -g 30 -keyint_min 30 -sc_threshold 0 ` +
      `-c:a aac -ar 44100 -ac 2 -b:a 128k -movflags +faststart ` +
      `"${outputPath}"`,
      { timeout: 300000 }
    )
    if (existsSync(outputPath)) return { path: outputPath, duration: await getVideoDuration(outputPath) }
  } catch(e) { console.log("IG Encode err:", e.message.slice(0, 80)) }
  return null
}

async function waitForContainer(containerId, token) {
  console.log("Waiting for container: " + containerId)
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 5000))
    try {
      const res  = await fetch(`${GRAPH}/${containerId}?fields=status_code,status&access_token=${token}`, { signal: AbortSignal.timeout(10000) })
      const data = await res.json()
      if (data.status_code === "FINISHED") return true
      if (data.status_code === "ERROR") throw new Error("Instagram processing failed: " + (data.status || "error"))
    } catch(e) {
      if (e.message.includes("Instagram processing failed")) throw e
    }
  }
  throw new Error("Container timeout after 200s")
}

async function uploadToCloudinary(filePath, videoId) {
  const { v2: cloudinary } = await import("cloudinary")
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "video", public_id: "youtubeauto/ig_" + videoId, overwrite: true, timeout: 600000 },
      (error, result) => {
        if (error) return reject(new Error("Cloudinary Error: " + error.message))
        if (!result?.secure_url) return reject(new Error("Cloudinary: no URL returned"))
        resolve(result.secure_url)
      }
    )
    createReadStream(filePath).pipe(stream)
  })
}

export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const body        = await req.json()
    const token       = body.accessToken || cookieStore.get("ig_access_token")?.value
    const igUserId    = body.igAccountId || cookieStore.get("ig_user_id")?.value || process.env.INSTAGRAM_USER_ID
    console.log("DEBUG: token exists:", !!token, "| igUserId:", !!igUserId)

    if (!token)    return NextResponse.json({ error: "Instagram not connected." }, { status: 401 })
    if (!igUserId) return NextResponse.json({ error: "Instagram User ID missing." }, { status: 400 })

    const rawUrl = body.cloudUrl || body.videoUrl || ""
    const { caption, category, videoId, title } = body
    if (!rawUrl) return NextResponse.json({ error: "videoUrl required" }, { status: 400 })

    const storageDir = path.join(process.cwd(), "storage")
    const igVid      = String(videoId || Date.now()).replace(/[^a-z0-9_]/gi, "_")
    const tempDir    = path.join(storageDir, "temp")
    const { mkdirSync } = await import("fs")
    mkdirSync(tempDir, { recursive: true })
    const outPath = path.join(tempDir, "ig_final_" + igVid + ".mp4")

    let encoded   = null
    let publicUrl = null

    if (rawUrl.includes("cloudinary.com")) {
      publicUrl = rawUrl
    } else {
      const localPart = rawUrl.replace(/^\/storage\//, "").replace(/https?:\/\/[^\/]+\/storage\//, "")
      const filePath  = path.join(storageDir, localPart)
      if (!existsSync(filePath)) return NextResponse.json({ error: "File not found: " + filePath }, { status: 404 })
      encoded = await encodeForInstagram(filePath, outPath, 59)
    }

    if (!encoded && !publicUrl) return NextResponse.json({ error: "Video encoding failed" }, { status: 500 })

    if (encoded && !publicUrl) {
      console.log("Uploading Instagram trim to Cloudinary...")
      publicUrl = await uploadToCloudinary(encoded.path, igVid)
    }

    const catKey   = (category || "general").toLowerCase().replace(/[^a-z]/g, "")
    const tags     = CAT_TAGS[catKey] || CAT_TAGS.general
    const finalCap = (caption || title || "Amazing content").slice(0, 2000) + "\n\n" + tags

    const containerRes = await fetch(`${GRAPH}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_type: "REELS", video_url: publicUrl, caption: finalCap, share_to_feed: true, access_token: token }),
      signal: AbortSignal.timeout(30000),
    })

    const container = await containerRes.json()
    if (container.error) throw new Error(`Instagram API Error: ${container.error.message}`)

    await waitForContainer(container.id, token)

    let published = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creation_id: container.id, access_token: token }),
        })
        published = await publishRes.json()
        if (published.id) break
      } catch(e) {
        if (attempt === 3) throw e
        await new Promise(r => setTimeout(r, 3000))
      }
    }

    try {
      const { unlink } = await import("fs/promises")
      if (existsSync(outPath)) await unlink(outPath)
      console.log("🧹 Temp cleaned")
    } catch {}

    return NextResponse.json({
      success: true,
      postId: published?.id,
      url: "https://www.instagram.com/reel/" + published?.id + "/",
    })

  } catch(err) {
    console.error("Instagram error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
