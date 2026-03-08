import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, copyFile, readdir, unlink } from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";
const execAsync = promisify(exec);

const CATEGORY_QUERIES = {
  facts:      ["space galaxy cosmos", "science laboratory research", "nature wildlife animals", "history ancient civilization", "human body medical"],
  motivation: ["sunrise mountain peak success", "athlete running champion", "business entrepreneur success", "meditation mindfulness", "team achievement victory"],
  tech:       ["artificial intelligence robot future", "technology digital innovation", "coding programming computer", "futuristic smart city", "data science neural network"],
  story:      ["dark mysterious forest night", "cinematic dramatic sky clouds", "abandoned old building mystery", "emotional cinematic scene", "thriller suspense dramatic"],
  top10:      ["trophy award ceremony winner", "luxury lifestyle wealth", "world landmarks famous places", "countdown celebration fireworks", "success achievement ranking"],
  shorts:     ["fast timelapse city energy", "viral trending dance", "explosion energy dynamic", "quick motion fast", "social media viral content"],
  general:    ["cinematic aerial drone view", "epic landscape nature", "dramatic storm clouds", "beautiful sunset golden hour", "stunning visual masterpiece"],
}

const CATEGORY_MUSIC_FREQ = {
  facts: 396, motivation: 528, tech: 440, story: 285, top10: 639, shorts: 741, general: 432,
}

const CATEGORY_COLORS = {
  facts:      { title: "white",  sub: "00E5FF", badge: "red" },
  motivation: { title: "white",  sub: "FF6D00", badge: "red" },
  tech:       { title: "white",  sub: "00E676", badge: "red" },
  story:      { title: "white",  sub: "EA80FC", badge: "red" },
  top10:      { title: "white",  sub: "FFD740", badge: "red" },
  shorts:     { title: "white",  sub: "FF1744", badge: "red" },
  general:    { title: "white",  sub: "FF4081", badge: "red" },
}

async function downloadFile(url, dest) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000) })
    if (!res.ok) return false
    const buffer = await res.arrayBuffer()
    await writeFile(dest, Buffer.from(buffer))
    const size = statSync(dest).size
    return size > 50000
  } catch(e) { return false }
}

