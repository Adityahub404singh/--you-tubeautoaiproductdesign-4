import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, copyFile, readdir, unlink } from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";
const execAsync = promisify(exec);

const FFMPEG  = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe";
const FFPROBE = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffprobe.exe";

const CATEGORY_QUERIES = {
  facts:      [["space galaxy cosmos","nebula stars universe"],["science laboratory","chemistry experiment"],["ancient ruins archaeology","lost civilization"],["deep ocean underwater","marine life"],["natural disaster volcano","earthquake"]],
  motivation: [["athlete running champion","sports victory"],["entrepreneur business","startup success"],["mountain climbing adventure","summit peak"],["sunrise nature powerful","energy"],["celebration achievement award","trophy winner"]],
  tech:       [["artificial intelligence robot","futuristic android"],["cyberpunk neon city","digital future"],["data center servers","cloud computing"],["virtual reality augmented","vr headset"],["electric vehicle future","autonomous car"]],
  story:      [["dark mysterious forest","night shadows"],["dramatic storm lightning","rain thunder"],["old library detective","mystery noir"],["desert lighthouse alone","journey"],["campfire nature peaceful","stars night"]],
  top10:      [["luxury mansion interior","modern villa"],["world landmarks famous","iconic places"],["fine dining restaurant","gourmet food"],["fashion jewelry luxury","designer"],["sports stadium crowd","championship"]],
  shorts:     [["dance viral trending","tiktok energy"],["skateboard parkour urban","extreme sport"],["neon art graffiti","street art colorful"],["gaming esports setup","controller"],["life hack diy creative","tutorial"]],
  horror:     [["haunted house dark","scary abandoned"],["ghost shadow mystery","paranormal"],["cemetery night fog","grave"],["horror mask scary","halloween dark"],["dark laboratory experiment","creepy"]],
  finance:    [["stock market trading","financial chart"],["gold money wealth","coins dollar"],["real estate property","luxury building"],["business meeting corporate","professional"],["factory industry production","manufacturing"]],
  health:     [["yoga meditation peaceful","mindfulness zen"],["healthy food nutrition","vegetables fruits"],["fitness gym workout","exercise training"],["medical hospital doctor","healthcare"],["nature healing forest","wellness"]],
  general:    [["cinematic aerial drone","landscape bird view"],["timelapse city sunrise","fast motion"],["cultural festival traditional","celebration dance"],["wildlife animals nature","safari"],["waterfall river nature","cascade"]],
}

const ACCENT = {
  facts:"00E5FF", motivation:"FF8C00", tech:"00FF88", story:"CC44FF",
  top10:"FFD700", shorts:"FF1744", horror:"FF2222", finance:"00FF44",
  health:"44FF88", general:"FF4488"
}

async function downloadFile(url, dest) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000) })
    if (!res.ok) return false
    const buffer = await res.arrayBuffer()
    await writeFile(dest, Buffer.from(buffer))
    return statSync(dest).size > 50000
  } catch { return false }
}

async function getAudioDuration(p) {
  try {
    const { stdout } = await execAsync(`"${FFPROBE}" -v quiet -print_format json -show_streams "${p}"`, { timeout: 15000 })
    return Math.ceil(parseFloat(JSON.parse(stdout).streams[0]?.duration || "60"))
  } catch { return 60 }
}

