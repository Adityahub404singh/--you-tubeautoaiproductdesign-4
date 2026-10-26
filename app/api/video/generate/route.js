// app/api/video/generate/route.js
// YouTubeAuto.ai - Kling AI + video rendering fallbacks

import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import {
  writeFile,
  mkdir,
  copyFile,
  unlink,
} from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";

const execAsync = promisify(exec);

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";
const ENV = { ...process.env };

const CAT = {
  cinematic: {
    queries: [
      "dark rain luxury suit man",
      "greek statue fire cinematic",
      "luxury car steering night",
    ],
    accent: "FF0000",
    mode: "cinematic",
  },
  fakes: {
    queries: [
      "minecraft parkour gameplay",
      "gta v ramp jump",
      "subway surfers satisfying",
    ],
    accent: "FFD700",
    mode: "typography",
  },
  mysteries: {
    queries: [
      "scary forest red eyes",
      "pyramid night glowing",
      "space black hole 4k",
    ],
    accent: "CC44FF",
    mode: "cinematic",
  },
  brainrot: {
    queries: [
      "kinetic sand cutting asmr",
      "hydraulic press satisfying",
      "subway surfers gameplay",
    ],
    accent: "00FF88",
    mode: "split",
  },
  quiz: {
    queries: [
      "countdown timer clock",
      "trivia gameshow neon",
      "world map flag quiz",
    ],
    accent: "00E5FF",
    mode: "quiz",
  },
  avatar: {
    queries: [
      "news anchor studio holographic",
      "tech review studio futuristic",
    ],
    accent: "00E676",
    mode: "cinematic",
  },
  facts: {
    queries: [
      "space galaxy nebula cinematic",
      "science lab neon blue",
    ],
    accent: "00E5FF",
    mode: "cinematic",
  },
  motivation: {
    queries: [
      "athlete sunrise mountain epic",
      "champion victory slow motion",
    ],
    accent: "FF6D00",
    mode: "cinematic",
  },
  tech: {
    queries: [
      "holographic AI robot neon blue",
      "cyberpunk city rain neon",
    ],
    accent: "00FF88",
    mode: "cinematic",
  },
  story: {
    queries: [
      "dark forest fog cinematic",
      "abandoned house mystery",
    ],
    accent: "CC44FF",
    mode: "typography",
  },
  horror: {
    queries: [
      "haunted house dark fog",
      "horror corridor shadow",
    ],
    accent: "FF0000",
    mode: "typography",
  },
  finance: {
    queries: [
      "stock market charts gold",
      "gold coins wealth luxury",
    ],
    accent: "FFD700",
    mode: "cinematic",
  },
  general: {
    queries: [
      "cinematic aerial drone sunset",
      "epic mountains golden",
    ],
    accent: "FF4081",
    mode: "cinematic",
  },
};

async function downloadFile(url, destination) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error("Download failed:", response.status);
      return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length < 1000) {
      return false;
    }

    await writeFile(destination, buffer);
    return true;
  } catch (error) {
    console.error("Download error:", error.message);
    return false;
  }
}

async function translateToHindi(text) {
  if (!text || !text.trim()) return text;

  try {
    const chunks = text.match(/[\s\S]{1,400}/g) || [text];
    const translated = [];

    for (const chunk of chunks) {
      const url =
        "https://translate.googleapis.com/translate_a/single" +
        "?client=gtx&sl=auto&tl=hi&dt=t&q=" +
        encodeURIComponent(chunk);

      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        translated.push(chunk);
        continue;
      }

      const data = await response.json();

      translated.push(
        (data[0] || [])
          .map((part) => part?.[0] || "")
          .join("") || chunk
      );
    }

    return translated.join(" ");
  } catch (error) {
    console.warn("Hindi translation failed:", error.message);
    return text;
  }
}

