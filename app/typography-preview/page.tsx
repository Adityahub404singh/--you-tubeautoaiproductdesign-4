"use client"
import { AnimatePresence, motion } from "framer-motion"
import { useState, useEffect, useRef } from "react"

// Shin-chan Diving sticker
function StickerDiving({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 60 66" style={{ transform: "rotate(175deg) scaleX(-1)" }}>
      <path d="M15 22 Q5 38 12 50 Q30 58 48 50 Q55 38 45 22 Z" fill="#E53935" />
      <rect x="18" y="26" width="24" height="18" rx="2" fill="white" />
      <rect x="18" y="40" width="24" height="3" fill="#FDD835" />
      <ellipse cx="8" cy="32" rx="8" ry="4" fill="#FFCC80" transform="rotate(20 8 32)" />
      <ellipse cx="52" cy="32" rx="8" ry="4" fill="#FFCC80" transform="rotate(-20 52 32)" />
      <circle cx="3" cy="29" r="4" fill="#FFCC80" />
      <circle cx="57" cy="29" r="4" fill="#FFCC80" />
      <circle cx="30" cy="16" r="15" fill="#FFCC80" />
      <ellipse cx="30" cy="5" rx="15" ry="8" fill="#1a1a1a" />
      <rect x="20" y="13" width="10" height="3" rx="1.5" fill="#1a1a1a" />
      <rect x="30" y="13" width="10" height="3" rx="1.5" fill="#1a1a1a" />
      <circle cx="25" cy="18" r="2.5" fill="#1a1a1a" />
      <circle cx="35" cy="18" r="2.5" fill="#1a1a1a" />
      <circle cx="26" cy="17" r="1" fill="white" />
      <circle cx="36" cy="17" r="1" fill="white" />
      <ellipse cx="30" cy="20" rx="2.5" ry="2" fill="#E8A87C" />
      <path d="M23 24 Q30 30 37 24" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="19" cy="21" rx="4" ry="2.5" fill="#FF8A80" opacity="0.6" />
      <ellipse cx="41" cy="21" rx="4" ry="2.5" fill="#FF8A80" opacity="0.6" />
      <rect x="24" y="50" width="6" height="14" rx="3" fill="#FFF176" />
      <rect x="30" y="50" width="6" height="14" rx="3" fill="#FFF176" />
      <ellipse cx="27" cy="63" rx="5" ry="3" fill="#1a1a1a" />
      <ellipse cx="33" cy="63" rx="5" ry="3" fill="#1a1a1a" />
    </svg>
  )
}

function StickerRunning({ size = 52, flipX }: { size?: number; flipX?: boolean }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 60 72" style={{ transform: flipX ? "scaleX(-1)" : undefined }}>
      <rect x="18" y="30" width="24" height="20" rx="3" fill="#E53935" />
      <rect x="22" y="30" width="16" height="6" rx="2" fill="white" />
      <ellipse cx="13" cy="36" rx="5" ry="9" fill="#FFCC80" transform="rotate(30 13 36)" />
      <ellipse cx="47" cy="38" rx="5" ry="9" fill="#FFCC80" transform="rotate(-25 47 38)" />
      <rect x="18" y="46" width="11" height="16" rx="3" fill="#FDD835" />
      <rect x="31" y="46" width="11" height="16" rx="3" fill="#FDD835" />
      <ellipse cx="20" cy="63" rx="4" ry="9" fill="#FFCC80" transform="rotate(-20 20 63)" />
      <ellipse cx="42" cy="62" rx="4" ry="9" fill="#FFCC80" transform="rotate(15 42 62)" />
      <ellipse cx="17" cy="70" rx="6" ry="3" fill="#1a1a1a" />
      <ellipse cx="45" cy="68" rx="6" ry="3" fill="#1a1a1a" />
      <circle cx="30" cy="18" r="16" fill="#FFCC80" />
      <ellipse cx="30" cy="6" rx="16" ry="9" fill="#1a1a1a" />
      <rect x="19" y="15" width="10" height="3" rx="1.5" fill="#1a1a1a" />
      <rect x="31" y="15" width="10" height="3" rx="1.5" fill="#1a1a1a" />
      <circle cx="24" cy="20" r="2.5" fill="#1a1a1a" />
      <circle cx="36" cy="20" r="2.5" fill="#1a1a1a" />
      <circle cx="25" cy="19" r="1" fill="white" />
      <circle cx="37" cy="19" r="1" fill="white" />
      <ellipse cx="30" cy="22" rx="2.5" ry="2" fill="#E8A87C" />
      <path d="M24 27 Q30 34 36 27" stroke="#1a1a1a" strokeWidth="2" fill="#FF8A80" strokeLinecap="round" />
      <ellipse cx="30" cy="30" rx="3" ry="2" fill="#EF5350" />
      <ellipse cx="18" cy="23" rx="4" ry="2.5" fill="#FF8A80" opacity="0.6" />
      <ellipse cx="42" cy="23" rx="4" ry="2.5" fill="#FF8A80" opacity="0.6" />
    </svg>
  )
}

