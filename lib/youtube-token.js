export async function refreshAccessToken(refreshToken) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(`Token refresh failed: ${data.error}`);
  return { access_token: data.access_token, expires_in: data.expires_in };
}

export async function getValidAccessToken(cookieStore) {
  // Next.js 15: cookies() is async - handle both cases
  let jar = cookieStore;
  if (typeof cookieStore.then === "function") {
    jar = await cookieStore;
  }
  
  let accessToken, refreshToken;
  try {
    accessToken = jar.get("yt_access_token")?.value;
    refreshToken = jar.get("yt_refresh_token")?.value;
  } catch {
    // cookies() might need to be awaited
    const resolved = await Promise.resolve(cookieStore);
    accessToken = resolved.get("yt_access_token")?.value;
    refreshToken = resolved.get("yt_refresh_token")?.value;
  }

  if (!accessToken && refreshToken) {
    const newTokens = await refreshAccessToken(refreshToken);
    return { accessToken: newTokens.access_token, newToken: newTokens.access_token };
  }
  if (!accessToken && !refreshToken) throw new Error("NOT_CONNECTED");
  return { accessToken };
}
