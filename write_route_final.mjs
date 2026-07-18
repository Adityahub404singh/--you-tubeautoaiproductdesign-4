import { writeFileSync } from 'fs';

const code = `// app/api/video/generate/route.js
// v5.2 - Fixed all parse errors

import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, copyFile, readdir, unlink } from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";

const execAsync = promisify(exec);
const FFMPEG  = "C:\\\\Users\\\\alc\\\\AppData\\\\Local\\\\Microsoft\\\\WinGet\\\\Packages\\\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\\\ffmpeg-8.1-full_build\\\\bin\\\\ffmpeg.exe";
const FFPROBE = "C:\\\\Users\\\\alc\\\\AppData\\\\Local\\\\Microsoft\\\\WinGet\\\\Packages\\\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\\\ffmpeg-8.1-full_build\\\\bin\\\\ffprobe.exe";
const ENV = { ...process.env, FONTCONFIG_FILE: "C:/fontconfig/fonts.conf", FONTCONFIG_PATH: "C:/fontconfig" };

const CAT = {
  facts:      { queries:["space galaxy nebula cinematic","science lab neon blue","ancient ruins fog","underwater bioluminescent","brain neurons purple"],      accent:"00E5FF", mode:"cinematic" },
  motivation: { queries:["athlete sunrise mountain epic","champion victory slow motion","hustle entrepreneur city","eagle freedom sunrise","fire determination"], accent:"FF6D00", mode:"cinematic" },
  tech:       { queries:["holographic AI robot neon blue","cyberpunk city rain neon","coding screen dark green","futuristic hologram blue","data stream matrix"],accent:"00FF88", mode:"cinematic" },
  story:      { queries:["dark forest fog cinematic","abandoned house mystery","rainy window noir","dramatic storm lightning","candle shadow mystery"],         accent:"CC44FF", mode:"typography" },
  top10:      { queries:["luxury gold success","world landmarks aerial","award trophy ceremony","countdown fireworks","dramatic reveal gold"],                  accent:"FFD700", mode:"cinematic" },
  shorts:     { queries:["viral neon energy explosion","trendy lifestyle social","street urban night neon","dynamic sport action","neon sign aesthetic"],       accent:"FF1744", mode:"cinematic" },
  horror:     { queries:["haunted house dark fog","horror corridor shadow","graveyard night mist","dark door shadow","scary forest night"],                    accent:"FF0000", mode:"typography" },
  finance:    { queries:["stock market charts gold","gold coins wealth luxury","bank skyscraper finance","business growth chart","investment luxury"],          accent:"FFD700", mode:"cinematic" },
  health:     { queries:["yoga meditation sunrise","fresh fruits vegetables","hospital modern clean","gym fitness workout","ayurveda herbs green"],             accent:"00E676", mode:"cinematic" },
  general:    { queries:["cinematic aerial drone sunset","epic mountains golden","urban city timelapse","beautiful nature light","dramatic sky clouds"],        accent:"FF4081", mode:"cinematic" },
};

function safeT(t, max) {
  return (t||"").replace(/['"\\\\:<>|*?]/g,"").replace(/[^\\x20-\\x7E]/g," ").slice(0,max||50).trim()||"";
}

async function dl(url, dest) {
  try {
    const r = await fetch(url,{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(45000)});
    if (!r.ok) return false;
    const {writeFileSync:wf,statSync:ss} = await import("fs");
    wf(dest, Buffer.from(await r.arrayBuffer()));
    return ss(dest).size > 50000;
  } catch { return false; }
}

async function translateToHindi(text) {
  if (!text||text.length<3) return text;
  const hr = (text.match(/[\\u0900-\\u097F]/g)||[]).length/(text.replace(/\\s/g,"").length||1);
  if (hr>0.25) return text;
  try {
    const chunks = text.match(/.{1,400}/gs)||[text];
    const out = [];
    for (const chunk of chunks) {
      const res = await fetch(
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=hi&dt=t&q="+encodeURIComponent(chunk),
        {headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(10000)}
      );
      if (!res.ok){out.push(chunk);continue;}
      const data = await res.json();
      out.push((data[0]||[]).map(function(d){return d?.[0]||"";}).join("")||chunk);
    }
    const final = out.join(" ");
    console.log("Hindi: "+final.slice(0,60)+"...");
    return final;
  } catch { return text; }
}

function generateASS(script, dur, isShorts) {
  if (!script||script.length<5) return null;
  const words = script.replace(/\\[.*?\\]/g,"").replace(/\\*\\*/g,"").replace(/#+\\s/g,"").replace(/\\n+/g," ").trim().split(/\\s+/).filter(Boolean);
  if (words.length<2) return null;
  const sz = isShorts?3:4;
  const chunks = [];
  for (let i=0;i<words.length;i+=sz) chunks.push(words.slice(i,i+sz).join(" "));
  const dp = dur/chunks.length;
  const fs = isShorts?80:58, mv = isShorts?180:100;
  const fmt = function(s) {
    const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.floor(s%60),cs=Math.floor((s%1)*100);
    return h+":"+String(m).padStart(2,"0")+":"+String(sec).padStart(2,"0")+"."+String(cs).padStart(2,"0");
  };
  let ass = "[Script Info]\\nScriptType: v4.00+\\nPlayResX: "+(isShorts?1080:1920)+"\\nPlayResY: "+(isShorts?1920:1080)+"\\nWrapStyle: 1\\n\\n";
  ass += "[V4+ Styles]\\n";
  ass += "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\\n";
  ass += "Style: Main,Arial,"+fs+",&H000000FF,&H000000FF,&H00000000,&HB4000000,1,0,0,0,100,100,0,0,3,5,3,2,30,30,"+mv+",1\\n";
  ass += "\\n[Events]\\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\\n";
  const lines = chunks.map(function(chunk,i) {
    const start=i*dp, end=Math.min((i+1)*dp-0.05,dur);
    const text = "{\\\\fscx115\\\\fscy115\\\\t(0,120,\\\\fscx100\\\\fscy100)}"+chunk;
    return "Dialogue: 0,"+fmt(start)+","+fmt(end)+",Main,,0,0,0,,"+text;
  }).join("\\n");
  return ass+lines+"\\n";
}

async function generateAIImagePollinations(prompt, destPath, W, H) {
  try {
    console.log("Pollinations.ai...");
    const w = W===1080?1080:1920, h = H===1920?1920:1080;
    const url = "https://image.pollinations.ai/prompt/"+encodeURIComponent((prompt||"cinematic 4k").slice(0,200))+"?width="+w+"&height="+h+"&nologo=true&enhance=true";
    const res = await fetch(url,{signal:AbortSignal.timeout(60000)});
    if (!res.ok) return false;
    const ct = res.headers.get("content-type")||"";
    if (!ct.includes("image")) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length>5000) {
      const {writeFileSync:wf}=await import("fs");
      wf(destPath,buf);
      console.log("Pollinations OK: "+(buf.length/1024).toFixed(0)+"KB");
      return true;
    }
  } catch(e) { console.log("Pollinations err:",e.message.slice(0,60)); }
  return false;
}

async function generateAIImageReplicate(prompt, destPath) {
  const KEY = process.env.REPLICATE_API_KEY;
  if (!KEY) return false;
  try {
    const cr = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",{
      method:"POST",headers:{"Authorization":"Token "+KEY,"Content-Type":"application/json"},
      body:JSON.stringify({input:{prompt:safeT(prompt,200)||"cinematic 4k",num_outputs:1}}),
      signal:AbortSignal.timeout(30000),
    });
    if (!cr.ok) return false;
    const pred = await cr.json();
    if (!pred.id) return false;
    for (let i=0;i<30;i++) {
      await new Promise(function(r){setTimeout(r,3000);});
      const poll = await fetch("https://api.replicate.com/v1/predictions/"+pred.id,{headers:{"Authorization":"Token "+KEY},signal:AbortSignal.timeout(10000)});
      const res = await poll.json();
      if (res.status==="succeeded"&&res.output?.[0]) {
        const ok = await dl(res.output[0],destPath);
        if (ok){console.log("Replicate OK");return true;}
        return false;
      }
      if (res.status==="failed") return false;
    }
  } catch(e) { console.log("Replicate err:",e.message.slice(0,40)); }
  return false;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const audioUrl     = body.audioUrl;
    const thumbnailUrl = body.thumbnailUrl;
    const title        = body.title;
    const script       = body.script;
    const hook         = body.hook;
    const videoType    = body.videoType||"long";
    const category     = body.category||"general";
    const videoMode    = body.videoMode;

    const storageDir = path.join(process.cwd(),"storage");
    for (const d of ["videos","temp","thumbnails","music","clips","subtitles","ai_bg"]) {
      const p = path.join(storageDir,d);
      if (!existsSync(p)) await mkdir(p,{recursive:true});
    }

    const videoId  = "video_"+Date.now();
    const catKey   = (category||"general").toLowerCase().replace(/[^a-z]/g,"");
    const conf     = CAT[catKey]||CAT.general;
    const isShorts = videoType==="shorts"||catKey==="shorts";
    const W = isShorts?1080:1920;
    const H = isShorts?1920:1080;
    const mode = videoMode||conf.mode||"cinematic";

    console.log(catKey+" | "+(isShorts?"SHORTS":"LANDSCAPE")+" | MODE:"+mode.toUpperCase());

    // Translate
    let hindiScript = script||hook||title||"";
    if (hindiScript.length>5) hindiScript = await translateToHindi(hindiScript);

    // Audio
    const audioPath = path.join(storageDir,"temp",videoId+"_audio.mp3");
    if (audioUrl) {
      const al = path.join(storageDir,"audio",audioUrl.split("/").pop());
      if (existsSync(al)) await copyFile(al,audioPath);
    }
    if (!existsSync(audioPath)) {
      try { await execAsync('"'+FFMPEG+'" -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "'+audioPath+'"',{timeout:30000,env:ENV}); } catch(e) {}
    }

    // Thumbnail
    const thumbPath = path.join(storageDir,"temp",videoId+"_thumb.jpg");
    if (thumbnailUrl) {
      const tl = path.join(storageDir,"thumbnails",thumbnailUrl.split("/").pop());
      if (existsSync(tl)) await copyFile(tl,thumbPath);
    }
    if (!existsSync(thumbPath)) {
      const jpgs = (await readdir(path.join(storageDir,"thumbnails")).catch(function(){return [];})).filter(function(f){return f.endsWith(".jpg");}).sort().reverse();
      if (jpgs.length) await copyFile(path.join(storageDir,"thumbnails",jpgs[0]),thumbPath);
    }

    // Duration
    let audioDuration = 60;
    try {
      const r = await execAsync('"'+FFPROBE+'" -v quiet -print_format json -show_streams "'+audioPath+'"',{timeout:15000,env:ENV});
      audioDuration = Math.ceil(parseFloat(JSON.parse(r.stdout).streams[0]?.duration||"60"));
    } catch(e) {}
    console.log("Duration: "+audioDuration+"s");
    const effectiveDuration = isShorts?Math.min(audioDuration,58):audioDuration;

    // BG Music
    const mixedPath = path.join(storageDir,"temp",videoId+"_mix.mp3");
    try {
      const {getBgMusic,mixVoiceWithMusic} = await import("./music-helper.js");
      const musicPath = await getBgMusic(catKey,effectiveDuration,storageDir);
      if (musicPath) {
        const mixed = await mixVoiceWithMusic(audioPath,musicPath,mixedPath,effectiveDuration);
        if (!mixed) await copyFile(audioPath,mixedPath);
        else console.log("BG music mixed (7%)");
      } else {
        await copyFile(audioPath,mixedPath);
      }
    } catch(e) {
      await copyFile(audioPath,mixedPath);
    }

    // ASS subtitles
    const assPath    = path.join(storageDir,"subtitles",videoId+".ass");
    const assContent = generateASS(hindiScript,effectiveDuration,isShorts);
    let hasSubs = false;
    if (assContent) {
      await writeFile(assPath,assContent,"utf8");
      hasSubs = true;
      console.log("ASS subtitles OK");
    }
    const assPathFwd = hasSubs ? assPath.replace(/\\\\/g,"/").replace(/:/g,"\\\\:") : null;

    // AI Background
    const aiBgPath   = path.join(storageDir,"ai_bg",videoId+"_bg.jpg");
    const aiBgCached = path.join(storageDir,"ai_bg","bg_"+catKey+".jpg");
    let hasAIBg = false;
    if (existsSync(aiBgCached)) {
      await copyFile(aiBgCached,aiBgPath);
      hasAIBg = true;
      console.log("AI BG: cached");
    } else {
      const aiPrompt = catKey+" cinematic background ultra detailed dramatic lighting 4k";
      hasAIBg = await generateAIImageReplicate(aiPrompt,aiBgPath);
      if (!hasAIBg) hasAIBg = await generateAIImagePollinations(aiPrompt,aiBgPath,W,H);
      if (hasAIBg) { await copyFile(aiBgPath,aiBgCached); console.log("AI BG: generated"); }
      else console.log("AI BG: failed");
    }

    // Pexels clips
    let clips = [];
    const pKey = process.env.PEXELS_API_KEY;
    if (pKey && mode!=="typography") {
      const queries = conf.queries||[];
      let ci = 0;
      for (let qi=0;qi<queries.length&&clips.length<7;qi++) {
        try {
          const q   = queries[qi];
          const ori = isShorts?"portrait":"landscape";
          const pr  = await fetch(
            "https://api.pexels.com/videos/search?query="+encodeURIComponent(q)+"&per_page=5&orientation="+ori+"&size=medium",
            {headers:{Authorization:pKey},signal:AbortSignal.timeout(12000)}
          );
          if (!pr.ok) continue;
          const pd = await pr.json();
          console.log("Pexels ["+q+"]: "+(pd.videos?.length||0));
          for (const v of (pd.videos||[]).slice(0,2)) {
            if (clips.length>=7) break;
            const f = v.video_files?.find(function(f){return f.quality==="hd"&&f.width<=1920;})
                   || v.video_files?.find(function(f){return f.quality==="sd";})
                   || v.video_files?.[0];
            if (!f?.link) continue;
            const cp = path.join(storageDir,"clips","clip_"+videoId+"_"+ci+".mp4");
            if (await dl(f.link,cp)) {
              clips.push({path:cp,duration:v.duration});
              console.log("Clip "+(ci+1)+": "+v.duration+"s");
              ci++;
            }
          }
        } catch(e) {}
      }
    }

    // Filters
    const ac       = "0x"+conf.accent;
    const barH     = isShorts?6:5;
    const scaleVf  = "scale="+W+":"+H+":force_original_aspect_ratio=decrease,pad="+W+":"+H+":(ow-iw)/2:(oh-ih)/2,setsar=1";
    const progress = "drawbox=x=0:y=h-"+barH+":w=iw*t/"+effectiveDuration+":h="+barH+":color="+ac+"@1.0:t=fill";
    const topBar   = "drawbox=x=0:y=0:w=iw:h=4:color="+ac+"@1.0:t=fill";
    const colorGrade = "eq=contrast=1.2:saturation=1.3:brightness=0.02";
    const baseVf   = scaleVf+",fps=30,"+colorGrade+","+topBar+","+progress;
    const fullVf   = hasSubs ? baseVf+",ass='"+assPathFwd+"'" : baseVf;

    // Crop motion table
    const cropMotions = [
      [0.88,0.88,"0","0"],
      [0.90,0.90,"iw*0.10","0"],
      [0.88,0.88,"iw*0.06","ih*0.06"],
      [0.90,0.90,"0","ih*0.10"],
      [0.85,0.85,"iw*0.075","ih*0.075"],
      [0.90,0.88,"iw*0.10","ih*0.06"],
      [0.88,0.90,"0","ih*0.05"],
    ];

    // Process clips
    const processed = [];
    let concatTxt   = "";
    const segLen    = clips.length>0 ? Math.max(4,Math.ceil(effectiveDuration/clips.length)) : effectiveDuration;

    if (clips.length>=2 && mode!=="typography") {
      console.log("Processing "+clips.length+" clips x "+segLen+"s");

      // Process clips in parallel batches
      const processClip = async function(i) {
        const proc = path.join(storageDir,"temp",videoId+"_p"+i+".mp4");
        const arr  = cropMotions[i%cropMotions.length];
        const cw=arr[0], ch=arr[1], cx=arr[2], cy=arr[3];
        const clipVf = "crop=iw*"+cw+":ih*"+ch+":"+cx+":"+cy+",scale="+W+":"+H+":force_original_aspect_ratio=disable,setsar=1,fps=30,setpts=0.88*PTS,"+colorGrade;
        try {
          await execAsync(
            '"'+FFMPEG+'" -y -i "'+clips[i].path+'" -t '+segLen+' -vf "'+clipVf+'" -c:v libx264 -preset fast -crf 18 -b:v 4000k -an "'+proc+'"',
            {timeout:200000,env:ENV}
          );
          if (existsSync(proc)&&statSync(proc).size>5000) {
            return {path:proc,ok:true};
          }
        } catch(e) {
          console.log("Clip "+i+" err:",e.message.slice(0,60));
          // Fallback: use bg image
          const fb = existsSync(aiBgPath)?aiBgPath:(existsSync(thumbPath)?thumbPath:null);
          if (fb) {
            try {
              await execAsync('"'+FFMPEG+'" -y -loop 1 -i "'+fb+'" -t '+segLen+' -vf "'+scaleVf+',fps=25" -c:v libx264 -preset fast -crf 23 -an "'+proc+'"',{timeout:60000,env:ENV});
              if (existsSync(proc)&&statSync(proc).size>5000) return {path:proc,ok:true};
            } catch(e2) {}
          }
        }
        return {path:proc,ok:false};
      };

      for (let i=0;i<clips.length;i++) {
        const res = await processClip(i);
        if (res.ok) {
          processed.push(res.path);
          concatTxt += "file '" + res.path.split("\\\\").join("/") + "'\\n";
          console.log("Clip "+(i+1)+" ok: "+(statSync(res.path).size/1024/1024).toFixed(1)+"MB");
        }
      }
    }

    console.log("Segments: "+processed.length+" | Mode:"+mode);

    // Render
    const outputPath = path.join(storageDir,"videos",videoId+".mp4");
    let success      = false;
    const encArgs    = "-c:v libx264 -preset slow -crf 17 -b:v 5000k -maxrate 6000k -bufsize 10000k -c:a aac -b:a 192k -pix_fmt yuv420p -movflags +faststart";

    // Typography mode
    if (!success && mode==="typography") {
      try {
        const {renderTypographyVideo} = await import("./typography-helper.js");
        success = await renderTypographyVideo(hindiScript,title,catKey,W,H,effectiveDuration,mixedPath,outputPath,conf,storageDir,videoId);
      } catch(e) { console.log("Typography err:",e.message.slice(0,80)); }
    }

    // Render A: clips
    if (!success && processed.length>=2) {
      const cf = path.join(storageDir,"temp",videoId+"_list.txt");
      await writeFile(cf,concatTxt);
      try {
        await execAsync('"'+FFMPEG+'" -y -f concat -safe 0 -i "'+cf+'" -i "'+mixedPath+'" -vf "'+fullVf+'" '+encArgs+' -t '+effectiveDuration+' "'+outputPath+'"',{timeout:900000,env:ENV});
        success = existsSync(outputPath)&&statSync(outputPath).size>100000;
        if (success) console.log("Render A: "+processed.length+" clips");
      } catch(e) {
        console.log("Render A err:",e.message.slice(0,100));
        try {
          await execAsync('"'+FFMPEG+'" -y -f concat -safe 0 -i "'+cf+'" -i "'+mixedPath+'" -vf "'+baseVf+'" '+encArgs+' -t '+effectiveDuration+' "'+outputPath+'"',{timeout:900000,env:ENV});
          success = existsSync(outputPath)&&statSync(outputPath).size>100000;
          if (success) console.log("Render A2: no captions");
        } catch(e2) {}
      }
    }

    // Render B: AI bg / thumb
    if (!success) {
      const bgImg = existsSync(aiBgPath)?aiBgPath:(existsSync(thumbPath)?thumbPath:null);
      if (bgImg) {
        const zoomBg = "zoompan=z='min(zoom+0.0002,1.04)':d="+effectiveDuration*25+":x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'";
        const bgVf   = zoomBg+","+scaleVf+",fps=25,"+colorGrade+","+topBar+","+progress+(hasSubs?",ass='"+assPathFwd+"'":"");
        try {
          await execAsync('"'+FFMPEG+'" -y -loop 1 -i "'+bgImg+'" -i "'+mixedPath+'" -vf "'+bgVf+'" '+encArgs+' -tune stillimage -t '+effectiveDuration+' "'+outputPath+'"',{timeout:300000,env:ENV});
          success = existsSync(outputPath)&&statSync(outputPath).size>50000;
          if (success) console.log("Render B: bg+captions");
        } catch(e) {
          console.log("Render B err:",e.message.slice(0,80));
          try {
            const bgVf2 = zoomBg+","+scaleVf+",fps=25,"+topBar+","+progress;
            await execAsync('"'+FFMPEG+'" -y -loop 1 -i "'+bgImg+'" -i "'+mixedPath+'" -vf "'+bgVf2+'" '+encArgs+' -tune stillimage -t '+effectiveDuration+' "'+outputPath+'"',{timeout:300000,env:ENV});
            success = existsSync(outputPath)&&statSync(outputPath).size>50000;
            if (success) console.log("Render B2");
          } catch(e2) {}
        }
      }
    }

    // Render C: black bg
    if (!success) {
      try {
        await execAsync('"'+FFMPEG+'" -y -f lavfi -i "color=black:size='+W+'x'+H+':rate=25" -i "'+mixedPath+'" -c:v libx264 -c:a aac -b:a 192k -pix_fmt yuv420p -t '+effectiveDuration+' -movflags +faststart "'+outputPath+'"',{timeout:120000,env:ENV});
        success = existsSync(outputPath)&&statSync(outputPath).size>10000;
        if (success) console.log("Render C: black");
      } catch(e) {}
    }

    if (!success) throw new Error("All renders failed");

    const vSize = statSync(outputPath).size;
    console.log("Done: "+(vSize/1024/1024).toFixed(1)+"MB | "+catKey+" | "+mode);
    for (const c of clips) { try{await unlink(c.path);}catch(e){} }

    // Auto Shorts
    let shortsUrl = null;
    if (!isShorts&&effectiveDuration>10) {
      const sd  = Math.min(effectiveDuration,58);
      const sp  = path.join(storageDir,"videos",videoId+"_shorts.mp4");
      const sVf = hasSubs
        ? "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,ass='"+assPathFwd+"'"
        : "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30";
      try {
        await execAsync('"'+FFMPEG+'" -y -i "'+outputPath+'" -t '+sd+' -vf "'+sVf+'" -c:v libx264 -preset fast -b:v 4000k -c:a aac -b:a 192k -pix_fmt yuv420p -movflags +faststart "'+sp+'"',{timeout:300000,env:ENV});
        if (existsSync(sp)&&statSync(sp).size>50000) {
          shortsUrl = "/storage/videos/"+videoId+"_shorts.mp4";
          console.log("Auto-Shorts: "+(statSync(sp).size/1024/1024).toFixed(1)+"MB");
        }
      } catch(e) { console.log("Shorts err:",e.message.slice(0,60)); }
    }

    return NextResponse.json({
      success:         true,
      videoId,
      videoUrl:        "/storage/videos/"+videoId+".mp4",
      shortsUrl,
      videoType:       isShorts?"shorts":"long",
      videoMode:       mode,
      duration:        effectiveDuration,
      originalDuration:audioDuration,
      clipsUsed:       processed.length,
      hasCaptions:     hasSubs,
      message:         "Done: "+(vSize/1024/1024).toFixed(1)+"MB | "+mode+(hasSubs?" + Captions":""),
    });

  } catch(error) {
    console.error("Error:",error.message);
    return NextResponse.json({error:error.message},{status:500});
  }
}
`;

writeFileSync('app/api/video/generate/route.js', code, 'utf8');
console.log('Done! Lines: ' + code.split('\n').length);
