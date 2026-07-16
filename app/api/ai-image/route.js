import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN
const HF_TOKEN = process.env.HUGGINGFACE_API_KEY // FREE fallback

const STYLES = {
  facts:      "indian scientist shocked, cinematic blue neon 4K, science lab dark",
  motivation: "young indian athlete determined, golden hour epic 4K, mountain sunrise",
  tech:       "indian tech person excited, cyberpunk neon blue 4K, holographic displays",
  story:      "indian person emotional, dark film noir 4K, mysterious foggy",
  horror:     "scared indian person pale, horror dark red 4K, haunted darkness",
  shorts:     "young indian creator energetic, vibrant colorful 4K, urban neon",
  finance:    "indian businessman confident, professional gold 4K, financial charts",
  health:     "healthy indian person peaceful, warm natural 4K, yoga nature",
  general:    "indian person expressive, cinematic warm 4K, beautiful India sky",
}

// ✅ FIX 1: Replicate with proper null check (was crashing on undefined imgUrl)
async function generateWithReplicate(prompt, isShorts) {
  if (!REPLICATE_TOKEN) return null
  try {
    const res = await fetch(
      "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + REPLICATE_TOKEN,
          "Content-Type": "application/json",
          "Prefer": "wait"
        },
        body: JSON.stringify({
          input: {
            prompt,
            aspect_ratio: isShorts ? "9:16" : "16:9",
            output_format: "jpg",
            output_quality: 85,
            num_inference_steps: 4,
            go_fast: true
          }
        }),
        signal: AbortSignal.timeout(60000)
      }
    )
    if (!res.ok) {
      console.log("Replicate HTTP error:", res.status)
      return null
    }
    const data = await res.json()

    if (data.error) {
      console.log("Replicate API error:", data.error)
      return null
    }

    // ✅ FIX: was `imgUrl` undefined — now properly extracted
    const imgUrl = Array.isArray(data.output) ? data.output[0] : data.output

    if (!imgUrl || typeof imgUrl !== "string" || !imgUrl.startsWith("http")) {
      console.log("Replicate: no valid image URL in response:", JSON.stringify(data.output).slice(0, 100))
      return null
    }

    return imgUrl
  } catch (err) {
    console.log("Replicate failed:", err.message.slice(0, 80))
    return null
  }
}

// ✅ FIX 2: Hugging Face FREE fallback (no cost)
async function generateWithHuggingFace(prompt, isShorts) {
  if (!HF_TOKEN) return null
  try {
    console.log("Trying HuggingFace fallback...")
    const res = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + HF_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt }),
        signal: AbortSignal.timeout(45000)
      }
    )
    if (!res.ok) {
      console.log("HuggingFace HTTP error:", res.status)
      return null
    }
    // HF returns raw image bytes (not JSON)
    const contentType = res.headers.get("content-type") || ""
    if (!contentType.includes("image")) {
      console.log("HuggingFace: not an image response")
      return null
    }
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 10000) return null
    return buf // returns Buffer directly
  } catch (err) {
    console.log("HuggingFace failed:", err.message.slice(0, 80))
    return null
  }
}

export async function POST(req) {
  try {
    const { sceneText, category = "general", isShorts = true, sceneIndex = 0, totalScenes = 1, videoId } = await req.json()
    if (!sceneText) return NextResponse.json({ error: "sceneText required" }, { status: 400 })

    const dir = path.join(process.cwd(), "storage", "images")
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })

    const catKey = (category || "general").toLowerCase().replace(/\s+/g, "")
    const style = STYLES[catKey] || STYLES.general
    const pos = sceneIndex === 0 ? "opening hook" : sceneIndex === totalScenes - 1 ? "powerful ending" : "building scene"
    const prompt = style + ", scene: " + (sceneText || "").slice(0, 70) + ", " + pos + ", no text no watermark"

    console.log("AI Image " + (sceneIndex + 1) + "/" + totalScenes + "...")

    const fname = "ai_" + (videoId || Date.now()) + "_s" + sceneIndex + ".jpg"
    const fpath = path.join(dir, fname)

    // Try Replicate first
    const replicateUrl = await generateWithReplicate(prompt, isShorts)

    if (replicateUrl) {
      // Download image from URL
      try {
        const ir = await fetch(replicateUrl, { signal: AbortSignal.timeout(30000) })
        const buf = Buffer.from(await ir.arrayBuffer())
        if (buf.length > 10000) {
          await writeFile(fpath, buf)
          console.log("AI Image saved (Replicate): " + fname + " (" + (buf.length / 1024).toFixed(0) + "KB)")
          return NextResponse.json({ success: true, imageUrl: "/storage/images/" + fname, scene: sceneIndex, provider: "replicate" })
        }
      } catch (e) {
        console.log("Image download failed:", e.message)
      }
    }

    // Try HuggingFace fallback (FREE)
    const hfBuf = await generateWithHuggingFace(prompt, isShorts)
    if (hfBuf) {
      await writeFile(fpath, hfBuf)
      console.log("AI Image saved (HuggingFace FREE): " + fname + " (" + (hfBuf.length / 1024).toFixed(0) + "KB)")
      return NextResponse.json({ success: true, imageUrl: "/storage/images/" + fname, scene: sceneIndex, provider: "huggingface" })
    }

    // Both failed — gracefully skip, video will use Pexels/animated bg
    console.log("AI image skip: both providers failed, using background fallback")
    return NextResponse.json({ success: false, imageUrl: null, scene: sceneIndex, skipped: true })

  } catch (err) {
    console.error("AI Image error:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}