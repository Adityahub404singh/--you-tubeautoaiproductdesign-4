import { NextResponse } from "next/server";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { decryptSocialToken, encryptSocialToken } from "@/lib/social-account-crypto";
import { refreshAccessToken } from "@/lib/youtube-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type CronParts = { minute: number; hour: number; day: number; month: number; weekday: number };

function getTimeParts(date: Date, timeZone: string): CronParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, minute: "2-digit", hour: "2-digit", day: "2-digit", month: "2-digit", weekday: "short", hourCycle: "h23",
  }).formatToParts(date);
  const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const days: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { minute: Number(v.minute), hour: Number(v.hour), day: Number(v.day), month: Number(v.month), weekday: days[v.weekday] ?? date.getDay() };
}

function fieldMatches(field: string, value: number, min: number, max: number): boolean {
  if (field === "*") return true;
  return field.split(",").some((part) => {
    const [base, stepText] = part.split("/");
    const step = stepText ? Number(stepText) : 1;
    if (!Number.isInteger(step) || step < 1) return false;
    let low = min, high = max;
    if (base && base !== "*") {
      if (base.includes("-")) {
        const pair = base.split("-").map(Number);
        if (pair.length !== 2) return false;
        [low, high] = pair;
      } else {
        low = Number(base); high = low;
      }
    }
    return Number.isInteger(low) && Number.isInteger(high) && low >= min && high <= max && value >= low && value <= high && (value - low) % step === 0;
  });
}

function matchesSchedule(expression: string, date: Date, timeZone: string): boolean {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return false;
  const t = getTimeParts(date, timeZone);
  return fieldMatches(fields[0], t.minute, 0, 59) && fieldMatches(fields[1], t.hour, 0, 23) &&
    fieldMatches(fields[2], t.day, 1, 31) && fieldMatches(fields[3], t.month, 1, 12) && fieldMatches(fields[4], t.weekday, 0, 6);
}

async function callJson(baseUrl: string, route: string, body: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false || data.error) throw new Error(data.error || `${route} failed (${response.status})`);
  return data;
}