export async function POST(request) {
  try {
    let { audioUrl, thumbnailUrl, title, script, hook, keyPoints, videoType = "long", category = "general" } = await request.json()

    const storageDir = path.join(process.cwd(), "storage")
    const dirs = ["videos","temp","thumbnails","music","clips"].map(d => path.join(storageDir, d))
    for (const d of dirs) if (!existsSync(d)) await mkdir(d, { recursive: true })

    const [videosDir, tempDir, thumbsDir, musicDir, clipsDir] = dirs

    if (!audioUrl) audioUrl = "/storage/audio/silence.mp3"
    if (!thumbnailUrl) {
      const jpgs = (await readdir(thumbsDir).catch(()=>[])).filter(f=>f.endsWith(".jpg")).sort().reverse()
      thumbnailUrl = jpgs.length > 0 ? `/storage/thumbnails/${jpgs[0]}` : ""
    }

    const videoId = `video_${Date.now()}`
    const audioPath = path.join(tempDir, `${videoId}_audio.mp3`)
    const thumbPath = path.join(tempDir, `${videoId}_thumb.jpg`)
    const outputPath = path.join(videosDir, `${videoId}.mp4`)
    const catKey = (category||"general").toLowerCase()
    const isShorts = videoType === "shorts" || catKey === "shorts"
    const W = isShorts ? 1080 : 1920
    const H = isShorts ? 1920 : 1080

    // Audio
    const audioLocal = path.join(storageDir, "audio", audioUrl.split("/").pop())
    if (existsSync(audioLocal)) await copyFile(audioLocal, audioPath)
    else await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "${audioPath}"`)

    // Thumbnail
    const thumbLocal = path.join(thumbsDir, thumbnailUrl.split("/").pop())
    if (existsSync(thumbLocal)) await copyFile(thumbLocal, thumbPath)
    else {
      const jpgs = (await readdir(thumbsDir).catch(()=>[])).filter(f=>f.endsWith(".jpg")).sort().reverse()
      if (jpgs.length > 0) await copyFile(path.join(thumbsDir, jpgs[0]), thumbPath)
      else await execAsync(`ffmpeg -y -f lavfi -i color=black:size=${W}x${H}:rate=1 -frames:v 1 "${thumbPath}"`)
    }

    // Audio duration
    let audioDuration = 60
    try {
      const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_streams "${audioPath}"`)
      audioDuration = Math.ceil(parseFloat(JSON.parse(stdout).streams[0]?.duration || "60"))
    } catch(e) {}

    // BG Music (category-specific freq)
    const musicPath = path.join(musicDir, `bg_${catKey}.mp3`)
    if (!existsSync(musicPath)) {
      const freq = CATEGORY_MUSIC_FREQ[catKey] || 432
      try {
        await execAsync(`ffmpeg -y -f lavfi -i "sine=frequency=${freq}:duration=${audioDuration+15}" -af "volume=0.1,afade=t=in:st=0:d=4,afade=t=out:st=${audioDuration+8}:d=5,equalizer=f=100:width_type=o:width=2:g=3" -acodec libmp3lame -q:a 4 "${musicPath}"`)
        console.log("✅ BG Music:", catKey, freq+"Hz")
      } catch(e) {}
    }

    // Download Pexels clips
    let clips = []
    const pKey = process.env.PEXELS_API_KEY
    if (pKey) {
      try {
        const queries = CATEGORY_QUERIES[catKey] || CATEGORY_QUERIES.general
        const q = encodeURIComponent(queries[Math.floor(Math.random()*queries.length)])
        const ori = isShorts ? "portrait" : "landscape"
        const pr = await fetch(`https://api.pexels.com/videos/search?query=${q}&per_page=8&orientation=${ori}&size=medium`, { headers: { Authorization: pKey } })
        if (pr.ok) {
          const pd = await pr.json()
          console.log(`Pexels: ${pd.videos?.length||0} clips for "${q}"`)
          for (let i = 0; i < Math.min(pd.videos?.length||0, 5); i++) {
            const v = pd.videos[i]
            const f = v.video_files?.find(f=>f.quality==="hd"&&f.width<=1366) || v.video_files?.find(f=>f.quality==="sd"&&f.width>=640) || v.video_files?.[0]
            if (f?.link) {
              const cp = path.join(clipsDir, `clip_${videoId}_${i}.mp4`)
              if (await downloadFile(f.link, cp)) {
                clips.push({ path: cp, duration: v.duration })
                console.log(`✅ Clip ${i+1}: ${statSync(cp).size} bytes, ${v.duration}s`)
              }
            }
          }
        }
      } catch(e) { console.log("Pexels error:", e.message) }
    }

    // Subtitle text processing
    const safeT = t => (t||"").trim().replace(/[\\'":%\[\]<>]/g,"").replace(/[^\x00-\x7F]/g,"").slice(0,52)||""
    const safeTitle = safeT(title) || "AI Video"
    const scriptText = script || hook || title || "AI Video"
    const sentences = scriptText.split(/[।.!?\n]+/).filter(s=>s.trim().length>8).slice(0,8)
    const points = sentences.length > 0 ? sentences : [title||"AI Video"]
    const segDur = Math.max(4, Math.floor(audioDuration/points.length))
    const colors = CATEGORY_COLORS[catKey] || CATEGORY_COLORS.general
    const subColor = colors.sub

    // === PROFESSIONAL SUBTITLE FILTERS ===
    let drawF = []

    // 1. Semi-transparent top bar for title
    drawF.push(`drawbox=x=0:y=0:w=iw:h=${isShorts?115:95}:color=black@0.65:t=fill`)

    // 2. Title with glow effect
    drawF.push(`drawtext=text='${safeTitle}':fontsize=${isShorts?46:42}:fontcolor=white:x=(w-text_w)/2:y=${isShorts?28:22}:enable='between(t,0,${audioDuration})':shadowx=2:shadowy=2:shadowcolor=black@0.9`)

    // 3. Accent line under title
    drawF.push(`drawbox=x=0:y=${isShorts?108:88}:w=iw:h=${isShorts?4:3}:color=0x${subColor}@0.9:t=fill`)

    // 4. Subtitles - karaoke style bottom
    points.forEach((point, i) => {
      const safe = safeT(point)
      if (!safe) return
      const st = i * segDur
      const et = Math.min(st + segDur, audioDuration)
      const y = isShorts ? "h*0.84" : "h*0.82"

      // Shadow text (depth effect)
      drawF.push(`drawtext=text='${safe}':fontsize=${isShorts?38:32}:fontcolor=black@0.8:x=(w-text_w)/2+2:y=${y}+2:enable='between(t,${st},${et})'`)
      // Main colored subtitle
      drawF.push(`drawtext=text='${safe}':fontsize=${isShorts?38:32}:fontcolor=0x${subColor}:x=(w-text_w)/2:y=${y}:enable='between(t,${st},${et})':box=1:boxcolor=black@0.75:boxborderw=${isShorts?14:11}`)
    })

    // 5. Category badge top-left
    drawF.push(`drawbox=x=isShorts?60:48:y=${isShorts?130:108}:w=${isShorts?190:145}:h=${isShorts?54:42}:color=red@0.92:t=fill:x=${isShorts?60:48}`)
    drawF.push(`drawtext=text='${catKey.toUpperCase()}':fontsize=${isShorts?26:20}:fontcolor=white:x=${isShorts?76:58}:y=${isShorts?148:120}:fontweight=bold`)

    // 6. Progress bar at bottom
    drawF.push(`drawbox=x=0:y=h-${isShorts?8:6}:w=iw:h=${isShorts?8:6}:color=black@0.5:t=fill`)
    drawF.push(`drawbox=x=0:y=h-${isShorts?8:6}:w=iw*t/${audioDuration}:h=${isShorts?8:6}:color=0x${subColor}@0.9:t=fill`)

    // 7. Copyright watermark
    drawF.push(`drawtext=text='Pexels CC0 | AI Generated | Copyright Safe':fontsize=${isShorts?16:12}:fontcolor=white@0.4:x=(w-text_w)/2:y=h-${isShorts?30:22}`)

    const scaleVf = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1`

    // Mixed audio
    const mixedAudio = path.join(tempDir, `${videoId}_mix.mp3`)
    if (existsSync(musicPath)) {
      try {
        await execAsync(`ffmpeg -y -i "${audioPath}" -i "${musicPath}" -filter_complex "[0:a]volume=1.0[v];[1:a]volume=0.1,afade=t=in:st=0:d=3,afade=t=out:st=${Math.max(audioDuration-4,1)}:d=4[m];[v][m]amix=inputs=2:duration=first[out]" -map "[out]" -t ${audioDuration} "${mixedAudio}"`, {timeout:60000})
      } catch(e) { await copyFile(audioPath, mixedAudio) }
    } else await copyFile(audioPath, mixedAudio)

    let ffmpegCmd

    if (clips.length >= 2) {
      console.log(`🎬 ${clips.length} Pexels clips + subtitles + music!`)
      const segLen = Math.max(4, Math.floor(audioDuration / clips.length))
      const processed = []
      let concatTxt = ""

      for (let i = 0; i < clips.length; i++) {
        const proc = path.join(tempDir, `${videoId}_p${i}.mp4`)
        try {
          // Each clip: scale + slight zoom effect
          const zoom = i % 2 === 0 ? `zoompan=z='min(zoom+0.0008,1.05)':d=${segLen*25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',` : ""
          await execAsync(`ffmpeg -y -i "${clips[i].path}" -t ${segLen} -vf "${zoom}${scaleVf},fps=25" -c:v libx264 -preset fast -crf 23 -an "${proc}"`, {timeout:120000})
          if (existsSync(proc) && statSync(proc).size > 5000) {
            processed.push(proc)
            concatTxt += `file '${proc.replace(/\\/g,"/")}'\n`
          }
        } catch(e) { console.log(`Clip ${i} err:`, e.message) }
      }

      if (processed.length >= 2) {
        const concatF = path.join(tempDir, `${videoId}_list.txt`)
        await writeFile(concatF, concatTxt)
        ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${concatF}" -i "${mixedAudio}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -pix_fmt yuv420p -t ${audioDuration} -vf "${drawF.join(",")}" -movflags +faststart "${outputPath}"`
      } else {
        ffmpegCmd = `ffmpeg -y -loop 1 -i "${thumbPath}" -i "${mixedAudio}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -t ${audioDuration} -vf "${scaleVf},${drawF.join(",")}" -movflags +faststart "${outputPath}"`
      }
    } else {
      ffmpegCmd = `ffmpeg -y -loop 1 -i "${thumbPath}" -i "${mixedAudio}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -t ${audioDuration} -vf "${scaleVf},${drawF.join(",")}" -movflags +faststart "${outputPath}"`
    }

    console.log(`🎬 FFmpeg: ${isShorts?"Shorts 9:16":"Long 16:9"} | ${audioDuration}s | Clips:${clips.length}`)
    await execAsync(ffmpegCmd, {timeout:600000})
    const vSize = existsSync(outputPath) ? statSync(outputPath).size : 0
    console.log(`✅ Video: ${(vSize/1024/1024).toFixed(1)}MB | Clips:${clips.length} | ${isShorts?"Shorts":"Long"}`)

    for (const c of clips) try { await unlink(c.path) } catch {}

    return NextResponse.json({
      success: true, videoId,
      videoUrl: `/storage/videos/${videoId}.mp4`,
      videoType: isShorts?"shorts":"long",
      duration: audioDuration,
      clipsUsed: clips.length,
      message: `✅ ${isShorts?"Shorts":"Long"} video! ${clips.length} Pexels clips | ${(vSize/1024/1024).toFixed(1)}MB`,
    })
  } catch(error) {
    console.error("Error:", error.message)
    return NextResponse.json({ error: error.message }, {status:500})
  }
}