function FloatSticker({ children, x, y, delay = 0, floatY = 10, duration = 3.5 }: {
  children: React.ReactNode; x: string; y: string; delay?: number; floatY?: number; duration?: number
}) {
  return (
    <motion.div
      style={{ position: "absolute", left: x, top: y, zIndex: 10, pointerEvents: "none" }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1, y: [0, -floatY, 0, floatY * 0.5, 0] }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        y: { duration, repeat: Infinity, ease: "easeInOut", delay: delay + 0.3 },
      }}
    >
      {children}
    </motion.div>
  )
}

function BokehSpot({ cx, cy, r, opacity, delay }: { cx: string; cy: string; r: number; opacity: number; delay: number }) {
  return (
    <motion.div
      style={{
        position: "absolute", left: cx, top: cy, width: r * 2, height: r * 2,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,240,200,0.9) 0%, rgba(230,210,170,0.3) 50%, transparent 70%)",
        transform: "translate(-50%, -50%)",
        filter: `blur(${r * 0.4}px)`,
        pointerEvents: "none",
      }}
      animate={{ opacity: [opacity * 0.6, opacity, opacity * 0.7, opacity], scale: [1, 1.08, 0.96, 1] }}
      transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    />
  )
}

const SCENES = [
  {
    line1: { text: "Paise", font: "cursive", color: "#D4255A", size: "clamp(28px,5.5vw,60px)" },
    line2: { text: "sabko chahiye", font: "sans-serif", color: "#1a1a1a", size: "clamp(22px,4.5vw,48px)" },
    sticker1: { x: "72%", y: "4%", type: "diving" },
    sticker2: { x: "62%", y: "72%", type: "running" },
    accent: "#D4255A",
  },
  {
    line1: { text: "par sukoon", font: "cursive", color: "#D4255A", size: "clamp(28px,5.5vw,60px)" },
    line2: { text: "nahi milta", font: "sans-serif", color: "#1a1a1a", size: "clamp(22px,4.5vw,48px)" },
    sticker1: { x: "73%", y: "3%", type: "diving" },
    sticker2: { x: "30%", y: "72%", type: "running" },
    accent: "#2563EB",
  },
  {
    line1: { text: "log badal", font: "cursive", color: "#D4255A", size: "clamp(28px,5.5vw,60px)" },
    line2: { text: "jaate hain", font: "sans-serif", color: "#1a1a1a", size: "clamp(22px,4.5vw,48px)" },
    sticker1: { x: "68%", y: "5%", type: "running" },
    sticker2: { x: "75%", y: "68%", type: "diving" },
    accent: "#7C3AED",
  },
  {
    line1: { text: "jab sach", font: "cursive", color: "#D4255A", size: "clamp(28px,5.5vw,60px)" },
    line2: { text: "samajh aata hai", font: "sans-serif", color: "#1a1a1a", size: "clamp(22px,4.5vw,48px)" },
    sticker1: { x: "70%", y: "4%", type: "diving" },
    sticker2: { x: "65%", y: "70%", type: "running" },
    accent: "#059669",
  },
  {
    line1: { text: "tab tak", font: "cursive", color: "#D4255A", size: "clamp(28px,5.5vw,60px)" },
    line2: { text: "der ho chuki hoti hai", font: "sans-serif", color: "#1a1a1a", size: "clamp(20px,4vw,44px)" },
    sticker1: { x: "71%", y: "3%", type: "running" },
    sticker2: { x: "60%", y: "73%", type: "diving" },
    accent: "#DC2626",
  },
]

