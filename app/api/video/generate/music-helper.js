// app/api/video/generate/music-helper.js
// v7 - Fixed exports + Freesound fallback

import { existsSync, writeFileSync } from "fs"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)
const FFMPEG = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe"

const MUSIC_SEARCH = {
  psychology:      ["dark ambient mysterious", "psychological thriller ambient"],
  stoicism:        ["deep focus meditation drone", "calm philosophy ambient"],
  quotes:          ["lofi chill piano soft", "warm acoustic background"],
  businesslessons: ["corporate upbeat modern", "success motivational background"],
  storytelling:    ["emotional cinematic piano", "dramatic violin sad"],
  startupstories:  ["tech startup upbeat driving", "entrepreneurship motivational"],
  luxury:          ["luxury lounge smooth jazz", "elegant premium background"],
  history:         ["epic orchestral historical", "documentary cinematic strings"],
  pov:             ["synthwave atmospheric neon", "cyberpunk immersive electronic"],
  horror:          ["dark horror suspense", "scary cinematic tension"],
  ainews:          ["breaking news urgent beats", "broadcast news background"],
  motivation:      ["epic motivational music", "powerful inspirational orchestra"],
  general:         ["cinematic background ambient", "film score emotional"],
  facts:           ["documentary curious cinematic", "educational background"],
  top10:           ["countdown action intense", "dramatic suspense buildup"],
  shorts:          ["upbeat energetic viral", "trending hype beats"],
  finance:         ["corporate professional success", "business ambient clean"],
  health:          ["calm relaxing meditation", "peaceful wellness ambient"],
  story:           ["emotional dramatic strings", "cinematic sad piano"],
  tech:            ["electronic futuristic digital", "technology innovation beats"],
}

async function downloadPixabayMusic(catKey, destPath) {
  const queries = MUSIC_SEARCH[catKey] || MUSIC_SEARCH.general
  const apiKey = process.env.PIXABAY_API_KEY
  if (!apiKey) return false

  for (const q of queries) {
    try {
      console.log(`🎵 Pixabay music: "${q}"`)
      const url = `https://pixabay.com/api/videos/music/?key=${apiKey}&q=${encodeURIComponent(q)}&per_page=5`
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) continue
      const data = await res.json()
      const hits = (data.hits || []).filter(h => h.audio)
      if (!hits.length) continue

      // Pick a random one from top 3 for variety
      const pick = hits[Math.floor(Math.random() * Math.min(3, hits.length))]
      const aRes = await fetch(pick.audio, { signal: AbortSignal.timeout(45000) })
      if (!aRes.ok) continue
      const buf = Buffer.from(await aRes.arrayBuffer())
      if (buf.length > 10000) {
        writeFileSync(destPath, buf)
        console.log(`✅ Real music: ${(buf.length/1024/1024).toFixed(1)}MB — "${q}"`)
        return true
      }
    } catch(e) { console.log("  Music err:", e.message.slice(0,40)) }
  }
  return false
}

// Frequency map: tuned per category mood
const FREQ_MAP = {
  psychology:      [174, 285], stoicism:   [396, 432], quotes:      [432, 528],
  businesslessons: [528, 639], storytelling:[285, 396], startupstories:[528,660],
  luxury:          [528, 660], history:    [396, 495], pov:         [440, 550],
  horror:          [174, 220], ainews:     [639, 800], motivation:  [528, 660],
  general:         [432, 540], facts:      [396, 495], top10:       [639, 800],
  shorts:          [741, 925], finance:    [528, 660], health:      [432, 540],
  story:           [285, 356], tech:       [440, 550],
}

async function generateSineMusic(catKey, duration, destPath) {
  const [f1, f2] = FREQ_MAP[catKey] || FREQ_MAP.general
  try {
    await execAsync(
      `"${FFMPEG}" -y ` +
      `-f lavfi -i "sine=frequency=${f1}:duration=${duration+10}" ` +
      `-f lavfi -i "sine=frequency=${f2}:duration=${duration+10}" ` +
      `-filter_complex "[0:a]volume=0.3,aecho=0.8:0.88:60:0.4[a1];[1:a]volume=0.15,aecho=0.6:0.76:45:0.3[a2];[a1][a2]amix=inputs=2[mix];[mix]afade=t=in:st=0:d=3,afade=t=out:st=${duration}:d=4,volume=0.1" ` +
      `-acodec libmp3lame -q:a 4 "${destPath}"`,
      { timeout: 60000 }
    )
    return existsSync(destPath)
  } catch(e) { console.log("Sine err:", e.message.slice(0,40)); return false }
}

export async function getBgMusic(catKey, duration, storageDir) {
  const cached = path.join(storageDir, "music", `bg_${catKey}.mp3`)
  if (existsSync(cached)) { console.log(`🎵 BG Music cached: ${catKey}`); return cached }
  const downloaded = await downloadPixabayMusic(catKey, cached)
  if (!downloaded) {
    console.log(`🎵 Generating sine music: ${catKey}`)
    await generateSineMusic(catKey, duration, cached)
  }
  return existsSync(cached) ? cached : null
}

export async function mixVoiceWithMusic(voicePath, musicPath, outputPath, duration) {
  try {
    await execAsync(
      `"${FFMPEG}" -y -i "${voicePath}" -i "${musicPath}" ` +
      `-filter_complex "[0:a]volume=1.0[v];[1:a]volume=0.07,aloop=loop=-1:size=2e+09[m];[v][m]amix=inputs=2:duration=first[out]" ` +
      `-map "[out]" -t ${duration} -acodec libmp3lame -q:a 3 "${outputPath}"`,
      { timeout: 90000 }
    )
    return existsSync(outputPath)
  } catch(e) { console.log("Mix err:", e.message.slice(0,50)); return false }
}
