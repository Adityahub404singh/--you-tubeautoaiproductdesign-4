
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

export const runtime = "nodejs";

type VoiceConfig = {
  voice: string;
  rate: string;
  pitch: string;
  desc: string;
  elevenVoiceId?: string;
};

const VOICE_CONFIG: Record<string, VoiceConfig> = {
  cinematic: {
    voice: "hi-IN-MadhurNeural",
    rate: "+5%",
    pitch: "-3Hz",
    desc: "Cinematic - deep male",
    elevenVoiceId: "pNInz6obpgDQGcFmaJgB",
  },
  fakes: {
    voice: "hi-IN-SwaraNeural",
    rate: "+18%",
    pitch: "+2Hz",
    desc: "Fakes - energetic fast",
  },
  mysteries: {
    voice: "hi-IN-SwaraNeural",
    rate: "+10%",
    pitch: "-4Hz",
    desc: "Mysteries - whisper dark",
  },
  brainrot: {
    voice: "hi-IN-SwaraNeural",
    rate: "+25%",
    pitch: "+5Hz",
    desc: "Brainrot - ultra fast hype",
  },
  quiz: {
    voice: "hi-IN-MadhurNeural",
    rate: "+15%",
    pitch: "+3Hz",
    desc: "Quiz - game show host",
  },
  avatar: {
    voice: "hi-IN-MadhurNeural",
    rate: "+8%",
    pitch: "+0Hz",
    desc: "Avatar - professional anchor",
  },
  localizer: {
    voice: "hi-IN-SwaraNeural",
    rate: "+10%",
    pitch: "+0Hz",
    desc: "Localizer - natural narrator",
  },
  facts: {
    voice: "hi-IN-MadhurNeural",
    rate: "+12%",
    pitch: "+2Hz",
    desc: "Facts - confident male",
  },
  motivation: {
    voice: "hi-IN-MadhurNeural",
    rate: "+8%",
    pitch: "+0Hz",
    desc: "Motivation - powerful male",
  },
  tech: {
    voice: "hi-IN-MadhurNeural",
    rate: "+15%",
    pitch: "+1Hz",
    desc: "Tech - fast energetic",
  },
  story: {
    voice: "hi-IN-SwaraNeural",
    rate: "+15%",
    pitch: "+0Hz",
    desc: "Story - clear female",
  },
  horror: {
    voice: "hi-IN-SwaraNeural",
    rate: "+15%",
    pitch: "-5Hz",
    desc: "Horror - clear deep",
  },
  general: {
    voice: "hi-IN-MadhurNeural",
    rate: "+10%",
    pitch: "+0Hz",
    desc: "General - balanced",
  },
};

async function translateToHindi(text: string): Promise<string> {
  if (!text || text.length < 3) return text;

  const hindiRatio =
    (text.match(/[\u0900-\u097F]/g) || []).length /
    (text.replace(/\s/g, "").length || 1);

  if (hindiRatio > 0.25) return text;

  try {
    const chunks = text.match(/[\s\S]{1,400}/g) || [text];
    const results: string[] = [];

    for (const chunk of chunks) {
      const url =
        `https://translate.googleapis.com/translate_a/single` +
        `?client=gtx&sl=auto&tl=hi&dt=t&q=${encodeURIComponent(chunk)}`;

      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        results.push(chunk);
        continue;
      }

      const data = await res.json();
      const translated = (data[0] || [])
        .map((item: any) => item?.[0] || "")
        .join("");

      results.push(translated || chunk);
    }

    return results.join(" ");
  } catch (error) {
    console.error("Hindi translation failed:", error);
    return text;
  }
}

