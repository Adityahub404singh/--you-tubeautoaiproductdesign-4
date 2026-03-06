"use client";

import { useEffect, useRef } from "react";

interface ThumbnailPreviewProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

export default function ThumbnailPreview({
  title = "Your Title Here",
  subtitle = "Amazing Content",
  imageUrl,
}: ThumbnailPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;   // 1280
    const H = canvas.height;  // 720

    // ─── 1. Background ───────────────────────────────────────────
    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, 0, W, H);

    // ─── 2. Background image (if provided) ───────────────────────
    const drawOverlays = () => {
      // ─── 3. Dark gradient overlay (left side) ──────────────────
      const grad = ctx.createLinearGradient(0, 0, W * 0.75, 0);
      grad.addColorStop(0, "rgba(0,0,0,0.92)");
      grad.addColorStop(0.6, "rgba(0,0,0,0.55)");
      grad.addColorStop(1, "rgba(0,0,0,0.0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // ─── 4. Red accent bar (left edge) ─────────────────────────
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(0, 0, 14, H);

      // ─── 5. Red highlight box behind text ──────────────────────
      const boxX = 40;
      const boxY = H * 0.18;
      const boxW = W * 0.58;
      const boxH = H * 0.58;
      const radius = 18;

      ctx.fillStyle = "rgba(255, 0, 0, 0.18)";
      ctx.beginPath();
      ctx.moveTo(boxX + radius, boxY);
      ctx.lineTo(boxX + boxW - radius, boxY);
      ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
      ctx.lineTo(boxX + boxW, boxY + boxH - radius);
      ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - radius, boxY + boxH);
      ctx.lineTo(boxX + radius, boxY + boxH);
      ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - radius);
      ctx.lineTo(boxX, boxY + radius);
      ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
      ctx.closePath();
      ctx.fill();

      // ─── 6. "VIRAL" badge ──────────────────────────────────────
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.roundRect(boxX + 8, boxY + 14, 110, 38, 8);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px Arial Black, Arial";
      ctx.textAlign = "left";
      ctx.fillText("▶ VIRAL", boxX + 18, boxY + 40);

      // ─── 7. Main TITLE text ────────────────────────────────────
      // Word-wrap helper
      const wrapText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number,
        fontSize: number
      ) => {
        ctx.font = `bold ${fontSize}px Arial Black, Arial`;
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "rgba(0,0,0,0.9)";
        ctx.shadowBlur = 10;
        ctx.textAlign = "left";

        const words = text.split(" ");
        let line = "";
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line.trim(), x, currentY);
            line = words[i] + " ";
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), x, currentY);
        ctx.shadowBlur = 0;
        return currentY;
      };

      const titleY = wrapText(
        title.toUpperCase(),
        boxX + 20,
        boxY + 90,
        boxW - 40,
        72,
        62
      );

      // ─── 8. Divider line ───────────────────────────────────────
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(boxX + 20, titleY + 22);
      ctx.lineTo(boxX + boxW - 40, titleY + 22);
      ctx.stroke();

      // ─── 9. Subtitle text ──────────────────────────────────────
      ctx.font = "500 26px Arial, sans-serif";
      ctx.fillStyle = "#DDDDDD";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 8;
      ctx.textAlign = "left";

      // Truncate subtitle if too long
      const maxSubW = boxW - 40;
      let sub = subtitle;
      while (ctx.measureText(sub).width > maxSubW && sub.length > 0) {
        sub = sub.slice(0, -1);
      }
      if (sub !== subtitle) sub += "…";
      ctx.fillText(sub, boxX + 20, titleY + 62);
      ctx.shadowBlur = 0;

      // ─── 10. YouTube logo watermark ────────────────────────────
      ctx.fillStyle = "#FF0000";
      ctx.beginPath();
      ctx.roundRect(W - 160, H - 58, 130, 40, 8);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px Arial Black, Arial";
      ctx.textAlign = "center";
      ctx.fillText("▶ YouTube", W - 95, H - 30);
    };

    if (imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Cover-fit the image on right half
        const srcRatio = img.width / img.height;
        const destW = W * 0.65;
        const destH = H;
        const destX = W - destW;
        const destY = 0;

        ctx.save();
        ctx.drawImage(img, destX, destY, destW, destH);
        ctx.restore();
        drawOverlays();
      };
      img.onerror = drawOverlays;
      img.src = imageUrl;
    } else {
      // Placeholder gradient on right side
      const rightGrad = ctx.createLinearGradient(W * 0.4, 0, W, H);
      rightGrad.addColorStop(0, "#1a1a2e");
      rightGrad.addColorStop(1, "#16213e");
      ctx.fillStyle = rightGrad;
      ctx.fillRect(W * 0.4, 0, W * 0.6, H);
      drawOverlays();
    }
  }, [title, subtitle, imageUrl]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-400 font-medium">📸 Thumbnail Preview</p>
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        style={{
          width: "100%",
          maxWidth: "640px",
          borderRadius: "12px",
          border: "2px solid #FF0000",
          boxShadow: "0 0 24px rgba(255,0,0,0.3)",
        }}
      />
    </div>
  );
}
