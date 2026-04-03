// app/api/video/generate/route.js
// ═══════════════════════════════════════════════════════════════════════
//  ULTIMATE PRO VIDEO ENGINE v12.0
//  ✅ Smart clip matching (script keywords → Pexels query)
//  ✅ Auto synced subtitles (word-by-word kinetic)
//  ✅ Voice variation per category
//  ✅ Category visual styles (brightness/contrast/saturation)
//  ✅ Auto watermark branding
//  ✅ Royalty-free Pixabay music fallback
//  ✅ Unique video every time (copyright safe)
//  ✅ Intro clip support (AI character)
//  ✅ 4-layer fallback render
// ═══════════════════════════════════════════════════════════════════════
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

// ── CATEGORY CONFIG ───────────────────────────────────────────────────
const CAT = {
  facts: {
    accent: "00E5FF", badge: "FACTS",
    bgR:10, bgG:10, bgB:26,
    freq:396, harmonic:594, vol:0.07,
    // Visual style: slightly bright + high contrast for facts
    eq: "eq=brightness=0.03:contrast=1.08:saturation=1.15",
    queryPool: [
      ["space galaxy nebula cinematic","milky way stars timelapse","solar system planets 4k","cosmos deep space glow","nebula colorful universe"],
      ["science laboratory microscope neon","dna helix glowing blue","chemistry experiment colorful","quantum physics abstract","research lab scientist"],
      ["ancient ruins mystery aerial","pyramids egypt cinematic","stonehenge dramatic sky","mayan temple jungle aerial","archaeological ruins fog"],
      ["deep ocean bioluminescent","jellyfish underwater glowing","whale swimming cinematic","coral reef colorful 4k","submarine deep sea"],
      ["volcano eruption lava aerial","earthquake destruction dramatic","tornado storm sky","northern lights aurora","glacier melting timelapse"],
    ],
    // Smart keyword → query mapping
    keywords: {
      space: "space galaxy nebula cinematic", planet: "solar system planets 4k",
      ocean: "deep ocean bioluminescent", science: "science laboratory neon glow",
      ancient: "ancient ruins mystery aerial", volcano: "volcano eruption lava",
      brain: "brain neurons glowing blue", atom: "quantum physics abstract visualization",
    },
  },
  motivation: {
    accent: "FF8C00", badge: "MOTIVATION",
    bgR:26, bgG:8, bgB:0,
    freq:528, harmonic:396, vol:0.11,
    eq: "eq=brightness=0.05:contrast=1.12:saturation=1.20",
    queryPool: [
      ["athlete running sunrise mountain","marathon runner victory finish","boxer training gym slow motion","swimmer olympic pool","cyclist mountain sunrise"],
      ["entrepreneur working laptop city","startup team collaboration office","businesswoman leader confident","ceo boardroom professional","team success meeting"],
      ["mountain climbing summit victory","rock climber achievement epic","hiker sunrise peak arms","adventure extreme sport","parkour city energy"],
      ["eagle flying freedom sky","lion roaring power dramatic","fire explosion energy power","thunder lightning storm","waterfall powerful majestic"],
      ["graduation ceremony success","award trophy golden stage","confetti celebration victory","community helping warm","family happiness sunset"],
    ],
    keywords: {
      success: "victory celebration confetti success", dream: "sunrise mountain hope cinematic",
      work: "entrepreneur hustle neon city", hard: "athlete training gym intense",
      money: "businessman success wealth", life: "sunset silhouette inspiring",
      goal: "mountain peak achievement success", win: "champion victory celebration",
    },
  },
  tech: {
    accent: "00FF88", badge: "TECH / AI",
    bgR:0, bgG:26, bgB:15,
    freq:440, harmonic:880, vol:0.08,
    eq: "eq=brightness=0.02:contrast=1.10:saturation=0.95",
    queryPool: [
      ["artificial intelligence robot neon","humanoid robot walking city","ai brain digital visualization","machine learning data","cyborg technology future"],
      ["cyberpunk city night rain","futuristic skyscraper hologram","smart city aerial night","neon street market asia","flying car future concept"],
      ["data center server blue glow","circuit board macro close","coding screen dark neon","programmer multiple screens","software development dark"],
      ["virtual reality headset experience","augmented reality hands","hologram projection display","3d printing timelapse","quantum computer lab"],
      ["electric car charging future","solar panel field aerial","drone swarm formation sky","satellite orbit cinematic","fiber optic blue glow"],
    ],
    keywords: {
      ai: "artificial intelligence robot neon", robot: "humanoid robot future city",
      code: "coding screen dark neon programmer", data: "data center server blue glow",
      future: "futuristic city smart technology", cyber: "cyberpunk city night neon",
      machine: "machine learning visualization", tech: "holographic display digital blue",
    },
  },
  story: {
    accent: "CC44FF", badge: "STORY",
    bgR:13, bgG:0, bgB:26,
    freq:285, harmonic:570, vol:0.09,
    eq: "eq=brightness=-0.04:contrast=1.15:saturation=0.80",
    queryPool: [
      ["dark forest fog mystery night","abandoned house atmospheric night","misty lake morning mysterious","fog rolling hills","dark pine forest horror"],
      ["rain falling window cinematic","stormy sea waves night","lightning storm dramatic sky","flood water rushing","hurricane wind dramatic"],
      ["old library books candlelight","vintage clock ticking dramatic","locked door mysterious key","detective noir shadows","letter writing candlelight"],
      ["desert road empty night stars","lonely lighthouse ocean storm","abandoned city ruins","ghost town empty wind","train tracks night fog"],
      ["campfire night stars forest","lighthouse beam sea storm","old bridge river mist","church bells dramatic","boat drifting mist morning"],
    ],
    keywords: {
      dark: "dark forest fog mystery night", mystery: "mystery abandoned building atmospheric",
      fear: "horror dark shadows cinematic", ghost: "ghost shadow mysterious horror",
      rain: "rain window cinematic dramatic", night: "night city lights cinematic",
      secret: "mystery fog dark cinematic", love: "rain cinematic romance",
    },
  },
  top10: {
    accent: "FFD700", badge: "TOP 10",
    bgR:26, bgG:18, bgB:0,
    freq:639, harmonic:426, vol:0.11,
    eq: "eq=brightness=0.04:contrast=1.06:saturation=1.25",
    queryPool: [
      ["luxury mansion aerial pool","penthouse city lights night","private jet interior travel","yacht ocean sunset luxury","sports car driving cinematic"],
      ["eiffel tower paris sunset","new york skyline aerial","tokyo crossing aerial","dubai burj khalifa aerial","world landmarks famous places"],
      ["michelin restaurant food plating","chef fire dramatic kitchen","gourmet food close cinematic","wine pouring elegant","sushi chef art"],
      ["fashion show runway models","luxury watch macro close","diamond jewelry sparkle","designer luxury close","perfume bottle cinematic"],
      ["olympic stadium crowd epic","superbowl confetti celebration","world cup trophy golden","formula 1 race start","grand slam tennis aerial"],
    ],
    keywords: {
      luxury: "luxury mansion wealth aerial", world: "world famous landmarks aerial",
      food: "gourmet restaurant fine dining", money: "gold coins wealth luxury",
      car: "sports car ferrari driving", travel: "private jet luxury travel",
      fashion: "fashion show runway models", sport: "olympic stadium crowd epic",
    },
  },
  shorts: {
    accent: "FF1744", badge: "SHORTS",
    bgR:26, bgG:0, bgB:8,
    freq:741, harmonic:370, vol:0.13,
    eq: "eq=brightness=0.06:contrast=1.15:saturation=1.30",
    queryPool: [
      ["viral dance street energy","tiktok challenge fun outdoor","social media creator filming","influencer lifestyle vlog","friends laughing fun"],
      ["skateboard tricks slow motion","parkour city rooftop run","bmx tricks slow motion","breakdance street urban","street football skills"],
      ["neon light art installation","graffiti mural artist wall","street photography urban","night market food neon","festival crowd colorful"],
      ["gaming setup rgb dark","esports tournament crowd","streamer reaction funny","console gaming friends","mobile gaming fast"],
      ["cooking hack satisfying fast","life hack solution quick","diy transformation quick","before after reveal","prank reaction funny"],
    ],
    keywords: {
      viral: "viral energy explosion fast neon", dance: "dance moves street energy",
      game: "gaming setup rgb esports", food: "cooking hack satisfying fast",
      fun: "friends laughing outdoor fun", trend: "tiktok trend challenge fun",
      city: "neon nightlife vibrant crowd", hack: "life hack satisfying solution",
    },
  },
  horror: {
    accent: "FF2222", badge: "HORROR",
    bgR:13, bgG:0, bgB:0,
    freq:174, harmonic:87, vol:0.11,
    eq: "eq=brightness=-0.08:contrast=1.20:saturation=0.60",
    queryPool: [
      ["dark haunted house fog night","abandoned hospital corridor","mental asylum dark atmospheric","old mansion thunderstorm","cemetery night fog eerie"],
      ["ghost shadow corridor horror","dark figure shadow moving","flickering light hallway","shadow hands wall horror","paranormal investigation camera"],
      ["graveyard mist eerie night","coffin cemetery atmospheric","skull bones dark close","crow raven dramatic","full moon dark clouds"],
      ["horror mask close up dark","clown dark face horror","doll cracked horror close","puppet strings horror dark","mirror reflection horror"],
      ["laboratory dark experiment","chemical reaction glowing dark","radiation warning abandoned","biohazard laboratory glow","mutation horror science"],
    ],
    keywords: {
      ghost: "ghost shadow mysterious horror", dark: "dark abandoned building atmospheric",
      fear: "horror mask close dramatic", night: "night fog cemetery eerie",
      blood: "horror dark red atmospheric", monster: "creature horror dark cinematic",
      death: "cemetery night fog atmospheric", scream: "horror shadow dark intense",
    },
  },
  finance: {
    accent: "00FF44", badge: "FINANCE",
    bgR:0, bgG:26, bgB:8,
    freq:417, harmonic:835, vol:0.08,
    eq: "eq=brightness=0.02:contrast=1.05:saturation=1.10",
    queryPool: [
      ["stock market trading screen","cryptocurrency bitcoin chart","wall street traders busy","financial district aerial","bank vault gold dramatic"],
      ["gold coins falling slow motion","money counting close dramatic","dollar bills luxury fan","investment charts growth","economic data graphs"],
      ["real estate aerial luxury","apartment modern architecture","construction timelapse building","commercial district streets","office building aerial"],
      ["startup pitch investors meeting","business handshake professional","contract signing dramatic","calculator planning close","tax documents professional"],
      ["oil refinery industrial aerial","shipping container port aerial","cargo ship ocean sunset","factory production line","supply chain warehouse"],
    ],
    keywords: {
      money: "gold coins wealth money luxury", stock: "stock market trading screen data",
      invest: "investment portfolio charts growth", crypto: "cryptocurrency bitcoin chart",
      business: "businessman success professional", bank: "bank vault gold dramatic",
      rich: "luxury mansion wealth aerial", trade: "stock market traders wall street",
    },
  },
  health: {
    accent: "44FF88", badge: "HEALTH",
    bgR:0, bgG:26, bgB:13,
    freq:528, harmonic:264, vol:0.07,
    eq: "eq=brightness=0.05:contrast=1.02:saturation=1.20",
    queryPool: [
      ["yoga sunrise outdoor peaceful","meditation garden zen calm","breathing exercise nature","mindfulness outdoor trees","tai chi morning graceful"],
      ["healthy food colorful fresh","vegetables market organic","smoothie blender fruit making","meal prep healthy organized","nutrition labels careful"],
      ["running park fitness morning","gym workout training close","swimming pool athletic","cycling outdoor trail","pilates stretch morning"],
      ["doctor examination professional","hospital surgery team","medical research laboratory","medicine pharmacy careful","nurse patient care"],
      ["nature forest walk peaceful","waterfall fresh healing","mountain air hiking peaceful","garden flowers blooming","beach sunrise meditation"],
    ],
    keywords: {
      health: "healthy lifestyle fitness outdoor", yoga: "yoga meditation peaceful morning",
      food: "healthy food colorful organic", exercise: "gym workout training fitness",
      doctor: "doctor medical professional care", nature: "nature forest peaceful green",
      sleep: "peaceful bedroom calm minimal", stress: "meditation calm breathing nature",
    },
  },
  general: {
    accent: "FF4488", badge: "VIRAL",
    bgR:26, bgG:0, bgB:26,
    freq:432, harmonic:648, vol:0.09,
    eq: "eq=brightness=0.03:contrast=1.08:saturation=1.15",
    queryPool: [
      ["cinematic aerial drone golden hour","sunset mountain epic drone","ocean waves aerial sunset","city skyline golden aerial","countryside rolling hills"],
      ["timelapse city night lights","star trail night timelapse","flower blooming timelapse","clouds dramatic timelapse","traffic light trails night"],
      ["cultural festival celebration","traditional dance performance","wedding ceremony outdoor","community gathering warm","market bazaar colorful"],
      ["wildlife animals natural habitat","lion pride savanna sunset","elephant herd aerial","dolphin jumping slow motion","birds murmuration sunset"],
      ["waterfall nature majestic","forest morning light rays","lake reflection mountains","river flowing natural","cave underground dramatic"],
    ],
    keywords: {
      nature: "nature cinematic aerial drone", city: "city skyline aerial night",
      animal: "wildlife animals natural habitat", culture: "cultural festival celebration",
      water: "ocean waves aerial cinematic", sky: "dramatic clouds timelapse sky",
      mountain: "mountain landscape epic aerial", festival: "festival celebration colorful",
    },
  },
};

