// app/api/thumbnail/route.ts
import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import { createCanvas, registerFont } from "canvas"

// ✅ Register Hindi font
const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari.ttf")
const fontBoldPath = path.join(process.cwd(), "public", "fonts", "NotoSansDevanagari-Bold.ttf")
try {
  if (existsSync(fontPath)) registerFont(fontPath, { family: "NotoSans" })
  if (existsSync(fontBoldPath)) registerFont(fontBoldPath, { family: "NotoSans", weight: "bold" })
} catch {}

// ✅ All categories — viral YouTube thumbnail styles
const THEMES: Record<string, any> = {
  psychology: {
    bg: ["#0a0015","#1a0a2e","#2d1b4e"],
    accent: "#8B5CF6", accent2: "#00E5FF",
    badge: "PSYCHOLOGY", badgeIcon: "🧠",
    textColor: "#FFFFFF", glowColor: "#8B5CF6",
    badgeBg: "#8B5CF6", badgeText: "#FFFFFF",
  },
  stoicism: {
    bg: ["#0d0d0d","#1a1a1a","#2b2b2b"],
    accent: "#9E9E9E", accent2: "#FFFFFF",
    badge: "STOICISM", badgeIcon: "🏛️",
    textColor: "#FFFFFF", glowColor: "#9E9E9E",
    badgeBg: "#9E9E9E", badgeText: "#000000",
  },
  quotes: {
    bg: ["#1a1000","#2d1e00","#3d2b00"],
    accent: "#FFC107", accent2: "#FFF3D6",
    badge: "QUOTES", badgeIcon: "💬",
    textColor: "#FFFFFF", glowColor: "#FFC107",
    badgeBg: "#FFC107", badgeText: "#000000",
  },
  businesslessons: {
    bg: ["#00121a","#001f2e","#002e44"],
    accent: "#2196F3", accent2: "#00E5FF",
    badge: "BUSINESS", badgeIcon: "💼",
    textColor: "#FFFFFF", glowColor: "#2196F3",
    badgeBg: "#2196F3", badgeText: "#FFFFFF",
  },
  storytelling: {
    bg: ["#0d0010","#1a0020","#2d0045"],
    accent: "#CC44FF", accent2: "#FF88CC",
    badge: "STORY", badgeIcon: "📖",
    textColor: "#FFFFFF", glowColor: "#CC44FF",
    badgeBg: "#CC44FF", badgeText: "#FFFFFF",
  },
  startupstories: {
    bg: ["#001a1a","#002828","#003838"],
    accent: "#00BCD4", accent2: "#00FF88",
    badge: "STARTUP", badgeIcon: "🚀",
    textColor: "#FFFFFF", glowColor: "#00BCD4",
    badgeBg: "#00BCD4", badgeText: "#000000",
  },
  luxury: {
    bg: ["#1a1400","#2d2200","#3d2e00"],
    accent: "#FFD700", accent2: "#FFFFFF",
    badge: "LUXURY", badgeIcon: "💎",
    textColor: "#FFFFFF", glowColor: "#FFD700",
    badgeBg: "#FFD700", badgeText: "#000000",
  },
  history: {
    bg: ["#1a1005","#2d1d0d","#3d2815"],
    accent: "#C08552", accent2: "#FFD9A0",
    badge: "HISTORY", badgeIcon: "🏺",
    textColor: "#FFFFFF", glowColor: "#C08552",
    badgeBg: "#C08552", badgeText: "#000000",
  },
  pov: {
    bg: ["#000014","#0a0a2e","#14144a"],
    accent: "#00FFFF", accent2: "#FF00FF",
    badge: "POV", badgeIcon: "👁️",
    textColor: "#FFFFFF", glowColor: "#00FFFF",
    badgeBg: "#00FFFF", badgeText: "#000000",
  },
  horror: {
    bg: ["#000000","#0d0000","#1a0000"],
    accent: "#FF0000", accent2: "#880000",
    badge: "HORROR", badgeIcon: "😱",
    textColor: "#FF4444", glowColor: "#FF0000",
    badgeBg: "#FF0000", badgeText: "#FFFFFF",
  },
  ainews: {
    bg: ["#000a1a","#00142d","#001f3d"],
    accent: "#0057FF", accent2: "#00E5FF",
    badge: "AI NEWS", badgeIcon: "📡",
    textColor: "#FFFFFF", glowColor: "#0057FF",
    badgeBg: "#0057FF", badgeText: "#FFFFFF",
  },
  general: {
    bg: ["#000000","#0a0a1a","#1a0a2a"],
    accent: "#FF4088", accent2: "#FFFF00",
    badge: "VIRAL", badgeIcon: "🔥",
    textColor: "#FFFFFF", glowColor: "#FF4088",
    badgeBg: "#FF4088", badgeText: "#FFFFFF",
  },
}

function wrapText(ctx: any, text: string, maxWidth: number, maxLines = 3): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const test = current ? current + " " + word : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current); current = word
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

