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
    if (!audioUrl) return NextResponse.json({ error: "audioUrl aur thumbnailUrl required hain" }, { status: 400 });
    // Relative URL ko absolute banao
    const baseUrl = "http://localhost:3000";
    if (audioUrl.startsWith("/")) audioUrl = baseUrl + audioUrl;
    if (thumbnailUrl.startsWith("/")) thumbnailUrl = baseUrl + thumbnailUrl;

    // Storage folders banao
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

    // Audio download karo - direct file read ya HTTP fetch
    if (audioUrl.startsWith("http://localhost") || audioUrl.startsWith("/storage/")) {
      // Local file - seedha read karo
      const localPath = audioUrl.startsWith("http://localhost:3000")
        ? audioUrl.replace("http://localhost:3000", "")
        : audioUrl
      const localFilePath = path.join(process.cwd(), "storage", localPath.replace("/storage/", ""))
      if (existsSync(localFilePath)) {
        const { copyFile } = await import("fs/promises")
        await copyFile(localFilePath, audioPath)
      } else {
        // File nahi hai - silent audio banao
        await execAsync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 60 -q:a 9 -acodec libmp3lame "${audioPath}"`)
      }
    } else {
      const audioRes = await fetch(audioUrl)
      if (!audioRes.ok) throw new Error("Audio download failed")
      const audioBuffer = await audioRes.arrayBuffer()
      await writeFile(audioPath, Buffer.from(audioBuffer))
    }

    // Thumbnail - direct file read
    const thumbLocalPath = path.join(process.cwd(), "storage", thumbnailUrl.replace("http://localhost:3000/storage/", "").replace("/storage/", ""))
    if (existsSync(thumbLocalPath)) {
      const { copyFile } = await import("fs/promises")
      await copyFile(thumbLocalPath, thumbPath)
    } else {
      await execAsync(`ffmpeg -y -f lavfi -i color=black:size=1280x720:rate=1 -frames:v 1 "${thumbPath}"`)
    }

    // FFmpeg se video banao: image + audio = MP4
    const ffmpegCmd = `ffmpeg -y -loop 1 -i "${thumbPath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1" "${outputPath}"`;

    console.log("FFmpeg chal raha hai...");
    const { stdout, stderr } = await execAsync(ffmpegCmd, { timeout: 120000 });
    console.log("FFmpeg done!");

    return NextResponse.json({
      success: true,
      videoId,
      videoPath: outputPath,
      videoUrl: publicVideoPath,
      message: "Video ban gayi! Ab YouTube pe upload kar sakte ho.",
    });

  } catch (error) {
    console.error("Video generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}




