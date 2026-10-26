
import { promisify } from "util";
import { execFile } from "child_process";
import { existsSync, statSync } from "fs";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const execFileAsync = promisify(execFile);

const FFMPEG =
  process.env.FFMPEG_PATH ||
  "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe";

const KLING_BASE =
  "https://api-singapore.klingai.com/v1/videos/text2video";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function createKlingTask(prompt, aspectRatio, apiKey) {
  const response = await fetch(KLING_BASE, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_name: "kling-v1",
      prompt: prompt.slice(0, 500),
      negative_prompt:
        "blurry, low quality, distorted, text, watermark, flicker",
      duration: "5",
      mode: "std",
      aspect_ratio: aspectRatio,
    }),
    signal: AbortSignal.timeout(30000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Kling task creation failed (${response.status}): ${JSON.stringify(data).slice(0, 500)}`
    );
  }

  const taskId = data?.data?.task_id;

  if (!taskId) {
    throw new Error("Kling API did not return a task ID.");
  }

  return taskId;
}

async function pollKlingTask(taskId, apiKey, maxWaitMs = 240000) {
  const start = Date.now();
  const statusUrl = `${KLING_BASE}/${encodeURIComponent(taskId)}`;

  while (Date.now() - start < maxWaitMs) {
    const response = await fetch(statusUrl, {
      headers: {
        Authorization: "Bearer " + apiKey,
      },
      signal: AbortSignal.timeout(20000),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        `Kling status check failed (${response.status}): ${JSON.stringify(data).slice(0, 300)}`
      );
    }

    const task = data?.data;
    const status = task?.task_status;

    console.log(`Kling task ${taskId}: ${status || "pending"}`);

    if (status === "succeed") {
      const url = task?.task_result?.videos?.[0]?.url;

      if (!url) {
        throw new Error("Kling task succeeded but returned no video URL.");
      }

      return url;
    }

    if (status === "failed") {
      throw new Error(
        `Kling generation failed: ${JSON.stringify(task).slice(0, 400)}`
      );
    }

    await sleep(8000);
  }

  throw new Error(`Kling task timed out: ${taskId}`);
}

async function downloadVideo(url, destination) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(90000),
  });

  if (!response.ok) {
    throw new Error(`Video download failed (${response.status}).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length < 10000) {
    throw new Error("Downloaded video is unexpectedly small.");
  }

  await writeFile(destination, buffer);

  return destination;
}

function splitIntoScenes(script, sceneCount = 2) {
  const clean = String(script || "")
    .replace(/\[PAUSE\]/gi, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\*\*/g, "")
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);

  if (!words.length) {
    return ["Cinematic establishing shot related to the video title"];
  }

  const count = Math.min(sceneCount, words.length);
  const scenes = [];
  const perScene = Math.ceil(words.length / count);

  for (let i = 0; i < words.length; i += perScene) {
    scenes.push(words.slice(i, i + perScene).join(" "));
  }

  return scenes.slice(0, sceneCount);
}

