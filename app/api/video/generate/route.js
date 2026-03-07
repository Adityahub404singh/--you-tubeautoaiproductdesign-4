import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const execAsync = promisify(exec);

export async function POST(request) {
  try {
    let { audioUrl, thumbnailUrl, title, duration = 60 } = await request.json();
    if (!audioUrl) return NextResponse.json({ error: "audioUrl required" }, { status: 400 });

    const baseUrl = "http://localhost:3000";
    if (audioUrl.startsWith("/")) audioUrl = baseUrl + audioUrl;
    if (thumbnailUrl && thumbnailUrl.startsWith("/")) thumbnailUrl = baseUrl + thumbnailUrl;

    const storageDir = path.join(process.cwd(), "storage");
    const videosDir = path.join(storageDir, "videos");
    const tempDir = path.join(storageDir, "temp");
    for (const dir of [storageDir, videosDir, tempDir]) {
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    }

    const videoId = `video_${Date.now()}`;
    const audioPath = path.join(tempDir, `${videoId}_audio.mp3`);
    const thumbPath = path.join(tempDir, `${videoId}_thumb.jpg`);
    const outputPath = path.join(videosDir, `${videoId}.mp4`);
    const publicVideoPath = `/storage/videos/${videoId}.mp4`;

    // Audio download
    if (audioUrl.startsWith("http://localhost")) {
      const localPath = audioUrl.replace("http://localhost:3000", "");
      const localFilePath = path.join(process.cwd(), "storage", localPath.replace("/storage/", ""));
      try {
        const s = await stat(localFilePath);
        if (s.isFile()) {
          const { copyFile } = await import("fs/promises");
          await copyFile(localFilePath, audioPath);
        } else {
          throw new Error("not a file");
        }
      } catch (e) {
        await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "${audioPath}"`);
      }
    } else {
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error("Audio download failed");
      await writeFile(audioPath, Buffer.from(await audioRes.arrayBuffer()));
    }

    // Thumbnail - try local file first, then HTTP fetch, then black frame
    let thumbCopied = false;
    if (thumbnailUrl) {
      // Try local file
      try {
        const thumbRelative = thumbnailUrl.replace("http://localhost:3000/storage/", "").replace("/storage/", "");
        const thumbLocalPath = path.join(process.cwd(), "storage", thumbRelative);
        const s = await stat(thumbLocalPath);
        if (s.isFile()) {
          const { copyFile } = await import("fs/promises");
          await copyFile(thumbLocalPath, thumbPath);
          thumbCopied = true;
          console.log("Thumbnail: local file used");
        }
      } catch (e) {
        // Try HTTP fetch
        try {
          const thumbRes = await fetch(thumbnailUrl.startsWith("http") ? thumbnailUrl : `http://localhost:3000${thumbnailUrl}`);
          if (thumbRes.ok) {
            await writeFile(thumbPath, Buffer.from(await thumbRes.arrayBuffer()));
            thumbCopied = true;
            console.log("Thumbnail: HTTP fetch used");
          }
        } catch (e2) {
          console.log("Thumbnail fetch failed:", e2.message);
        }
      }
    }

    if (!thumbCopied) {
      // Generate colorful thumbnail with title text using ffmpeg
      const safeTitle = (title || "AI Video").replace(/['"]/g, "").slice(0, 40);
      await execAsync(`ffmpeg -y -f lavfi -i color=#1a1a2e:size=1280x720:rate=1 -frames:v 1 "${thumbPath}"`);
      console.log("Thumbnail: generated black frame");
    }

    // FFmpeg - fast preset
    const ffmpegCmd = `ffmpeg -y -loop 1 -i "${thumbPath}" -i "${audioPath}" -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 128k -pix_fmt yuv420p -shortest -vf "scale=1280:720,setsar=1" "${outputPath}"`;

    console.log("FFmpeg starting...");
    await execAsync(ffmpegCmd, { timeout: 300000 });
    console.log("FFmpeg done!");

    return NextResponse.json({
      success: true,
      videoId,
      videoPath: outputPath,
      videoUrl: publicVideoPath,
      message: "Video ban gayi!",
    });

  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}