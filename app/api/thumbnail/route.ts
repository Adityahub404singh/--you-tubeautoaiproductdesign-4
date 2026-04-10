import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { createCanvas, registerFont } from "canvas"

// Register Hindi font - FIXES ?? issue
const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari.ttf")
try {
  if (existsSync(fontPath)) {
    registerFont(fontPath, { family: "NotoSans" })
  }
} catch {}

const THEMES: Record<string, any> = {
  facts:      { bg: ["#000428","#004e92"],           accent: "#00d4ff", accent2: "#fff200", badge: "FACTS",      badgeIcon: "🧠", textColor: "#ffffff", glowColor: "#00d4ff" },
  motivation: { bg: ["#0f0c29","#302b63","#24243e"], accent: "#ff6b35", accent2: "#ffd700", badge: "MOTIVATION", badgeIcon: "💪", textColor: "#ffffff", glowColor: "#ff6b35" },
  tech:       { bg: ["#000000","#0a0a2e","#001a33"], accent: "#00ff88", accent2: "#0099ff", badge: "TECH/AI",    badgeIcon: "🤖", textColor: "#ffffff", glowColor: "#00ff88" },
  story:      { bg: ["#0d0010","#1a0020","#2d0040"], accent: "#cc44ff", accent2: "#ff88cc", badge: "STORY",      badgeIcon: "📖", textColor: "#ffffff", glowColor: "#cc44ff" },
  top10:      { bg: ["#1a0a00","#2d1500","#3d1a00"], accent: "#ffd700", accent2: "#ff8c00", badge: "TOP 10",     badgeIcon: "🏆", textColor: "#ffffff", glowColor: "#ffd700" },
  shorts:     { bg: ["#1a0000","#330000","#660000"], accent: "#ff0040", accent2: "#ff6600", badge: "SHORTS",     badgeIcon: "⚡", textColor: "#ffffff", glowColor: "#ff0040" },
  horror:     { bg: ["#000000","#0d0000","#1a0000"], accent: "#ff0000", accent2: "#880000", badge: "HORROR",     badgeIcon: "😱", textColor: "#ff4444", glowColor: "#ff0000" },
  general:    { bg: ["#000000","#0a0a1a","#1a0a2a"], accent: "#ff4488", accent2: "#ff8800", badge: "VIRAL",      badgeIcon: "🔥", textColor: "#ffffff", glowColor: "#ff4488" },
}

function wrapText(ctx: any, text: string, maxWidth: number, maxLines = 3): string[] {
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
  return lines.slice(0, maxLines)
}

function drawRoundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

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

    // Use Hindi font if available, fallback to system
    const fontFamily = existsSync(fontPath) ? "NotoSans, Arial, sans-serif" : "Arial, sans-serif"

    // === BACKGROUND GRADIENT ===
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    const colors = theme.bg
    colors.forEach((c: string, i: number) => bgGrad.addColorStop(i / Math.max(colors.length - 1, 1), c))
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // === NOISE TEXTURE ===
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.02})`
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1)
    }

    // === RADIAL GLOW CENTER ===
    const glow = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, W * 0.6)
    glow.addColorStop(0, theme.glowColor + "40")
    glow.addColorStop(0.5, theme.glowColor + "15")
    glow.addColorStop(1, "transparent")
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // === GRID LINES (subtle) ===
    ctx.strokeStyle = theme.accent + "12"
    ctx.lineWidth = 0.5
    for (let x = 0; x < W; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
    }
    for (let y = 0; y < H; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // === DIAGONAL ACCENT LINE ===
    ctx.strokeStyle = theme.accent + "30"
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(0, H * 0.3); ctx.lineTo(W, H * 0.7); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W * 0.1, 0); ctx.lineTo(W * 0.9, H); ctx.stroke()

    // === BOTTOM ACCENT BAR ===
    const barGrad = ctx.createLinearGradient(0, 0, W, 0)
    barGrad.addColorStop(0, theme.accent)
    barGrad.addColorStop(0.5, theme.accent2)
    barGrad.addColorStop(1, theme.accent)
    ctx.fillStyle = barGrad
    ctx.fillRect(0, H - (isShorts ? 12 : 8), W, isShorts ? 12 : 8)

    // === CATEGORY BADGE (top-left) ===
    const badgeText = theme.badge
    const badgeFontSize = isShorts ? 36 : 26
    ctx.font = `bold ${badgeFontSize}px ${fontFamily}`
    const badgeW = ctx.measureText(badgeText).width + (isShorts ? 60 : 40)
    const badgeH = isShorts ? 60 : 44
    const badgeX = isShorts ? 60 : 40
    const badgeY = isShorts ? 80 : 40

    // Badge background
    drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, isShorts ? 16 : 12)
    ctx.fillStyle = theme.accent
    ctx.fill()

    // Badge text (ASCII only to avoid font issues)
    ctx.fillStyle = "#000000"
    ctx.font = `bold ${badgeFontSize}px ${fontFamily}`
    ctx.textBaseline = "middle"
    ctx.fillText(badgeText, badgeX + (isShorts ? 30 : 20), badgeY + badgeH / 2)

    // === MAIN TITLE ===
    const displayText = (boldText || title || topic || "").toUpperCase()
    const titleFontSize = isShorts
      ? (displayText.length > 20 ? 90 : displayText.length > 10 ? 110 : 130)
      : (displayText.length > 30 ? 60 : displayText.length > 15 ? 72 : 88)

    ctx.font = `900 ${titleFontSize}px ${fontFamily}`
    ctx.textBaseline = "top"

    const maxTitleWidth = W - (isShorts ? 120 : 80)
    const titleLines = wrapText(ctx, displayText, maxTitleWidth, isShorts ? 4 : 3)

    const lineHeight = titleFontSize * 1.15
    const totalTitleH = titleLines.length * lineHeight
    const titleStartY = isShorts
      ? (H * 0.35 - totalTitleH / 2)
      : (H * 0.5 - totalTitleH / 2)

    titleLines.forEach((line, i) => {
      const y = titleStartY + i * lineHeight
      const x = isShorts ? W / 2 : W * 0.08

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.8)"
      ctx.fillText(line, x + 4, y + 4)

      // Gradient text
      const textGrad = ctx.createLinearGradient(0, y, 0, y + titleFontSize)
      textGrad.addColorStop(0, theme.textColor)
      textGrad.addColorStop(1, theme.accent2)
      ctx.fillStyle = textGrad

      if (isShorts) {
        ctx.textAlign = "center"
        ctx.fillText(line, x, y)
        ctx.textAlign = "left"
      } else {
        ctx.fillText(line, x, y)
      }
    })

    // === ACCENT LINE UNDER TITLE ===
    const lineY = titleStartY + totalTitleH + (isShorts ? 20 : 15)
    const lineGrad = ctx.createLinearGradient(isShorts ? W * 0.2 : W * 0.05, 0, isShorts ? W * 0.8 : W * 0.5, 0)
    lineGrad.addColorStop(0, theme.accent)
    lineGrad.addColorStop(1, "transparent")
    ctx.fillStyle = lineGrad
    ctx.fillRect(isShorts ? W * 0.2 : W * 0.05, lineY, isShorts ? W * 0.6 : W * 0.4, isShorts ? 5 : 4)

    // === TOPIC SUBTITLE ===
    const subtitleText = (topic || title || "").slice(0, 60)
    const subFontSize = isShorts ? 44 : 32
    ctx.font = `500 ${subFontSize}px ${fontFamily}`
    ctx.fillStyle = "rgba(255,255,255,0.65)"
    ctx.textBaseline = "top"

    if (isShorts) {
      ctx.textAlign = "center"
      ctx.fillText(subtitleText.slice(0, 40), W / 2, lineY + 30)
      ctx.textAlign = "left"
    } else {
      ctx.fillText(subtitleText, W * 0.08, lineY + 20)
    }

    // === WATERMARK ===
    const wmFontSize = isShorts ? 32 : 22
    ctx.font = `bold ${wmFontSize}px ${fontFamily}`
    ctx.fillStyle = "rgba(255,255,255,0.25)"
    ctx.textBaseline = "bottom"
    ctx.textAlign = "right"
    ctx.fillText("YouTubeAuto.ai", W - (isShorts ? 40 : 30), H - (isShorts ? 25 : 18))
    ctx.textAlign = "left"

    // === SAVE ===
    const dir = path.join(process.cwd(), "storage", "thumbnails")
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })
    const filename = `thumb_${catKey}_${Date.now()}.jpg`
    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 })
    await writeFile(path.join(dir, filename), buffer)
    const thumbnailUrl = `/storage/thumbnails/${filename}`
    console.log("Thumbnail saved:", filename, "Size:", buffer.length, "Category:", catKey)

    return NextResponse.json({ success: true, url: thumbnailUrl, thumbnailUrl, category: catKey })
  } catch (e: any) {
    console.error("Thumbnail error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
