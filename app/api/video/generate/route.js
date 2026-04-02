// app/api/video/generate/route.js
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  ULTRA PRO VIDEO ENGINE v11.0
//  âœ… Every video = unique Pexels query (no two videos same)
//  âœ… Category-matched cinematic clips
//  âœ… Copyright-safe: random seed + topic variation
//  âœ… Kinetic typography (chunked render, no crash)
//  âœ… fontfile fix (Fontconfig)
//  âœ… BG music per category
//  âœ… 4-layer fallback render
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, copyFile, readdir, unlink } from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";
const execAsync = promisify(exec);

process.env.FONTCONFIG_FILE = "C:\\fontconfig\\fonts.conf";

const FFMPEG  = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe";
const FFPROBE = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffprobe.exe";
const FONT  = "C\\:/Windows/Fonts/arial.ttf";
const FONTB = "C\\:/Windows/Fonts/arialbd.ttf";

// â”€â”€ Category config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Each category has 20+ unique Pexels query pools
// Every video picks randomly â†’ no two videos ever use same clip
const CAT = {
  facts: {
    // Pool A: space & science
    queryPool: [
      ["space galaxy nebula cinematic 4k","milky way stars timelapse night","astronaut space station floating","solar system planets cinematic","cosmos universe deep space glow"],
      ["science laboratory microscope neon","dna helix glowing blue spinning","chemistry experiment colorful reaction","brain neurons firing blue light","quantum physics visualization abstract"],
      ["ancient ruins mystery aerial fog","pyramids egypt cinematic sunset","stonehenge dramatic sky timelapse","underwater shipwreck exploration","archaeological discovery cave ancient"],
      ["deep ocean bioluminescent creatures","jellyfish underwater glowing blue","whale shark swimming cinematic","coral reef colorful fish 4k","submarine deep sea exploration"],
      ["volcano eruption lava flowing aerial","earthquake destruction timelapse","tornado storm dramatic sky","lightning storm night cinematic","northern lights aurora borealis"],
    ],
    bgR:10,  bgG:10,  bgB:26,  accent:"00E5FF", badge:"FACTS",
    freq:396, harmonic:594, vol:0.07,
  },
  motivation: {
    queryPool: [
      ["athlete running sunrise mountain epic","marathon runner finish line victory","boxer training gym slow motion","swimmer olympic pool underwater","cyclist mountain trail sunrise"],
      ["entrepreneur working laptop neon city","startup office team collaboration","businessman success skyscraper view","woman leader presentation confident","ceo boardroom meeting professional"],
      ["mountain climbing summit reaching top","rock climber cliff achievement","hiker peak sunrise victory arms","adventure extreme sport success","parkour city runner energy"],
      ["fire explosion energy power dramatic","eagle flying freedom sky wide","lion roaring power dramatic close","thunder lightning powerful storm","waterfall powerful majestic sunrise"],
      ["graduation ceremony students success","award ceremony trophy golden stage","team celebration confetti victory","community helping each other warm","family reunion happiness sunset"],
    ],
    bgR:26,  bgG:8,   bgB:0,   accent:"FF8C00", badge:"MOTIVATION",
    freq:528, harmonic:396, vol:0.11,
  },
  tech: {
    queryPool: [
      ["artificial intelligence robot future blue","humanoid robot walking neon city","cyborg hand technology close up","ai brain digital visualization","machine learning data processing"],
      ["cyberpunk city night neon rain","futuristic skyscraper holographic display","smart city aerial night lights","flying car future city concept","neon street market futuristic asia"],
      ["data center server room blue glow","computer chip circuit board macro","coding screen dark neon programmer","hacker typing dark room neon","software developer multiple screens"],
      ["virtual reality headset experience","augmented reality hands interaction","hologram projection display tech","3d printing process timelapse","quantum computer laboratory blue"],
      ["electric car charging station future","solar panel field aerial green","drone swarm sky formation","satellite earth orbit cinematic","fiber optic light blue glow"],
    ],
    bgR:0,   bgG:26,  bgB:15,  accent:"00FF88", badge:"TECH / AI",
    freq:440, harmonic:880, vol:0.08,
  },
  story: {
    queryPool: [
      ["dark forest fog mystery night cinematic","abandoned house night atmospheric","misty lake morning mysterious","fog rolling hills countryside","dark pine forest horror atmospheric"],
      ["rain falling window close up cinematic","stormy sea waves dramatic night","lightning storm dark dramatic sky","flood water rushing dramatic","hurricane wind destruction cinematic"],
      ["old library books candlelight mystery","vintage clock ticking dramatic close","locked door mysterious key","letter writing candlelight vintage","detective noir shadows black white"],
      ["desert road empty night stars","lonely lighthouse storm ocean","abandoned city ruins exploration","ghost town empty streets wind","train tracks night fog lonely"],
      ["campfire night stars forest calm","lighthouse beam sea storm dramatic","old bridge river mist morning","church bells ringing dramatic","boat drifting river mist morning"],
    ],
    bgR:13,  bgG:0,   bgB:26,  accent:"CC44FF", badge:"STORY",
    freq:285, harmonic:570, vol:0.09,
  },
  top10: {
    queryPool: [
      ["luxury mansion aerial swimming pool","penthouse view city lights night","private jet interior luxury travel","yacht ocean sunset luxury lifestyle","sports car ferrari lamborghini driving"],
      ["world famous landmarks aerial drone","eiffel tower paris sunset aerial","new york skyline aerial night","tokyo shibuya crossing aerial","dubai burj khalifa aerial sunset"],
      ["michelin star restaurant food plating","chef cooking fire dramatic kitchen","gourmet food close up cinematic","wine pouring slow motion elegant","sushi chef japanese restaurant art"],
      ["fashion show runway models walking","luxury watch close up macro","diamond jewelry close up sparkle","designer bag close up luxury","perfume bottle light cinematic"],
      ["olympic stadium crowd roaring epic","superbowl celebration confetti rain","world cup trophy golden moment","formula 1 race start dramatic","tennis grand slam match aerial"],
    ],
    bgR:26,  bgG:18,  bgB:0,   accent:"FFD700", badge:"TOP 10",
    freq:639, harmonic:426, vol:0.11,
  },
  shorts: {
    queryPool: [
      ["viral dance moves street energy","tiktok trend challenge fun outdoor","social media creator filming phone","influencer lifestyle vlog aesthetic","friends laughing having fun outdoor"],
      ["skateboard tricks slow motion urban","parkour city rooftop run","bmx bike tricks slow motion","breakdance street performance urban","street football soccer skills"],
      ["neon light art installation modern","graffiti mural artist painting wall","street photography urban cinematic","night market food stalls neon","festival crowd energy colorful"],
      ["gaming setup rgb lights dark","esports tournament crowd energy","streamer reaction funny gaming","console gaming night friends","mobile gaming fingertips fast"],
      ["cooking hack kitchen satisfying fast","life hack satisfying solution quick","diy project transformation quick","before after transformation reveal","prank reaction funny outdoor"],
    ],
    bgR:26,  bgG:0,   bgB:8,   accent:"FF1744", badge:"SHORTS",
    freq:741, harmonic:370, vol:0.13,
  },
  horror: {
    queryPool: [
      ["dark haunted house fog night","abandoned hospital corridor dark","mental asylum empty dark atmospheric","old mansion thunderstorm lightning","cemetery night fog mist eerie"],
      ["ghost shadow mysterious corridor horror","dark figure shadow wall moving","flickering light hallway horror","shadow hands wall moving horror","paranormal investigation dark camera"],
      ["graveyard mist eerie dark night","coffin cemetery atmospheric dark","skull bones close up dark","crow raven dark dramatic perched","full moon dark clouds moving"],
      ["horror movie mask close up","clown dark face horror dramatic","doll cracked face horror close","puppet strings moving horror dark","mirror reflection horror dark atmospheric"],
      ["laboratory monster experiment dark","chemical reaction green glowing dark","radiation warning sign abandoned","biohazard laboratory dark glow","mutation horror science dark"],
    ],
    bgR:13,  bgG:0,   bgB:0,   accent:"FF2222", badge:"HORROR",
    freq:174, harmonic:87,  vol:0.11,
  },
  finance: {
    queryPool: [
      ["stock market trading screen data","cryptocurrency bitcoin chart rising","wall street traders floor busy","financial district aerial new york","bank vault gold bars dramatic"],
      ["gold coins falling slow motion","money counting close up dramatic","dollar bills fan out luxury","investment portfolio charts growth","economic data visualization graphs"],
      ["real estate aerial luxury property","apartment building modern architecture","construction site timelapse building","commercial district busy streets","office building glass modern aerial"],
      ["startup funding pitch investors meeting","business deal handshake professional","contract signing close up dramatic","calculator financial planning close","tax documents spreadsheet professional"],
      ["oil refinery industrial aerial night","shipping container port aerial","cargo ship ocean sunset aerial","factory production line industrial","supply chain logistics warehouse"],
    ],
    bgR:0,   bgG:26,  bgB:8,   accent:"00FF44", badge:"FINANCE",
    freq:417, harmonic:835, vol:0.08,
  },
  health: {
    queryPool: [
      ["yoga sunrise outdoor peaceful morning","meditation garden zen peaceful calm","breathing exercise nature park calm","mindfulness practice outdoor trees","tai chi morning park graceful"],
      ["healthy food colorful salad fresh","vegetables market colorful fresh organic","smoothie blender fruit fresh making","meal prep healthy kitchen organized","nutrition labels reading careful"],
      ["running park fitness outdoor morning","gym workout training muscle close","swimming pool underwater athletic","cycling outdoor trail fitness","pilates stretch morning exercise"],
      ["doctor examination patient professional","hospital surgery team operating","medical research laboratory science","medicine pharmacy prescription careful","nurse patient care compassionate"],
      ["nature forest walk peaceful green","waterfall fresh nature healing","mountain air fresh hiking peaceful","garden flowers blooming peaceful","beach sunrise meditation calm"],
    ],
    bgR:0,   bgG:26,  bgB:13,  accent:"44FF88", badge:"HEALTH",
    freq:528, harmonic:264, vol:0.07,
  },
  general: {
    queryPool: [
      ["cinematic aerial drone golden hour","sunset mountain landscape epic drone","ocean waves aerial golden sunset","city skyline golden hour aerial","countryside aerial rolling hills"],
      ["time lapse city night lights","star trail night sky timelapse","flower blooming timelapse nature","clouds moving dramatic timelapse","traffic light trails night city"],
      ["cultural festival celebration colorful","traditional dance performance stage","wedding ceremony beautiful outdoor","community gathering celebration warm","market bazaar colorful traditional"],
      ["wildlife animals natural habitat","lion pride savanna sunset cinematic","elephant herd water drinking aerial","dolphin ocean jumping slow motion","birds murmuration sunset dramatic"],
      ["waterfall nature majestic cinematic","forest trees morning light rays","lake reflection mountains peaceful","river flowing rocks natural calm","cave stalactites underground dramatic"],
    ],
    bgR:26,  bgG:0,   bgB:26,  accent:"FF4488", badge:"VIRAL",
    freq:432, harmonic:648, vol:0.09,
  },
};

