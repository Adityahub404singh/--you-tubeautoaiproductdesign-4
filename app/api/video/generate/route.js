// app/api/video/generate/route.js
// v6.1 - PRO LEVEL: Parallel Processing & Fast Encoding Enabled

import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, copyFile, readdir, unlink } from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";

const execAsync = promisify(exec);
const FFMPEG  = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe";
const FFPROBE = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffprobe.exe";
const ENV = { ...process.env, FONTCONFIG_FILE: "C:/fontconfig/fonts.conf", FONTCONFIG_PATH: "C:/fontconfig" };

﻿// --- CATEGORY CONFIG --------------------------------------------------------
const CAT = {
  psychology:      { queries:["brain neurons purple glow","therapy office calm light","ocean waves night blue","city lights blur night","misty lake dawn"], accent:"6C5CE7", mode:"typography" },
  stoicism:        { queries:["greek marble statue fog","foggy mountain peak solo","solitary figure silhouette","ancient ruins grayscale","calm lake dawn mist"], accent:"9E9E9E", mode:"typography" },
  quotes:          { queries:["warm sunset window light","cozy coffee shop bokeh","soft golden hour bokeh","minimalist desk aesthetic","golden hour nature calm"], accent:"FFC107", mode:"typography" },
  businesslessons: { queries:["office skyscraper glass day","business handshake meeting","stock chart growth green","city skyline day bright","modern office interior clean"], accent:"2196F3", mode:"typography" },
  storytelling:    { queries:["dark forest fog cinematic","abandoned house mystery","rainy window noir light","candle shadow mystery room","old library books dust"], accent:"CC44FF", mode:"typography" },
  startupstories:  { queries:["startup office coding night","tech team collaboration","laptop coding screen glow","silicon valley office modern","entrepreneur pitch meeting"], accent:"00BCD4", mode:"cinematic" },
  luxury:          { queries:["luxury car night city","gold watch closeup shine","private jet interior","luxury yacht ocean sunset","designer fashion runway"], accent:"FFD700", mode:"cinematic" },
  history:         { queries:["ancient ruins fog cinematic","historical battlefield mist","old map parchment closeup","ancient columns architecture","vintage photograph archive"], accent:"C08552", mode:"cinematic" },
  pov:             { queries:["neon cyberpunk city pov","first person immersive neon","futuristic hallway neon glow","synth wave grid horizon","neon rain city night"], accent:"00FFFF", mode:"ai" },
  horror:          { queries:["haunted house dark fog","horror corridor shadow red","graveyard night mist","dark door shadow horror","scary forest night fog"], accent:"FF0000", mode:"ai" },
  ainews:          { queries:["news studio broadcast blue","breaking news graphic digital","world map digital glow","newsroom desk lights blue","digital news ticker screen"], accent:"0057FF", mode:"ai" },
  general:         { queries:["cinematic aerial drone sunset","epic mountains golden","urban city timelapse","beautiful nature light","dramatic sky clouds"], accent:"FF4081", mode:"cinematic" },
};

