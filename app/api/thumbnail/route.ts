import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { createCanvas } from "canvas"

const THEMES: Record<string, any> = {
  facts:      { bg: ["#0a0a2e","#1a1a6e","#0d47a1"], accent: "#00E5FF", accent2: "#FFD600", badge: "FACTS", badgeBg: "#1565C0", emoji: "🧠" },
  motivation: { bg: ["#1a0500","#7f1500","#bf360c"], accent: "#FF6D00", accent2: "#FFD740", badge: "MOTIVATION", badgeBg: "#E64A19", emoji: "💪" },
  tech:       { bg: ["#001a00","#003300","#1b5e20"], accent: "#00E676", accent2: "#40C4FF", badge: "TECH/AI", badgeBg: "#2E7D32", emoji: "🤖" },
  story:      { bg: ["#0d0020","#2d0060","#4a148c"], accent: "#EA80FC", accent2: "#FF80AB", badge: "STORY", badgeBg: "#6A1B9A", emoji: "📖" },
  top10:      { bg: ["#1a0e00","#5d2d00","#e65100"], accent: "#FFD740", accent2: "#FF6E40", badge: "TOP 10", badgeBg: "#E65100", emoji: "🏆" },
  shorts:     { bg: ["#1a0000","#7f0000","#c62828"], accent: "#FF1744", accent2: "#FF9100", badge: "SHORTS", badgeBg: "#C62828", emoji: "⚡" },
  general:    { bg: ["#0a0a0a","#1a1a2e","#16213e"], accent: "#FF4081", accent2: "#FF6E40", badge: "VIRAL", badgeBg: "#880E4F", emoji: "🔥" },
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return { r, g, b }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.dataUrl && body.videoId) {
      const base64 = body.dataUrl.replace(/^data:image\/\w+;base64,/, "")
      const dir = path.join(process.cwd(), "storage", "thumbnails")
      if (!existsSync(dir)) await mkdir(dir, { recursive: true })
      const filename = `thumb_${body.videoId}.jpg`
      await writeFile(path.join(dir, filename), Buffer.from(base64, "base64"))
      return NextResponse.json({ success: true, url: `/storage/thumbnails/${filename}` })
    }

    const { topic, title, boldText, emoji, videoType, category } = body
    if (!topic && !title) return NextResponse.json({ error: "topic required" }, { status: 400 })

    const catKey = (category || "general").toLowerCase()
    const theme = THEMES[catKey] || THEMES.general
    const isShorts = videoType === "shorts"
    const W = isShorts ? 1080 : 1280
    const H = isShorts ? 1920 : 720
    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext("2d") as any

    // === BACKGROUND - Deep cinematic gradient ===
    const bgGrad = ctx.createLinearGradient(0, 0, W, H)
    bgGrad.addColorStop(0, theme.bg[0])
    bgGrad.addColorStop(0.45, theme.bg[1])
    bgGrad.addColorStop(1, theme.bg[2])
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // === NOISE TEXTURE overlay ===
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * W
      const y = Math.random() * H
      const alpha = Math.random() * 0.03
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.fillRect(x, y, 1, 1)
    }

    // === DIAGONAL LIGHT SWEEP ===
    const sweep = ctx.createLinearGradient(0, 0, W, H)
    const ac = hexToRgb(theme.accent)
    sweep.addColorStop(0, `rgba(${ac.r},${ac.g},${ac.b},0)`)
    sweep.addColorStop(0.35, `rgba(${ac.r},${ac.g},${ac.b},0.06)`)
    sweep.addColorStop(0.5, `rgba(${ac.r},${ac.g},${ac.b},0.12)`)
    sweep.addColorStop(0.65, `rgba(${ac.r},${ac.g},${ac.b},0.06)`)
    sweep.addColorStop(1, `rgba(${ac.r},${ac.g},${ac.b},0)`)
    ctx.fillStyle = sweep
    ctx.fillRect(0, 0, W, H)

    // === RADIAL GLOW center-left ===
    const glow = ctx.createRadialGradient(W*0.3, H*0.5, 0, W*0.3, H*0.5, W*0.6)
    glow.addColorStop(0, `rgba(${ac.r},${ac.g},${ac.b},0.15)`)
    glow.addColorStop(0.5, `rgba(${ac.r},${ac.g},${ac.b},0.05)`)
    glow.addColorStop(1, "transparent")
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // === GEOMETRIC LINES (cinematic look) ===
    ctx.strokeStyle = `rgba(${ac.r},${ac.g},${ac.b},0.08)`
    ctx.lineWidth = 1
    for (let i = 0; i < 8; i++) {
      ctx.beginPath()
      ctx.moveTo(0, (H / 8) * i)
      ctx.lineTo(W, (H / 8) * i + 50)
      ctx.stroke()
    }

    // === BOTTOM DARK VIGNETTE ===
    const vignette = ctx.createLinearGradient(0, H*0.55, 0, H)
    vignette.addColorStop(0, "rgba(0,0,0,0)")
    vignette.addColorStop(1, "rgba(0,0,0,0.85)")
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, W, H)

    // === TOP DARK VIGNETTE ===
    const vigTop = ctx.createLinearGradient(0, 0, 0, H*0.35)
    vigTop.addColorStop(0, "rgba(0,0,0,0.7)")
    vigTop.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = vigTop
    ctx.fillRect(0, 0, W, H)

    // === ACCENT BORDER LINES ===
    ctx.fillStyle = theme.accent
    ctx.fillRect(0, 0, W, isShorts ? 6 : 5)
    ctx.fillRect(0, H-(isShorts?6:5), W, isShorts?6:5)
    ctx.fillStyle = theme.accent2
    ctx.fillRect(0, isShorts?6:5, W, isShorts?3:2)

    // === VERTICAL LEFT ACCENT ===
    const leftBar = ctx.createLinearGradient(0, 0, 0, H)
    leftBar.addColorStop(0, theme.accent)
    leftBar.addColorStop(0.5, theme.accent2)
    leftBar.addColorStop(1, theme.accent)
    ctx.fillStyle = leftBar
    ctx.fillRect(0, 0, isShorts?8:6, H)

    // === BIG EMOJI (ghost watermark) ===
    const emojiChar = emoji || theme.emoji
    ctx.globalAlpha = 0.08
    ctx.font = `${isShorts?380:260}px serif`
    ctx.textAlign = "center"
    ctx.fillStyle = "#FFFFFF"
    ctx.fillText(emojiChar, W*0.78, isShorts?H*0.52:H*0.62)
    ctx.globalAlpha = 1

    // === MAIN EMOJI (visible) ===
    ctx.font = `${isShorts?140:100}px serif`
    ctx.textAlign = "left"
    ctx.shadowColor = `rgba(${ac.r},${ac.g},${ac.b},0.8)`
    ctx.shadowBlur = 30
    ctx.fillText(emojiChar, isShorts?60:50, isShorts?H*0.36:H*0.46)
    ctx.shadowBlur = 0

    // === MAIN TITLE TEXT ===
    const displayText = (boldText || title || "MUST WATCH").toUpperCase()
    const words = displayText.split(" ")
    const fontSize = isShorts ? 88 : 72
    ctx.font = `900 ${fontSize}px sans-serif`
    ctx.textAlign = "left"

    // Word wrap
    const maxW = isShorts ? W*0.88 : W*0.72
    let lines: string[] = []
    let cur = ""
    for (const w of words) {
      const test = cur ? cur + " " + w : w
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w }
      else cur = test
    }
    if (cur) lines.push(cur)
    lines = lines.slice(0, 3)

    const lh = isShorts ? 100 : 82
    const startY = isShorts ? H*0.48 : H*0.36

    // Text shadow layers (glow effect)
    lines.forEach((line, i) => {
      // Outer glow
      ctx.shadowColor = `rgba(${ac.r},${ac.g},${ac.b},0.6)`
      ctx.shadowBlur = 25
      ctx.fillStyle = theme.accent
      ctx.fillText(line, isShorts?60:50, startY + i*lh)
      // White text on top
      ctx.shadowBlur = 0
      ctx.fillStyle = "#FFFFFF"
      ctx.fillText(line, isShorts?60:50, startY + i*lh)
    })

    // === ACCENT UNDERLINE ===
    const grad = ctx.createLinearGradient(isShorts?60:50, 0, (isShorts?60:50) + maxW*0.6, 0)
    grad.addColorStop(0, theme.accent)
    grad.addColorStop(0.5, theme.accent2)
    grad.addColorStop(1, "transparent")
    ctx.fillStyle = grad
    ctx.fillRect(isShorts?60:50, startY + lines.length*lh + 5, maxW*0.6, isShorts?5:4)

    // === CATEGORY BADGE (pill shape) ===
    const bW = isShorts ? 200 : 155
    const bH = isShorts ? 58 : 44
    const bX = isShorts ? 60 : 50
    const bY = isShorts ? 90 : 55
    const bR = bH / 2
    ctx.fillStyle = theme.badgeBg
    ctx.shadowColor = `rgba(0,0,0,0.5)`
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.moveTo(bX + bR, bY)
    ctx.lineTo(bX + bW - bR, bY)
    ctx.quadraticCurveTo(bX+bW, bY, bX+bW, bY+bR)
    ctx.lineTo(bX+bW, bY+bH-bR)
    ctx.quadraticCurveTo(bX+bW, bY+bH, bX+bW-bR, bY+bH)
    ctx.lineTo(bX+bR, bY+bH)
    ctx.quadraticCurveTo(bX, bY+bH, bX, bY+bH-bR)
    ctx.lineTo(bX, bY+bR)
    ctx.quadraticCurveTo(bX, bY, bX+bR, bY)
    ctx.closePath()
    ctx.fill()
    ctx.shadowBlur = 0
    // Badge border
    ctx.strokeStyle = theme.accent
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = "#FFFFFF"
    ctx.font = `bold ${isShorts?26:20}px sans-serif`
    ctx.textAlign = "center"
    ctx.fillText(theme.badge, bX + bW/2, bY + bH*0.68)

    // === BRAND WATERMARK ===
    const brandH = isShorts ? 70 : 52
    ctx.fillStyle = "rgba(0,0,0,0.75)"
    ctx.fillRect(0, H-brandH, W, brandH)
    // Brand accent line
    ctx.fillStyle = theme.accent
    ctx.fillRect(0, H-brandH, W, 2)
    ctx.fillStyle = theme.accent
    ctx.font = `bold ${isShorts?24:18}px sans-serif`
    ctx.textAlign = "right"
    ctx.fillText("▶ YouTubeAuto.AI", W-(isShorts?25:18), H-(isShorts?22:15))
    // Copyright
    ctx.fillStyle = "rgba(255,255,255,0.5)"
    ctx.font = `${isShorts?18:13}px sans-serif`
    ctx.textAlign = "left"
    ctx.fillText("© AI Generated | Copyright Free", isShorts?25:18, H-(isShorts?22:15))

    // Save
    const dir = path.join(process.cwd(), "storage", "thumbnails")
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })
    const filename = `thumb_${catKey}_${Date.now()}.jpg`
    const buffer = canvas.toBuffer("image/jpeg", { quality: 0.95 })
    await writeFile(path.join(dir, filename), buffer)
    const thumbnailUrl = `/storage/thumbnails/${filename}`
    console.log("✅ Thumbnail saved:", filename, "Size:", buffer.length, "Category:", catKey)

    return NextResponse.json({ success: true, url: thumbnailUrl, thumbnailUrl, category: catKey })
  } catch (e: any) {
    console.error("Thumbnail error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
