// app/api/video/generate/route.js
// ULTRA PRO VIDEO ENGINE v8.0
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, copyFile, readdir, unlink } from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";
const execAsync = promisify(exec);

const FFMPEG  = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe";
const FFPROBE = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffprobe.exe";
const FONT    = "C\\:/Windows/Fonts/arialbd.ttf";

const CAT = {
  facts:      { bg:"0x0A0A1A", particle:"0x00E5FF", accent:"00E5FF", freq:396,  harmonic:594, vol:0.07, badge:"FACTS"      },
  motivation: { bg:"0x1A0800", particle:"0xFF8C00", accent:"FF8C00", freq:528,  harmonic:396, vol:0.11, badge:"MOTIVATION" },
  tech:       { bg:"0x001A0F", particle:"0x00FF88", accent:"00FF88", freq:440,  harmonic:880, vol:0.08, badge:"TECH/AI"    },
  story:      { bg:"0x0D001A", particle:"0xCC44FF", accent:"CC44FF", freq:285,  harmonic:570, vol:0.09, badge:"STORY"      },
  top10:      { bg:"0x1A1200", particle:"0xFFD700", accent:"FFD700", freq:639,  harmonic:426, vol:0.11, badge:"TOP 10"     },
  shorts:     { bg:"0x1A0008", particle:"0xFF1744", accent:"FF1744", freq:741,  harmonic:370, vol:0.13, badge:"SHORTS"     },
  horror:     { bg:"0x0D0000", particle:"0xFF2222", accent:"FF2222", freq:174,  harmonic:87,  vol:0.11, badge:"HORROR"     },
  finance:    { bg:"0x001A08", particle:"0x00FF44", accent:"00FF44", freq:417,  harmonic:835, vol:0.08, badge:"FINANCE"    },
  health:     { bg:"0x001A0D", particle:"0x44FF88", accent:"44FF88", freq:528,  harmonic:264, vol:0.07, badge:"HEALTH"     },
  general:    { bg:"0x1A001A", particle:"0xFF4488", accent:"FF4488", freq:432,  harmonic:648, vol:0.09, badge:"VIRAL"      },
}

const AI_STYLES = {
  facts:      "shocked indian scientist glasses, cinematic blue neon 4K ultra detailed, dark science lab",
  motivation: "determined young indian athlete, golden hour epic cinematic 4K, mountain sunrise",
  tech:       "excited indian tech person, cyberpunk neon blue green 4K, holographic displays dark",
  story:      "emotional indian person dramatic, dark film noir cinematic 4K, mysterious foggy",
  horror:     "terrified indian person pale wide eyes, horror dark crimson 4K, haunted darkness",
  shorts:     "energetic young indian creator, vibrant colorful trendy 4K, urban neon city",
  finance:    "confident indian businessman suit, professional gold tones 4K, financial charts",
  health:     "peaceful healthy indian person, warm natural light 4K, yoga nature green",
  general:    "expressive indian person, cinematic warm dramatic 4K, beautiful India sky",
}

async function getAudioDuration(p) {
  try {
    const { stdout } = await execAsync(`"${FFPROBE}" -v quiet -print_format json -show_streams "${p}"`, { timeout: 15000 })
    return Math.ceil(parseFloat(JSON.parse(stdout).streams[0]?.duration || "60"))
  } catch { return 60 }
}

async function generateBgMusic(musicPath, conf, duration) {
  if (existsSync(musicPath)) return
  const dur = duration + 15, fo = duration + 8
  try {
    await execAsync(
      `"${FFMPEG}" -y -f lavfi -i "sine=frequency=${conf.freq}:duration=${dur}" -f lavfi -i "sine=frequency=${conf.harmonic}:duration=${dur}" ` +
      `-filter_complex "[0:a]volume=0.55[a1];[1:a]volume=0.22[a2];[a1][a2]amix=inputs=2:duration=first[mix];[mix]aecho=0.5:0.4:180:0.25[echo];[echo]afade=t=in:st=0:d=4,afade=t=out:st=${fo}:d=5[out]" ` +
      `-map "[out]" -acodec libmp3lame -q:a 2 "${musicPath}"`,
      { timeout: 35000 }
    )
  } catch {
    try {
      await execAsync(
        `"${FFMPEG}" -y -f lavfi -i "sine=frequency=${conf.freq}:duration=${dur}" ` +
        `-filter_complex "afade=t=in:st=0:d=3,afade=t=out:st=${fo}:d=5" -acodec libmp3lame -q:a 3 "${musicPath}"`,
        { timeout: 20000 }
      )
    } catch {}
  }
}

