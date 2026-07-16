import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, statSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);
const FFMPEG = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe";

function splitIntoScenes(script, sceneCount) {
  const clean = (script || "").replace(/\[.*?\]/g, "").replace(/\*\*/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const perScene = Math.max(1, Math.ceil(words.length / sceneCount));
  const scenes = [];
  for (let i = 0; i < sceneCount; i++) {
    const chunk = words.slice(i * perScene, (i + 1) * perScene).join(" ");
    if (chunk) scenes.push(chunk);
  }
  return scenes.length ? scenes : [script || "scene"];
}

async function generateSceneImage(prompt, destPath, W, H) {
  try {
    const clean = encodeURIComponent(prompt.slice(0, 200));
    const seed = Math.floor(Math.random() * 100000);
    const url = `https://image.pollinations.ai/prompt/${clean}?width=${W}&height=${H}&nologo=true&enhance=true&seed=${seed}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("image")) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) return false;
    const { writeFileSync } = await import("fs");
    writeFileSync(destPath, buf);
    return true;
  } catch (e) {
    console.log("  Scene image err:", e.message.slice(0, 60));
    return false;
  }
}

export async function renderAISceneVideo(hindiScript, title, catKey, W, H, duration, mixedPath, outputPath, conf, storageDir, videoId) {
  try {
    console.log(`AI Multi-Scene Render starting for [${videoId}]...`);

    const sceneCount = Math.min(5, Math.max(3, Math.round(duration / 12)));
    const scenes = splitIntoScenes(hindiScript, sceneCount);
    const perSceneDur = duration / scenes.length;

    const queries = (conf.queries && conf.queries.length) ? conf.queries : ["cinematic scene ultra detailed"];
    const stylePrefix = `${catKey} theme, ultra detailed, cinematic lighting, 8k, consistent art style, photorealistic`;

    const aiDir = path.join(storageDir, "ai_bg");
    const imagePaths = scenes.map((_, i) => path.join(aiDir, `${videoId}_scene${i}.jpg`));

    const results = [];
    for (let i = 0; i < scenes.length; i++) {
      const q = queries[i % queries.length];
      const prompt = `${q}, ${stylePrefix}`;
      let ok = await generateSceneImage(prompt, imagePaths[i], W, H);
      if (!ok) {
        console.log(`  Scene ${i} retry...`);
        await new Promise(r => setTimeout(r, 1500));
        ok = await generateSceneImage(prompt, imagePaths[i], W, H);
      }
      results.push(ok);
      await new Promise(r => setTimeout(r, 800));
    }

    const validImages = imagePaths.filter((p, i) => results[i] && existsSync(p));
    if (validImages.length === 0) {
      console.log("AI Scene: no images generated, aborting");
      return false;
    }
    console.log(`AI Scene: ${validImages.length}/${scenes.length} images generated`);

    const zoomVariants = [
      "zoompan=z='min(zoom+0.0015,1.15)':d={D}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'",
      "zoompan=z='if(lte(zoom,1.001),1.15,max(1.001,zoom-0.0015))':d={D}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'",
      "zoompan=z='min(zoom+0.001,1.1)':d={D}:x='iw/2-(iw/zoom/2)+40*sin(t/3)':y='ih/2-(ih/zoom/2)'",
    ];

    const clipPaths = [];
    for (let i = 0; i < validImages.length; i++) {
      const framesD = Math.max(1, Math.round(perSceneDur * 25));
      const variant = zoomVariants[i % zoomVariants.length].replace("{D}", framesD);
      const clipOut = path.join(storageDir, "temp", `${videoId}_aiscene${i}.mp4`);
      const vf = `${variant},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=25`;
      try {
        await execAsync(
          `"${FFMPEG}" -y -loop 1 -i "${validImages[i]}" -t ${perSceneDur} -vf "${vf}" -c:v libx264 -preset ultrafast -crf 24 -pix_fmt yuv420p "${clipOut}"`,
          { timeout: 120000 }
        );
        if (existsSync(clipOut) && statSync(clipOut).size > 10000) clipPaths.push(clipOut);
      } catch (e) {
        console.log("Scene clip err:", e.message.slice(0, 80));
      }
    }

    if (clipPaths.length === 0) {
      console.log("AI Scene: no clips rendered, aborting");
      return false;
    }

    const listPath = path.join(storageDir, "temp", `${videoId}_ailist.txt`);
    const listContent = clipPaths.map(p => `file '${p.replace(/\\/g, "/")}'`).join("\n");
    await writeFile(listPath, listContent);

    const assPath = path.join(storageDir, "subtitles", `${videoId}.ass`);
    const hasSubs = existsSync(assPath);
    const escapedAssPath = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");

    const colorGrade = "eq=contrast=1.15:saturation=1.2:brightness=0.02";
    const vfFinal = hasSubs ? `${colorGrade},ass='${escapedAssPath}'` : colorGrade;

    const cmd = `"${FFMPEG}" -y -f concat -safe 0 -i "${listPath}" -i "${mixedPath}" -vf "${vfFinal}" -c:v libx264 -preset veryfast -crf 23 -c:a aac -shortest -t ${duration} "${outputPath}"`;
    await execAsync(cmd, { timeout: 300000 });

    const ok = existsSync(outputPath) && statSync(outputPath).size > 100000;
    if (ok) console.log(`AI Multi-Scene render DONE: ${clipPaths.length} scenes used`);
    return ok;
  } catch (err) {
    console.error("AI Scene Render Error:", err.message);
    return false;
  }
}
