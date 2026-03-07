import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const execAsync = promisify(exec);

export async function POST(request) {
  try {
    let { audioUrl, thumbnailUrl, title, duration = 60 } = await request.json();
    if (!audioUrl) return NextResponse.json({ error: "audioUrl required hai" }, { status: 400 });

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
      if (existsSync(localFilePath) && !existsSync(localFilePath) === false) {
        const { copyFile } = await import("fs/promises");
        const stat = await import("fs/promises").then(m => m.stat(localFilePath));
        if (stat.isFile()) {
          await copyFile(localFilePath, audioPath);
        } else {
          await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "${audioPath}"`);
        }
      } else {
        await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "${audioPath}"`);
      }
    } else {
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error("Audio download failed");
      await writeFile(audioPath, Buffer.from(await audioRes.arrayBuffer()));
    }

    // Thumbnail - FIXED: check karo ki file actually exist karti hai aur directory nahi
    let thumbCopied = false;
    if (thumbnailUrl) {
      try {
        const thumbRelative = thumbnailUrl
          .replace("http://localhost:3000/storage/", "")
          .replace("/storage/", "");
        const thumbLocalPath = path.join(process.cwd(), "storage", thumbRelative);
        const { stat } = await import("fs/promises");
        const s = await stat(thumbLocalPath);
        if (s.isFile()) {
          const { copyFile } = await import("fs/promises");
          await copyFile(thumbLocalPath, thumbPath);
          thumbCopied = true;
        }
      } catch (e) {
        console.log("Thumbnail file nahi mili, black frame use karenge:", e.message);
      }
    }
    if (!thumbCopied) {
      await execAsync(`ffmpeg -y -f lavfi -i color=black:size=1280x720:rate=1 -frames:v 1 "${thumbPath}"`);
    }

    const ffmpegCmd = `ffmpeg -y -loop 1 -i "${thumbPath}" -i "${audioPath}" -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -b:a 128k -pix_fmt yuv420p -shortest -vf "scale=1280:720,setsar=1" "${outputPath}"`;
    await execAsync(ffmpegCmd, { timeout: 300000 });

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