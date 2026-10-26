// app/api/video/generate/route.js
// v6.1 - Master Multi-Category, AI Scene & Typography Helper Integrated

import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, copyFile, unlink } from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";

const execAsync = promisify(exec);
const FFMPEG = process.platform === "win32" ? "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe" : "ffmpeg";
const FFPROBE = process.platform === "win32" ? "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffprobe.exe" : "ffprobe";
const ENV = process.platform === "win32" ? { ...process.env, FONTCONFIG_FILE: "C:/fontconfig/fonts.conf", FONTCONFIG_PATH: "C:/fontconfig" } : { ...process.env };

const CAT = {
  cinematic:   { queries:["dark rain luxury suit man","greek statue fire cinematic","luxury car steering night"], accent:"FF0000", mode:"cinematic" },
  fakes:       { queries:["minecraft parkour gameplay","gta v ramp jump","subway surfers satisfying"], accent:"FFD700", mode:"typography" },
  mysteries:   { queries:["scary forest red eyes","pyramid night glowing","space black hole 4k"], accent:"CC44FF", mode:"cinematic" },
  brainrot:    { queries:["kinetic sand cutting asmr","hydraulic press satisfying","subway surfers gameplay"], accent:"00FF88", mode:"split" },
  quiz:        { queries:["countdown timer clock","trivia gameshow neon","world map flag quiz"], accent:"00E5FF", mode:"quiz" },
  avatar:      { queries:["news anchor studio holographic","tech review studio futuristic"], accent:"00E676", mode:"cinematic" },
  facts:       { queries:["space galaxy nebula cinematic","science lab neon blue"], accent:"00E5FF", mode:"cinematic" },
  motivation:  { queries:["athlete sunrise mountain epic","champion victory slow motion"], accent:"FF6D00", mode:"cinematic" },
  tech:        { queries:["holographic AI robot neon blue","cyberpunk city rain neon"], accent:"00FF88", mode:"cinematic" },
  story:       { queries:["dark forest fog cinematic","abandoned house mystery"], accent:"CC44FF", mode:"typography" },
  horror:      { queries:["haunted house dark fog","horror corridor shadow"], accent:"FF0000", mode:"typography" },
  finance:     { queries:["stock market charts gold","gold coins wealth luxury"], accent:"FFD700", mode:"cinematic" },
  general:     { queries:["cinematic aerial drone sunset","epic mountains golden"], accent:"FF4081", mode:"cinematic" }
};

async function dl(url, dest) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(45000) });
    if (!r.ok) return false;
    const { writeFileSync: wf, statSync: ss } = await import("fs");
    wf(dest, Buffer.from(await r.arrayBuffer()));
    return ss(dest).size > 50000;
  } catch { return false; }
}