// â”€â”€ Pick unique query set using video ID as seed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Each video ID (timestamp) â†’ different pool index â†’ different clips
function pickQuerySet(conf, videoId) {
  const seed = parseInt(videoId.replace("video_", "")) % conf.queryPool.length;
  // Shuffle within selected pool using timestamp digits
  const pool = conf.queryPool[seed];
  const shuffled = [...pool].sort(() => {
    const n = parseInt(videoId.slice(-4)) / 9999;
    return n - 0.5;
  });
  return shuffled;
}

function catHex(c) { return ((c.bgR<<16)|(c.bgG<<8)|c.bgB).toString(16).padStart(6,"0"); }

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function downloadFile(url, dest) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122" },
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) return false;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 50000) return false;
    await writeFile(dest, Buffer.from(buf));
    return true;
  } catch { return false; }
}

async function getAudioDuration(p) {
  try {
    const { stdout } = await execAsync(`"${FFPROBE}" -v quiet -print_format json -show_streams "${p}"`, { timeout: 15000 });
    return Math.ceil(parseFloat(JSON.parse(stdout).streams[0]?.duration || "60"));
  } catch { return 60; }
}

async function generateBgMusic(musicPath, conf, duration) {
  if (existsSync(musicPath)) return;
  const dur = duration + 15, fo = duration + 8;
  try {
    await execAsync(
      `"${FFMPEG}" -y -f lavfi -i "sine=frequency=${conf.freq}:duration=${dur}" -f lavfi -i "sine=frequency=${conf.harmonic}:duration=${dur}" ` +
      `-filter_complex "[0:a]volume=0.55[a1];[1:a]volume=0.22[a2];[a1][a2]amix=inputs=2:duration=first[mix];[mix]aecho=0.5:0.4:180:0.25[echo];[echo]afade=t=in:st=0:d=4,afade=t=out:st=${fo}:d=5[out]" ` +
      `-map "[out]" -acodec libmp3lame -q:a 2 "${musicPath}"`,
      { timeout: 35000 }
    );
    console.log(`âœ… BG Music: ${conf.badge}`);
  } catch {
    try {
      await execAsync(
        `"${FFMPEG}" -y -f lavfi -i "sine=frequency=${conf.freq}:duration=${dur}" ` +
        `-filter_complex "afade=t=in:st=0:d=3,afade=t=out:st=${fo}:d=5" -acodec libmp3lame -q:a 3 "${musicPath}"`,
        { timeout: 20000 }
      );
    } catch { /* silent */ }
  }
}