// ✅ Draw viral-style YouTube thumbnail
function drawThumbnail(ctx: any, W: number, H: number, theme: any, isShorts: boolean, displayText: string, subText: string, catKey: string) {
  const fontFamily = existsSync(fontPath) ? "NotoSans, Arial, sans-serif" : "Arial, sans-serif"

  // === BACKGROUND ===
  const bgGrad = ctx.createLinearGradient(0, 0, W, H)
  const colors = theme.bg
  colors.forEach((c: string, i: number) => bgGrad.addColorStop(i / Math.max(colors.length - 1, 1), c))
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // === NOISE TEXTURE ===
  for (let i = 0; i < 4000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`
    ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 2, Math.random() * 2)
  }

  // === RADIAL GLOW ===
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.65)
  glow.addColorStop(0, theme.glowColor + "55")
  glow.addColorStop(0.4, theme.glowColor + "22")
  glow.addColorStop(1, "transparent")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // === CORNER GLOW (top-left) ===
  const cornerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.5)
  cornerGlow.addColorStop(0, theme.accent + "44")
  cornerGlow.addColorStop(1, "transparent")
  ctx.fillStyle = cornerGlow
  ctx.fillRect(0, 0, W, H)

  // === DIAGONAL ACCENT LINES ===
  ctx.strokeStyle = theme.accent + "25"
  ctx.lineWidth = isShorts ? 2 : 1.5
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.moveTo(W * (0.1 + i * 0.3), 0)
    ctx.lineTo(W * (0.4 + i * 0.3), H)
    ctx.stroke()
  }

  // === SUBTLE GRID ===
  ctx.strokeStyle = theme.accent + "10"
  ctx.lineWidth = 0.5
  const grid = isShorts ? 100 : 80
  for (let x = 0; x < W; x += grid) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
  }
  for (let y = 0; y < H; y += grid) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
  }

  // === TOP ACCENT BAR ===
  const topGrad = ctx.createLinearGradient(0, 0, W, 0)
  topGrad.addColorStop(0, theme.accent)
  topGrad.addColorStop(0.5, theme.accent2)
  topGrad.addColorStop(1, theme.accent)
  ctx.fillStyle = topGrad
  ctx.fillRect(0, 0, W, isShorts ? 8 : 6)

  // === BOTTOM ACCENT BAR ===
  ctx.fillStyle = topGrad
  ctx.fillRect(0, H - (isShorts ? 8 : 6), W, isShorts ? 8 : 6)

  // === CATEGORY BADGE (top-left) ===
  const badgeFontSize = isShorts ? 34 : 24
  ctx.font = `900 ${badgeFontSize}px ${fontFamily}`
  const badgeText = theme.badge
  const badgeMetrics = ctx.measureText(badgeText)
  const badgePad = isShorts ? 28 : 20
  const badgeW = badgeMetrics.width + badgePad * 2
  const badgeH = isShorts ? 58 : 44
  const badgeX = isShorts ? 50 : 36
  const badgeY = isShorts ? 28 : 20

  // Badge shadow
  ctx.shadowColor = theme.accent + "88"
  ctx.shadowBlur = 20
  drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, isShorts ? 14 : 10)
  ctx.fillStyle = theme.badgeBg
  ctx.fill()
  ctx.shadowBlur = 0

  // Badge border
  ctx.strokeStyle = theme.accent2
  ctx.lineWidth = 2
  ctx.stroke()

  // Badge text
  ctx.fillStyle = theme.badgeText
  ctx.textBaseline = "middle"
  ctx.font = `900 ${badgeFontSize}px ${fontFamily}`
  ctx.fillText(badgeText, badgeX + badgePad, badgeY + badgeH / 2)

  // === MAIN TITLE — RED/WHITE/YELLOW viral style ===
  const displayTextUpper = displayText.toUpperCase()
  const titleFontSize = isShorts
    ? (displayTextUpper.length > 25 ? 85 : displayTextUpper.length > 12 ? 108 : 130)
    : (displayTextUpper.length > 35 ? 58 : displayTextUpper.length > 18 ? 70 : 86)

  ctx.font = `900 ${titleFontSize}px ${fontFamily}`
  ctx.textBaseline = "top"
  const maxTitleW = W - (isShorts ? 100 : 72)
  const titleLines = wrapText(ctx, displayTextUpper, maxTitleW, isShorts ? 4 : 3)
  const lineHeight = titleFontSize * 1.18
  const totalTitleH = titleLines.length * lineHeight
  const titleStartY = isShorts ? H * 0.3 - totalTitleH / 2 : H * 0.48 - totalTitleH / 2

  titleLines.forEach((line, i) => {
    const y = titleStartY + i * lineHeight
    const x = isShorts ? W / 2 : W * 0.06

    // Drop shadow
    ctx.shadowColor = "rgba(0,0,0,0.9)"
    ctx.shadowBlur = 12
    ctx.shadowOffsetX = 4
    ctx.shadowOffsetY = 4
    ctx.fillStyle = "#000000"
    if (isShorts) { ctx.textAlign = "center"; ctx.fillText(line, x + 3, y + 3); ctx.textAlign = "left" }
    else ctx.fillText(line, x + 3, y + 3)
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0

    // ✅ Alternating RED & YELLOW lines — viral YouTube style
    const lineColor = i % 2 === 0 ? "#FF0000" : "#FFFF00"
    const textGrad = ctx.createLinearGradient(0, y, 0, y + titleFontSize)
    textGrad.addColorStop(0, lineColor)
    textGrad.addColorStop(1, i % 2 === 0 ? "#CC0000" : "#FFD700")
    ctx.fillStyle = textGrad

    // Stroke (black outline = crisp YouTube look)
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = isShorts ? 6 : 5
    if (isShorts) {
      ctx.textAlign = "center"
      ctx.strokeText(line, x, y)
      ctx.fillText(line, x, y)
      ctx.textAlign = "left"
    } else {
      ctx.strokeText(line, x, y)
      ctx.fillText(line, x, y)
    }
  })

  // === ACCENT LINE UNDER TITLE ===
  const lineY = titleStartY + totalTitleH + (isShorts ? 24 : 18)
  const accentGrad = ctx.createLinearGradient(
    isShorts ? W * 0.15 : W * 0.04, 0,
    isShorts ? W * 0.85 : W * 0.55, 0
  )
  accentGrad.addColorStop(0, theme.accent)
  accentGrad.addColorStop(0.5, theme.accent2)
  accentGrad.addColorStop(1, "transparent")
  ctx.fillStyle = accentGrad
  ctx.fillRect(isShorts ? W * 0.15 : W * 0.04, lineY, isShorts ? W * 0.7 : W * 0.45, isShorts ? 5 : 4)

  // === SUBTITLE ===
  const subFontSize = isShorts ? 42 : 30
  ctx.font = `600 ${subFontSize}px ${fontFamily}`
  ctx.fillStyle = "rgba(255,255,255,0.7)"
  ctx.textBaseline = "top"
  const subY = lineY + (isShorts ? 28 : 22)
  if (isShorts) {
    ctx.textAlign = "center"
    ctx.fillText(subText.slice(0, 42), W / 2, subY)
    ctx.textAlign = "left"
  } else {
    ctx.fillText(subText.slice(0, 55), W * 0.06, subY)
  }

  // === WATERMARK ===
  const wmFontSize = isShorts ? 28 : 20
  ctx.font = `700 ${wmFontSize}px ${fontFamily}`
  ctx.fillStyle = "rgba(255,255,255,0.22)"
  ctx.textBaseline = "bottom"
  ctx.textAlign = "right"
  ctx.fillText("YouTubeAuto.ai", W - (isShorts ? 36 : 24), H - (isShorts ? 20 : 14))
  ctx.textAlign = "left"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Handle base64 dataUrl save
    if (body.dataUrl && body.videoId) {
      const dir = path.join(process.cwd(), "storage", "thumbnails")
      if (!existsSync(dir)) await mkdir(dir, { recursive: true })
      const filename = `thumb_${body.videoId}.jpg`
      await writeFile(
        path.join(dir, filename),
        Buffer.from(body.dataUrl.replace(/^data:image\/\w+;base64,/, ""), "base64")
      )
      return NextResponse.json({ success: true, url: `/storage/thumbnails/${filename}` })
    }

    const { topic, title, boldText, emoji, videoType, category } = body
    if (!topic && !title) return NextResponse.json({ error: "topic required" }, { status: 400 })

    const catKey = ((category || "general").toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "")) as string
    const theme  = THEMES[catKey] || THEMES.general
    const isShorts = videoType === "shorts" || catKey === "shorts"
    const W = isShorts ? 1080 : 1280
    const H = isShorts ? 1920 : 720

    const canvas = createCanvas(W, H)
    const ctx    = canvas.getContext("2d") as any

    const displayText = (boldText || title || topic || "").toUpperCase()
    const subText     = (topic || title || "").slice(0, 60)

    drawThumbnail(ctx, W, H, theme, isShorts, displayText, subText, catKey)

    // Save
    const dir = path.join(process.cwd(), "storage", "thumbnails")
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })
    const filename = `thumb_${catKey}_${Date.now()}.jpg`
    const buffer   = canvas.toBuffer("image/jpeg", { quality: 0.96 })
    await writeFile(path.join(dir, filename), buffer)
    const thumbnailUrl = `/storage/thumbnails/${filename}`

    console.log("✅ Thumbnail saved:", filename, "Size:", buffer.length, "Category:", catKey, isShorts ? "SHORTS" : "LANDSCAPE")

    return NextResponse.json({
      success: true,
      url: thumbnailUrl,
      thumbnailUrl,
      category: catKey,
      dimensions: `${W}x${H}`,
    })
  } catch (e: any) {
    console.error("Thumbnail error:", e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}