async function translateToHindi(text) {
  if (!text || text.length < 3) return text;
  const hr = (text.match(/[\u0900-\u097F]/g) || []).length / (text.replace(/\s/g, "").length || 1);
  if (hr > 0.25) return text;
  try {
    const chunks = text.match(/.{1,400}/gs) || [text];
    const out = [];
    for (const chunk of chunks) {
      const res = await fetch(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q=" + encodeURIComponent(chunk),
        { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) { out.push(chunk); continue; }
      const data = await res.json();
      out.push((data[0] || []).map((d) => d?.[0] || "").join("") || chunk);
    }
    return out.join(" ");
  } catch { return text; }
}

function generateASS(script, dur, isShorts, category = "general") {
  if (!script || script.length < 5) return null;
  const words = script.replace(/\[.*?\]/g, "").replace(/\*\*/g, "").replace(/#+\s/g, "").replace(/\n+/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  const sz = isShorts ? 2 : 4;
  const chunks = [];
  for (let i = 0; i < words.length; i += sz) chunks.push(words.slice(i, i + sz).join(" "));
  const dp = dur / chunks.length;
  const fs = isShorts ? 85 : 60, mv = isShorts ? 200 : 110;
  
  const fmt = function(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), cs = Math.floor((s % 1) * 100);
    return h + ":" + String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0") + "." + String(cs).padStart(2, "0");
  };

  const fontName = category === "cinematic" ? "Playfair Display" : "Poppins-Black";
  const primaryColor = category === "cinematic" ? "&H00FFFFFF" : "&H0000FFFF";

  let ass = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${isShorts ? 1080 : 1920}\nPlayResY: ${isShorts ? 1920 : 1080}\nWrapStyle: 1\n\n`;
  ass += "[V4+ Styles]\n";
  ass += "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n";
  ass += `Style: Main,${fontName},${fs},${primaryColor},&H000000FF,&H00000000,&HB4000000,1,0,0,0,100,100,0,0,3,6,4,2,30,30,${mv},1\n`;
  ass += "\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";
  
  const lines = chunks.map(function(chunk, i) {
    const start = i * dp, end = Math.min((i + 1) * dp - 0.05, dur);
    const text = "{\\fscx120\\fscy120\\t(0,100,\\fscx100\\fscy100)}" + chunk.toUpperCase();
    return "Dialogue: 0," + fmt(start) + "," + fmt(end) + ",Main,,0,0,0,," + text;
  }).join("\n");
  
  return ass + lines + "\n";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { audioUrl, title, script, hook, videoType = "long", category = "general", videoMode } = body;

    const storageDir = path.join(process.cwd(), "storage");
    for (const d of ["videos", "temp", "thumbnails", "music", "clips", "subtitles", "ai_bg"]) {
      const p = path.join(storageDir, d);
      if (!existsSync(p)) await mkdir(p, { recursive: true });
    }

    const videoId = "video_" + Date.now();
    const catKey = (category || "general").toLowerCase().replace(/[^a-z]/g, "");
    const conf = CAT[catKey] || CAT.general;
    const isShorts = videoType === "shorts" || catKey === "shorts" || catKey === "brainrot" || catKey === "fakes";
    const W = isShorts ? 1080 : 1920;
    const H = isShorts ? 1920 : 1080;
    const mode = videoMode || conf.mode || "cinematic";

    let hindiScript = script || hook || title || "";
    if (hindiScript.length > 5 && body.language === "hi") hindiScript = await translateToHindi(hindiScript);

    const audioPath = path.join(storageDir, "temp", videoId + "_audio.mp3");
    if (audioUrl) {
      const al = path.join(storageDir, "audio", audioUrl.split("/").pop());
      if (existsSync(al)) await copyFile(al, audioPath);
    }
    if (!existsSync(audioPath)) {
      try { await execAsync('"' + FFMPEG + '" -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 45 -q:a 9 -acodec libmp3lame "' + audioPath + '"', { timeout: 30000, env: ENV }); } catch (e) {}
    }

    let audioDuration = 45;
    try {
      const r = await execAsync('"' + FFPROBE + '" -v quiet -print_format json -show_streams "' + audioPath + '"', { timeout: 15000, env: ENV });
      audioDuration = Math.ceil(parseFloat(JSON.parse(r.stdout).streams[0]?.duration || "45"));
    } catch (e) {}
    const effectiveDuration = isShorts ? Math.min(audioDuration, 58) : audioDuration;

    const mixedPath = path.join(storageDir, "temp", videoId + "_mix.mp3");
    try {
      const { getBgMusic, mixVoiceWithMusic } = await import("./music-helper.js");
      const musicPath = await getBgMusic(catKey, effectiveDuration, storageDir);
      if (musicPath) {
        const mixed = await mixVoiceWithMusic(audioPath, musicPath, mixedPath, effectiveDuration);
        if (!mixed) await copyFile(audioPath, mixedPath);
      } else {
        await copyFile(audioPath, mixedPath);
      }
    } catch (e) {
      await copyFile(audioPath, mixedPath);
    }

    const outputPath = path.join(storageDir, "videos", videoId + ".mp4");
    let success = false;

    // Route Option A: Typography Mode
    if (mode === "typography") {
      try {
        const { renderTypographyVideo } = await import("./typography-helper.js");
        success = await renderTypographyVideo(hindiScript, title, catKey, W, H, effectiveDuration, mixedPath, outputPath, conf, process.cwd(), videoId);
      } catch (e) { console.log("Typography Mode error:", e.message); }
    }

    // Route Option B: Multi-Scene AI Mode
    if (!success && (mode === "ai_scene" || mode === "cinematic")) {
      try {
        const { renderAISceneVideo } = await import("./ai-scene-helper.js");
        success = await renderAISceneVideo(hindiScript, title, catKey, W, H, effectiveDuration, mixedPath, outputPath, conf, storageDir, videoId);
      } catch (e) { console.log("AI Scene Mode error:", e.message); }
    }

    // Route Option C: Pexels Stock Clips Mode
    const assPath = path.join(storageDir, "subtitles", videoId + ".ass");
    const assContent = generateASS(hindiScript, effectiveDuration, isShorts, catKey);
    let hasSubs = false;
    if (assContent) {
      await writeFile(assPath, assContent, "utf8");
      hasSubs = true;
    }
    const assPathFwd = hasSubs ? assPath.replace(/\\/g, "/").replace(/:/g, "\\:") : null;

    if (!success) {
      let clips = [];
      const pKey = process.env.PEXELS_API_KEY;
      if (pKey) {
        const queries = conf.queries || [];
        let ci = 0;
        for (let qi = 0; qi < queries.length && clips.length < 5; qi++) {
          try {
            const q = queries[qi];
            const ori = isShorts ? "portrait" : "landscape";
            const pr = await fetch(
              "https://api.pexels.com/videos/search?query=" + encodeURIComponent(q) + "&per_page=3&orientation=" + ori + "&size=medium",
              { headers: { Authorization: pKey }, signal: AbortSignal.timeout(12000) }
            );
            if (!pr.ok) continue;
            const pd = await pr.json();
            for (const v of (pd.videos || []).slice(0, 2)) {
              if (clips.length >= 5) break;
              const f = v.video_files?.find(function(f) { return f.quality === "hd" && f.width <= 1920; }) || v.video_files?.[0];
              if (!f?.link) continue;
              const cp = path.join(storageDir, "clips", "clip_" + videoId + "_" + ci + ".mp4");
              if (await dl(f.link, cp)) {
                clips.push({ path: cp, duration: v.duration });
                ci++;
              }
            }
          } catch (e) {}
        }
      }

      const ac = "0x" + conf.accent;
      const barH = isShorts ? 6 : 5;
      const scaleVf = "scale=" + W + ":" + H + ":force_original_aspect_ratio=decrease,pad=" + W + ":" + H + ":(ow-iw)/2:(oh-ih)/2,setsar=1";
      const progress = "drawbox=x=0:y=h-" + barH + ":w=iw*t/" + effectiveDuration + ":h=" + barH + ":color=" + ac + "@1.0:t=fill";
      const topBar = "drawbox=x=0:y=0:w=iw:h=4:color=" + ac + "@1.0:t=fill";
      const colorGrade = catKey === "cinematic" ? "eq=contrast=1.3:saturation=0.7:brightness=-0.05" : "eq=contrast=1.2:saturation=1.3:brightness=0.02";
      const baseVf = scaleVf + ",fps=30," + colorGrade + "," + topBar + "," + progress;
      const fullVf = hasSubs ? baseVf + ",ass='" + assPathFwd + "'" : baseVf;
      const encArgs = "-c:v libx264 -preset ultrafast -crf 20 -c:a aac -b:a 192k -pix_fmt yuv420p -movflags +faststart";

      if (clips.length >= 1) {
        try {
          const firstClip = clips[0].path;
          await execAsync('"' + FFMPEG + '" -y -i "' + firstClip + '" -i "' + mixedPath + '" -vf "' + fullVf + '" ' + encArgs + ' -t ' + effectiveDuration + ' "' + outputPath + '"', { timeout: 180000, env: ENV });
          success = existsSync(outputPath) && statSync(outputPath).size > 50000;
        } catch (e) {
          console.log("Primary Pexels render err:", e.message);
        }
      }

      // Fallback Black Canvas Render (Clean FFmpeg Syntax)
      if (!success) {
        try {
          const fallbackVf = hasSubs ? "scale=" + W + ":" + H + ",ass='" + assPathFwd + "'" : "scale=" + W + ":" + H;
          await execAsync('"' + FFMPEG + '" -y -f lavfi -i "color=black:size=' + W + 'x' + H + ':rate=25" -i "' + mixedPath + '" -vf "' + fallbackVf + '" ' + encArgs + ' -t ' + effectiveDuration + ' "' + outputPath + '"', { timeout: 120000, env: ENV });
          success = existsSync(outputPath) && statSync(outputPath).size > 10000;
        } catch (e) { console.log("Fallback canvas render err:", e.message); }
      }

      for (const c of clips) { try { await unlink(c.path); } catch (e) {} }
    }

    if (!success) throw new Error("Video rendering pipeline failed across all engines");

    const vSize = statSync(outputPath).size;

    return NextResponse.json({
      success: true,
      videoId,
      videoUrl: "/storage/videos/" + videoId + ".mp4",
      videoType: isShorts ? "shorts" : "long",
      videoMode: mode,
      duration: effectiveDuration,
      hasCaptions: hasSubs,
      message: "Rendered: " + (vSize / 1024 / 1024).toFixed(1) + "MB | " + catKey,
    });

  } catch (error) {
    console.error("Generator Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
