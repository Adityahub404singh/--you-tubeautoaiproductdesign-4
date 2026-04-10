import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const GRAPH = "https://graph.facebook.com/v19.0"

// ✅ UPGRADED: All categories including finance + health
const CAT_TAGS = {
  facts:      "#facts #factshindi #viral #trending #hindi #india #amazingfacts #rochaktathya #factcheck #didsyouknow",
  motivation: "#motivation #motivationhindi #viral #hindi #india #success #hustle #sandeepmaheswari #mindset #inspirational",
  tech:       "#tech #ai #technology #chatgpt #viral #hindi #india #techhindi #artificialintelligence #aitools",
  story:      "#story #storytime #hindi #viral #emotional #india #kahani #hindistory #truestory #emotional",
  top10:      "#top10 #viral #trending #hindi #india #countdown #top10hindi #amazing #facts #mustwatch",
  shorts:     "#shorts #viral #trending #hindi #india #reels #ytshorts #shortsvideo #viralshorts #explorepage",
  horror:     "#horror #scary #viral #hindi #india #horrornightmare #bhoot #darrkahani #horrorstory #creepy",
  finance:    "#finance #money #investment #hindi #india #personalfinance #stockmarket #paisa #wealthbuilding #financetips",
  health:     "#health #wellness #hindi #india #fitness #ayurveda #healthtips #yoga #healthyhindi #fitnessmotivation",
  general:    "#viral #trending #hindi #india #shorts #reels #explore #foryou #foryoupage #viralvideo",
}

// ✅ Wait for container with better error handling
async function waitForContainer(igUserId, containerId, token) {
  for (let i = 0; i < 30; i++) {   // 30 x 5s = 2.5 min max
    await new Promise(r => setTimeout(r, 5000))
    const res  = await fetch(`${GRAPH}/${containerId}?fields=status_code,status&access_token=${token}`)
    const data = await res.json()
    console.log("Container status:", data.status_code)
    if (data.status_code === "FINISHED") return true
    if (data.status_code === "ERROR" || data.status_code === "EXPIRED") {
      throw new Error(`Container failed: ${data.status || data.status_code}`)
    }
    // IN_PROGRESS — keep waiting
  }
  throw new Error("Container timeout after 2.5 minutes")
}

// ✅ Get video duration using ffprobe (to validate 3-90s Reels requirement)
async function getVideoDuration(videoPath) {
  try {
    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    const execAsync = promisify(exec)
    const FFPROBE = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffprobe.exe"
    const { stdout } = await execAsync(
      `"${FFPROBE}" -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`,
      { timeout: 10000 }
    )
    return parseFloat(stdout.trim()) || 0
  } catch {
    return 0 // If can't check, let Instagram decide
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies()
    const body        = await req.json()
    const token       = body.accessToken || cookieStore.get("ig_access_token")?.value
    const igUserId    = body.igAccountId || cookieStore.get("ig_user_id")?.value || process.env.INSTAGRAM_USER_ID

    if (!token)    return NextResponse.json({ error: "Instagram not connected" }, { status: 401 })
    if (!igUserId) return NextResponse.json({ error: "Instagram User ID missing" }, { status: 400 })

    const { videoUrl, caption, title, category, hashtags } = body
    if (!videoUrl) return NextResponse.json({ error: "videoUrl required" }, { status: 400 })

    // ✅ Validate Instagram Reels requirements: 3s min, 90s max, 9:16 aspect ratio
    const { existsSync } = await import("fs")
    const path = await import("path")
    const localPath = videoUrl.replace(/https?:\/\/[^\/]+/, "").replace("/storage/", "")
    const filePath  = path.join(process.cwd(), "storage", localPath)

    if (existsSync(filePath)) {
      const duration = await getVideoDuration(filePath)
      if (duration > 0) {
        console.log(`📹 Video duration: ${duration.toFixed(1)}s`)
        if (duration < 3) {
          console.log("⚠️ Video too short for Reels (min 3s), skipping Instagram")
          return NextResponse.json({ error: "Video too short for Reels (minimum 3 seconds)" }, { status: 400 })
        }
        if (duration > 90) {
          console.log(`⚠️ Video ${duration.toFixed(1)}s exceeds Reels max (90s), skipping Instagram`)
          return NextResponse.json({ error: `Video too long for Reels (${duration.toFixed(0)}s, max 90s)` }, { status: 400 })
        }
      }
    }

    // ✅ Build caption with category hashtags
    const catKey     = (category || "general").toLowerCase().replace(/\s+/g, "")
    const tags       = CAT_TAGS[catKey] || CAT_TAGS.general
    const extraTags  = (hashtags || []).slice(0, 5).map(t => t.startsWith("#") ? t : "#" + t).join(" ")
    const fullCaption = `${(caption || title || "Amazing content!").slice(0, 2000)}\n\n${tags}\n${extraTags}`.trim()

    // ✅ Build absolute URL (must be publicly accessible for Instagram)
    const absUrl = videoUrl.startsWith("http")
      ? videoUrl
      : `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000"}${videoUrl}`

    console.log("📸 Instagram upload:", igUserId, absUrl)

    // ✅ Create container — REELS with 9:16 aspect ratio
    const containerRes = await fetch(`${GRAPH}/${igUserId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type:    "REELS",
        video_url:     absUrl,
        caption:       fullCaption,
        access_token:  token,
        share_to_feed: true,
        // ✅ Reels specific — tells Instagram this is 9:16 vertical
        thumb_offset:  "1000",
      }),
    })

    const container = await containerRes.json()
    if (container.error) {
      console.error("Container create error:", container.error)
      throw new Error(container.error.message || "Container creation failed")
    }
    console.log("Container:", container.id)

    // ✅ Wait for processing
    await waitForContainer(igUserId, container.id, token)

    // ✅ Publish
    const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creation_id: container.id, access_token: token }),
    })

    const published = await publishRes.json()
    if (published.error) {
      console.error("Publish error:", published.error)
      throw new Error(published.error.message || "Publish failed")
    }

    console.log("✅ Instagram published! ID:", published.id)
    return NextResponse.json({
      success:      true,
      postId:       published.id,
      instagramUrl: `https://www.instagram.com/reel/${published.id}/`,  // ✅ /reel/ not /p/ for Reels
    })

  } catch (err) {
    console.error("Instagram error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}