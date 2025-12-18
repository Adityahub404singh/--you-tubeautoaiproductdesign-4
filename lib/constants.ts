export const CONTACT = {
  founder: "Aditya Singh",
  phone: "+917068003894",
  email: "singhaditya4560@gmail.com",
  whatsappLink: "https://wa.me/917068003894",
  workingHours: "10 AM - 7 PM IST",
  businessName: "YouTubeAuto.ai",
}

export const PRICING = {
  freeVideos: 10,
  pricePerVideo: 0.2,
  volumePricing: {
    tier1: { min: 11, max: 50, price: 0.2 },
    tier2: { min: 51, max: 100, price: 0.18 },
    tier3: { min: 101, max: Number.POSITIVE_INFINITY, price: 0.16 },
  },
  youtubeShare: 0.1, // 10%
}

export const YOUTUBE_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI || "",
  scopes: [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube",
  ],
}

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
}
