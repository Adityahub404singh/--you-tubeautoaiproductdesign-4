import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

const THEMES = {
  psychology:      { bg: "F4EBE1", hiColor: "E63946", textColor: "1D3557", element: "brain.png" },
  motivation:      { bg: "EAE2B7", hiColor: "D62828", textColor: "003049", element: "statue.png" },
  stoicism:        { bg: "E5E5E5", hiColor: "9B2226", textColor: "000000", element: "statue.png" },
  quotes:          { bg: "FDF0D5", hiColor: "C1121F", textColor: "111111", element: "statue.png" },
  businesslessons: { bg: "F1FAEE", hiColor: "1D3557", textColor: "000000", element: "money.png" },
  storytelling:    { bg: "FAE1DD", hiColor: "E5383B", textColor: "0B090A", element: "brain.png" },
  general:         { bg: "F8EDEB", hiColor: "E63946", textColor: "111111", element: "statue.png" }
};

function fmt(s) {
  if (isNaN(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const ms = Math.round((s % 1) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function hexToASS(hex, alpha = "00") {
  const h = hex.replace("#", "");
  return `&H${alpha}${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`;
}

function splitScenes(script) {
  let cleanScript = script.replace(/\s+i\s+/g, " i ").replace(/ha\s*i/gi, "hai").replace(/\s+/g, " ");
  const rawWords = cleanScript.split(" ").filter(Boolean);
  const pattern = [2, 2, 3]; 
  let wIdx = 0, pIdx = 0, totalWeight = 0;
  const scenes = [];

  while (wIdx < rawWords.length) {
    const count = pattern[pIdx % pattern.length];
    const chunk = rawWords.slice(wIdx, wIdx + count);
    if (!chunk.length) break;

    const rawText = chunk.join(" ");
    let weight = 10 + (rawText.length * 0.8); 
    const cleanText = rawText.replace(/\[.*?\]/g, "").replace(/[!?.?,]/g, "").trim();
    if (cleanText) {
      scenes.push({ text: cleanText, weight });
      totalWeight += weight;
    }
    wIdx += count; pIdx++;
  }
  return { scenes, totalWeight };
}

export async function renderTypographyVideo(hindiScript, title, catKey, W, H, duration, mixedPath, outputPath, conf = {}, baseDir, videoId) {
  try {
    console.log(`🚀 [${videoId}] Zenith V9.1: LOCAL ASSET MODE ACTIVATED...`);
    const themeKey = Object.keys(THEMES).find(k => catKey.toLowerCase().includes(k)) || "general";
    const theme = THEMES[themeKey];
    
    const storageDir = path.join(process.cwd(), "storage");
    const assPath = path.join(storageDir, "subtitles", `${videoId}.ass`);
    const { scenes, totalWeight } = splitScenes(hindiScript);
    const timePerWeight = duration / (totalWeight || 1);

    const hiC = hexToASS(theme.hiColor);
    const textC = hexToASS(theme.textColor);

    let assContent = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\n\n[V4+ Styles]\nStyle: Base,Arial,100,&H00FFFFFF,&H00FFFFFF,&H00000000,&H88000000,-1,0,0,0,100,100,0,0,1,0,8,5,0,0,0,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

    let currentTime = 0;
    scenes.forEach((s) => {
      const start = currentTime;
      const end = currentTime + (s.weight * timePerWeight);
      currentTime = end;

      const words = s.text.split(" ");
      const firstWord = words.shift() || "";
      const restWords = words.join(" ").toUpperCase();
      
      const cursiveTag = `{\\fnSegoe Script\\fs210\\c${hiC}\\i1}`;
      const boldTag = restWords.length > 0 ? ` {\\fnArial Black\\fs150\\c${textC}\\i0\\b1}` : "";
      const formatText = `${cursiveTag}${firstWord}${boldTag}${restWords}`;
      const anim = `{\\an5\\pos(${W/2},${H/2 + 350})\\fad(100,100)\\fscx90\\fscy90\\t(0,100,\\fscx100\\fscy100)}`;
      assContent += `Dialogue: 1,${fmt(start)},${fmt(end)},Base,,0,0,0,,${anim}${formatText}\n`;
    });

    fs.writeFileSync(assPath, assContent);

    // FIX: Look for local image, if not found, render without it (No Crash!)
    const elementPath = path.join(process.cwd(), "public", "characters", theme.element);
    let inputs = `-i "${mixedPath}"`;
    let filterComplex = "";
    const escapedAssPath = assPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "'\\''");

    if (fs.existsSync(elementPath)) {
      inputs += ` -loop 1 -t ${duration} -i "${elementPath}"`;
      filterComplex = `color=c=0x${theme.bg}:s=${W}x${H}:d=${duration}[bg];[1:v]scale=550:-1,format=rgba[elem];[bg][elem]overlay=x='(W-w)/2':y='(H/2)-350+sin(t*3)*30':shortest=1[bg2];[bg2]ass=filename='${escapedAssPath}'[outv]`;
    } else {
      filterComplex = `color=c=0x${theme.bg}:s=${W}x${H}:d=${duration}[bg];[bg]ass=filename='${escapedAssPath}'[outv]`;
    }

    const cmd = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -map "[outv]" -map 0:a -c:v libx264 -preset veryfast -crf 25 -maxrate 2.5M -bufsize 5M -c:a aac -shortest "${outputPath}"`;
    await execAsync(cmd);
    return true;
  } catch (err) {
    console.error("❌ Render Error:", err.message);
    return false;
  }
}
