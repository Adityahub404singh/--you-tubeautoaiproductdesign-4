import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { createCanvas } from "canvas"

const THEMES: Record<string, any> = {
  facts:      { bg: ["#000428","#004e92"], accent: "#00d4ff", accent2: "#fff200", badge: "🧠 FACTS",      textColor: "#ffffff" },
  motivation: { bg: ["#0f0c29","#302b63","#24243e"], accent: "#ff6b35", accent2: "#ffd700", badge: "💪 MOTIVATION", textColor: "#ffffff" },
  tech:       { bg: ["#000000","#0a0a2e","#001a33"], accent: "#00ff88", accent2: "#0099ff", badge: "🤖 TECH/AI",    textColor: "#ffffff" },
  story:      { bg: ["#0d0010","#1a0020","#2d0040"], accent: "#cc44ff", accent2: "#ff88cc", badge: "📖 STORY",      textColor: "#ffffff" },
  top10:      { bg: ["#1a0a00","#2d1500","#ff4500"], accent: "#ffd700", accent2: "#ff8c00", badge: "🏆 TOP 10",     textColor: "#ffffff" },
  shorts:     { bg: ["#1a0000","#330000","#660000"], accent: "#ff0040", accent2: "#ff6600", badge: "⚡ SHORTS",     textColor: "#ffffff" },
  horror:     { bg: ["#000000","#0d0000","#1a0000"], accent: "#ff0000", accent2: "#880000", badge: "😱 HORROR",     textColor: "#ff4444" },
  general:    { bg: ["#000000","#0a0a1a","#1a0a2a"], accent: "#ff4488", accent2: "#ff8800", badge: "🔥 VIRAL",      textColor: "#ffffff" },
}