export async function POST(request) {
  try {
    let { audioUrl, thumbnailUrl, title, script, hook, videoType = "long", category = "general" } = await request.json()
    const catKey = (category || "general").toLowerCase()
    const isShorts = videoType === "shorts" || catKey === "shorts"
    const W = isShorts ? 1080 : 1920
    const H = isShorts ? 1920 : 1080
    const accent = ACCENT[catKey] || "FF4488"

    const storageDir = path.join(process.cwd(), "storage")
    const dirs = ["videos","temp","thumbnails","music","clips"].map(d => path.join(storageDir, d))
    for (const d of dirs) if (!existsSync(d)) await mkdir(d, { recursive: true })
    const [videosDir, tempDir, thumbsDir, musicDir, clipsDir] = dirs

    const videoId = `video_${Date.now()}`
    const audioPath = path.join(tempDir, `${videoId}_audio.mp3`)
    const thumbPath = path.join(tempDir, `${videoId}_thumb.jpg`)
    const mixedPath = path.join(tempDir, `${videoId}_mix.mp3`)
    const outputPath = path.join(videosDir, `${videoId}.mp4`)

    // Audio
    if (audioUrl) {
      const al = path.join(storageDir, "audio", audioUrl.split("/").pop())
      if (existsSync(al)) await copyFile(al, audioPath)
    }
    if (!existsSync(audioPath)) {
      await execAsync(`"${FFMPEG}" -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -acodec libmp3lame -q:a 9 "${audioPath}"`, { timeout: 15000 })
    }

    // Thumbnail
    if (thumbnailUrl) {
      const tl = path.join(thumbsDir, thumbnailUrl.split("/").pop())
      if (existsSync(tl)) await copyFile(tl, thumbPath)
    }
    if (!existsSync(thumbPath)) {
      const jpgs = (await readdir(thumbsDir).catch(() => [])).filter(f => f.endsWith(".jpg")).sort().reverse()
      if (jpgs.length) await copyFile(path.join(thumbsDir, jpgs[0]), thumbPath)
      else await execAsync(`"${FFMPEG}" -y -f lavfi -i "color=black:size=${W}x${H}:rate=1" -frames:v 1 "${thumbPath}"`, { timeout: 10000 })
    }

    const audioDur = await getAudioDuration(audioPath)
    console.log(`🎬 ${catKey} | ${audioDur}s | ${isShorts ? "SHORTS" : "LANDSCAPE"}`)

    // BG Music
    const musicPath = path.join(musicDir, `bg_${catKey}.mp3`)
    if (!existsSync(musicPath)) {
      const freq = {facts:396,motivation:528,tech:440,story:285,top10:639,shorts:741,horror:174,finance:417,health:528,general:432}[catKey] || 432
      try {
        await execAsync(`"${FFMPEG}" -y -f lavfi -i "sine=frequency=${freq}:duration=${audioDur+15}" -af "volume=0.08,afade=t=in:st=0:d=4,afade=t=out:st=${audioDur+8}:d=5" -acodec libmp3lame -q:a 4 "${musicPath}"`, { timeout: 35000 })
      } catch {}
    }

    // Mix audio
    if (existsSync(musicPath)) {
      try {
        await execAsync(`"${FFMPEG}" -y -i "${audioPath}" -i "${musicPath}" -filter_complex "[0:a]volume=1.0[v];[1:a]volume=0.08[m];[v][m]amix=inputs=2:duration=first[out]" -map "[out]" -t ${audioDur} "${mixedPath}"`, { timeout: 60000 })
      } catch { await copyFile(audioPath, mixedPath) }
    } else await copyFile(audioPath, mixedPath)

    // Download Pexels clips
    let clips = []
    const pKey = process.env.PEXELS_API_KEY
    if (pKey) {
      try {
        const queries = CATEGORY_QUERIES[catKey] || CATEGORY_QUERIES.general
        const poolIdx = parseInt(videoId.slice(-3)) % queries.length
        const pool = queries[poolIdx]
        const q = encodeURIComponent(pool[Math.floor(Math.random() * pool.length)])
        const pageNum = (parseInt(videoId.slice(-5,-3)) % 5) + 1
        const ori = isShorts ? "portrait" : "landscape"
        const pr = await fetch(`https://api.pexels.com/videos/search?query=${q}&per_page=8&page=${pageNum}&orientation=${ori}&size=medium`, { headers: { Authorization: pKey } })
        if (pr.ok) {
          const pd = await pr.json()
          console.log(`Pexels: ${pd.videos?.length || 0} clips for "${q}"`)
          for (let i = 0; i < Math.min(pd.videos?.length || 0, 5); i++) {
            const v = pd.videos[i]
            const f = v.video_files?.find(f => f.quality === "hd" && f.width <= 1366) || v.video_files?.find(f => f.quality === "sd" && f.width >= 640) || v.video_files?.[0]
            if (f?.link) {
              const cp = path.join(clipsDir, `clip_${videoId}_${i}.mp4`)
              if (await downloadFile(f.link, cp)) {
                clips.push({ path: cp, duration: v.duration })
                console.log(`✅ Clip ${i+1}: ${statSync(cp).size} bytes`)
              }
            }
          }
        }
      } catch (e) { console.log("Pexels error:", e.message) }
    }

    let success = false

    // Render A: Pexels clips concat
    if (clips.length >= 2) {
      try {
        const segLen = Math.max(4, Math.floor(audioDur / clips.length))
        const processed = []
        for (let i = 0; i < clips.length; i++) {
          const proc = path.join(tempDir, `${videoId}_p${i}.mp4`)
          try {
            await execAsync(`"${FFMPEG}" -y -i "${clips[i].path}" -t ${segLen} -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=25" -c:v libx264 -preset fast -crf 23 -an "${proc}"`, { timeout: 120000 })
            if (existsSync(proc) && statSync(proc).size > 5000) processed.push(proc)
          } catch (e) { console.log(`Clip ${i} err:`, e.message.slice(0,80)) }
        }
        if (processed.length >= 2) {
          let concatTxt = processed.map(p => `file '${p.replace(/\\/g, "/")}'`).join("\n")
          const concatF = path.join(tempDir, `${videoId}_list.txt`)
          await writeFile(concatF, concatTxt)
          await execAsync(
            `"${FFMPEG}" -y -f concat -safe 0 -i "${concatF}" -i "${mixedPath}" ` +
            `-vf "drawbox=x=0:y=0:w=iw:h=90:color=black@0.6:t=fill,drawbox=x=0:y=h-8:w=iw*t/${audioDur}:h=8:color=0x${accent}@0.9:t=fill" ` +
            `-map 0:v -map 1:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -pix_fmt yuv420p -t ${audioDur} -movflags +faststart "${outputPath}"`,
            { timeout: 600000 }
          )
          success = existsSync(outputPath) && statSync(outputPath).size > 100000
          if (success) console.log(`✅ Render A: ${processed.length} Pexels clips`)
        }
      } catch (e) { console.log("Render A err:", e.message.slice(0,120)) }
    }

    // Render B: Thumbnail + audio fallback
    if (!success) {
      try {
        await execAsync(
          `"${FFMPEG}" -y -loop 1 -i "${thumbPath}" -i "${mixedPath}" ` +
          `-vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,drawbox=x=0:y=h-8:w=iw*t/${audioDur}:h=8:color=0x${accent}@0.9:t=fill" ` +
          `-c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -t ${audioDur} -movflags +faststart "${outputPath}"`,
          { timeout: 120000 }
        )
        success = existsSync(outputPath) && statSync(outputPath).size > 50000
        if (success) console.log("✅ Render B: thumbnail fallback")
      } catch (e) { console.log("Render B err:", e.message.slice(0,80)) }
    }

    const vSize = existsSync(outputPath) ? statSync(outputPath).size : 0
    console.log(`✅ Done: ${(vSize/1024/1024).toFixed(1)}MB | Clips:${clips.length}`)
    for (const c of clips) try { await unlink(c.path) } catch {}

    return NextResponse.json({
      success: true, videoId,
      videoUrl: `/storage/videos/${videoId}.mp4`,
      videoType: isShorts ? "shorts" : "long",
      duration: audioDur,
      clipsUsed: clips.length,
      category: catKey,
      message: `✅ ${catKey} | ${clips.length} Pexels clips | ${(vSize/1024/1024).toFixed(1)}MB`,
    })
  } catch (error) {
    console.error("Fatal:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}