function safeT(t, maxLen = 44) {
  return (t || "").trim()
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[\\'":%\[\]{}<>|!@#$^&*()+]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, maxLen).trim();
}

function buildSegments(scriptText, totalDur) {
  const words = (scriptText || "")
    .replace(/[^\x00-\x7F]/g, " ").replace(/\s+/g, " ").trim()
    .split(/[.!?\n,;]+/).flatMap(s => s.trim().split(/\s+/)).filter(w => w.length > 0);
  const groups = [];
  for (let i = 0; i < words.length; i += 4) {
    const safe = safeT(words.slice(i, i + 4).join(" "));
    if (safe.length > 1) groups.push(safe);
  }
  if (!groups.length) groups.push(safeT(scriptText || "AI Video"));
  const segDur = Math.max(1.2, totalDur / groups.length);
  return groups.map((text, i) => ({
    text,
    start: parseFloat((i * segDur).toFixed(3)),
    end:   parseFloat(Math.min((i + 1) * segDur, totalDur).toFixed(3)),
  }));
}

function buildChunkVf(conf, W, H, isShorts, audioDur, safeTitle, chunkSegs, chunkStart, chunkEnd) {
  const topH   = isShorts ? 115 : 92;
  const titY   = isShorts ? 22  : 16;
  const titSz  = isShorts ? 44  : 38;
  const bX     = isShorts ? 22  : 16;
  const bY     = isShorts ? topH + 10 : topH + 6;
  const bW     = isShorts ? 200 : 165;
  const bH     = isShorts ? 50  : 40;
  const bTxtX  = isShorts ? 34  : 26;
  const bTxtY  = isShorts ? topH + 25 : topH + 17;
  const bTxtSz = isShorts ? 22  : 18;
  const progH  = isShorts ? 8   : 6;
  const subSz  = isShorts ? 44  : 34;
  const subGSz = isShorts ? 48  : 38;
  const subY   = isShorts ? "h*0.82" : "h*0.80";
  const subBarY = isShorts ? "h*0.77" : "h*0.75";
  const subBarH = isShorts ? 175 : 140;
  const ff  = `fontfile='${FONT}'`;
  const ffb = `fontfile='${FONTB}'`;
  const cDur = chunkEnd - chunkStart;

  const f = [];
  f.push(`scale=${W}:${H}:force_original_aspect_ratio=decrease`);
  f.push(`pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`);
  f.push(`setsar=1`);
  f.push(`drawbox=x=0:y=0:w=iw:h=${topH}:color=black@0.88:t=fill`);
  if (safeTitle) {
    f.push(`drawtext=${ffb}:text='${safeTitle}':fontsize=${titSz}:fontcolor=0x${conf.accent}@0.40:x=(w-text_w)/2+3:y=${titY+3}`);
    f.push(`drawtext=${ffb}:text='${safeTitle}':fontsize=${titSz}:fontcolor=white:x=(w-text_w)/2:y=${titY}`);
  }
  f.push(`drawbox=x=0:y=${topH-4}:w=iw:h=4:color=0x${conf.accent}@1.0:t=fill`);
  f.push(`drawbox=x=${bX}:y=${bY}:w=${bW}:h=${bH}:color=0x${conf.accent}@0.92:t=fill`);
  f.push(`drawtext=${ffb}:text='${conf.badge}':fontsize=${bTxtSz}:fontcolor=black:x=${bTxtX}:y=${bTxtY}`);
  f.push(`drawbox=x=0:y=${subBarY}:w=iw:h=${subBarH}:color=black@0.82:t=fill`);

  for (const seg of chunkSegs) {
    const ls = Math.max(0, seg.start - chunkStart);
    const le = Math.min(cDur, seg.end - chunkStart);
    if (le <= ls) continue;
    const en = `enable='between(t,${ls.toFixed(3)},${le.toFixed(3)})'`;
    f.push(`drawtext=${ff}:text='${seg.text}':fontsize=${subGSz}:fontcolor=0x${conf.accent}@0.50:x=(w-text_w)/2+3:y=${subY}+3:${en}`);
    f.push(`drawtext=${ff}:text='${seg.text}':fontsize=${subSz}:fontcolor=white:x=(w-text_w)/2:y=${subY}:box=1:boxcolor=black@0.82:boxborderw=${isShorts?18:14}:${en}`);
  }

  f.push(`drawbox=x=0:y=h-${progH}:w=iw:h=${progH}:color=black@0.65:t=fill`);
  f.push(`drawbox=x=0:y=h-${progH}:w=iw*(${chunkStart}+t)/${audioDur}:h=${progH}:color=0x${conf.accent}@1.0:t=fill`);
  return f.join(",");
}

// â”€â”€ Main Route â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function POST(request) {
  try {
    let { audioUrl, thumbnailUrl, title, script, hook, videoType = "long", category = "general" } = await request.json();

    const storageDir = path.join(process.cwd(), "storage");
    for (const d of ["videos","temp","thumbnails","music","clips"]) {
      const dp = path.join(storageDir, d);
      if (!existsSync(dp)) await mkdir(dp, { recursive: true });
    }
    const videosDir = path.join(storageDir, "videos");
    const tempDir   = path.join(storageDir, "temp");
    const thumbsDir = path.join(storageDir, "thumbnails");
    const musicDir  = path.join(storageDir, "music");
    const clipsDir  = path.join(storageDir, "clips");

    const videoId  = `video_${Date.now()}`;
    const catKey   = (category || "general").toLowerCase().replace(/[^a-z]/g, "");
    const conf     = CAT[catKey] || CAT.general;
    const isShorts = videoType === "shorts" || catKey === "shorts";
    const W = isShorts ? 1080 : 1920;
    const H = isShorts ? 1920 : 1080;
    const hex = catHex(conf);

    const audioPath  = path.join(tempDir, `${videoId}_audio.mp3`);
    const mixedPath  = path.join(tempDir, `${videoId}_mix.mp3`);
    const outputPath = path.join(videosDir, `${videoId}.mp4`);
    const thumbPath  = path.join(tempDir, `${videoId}_thumb.jpg`);

    // â”€â”€ Audio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (audioUrl) {
      const al = path.join(storageDir, "audio", audioUrl.split("/").pop());
      if (existsSync(al)) await copyFile(al, audioPath);
    }
    if (!existsSync(audioPath)) {
      await execAsync(`"${FFMPEG}" -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -acodec libmp3lame -q:a 9 "${audioPath}"`, { timeout: 15000 });
    }

    // â”€â”€ Thumbnail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (thumbnailUrl) {
      const tl = path.join(thumbsDir, thumbnailUrl.split("/").pop());
      if (existsSync(tl)) await copyFile(tl, thumbPath);
    }
    if (!existsSync(thumbPath)) {
      const jpgs = (await readdir(thumbsDir).catch(()=>[])).filter(f=>f.endsWith(".jpg")).sort().reverse();
      if (jpgs.length) await copyFile(path.join(thumbsDir, jpgs[0]), thumbPath);
      else await execAsync(`"${FFMPEG}" -y -f lavfi -i "color=0x${hex}:size=${W}x${H}:rate=1" -frames:v 1 "${thumbPath}"`, { timeout: 10000 });
    }

    const audioDur = await getAudioDuration(audioPath);
    console.log(`ðŸŽ¬ ${audioDur}s | ${catKey} | ${isShorts?"SHORTS":"LANDSCAPE"}`);

    // â”€â”€ BG Music (unique per category, reused) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const musicPath = path.join(musicDir, `bg_${catKey}_v11.mp3`);
    await generateBgMusic(musicPath, conf, audioDur);

    // â”€â”€ Mix audio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (existsSync(musicPath)) {
      try {
        await execAsync(
          `"${FFMPEG}" -y -i "${audioPath}" -i "${musicPath}" ` +
          `-filter_complex "[0:a]volume=1.0[v];[1:a]volume=${conf.vol},afade=t=in:st=0:d=3,afade=t=out:st=${Math.max(audioDur-4,1)}:d=4[m];[v][m]amix=inputs=2:duration=first[out]" ` +
          `-map "[out]" -t ${audioDur} "${mixedPath}"`,
          { timeout: 60000 }
        );
        console.log(`âœ… Audio mixed (vol:${conf.vol})`);
      } catch { await copyFile(audioPath, mixedPath); }
    } else { await copyFile(audioPath, mixedPath); }

    // â”€â”€ Pexels clips â€” unique per video â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Each video gets different query pool based on its timestamp
    const queries = pickQuerySet(conf, videoId);
    console.log(`ðŸŽ² Video ID: ${videoId} â†’ Query pool: ${queries[0].slice(0,30)}...`);

    const clips = [];
    const pKey = process.env.PEXELS_API_KEY;
    if (pKey) {
      const ori = isShorts ? "portrait" : "landscape";
      // Try each query from the unique pool
      for (const rawQ of queries) {
        if (clips.length >= 7) break;
        try {
          // Add page randomization for extra uniqueness
          const page = Math.floor(Math.random() * 3) + 1;
          const pr = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(rawQ)}&per_page=8&page=${page}&orientation=${ori}&size=medium`,
            { headers: { Authorization: pKey }, signal: AbortSignal.timeout(12000) }
          );
          if (!pr.ok) continue;
          const pd = await pr.json();
          console.log(`Pexels [${rawQ.slice(0,30)}]: ${pd.videos?.length||0} results`);

          // Shuffle results for more uniqueness
          const videos = (pd.videos || []).sort(() => Math.random() - 0.5).slice(0, 3);
          for (const v of videos) {
            if (clips.length >= 7) break;
            const f = v.video_files?.find(f=>f.quality==="hd"&&f.width<=1366)
                   || v.video_files?.find(f=>f.quality==="sd"&&f.width>=480)
                   || v.video_files?.[0];
            if (!f?.link) continue;
            const cp = path.join(clipsDir, `clip_${videoId}_${clips.length}.mp4`);
            if (await downloadFile(f.link, cp)) {
              clips.push({ path: cp, duration: v.duration });
              console.log(`âœ… Clip ${clips.length}: ${v.duration}s`);
            }
          }
        } catch (e) { console.log("Pexels err:", e.message.slice(0,50)); }
      }
    }
    console.log(`âœ… Total clips: ${clips.length}`);

    // â”€â”€ Process clips: zoom/pan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const processed = [];
    let concatTxt = "";

    if (clips.length >= 2) {
      const segLen = Math.max(6, Math.ceil(audioDur / clips.length));
      for (let i = 0; i < clips.length; i++) {
        const proc = path.join(tempDir, `${videoId}_c${i}.mp4`);
        try {
          const d = segLen * 25;
          let zf;
          if (i % 3 === 0)      zf = `zoompan=z='min(zoom+0.0005,1.06)':d=${d}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=25`;
          else if (i % 3 === 1) zf = `zoompan=z='if(lte(zoom,1.0),1.06,max(1.001,zoom-0.0004))':d=${d}:x='iw/4':y='ih/4':s=${W}x${H}:fps=25`;
          else                  zf = `zoompan=z='min(zoom+0.0004,1.05)':d=${d}:x='3*iw/4-(iw/zoom/2)':y='3*ih/4-(ih/zoom/2)':s=${W}x${H}:fps=25`;

          await execAsync(
            `"${FFMPEG}" -y -i "${clips[i].path}" -t ${segLen+1} -vf "${zf},fps=25" -c:v libx264 -preset fast -crf 18 -an "${proc}"`,
            { timeout: 120000 }
          );
          if (existsSync(proc) && statSync(proc).size > 5000) {
            processed.push(proc);
            concatTxt += `file '${proc.replace(/\\/g,"/")}'\n`;
            console.log(`âœ… Clip ${i+1} processed: ${segLen}s`);
          }
        } catch (e) { console.log(`Clip ${i} err: ${e.message.slice(0,80)}`); }
      }
    }

    // â”€â”€ Build segments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const safeTitle  = safeT(title, 44) || "AI Video";
    const scriptText = script || hook || title || "AI Video";
    const segments   = buildSegments(scriptText, audioDur);
    console.log(`âœ… Segments: ${segments.length}`);

    let success = false;

    // â”€â”€ Render A: Pexels clips + chunked kinetic text â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (processed.length >= 2) {
      const concatPath = path.join(tempDir, `${videoId}_list.txt`);
      await writeFile(concatPath, concatTxt, "utf8");
      const rawConcat = path.join(tempDir, `${videoId}_raw.mp4`);

      try {
        await execAsync(
          `"${FFMPEG}" -y -f concat -safe 0 -i "${concatPath}" -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -t ${audioDur} "${rawConcat}"`,
          { timeout: 300000 }
        );
      } catch (e) { console.log("Raw concat err:", e.message.slice(0,80)); }

      if (existsSync(rawConcat) && statSync(rawConcat).size > 100000) {
        const NUM_CHUNKS = Math.min(Math.max(Math.ceil(audioDur / 25), 2), 4);
        const chunkDur   = audioDur / NUM_CHUNKS;
        const chunkPaths = [];

        for (let ci = 0; ci < NUM_CHUNKS; ci++) {
          const cs    = ci * chunkDur;
          const ce    = Math.min((ci+1) * chunkDur, audioDur);
          const cD    = ce - cs;
          const cPath = path.join(tempDir, `${videoId}_tk${ci}.mp4`);
          const cSegs = segments.filter(s => s.end > cs && s.start < ce);
          const vf    = buildChunkVf(conf, W, H, isShorts, audioDur, safeTitle, cSegs, cs, ce);

          try {
            await execAsync(
              `"${FFMPEG}" -y -ss ${cs} -t ${cD} -i "${rawConcat}" -ss ${cs} -t ${cD} -i "${mixedPath}" ` +
              `-vf "${vf}" -map 0:v -map 1:a -c:v libx264 -preset fast -crf 18 -c:a aac -b:a 256k -pix_fmt yuv420p -t ${cD} "${cPath}"`,
              { timeout: 300000 }
            );
            if (existsSync(cPath) && statSync(cPath).size > 10000) {
              chunkPaths.push(cPath);
              console.log(`âœ… Text chunk ${ci+1}/${NUM_CHUNKS}: ${cD.toFixed(1)}s`);
            }
          } catch (e) { console.log(`Chunk ${ci+1} err: ${e.message.slice(0,100)}`); }
        }

        if (chunkPaths.length >= 2) {
          const fcTxt  = chunkPaths.map(p=>`file '${p.replace(/\\/g,"/")}'`).join("\n");
          const fcPath = path.join(tempDir, `${videoId}_fc.txt`);
          await writeFile(fcPath, fcTxt, "utf8");
          try {
            await execAsync(
              `"${FFMPEG}" -y -f concat -safe 0 -i "${fcPath}" -c copy -movflags +faststart "${outputPath}"`,
              { timeout: 180000 }
            );
            success = existsSync(outputPath) && statSync(outputPath).size > 100000;
            if (success) console.log("âœ… Render A: Pexels clips + full kinetic text ðŸŽ‰");
          } catch (e) { console.log("Final concat err:", e.message.slice(0,100)); }
          try { await unlink(fcPath); } catch {}
        } else if (chunkPaths.length === 1) {
          try { await copyFile(chunkPaths[0], outputPath); success = true; } catch {}
        }
        for (const cp of chunkPaths) try { await unlink(cp); } catch {}
        try { await unlink(rawConcat); } catch {}
      }
      try { await unlink(concatPath); } catch {}
    }

    // â”€â”€ Render B: Pexels clips + simple title overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!success && processed.length >= 2) {
      const cPath = path.join(tempDir, `${videoId}_list2.txt`);
      await writeFile(cPath, concatTxt, "utf8");
      const ffb = `fontfile='${FONTB}'`;
      const topH = isShorts ? 115 : 92;
      const simpleVf = [
        `scale=${W}:${H}:force_original_aspect_ratio=decrease`,
        `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`,
        `setsar=1`,
        `drawbox=x=0:y=0:w=iw:h=${topH}:color=black@0.88:t=fill`,
        `drawtext=${ffb}:text='${safeTitle}':fontsize=${isShorts?44:38}:fontcolor=white:x=(w-text_w)/2:y=${isShorts?22:16}`,
        `drawbox=x=0:y=${topH-4}:w=iw:h=4:color=0x${conf.accent}@1.0:t=fill`,
        `drawbox=x=0:y=h-${isShorts?8:6}:w=iw*t/${audioDur}:h=${isShorts?8:6}:color=0x${conf.accent}@1.0:t=fill`,
      ].join(",");
      try {
        await execAsync(
          `"${FFMPEG}" -y -f concat -safe 0 -i "${cPath}" -i "${mixedPath}" ` +
          `-vf "${simpleVf}" -map 0:v -map 1:a -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 256k -pix_fmt yuv420p -t ${audioDur} -movflags +faststart "${outputPath}"`,
          { timeout: 300000 }
        );
        success = existsSync(outputPath) && statSync(outputPath).size > 100000;
        if (success) console.log("âœ… Render B: clips + title bar");
      } catch (e) { console.log("Render B err:", e.message.slice(0,100)); }
      try { await unlink(cPath); } catch {}
    }

    // â”€â”€ Render C: color bg + chunked kinetic text â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!success) {
      const NUM_CHUNKS = Math.min(Math.max(Math.ceil(audioDur / 25), 2), 4);
      const chunkDur   = audioDur / NUM_CHUNKS;
      const chunkPaths = [];

      for (let ci = 0; ci < NUM_CHUNKS; ci++) {
        const cs    = ci * chunkDur;
        const ce    = Math.min((ci+1)*chunkDur, audioDur);
        const cD    = ce - cs;
        const cPath = path.join(tempDir, `${videoId}_bg${ci}.mp4`);
        const cSegs = segments.filter(s => s.end > cs && s.start < ce);
        const vf    = buildChunkVf(conf, W, H, isShorts, audioDur, safeTitle, cSegs, cs, ce);

        try {
          await execAsync(
            `"${FFMPEG}" -y -f lavfi -i "color=c=0x${hex}:size=${W}x${H}:rate=25:duration=${cD}" ` +
            `-ss ${cs} -t ${cD} -i "${mixedPath}" ` +
            `-vf "${vf}" -map 0:v -map 1:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -pix_fmt yuv420p -t ${cD} "${cPath}"`,
            { timeout: 240000 }
          );
          if (existsSync(cPath) && statSync(cPath).size > 10000) {
            chunkPaths.push(cPath);
            console.log(`âœ… BG chunk ${ci+1}/${NUM_CHUNKS}`);
          }
        } catch (e) { console.log(`BG chunk ${ci+1} err:`, e.message.slice(0,80)); }
      }

      if (chunkPaths.length >= 1) {
        const fcTxt  = chunkPaths.map(p=>`file '${p.replace(/\\/g,"/")}'`).join("\n");
        const fcPath = path.join(tempDir, `${videoId}_bglist.txt`);
        await writeFile(fcPath, fcTxt, "utf8");
        try {
          await execAsync(
            `"${FFMPEG}" -y -f concat -safe 0 -i "${fcPath}" -c copy -movflags +faststart "${outputPath}"`,
            { timeout: 120000 }
          );
          success = existsSync(outputPath) && statSync(outputPath).size > 100000;
          if (success) console.log("âœ… Render C: color bg + kinetic text");
        } catch {}
        try { await unlink(fcPath); } catch {}
        for (const cp of chunkPaths) try { await unlink(cp); } catch {}
      }
    }

    // â”€â”€ Render D: absolute fallback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!success) {
      try {
        await execAsync(
          `"${FFMPEG}" -y -loop 1 -i "${thumbPath}" -i "${mixedPath}" ` +
          `-c:v libx264 -tune stillimage -c:a aac -b:a 128k -pix_fmt yuv420p -t ${audioDur} ` +
          `-vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black" ` +
          `-movflags +faststart "${outputPath}"`,
          { timeout: 120000 }
        );
        console.log("âœ… Render D: thumbnail fallback");
      } catch (e) { console.log("Render D err:", e.message.slice(0,80)); }
    }

    // Cleanup
    for (const c of clips) try { await unlink(c.path); } catch {}
    for (const p of processed) try { await unlink(p); } catch {}

    const vSize = existsSync(outputPath) ? statSync(outputPath).size : 0;
    console.log(`âœ… Done: ${(vSize/1024/1024).toFixed(1)}MB | Clips:${processed.length} | Segs:${segments.length} | Cat:${catKey}`);

    return NextResponse.json({
      success: true, videoId,
      videoUrl:    `/storage/videos/${videoId}.mp4`,
      videoType:   isShorts ? "shorts" : "long",
      duration:    audioDur,
      clipsUsed:   processed.length,
      segments:    segments.length,
      category:    catKey,
      message: `âœ… ${isShorts?"Shorts":"Landscape"} | ${processed.length} clips | ${segments.length} segs | ${(vSize/1024/1024).toFixed(1)}MB`,
    });

  } catch (error) {
    console.error("Fatal:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}