// --- HELPERS ----------------------------------------------------------------
function safeT(t, max) {
  return (t||"").replace(/['"\\:<>|*?]/g,"").replace(/[^\x20-\x7E]/g," ").slice(0,max||50).trim()||"";
}

async function dl(url, dest) {
  try {
    const r = await fetch(url, { headers:{"User-Agent":"Mozilla/5.0"}, signal:AbortSignal.timeout(45000) });
    if (!r.ok) return false;
    const { writeFileSync:wf, statSync:ss } = await import("fs");
    wf(dest, Buffer.from(await r.arrayBuffer()));
    return ss(dest).size > 50000;
  } catch { return false; }
}

async function translateToHindi(text) {
  if (!text || text.length < 3) return text;
  const hr = (text.match(/[\u0900-\u097F]/g)||[]).length / (text.replace(/\s/g,"").length||1);
  if (hr > 0.25) return text;
  try {
    const chunks = text.match(/.{1,400}/gs) || [text];
    const out = [];
    for (const chunk of chunks) {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q=${encodeURIComponent(chunk)}`,
        { headers:{"User-Agent":"Mozilla/5.0"}, signal:AbortSignal.timeout(10000) }
      );
      if (!res.ok) { out.push(chunk); continue; }
      const data = await res.json();
      out.push((data[0]||[]).map(d=>d?.[0]||"").join("") || chunk);
    }
    const final = out.join(" ");
    console.log(`ðŸ’¬ Hindi: "${final.slice(0,60)}..."`);
    return final;
  } catch { return text; }
}

function generateASS(script, dur, isShorts) {
  if (!script || script.length < 5) return null;
  const words = script.replace(/\[.*?\]/g,"").replace(/\*\*/g,"").replace(/#+\s/g,"").replace(/\n+/g," ").trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  const sz = isShorts ? 3 : 4;
  const chunks = [];
  for (let i = 0; i < words.length; i += sz) chunks.push(words.slice(i, i+sz).join(" "));
  const dp = dur / chunks.length;
  const fs = isShorts ? 80 : 58, mv = isShorts ? 180 : 100;
  const H = `[Script Info]
ScriptType: v4.00+
PlayResX: ${isShorts?1080:1920}
PlayResY: ${isShorts?1920:1080}
WrapStyle: 1

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Arial,${fs},&H000000FF,&H000000FF,&H00000000,&HB4000000,1,0,0,0,100,100,0,0,3,5,3,2,30,30,${mv},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const fmt = s => {
    const h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=Math.floor(s%60), cs=Math.floor((s%1)*100);
    return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}.${String(cs).padStart(2,"0")}`;
  };
  const lines = chunks.map((chunk,i) => {
    const s=i*dp, e=Math.min((i+1)*dp-0.05,dur);
    return `Dialogue: 0,${fmt(s)},${fmt(e)},Main,,0,0,0,,{\\fscx115\\fscy115\\t(0,120,\\fscx100\\fscy100)}${chunk}`;
  }).join("\n");
  return H + lines + "\n";
}

async function generateAIImagePollinations(prompt, destPath, W, H) {
  try {
    console.log("ðŸŽ¨ Pollinations.ai generating...");
    const width  = W === 1080 ? 1080 : 1920;
    const height = H === 1920 ? 1920 : 1080;
    const clean  = encodeURIComponent((prompt || "cinematic background dramatic lighting 4k").slice(0,200));
    const url    = `https://image.pollinations.ai/prompt/${clean}?width=${width}&height=${height}&nologo=true&enhance=true`;
    const res    = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) { console.log("  Pollinations:", res.status); return false; }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("image")) { console.log("  Non-image response"); return false; }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 5000) {
      const { writeFileSync:wf } = await import("fs");
      wf(destPath, buf);
      console.log(`âœ… Pollinations OK: ${(buf.length/1024).toFixed(0)}KB`);
      return true;
    }
  } catch(e) { console.log("  Pollinations err:", e.message.slice(0,60)); }
  return false;
}