async function runFFmpeg(args, timeout = 180000) {
  if (!existsSync(FFMPEG)) {
    throw new Error(`FFmpeg executable not found: ${FFMPEG}`);
  }

  await execFileAsync(FFMPEG, args, {
    timeout,
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
}

export async function renderKlingVideo(
  hindiScript,
  title,
  catKey,
  W,
  H,
  duration,
  mixedPath,
  outputPath,
  conf,
  storageDir,
  videoId
) {
  const apiKey = process.env.KLING_API_KEY;

  if (!apiKey) {
    throw new Error("KLING_API_KEY is missing from the environment.");
  }

  if (!existsSync(mixedPath)) {
    throw new Error(`Voiceover/audio file not found: ${mixedPath}`);
  }

  const tempDir = path.join(storageDir, "temp");
  const subtitlesDir = path.join(storageDir, "subtitles");

  await mkdir(tempDir, { recursive: true });
  await mkdir(subtitlesDir, { recursive: true });
  await mkdir(path.dirname(outputPath), { recursive: true });

  const aspectRatio = W === 1080 ? "9:16" : "16:9";
  const scenes = splitIntoScenes(hindiScript, 2);
  const queries =
    Array.isArray(conf?.queries) && conf.queries.length
      ? conf.queries
      : ["cinematic environment"];

  const stylePrefix =
    `${catKey || "general"} theme, cinematic composition, ` +
    "detailed visuals, natural motion, dramatic lighting, no text";

  const clipPaths = [];

  console.log(`Starting Kling AI generation for ${videoId}`);
  console.log(`Scene count: ${scenes.length}`);

  try {
    for (let i = 0; i < scenes.length; i++) {
      const visualQuery = queries[i % queries.length];

      // Include the actual video title and corresponding script segment.
      const prompt =
        `Video topic: ${title}. ` +
        `Scene description: ${scenes[i]}. ` +
        `Visual direction: ${visualQuery}, ${stylePrefix}`;

      console.log(`Requesting Kling scene ${i + 1}/${scenes.length}`);

      const taskId = await createKlingTask(
        prompt,
        aspectRatio,
        apiKey
      );

      console.log(`Kling task created: ${taskId}`);

      const videoUrl = await pollKlingTask(taskId, apiKey);

      const clipPath = path.join(
        tempDir,
        `${videoId}_kling_${i}.mp4`
      );

      await downloadVideo(videoUrl, clipPath);

      if (!existsSync(clipPath) || statSync(clipPath).size < 10000) {
        throw new Error(`Kling scene ${i + 1} failed file validation.`);
      }

      clipPaths.push(clipPath);
      console.log(`Scene ${i + 1} downloaded successfully.`);
    }

    if (!clipPaths.length) {
      throw new Error("Kling did not generate any video scenes.");
    }

    // Normalize each clip to the target dimensions and frame rate.
    const normalizedPaths = [];

    for (let i = 0; i < clipPaths.length; i++) {
      const normalizedPath = path.join(
        tempDir,
        `${videoId}_normalized_${i}.mp4`
      );

      await runFFmpeg(
        [
          "-y",
          "-i",
          clipPaths[i],
          "-vf",
          `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=30`,
          "-an",
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "23",
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "+faststart",
          normalizedPath,
        ],
        180000
      );

      if (
        !existsSync(normalizedPath) ||
        statSync(normalizedPath).size < 10000
      ) {
        throw new Error(`Failed to normalize scene ${i + 1}.`);
      }

      normalizedPaths.push(normalizedPath);
    }

    // Build a concat list using FFmpeg's concat demuxer.
    const listPath = path.join(tempDir, `${videoId}_concat.txt`);

    const listContent = normalizedPaths
      .map((file) => {
        const safePath = file.replace(/\\/g, "/").replace(/'/g, "'\\''");
        return `file '${safePath}'`;
      })
      .join("\n");

    await writeFile(listPath, listContent, "utf8");

    const silentVideoPath = path.join(
      tempDir,
      `${videoId}_joined.mp4`
    );

    await runFFmpeg(
      [
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listPath,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-pix_fmt",
        "yuv420p",
        "-an",
        "-movflags",
        "+faststart",
        silentVideoPath,
      ],
      180000
    );

    if (
      !existsSync(silentVideoPath) ||
      statSync(silentVideoPath).size < 10000
    ) {
      throw new Error("FFmpeg could not concatenate the generated scenes.");
    }

    // Add the generated voiceover and trim to its requested duration.
    await runFFmpeg(
      [
        "-y",
        "-i",
        silentVideoPath,
        "-i",
        mixedPath,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-t",
        String(Math.max(1, Number(duration) || 5)),
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        outputPath,
      ],
      180000
    );

    if (!existsSync(outputPath) || statSync(outputPath).size < 50000) {
      throw new Error("Final MP4 was not created or failed file validation.");
    }

    console.log(
      `Kling AI render completed: ${outputPath} (${clipPaths.length} scenes)`
    );

    return true;
  } catch (error) {
    // Remove an incomplete output so it cannot be mistaken for a success.
    try {
      if (existsSync(outputPath)) {
        await unlink(outputPath);
      }
    } catch {}

    console.error("Kling video rendering failed:", error.message);

    // Propagate the error; do not silently pretend that generation succeeded.
    throw error;
  } finally {
    // Remove temporary scene files, retaining the final MP4.
    for (const file of clipPaths) {
      try {
        if (existsSync(file)) await unlink(file);
      } catch {}
    }
  }
}
