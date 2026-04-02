import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect("/dashboard/channels?instagram_error=access_denied");
  }

  try {
    // Get access token from Facebook
    const tokenRes = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code: code,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error("No access token received");
    }

    // Get Instagram Business Account ID
    const accountsRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
    );
    const accountsData = await accountsRes.json();

    const pageId = accountsData.data?.[0]?.id;
    if (!pageId) {
      throw new Error("No Instagram page found");
    }

    // Get Instagram account ID
    const igRes = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${tokenData.access_token}`
    );
    const igData = await igRes.json();
    const instagramId = igData.instagram_business_account?.id;

    if (!instagramId) {
      throw new Error("No Instagram business account found");
    }

    // Store in localStorage (or DB in production)
    const channels = JSON.parse(localStorage.getItem("channels") || "[]");
    const igChannel = {
      id: instagramId,
      platform: "instagram",
      name: igData.name || "Instagram",
      accessToken: tokenData.access_token,
      pageId: pageId,
      connected: true,
      connectedAt: new Date().toISOString(),
    };

    // Remove old instagram channel and add new
    const filtered = channels.filter(c => c.platform !== "instagram");
    filtered.push(igChannel);
    localStorage.setItem("channels", JSON.stringify(filtered));

    return NextResponse.redirect("/dashboard/channels?instagram_connected=true");
  } catch (error) {
    console.error("Instagram OAuth error:", error);
    return NextResponse.redirect("/dashboard/channels?instagram_error=" + encodeURIComponent(error.message));
  }
}
