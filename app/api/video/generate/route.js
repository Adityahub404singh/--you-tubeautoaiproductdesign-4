import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, copyFile, readdir, unlink } from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";
const execAsync = promisify(exec);

const FF = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe";
const FP = "ffprobe";

const CAT = {
  facts:      { q:[["space nebula galaxy cosmos","deep ocean underwater abyss"],["ancient ruins mystery","science laboratory experiment"],["natural disaster volcano","wildlife predator hunt"]], accent:"00E5FF", freq:396, badge:"FACTS" },
  motivation: { q:[["athlete champion victory","marathon runner finish"],["mountain summit success","entrepreneur startup"],["sunrise powerful energy","boxing training champion"]], accent:"FF8C00", freq:528, badge:"MOTIVATION" },
  tech:       { q:[["artificial intelligence robot","cyberpunk neon city"],["data center servers","virtual reality headset"],["drone technology aerial","electric car futuristic"]], accent:"00FF88", freq:440, badge:"TECH" },
  story:      { q:[["dark mysterious forest","dramatic storm lightning"],["old detective library","desert journey alone"],["campfire night stars","abandoned haunted place"]], accent:"CC44FF", freq:285, badge:"STORY" },
  top10:      { q:[["luxury mansion interior","world landmark famous"],["fine dining gourmet","sports stadium crowd"],["fashion luxury designer","supercar collection"]], accent:"FFD700", freq:639, badge:"TOP 10" },
  shorts:     { q:[["dance viral energy","parkour urban extreme"],["neon art colorful","gaming esports"],["magic trick wow","satisfying oddly"]], accent:"FF1744", freq:741, badge:"SHORTS" },
  horror:     { q:[["haunted house dark","cemetery night fog"],["ghost shadow paranormal","dark laboratory"],["horror abandoned building","creepy night forest"]], accent:"FF2222", freq:174, badge:"HORROR" },
  finance:    { q:[["stock market trading","gold coins wealth"],["luxury real estate","business corporate"],["bitcoin crypto","wall street finance"]], accent:"00FF44", freq:417, badge:"FINANCE" },
  health:     { q:[["yoga meditation sunrise","fitness gym workout"],["healthy food nutrition","nature healing forest"],["running marathon fit","medical hospital"]], accent:"44FF88", freq:528, badge:"HEALTH" },
  general:    { q:[["cinematic aerial drone","timelapse city sunrise"],["waterfall nature beautiful","cultural festival dance"],["wildlife safari animals","ocean waves sunset"]], accent:"FF4488", freq:432, badge:"VIRAL" },
}

async function dl(url, dest) {
  try {
    const r = await fetch(url, { headers:{"User-Agent":"Mozilla/5.0"}, signal:AbortSignal.timeout(30000) })
    if(!r.ok) return false
    await writeFile(dest, Buffer.from(await r.arrayBuffer()))
    return statSync(dest).size > 50000
  } catch { return false }
}

async function dur(p) {
  try {
    const {stdout} = await execAsync(`"${FP}" -v quiet -print_format json -show_streams "${p}"`, {timeout:15000})
    return Math.ceil(parseFloat(JSON.parse(stdout).streams[0]?.duration||"60"))
  } catch { return 60 }
}

