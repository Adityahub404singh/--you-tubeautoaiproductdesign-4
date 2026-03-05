"use client"

export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: "user" | "admin"
  plan: "free" | "pro" | "agency"
  createdAt: string
  hasCompletedSetup: boolean
  freeVideosUsed: number // How many free videos used (max 10)
  paidVideoCredits: number // Paid video credits purchased
  totalSpent: number // Total amount spent on videos
  youtubeMonetized: boolean // Is channel monetized
  youtubeEarnings: number // Total YouTube earnings
  youtubeShareOwed: number // 10% owed to platform
  lastActive: string
}

export interface Channel {
  id: string
  userId: string
  name: string
  subscribers: number
  category: string
  language: string
  voice: string
  defaultTags: string
  privacy: "public" | "unlisted"
  uploadTime: string
  contentStrategy: string
  isActive: boolean
}

export interface Video {
  id: string
  channelId: string
  title: string
  status: "pending-approval" | "approved" | "rejected" | "user-approved" | "live" | "failed"
  riskLevel: "low" | "high" // Added risk level for queue sorting
  scheduledDate: string
  views: number
  likes: number
  comments: number
  thumbnail: string
  topic: string
  aiScore: number
  adminApproved: boolean // Admin approval status
  adminApprovedBy?: string
  adminApprovedAt?: string
  userApproved: boolean // User approval status
  userApprovedAt?: string
  cost: number
  isFree: boolean // Track if this was a free video
  createdAt: string
}

export interface Payment {
  id: string
  userId: string
  type: "video" | "youtube-share"
  amount: number
  videoId?: string
  createdAt: string
  status: "pending" | "completed" | "failed"
}

class Store {
  private static instance: Store

  private constructor() {
    if (typeof window !== "undefined") {
      this.initializeData()
    }
  }