function cleanForTTS(text: string): string {
  return text
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/`/g, "")
    .replace(/[\u2014\u2013]/g, ", ")
    .replace(/[^\x20-\x7E\u0900-\u097F\u0964\u0965\n.!?,;:]/g, " ")
    .replace(/\n+/g, ". ")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const {
      text,
      category = "general",
      isShorts = false,
      translateHindi = true,
    } = await req.json();

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Text required" },
        { status: 400 }
      );
    }

    const audioDir = path.join(process.cwd(), "storage", "audio");

    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);

    const catKey = String(category || "general")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    const config = VOICE_CONFIG[catKey] || VOICE_CONFIG.general;
    const maxLen = isShorts ? 450 : 3500;

    let processedText = text.trim();

    if (translateHindi) {
      processedText = await translateToHindi(processedText);
    }

    const cleanedText = cleanForTTS(processedText).slice(0, maxLen);

    if (!cleanedText) {
      return NextResponse.json(
        { error: "No usable text for voice generation" },
        { status: 400 }
      );
    }

    // Option 1: ElevenLabs
    if (process.env.ELEVENLABS_API_KEY && config.elevenVoiceId) {
      try {
        const elRes = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${config.elevenVoiceId}`,
          {
            method: "POST",
            headers: {
              Accept: "audio/mpeg",
              "Content-Type": "application/json",
              "xi-api-key": process.env.ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
              text: cleanedText,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
              },
            }),
            signal: AbortSignal.timeout(30000),
          }
        );

        if (elRes.ok) {
          const buffer = Buffer.from(await elRes.arrayBuffer());

          if (buffer.length > 1000) {
            await writeFile(filePath, buffer);
            console.log(`ElevenLabs audio generated: ${fileName}`);

            return NextResponse.json({
              success: true,
              audioUrl: `/storage/audio/${fileName}`,
              provider: "elevenlabs",
            });
          }
        } else {
          console.error(
            "ElevenLabs API error:",
            elRes.status,
            await elRes.text()
          );
        }
      } catch (error: any) {
        console.error(
          "ElevenLabs fallback to Edge TTS:",
          error.message
        );
      }
    }

    // Option 2: Microsoft Edge TTS
    try {
      const tts = new MsEdgeTTS();

      await tts.setMetadata(
        config.voice,
        OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3
      );

      const readable = tts.toStream(cleanedText, {
        rate: config.rate,
        pitch: config.pitch,
      });

      const chunks: Buffer[] = [];

      await new Promise<void>((resolve, reject) => {
        let settled = false;

        const finish = (error?: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);

          if (error) reject(error);
          else resolve();
        };

        const timeout = setTimeout(() => {
          finish(new Error("TTS Timeout"));
        }, 90000);

        readable.audioStream.on("data", (chunk: Buffer) => {
          chunks.push(Buffer.from(chunk));
        });

        readable.audioStream.on("end", async () => {
          try {
            const buffer = Buffer.concat(chunks);

            if (buffer.length <= 1000) {
              finish(new Error("Audio stream too small"));
              return;
            }

            await writeFile(filePath, buffer);

            console.log(
              `Edge TTS OK: ${(buffer.length / 1024).toFixed(0)} KB | ${config.desc}`
            );

            finish();
          } catch (error: any) {
            finish(error);
          }
        });

        readable.audioStream.on("error", (error: Error) => {
          finish(error);
        });
      });

      return NextResponse.json({
        success: true,
        audioUrl: `/storage/audio/${fileName}`,
        provider: "msedge-tts",
        voice: config.voice,
        category: catKey,
      });
    } catch (error: any) {
      console.error("msedge-tts failed:", error.message);
    }

    // Option 3: Google Translate TTS
    try {
      const shortText = cleanedText.slice(0, 200);

      const url =
        `https://translate.google.com/translate_tts` +
        `?ie=UTF-8&q=${encodeURIComponent(shortText)}` +
        `&tl=hi&client=tw-ob`;

      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());

        if (buffer.length > 1000) {
          await writeFile(filePath, buffer);

          return NextResponse.json({
            success: true,
            audioUrl: `/storage/audio/${fileName}`,
            provider: "google-tts",
          });
        }
      }
    } catch (error: any) {
      console.error("Google TTS failed:", error.message);
    }

    // Option 4: Silent MP3 fallback using FFmpeg
    try {
      const { execFile } = await import("child_process");
      const { promisify } = await import("util");
      const execFileAsync = promisify(execFile);

      const ffmpeg =
        process.platform === "win32"
          ? "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe"
          : "ffmpeg";

      await execFileAsync(
        ffmpeg,
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          "anullsrc=r=44100:cl=stereo",
          "-t",
          "45",
          "-q:a",
          "9",
          "-acodec",
          "libmp3lame",
          filePath,
        ],
        { timeout: 15000 }
      );

      return NextResponse.json({
        success: true,
        audioUrl: `/storage/audio/${fileName}`,
        provider: "silent",
        warning: "Speech providers failed; generated silent fallback audio.",
      });
    } catch (error: any) {
      console.error("FFmpeg silent fallback failed:", error.message);

      return NextResponse.json(
        {
          error: "All voice generation providers failed",
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Voice Error:", error.message);

    return NextResponse.json(
      { error: "Voice generation request failed", details: error.message },
      { status: 500 }
    );
  }
}