function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const test = current ? current + " " + word : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else current = test
  }
  if (current) lines.push(current)
  return lines.slice(0, 3)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Save dataUrl
    if (body.dataUrl && body.videoId) {
      const dir = path.join(process.cwd(), "storage", "thumbnails")
      if (!existsSync(dir)) await mkdir(dir, { recursive: true })
      const filename = `thumb_${body.videoId}.jpg`
      await writeFile(path.join(dir, filename), Buffer.from(body.dataUrl.replace(/^data:image\/\w+;base64,/, ""), "base64"))
      return NextResponse.json({ success: true, url: `/storage/thumbnails/${filename}` })
    }

    const { topic, title, boldText, emoji, videoType, category } = body
    if (!topic && !title) return NextResponse.json({ error: "topic required" }, { status: 400 })

    const catKey = ((category || "general").toLowerCase().replace(/\s+/g, "")) as string
    const theme = THEMES[catKey] || THEMES.general
    const isShorts = videoType === "shorts" || catKey === "shorts"
    const W = isShorts ? 1080 : 1280
    const H = isShorts ? 1920 : 720
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext("2d") as any

    // === BACKGROUND ===
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    const colors = theme.bg
    colors.forEach((c: string, i: number) => bgGrad.addColorStop(i / (colors.length - 1), c))
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // === NOISE TEXTURE ===
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
    }

    // === RADIAL GLOW ===
    const glow = ctx.createRadialGradient(W * 0.35, H * 0.5, 0, W * 0.35, H * 0.5, W * 0.7)
    const ac = theme.accent
    glow.addColorStop(0, ac + "33")
    glow.addColorStop(0.5, ac + "11")
    glow.addColorStop(1, "transparent")
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // === DIAGONAL LINES ===
    ctx.strokeStyle = ac + "15"
    ctx.lineWidth = 1
    for (let i = -H; i < W + H; i += 80) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke()
    }

    // === BOTTOM VIGNETTE ===
    const vig = ctx.createLinearGradient(0, H * 0.4, 0, H)
    vig.addColorStop(0, "rgba(0,0,0,0)")
    vig.addColorStop(1, "rgba(0,0,0,0.92)")
    ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H)

    // === TOP VIGNETTE ===
    const vigT = ctx.createLinearGradient(0, 0, 0, H * 0.3)
    vigT.addColorStop(0, "rgba(0,0,0,0.75)")
    vigT.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = vigT; ctx.fillRect(0, 0, W, H)

    // === ACCENT BARS ===
    ctx.fillStyle = ac
    ctx.fillRect(0, 0, W, isShorts ? 8 : 5)
    ctx.fillRect(0, H - (isShorts ? 8 : 5), W, isShorts ? 8 : 5)
    ctx.fillStyle = theme.accent2 + "88"
    ctx.fillRect(0, isShorts ? 8 : 5, W, isShorts ? 3 : 2)
    ctx.fillStyle = ac + "99"
    ctx.fillRect(0, 0, isShorts ? 8 : 5, H)

    // === EMOJI (ghost) ===
    const emojiChar = emoji || "🔥"
    ctx.globalAlpha = 0.07
    ctx.font = `${isShorts ? 420 : 300}px serif`
    ctx.textAlign = "right"
    ctx.fillStyle = "#ffffff"
    ctx.fillText(emojiChar, W - (isShorts ? 30 : 20), isShorts ? H * 0.55 : H * 0.75)
    ctx.globalAlpha = 1

    // === EMOJI (visible) ===
    ctx.font = `${isShorts ? 150 : 110}px serif`
    ctx.textAlign = "left"
    ctx.shadowColor = ac; ctx.shadowBlur = 40
    ctx.fillText(emojiChar, isShorts ? 70 : 50, isShorts ? H * 0.42 : H * 0.52)
    ctx.shadowBlur = 0

    // === MAIN TITLE ===
    const displayText = (boldText || title || "MUST WATCH").toUpperCase()
    const fontSize = isShorts ? 95 : 78
    ctx.font = `900 ${fontSize}px sans-serif`
    ctx.textAlign = "left"
    const maxW = isShorts ? W * 0.85 : W * 0.75
    const lines = wrapText(ctx, displayText, maxW)
    const lh = isShorts ? 108 : 88
    const startY = isShorts ? H * 0.52 : H * 0.38

    lines.forEach((line, i) => {
      // Glow layer
      ctx.shadowColor = ac; ctx.shadowBlur = 30
      ctx.fillStyle = ac
      ctx.fillText(line, isShorts ? 70 : 50, startY + i * lh)
      // White on top
      ctx.shadowBlur = 0
      ctx.fillStyle = "#FFFFFF"
      ctx.fillText(line, isShorts ? 70 : 50, startY + i * lh)
    })

    // === ACCENT UNDERLINE ===
    const grad = ctx.createLinearGradient(isShorts ? 70 : 50, 0, (isShorts ? 70 : 50) + maxW * 0.65, 0)
    grad.addColorStop(0, ac); grad.addColorStop(0.5, theme.accent2); grad.addColorStop(1, "transparent")
    ctx.fillStyle = grad
    ctx.fillRect(isShorts ? 70 : 50, startY + lines.length * lh + 8, maxW * 0.65, isShorts ? 6 : 4)

    // === CATEGORY BADGE (pill) ===
    const bText = theme.badge
    ctx.font = `bold ${isShorts ? 28 : 22}px sans-serif`
    const bW = ctx.measureText(bText).width + (isShorts ? 50 : 36)
    const bH = isShorts ? 62 : 48
    const bX = isShorts ? 70 : 50
    const bY = isShorts ? 95 : 60
    const bR = bH / 2
    ctx.fillStyle = ac
    ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.moveTo(bX + bR, bY); ctx.lineTo(bX + bW - bR, bY)
    ctx.quadraticCurveTo(bX + bW, bY, bX + bW, bY + bR)
    ctx.lineTo(bX + bW, bY + bH - bR)
    ctx.quadraticCurveTo(bX + bW, bY + bH, bX + bW - bR, bY + bH)
    ctx.lineTo(bX + bR, bY + bH)
    ctx.quadraticCurveTo(bX, bY + bH, bX, bY + bH - bR)
    ctx.lineTo(bX, bY + bR)
    ctx.quadraticCurveTo(bX, bY, bX + bR, bY)
    ctx.closePath(); ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"
    ctx.fillText(bText, bX + bW / 2, bY + bH * 0.68)

    // === BRAND BAR ===
    const brandH = isShorts ? 72 : 54
    ctx.fillStyle = "rgba(0,0,0,0.85)"
    ctx.fillRect(0, H - brandH, W, brandH)
    ctx.fillStyle = ac
    ctx.fillRect(0, H - brandH, W, 2)
    ctx.font = `bold ${isShorts ? 26 : 19}px sans-serif`
    ctx.textAlign = "right"
    ctx.fillStyle = ac
    ctx.fillText("▶ YouTubeAuto.AI", W - (isShorts ? 28 : 18), H - (isShorts ? 24 : 16))
    ctx.font = `${isShorts ? 19 : 13}px sans-serif`
    ctx.textAlign = "left"
    ctx.fillStyle = "rgba(255,255,255,0.45)"
    ctx.fillText("© AI Generated | Copyright Free | Pexels CC0", isShorts ? 28 : 18, H - (isShorts ? 24 : 16))

    // Save
    const dir = path.join(process.cwd(), "storage", "thumbnails")
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })
    const filename = `thumb_${catKey}_${Date.now()}.jpg`
    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.96 })
    await writeFile(path.join(dir, filename), buffer)
    const thumbnailUrl = `/storage/thumbnails/${filename}`
    console.log("✅ Thumbnail:", filename, "Size:", buffer.length, "Category:", catKey)

    return NextResponse.json({ success: true, url: thumbnailUrl, thumbnailUrl, category: catKey })
  } catch (e: any) {
    console.error("Thumbnail error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