function Scene({ scene, idx }: { scene: typeof SCENES[0]; idx: number }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200)
    const t2 = setTimeout(() => setPhase(2), 800)
    const t3 = setTimeout(() => setPhase(3), 1500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(6px)", scale: 1.03 }}
      transition={{ duration: 0.5 }}
    >
      {/* Accent line top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: scene.accent, zIndex: 20,
      }} />

      {/* Stickers */}
      <FloatSticker x={scene.sticker1.x} y={scene.sticker1.y} delay={0.4} floatY={12} duration={3.2}>
        {scene.sticker1.type === "diving" ? <StickerDiving size={56} /> : <StickerRunning size={52} />}
      </FloatSticker>
      <FloatSticker x={scene.sticker2.x} y={scene.sticker2.y} delay={0.9} floatY={8} duration={4}>
        {scene.sticker2.type === "running" ? <StickerRunning size={52} flipX /> : <StickerDiving size={50} />}
      </FloatSticker>

      {/* Text block */}
      <div style={{
        position: "absolute", left: "50%", top: "20%",
        width: "45%", height: "60%",
        display: "flex", flexDirection: "column",
        alignItems: "flex-start", justifyContent: "center",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ lineHeight: 1.05, marginBottom: 6 }}
        >
          <span style={{
            fontFamily: scene.line1.font === "cursive" ? "'Dancing Script', 'Georgia', cursive" : "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: scene.line1.size,
            color: scene.line1.color,
            letterSpacing: "0.01em",
          }}>
            {scene.line1.text}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ lineHeight: 1.1 }}
        >
          <span style={{
            fontFamily: "'Inter', 'Arial', sans-serif",
            fontWeight: 800,
            fontSize: scene.line2.size,
            color: scene.line2.color,
            letterSpacing: "-0.03em",
          }}>
            {scene.line2.text}
          </span>
        </motion.div>

        {/* Scene number */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 0.4 } : { opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ marginTop: 16, fontSize: 12, color: "#888", fontFamily: "monospace" }}
        >
          {idx + 1} / {SCENES.length}
        </motion.div>
      </div>

      {/* Bottom accent bar */}
      <motion.div
        style={{ position: "absolute", bottom: 0, left: 0, height: 4, background: scene.accent }}
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 5.5, ease: "linear" }}
      />
    </motion.div>
  )
}

export default function TypographyPreview() {
  const DURATIONS = [5500, 5500, 5500, 5500, 6000]
  const [current, setCurrent] = useState(0)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    if (ended) return
    const timer = setTimeout(() => {
      if (current >= SCENES.length - 1) {
        setEnded(true)
        setTimeout(() => { setCurrent(0); setEnded(false) }, 1500)
      } else {
        setCurrent(c => c + 1)
      }
    }, DURATIONS[current])
    return () => clearTimeout(timer)
  }, [current, ended])

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a" }}>
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Inter:wght@400;700;800&display=swap" rel="stylesheet" />
      <div style={{
        position: "relative", overflow: "hidden",
        aspectRatio: "16/9", width: "100%",
        maxWidth: "calc(100vh * 16 / 9)", height: "auto", maxHeight: "100%",
        background: "#EDE4CF",
      }}>
        {/* Warm beige base */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 120% 100% at 50% 50%, #F5ECD7 0%, #EDE4CF 55%, #D9C9A8 100%)",
        }} />

        {/* Bokeh */}
        <BokehSpot cx="15%" cy="25%" r={80} opacity={0.55} delay={0} />
        <BokehSpot cx="80%" cy="65%" r={100} opacity={0.45} delay={1.5} />
        <BokehSpot cx="55%" cy="20%" r={70} opacity={0.4} delay={0.8} />
        <BokehSpot cx="30%" cy="75%" r={90} opacity={0.5} delay={2.2} />
        <BokehSpot cx="70%" cy="30%" r={60} opacity={0.35} delay={3.1} />

        {/* Paper texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }} />

        {/* Scenes */}
        <AnimatePresence mode="popLayout">
          <Scene key={current} scene={SCENES[current]} idx={current} />
        </AnimatePresence>
      </div>
    </div>
  )
}
