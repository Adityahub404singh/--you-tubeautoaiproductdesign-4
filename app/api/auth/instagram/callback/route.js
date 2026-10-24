
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const GRAPH = "https://graph.facebook.com/v22.0";

function dashboardRedirect(appUrl, status, message) {
  const url = new URL("/dashboard", appUrl);
  url.searchParams.set("instagram", status);

  if (message) {
    url.searchParams.set("msg", message);
  }

  return NextResponse.redirect(url);
}

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const appUrl = (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    origin
  ).replace(/\/+$/, "");

  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ||
    `${appUrl}/api/auth/instagram/callback`;

  const cookieStore = await cookies();
  const savedState = cookieStore.get("ig_oauth_state")?.value;

  const clearStateCookie = (response) => {
    response.cookies.set("ig_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  };

  if (oauthError || !code) {
    return clearStateCookie(
      dashboardRedirect(appUrl, "error", "Instagram authorization cancelled")
    );
  }

  if (!savedState || !returnedState || savedState !== returnedState) {
    return clearStateCookie(
      dashboardRedirect(appUrl, "error", "OAuth state validation failed")
    );
  }

  try {
    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error("Instagram OAuth credentials are missing");
    }

    // Exchange authorization code for a short-lived user token.
    const tokenResponse = await fetch(`${GRAPH}/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }),
      cache: "no-store",
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
      throw new Error(
        tokenData.error?.message || "Instagram token exchange failed"
      );
    }

    // Exchange for a long-lived user token.
    const longTokenParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: tokenData.access_token,
    });

    const longResponse = await fetch(
      `${GRAPH}/oauth/access_token?${longTokenParams}`,
      { cache: "no-store" }
    );

    const longData = await longResponse.json();

    if (!longResponse.ok || longData.error) {
      throw new Error(
        longData.error?.message || "Could not obtain a long-lived token"
      );
    }

    const userToken = longData.access_token || tokenData.access_token;
    const expiresIn =
      Number(longData.expires_in) || Number(tokenData.expires_in) || 3600;

    // Find the actual Instagram Business account linked to a Facebook Page.
    const pagesParams = new URLSearchParams({
      fields: "id,name,access_token,instagram_business_account",
      access_token: userToken,
    });

    const pagesResponse = await fetch(
      `${GRAPH}/me/accounts?${pagesParams}`,
      { cache: "no-store" }
    );

    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok || pagesData.error) {
      throw new Error(
        pagesData.error?.message || "Could not fetch Facebook Pages"
      );
    }

    const linkedPage = (pagesData.data || []).find(
      (page) => page.instagram_business_account?.id && page.access_token
    );

    if (!linkedPage) {
      throw new Error(
        "No linked Instagram Business or Creator account was found. Check the Facebook Page connection and app permissions."
      );
    }

    const igUserId = linkedPage.instagram_business_account.id;
    const pageToken = linkedPage.access_token;
    const expiry = new Date(Date.now() + expiresIn * 1000);

    // Verify the selected account and retrieve its profile.
    const profileParams = new URLSearchParams({
      fields: "id,username,name,profile_picture_url",
      access_token: pageToken,
    });

    const profileResponse = await fetch(
      `${GRAPH}/${encodeURIComponent(igUserId)}?${profileParams}`,
      { cache: "no-store" }
    );

    const profileData = await profileResponse.json();

    if (!profileResponse.ok || profileData.error) {
      throw new Error(
        profileData.error?.message || "Instagram profile verification failed"
      );
    }

    const response = dashboardRedirect(appUrl, "connected");

    response.cookies.set("ig_access_token", pageToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiry,
    });

    response.cookies.set("ig_user_id", igUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiry,
    });

    response.cookies.set("ig_connected", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiry,
    });

    response.cookies.set("ig_expiry", expiry.toISOString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiry,
    });

    response.cookies.set("ig_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    console.log("Instagram account verified:", profileData.id);

    return response;
  } catch (error) {
    console.error(
      "Instagram callback error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return clearStateCookie(
      dashboardRedirect(
        appUrl,
        "error",
        error instanceof Error ? error.message : "Instagram connection failed"
      )
    );
  }
}
