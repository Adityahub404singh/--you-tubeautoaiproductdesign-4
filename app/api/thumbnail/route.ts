
import { NextRequest, NextResponse } from "next/server";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

const FFMPEG =
  process.platform === "win32"
    ? "C:\\Users\\alc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe"
    : "ffmpeg";

const THEMES: Record<string, { bg: string; accent: string; secondary: string }> = {
  cinematic: { bg: "090B18", accent: "FF304F", secondary: "711C91" },
  fakes: { bg: "10121C", accent: "FFD166", secondary: "9B5DE5" },
  mysteries: { bg: "10091F", accent: "C77DFF", secondary: "5A189A" },
  brainrot: { bg: "061A12", accent: "57FF9A", secondary: "007F5F" },
  quiz: { bg: "071B2B", accent: "36DFFF", secondary: "2457C5" },
  avatar: { bg: "071B13", accent: "69F0AE", secondary: "00897B" },
  localizer: { bg: "201007", accent: "FF9F43", secondary: "C44500" },
  psychology: { bg: "11091F", accent: "C4A1FF", secondary: "7028E4" },
  stoicism: { bg: "14171D", accent: "D5D9E0", secondary: "626B7A" },
  quotes: { bg: "1B1008", accent: "FFD166", secondary: "B45309" },
  businesslessons: { bg: "071523", accent: "55B7FF", secondary: "1759C5" },
  storytelling: { bg: "1B0810", accent: "FF6685", secondary: "A4133C" },
  startupstories: { bg: "061925", accent: "48E0E4", secondary: "087E8B" },
  luxury: { bg: "171205", accent: "FFD778", secondary: "9D7416" },
  history: { bg: "19100A", accent: "E4B77A", secondary: "80552D" },
  horror: { bg: "130607", accent: "FF4545", secondary: "760D16" },
  motivation: { bg: "1C0D05", accent: "FF9B54", secondary: "D9480F" },
  facts: { bg: "071427", accent: "4DE2FF", secondary: "2855C5" },
  ainews: { bg: "071427", accent: "42DFFF", secondary: "3949AB" },
  general: { bg: "100C20", accent: "FF75B5", secondary: "6C35C9" },
};

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFKC")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function escapeDrawtext(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/%/g, "\\%")
    .replace(/,/g, "\\,")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

function wrapWords(value: string, maxChars: number, maxLines: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + " " + word).length <= maxChars) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }

    if (lines.length === maxLines) break;
  }

  if (current && lines.length < maxLines) lines.push(current);

  return lines;
}