  static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store()
    }
    return Store.instance
  }

  private initializeData() {
    const users = this.getUsers()
    const adminExists = users.some((u) => u.email === "singhaditya4560@gmail.com")

    if (!adminExists) {
      const adminUser: User = {
        id: "admin-001",
        email: "singhaditya4560@gmail.com",
        name: "Aditya Singh",
        phone: "+91 7068003894",
        role: "admin",
        plan: "agency",
        createdAt: new Date().toISOString(),
        hasCompletedSetup: true,
        freeVideosUsed: 0,
        paidVideoCredits: 0,
        totalSpent: 0,
        youtubeMonetized: true,
        youtubeEarnings: 0,
        youtubeShareOwed: 0,
        lastActive: new Date().toISOString(),
      }
      users.push(adminUser)
      localStorage.setItem("users", JSON.stringify(users))
    }
  }

  // User methods
  getUsers(): User[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("users")
    return data ? JSON.parse(data) : []
  }

  getUserByEmail(email: string): User | null {
    return this.getUsers().find((u) => u.email === email) || null
  }

  createUser(
    user: Omit<
      User,
      | "id"
      | "createdAt"
      | "freeVideosUsed"
      | "paidVideoCredits"
      | "totalSpent"
      | "youtubeMonetized"
      | "youtubeEarnings"
      | "youtubeShareOwed"
      | "lastActive"
    >,
  ): User {
    const users = this.getUsers()
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
      freeVideosUsed: 0, // Starts at 0, can use up to 10
      paidVideoCredits: 0,
      totalSpent: 0,
      youtubeMonetized: false,
      youtubeEarnings: 0,
      youtubeShareOwed: 0,
      lastActive: new Date().toISOString(),
    }
    users.push(newUser)
    localStorage.setItem("users", JSON.stringify(users))
    return newUser
  }

  updateUser(userId: string, updates: Partial<User>): void {
    const users = this.getUsers()
    const index = users.findIndex((u) => u.id === userId)
    if (index !== -1) {
      users[index] = { ...users[index], ...updates }
      localStorage.setItem("users", JSON.stringify(users))
    }
  }

  getUserById(userId: string): User | null {
    return this.getUsers().find((u) => u.id === userId) || null
  }

  // Channel methods
  getChannels(userId?: string): Channel[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("channels")
    const channels = data ? JSON.parse(data) : []
    return userId ? channels.filter((c: Channel) => c.userId === userId) : channels
  }

  createChannel(channel: Omit<Channel, "id">): Channel {
    const channels = this.getChannels()
    const newChannel: Channel = {
      ...channel,
      id: `channel-${Date.now()}`,
    }
    channels.push(newChannel)
    localStorage.setItem("channels", JSON.stringify(channels))
    return newChannel
  }

  updateChannel(channelId: string, updates: Partial<Channel>): void {
    const channels = this.getChannels()
    const index = channels.findIndex((c) => c.id === channelId)
    if (index !== -1) {
      channels[index] = { ...channels[index], ...updates }
      localStorage.setItem("channels", JSON.stringify(channels))
    }
  }

  deleteChannel(channelId: string): void {
    const channels = this.getChannels()
    const filtered = channels.filter((c) => c.id !== channelId)
    localStorage.setItem("channels", JSON.stringify(filtered))
  }

  // Video methods
  getVideos(channelId?: string): Video[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem("videos")
    const videos = data ? JSON.parse(data) : []
    return channelId ? videos.filter((v: Video) => v.channelId === channelId) : videos
  }

  canCreateVideo(userId: string): { allowed: boolean; reason?: string } {
    const user = this.getUserById(userId)
    if (!user) return { allowed: false, reason: "User not found" }

    // Admin always allowed
    if (user.role === "admin") return { allowed: true }

    // Check if user has free videos remaining
    if (user.freeVideosUsed < 10) return { allowed: true }

    // Check if user has paid credits
    if (user.paidVideoCredits > 0) return { allowed: true }

    return { allowed: false, reason: "No free videos or credits remaining. Please upgrade." }
  }

  calculateRiskLevel(niche: string): "low" | "high" {
    const highRiskNiches = ["news", "politics", "finance", "make money online", "cryptocurrency", "health", "medical"]
    const lowercaseNiche = niche.toLowerCase()
    return highRiskNiches.some((risk) => lowercaseNiche.includes(risk)) ? "high" : "low"
  }

  createVideo(
    video: Omit<
      Video,
      "id" | "aiScore" | "adminApproved" | "userApproved" | "cost" | "isFree" | "riskLevel" | "createdAt"
    >,
  ): Video {
    const videos = this.getVideos()
    const channel = this.getChannels().find((c) => c.id === video.channelId)
    if (!channel) throw new Error("Channel not found")

    const user = this.getUserById(channel.userId)
    if (!user) throw new Error("User not found")

    const canCreate = this.canCreateVideo(user.id)
    if (!canCreate.allowed) {
      throw new Error(canCreate.reason)
    }

    const isFree = user.freeVideosUsed < 10
    const cost = isFree ? 0 : 0.16

    const riskLevel = this.calculateRiskLevel(channel.category)

    const newVideo: Video = {
      ...video,
      id: `video-${Date.now()}`,
      aiScore: Math.floor(Math.random() * 30) + 70,
      adminApproved: false,
      userApproved: false,
      cost,
      isFree,
      riskLevel,
      createdAt: new Date().toISOString(),
    }
    videos.push(newVideo)
    localStorage.setItem("videos", JSON.stringify(videos))

    if (isFree) {
      this.updateUser(user.id, {
        freeVideosUsed: user.freeVideosUsed + 1,
      })
    } else {
      this.updateUser(user.id, {
        paidVideoCredits: user.paidVideoCredits - 1,
        totalSpent: user.totalSpent + 0.2,
      })
    }

    return newVideo
  }

  updateVideo(videoId: string, updates: Partial<Video>): void {
    const videos = this.getVideos()
    const index = videos.findIndex((v) => v.id === videoId)
    if (index !== -1) {
      videos[index] = { ...videos[index], ...updates }
      localStorage.setItem("videos", JSON.stringify(videos))
    }
  }

  // Generate 30-day schedule
  generate30DaySchedule(channelId: string, contentStrategy: string): Video[] {
    const topics = this.generateTopics(contentStrategy, 30)
    const videos: Video[] = []
    const channel = this.getChannels().find((c) => c.id === channelId)
    if (!channel) return []

    const user = this.getUserById(channel.userId)
    if (!user) throw new Error("User not found")

    const canCreate = this.canCreateVideo(user.id)
    if (!canCreate.allowed) {
      throw new Error(canCreate.reason)
    }

    const riskLevel = this.calculateRiskLevel(channel.category)

    for (let i = 0; i < 30; i++) {
      const isFree = user.freeVideosUsed < 10
      const cost = isFree ? 0 : 0.16

      const video: Video = {
        id: `video-${Date.now()}-${i}`,
        channelId,
        title: topics[i],
        status: i === 0 ? "pending-approval" : "pending-approval",
        scheduledDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        views: 0,
        likes: 0,
        comments: 0,
        thumbnail: `/ai-tools-thumbnail.png`,
        topic: topics[i],
        aiScore: Math.floor(Math.random() * 30) + 70,
        adminApproved: false,
        userApproved: false,
        cost,
        isFree,
        riskLevel,
        createdAt: new Date().toISOString(),
      }
      videos.push(video)
    }

    const existingVideos = this.getVideos()
    localStorage.setItem("videos", JSON.stringify([...existingVideos, ...videos]))

    // Update user video count
    const freeVideosUsed = Math.min(30, user.freeVideosRemaining)
    const paidVideos = 30 - freeVideosUsed
    this.updateUser(user.id, {
      freeVideosUsed: user.freeVideosUsed + freeVideosUsed,
      paidVideoCredits: user.paidVideoCredits - paidVideos,
      totalSpent: user.totalSpent + paidVideos * 0.2,
    })

    return videos
  }

  private generateTopics(strategy: string, count: number): string[] {
    const topics = [
      "Top 5 AI Tools 2026 Hindi",
      "ChatGPT Hindi Tutorial",
      "Best Laptops Under 50K",
      "AI Image Generation Guide",
      "YouTube Growth Tips",
      "Tech News This Week",
      "Smartphone Buying Guide",
      "Internet Safety Tips",
      "Future of AI Technology",
      "Free Online Tools",
      "Productivity Apps Review",
      "Gaming PC Build Guide",
      "Photo Editing Tutorial",
      "Best Budget Gadgets",
      "AI Voice Generator",
      "WhatsApp Hidden Features",
      "Instagram Growth Hacks",
      "Tech Career Guide",
      "Best Free Software",
      "Online Money Making",
      "Video Editing Tutorial",
      "AI Music Generator",
      "Best Tech Under 1000",
      "Coding for Beginners",
      "AI Art Tutorial",
      "Tech Myths Busted",
      "Smart Home Setup",
      "Best Apps 2026",
      "Digital Marketing Tips",
      "AI Business Tools",
    ]

    return topics.slice(0, count).map((topic, i) => `${topic} | ${strategy}`)
  }

  adminApproveVideo(videoId: string, adminId: string): void {
    const videos = this.getVideos()
    const index = videos.findIndex((v) => v.id === videoId)
    if (index !== -1) {
      videos[index] = {
        ...videos[index],
        adminApproved: true,
        adminApprovedBy: adminId,
        adminApprovedAt: new Date().toISOString(),
        status: "approved",
      }
      localStorage.setItem("videos", JSON.stringify(videos))
    }
  }

  adminRejectVideo(videoId: string): void {
    const videos = this.getVideos()
    const video = videos.find((v) => v.id === videoId)
    if (!video) return

    const index = videos.findIndex((v) => v.id === videoId)
    if (index !== -1) {
      videos[index] = {
        ...videos[index],
        status: "rejected",
      }
      localStorage.setItem("videos", JSON.stringify(videos))

      const channel = this.getChannels().find((c) => c.id === video.channelId)
      if (channel) {
        const user = this.getUserById(channel.userId)
        if (user) {
          if (video.isFree) {
            this.updateUser(user.id, {
              freeVideosUsed: Math.max(0, user.freeVideosUsed - 1),
            })
          } else {
            this.updateUser(user.id, {
              paidVideoCredits: user.paidVideoCredits + 1,
            })
          }
        }
      }
    }
  }

  userApproveVideo(videoId: string): void {
    const videos = this.getVideos()
    const index = videos.findIndex((v) => v.id === videoId)
    if (index !== -1) {
      videos[index] = {
        ...videos[index],
        userApproved: true,
        userApprovedAt: new Date().toISOString(),
        status: "user-approved",
      }
      localStorage.setItem("videos", JSON.stringify(videos))
    }
  }

  getVideosByRiskLevel(riskLevel: "low" | "high"): Video[] {
    return this.getVideos().filter((v) => v.riskLevel === riskLevel && v.status === "pending-approval")
  }

  bulkApproveVideos(videoIds: string[], adminId: string): void {
    const videos = this.getVideos()
    videoIds.forEach((videoId) => {
      const index = videos.findIndex((v) => v.id === videoId)
      if (index !== -1) {
        videos[index] = {
          ...videos[index],
          adminApproved: true,
          adminApprovedBy: adminId,
          adminApprovedAt: new Date().toISOString(),
          status: "approved",
        }
      }
    })
    localStorage.setItem("videos", JSON.stringify(videos))
  }

  addVideoCredits(userId: string, credits: number, amount: number): void {
    const user = this.getUserById(userId)
    if (user) {
      this.updateUser(userId, {
        paidVideoCredits: user.paidVideoCredits + credits,
        totalSpent: user.totalSpent + amount,
      })
    }
  }

  // Admin methods
  getAdminStats() {
    const users = this.getUsers()
    const videos = this.getVideos()
    const payments = this.getPayments()

    const totalUsers = users.filter((u) => u.role !== "admin").length
    const activeToday = users.filter((u) => {
      const lastActive = new Date(u.lastActive)
      const today = new Date()
      return lastActive.toDateString() === today.toDateString()
    }).length

    const pendingApprovals = videos.filter((v) => v.status === "pending-approval").length
    const lowRiskPending = videos.filter((v) => v.status === "pending-approval" && v.riskLevel === "low").length
    const highRiskPending = videos.filter((v) => v.status === "pending-approval" && v.riskLevel === "high").length
    const totalVideos = videos.length

    const videoRevenue = users.reduce((sum, u) => sum + u.totalSpent, 0)
    const youtubeRevenue = users.reduce((sum, u) => sum + u.youtubeShareOwed, 0)

    return {
      totalUsers,
      activeToday,
      pendingApprovals,
      lowRiskPending,
      highRiskPending,
      totalVideos,
      videoRevenue,
      youtubeRevenue,
      totalRevenue: videoRevenue + youtubeRevenue,
    }
  }
}

export const store = typeof window !== "undefined" ? Store.getInstance() : null