function generateASS(
  script,
  duration,
  isShorts,
  category = "general"
) {
  if (!script || script.length < 5) return null;

  const words = script
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\*{1,3}/g, "")
    .replace(/#+\s/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return null;

  const chunkSize = isShorts ? 3 : 5;
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  const chunkDuration = duration / chunks.length;
  const fontSize = isShorts ? 68 : 48;
  const marginV = isShorts ? 220 : 90;

  const formatTime = (seconds) => {
    const safe = Math.max(0, seconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = Math.floor(safe % 60);
    const centiseconds = Math.floor((safe % 1) * 100);

    return (
      `${hours}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(secs).padStart(2, "0")}.` +
      String(centiseconds).padStart(2, "0")
    );
  };

  const fontName =
    category === "cinematic" ? "Arial" : "Arial";

  const primaryColor =
    category === "cinematic" ? "&H00FFFFFF" : "&H0000FFFF";

  let ass =
    "[Script Info]\n" +
    "ScriptType: v4.00+\n" +
    `PlayResX: ${isShorts ? 1080 : 1920}\n` +
    `PlayResY: ${isShorts ? 1920 : 1080}\n` +
    "WrapStyle: 1\n\n";

  ass +=
    "[V4+ Styles]\n" +
    "Format: Name, Fontname, Fontsize, PrimaryColour, " +
    "SecondaryColour, OutlineColour, BackColour, Bold, Italic, " +
    "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, " +
    "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, " +
    "MarginV, Encoding\n";

  ass +=
    `Style: Main,${fontName},${fontSize},${primaryColor},` +
    "&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0," +
    `1,3,2,2,30,30,${marginV},1\n`;

  ass +=
    "\n[Events]\n" +
    "Format: Layer, Start, End, Style, Name, MarginL, " +
    "MarginR, MarginV, Effect, Text\n";

  const lines = chunks
    .map((chunk, index) => {
      const start = index * chunkDuration;
      const end = Math.min(
        (index + 1) * chunkDuration,
        duration
      );

      const caption = chunk
        .replace(/[{}]/g, "")
        .replace(/\n/g, " ");

      return (
        `Dialogue: 0,${formatTime(start)},` +
        `${formatTime(Math.max(start + 0.05, end))},` +
        `Main,,0,0,0,,${caption}`
      );
    })
    .join("\n");

  return ass + lines + "\n";
}

async function makeSilentAudio(audioPath) {
  await execAsync(
    `"${FFMPEG}" -y -f lavfi ` +
      `-i "anullsrc=r=44100:cl=stereo" ` +
      `-t 45 -q:a 9 -acodec libmp3lame "${audioPath}"`,
    { timeout: 30000, env: ENV }
  );
}

export async function POST(request) {
  const clips = [];

  try {
    const body = await request.json();

    const {
      audioUrl,
      title = "Untitled Video",
      script = "",
      hook = "",
      videoType = "long",
      category = "general",
      videoMode,
    } = body;

    const storageDir = path.join(process.cwd(), "storage");

    const folders = [
      "videos",
      "temp",
      "thumbnails",
      "music",
      "clips",
      "subtitles",
      "ai_bg",
      "audio",
    ];

    for (const folder of folders) {
      await mkdir(path.join(storageDir, folder), {
        recursive: true,
      });
    }

    const videoId = `video_${Date.now()}`;

    const catKey = String(category || "general")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    const conf = CAT[catKey] || CAT.general;

    const isShorts =
      videoType === "shorts" ||
      catKey === "shorts" ||
      catKey === "brainrot" ||
      catKey === "fakes";

    const W = isShorts ? 1080 : 1920;
    const H = isShorts ? 1920 : 1080;
    const mode = videoMode || conf.mode || "cinematic";

    let hindiScript = String(script || hook || title || "");

    if (body.language === "hi" && hindiScript.length > 5) {
      hindiScript = await translateToHindi(hindiScript);
    }

    // Prepare voice/audio.
    const audioPath = path.join(
      storageDir,
      "temp",
      `${videoId}_audio.mp3`
    );

    if (audioUrl) {
      const audioName = path.basename(
        String(audioUrl).split("?")[0]
      );

      const localAudio = path.join(
        storageDir,
        "audio",
        audioName
      );

      if (existsSync(localAudio)) {
        await copyFile(localAudio, audioPath);
      } else if (/^https?:\/\//i.test(String(audioUrl))) {
        const downloaded = await downloadFile(
          String(audioUrl),
          audioPath
        );

        if (!downloaded) {
          console.warn("Could not download supplied audio.");
        }
      }
    }

    if (!existsSync(audioPath)) {
      await makeSilentAudio(audioPath);
    }

    let audioDuration = 45;

    try {
      const probe = await execAsync(
        `"${FFPROBE}" -v quiet -print_format json ` +
          `-show_streams "${audioPath}"`,
        { timeout: 15000, env: ENV }
      );

      const streams = JSON.parse(probe.stdout).streams || [];
      const audioStream = streams.find(
        (stream) => stream.codec_type === "audio"
      );

      const parsedDuration = Number(audioStream?.duration);

      if (
        Number.isFinite(parsedDuration) &&
        parsedDuration > 0
      ) {
        audioDuration = Math.ceil(parsedDuration);
      }
    } catch (error) {
      console.warn(
        "Could not detect audio duration:",
        error.message
      );
    }

    const effectiveDuration = isShorts
      ? Math.min(audioDuration, 58)
      : audioDuration;

    // Mix voice and background music.
    const mixedPath = path.join(
      storageDir,
      "temp",
      `${videoId}_mix.mp3`
    );

    try {
      const {
        getBgMusic,
        mixVoiceWithMusic,
      } = await import("./music-helper.js");

      const musicPath = await getBgMusic(
        catKey,
        effectiveDuration,
        storageDir
      );

      if (musicPath) {
        const mixed = await mixVoiceWithMusic(
          audioPath,
          musicPath,
          mixedPath,
          effectiveDuration
        );

        if (!mixed) {
          await copyFile(audioPath, mixedPath);
        }
      } else {
        await copyFile(audioPath, mixedPath);
      }
    } catch (error) {
      console.warn("Background music failed:", error.message);
      await copyFile(audioPath, mixedPath);
    }

    const outputPath = path.join(
      storageDir,
      "videos",
      `${videoId}.mp4`
    );

    let success = false;

    // OPTION A: Kling AI generation.
    if (mode === "cinematic" || mode === "ai_scene") {
      try {
        if (!process.env.KLING_API_KEY) {
          console.warn("KLING_API_KEY missing; skipping Kling.");
        } else {
          const {
            renderKlingVideo,
          } = await import("./kling-video-helper.js");

          success = await renderKlingVideo(
            hindiScript,
            title,
            catKey,
            W,
            H,
            effectiveDuration,
            mixedPath,
            outputPath,
            conf,
            storageDir,
            videoId
          );

          if (success) {
            success =
              existsSync(outputPath) &&
              statSync(outputPath).size > 50000;
          }

          if (success) {
            console.log("Kling AI render completed:", outputPath);
          }
        }
      } catch (error) {
        console.error("Kling AI render error:", error.message);
        success = false;
      }
    }

    // OPTION B: Existing AI scene renderer.
    if (
      !success &&
      (mode === "ai_scene" || mode === "cinematic")
    ) {
      try {
        const {
          renderAISceneVideo,
        } = await import("./ai-scene-helper.js");

        success = await renderAISceneVideo(
          hindiScript,
          title,
          catKey,
          W,
          H,
          effectiveDuration,
          mixedPath,
          outputPath,
          conf,
          storageDir,
          videoId
        );

        if (success) {
          success =
            existsSync(outputPath) &&
            statSync(outputPath).size > 10000;
        }
      } catch (error) {
        console.error("AI Scene render error:", error.message);
        success = false;
      }
    }

    // OPTION C: Prepare subtitles.
    const assPath = path.join(
      storageDir,
      "subtitles",
      `${videoId}.ass`
    );

    const assContent = generateASS(
      hindiScript,
      effectiveDuration,
      isShorts,
      catKey
    );

    let hasSubs = false;

    if (assContent) {
      await writeFile(assPath, assContent, "utf8");
      hasSubs = true;
    }

    const assPathFwd = hasSubs
      ? assPath.replace(/\\/g, "/").replace(/:/g, "\\:")
      : null;

    // OPTION D: Pexels stock footage fallback.
    if (!success) {
      const pexelsKey = process.env.PEXELS_API_KEY;

      if (pexelsKey) {
        const queries = conf.queries || [];
        let clipIndex = 0;

        for (
          let queryIndex = 0;
          queryIndex < queries.length && clips.length < 5;
          queryIndex++
        ) {
          try {
            const query = queries[queryIndex];
            const orientation = isShorts
              ? "portrait"
              : "landscape";

            const response = await fetch(
              "https://api.pexels.com/videos/search?query=" +
                encodeURIComponent(query) +
                `&per_page=3&orientation=${orientation}&size=medium`,
              {
                headers: { Authorization: pexelsKey },
                signal: AbortSignal.timeout(12000),
              }
            );

            if (!response.ok) continue;

            const data = await response.json();

            for (const video of (data.videos || []).slice(0, 2)) {
              if (clips.length >= 5) break;

              const file =
                video.video_files?.find(
                  (item) =>
                    item.quality === "hd" &&
                    item.width <= 1920
                ) || video.video_files?.[0];

              if (!file?.link) continue;

              const clipPath = path.join(
                storageDir,
                "clips",
                `clip_${videoId}_${clipIndex}.mp4`
              );

              if (await downloadFile(file.link, clipPath)) {
                clips.push({
                  path: clipPath,
                  duration: video.duration || 0,
                });

                clipIndex++;
              }
            }
          } catch (error) {
            console.warn("Pexels search failed:", error.message);
          }
        }
      }

      const accent = "0x" + conf.accent;
      const barHeight = isShorts ? 6 : 5;

      const scaleFilter =
        `scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
        `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1`;

      const progressFilter =
        `drawbox=x=0:y=h-${barHeight}:` +
        `w=iw*t/${effectiveDuration}:h=${barHeight}:` +
        `color=${accent}@1.0:t=fill`;

      const topBarFilter =
        `drawbox=x=0:y=0:w=iw:h=4:` +
        `color=${accent}@1.0:t=fill`;

      const colorGrade =
        catKey === "cinematic"
          ? "eq=contrast=1.3:saturation=0.7:brightness=-0.05"
          : "eq=contrast=1.2:saturation=1.3:brightness=0.02";

      const baseVideoFilter =
        `${scaleFilter},fps=30,${colorGrade},` +
        `${topBarFilter},${progressFilter}`;

      const fullVideoFilter = hasSubs
        ? `${baseVideoFilter},ass='${assPathFwd}'`
        : baseVideoFilter;

      const encoderArgs =
        "-c:v libx264 -preset ultrafast -crf 20 " +
        "-c:a aac -b:a 192k -pix_fmt yuv420p " +
        "-movflags +faststart";

      // Render downloaded footage if available.
      if (clips.length > 0) {
        try {
          await execAsync(
            `"${FFMPEG}" -y -stream_loop -1 ` +
              `-i "${clips[0].path}" -i "${mixedPath}" ` +
              `-vf "${fullVideoFilter}" ${encoderArgs} ` +
              `-t ${effectiveDuration} "${outputPath}"`,
            {
              timeout: 180000,
              env: ENV,
            }
          );

          success =
            existsSync(outputPath) &&
            statSync(outputPath).size > 50000;
        } catch (error) {
          console.error("Pexels render error:", error.message);
        }
      }

      // Last fallback: black background with audio.
      if (!success) {
        try {
          const fallbackFilter = hasSubs
            ? `ass='${assPathFwd}'`
            : "null";

          await execAsync(
            `"${FFMPEG}" -y ` +
              `-f lavfi -i "color=c=black:s=${W}x${H}:r=25" ` +
              `-i "${mixedPath}" -vf "${fallbackFilter}" ` +
              `${encoderArgs} -t ${effectiveDuration} "${outputPath}"`,
            {
              timeout: 120000,
              env: ENV,
            }
          );

          success =
            existsSync(outputPath) &&
            statSync(outputPath).size > 10000;
        } catch (error) {
          console.error("Black canvas render failed:", error.message);
        }
      }
    }

    // Clean up downloaded clips.
    for (const clip of clips) {
      try {
        await unlink(clip.path);
      } catch {}
    }

    if (!success || !existsSync(outputPath)) {
      throw new Error(
        "Video rendering failed. Check Kling API response, " +
          "FFmpeg installation, and server logs."
      );
    }

    const videoSize = statSync(outputPath).size;

    return NextResponse.json({
      success: true,
      videoId,
      videoUrl: `/storage/videos/${videoId}.mp4`,
      videoType: isShorts ? "shorts" : "long",
      videoMode: mode,
      duration: effectiveDuration,
      hasCaptions: hasSubs,
      message:
        `Rendered ${(videoSize / 1024 / 1024).toFixed(1)} MB | ${catKey}`,
    });
  } catch (error) {
    console.error("Video Generator Error:", error);

    for (const clip of clips) {
      try {
        await unlink(clip.path);
      } catch {}
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Video generation failed",
      },
      { status: 500 }
    );
  }
}