function safeT(t, maxLen = 46) {
  return (t || "").trim()
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[\\'":%\[\]{}<>|!@#$^&*()+]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, maxLen).trim()
}

function buildSegments(scriptTextMain, totalDur) {
  const cl = (scriptText || "").replace(/\[[^\]]*\]/g," ").replace(/[^\x00-\x7F]/g," ").replace(/\s+/g," ").trim()
  const sns = cl.split(/[.!?,;:\n]+/).map(s=>s.trim()).filter(s=>s.length>1)
  if (!sns.length) return [{text:safeT(scriptText||"AI Video"),start:0,end:totalDur}]
  const wc = sns.map(s=>Math.max(1,s.split(/\s+/).filter(w=>w.length>0).length))
  const tw = wc.reduce((a,b)=>a+b,0)
  const segs=[]; let t=0
  for(let i=0;i<sns.length;i++){
    if(t>=totalDur) break
    const sd=totalDur*(wc[i]/tw)
    const ws=sns[i].split(/\s+/).filter(w=>w.length>0)
    const cks=[]
    for(let j=0;j<ws.length;j+=4) cks.push(ws.slice(j,j+4).join(" "))
    const cd=sd/(cks.length||1)
    for(const ck of cks){
      if(t>=totalDur) break
      const s=safeT(ck); if(!s) continue
      const e=Math.min(t+cd,totalDur)
      segs.push({text:s,start:parseFloat(t.toFixed(3)),end:parseFloat(e.toFixed(3))})
      t=e
    }
  }
  if(segs.length>0) segs[segs.length-1].end=totalDur
  else segs.push({text:safeT(scriptText||"AI Video"),start:0,end:totalDur})
  return segs
}

// Build vf string and write to file — avoids Windows 8191 char cmd limit
async function buildVfFile(vfPath, segments, conf, W, H, isShorts, audioDur, safeTitle) {
  const topH   = isShorts ? 120 : 96
  const titY   = isShorts ? 24  : 18
  const titSz  = isShorts ? 54  : 46
  const bX     = isShorts ? 22  : 16
  const bY     = isShorts ? topH+12 : topH+8
  const bW     = isShorts ? 220 : 180
  const bH     = isShorts ? 56  : 44
  const bTxtX  = isShorts ? 36  : 28
  const bTxtY  = isShorts ? topH+28 : topH+20
  const bTxtSz = isShorts ? 26  : 20
  const progH  = isShorts ? 12  : 8
  const subSz  = isShorts ? 72  : 52
  const subGSz = isShorts ? 78  : 58
  const subY   = isShorts ? "h*0.80" : "h*0.78"
  const subBarY= isShorts ? "h*0.72" : "h*0.70"
  const subBarH= isShorts ? 230 : 190
  const ff = `fontfile='${FONT}'`

  const f = []
  f.push(`scale=${W}:${H}:force_original_aspect_ratio=decrease`)
  f.push(`pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`)
  f.push(`setsar=1`)
  f.push(`drawbox=x=0:y=0:w=iw:h=${topH}:color=black@0.88:t=fill`)

  if (safeTitle) {
    f.push(`drawtext=${ff}:text='${safeTitle}':fontsize=${titSz}:fontcolor=0x${conf.accent}@0.40:x=(w-text_w)/2+3:y=${titY+3}`)
    f.push(`drawtext=${ff}:text='${safeTitle}':fontsize=${titSz}:fontcolor=white:x=(w-text_w)/2:y=${titY}`)
  }

  f.push(`drawbox=x=0:y=${topH-4}:w=iw:h=4:color=0x${conf.accent}@1.0:t=fill`)
  f.push(`drawbox=x=${bX}:y=${bY}:w=${bW}:h=${bH}:color=0x${conf.accent}@0.92:t=fill`)
  f.push(`drawtext=${ff}:text='${conf.badge}':fontsize=${bTxtSz}:fontcolor=black:x=${bTxtX}:y=${bTxtY}`)
  f.push(`drawbox=x=0:y=${subBarY}:w=iw:h=${subBarH}:color=black@0.80:t=fill`)

  for (const seg of segments) {
    if (!seg.text) continue
    const en = `enable='between(t,${seg.start.toFixed(3)},${seg.end.toFixed(3)})'`
    f.push(`drawtext=${ff}:text='${seg.text}':fontsize=${subGSz}:fontcolor=0x${conf.accent}@0.55:x=(w-text_w)/2+3:y=${subY}+3:${en}`)
    f.push(`drawtext=${ff}:text='${seg.text}':fontsize=${subSz}:fontcolor=white:x=(w-text_w)/2:y=${subY}:box=1:boxcolor=black@0.82:boxborderw=${isShorts?18:14}:${en}`)
  }

  f.push(`drawbox=x=0:y=h-${progH}:w=iw:h=${progH}:color=black@0.65:t=fill`)
  f.push(`drawbox=x=0:y=h-${progH}:w=iw*t/${audioDur}:h=${progH}:color=0x${conf.accent}@1.0:t=fill`)

  // Write each filter on its own line — filter_script format
  await writeFile(vfPath, f.join(",\n"), "utf8")
  // Return forward-slash path for FFmpeg
  return vfPath.replace(/\\/g, "/")
}

