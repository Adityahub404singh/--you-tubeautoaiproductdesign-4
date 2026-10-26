
type RefreshTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type TokenResult = {
  accessToken: string;
  newToken?: string;
  expiresIn?: number;
};

export async function refreshAccessToken(refreshToken: string) {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.YOUTUBE_CLIENT_ID;

  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Google/YouTube OAuth credentials. Check environment variables."
    );
  }

  if (!refreshToken?.trim()) {
    throw new Error("Missing YouTube refresh token.");
  }

  let response: Response;

  try {
    response = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch (error: unknown) {
    const err = error as {
      message?: string;
      cause?: {
        message?: string;
        code?: string;
      };
    };

    console.error("[OAUTH NETWORK ERROR]", {
      message: err.message,
      cause: err.cause?.message,
      code: err.cause?.code,
    });

    throw new Error(
      `Google OAuth network request failed: ${
        err.cause?.code ||
        err.cause?.message ||
        err.message ||
        "Unknown error"
      }`
    );
  }

  const data = (await response
    .json()
    .catch(() => ({}))) as RefreshTokenResponse;

  if (!response.ok || !data.access_token) {
    const errorCode = data.error || `HTTP_${response.status}`;
    const description =
      data.error_description || "No additional details provided";

    console.error("[OAUTH TOKEN ERROR]", {
      status: response.status,
      error: errorCode,
      description,
    });

    throw new Error(
      `Token refresh failed: ${errorCode} - ${description}`
    );
  }

  console.log("[OAUTH] Refresh succeeded");

  return {
    access_token: data.access_token,
    expires_in: Number(data.expires_in || 3600),
  };
}

export async function getValidAccessToken(
  cookieStore: any
): Promise<TokenResult> {
  const jar =
    cookieStore && typeof cookieStore.then === "function"
      ? await cookieStore
      : cookieStore;

  const accessToken = jar.get("yt_access_token")?.value as
    | string
    | undefined;

  const refreshToken = jar.get("yt_refresh_token")?.value as
    | string
    | undefined;

  console.log(
    "[OAUTH CHECK] AccessToken:",
    accessToken ? "EXISTS" : "MISSING",
    "| RefreshToken:",
    refreshToken ? "EXISTS" : "MISSING"
  );

  if (refreshToken) {
    try {
      const refreshed = await refreshAccessToken(refreshToken);

      return {
        accessToken: refreshed.access_token,
        newToken: refreshed.access_token,
        expiresIn: refreshed.expires_in,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      console.error("[OAUTH REFRESH ERROR]", message);

      if (accessToken) {
        console.warn(
          "[OAUTH] Refresh failed; using existing access token as fallback."
        );

        return { accessToken };
      }

      throw new Error("NOT_CONNECTED");
    }
  }

  if (accessToken) {
    return { accessToken };
  }

  throw new Error("NOT_CONNECTED");
}
