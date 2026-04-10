export async function refreshAccessToken(refreshToken) {
  // ✅ FIX: Added timeout — previously "fetch failed" silently with no timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      signal: controller.signal,
    });

    const data = await response.json();
    console.log("Refresh token response:", data.access_token ? "✅ New token got" : "❌ " + data.error);

    if (data.error) {
      // ✅ Log the full error for debugging
      console.error("Token refresh error detail:", data.error, data.error_description || "");
      throw new Error(`Token refresh failed: ${data.error}`);
    }

    return { access_token: data.access_token, expires_in: data.expires_in };
  } finally {
    clearTimeout(timer);
  }
}

export async function getValidAccessToken(cookieStore) {
  let jar = cookieStore;
  if (typeof cookieStore.then === "function") jar = await cookieStore;

  let accessToken, refreshToken;
  try {
    accessToken = jar.get("yt_access_token")?.value;
    refreshToken = jar.get("yt_refresh_token")?.value;
  } catch(e) {
    const resolved = await Promise.resolve(cookieStore);
    accessToken = resolved.get("yt_access_token")?.value;
    refreshToken = resolved.get("yt_refresh_token")?.value;
  }

  console.log("getValidAccessToken - accessToken:", accessToken ? "EXISTS" : "MISSING", "refreshToken:", refreshToken ? "EXISTS" : "MISSING");

  if (!refreshToken && !accessToken) throw new Error("NOT_CONNECTED");

  // If we have refresh token, always get a fresh access token
  if (refreshToken) {
    try {
      const newTokens = await refreshAccessToken(refreshToken);
      return { accessToken: newTokens.access_token, newToken: newTokens.access_token };
    } catch(e) {
      console.log("Refresh failed:", e.message);
      // ✅ FIX: If refresh fails AND we have an existing accessToken, try it
      // But if error is invalid_grant, token is revoked — force reconnect
      if (e.message.includes("invalid_grant") || e.message.includes("invalid_client")) {
        console.error("❌ Refresh token revoked/invalid — user must reconnect YouTube");
        throw new Error("NOT_CONNECTED");
      }
      // Network error — fallback to existing accessToken
      if (accessToken) {
        console.log("⚠️ Using cached accessToken as fallback");
        return { accessToken };
      }
      throw new Error("NOT_CONNECTED");
    }
  }

  return { accessToken };
}