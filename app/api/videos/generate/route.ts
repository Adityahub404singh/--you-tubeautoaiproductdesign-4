import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const LOCATIONS = ["jungle", "hospital", "metro", "school", "village", "hotel", "space station", "mountain", "beach", "old mansion"]
const CHARACTERS = ["young boy", "old woman", "traveler", "student", "businessman", "child", "scientist", "farmer", "doctor"]
const TIMES = ["midnight", "3AM", "dawn", "1990s", "future 2050", "rainy night", "winter morning", "summer afternoon"]
const EMOTIONS = ["horror", "mystery", "emotional", "shocking", "inspiring", "funny", "suspenseful", "dark"]
const STYLES = ["storytelling", "documentary", "news style", "personal experience", "expert advice", "countdown", "interview style"]

const CATEGORY_PROMPTS: Record<string, string> = {
  facts: `You are a viral FACTS video script writer. Write SHOCKING, MIND-BLOWING facts that people have NEVER heard before. Each fact must be surprising. Use "Kya aap jaante hain?" style hooks. Make viewer say "OMG I didn't know this!"`,
  motivation: `You are a viral MOTIVATION script writer. Write POWERFUL emotional content. Use real struggle stories. Make viewer feel UNSTOPPABLE. Use punch lines like "Haar mat mano", "Uth khade ho". End with fire CTA.`,
  tech: `You are a viral TECH/AI news script writer. Explain complex tech in SIMPLE Hindi. Use "Ye AI tool aapki zindagi badal dega" style. Focus on practical benefits. Make it feel URGENT and IMPORTANT.`,
  story: `You are a viral STORY script writer. Create ORIGINAL stories with unexpected twists. Use vivid descriptions. Build suspense. Never use common plotlines. Every story must feel REAL and PERSONAL.`,
  top10: `You are a viral TOP 10 countdown script writer. Start from 10, build to #1 with increasing excitement. Each item must be MORE surprising than previous. Use "Aur #1 pe jo aaya wo toh..." style cliffhangers.`,
  shorts: `You are a viral SHORTS script writer. 60 SECONDS ONLY. Hook in FIRST 3 SECONDS or viewer leaves. ONE powerful message. Fast cuts. End with subscribe CTA. Every word must COUNT.`,
  general: `You are a viral content script writer. Create HIGHLY ENGAGING content. Use trending topics. Strong hook. Keep viewer watching till end. Use cliffhangers between points.`,
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildUniqueContext() {
  return {
    location: getRandomElement(LOCATIONS),
    character: getRandomElement(CHARACTERS),
    time: getRandomElement(TIMES),
    emotion: getRandomElement(EMOTIONS),
    style: getRandomElement(STYLES),
    twist: Math.random() > 0.5 ? "Add an unexpected plot twist" : "End with a shocking revelation",
    uniqueId: Math.random().toString(36).substring(7),
  }
}

export async function POST(req: NextRequest) {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const { topic, language, channelName, category, mode, generate30Day } = await req.json()
    if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 })

    const catKey = (category || "general").toLowerCase().replace(/\s+/g, "")
    const isShorts = mode === "shorts" || catKey === "shorts"
    const ctx = buildUniqueContext()
    const catPrompt = CATEGORY_PROMPTS[catKey] || CATEGORY_PROMPTS.general

    // 30-day schedule
    if (generate30Day) {
      const scheduleRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: `Generate 30 UNIQUE YouTube video topics for a ${category} channel in ${language} about "${topic}". 
Each topic must be COMPLETELY DIFFERENT angle/perspective. Mix: facts, stories, tutorials, opinions, lists.
Return JSON array only: [{"day": 1, "topic": "...", "type": "facts|motivation|tech|story|top10|shorts", "angle": "unique angle description"}, ...]`
        }],
        temperature: 0.95,
        max_tokens: 2000,
      })
      const raw = scheduleRes.choices[0].message.content || ""
      const match = raw.replace(/```json|```/g, "").trim().match(/\[[\s\S]*\]/)
      const schedule = match ? JSON.parse(match[0]) : []
      return NextResponse.json({ success: true, schedule30Day: schedule })
    }

    // Unique script generate
    const scriptRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `${catPrompt}

ANTI-DUPLICATE RULES (MOST IMPORTANT):
- This script ID is: ${ctx.uniqueId} - make it completely unique
- Setting: ${ctx.location}
- Character perspective: ${ctx.character}  
- Time context: ${ctx.time}
- Emotional tone: ${ctx.emotion}
- Presentation style: ${ctx.style}
- Special instruction: ${ctx.twist}
- Language: ${language || "Hindi"} with English mix
- Channel: "${channelName || "My Channel"}"
- Make content 100% ORIGINAL - never copy existing content
- "Make this content completely different from any existing viral video"`
        },
        {
          role: "user",
          content: `Write a ${isShorts ? "60-second YouTube Shorts" : "5-7 minute YouTube"} VIRAL script for: "${topic}"

UNIQUE CONTEXT TO USE:
- Location: ${ctx.location}
- Character: ${ctx.character}
- Time: ${ctx.time}  
- Emotion: ${ctx.emotion}
- Style: ${ctx.style}

Respond ONLY with this JSON (no extra text):
{
  "title": "viral clickbait title max 60 chars with power words/numbers",
  "hook": "SHOCKING first 5 seconds - must make viewer stop scrolling",
  "script": "full script. Horror: use [PAUSE] after every line, slow dramatic. Facts: use [SPEED_UP] for facts, energetic. Motivation: use [EMPHASIS] on power words, strong confident. Shorts: max 60 seconds, fast punchy. Format: [HOOK][SETUP][BUILDUP][PEAK][END][CTA]",
  "keyPoints": ["point1","point2","point3","point4","point5"],
  "description": "SEO description 200+ words",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13","tag14","tag15"],
  "callToAction": "end CTA text",
  "pexelsQuery": "3-4 word English search for relevant stock video",
  "chapters": ["0:00 Intro","1:00 Main","3:00 Conclusion"],
  "uniqueContext": "${ctx.location} | ${ctx.character} | ${ctx.time} | ${ctx.emotion}"
}`
        }
      ],
      temperature: 0.92,
      max_tokens: 3500,
    })

    const raw = scriptRes.choices[0].message.content || ""
    const cleaned = raw.replace(/```json|```/g, "").replace(/[\x00-\x1F\x7F]/g, " ").trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found")
    const scriptData = JSON.parse(jsonMatch[0])

    // Pexels clips
    let pexelsClips: any[] = []
    const pexelsKey = process.env.PEXELS_API_KEY
    if (pexelsKey && scriptData.pexelsQuery) {
      try {
        const q = encodeURIComponent(scriptData.pexelsQuery)
        const pr = await fetch(`https://api.pexels.com/videos/search?query=${q}&per_page=6&orientation=${isShorts ? "portrait" : "landscape"}`, {
          headers: { Authorization: pexelsKey }
        })
        if (pr.ok) {
          const pd = await pr.json()
          pexelsClips = (pd.videos || []).slice(0, 3).map((v: any) => ({
            id: v.id,
            url: v.video_files?.find((f: any) => f.quality === "hd")?.link || v.video_files?.[0]?.link,
            duration: v.duration,
          }))
        }
      } catch(e) {}
    }

    const CATEGORY_STYLES: Record<string, any> = {
      facts:      { bgColor: "#1a237e", accent: "#2196F3", emoji: "🧠", badge: "FACTS" },
      motivation: { bgColor: "#e65100", accent: "#FF9800", emoji: "💪", badge: "MOTIVATION" },
      tech:       { bgColor: "#1b5e20", accent: "#4CAF50", emoji: "🤖", badge: "TECH" },
      story:      { bgColor: "#4a148c", accent: "#9C27B0", emoji: "📖", badge: "STORY" },
      top10:      { bgColor: "#f57f17", accent: "#FFC107", emoji: "🏆", badge: "TOP 10" },
      shorts:     { bgColor: "#b71c1c", accent: "#F44336", emoji: "⚡", badge: "SHORTS" },
      general:    { bgColor: "#880000", accent: "#FF0000", emoji: "🔥", badge: "VIRAL" },
    }
    const catStyle = CATEGORY_STYLES[catKey] || CATEGORY_STYLES.general

    return NextResponse.json({
      success: true,
      title: scriptData.title || "Untitled",
      script: scriptData.script || "",
      hook: scriptData.hook || "",
      keyPoints: scriptData.keyPoints || [],
      description: scriptData.description || "",
      tags: scriptData.tags || [],
      callToAction: scriptData.callToAction || "",
      chapters: scriptData.chapters || [],
      pexelsQuery: scriptData.pexelsQuery || "",
      pexelsClips,
      category: catKey,
      isShorts,
      uniqueContext: scriptData.uniqueContext || `${ctx.location} | ${ctx.emotion}`,
      thumbnail: {
        boldText: scriptData.title?.split(" ").slice(0, 4).join(" ") || "MUST WATCH",
        bgColor: catStyle.bgColor,
        accent: catStyle.accent,
        emoji: catStyle.emoji,
        badge: catStyle.badge,
      }
    })
  } catch (error: any) {
    console.error("Video generation error:", error)
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 })
  }
}


