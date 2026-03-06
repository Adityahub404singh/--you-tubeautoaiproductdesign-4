import { YOUTUBE_CONFIG } from "./constants"

export interface YouTubeChannel {
  id: string
  title: string
  description: string
  customUrl: string
  thumbnailUrl: string
  subscriberCount: string
  videoCount: string
  viewCount: string
}

export class YouTubeAuth {
  private static instance: YouTubeAuth
  private accessToken: string | null = null

  private constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("youtube_access_token")
    }
  }

  static getInstance(): YouTubeAuth {
    if (!YouTubeAuth.instance) {
      YouTubeAuth.instance = new YouTubeAuth()
    }
    return YouTubeAuth.instance
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: YOUTUBE_CONFIG.clientId,
      redirect_uri: YOUTUBE_CONFIG.redirectUri || `${window.location.origin}/auth/callback`,
      response_type: "token",
      scope: YOUTUBE_CONFIG.scopes.join(" "),

      prompt: "consent",
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  initiateAuth(): void {
    const authUrl = this.getAuthUrl()
    window.location.href = authUrl
  }

  handleCallback(hash: string): boolean {
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get("access_token")

    if (accessToken) {
      this.accessToken = accessToken
      localStorage.setItem("youtube_access_token", accessToken)
      return true
    }

    return false
  }

  async getUserChannels(): Promise<YouTubeChannel[]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated. Please connect your YouTube account first.")
    }

    try {
      const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          this.logout()
          throw new Error("Session expired. Please reconnect your YouTube account.")
        }
        throw new Error("Failed to fetch YouTube channels")
      }

      const data = await response.json()

      if (!data.items || data.items.length === 0) {
        throw new Error("No YouTube channels found for this account")
      }

      return data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        customUrl: item.snippet.customUrl || "",
        thumbnailUrl: item.snippet.thumbnails.default.url,
        subscriberCount: item.statistics.subscriberCount,
        videoCount: item.statistics.videoCount,
        viewCount: item.statistics.viewCount,
      }))
    } catch (error) {
      console.error("Error fetching YouTube channels:", error)
      throw error
    }
  }

  /**
   * Upload video to YouTube using multipart upload
   * This is the correct implementation for YouTube Data API v3
   */
  async uploadVideo(
    videoBlob: Blob,
    metadata: {
      title: string
      description: string
      tags: string[]
      categoryId?: string
      privacyStatus: "public" | "private" | "unlisted"
    },
  ): Promise<{ videoId: string; url: string }> {
    if (!this.accessToken) {
      throw new Error("Not authenticated. Please connect your YouTube account first.")
    }

    const boundary = '-------314159265358979323846'
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    // Build metadata part
    const metadataPart = delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify({
        snippet: {
          title: metadata.title,
          description: metadata.description,
          tags: metadata.tags,
          categoryId: metadata.categoryId || "22", // People & Blogs default
        },
        status: {
          privacyStatus: metadata.privacyStatus,
          selfDeclaredMadeForKids: false,
        },
      })

    // Get video array buffer
    const videoArrayBuffer = await videoBlob.arrayBuffer()
    const videoBytes = new Uint8Array(videoArrayBuffer)

    // Build the multipart request body
    const videoPart = delimiter +
      'Content-Type: video/*\r\n\r\n'

    // Combine all parts
    const requestBody = new Blob([
      metadataPart,
      videoPart,
      videoBytes,
      closeDelimiter
    ])

    // Make the multipart upload request
    const response = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": `multipart/related; boundary="${boundary}"`,
        },
        body: requestBody,
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("YouTube upload error:", errorData)
      
      if (response.status === 401) {
        this.logout()
        throw new Error("Session expired. Please reconnect your YouTube account.")
      }
      if (response.status === 403) {
        throw new Error("Upload quota exceeded or permission denied. Check your YouTube API quotas.")
      }
      throw new Error(errorData.error?.message || `Failed to upload video (${response.status})`)
    }

    const data = await response.json()
    
    if (!data.id) {
      throw new Error("No video ID returned from YouTube")
    }

    return {
      videoId: data.id,
      url: `https://www.youtube.com/watch?v=${data.id}`,
    }
  }

  /**
   * Upload video from a local file path (for server-side uploads)
   * This would be used with fs.createReadStream in Node.js environment
   */
  async uploadVideoFromPath(
    filePath: string,
    metadata: {
      title: string
      description: string
      tags: string[]
      categoryId?: string
      privacyStatus: "public" | "private" | "unlisted"
    },
  ): Promise<{ videoId: string; url: string }> {
    // This would be implemented server-side with fs and googleapis
    // For now, this is a placeholder for server-side upload
    throw new Error("Server-side upload not implemented. Use uploadVideo with Blob.")
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  logout(): void {
    this.accessToken = null
    localStorage.removeItem("youtube_access_token")
  }
}

export const youtubeAuth = typeof window !== "undefined" ? YouTubeAuth.getInstance() : null