export async function POST(request) {
  try {
    let { audioUrl, thumbnailUrl, title, script, hook, videoType="long", category="general" } = await request.json()
    const cat = (category||"general").toLowerCase()
    const cfg = CAT[cat] || CAT.general
    const isS = videoType==="shorts" || cat==="shorts"
    const W = isS?1080:1920, H = isS?1920:1080
    const ac = cfg.accent

    const sd = path.join(process.cwd(),"storage")
    for(const d of ["videos","temp","thumbnails","music","clips"]) {
      const p = path.join(sd,d); if(!existsSync(p)) await mkdir(p,{recursive:true})
    }
    const vd=path.join(sd,"videos"), td=path.join(sd,"temp"), thd=path.join(sd,"thumbnails")
    const md=path.join(sd,"music"), cd=path.join(sd,"clips")

    const vid = `video_${Date.now()}`
    const ap = path.join(td,`${vid}_audio.mp3`)
    const tp = path.join(td,`${vid}_thumb.jpg`)
    const mp = path.join(td,`${vid}_mix.mp3`)
    const op = path.join(vd,`${vid}.mp4`)

    // Audio
    if(audioUrl) { const al=path.join(sd,"audio",audioUrl.split("/").pop()); if(existsSync(al)) await copyFile(al,ap) }
    if(!existsSync(ap)) await execAsync(`"${FF}" -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -acodec libmp3lame -q:a 9 "${ap}"`,{timeout:15000})

    // Thumbnail
    if(thumbnailUrl) { const tl=path.join(thd,thumbnailUrl.split("/").pop()); if(existsSync(tl)) await copyFile(tl,tp) }
    if(!existsSync(tp)) {
      const jpgs=(await readdir(thd).catch(()=>[])).filter(f=>f.endsWith(".jpg")).sort().reverse()
      if(jpgs.length) await copyFile(path.join(thd,jpgs[0]),tp)
      else await execAsync(`"${FF}" -y -f lavfi -i "color=black:size=${W}x${H}:rate=1" -frames:v 1 "${tp}"`,{timeout:10000})
    }

    const ad = await dur(ap)
    console.log(`ðŸŽ¬ ${cat} | ${ad}s | ${isS?"SHORTS":"LANDSCAPE"}`)

    // Music - layered harmonics
    const mpath = path.join(md,`bg_${cat}.mp3`)
    if(!existsSync(mpath)) {
      const f=cfg.freq, h=Math.round(f*1.5)
      try {
        await execAsync(`"${FF}" -y -f lavfi -i "sine=frequency=${f}:duration=${ad+15}" -f lavfi -i "sine=frequency=${h}:duration=${ad+15}" -filter_complex "[0:a]volume=0.6[a1];[1:a]volume=0.25[a2];[a1][a2]amix=inputs=2:duration=first[m];[m]aecho=0.5:0.4:180:0.25[e];[e]afade=t=in:st=0:d=4,afade=t=out:st=${ad+8}:d=5[out]" -map "[out]" -acodec libmp3lame -q:a 2 "${mpath}"`,{timeout:35000})
        console.log(`âœ… Music: ${cat} ${f}Hz`)
      } catch(e) { console.log("Music err:",e.message.slice(0,60)) }
    }

    // Mix
    if(existsSync(mpath)) {
      try {
        await execAsync(`"${FF}" -y -i "${ap}" -i "${mpath}" -filter_complex "[0:a]volume=1,afade=t=in:st=0:d=0.5,afade=t=out:st=2:d=0.5[v];[1:a]volume=0.09[m];[v][m]amix=inputs=2:duration=first[out]" -map "[out]" -t ${ad} "${mp}"`,{timeout:60000})
        console.log("âœ… Audio mixed")
      } catch { await copyFile(ap,mp) }
    } else await copyFile(ap,mp)

    // Pexels clips
    let clips=[]
    const pk = process.env.PEXELS_API_KEY
    if(pk) {
      const pools = cfg.q
      const pidx = parseInt(vid.slice(-3)) % pools.length
      const pool = pools[pidx]
      for(const query of pool) {
        if(clips.length >= 8) break
        try {
          const q = encodeURIComponent(query)
          const pg = (parseInt(vid.slice(-5,-3)) % 5) + 1
          const ori = isS?"portrait":"landscape"
          const pr = await fetch(`https://api.pexels.com/videos/search?query=${q}&per_page=10&page=${pg}&orientation=${ori}&size=medium`,{headers:{Authorization:pk}})
          if(!pr.ok) continue
          const pd = await pr.json()
          console.log(`Pexels: ${pd.videos?.length||0} for "${query}"`)
          for(const v of (pd.videos||[]).slice(0,4)) {
            if(clips.length >= 8) break
            const f = v.video_files?.find(f=>f.quality==="hd"&&f.width<=1366) || v.video_files?.find(f=>f.quality==="sd"&&f.width>=640) || v.video_files?.[0]
            if(f?.link) {
              const cp=path.join(cd,`clip_${vid}_${clips.length}.mp4`)
              if(await dl(f.link,cp)) { clips.push({path:cp,duration:v.duration}); console.log(`âœ… Clip ${clips.length}: ${(statSync(cp).size/1024/1024).toFixed(1)}MB`) }
            }
          }
        } catch(e) { console.log("Pexels err:",e.message.slice(0,60)) }
      }
    }

    let success=false

    // Render A: Pexels clips + fast cuts
    if(clips.length >= 2) {
      try {
        const segLen = Math.max(3, Math.floor(ad/clips.length))
        const proc=[]
        for(let i=0;i<clips.length;i++) {
          const pp=path.join(td,`${vid}_p${i}.mp4`)
          try {
            const zoom = i%2===0 ? `zoompan=z='min(zoom+0.001,1.08)':d=${segLen*25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',` : ""
            await execAsync(`"${FF}" -y -i "${clips[i].path}" -t ${segLen} -vf "${zoom}scale=${W}:${H},eq=contrast=1.2:brightness=0.05,zoompan=z='min(zoom+0.0015,1.5)':d=125:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=25" -c:v libx264 -preset fast -crf 22 -an "${pp}"`,{timeout:120000})
            if(existsSync(pp)&&statSync(pp).size>5000) { proc.push(pp); console.log(`âœ… Clip ${i+1} processed`) }
          } catch(e) { console.log(`Clip ${i} err:`,e.message.slice(0,60)) }
        }
        if(proc.length>=2) {
          const cf=path.join(td,`${vid}_list.txt`)
          await writeFile(cf, proc.map(p=>`file '${p.replace(/\\/g,"/")}'`).join("\n"))
          await execAsync(
            `"${FF}" -y -f concat -safe 0 -i "${cf}" -i "${mp}" ` +
            `-vf "drawbox=x=0:y=0:w=iw:h=100:color=black@0.7:t=fill,` +
            `drawbox=x=0:y=h-10:w=iw*t/${ad}:h=10:color=0x${ac}@1.0:t=fill,` +
            `drawbox=x=0:y=h-10:w=iw:h=10:color=black@0.4:t=fill" ` +
            `-map 0:v -map 1:a -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 192k -pix_fmt yuv420p -t ${ad} -movflags +faststart "${op}"`,
            {timeout:600000}
          )
          success=existsSync(op)&&statSync(op).size>100000
          if(success) console.log(`âœ… Render A: ${proc.length} clips + progress bar`)
        }
      } catch(e) { console.log("Render A err:",e.message.slice(0,120)) }
    }

    // Render B: Thumbnail fallback
    if(!success) {
      try {
        await execAsync(
          `"${FF}" -y -loop 1 -i "${tp}" -i "${mp}" ` +
          `-vf "scale=${W}:${H},eq=contrast=1.2:brightness=0.05,zoompan=z='min(zoom+0.0015,1.5)':d=125:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,` +
          `drawbox=x=0:y=h-10:w=iw*t/${ad}:h=10:color=0x${ac}@1.0:t=fill" ` +
          `-c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -t ${ad} -movflags +faststart "${op}"`,
          {timeout:120000}
        )
        success=existsSync(op)&&statSync(op).size>50000
        if(success) console.log("âœ… Render B: thumbnail")
      } catch(e) { console.log("Render B err:",e.message.slice(0,80)) }
    }

    const vs=existsSync(op)?statSync(op).size:0
    console.log(`âœ… Done: ${(vs/1024/1024).toFixed(1)}MB | Clips:${clips.length}`)
    for(const c of clips) try{await unlink(c.path)}catch{}

    return NextResponse.json({
      success:true, videoId:vid,
      videoUrl:`/storage/videos/${vid}.mp4`,
      videoType:isS?"shorts":"long",
      duration:ad, clipsUsed:clips.length, category:cat,
      message:`âœ… ${cat} | ${clips.length} clips | ${(vs/1024/1024).toFixed(1)}MB`
    })
  } catch(e) {
    console.error("Fatal:",e.message)
    return NextResponse.json({error:e.message},{status:500})
  }
}


