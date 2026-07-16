import { exec } from "child_process";
import { promisify } from "util";
import { existsSync, statSync, writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);
const FFMPEG = "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe";
const KLING_BASE = "https://api-singapore.klingai.com/v1/videos/text2video";

async function createKlingTask(prompt, aspectRatio, apiKey) {
  try {
    const res = await fetch(KLING_BASE, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model_name: "kling-v1",
        prompt: prompt.slice(0, 500),
        negative_prompt: "blurry, low quality, distorted, text, watermark",
        duration: "5",
        mode: "std",
        aspect_ratio: aspectRatio,
      }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    if (!res.ok) {
      console.log("  Kling create err:", JSON.stringify(data).slice(0, 200));
      return null;
    }
    return data?.data?.task_id || null;
  } catch (e) {
    console.log("  Kling create fetch err:", e.message.slice(0, 100));
    return null;
  }
}

async function pollKlingTask(taskId, apiKey, maxWaitMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(`${KLING_BASE}/${taskId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json();
      const status = data?.data?.task_status;
      if (status === "succeed") {
        const url = data?.data?.task_result?.videos?.[0]?.url;
        return url || null;
      }
      if (status === "failed") {
        console.log("  Kling task failed:", JSON.stringify(data).slice(0, 150));
        return null;
      }
      await new Promise(r => setTimeout(r, 8000));
    } catch (e) {
      console.log("  Kling poll err:", e.message.slice(0, 100));
      await new Promise(r => setTimeout(r, 8000));
    }
  }
  console.log("  Kling task timeout");
  return null;
}

async function downloadFile(url, destPath) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10000) return false;
    writeFileSync(destPath, buf);
    return true;
  } catch (e) {
    console.log("  Download err:", e.message.slice(0, 100));
    return false;
  }
}

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

export async function renderKlingVideo(hindiScript, title, catKey, W, H, duration, mixedPath, outputPath, conf, storageDir, videoId) {
  const apiKey = process.env.KLING_API_KEY;
  if (!apiKey) {
    console.log("Kling: no API key set, skipping");
    return false;
  }

  try {
    console.log(`Kling AI Video Render starting for [${videoId}]...`);

    const MAX_SCENES = 2;
    const scenes = splitIntoScenes(hindiScript, MAX_SCENES);
    const aspectRatio = W === 1080 ? "9:16" : "16:9";
    const queries = (conf.queries && conf.queries.length) ? conf.queries : ["cinematic scene"];
    const stylePrefix = `${catKey} theme, cinematic, highly detailed, dramatic lighting`;

    const clipPaths = [];
    for (let i = 0; i < scenes.length; i++) {
      const q = queries[i % queries.length];
      const prompt = `${q}, ${stylePrefix}`;
      console.log(`  Kling scene ${i}: requesting...`);

      const taskId = await createKlingTask(prompt, aspectRatio, apiKey);
      if (!taskId) continue;

      console.log(`  Kling scene ${i}: task ${taskId}, polling...`);
      const videoUrl = await pollKlingTask(taskId, apiKey);
      if (!videoUrl) continue;

      const rawPath = path.join(storageDir, "temp", `${videoId}_kling${i}.mp4`);
      const ok = await downloadFile(videoUrl, rawPath);
      if (ok && existsSync(rawPath) && statSync(rawPath).size > 10000) {
        clipPaths.push(rawPath);
        console.log(`  Kling scene ${i}: downloaded OK`);
      }
    }

    if (clipPaths.length === 0) {
      console.log("Kling: no clips generated, aborting");
      return false;
    }
    console.log(`Kling: ${clipPaths.length}/${scenes.length} scenes generated`);

    const listPath = path.join(storageDir, "temp", `${videoId}_klinglist.txt`);
    const listContent = clipPaths.map(p => `file '${p.replace(/\\/g, "/")}'`).join("\n");
    await writeFile(listPath, listContent);

    const assPath = path.join(storageDir, "subtitles", `${videoId}.ass`);
    const hasSubs = existsSync(assPath);
    const escapedAssPath = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");

    const scaleVf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1`;
    const colorGrade = "eq=contrast=1.1:saturation=1.15";
    const vfFinal = hasSubs ? `${scaleVf},${colorGrade},ass='${escapedAssPath}'` : `${scaleVf},${colorGrade}`;

    const concatOut = path.join(storageDir, "temp", `${videoId}_klingconcat.mp4`);
    await execAsync(
      `"${FFMPEG}" -y -f concat -safe 0 -i "${listPath}" -vf "${vfFinal}" -c:v libx264 -preset veryfast -crf 23 -an "${concatOut}"`,
      { timeout: 180000 }
    );

    if (!existsSync(concatOut)) {
      console.log("Kling: concat failed");
      return false;
    }

    await execAsync(
      `"${FFMPEG}" -y -stream_loop -1 -i "${concatOut}" -i "${mixedPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -t ${duration} "${outputPath}"`,
      { timeout: 120000 }
    );

    const ok = existsSync(outputPath) && statSync(outputPath).size > 100000;
    if (ok) console.log(`Kling AI render DONE: ${clipPaths.length} scenes used`);
    return ok;
  } catch (err) {
    console.error("Kling Render Error:", err.message);
    return false;
  }
}