async function generateAIImageReplicate(prompt, destPath) {
  const KEY = process.env.REPLICATE_API_KEY;
  if (!KEY) return false;
  try {
    const cr = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
      method:"POST",
      headers:{"Authorization":`Token ${KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({ input:{ prompt:safeT(prompt,200)||"cinematic 4k", num_outputs:1 } }),
      signal:AbortSignal.timeout(30000),
    });
    if (!cr.ok) return false;
    const pred = await cr.json();
    if (!pred.id) return false;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
        headers:{"Authorization":`Token ${KEY}`}, signal:AbortSignal.timeout(10000)
      });
      const res = await poll.json();
      if (res.status==="succeeded" && res.output?.[0]) {
        const ok = await dl(res.output[0], destPath);
        if (ok) { console.log("âœ… Replicate OK"); return true; }
        return false;
      }
      if (res.status==="failed") return false;
    }
  } catch(e) { console.log("Replicate err:", e.message.slice(0,40)); }
  return false;
}

// --- MAIN HANDLER -----------------------------------------------------------
export async function POST(request) {
  try {
    let { audioUrl, thumbnailUrl, title, script, hook, videoType="long", category="general", videoMode } = await request.json();

    const storageDir = path.join(process.cwd(), "storage");
    for (const d of ["videos","temp","thumbnails","music","clips","subtitles","ai_bg"]) {
      const p = path.join(storageDir, d);
      if (!existsSync(p)) await mkdir(p, { recursive:true });
    }

    const videoId  = `video_${Date.now()}`;
        const catKey = category.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // THE 3 PILLAR EMPIRE LOGIC
    const typographyCats = ["psychology", "motivation", "stoicism", "quotes", "businesslessons", "storytelling"];
    const cinematicCats = ["startupstories", "businessdocumentary", "history", "luxury", "travel", "emotionalstories"];
    const aiCats = ["pov", "characterseries", "historical", "documentary", "horror", "fantasy", "animation", "aiinfluencer", "ainews"];
    
    let mode = "cinematic"; // Default to Pexels
    if (typographyCats.includes(catKey)) mode = "typography";
    else if (aiCats.includes(catKey)) mode = "ai";

    const conf     = CAT[catKey] || CAT.general;
    const isShorts = videoType==="shorts" || catKey==="shorts";
    const W = isShorts ? 1080 : 1920;
    const H = isShorts ? 1920 : 1080;
    mode = videoMode || mode;
    console.log(`ðŸŽ¬ [${catKey}] ${isShorts?"SHORTS":"LANDSCAPE"} | MODE:${mode.toUpperCase()}`);

    let hindiScript = script || hook || title || "";
    if (hindiScript.length > 5) hindiScript = await translateToHindi(hindiScript);

    const audioPath = path.join(storageDir, "temp", `${videoId}_audio.mp3`);
    if (audioUrl) {
      const al = path.join(storageDir, "audio", audioUrl.split("/").pop());
      if (existsSync(al)) await copyFile(al, audioPath);
    }
    if (!existsSync(audioPath)) {
      try { await execAsync(`"${FFMPEG}" -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "${audioPath}"`, { timeout:30000, env:ENV }); } catch {}
    }

    const thumbPath = path.join(storageDir, "temp", `${videoId}_thumb.jpg`);
    if (thumbnailUrl) {
      const tl = path.join(storageDir, "thumbnails", thumbnailUrl.split("/").pop());
      if (existsSync(tl)) await copyFile(tl, thumbPath);
    }
    if (!existsSync(thumbPath)) {
      const jpgs = (await readdir(path.join(storageDir,"thumbnails")).catch(()=>[])).filter(f=>f.endsWith(".jpg")).sort().reverse();
      if (jpgs.length) await copyFile(path.join(storageDir,"thumbnails",jpgs[0]), thumbPath);
    }

    let audioDuration = 60;
    try {
      const { stdout } = await execAsync(`"${FFPROBE}" -v quiet -print_format json -show_streams "${audioPath}"`, { timeout:15000, env:ENV });
      audioDuration = Math.ceil(parseFloat(JSON.parse(stdout).streams[0]?.duration || "60"));
    } catch {}
    console.log(`â± Duration: ${audioDuration}s`);
    const effectiveDuration = isShorts ? Math.min(audioDuration, 58) : audioDuration;

    const mixedPath = path.join(storageDir, "temp", `${videoId}_mix.mp3`);
    try {
      const { getBgMusic, mixVoiceWithMusic } = await import("./music-helper.js");
      const musicPath = await getBgMusic(catKey, effectiveDuration, storageDir);
      if (musicPath) {
        const mixed = await mixVoiceWithMusic(audioPath, musicPath, mixedPath, effectiveDuration);
        if (!mixed) await copyFile(audioPath, mixedPath);
        else console.log("ðŸŽµ BG music mixed");
      } else {
        await copyFile(audioPath, mixedPath);
      }
    } catch(e) {
      await copyFile(audioPath, mixedPath);
    }

    const assPath    = path.join(storageDir, "subtitles", `${videoId}.ass`);
    const assContent = generateASS(hindiScript, effectiveDuration, isShorts);
    let hasSubs = false;
    if (assContent) { await writeFile(assPath, assContent, "utf8"); hasSubs = true; console.log("ðŸ“ ASS subtitles ready"); }
    const assPathFwd = hasSubs ? assPath.replace(/\\/g,"/").replace(/:/g,"\\:") : null;

    const aiBgPath   = path.join(storageDir, "ai_bg", `${videoId}_bg.jpg`);
    const aiBgCached = path.join(storageDir, "ai_bg", `bg_${catKey}.jpg`);
    let hasAIBg = false;
    if (existsSync(aiBgCached)) {
      await copyFile(aiBgCached, aiBgPath);
      hasAIBg = true;
    } else {
      const aiPrompt = `${conf.queries[Math.floor(Math.random()*conf.queries.length)]}, ${catKey} theme, ultra detailed, cinematic lighting, 8k, photorealistic`;
      hasAIBg = await generateAIImageReplicate(aiPrompt, aiBgPath);
      if (!hasAIBg) hasAIBg = await generateAIImagePollinations(aiPrompt, aiBgPath, W, H);
      if (hasAIBg) { await copyFile(aiBgPath, aiBgCached); }
    }

    let clips = [];
    const pKey = process.env.PEXELS_API_KEY;
    if (pKey && mode === "cinematic") {
      const queries = conf.queries || [];
      let ci = 0;
      for (let qi = 0; qi < queries.length && clips.length < 7; qi++) {
        try {
          const q = queries[qi], ori = isShorts ? "portrait" : "landscape";
          const pr = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=10&page=${Math.floor(Math.random()*5)+1}&orientation=${ori}&size=medium`,
            { headers:{ Authorization:pKey }, signal:AbortSignal.timeout(12000) }
          );
          if (!pr.ok) continue;
          const pd = await pr.json();
          for (const v of (pd.videos||[]).slice(0,2)) {
            if (clips.length >= 7) break;
            const f = v.video_files?.find(f=>f.quality==="hd"&&f.width<=1920) || v.video_files?.find(f=>f.quality==="sd") || v.video_files?.[0];
            if (!f?.link) continue;
            const cp = path.join(storageDir, "clips", `clip_${videoId}_${ci}.mp4`);
            if (await dl(f.link, cp)) { clips.push({ path:cp, duration:v.duration }); ci++; }
          }
        } catch {}
      }
    }

    const ac = "0x" + conf.accent;
    const barH = isShorts ? 6 : 5;
    const progressVf = `drawbox=x=0:y=h-${barH}:w=iw*t/${effectiveDuration}:h=${barH}:color=${ac}@1.0:t=fill`;
    const topBarVf   = `drawbox=x=0:y=0:w=iw:h=4:color=${ac}@1.0:t=fill`;
    const scaleVf    = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
    const colorGrade = "eq=contrast=1.15:saturation=1.25:brightness=0.02";
    const baseVf     = `${scaleVf},fps=30,${colorGrade},${topBarVf},${progressVf}`;
    const fullVf     = hasSubs ? `${baseVf},ass='${assPathFwd}'` : baseVf;

    const cropMotions = [
      [0.88, 0.88, "0",        "0"],
      [0.90, 0.90, "iw*0.10",  "0"],
      [0.88, 0.88, "iw*0.06",  "ih*0.06"],
      [0.90, 0.90, "0",        "ih*0.10"],
      [0.85, 0.85, "iw*0.075", "ih*0.075"],
      [0.90, 0.88, "iw*0.10",  "ih*0.06"],
      [0.88, 0.90, "0",        "ih*0.05"],
    ];

    // PRO LEVEL FIX: Faster preset for CPU (saves massive time)
    const encArgs = `-c:v libx264 -preset veryfast -crf 26 -maxrate 2500k -bufsize 5000k -c:a aac -b:a 128k -pix_fmt yuv420p -movflags +faststart`;
    const clipCrf = 28;

    const processed = [];
    let concatTxt = "";
    const segLen = clips.length > 0 ? Math.max(4, Math.ceil(effectiveDuration/clips.length)) : effectiveDuration;

    // PRO LEVEL FIX: Parallel Clip Processing
    if (clips.length >= 2 && mode !== "typography") {
      console.log(`ðŸš€ Processing ${clips.length} clips parallelly... (SPEED BOOST ENABLED)`);
      
      const processPromises = clips.map(async (clip, i) => {
        const proc = path.join(storageDir, "temp", `${videoId}_p${i}.mp4`);
        const [cw,ch,cx,cy] = cropMotions[i % cropMotions.length];
        const clipVf = `crop=iw*${cw}:ih*${ch}:${cx}:${cy},scale=${W}:${H}:force_original_aspect_ratio=disable,setsar=1,fps=30,setpts=0.88*PTS,${colorGrade}`;
        
        try {
          // Using ultrafast for intermediate processing
          await execAsync(
            `"${FFMPEG}" -y -i "${clip.path}" -t ${segLen} -vf "${clipVf}" -c:v libx264 -preset ultrafast -crf ${clipCrf} -an "${proc}"`,
            { timeout:200000, env:ENV }
          );
          if (existsSync(proc) && statSync(proc).size > 5000) {
            return { path: proc, index: i };
          }
        } catch(e) {
          console.log(`   âŒ Clip ${i+1} err:`, e.message.slice(0,60));
        }
        return null;
      });

      const results = (await Promise.all(processPromises)).filter(Boolean).sort((a, b) => a.index - b.index);
      
      results.forEach(res => {
        processed.push(res.path);
        concatTxt += `file '${res.path.split("\\").join("/")}'\n`;
      });
    }

    const outputPath = path.join(storageDir, "videos", `${videoId}.mp4`);
    let success = false;

    // -- Render A: clips concat ----------------------------------------------
    if (processed.length >= 2) {
      const cf = path.join(storageDir, "temp", `${videoId}_list.txt`);
      await writeFile(cf, concatTxt);
      try {
        await execAsync(
          `"${FFMPEG}" -y -f concat -safe 0 -i "${cf}" -i "${mixedPath}" -vf "${fullVf}" ${encArgs} -t ${effectiveDuration} "${outputPath}"`,
          { timeout:900000, env:ENV }
        );
        success = existsSync(outputPath) && statSync(outputPath).size > 100000;
        if (success) console.log(`âœ… Render A: ${processed.length} clips + captions`);
      } catch(e) {
        console.log("Render A err:", e.message.slice(0,100));
      }
    }

    // -- Render T: Typography ------------------------------------------------
    if (!success && mode === "typography") {
      try {
        const { renderTypographyVideo } = await import("./typography-helper.js");
        success = await renderTypographyVideo(hindiScript, title, catKey, W, H, effectiveDuration, mixedPath, outputPath, conf, storageDir, videoId);
        if (success) console.log("âœ… Render T: typography");
      } catch(e) { console.log("Typography err:", e.message.slice(0,80)); }
    }

    // -- Render Kling: Real AI video generation ----------------------------------