// ── Smart keyword matching ────────────────────────────────────────────
// Analyzes script → picks best Pexels queries
function getSmartQueries(conf, scriptText, videoId) {
  const text = (scriptText || "").toLowerCase();
  const matched = new Set();

  // Check keywords against script
  for (const [kw, query] of Object.entries(conf.keywords || {})) {
    if (text.includes(kw)) matched.add(query);
    if (matched.size >= 3) break;
  }

  // Fill remaining slots from query pool (unique per video)
  const seed = parseInt(videoId.replace("video_", "")) % conf.queryPool.length;
  const pool = conf.queryPool[seed];

  for (const q of pool) {
    if (matched.size >= 5) break;
    matched.add(q);
  }

  // Shuffle for uniqueness
  return [...matched].sort(() => Math.random() - 0.5);
}

function catHex(c) { return ((c.bgR<<16)|(c.bgG<<8)|c.bgB).toString(16).padStart(6,"0"); }

function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Helpers ───────────────────────────────────────────────────────────

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
    console.log(`✅ BG Music: ${conf.badge}`);
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

function buildChunkVf(conf, W, H, isShorts, audioDur, safeTitle, brandName, chunkSegs, chunkStart, chunkEnd) {
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
  const wmSz   = isShorts ? 22  : 16;
  const ff  = `fontfile='${FONT}'`;
  const ffb = `fontfile='${FONTB}'`;
  const cDur = chunkEnd - chunkStart;

  const f = [];

  // Scale + pad
  f.push(`scale=${W}:${H}:force_original_aspect_ratio=decrease`);
  f.push(`pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`);
  f.push(`setsar=1`);

  // Category visual style (brightness/contrast/saturation)
  if (conf.eq) f.push(conf.eq);

  // Top dark bar
  f.push(`drawbox=x=0:y=0:w=iw:h=${topH}:color=black@0.88:t=fill`);

  // Title glow + main
  if (safeTitle) {
    f.push(`drawtext=${ffb}:text='${safeTitle}':fontsize=${titSz}:fontcolor=0x${conf.accent}@0.40:x=(w-text_w)/2+3:y=${titY+3}`);
    f.push(`drawtext=${ffb}:text='${safeTitle}':fontsize=${titSz}:fontcolor=white:x=(w-text_w)/2:y=${titY}`);
  }

  // Accent underline
  f.push(`drawbox=x=0:y=${topH-4}:w=iw:h=4:color=0x${conf.accent}@1.0:t=fill`);

  // Category badge
  f.push(`drawbox=x=${bX}:y=${bY}:w=${bW}:h=${bH}:color=0x${conf.accent}@0.92:t=fill`);
  f.push(`drawtext=${ffb}:text='${conf.badge}':fontsize=${bTxtSz}:fontcolor=black:x=${bTxtX}:y=${bTxtY}`);

  // Subtitle bar
  f.push(`drawbox=x=0:y=${subBarY}:w=iw:h=${subBarH}:color=black@0.82:t=fill`);

  // Kinetic subtitles — synced to voice
  for (const seg of chunkSegs) {
    const ls = Math.max(0, seg.start - chunkStart);
    const le = Math.min(cDur, seg.end - chunkStart);
    if (le <= ls) continue;
    const en = `enable='between(t,${ls.toFixed(3)},${le.toFixed(3)})'`;
    // Glow layer
    f.push(`drawtext=${ff}:text='${seg.text}':fontsize=${subGSz}:fontcolor=0x${conf.accent}@0.50:x=(w-text_w)/2+3:y=${subY}+3:${en}`);
    // Main text
    f.push(`drawtext=${ff}:text='${seg.text}':fontsize=${subSz}:fontcolor=white:x=(w-text_w)/2:y=${subY}:box=1:boxcolor=black@0.82:boxborderw=${isShorts?18:14}:${en}`);
  }

  // Progress bar
  f.push(`drawbox=x=0:y=h-${progH}:w=iw:h=${progH}:color=black@0.65:t=fill`);
  f.push(`drawbox=x=0:y=h-${progH}:w=iw*(${chunkStart}+t)/${audioDur}:h=${progH}:color=0x${conf.accent}@1.0:t=fill`);

  // Watermark branding (bottom right)
  if (brandName) {
    f.push(`drawtext=${ff}:text='${brandName}':fontsize=${wmSz}:fontcolor=white@0.45:x=w-text_w-${isShorts?20:15}:y=h-${isShorts?50:38}`);
  }

  return f.join(",");
}

