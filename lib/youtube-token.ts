export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await response.json();
  console.log("Refresh token response:", data.access_token ? "? New token got" : "? " + data.error);
  if (data.error) throw new Error(`Token refresh failed: ${data.error}`);
  return { access_token: data.access_token, expires_in: data.expires_in };
}

export async function getValidAccessToken(cookieStore: any) {
  let jar = cookieStore;
  if (typeof cookieStore.then === "function") jar = await cookieStore;

  const accessToken = jar.get("yt_access_token")?.value;
  const refreshToken = jar.get("yt_refresh_token")?.value;

  console.log("getValidAccessToken - accessToken:", accessToken ? "EXISTS" : "MISSING", "refreshToken:", refreshToken ? "EXISTS" : "MISSING");

  if (!refreshToken && !accessToken) throw new Error("NOT_CONNECTED");

  if (refreshToken) {
    try {
      const newTokens = await refreshAccessToken(refreshToken);
      return { accessToken: newTokens.access_token, newToken: newTokens.access_token };
    } catch(e: any) {
      console.log("Refresh failed:", e.message);
      if (accessToken) return { accessToken };
      throw new Error("NOT_CONNECTED");
    }
  }

  return { accessToken };
}