if (!success && mode === "ai") {
  try {
    const { renderKlingVideo } = await import("./kling-video-helper.js");
    success = await renderKlingVideo(hindiScript, title, catKey, W, H, effectiveDuration, mixedPath, outputPath, conf, storageDir, videoId);
    if (success) console.log("Render Kling: success");
  } catch(e) { console.log("Kling err:", e.message.slice(0,100)); }
}

// -- Render AI: Multi-scene AI video ----------------------------------------
if (!success && mode === "ai") {
  try {
    const { renderAISceneVideo } = await import("./ai-scene-helper.js");
    success = await renderAISceneVideo(hindiScript, title, catKey, W, H, effectiveDuration, mixedPath, outputPath, conf, storageDir, videoId);
    if (success) console.log("Render AI: multi-scene success");
  } catch(e) { console.log("AI Scene err:", e.message.slice(0,100)); }
}

// -- Render B: BG image fallback -----------------------------------------
    if (!success) {
      const bgImg = existsSync(aiBgPath) ? aiBgPath : (existsSync(thumbPath) ? thumbPath : null);
      if (bgImg) {
        const zoomBg = `zoompan=z='min(zoom+0.0003,1.04)':d=${effectiveDuration*25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;
        const bgVf   = `${zoomBg},${scaleVf},fps=25,${colorGrade},${topBarVf},${progressVf}${hasSubs?",ass='"+assPathFwd+"'":""}`;
        try {
          await execAsync(
            `"${FFMPEG}" -y -loop 1 -i "${bgImg}" -i "${mixedPath}" -vf "${bgVf}" ${encArgs} -tune stillimage -t ${effectiveDuration} "${outputPath}"`,
            { timeout:300000, env:ENV }
          );
          success = existsSync(outputPath) && statSync(outputPath).size > 50000;
        } catch(e) {}
      }
    }

    if (!success) throw new Error("All renders failed");

    for (const c of clips) { try { await unlink(c.path); } catch {} }

    const vSize = statSync(outputPath).size;
    console.log(`ðŸŽ‰ DONE: ${(vSize/1024/1024).toFixed(1)}MB | Segs:${processed.length}`);

    // Auto Shorts - PRO FIX: Uses ultrafast preset
    let shortsUrl = null;
    if (!isShorts && effectiveDuration > 10) {
      const sd  = Math.min(effectiveDuration, 58);
      const sp  = path.join(storageDir, "videos", `${videoId}_shorts.mp4`);
      const sVf = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30`;
      try {
        await execAsync(
          `"${FFMPEG}" -y -i "${outputPath}" -t ${sd} -vf "${sVf}" -c:v libx264 -preset ultrafast -crf 26 -c:a aac -b:a 128k -pix_fmt yuv420p -movflags +faststart "${sp}"`,
          { timeout:300000, env:ENV }
        );
        if (existsSync(sp) && statSync(sp).size > 50000) {
          shortsUrl = `/storage/videos/${videoId}_shorts.mp4`;
        }
      } catch(e) {}
    }

    return NextResponse.json({
      success: true,
      videoId,
      videoUrl:    `/storage/videos/${videoId}.mp4`,
      shortsUrl,
      videoType:   isShorts ? "shorts" : "long",
      videoMode:   mode,
      duration:    effectiveDuration,
      message:     `âœ… Video Generated Fast!`,
    });

  } catch(error) {
    console.error("âŒ Error:", error.message);
    return NextResponse.json({ error: error.message }, { status:500 });
  }
}




