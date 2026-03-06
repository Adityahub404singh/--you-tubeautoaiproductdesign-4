"use client"
import { useEffect, useRef } from "react"

interface ThumbnailProps {
  boldText: string
  bgColor: string
  emoji: string
  title: string
  channelName?: string
}

export function ThumbnailPreview({ boldText, bgColor, emoji, title, channelName }: ThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const W = 1280
    const H = 720
    canvas.width = W
    canvas.height = H

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, bgColor || "#1a1a2e")
    grad.addColorStop(0.5, shadeColor(bgColor || "#1a1a2e", -30))
    grad.addColorStop(1, "#000000")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Decorative circles
    ctx.globalAlpha = 0.15
    ctx.beginPath()
    ctx.arc(W * 0.85, H * 0.2, 200, 0, Math.PI * 2)
    ctx.fillStyle = "#ffffff"
    ctx.fill()

    ctx.beginPath()
    ctx.arc(W * 0.1, H * 0.8, 150, 0, Math.PI * 2)
    ctx.fillStyle = "#ffffff"
    ctx.fill()
    ctx.globalAlpha = 1

    // Left accent bar
    ctx.fillStyle = "#FF0000"
    ctx.fillRect(0, 0, 12, H)

    // Emoji
    ctx.font = "160px serif"
    ctx.textAlign = "center"
    ctx.fillText(emoji || "??", W * 0.78, H * 0.52)

    // Bold main text
    const cleanText = (boldText || "WATCH NOW").replace(/\*\*/g, "").toUpperCase()
    ctx.textAlign = "left"
    ctx.shadowColor = "rgba(0,0,0,0.8)"
    ctx.shadowBlur = 20

    // Text background
    ctx.globalAlpha = 0.3
    ctx.fillStyle = "#000000"
    ctx.roundRect(40, H * 0.15, W * 0.62, H * 0.55, 20)
    ctx.fill()
    ctx.globalAlpha = 1

    // Main bold text
    const words = cleanText.split(" ")
    let line1 = ""
    let line2 = ""
    words.forEach((word, i) => {
      if (i < Math.ceil(words.length / 2)) line1 += word + " "
      else line2 += word + " "
    })

    ctx.font = "bold 90px Arial Black, Arial"
    ctx.fillStyle = "#FFFFFF"
    ctx.fillText(line1.trim().slice(0,14), 60, H * 0.42)

    ctx.font = "bold 90px Arial Black, Arial"
    ctx.fillStyle = "#FFD700"
    ctx.fillText(line2.trim().slice(0,14), 60, H * 0.58)

    // Subtitle
    const shortTitle = (title || "").slice(0, 45)
    ctx.font = "32px Arial"
    ctx.fillStyle = "rgba(255,255,255,0.8)"
    ctx.shadowBlur = 10
    ctx.fillText(shortTitle, 60, H * 0.75)

    // Channel badge
    ctx.fillStyle = "#FF0000"
    ctx.roundRect(W - 280, H - 70, 260, 50, 10)
    ctx.fill()
    ctx.font = "bold 22px Arial"
    ctx.fillStyle = "#FFFFFF"
    ctx.textAlign = "center"
    ctx.fillText(channelName || "YouTubeAuto.ai", W - 150, H - 38)

    ctx.shadowBlur = 0

  }, [boldText, bgColor, emoji, title, channelName])

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-2xl border border-white/10">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ aspectRatio: "16/9" }}
      />
    </div>
  )
}

function shadeColor(color: string, percent: number) {
  const num = parseInt(color.replace("#", ""), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = ((num >> 8) & 0x00ff) + amt
  const B = (num & 0x0000ff) + amt
  return "#" + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)
}