export async function POST(request) {
  try {
    let { audioUrl, thumbnailUrl, title, script, hook, videoType = "long", category = "general", pexelsQuery = "" } = await request.json()

    const storageDir = path.join(process.cwd(), "storage")
    for (const d of ["videos","temp","thumbnails","music","bg","images","filters"]) {
      const dp = path.join(storageDir, d)
      if (!existsSync(dp)) await mkdir(dp, { recursive: true })
    }

    const videoId  = `video_${Date.now()}`
    const catKey   = (category||"general").toLowerCase().replace(/[^a-z]/g,"")
    const conf     = CAT[catKey] || CAT.general
    const isShorts = videoType === "shorts" || catKey === "shorts"
    const W = isShorts ? 1080 : 1920
    const H = isShorts ? 1920 : 1080

    const audioPath  = path.join(storageDir, "temp",    `${videoId}_audio.mp3`)
    const mixedPath  = path.join(storageDir, "temp",    `${videoId}_mix.mp3`)
    const outputPath = path.join(storageDir, "videos",  `${videoId}.mp4`)
    const thumbPath  = path.join(storageDir, "temp",    `${videoId}_thumb.jpg`)
    const bgPath     = path.join(storageDir, "bg",      `bg_${catKey}_${W}x${H}.mp4`)
    const musicPath  = path.join(storageDir, "music",   `bg_${catKey}_v8.mp3`)
    const vfPath     = path.join(storageDir, "filters", `${videoId}_vf.txt`)

    console.log(`🎬 ${catKey} | ${isShorts?"SHORTS":"LANDSCAPE"}`)

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
      const tl = path.join(storageDir, "thumbnails", thumbnailUrl.split("/").pop())
      if (existsSync(tl)) await copyFile(tl, thumbPath)
    }
    if (!existsSync(thumbPath)) {
      const jpgs = (await readdir(path.join(storageDir,"thumbnails")).catch(()=>[])).filter(f=>f.endsWith(".jpg")).sort().reverse()
      if (jpgs.length) await copyFile(path.join(storageDir,"thumbnails",jpgs[0]), thumbPath)
      else await execAsync(`"${FFMPEG}" -y -f lavfi -i "color=${conf.bg}:size=${W}x${H}:rate=1" -frames:v 1 "${thumbPath}"`, { timeout: 10000 })
    }

    const audioDur = await getAudioDuration(audioPath)
    console.log(`⏱ Duration: ${audioDur}s`)

    // BG Music
    await generateBgMusic(musicPath, conf, audioDur)

    // Mix audio
    if (existsSync(musicPath)) {
      try {
        await execAsync(
          `"${FFMPEG}" -y -i "${audioPath}" -i "${musicPath}" ` +
          `-filter_complex "[0:a]volume=1.0[v];[1:a]volume=${conf.vol},afade=t=in:st=0:d=3,afade=t=out:st=${Math.max(audioDur-4,1)}:d=4[m];[v][m]amix=inputs=2:duration=first[out]" ` +
          `-map "[out]" -t ${audioDur} "${mixedPath}"`,
          { timeout: 60000 }
        )
        console.log(`✅ Audio mixed`)
      } catch { await copyFile(audioPath, mixedPath) }
    } else { await copyFile(audioPath, mixedPath) }

    // AI Animated Background (cached per category)
    if (!existsSync(bgPath)) {
      try {
        const bg = conf.bg.replace("0x",""), pt = conf.particle.replace("0x","")
        const rB=parseInt(bg.slice(0,2),16), gB=parseInt(bg.slice(2,4),16), bB=parseInt(bg.slice(4,6),16)
        const rP=parseInt(pt.slice(0,2),16), gP=parseInt(pt.slice(2,4),16), bP=parseInt(pt.slice(4,6),16)
        const rE=`${rB}+${Math.min(rP-rB,60)}*sin(2*PI*t/8+X/${W}*PI)`
        const gE=`${gB}+${Math.min(gP-gB,60)}*sin(2*PI*t/10+Y/${H}*PI)`
        const bE=`${bB}+${Math.min(bP-bB,60)}*sin(2*PI*t/12)`
        await execAsync(
          `"${FFMPEG}" -y -f lavfi -i "color=c=black:size=${W}x${H}:rate=25:duration=${audioDur+10}" ` +
          `-vf "geq=r='${rE}':g='${gE}':b='${bE}'" -c:v libx264 -preset fast -crf 28 -an "${bgPath}"`,
          { timeout: 180000 }
        )
        console.log(`✅ AI Background generated`)
      } catch {
        try {
          await execAsync(
            `"${FFMPEG}" -y -f lavfi -i "color=c=${conf.bg}:size=${W}x${H}:rate=25:duration=${audioDur+10}" -c:v libx264 -preset ultrafast -crf 30 -an "${bgPath}"`,
            { timeout: 60000 }
          )
        } catch {}
      }
    } else { console.log(`✅ AI Background: cached`) }

    // Script + segments + vf file
    const scriptTextMain = script || hook || title || "AI Video"
    const safeTitle  = safeT(title, 46) || "AI Video"
    const segments   = buildSegments(scriptTextMain, audioDur)
    const vfFwdPath  = await buildVfFile(vfPath, segments, conf, W, H, isShorts, audioDur, safeTitle)
    console.log(`✅ Segments: ${segments.length} | VF: ${segments.length*2+10} filters`)

    // AI Scene Image (Replicate Flux Schnell)
    let aiImagePath = null
    if (process.env.REPLICATE_API_TOKEN && scriptText) {
      try {
        const sns = scriptText.replace(/\[[^\]]*\]/g," ").split(/[.!?,;\n]+/).map(s=>s.trim()).filter(s=>s.length>3)
        const mainScene = (sns[0]||title||"cinematic India").replace(/[^\x00-\x7F]/g," ").slice(0,70)
        const style = AI_STYLES[catKey] || AI_STYLES.general
        const prompt = `${style}, ${mainScene}, no text no watermark no logo`
        console.log(`🤖 AI Image generating...`)
        const r = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + process.env.REPLICATE_API_TOKEN,
            "Content-Type": "application/json",
            "Prefer": "wait"
          },
          body: JSON.stringify({
            input: {
              prompt,
              aspect_ratio: isShorts ? "9:16" : "16:9",
              output_format: "jpg",
              output_quality: 85,
              num_inference_steps: 4,
              go_fast: true
            }
          }),
          signal: AbortSignal.timeout(60000)
        })
        const d = await r.json()
        console.log("Replicate response:", JSON.stringify(d).slice(0,200))
        const imgUrl = Array.isArray(d.output) ? d.output[0] : d.output
        if (imgUrl && imgUrl.startsWith("http")) {
          const ir = await fetch(imgUrl, { signal: AbortSignal.timeout(30000) })
          const buf = Buffer.from(await ir.arrayBuffer())
          if (buf.length > 10000) {
            aiImagePath = path.join(storageDir, "temp", `${videoId}_ai.jpg`)
            await writeFile(aiImagePath, buf)
            console.log(`✅ AI Image: ${(buf.length/1024).toFixed(0)}KB`)
          }
        }
      } catch(e) { console.log("AI image skip:", e.message.slice(0,80)) }
    }

    let success = false

    // Render A: AI Replicate image + filter_script subtitles (BEST QUALITY)
    if (aiImagePath && existsSync(aiImagePath)) {
      try {
        await execAsync(
          `"${FFMPEG}" -y -loop 1 -i "${aiImagePath}" -i "${mixedPath}" ` +
          `-vf "filter_script=filename=${vfFwdPath}" ` +
          `-map 0:v -map 1:a -c:v libx264 -preset fast -crf 18 -c:a aac -b:a 192k -pix_fmt yuv420p -t ${audioDur} -movflags +faststart "${outputPath}"`,
          { timeout: 600000 }
        )
        success = existsSync(outputPath) && statSync(outputPath).size > 200000
        if (success) console.log(`✅ Render A: AI image + kinetic subtitles 🎉`)
      } catch(e) { console.log("Render A err:", e.message.slice(0,150)) }
    }

    // Render B: Animated bg + filter_script subtitles
    if (!success && existsSync(bgPath)) {
      try {
        await execAsync(
          `"${FFMPEG}" -y -stream_loop -1 -i "${bgPath}" -i "${mixedPath}" ` +
          `-vf "filter_script=filename=${vfFwdPath}" ` +
          `-map 0:v -map 1:a -c:v libx264 -preset fast -crf 18 -c:a aac -b:a 192k -pix_fmt yuv420p -t ${audioDur} -movflags +faststart "${outputPath}"`,
          { timeout: 600000 }
        )
        success = existsSync(outputPath) && statSync(outputPath).size > 200000
        if (success) console.log(`✅ Render B: Animated bg + kinetic subtitles`)
      } catch(e) { console.log("Render B err:", e.message.slice(0,150)) }
    }

    // Render C: Color bg + filter_script subtitles
    if (!success) {
      try {
        await execAsync(
          `"${FFMPEG}" -y -f lavfi -i "color=c=${conf.bg}:size=${W}x${H}:rate=25:duration=${audioDur}" -i "${mixedPath}" ` +
          `-vf "filter_script=filename=${vfFwdPath}" ` +
          `-map 0:v -map 1:a -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -pix_fmt yuv420p -t ${audioDur} -movflags +faststart "${outputPath}"`,
          { timeout: 300000 }
        )
        success = existsSync(outputPath) && statSync(outputPath).size > 100000
        if (success) console.log(`✅ Render C: Color bg + kinetic subtitles`)
      } catch(e) { console.log("Render C err:", e.message.slice(0,200)) }
    }

    // Render D: Simple color bg + basic title only (no filter_script)
    if (!success) {
      try {
        const simpleVf = [
          `scale=${W}:${H}`,
          `drawbox=x=0:y=0:w=iw:h=${isShorts?120:96}:color=black@0.88:t=fill`,
          `drawtext=fontfile='${FONT}':text='${safeTitle}':fontsize=${isShorts?54:46}:fontcolor=white:x=(w-text_w)/2:y=${isShorts?24:18}`,
          `drawbox=x=0:y=h-${isShorts?12:8}:w=iw*t/${audioDur}:h=${isShorts?12:8}:color=0x${conf.accent}@1.0:t=fill`,
        ].join(",")
        await execAsync(
          `"${FFMPEG}" -y -f lavfi -i "color=c=${conf.bg}:size=${W}x${H}:rate=25:duration=${audioDur}" -i "${mixedPath}" ` +
          `-vf "${simpleVf}" -map 0:v -map 1:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -pix_fmt yuv420p -t ${audioDur} -movflags +faststart "${outputPath}"`,
          { timeout: 180000 }
        )
        success = existsSync(outputPath) && statSync(outputPath).size > 100000
        if (success) console.log(`✅ Render D: Simple title`)
      } catch(e) { console.log("Render D err:", e.message.slice(0,100)) }
    }

    // Render E: Thumbnail fallback
    if (!success) {
      try {
        await execAsync(
          `"${FFMPEG}" -y -loop 1 -i "${thumbPath}" -i "${mixedPath}" ` +
          `-c:v libx264 -tune stillimage -c:a aac -b:a 128k -pix_fmt yuv420p -t ${audioDur} ` +
          `-vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black" ` +
          `-movflags +faststart "${outputPath}"`,
          { timeout: 120000 }
        )
        console.log(`✅ Render E: thumbnail fallback`)
      } catch(e) { console.log("Render E err:", e.message.slice(0,80)) }
    }

    // Cleanup
    for (const f of [aiImagePath, vfPath]) {
      if (f) try { await unlink(f) } catch {}
    }

    const vSize = existsSync(outputPath) ? statSync(outputPath).size : 0
    console.log(`✅ Done: ${(vSize/1024/1024).toFixed(1)}MB | Segs:${segments.length} | ${catKey}`)

    return NextResponse.json({
      success: true, videoId,
      videoUrl:    `/storage/videos/${videoId}.mp4`,
      videoType:   isShorts ? "shorts" : "long",
      duration:    audioDur,
      segments:    segments.length,
      category:    catKey,
      aiGenerated: !!aiImagePath,
      message: `✅ ${isShorts?"Shorts":"Landscape"} | ${segments.length} segs | ${(vSize/1024/1024).toFixed(1)}MB`,
    })

  } catch (error) {
    console.error("Fatal:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}