// ── Main Route ────────────────────────────────────────────────────────
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

    // Brand name from env or default
    const brandName = safeT(process.env.BRAND_NAME || "@AIVideoChannel", 25);

    const audioPath  = path.join(tempDir, `${videoId}_audio.mp3`);
    const mixedPath  = path.join(tempDir, `${videoId}_mix.mp3`);
    const outputPath = path.join(videosDir, `${videoId}.mp4`);
    const thumbPath  = path.join(tempDir, `${videoId}_thumb.jpg`);

    // ── Audio ───────────────────────────────────────────────
    if (audioUrl) {
      const al = path.join(storageDir, "audio", audioUrl.split("/").pop());
      if (existsSync(al)) await copyFile(al, audioPath);
    }
    if (!existsSync(audioPath)) {
      await execAsync(`"${FFMPEG}" -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -acodec libmp3lame -q:a 9 "${audioPath}"`, { timeout: 15000 });
    }

    // ── Thumbnail ────────────────────────────────────────────
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
    const scriptText = script || hook || title || "AI Video";
    console.log(`🎬 ${catKey} | ${audioDur}s | ${isShorts?"SHORTS":"LANDSCAPE"} | Brand:${brandName}`);

    // ── BG Music ────────────────────────────────────────────
    const musicPath = path.join(musicDir, `bg_${catKey}_v12.mp3`);
    await generateBgMusic(musicPath, conf, audioDur);

    // ── Mix audio ───────────────────────────────────────────
    if (existsSync(musicPath)) {
      try {
        await execAsync(
          `"${FFMPEG}" -y -i "${audioPath}" -i "${musicPath}" ` +
          `-filter_complex "[0:a]volume=1.0[v];[1:a]volume=${conf.vol},afade=t=in:st=0:d=3,afade=t=out:st=${Math.max(audioDur-4,1)}:d=4[m];[v][m]amix=inputs=2:duration=first[out]" ` +
          `-map "[out]" -t ${audioDur} "${mixedPath}"`,
          { timeout: 60000 }
        );
        console.log(`✅ Audio mixed`);
      } catch { await copyFile(audioPath, mixedPath); }
    } else { await copyFile(audioPath, mixedPath); }

    // ── Smart Pexels clips (script-aware + unique per video) ──
    const queries = getSmartQueries(conf, scriptText, videoId);
    console.log(`🎯 Smart queries: ${queries.slice(0,2).map(q=>q.slice(0,20)).join(" | ")}...`);

    const clips = [];
    const pKey = process.env.PEXELS_API_KEY;

    // Check for AI character intro clip
    const introClip = path.join(storageDir, "intro.mp4");
    if (existsSync(introClip)) {
      clips.push({ path: introClip, duration: 5, isIntro: true });
      console.log(`✅ AI intro clip added`);
    }

    if (pKey) {
      const ori = isShorts ? "portrait" : "landscape";
      for (const rawQ of queries) {
        if (clips.length >= 7) break;
        try {
          const page = Math.floor(Math.random() * 3) + 1;
          const pr = await fetch(
            `https://api.pexels.com/videos/search?query=${encodeURIComponent(rawQ)}&per_page=8&page=${page}&orientation=${ori}&size=medium`,
            { headers: { Authorization: pKey }, signal: AbortSignal.timeout(12000) }
          );
          if (!pr.ok) continue;
          const pd = await pr.json();
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
              console.log(`✅ Clip ${clips.length}: ${(statSync(cp).size/1024/1024).toFixed(1)}MB`);
            }
          }
        } catch (e) { console.log("Pexels err:", e.message.slice(0,50)); }
      }
    }
    console.log(`✅ Total clips: ${clips.length}`);

    // ── Process clips: zoom/pan + eq ────────────────────────
    const processed = [];
    let concatTxt = "";

    if (clips.length >= 2) {
      const segLen = Math.max(6, Math.ceil(audioDur / clips.length));
      for (let i = 0; i < clips.length; i++) {
        const proc = path.join(tempDir, `${videoId}_c${i}.mp4`);
        const clip  = clips[i];
        try {
          const clipDur = clip.isIntro ? 5 : segLen + 1;

          // Step 1: Simple scale + pad (NO zoompan — crashes on portrait clips)
          // zoompan requires specific input resolution matching output exactly
          // Using scale+pad is 100% reliable across all clip resolutions
          const scaleVf = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=25`;

          await execAsync(
            `"${FFMPEG}" -y -i "${clip.path}" -t ${clipDur} -vf "${scaleVf}" -c:v libx264 -preset fast -crf 18 -an "${proc}"`,
            { timeout: 120000 }
          );

          if (existsSync(proc) && statSync(proc).size > 5000) {
            processed.push(proc);
            concatTxt += `file '${proc.replace(/\\/g,"/")}'\n`;
            console.log(`✅ Clip ${i+1} processed: ${(statSync(proc).size/1024/1024).toFixed(1)}MB`);
          } else {
            console.log(`⚠️ Clip ${i+1} output too small, skipping`);
          }
        } catch (e) {
          console.log(`Clip ${i+1} err: ${e.message.slice(0,120)}`);
          // Try ultra-simple fallback for this clip
          try {
            await execAsync(
              `"${FFMPEG}" -y -i "${clip.path}" -t ${segLen} -vf "scale=${W}:${H},setsar=1" -c:v libx264 -preset ultrafast -crf 24 -an "${proc}"`,
              { timeout: 60000 }
            );
            if (existsSync(proc) && statSync(proc).size > 5000) {
              processed.push(proc);
              concatTxt += `file '${proc.replace(/\\/g,"/")}'\n`;
              console.log(`✅ Clip ${i+1} fallback OK`);
            }
          } catch { /* skip this clip */ }
        }
      }
    }

    // ── Build segments ───────────────────────────────────────
    const safeTitle = safeT(title, 44) || "AI Video";
    const segments  = buildSegments(scriptText, audioDur);
    console.log(`✅ Segments: ${segments.length} | Brand: ${brandName}`);

    let success = false;

    // ── Render A: Clips + full kinetic text + watermark ───────
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
          const vf    = buildChunkVf(conf, W, H, isShorts, audioDur, safeTitle, brandName, cSegs, cs, ce);

          try {
            await execAsync(
              `"${FFMPEG}" -y -ss ${cs} -t ${cD} -i "${rawConcat}" -ss ${cs} -t ${cD} -i "${mixedPath}" ` +
              `-vf "${vf}" -map 0:v -map 1:a -c:v libx264 -preset fast -crf 18 -c:a aac -b:a 256k -pix_fmt yuv420p -t ${cD} "${cPath}"`,
              { timeout: 300000 }
            );
            if (existsSync(cPath) && statSync(cPath).size > 10000) {
              chunkPaths.push(cPath);
              console.log(`✅ Text chunk ${ci+1}/${NUM_CHUNKS}: ${cD.toFixed(1)}s`);
            }
          } catch (e) { console.log(`Chunk ${ci+1} err:`, e.message.slice(0,100)); }
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
            if (success) console.log(`✅ Render A: ${processed.length} clips + kinetic text + watermark 🎉`);
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

    // ── Render B: Clips + simple title bar ───────────────────
    if (!success && processed.length >= 2) {
      const cPath = path.join(tempDir, `${videoId}_list2.txt`);
      await writeFile(cPath, concatTxt, "utf8");
      const ffb = `fontfile='${FONTB}'`;
      const topH = isShorts ? 115 : 92;
      const simpleVf = [
        `scale=${W}:${H}:force_original_aspect_ratio=decrease`,
        `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black`,
        `setsar=1`,
        conf.eq,
        `drawbox=x=0:y=0:w=iw:h=${topH}:color=black@0.88:t=fill`,
        `drawtext=${ffb}:text='${safeTitle}':fontsize=${isShorts?44:38}:fontcolor=white:x=(w-text_w)/2:y=${isShorts?22:16}`,
        `drawbox=x=0:y=${topH-4}:w=iw:h=4:color=0x${conf.accent}@1.0:t=fill`,
        `drawbox=x=0:y=h-${isShorts?8:6}:w=iw*t/${audioDur}:h=${isShorts?8:6}:color=0x${conf.accent}@1.0:t=fill`,
        `drawtext=${`fontfile='${FONT}'`}:text='${brandName}':fontsize=${isShorts?22:16}:fontcolor=white@0.45:x=w-text_w-${isShorts?20:15}:y=h-${isShorts?50:38}`,
      ].filter(Boolean).join(",");
      try {
        await execAsync(
          `"${FFMPEG}" -y -f concat -safe 0 -i "${cPath}" -i "${mixedPath}" ` +
          `-vf "${simpleVf}" -map 0:v -map 1:a -c:v libx264 -preset fast -crf 20 -c:a aac -b:a 256k -pix_fmt yuv420p -t ${audioDur} -movflags +faststart "${outputPath}"`,
          { timeout: 300000 }
        );
        success = existsSync(outputPath) && statSync(outputPath).size > 100000;
        if (success) console.log("✅ Render B: clips + title bar");
      } catch (e) { console.log("Render B err:", e.message.slice(0,100)); }
      try { await unlink(cPath); } catch {}
    }

    // ── Render C: Color bg + chunked kinetic text ─────────────
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
        const vf    = buildChunkVf(conf, W, H, isShorts, audioDur, safeTitle, brandName, cSegs, cs, ce);

        try {
          await execAsync(
            `"${FFMPEG}" -y -f lavfi -i "color=c=0x${hex}:size=${W}x${H}:rate=25:duration=${cD}" ` +
            `-ss ${cs} -t ${cD} -i "${mixedPath}" ` +
            `-vf "${vf}" -map 0:v -map 1:a -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 192k -pix_fmt yuv420p -t ${cD} "${cPath}"`,
            { timeout: 240000 }
          );
          if (existsSync(cPath) && statSync(cPath).size > 10000) {
            chunkPaths.push(cPath);
            console.log(`✅ BG chunk ${ci+1}/${NUM_CHUNKS}`);
          }
        } catch (e) { console.log(`BG chunk err:`, e.message.slice(0,80)); }
      }

      if (chunkPaths.length >= 1) {
        const fcTxt  = chunkPaths.map(p=>`file '${p.replace(/\\/g,"/")}'`).join("\n");
        const fcPath = path.join(tempDir, `${videoId}_bglist.txt`);
        await writeFile(fcPath, fcTxt, "utf8");
        try {
          await execAsync(`"${FFMPEG}" -y -f concat -safe 0 -i "${fcPath}" -c copy -movflags +faststart "${outputPath}"`, { timeout: 120000 });
          success = existsSync(outputPath) && statSync(outputPath).size > 100000;
          if (success) console.log("✅ Render C: color bg + kinetic text");
        } catch {}
        try { await unlink(fcPath); } catch {}
        for (const cp of chunkPaths) try { await unlink(cp); } catch {}
      }
    }

    // ── Render D: Thumbnail fallback ─────────────────────────
    if (!success) {
      try {
        await execAsync(
          `"${FFMPEG}" -y -loop 1 -i "${thumbPath}" -i "${mixedPath}" ` +
          `-c:v libx264 -tune stillimage -c:a aac -b:a 128k -pix_fmt yuv420p -t ${audioDur} ` +
          `-vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black" ` +
          `-movflags +faststart "${outputPath}"`,
          { timeout: 120000 }
        );
        console.log("✅ Render D: thumbnail fallback");
      } catch (e) { console.log("Render D err:", e.message.slice(0,80)); }
    }

    // Cleanup
    for (const c of clips) if (!c.isIntro) try { await unlink(c.path); } catch {}
    for (const p of processed) try { await unlink(p); } catch {}

    const vSize = existsSync(outputPath) ? statSync(outputPath).size : 0;
    console.log(`✅ Done: ${(vSize/1024/1024).toFixed(1)}MB | Clips:${processed.length} | Segs:${segments.length} | ${catKey}`);

    return NextResponse.json({
      success: true, videoId,
      videoUrl:    `/storage/videos/${videoId}.mp4`,
      videoType:   isShorts ? "shorts" : "long",
      duration:    audioDur,
      clipsUsed:   processed.length,
      segments:    segments.length,
      category:    catKey,
      brand:       brandName,
      message: `✅ ${isShorts?"Shorts":"Landscape"} | ${processed.length} clips | ${segments.length} segs | ${brandName} | ${(vSize/1024/1024).toFixed(1)}MB`,
    });

  } catch (error) {
    console.error("Fatal:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}