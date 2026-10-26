import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { encryptSocialToken } from "@/lib/social-account-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || url.origin).replace(/\/+$/, "");
  const jar = await cookies();
  const stateCookie = jar.get("youtube_oauth_state")?.value;
  jar.delete("youtube_oauth_state");

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.redirect(`${appUrl}/login?youtube=login_required`);
  if (!stateCookie || !url.searchParams.get("state") || stateCookie !== url.searchParams.get("state")) {
    return NextResponse.redirect(`${appUrl}/dashboard/autopilot?youtube=state_error`);
  }
  if (url.searchParams.get("error") || !url.searchParams.get("code")) {
    return NextResponse.redirect(`${appUrl}/dashboard/autopilot?youtube=cancelled`);
  }

  try {
    const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || "").trim();
    if (!clientId || !clientSecret) throw new Error("Google OAuth credentials are missing.");
    const redirectUri = `${appUrl}/api/youtube/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: url.searchParams.get("code"), client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      cache: "no-store",
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error_description || tokenData.error || "Token exchange failed.");

    const channelResponse = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }, cache: "no-store",
    });
    const channelData = await channelResponse.json();
    const channel = channelData.items?.[0];
    if (!channelResponse.ok || !channel?.id) throw new Error("Could not read the YouTube channel for this account.");

    const previous = await prisma.socialAccount.findUnique({
      where: { provider_platformUserId: { provider: "youtube", platformUserId: channel.id } },
    });
    if (previous && previous.userId !== userId) throw new Error("This YouTube channel is already connected to another app account.");

    const encryptedAccess = encryptSocialToken(tokenData.access_token);
    const encryptedRefresh = tokenData.refresh_token ? encryptSocialToken(tokenData.refresh_token) : previous?.refreshToken;
    await prisma.socialAccount.upsert({
      where: { provider_platformUserId: { provider: "youtube", platformUserId: channel.id } },
      create: {
        userId, provider: "youtube", platformUserId: channel.id,
        accountName: channel.snippet?.title || "YouTube Channel",
        accessToken: encryptedAccess, refreshToken: encryptedRefresh,
        accessTokenExpiry: new Date(Date.now() + Number(tokenData.expires_in || 3600) * 1000),
        scopes: tokenData.scope || "https://www.googleapis.com/auth/youtube.upload", isConnected: true,
      },
      update: {
        accountName: channel.snippet?.title || "YouTube Channel", accessToken: encryptedAccess,
        ...(encryptedRefresh ? { refreshToken: encryptedRefresh } : {}),
        accessTokenExpiry: new Date(Date.now() + Number(tokenData.expires_in || 3600) * 1000),
        scopes: tokenData.scope || "https://www.googleapis.com/auth/youtube.upload", isConnected: true,
      },
    });

    const existingChannel = await prisma.channel.findFirst({ where: { userId, name: channel.snippet?.title || "YouTube Channel" } });
    const channelFields = {
      subscribers: Number(channel.statistics?.subscriberCount || 0),
      category: "cinematic", language: "hi", isActive: true,
    };
    if (existingChannel) await prisma.channel.update({ where: { id: existingChannel.id }, data: channelFields });
    else await prisma.channel.create({ data: { userId, name: channel.snippet?.title || "YouTube Channel", ...channelFields } });

    return NextResponse.redirect(`${appUrl}/dashboard/autopilot?youtube=connected`);
  } catch (error) {
    console.error("YouTube OAuth callback failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.redirect(`${appUrl}/dashboard/autopilot?youtube=error`);
  }
}