function drawText(
  text: string,
  font: string,
  size: number,
  color: string,
  y: string,
): string {
  const fontOption = font
    ? `fontfile='${escapeDrawtext(font)}':`
    : "";

  return `drawtext=${fontOption}text='${escapeDrawtext(text)}':fontsize=${size}:fontcolor=0x${color}:x=(w-text_w)/2:y=${y}:shadowcolor=black@0.8:shadowx=3:shadowy=4`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const title = cleanText(body.title, 180);
    const boldText = cleanText(body.boldText, 100);
    const category =
      typeof body.category === "string"
        ? body.category.toLowerCase().replace(/[^a-z]/g, "")
        : "general";

    const videoType = body.videoType;
    const isShorts = videoType === "shorts";

    if (!title && !boldText) {
      return NextResponse.json(
        { success: false, error: "Title or boldText is required." },
        { status: 400 },
      );
    }

    const width = isShorts ? 1080 : 1280;
    const height = isShorts ? 1920 : 720;
    const theme = THEMES[category] || THEMES.general;
    const displayTitle = (boldText || title).toUpperCase();

    const thumbnailDir = path.join(
      process.cwd(),
      "storage",
      "thumbnails",
    );

    await mkdir(thumbnailDir, { recursive: true });

    const fileName = `thumb_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.jpg`;

    const filePath = path.join(thumbnailDir, fileName);

    const fontCandidates =
      process.platform === "win32"
        ? [
            path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Bold.ttf"),
            "C:\\Windows\\Fonts\\arialbd.ttf",
          ]
        : [
            path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Bold.ttf"),
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
          ];

    const font = fontCandidates.find((candidate) => existsSync(candidate)) || "";

    const lines = wrapWords(
      displayTitle,
      isShorts ? 17 : 23,
      isShorts ? 4 : 3,
    );

    const accentWidth = Math.round(width * 0.025);
    const topBarHeight = Math.round(height * 0.014);
    const titleSize = isShorts ? 82 : 76;
    const lineGap = isShorts ? 105 : 91;
    const blockHeight = lines.length * lineGap;
    const startY = Math.round((height - blockHeight) / 2);

    const filters: string[] = [
      // Strong colour frame
      `drawbox=x=0:y=0:w=${width}:h=${height}:color=0x${theme.bg}:t=fill`,
      `drawbox=x=0:y=0:w=${width}:h=${topBarHeight}:color=0x${theme.accent}:t=fill`,
      `drawbox=x=0:y=0:w=${accentWidth}:h=${height}:color=0x${theme.accent}:t=fill`,

      // Layered geometric accents
      `drawbox=x=${Math.round(width * 0.64)}:y=${Math.round(height * 0.15)}:w=${Math.round(width * 0.38)}:h=${Math.round(height * 0.20)}:color=0x${theme.secondary}@0.35:t=fill`,
      `drawbox=x=${Math.round(width * 0.48)}:y=${Math.round(height * 0.68)}:w=${Math.round(width * 0.55)}:h=${Math.round(height * 0.16)}:color=0x${theme.accent}@0.12:t=fill`,

      // Central contrast panel
      `drawbox=x=${Math.round(width * 0.07)}:y=${Math.round(height * 0.27)}:w=${Math.round(width * 0.86)}:h=${Math.round(height * 0.46)}:color=black@0.38:t=fill`,

      // Small category label
      drawText(
        category.toUpperCase().replace(/LESSONS/g, ""),
        font,
        isShorts ? 30 : 25,
        theme.accent,
        `${Math.round(height * 0.20)}`,
      ),
    ];

    lines.forEach((line, index) => {
      filters.push(
        drawText(
          line,
          font,
          titleSize,
          index === 0 ? "FFFFFF" : theme.accent,
          `${startY + index * lineGap}`,
        ),
      );
    });

    // Bottom accent and channel-independent footer
    filters.push(
      `drawbox=x=${Math.round(width * 0.34)}:y=${Math.round(height * 0.79)}:w=${Math.round(width * 0.32)}:h=${Math.round(height * 0.009)}:color=0x${theme.accent}:t=fill`,
      drawText(
        "WATCH NOW",
        font,
        isShorts ? 27 : 23,
        "FFFFFF",
        `${Math.round(height * 0.83)}`,
      ),
    );

    try {
      await execFileAsync(
        FFMPEG,
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          `color=c=0x${theme.bg}:s=${width}x${height}:d=1`,
          "-vf",
          filters.join(","),
          "-frames:v",
          "1",
          "-q:v",
          "2",
          filePath,
        ],
        { timeout: 30000, windowsHide: true },
      );
    } catch (error) {
      console.error("FFmpeg thumbnail generation failed:", error);

      return NextResponse.json(
        {
          success: false,
          error:
            "Thumbnail generation failed. Check FFmpeg installation and font availability.",
        },
        { status: 500 },
      );
    }

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: "Thumbnail file was not created." },
        { status: 500 },
      );
    }

    const thumbnailUrl = `/api/storage/thumbnails/${fileName}`;

    return NextResponse.json({
      success: true,
      thumbnailUrl,
      url: thumbnailUrl,
      fileName,
      width,
      height,
    });
  } catch (error) {
    console.error("Thumbnail API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected thumbnail generation error.",
      },
      { status: 500 },
    );
  }
}
