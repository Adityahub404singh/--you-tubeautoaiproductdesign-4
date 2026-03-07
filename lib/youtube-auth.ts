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

  // SERVER-SIDE OAuth use karo (refresh token milega)
  initiateAuth(): void {
    window.location.href = "/api/auth/youtube?action=connect"
  }

  // Cookie se token lo (server ne set kiya hai)
  async getTokenFromServer(): Promise<string | null> {
    try {
      const res = await fetch("/api/youtube/status")
      const data = await res.json()
      if (data.connected) return "server-managed"
      return null
    } catch { return null }
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
    try {
      // Server-side token use karo
      const res = await fetch("/api/youtube/status")
      const data = await res.json()

      if (!data.connected) {
        throw new Error("YouTube connected nahi hai. Pehle connect karo.")
      }

      if (!data.hasChannel) {
        throw new Error("Koi YouTube channel nahi mila.")
      }

      // Channel data return karo
      return [{
        id: data.channel.id,
        title: data.channel.name,
        description: "",
        customUrl: "",
        thumbnailUrl: data.channel.thumbnail || "",
        subscriberCount: data.channel.subscribers || "0",
        videoCount: data.channel.totalVideos || "0",
        viewCount: "0",
      }]
    } catch (error: any) {
      // Fallback: localStorage token try karo
      if (this.accessToken) {
        const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        })
        if (response.ok) {
          const data = await response.json()
          if (data.items?.length > 0) {
            return data.items.map((item: any) => ({
              id: item.id,
              title: item.snippet.title,
              description: item.snippet.description,
              customUrl: item.snippet.customUrl || "",
              thumbnailUrl: item.snippet.thumbnails?.default?.url || "",
              subscriberCount: item.statistics?.subscriberCount || "0",
              videoCount: item.statistics?.videoCount || "0",
              viewCount: item.statistics?.viewCount || "0",
            }))
          }
        }
      }
      throw error
    }
  }

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
    // Server-side upload API use karo
    const formData = new FormData()
    formData.append("video", videoBlob, "video.mp4")
    formData.append("title", metadata.title)
    formData.append("description", metadata.description)
    formData.append("tags", JSON.stringify(metadata.tags))
    formData.append("categoryId", metadata.categoryId || "22")
    formData.append("privacyStatus", metadata.privacyStatus)

    // Convert blob to URL and use existing upload API
    const videoUrl = URL.createObjectURL(videoBlob)

    const res = await fetch("/api/youtube/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoUrl,
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: metadata.categoryId || "22",
        privacyStatus: metadata.privacyStatus,
      }),
    })

    const data = await res.json()
    if (!data.success) throw new Error(data.error || "Upload failed")

    return { videoId: data.videoId, url: data.youtubeUrl }
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