async function uploadToYouTube(filePath: string, token: string, metadata: { title: string; description: string; tags: string[] }) {
  const size = statSync(filePath).size;
  const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": String(size) },
    body: JSON.stringify({ snippet: { title: metadata.title.slice(0, 100), description: metadata.description.slice(0, 4900), tags: metadata.tags.slice(0, 20), categoryId: "22" }, status: { privacyStatus: "public", selfDeclaredMadeForKids: false } }),
  });
  const initData = await init.json().catch(() => ({}));
  if (!init.ok) throw new Error(initData?.error?.message || `YouTube upload initialization failed (${init.status})`);
  const uploadUrl = init.headers.get("location");
  if (!uploadUrl) throw new Error("YouTube did not return a resumable upload URL.");

  const source = createReadStream(filePath, { highWaterMark: 1024 * 1024 });
  const iterator = source[Symbol.asyncIterator]();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try { const next = await iterator.next(); if (next.done) controller.close(); else controller.enqueue(next.value as Uint8Array); }
      catch (error) { controller.error(error); }
    },
    async cancel() { source.destroy(); },
  });
  const result = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "video/mp4", "Content-Length": String(size) }, body: stream, duplex: "half" } as RequestInit & { duplex: "half" });
  if (!result.ok) throw new Error(`YouTube upload failed (${result.status}): ${(await result.text()).slice(0, 500)}`);
  const uploaded = await result.json();
  if (!uploaded.id) throw new Error("YouTube did not confirm a video ID.");
  return String(uploaded.id);
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const now = new Date();
  const timeZone = process.env.AUTOPILOT_TIMEZONE || "Asia/Kolkata";
  const baseUrl = new URL(request.url).origin;
  const settingsList = await prisma.autopilotSettings.findMany({ where: { isActive: true } });
  const results: Array<Record<string, unknown>> = [];

  for (const settings of settingsList) {
    if (!matchesSchedule(settings.cronSchedule, now, timeZone)) continue;
    let videoRecord: { id: string } | null = null;
    try {
      const minuteStart = new Date(now); minuteStart.setSeconds(0, 0);
      const duplicate = await prisma.video.findFirst({ where: { userId: settings.userId, createdAt: { gte: minuteStart } }, select: { id: true } });
      if (duplicate) { results.push({ userId: settings.userId, status: "skipped_duplicate_minute" }); continue; }

      const channel = await prisma.channel.findFirst({ where: { userId: settings.userId, isActive: true }, orderBy: { createdAt: "asc" } });
      if (!channel) { results.push({ userId: settings.userId, status: "skipped_no_channel" }); continue; }
      const account = await prisma.socialAccount.findFirst({ where: { userId: settings.userId, provider: "youtube", isConnected: true }, orderBy: { updatedAt: "desc" } });
      if (!account) { results.push({ userId: settings.userId, status: "skipped_youtube_not_connected" }); continue; }

      const topic = `${settings.subCategory} — ${new Intl.DateTimeFormat("en-CA", { timeZone }).format(now)} episode`;
      videoRecord = await prisma.video.create({ data: { userId: settings.userId, channelId: channel.id, title: `Generating: ${topic}`.slice(0, 100), topic, status: "autopilot-processing", scheduledDate: now } });

      const scriptData = await callJson(baseUrl, "/api/videos/generate", {
        topic, language: settings.language === "hi" ? "Hindi" : settings.language === "hinglish" ? "Hinglish" : "English",
        channelName: channel.name, category: settings.category || channel.category || "general", mode: "shorts",
      });
      const voice = await callJson(baseUrl, "/api/voiceover", { text: scriptData.script, category: settings.category || "general", isShorts: true, translateHindi: settings.language === "hi" });
      const rendered = await callJson(baseUrl, "/api/video/generate", {
        audioUrl: voice.audioUrl, title: scriptData.title, script: scriptData.script, hook: scriptData.hook,
        videoType: "shorts", category: settings.category || "general", language: settings.language,
      });
      const thumb = await callJson(baseUrl, "/api/thumbnail", { title: scriptData.title, boldText: scriptData.thumbnail?.boldText || scriptData.title, category: settings.category || "general", videoType: "shorts" });

      const commonVideoData = {
        title: String(scriptData.title || topic).slice(0, 100), script: String(scriptData.script || ""), hook: String(scriptData.hook || ""),
        description: String(scriptData.description || ""), tags: JSON.stringify(Array.isArray(scriptData.tags) ? scriptData.tags : []),
        videoType: "shorts", audioUrl: String(voice.audioUrl || ""), videoFileUrl: String(rendered.videoUrl || ""),
        thumbnailUrl: String(thumb.thumbnailUrl || ""), subCategory: settings.subCategory,
      };

      if (!settings.isAutoApprove) {
        await prisma.video.update({ where: { id: videoRecord.id }, data: { ...commonVideoData, status: "pending-approval" } });
        results.push({ userId: settings.userId, videoId: videoRecord.id, status: "pending-approval" });
        continue;
      }

      let accessToken: string;
      if (!account.accessTokenExpiry || account.accessTokenExpiry.getTime() < Date.now() + 120000) {
        if (!account.refreshToken) throw new Error("YouTube token expired and no refresh token is stored. Reconnect YouTube.");
        const refreshed = await refreshAccessToken(decryptSocialToken(account.refreshToken));
        accessToken = refreshed.access_token;
        await prisma.socialAccount.update({ where: { id: account.id }, data: { accessToken: encryptSocialToken(accessToken), accessTokenExpiry: new Date(Date.now() + Number(refreshed.expires_in || 3600) * 1000) } });
      } else accessToken = decryptSocialToken(account.accessToken);

      const fileName = path.basename(String(rendered.videoUrl || ""));
      const videoPath = path.resolve(process.cwd(), "storage", "videos", fileName);
      if (!fileName || !videoPath.startsWith(path.resolve(process.cwd(), "storage", "videos") + path.sep) || !existsSync(videoPath)) throw new Error("Rendered video file is missing from local storage.");
      const youtubeVideoId = await uploadToYouTube(videoPath, accessToken, { title: commonVideoData.title, description: commonVideoData.description, tags: JSON.parse(commonVideoData.tags) });
      await prisma.video.update({ where: { id: videoRecord.id }, data: { ...commonVideoData, status: "published", userApproved: true, userApprovedAt: now, youtubeVideoId, youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`, uploadedAt: new Date() } });
      results.push({ userId: settings.userId, videoId: videoRecord.id, status: "published", youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown autopilot failure";
      if (videoRecord) await prisma.video.update({ where: { id: videoRecord.id }, data: { status: "failed", uploadError: message.slice(0, 1000) } }).catch(() => undefined);
      results.push({ userId: settings.userId, status: "failed", error: message });
    }
  }

  return NextResponse.json({ success: true, checkedAt: now.toISOString(), timeZone, matchedUsers: results.length, results });
}
