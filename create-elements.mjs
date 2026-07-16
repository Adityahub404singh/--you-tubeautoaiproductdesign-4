// create-elements.mjs
// Run: node create-elements.mjs
// Creates true PNG and SVG elements in public/elements/

import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp"; // PRO LEVEL: Real image processor

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const elemDir   = path.join(__dirname, "public", "elements");
mkdirSync(elemDir, { recursive: true });

const elements = {
  "statue": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <rect x="52" y="10" width="16" height="20" rx="8" fill="#D4B896" opacity="0.85"/>
  <rect x="42" y="28" width="36" height="30" rx="4" fill="#D4B896" opacity="0.85"/>
  <rect x="38" y="56" width="44" height="40" rx="2" fill="#C8A882" opacity="0.85"/>
  <rect x="44" y="95" width="12" height="15" rx="2" fill="#C8A882" opacity="0.85"/>
  <rect x="64" y="95" width="12" height="15" rx="2" fill="#C8A882" opacity="0.85"/>
  <rect x="36" y="108" width="48" height="8" rx="2" fill="#B89468" opacity="0.85"/>
</svg>`,

  "cat": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <polygon points="25,50 40,20 50,50" fill="#888" opacity="0.85"/>
  <polygon points="70,50 80,20 95,50" fill="#888" opacity="0.85"/>
  <ellipse cx="60" cy="65" rx="35" ry="30" fill="#999" opacity="0.85"/>
  <circle cx="60" cy="55" r="22" fill="#AAA" opacity="0.85"/>
  <circle cx="50" cy="50" r="4" fill="#333" opacity="0.9"/>
  <circle cx="70" cy="50" r="4" fill="#333" opacity="0.9"/>
  <ellipse cx="60" cy="58" rx="5" ry="3" fill="#FF8888" opacity="0.8"/>
  <line x1="35" y1="57" x2="55" y2="60" stroke="#555" stroke-width="1.5" opacity="0.7"/>
  <line x1="65" y1="60" x2="85" y2="57" stroke="#555" stroke-width="1.5" opacity="0.7"/>
  <path d="M 60 85 Q 55 95 45 100 Q 60 105 75 100 Q 65 95 60 85" fill="#888" opacity="0.8"/>
</svg>`,

  "clock": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <circle cx="60" cy="62" r="45" fill="none" stroke="#D4B896" stroke-width="6" opacity="0.85"/>
  <circle cx="60" cy="62" r="38" fill="#F5ECD8" opacity="0.6"/>
  <line x1="60" y1="62" x2="60" y2="35" stroke="#8B6914" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
  <line x1="60" y1="62" x2="80" y2="70" stroke="#8B6914" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
  <circle cx="60" cy="62" r="4" fill="#8B6914" opacity="0.9"/>
  <line x1="60" y1="22" x2="60" y2="17" stroke="#D4B896" stroke-width="3" opacity="0.8"/>
  <line x1="60" y1="107" x2="60" y2="102" stroke="#D4B896" stroke-width="3" opacity="0.8"/>
  <line x1="20" y1="62" x2="25" y2="62" stroke="#D4B896" stroke-width="3" opacity="0.8"/>
  <line x1="100" y1="62" x2="95" y2="62" stroke="#D4B896" stroke-width="3" opacity="0.8"/>
</svg>`,

  "money": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <rect x="10" y="35" width="100" height="60" rx="8" fill="#C8A800" opacity="0.8"/>
  <rect x="16" y="41" width="88" height="48" rx="6" fill="#DAB800" opacity="0.7"/>
  <circle cx="60" cy="65" r="18" fill="#C8A800" opacity="0.9"/>
  <circle cx="60" cy="65" r="13" fill="#E8C800" opacity="0.8"/>
  <text x="60" y="70" font-family="Arial" font-size="18" font-weight="bold" text-anchor="middle" fill="#8B6914" opacity="0.9">$</text>
  <rect x="10" y="30" width="100" height="6" rx="3" fill="#B89600" opacity="0.6"/>
</svg>`,

  "coin": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <circle cx="60" cy="60" r="48" fill="#C8A800" opacity="0.85"/>
  <circle cx="60" cy="60" r="42" fill="#DAB800" opacity="0.7"/>
  <circle cx="60" cy="60" r="36" fill="#C8A800" opacity="0.8"/>
  <text x="60" y="68" font-family="Arial Black" font-size="30" font-weight="bold" text-anchor="middle" fill="#8B6914" opacity="0.95">$</text>
</svg>`,

  "heart": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <path d="M60,95 C30,75 10,55 10,35 C10,20 20,12 32,12 C42,12 52,18 60,28 C68,18 78,12 88,12 C100,12 110,20 110,35 C110,55 90,75 60,95 Z" fill="#D4255A" opacity="0.85"/>
  <path d="M60,85 C35,68 18,52 18,35 C18,24 26,18 34,18" fill="none" stroke="#FF6688" stroke-width="3" opacity="0.5"/>
</svg>`,

  "eye": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <path d="M10,60 Q60,15 110,60 Q60,105 10,60 Z" fill="none" stroke="#9933CC" stroke-width="4" opacity="0.85"/>
  <path d="M10,60 Q60,15 110,60 Q60,105 10,60 Z" fill="#EDE4CF" opacity="0.4"/>
  <circle cx="60" cy="60" r="20" fill="#9933CC" opacity="0.8"/>
  <circle cx="60" cy="60" r="12" fill="#220044" opacity="0.9"/>
  <circle cx="53" cy="54" r="4" fill="white" opacity="0.7"/>
</svg>`,

  "brain": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <ellipse cx="45" cy="55" rx="28" ry="32" fill="#E88" opacity="0.8"/>
  <ellipse cx="75" cy="55" rx="28" ry="32" fill="#E88" opacity="0.8"/>
  <rect x="55" y="30" width="10" height="50" rx="5" fill="#D44" opacity="0.6"/>
  <path d="M 30 45 Q 35 38 45 42" fill="none" stroke="#C44" stroke-width="2" opacity="0.7"/>
  <path d="M 28 58 Q 22 55 25 48" fill="none" stroke="#C44" stroke-width="2" opacity="0.7"/>
  <path d="M 90 45 Q 85 38 75 42" fill="none" stroke="#C44" stroke-width="2" opacity="0.7"/>
  <path d="M 92 58 Q 98 55 95 48" fill="none" stroke="#C44" stroke-width="2" opacity="0.7"/>
  <rect x="48" y="78" width="24" height="8" rx="4" fill="#D44" opacity="0.7"/>
</svg>`,

  "phone": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <rect x="35" y="8" width="50" height="88" rx="10" fill="#333" opacity="0.85"/>
  <rect x="39" y="18" width="42" height="68" rx="4" fill="#556" opacity="0.8"/>
  <rect x="50" y="12" width="20" height="3" rx="1.5" fill="#555" opacity="0.7"/>
  <circle cx="60" cy="97" r="4" fill="#555" opacity="0.7"/>
  <rect x="42" y="21" width="36" height="62" rx="3" fill="#7888AA" opacity="0.6"/>
</svg>`,

  "boy": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <circle cx="60" cy="28" r="18" fill="#D4A574" opacity="0.85"/>
  <rect x="44" y="44" width="32" height="38" rx="6" fill="#4466AA" opacity="0.85"/>
  <rect x="36" y="44" width="14" height="30" rx="5" fill="#4466AA" opacity="0.8"/>
  <rect x="70" y="44" width="14" height="30" rx="5" fill="#4466AA" opacity="0.8"/>
  <rect x="46" y="80" width="12" height="28" rx="5" fill="#334" opacity="0.85"/>
  <rect x="62" y="80" width="12" height="28" rx="5" fill="#334" opacity="0.85"/>
</svg>`,

  "girl": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <circle cx="60" cy="28" r="18" fill="#D4A574" opacity="0.85"/>
  <path d="M 38 22 Q 60 5 82 22" fill="#4A2800" opacity="0.8"/>
  <rect x="42" y="44" width="36" height="42" rx="10" fill="#D4255A" opacity="0.85"/>
  <rect x="34" y="44" width="14" height="30" rx="5" fill="#D4255A" opacity="0.8"/>
  <rect x="72" y="44" width="14" height="30" rx="5" fill="#D4255A" opacity="0.8"/>
  <path d="M 42 84 Q 52 108 62 108 Q 72 108 78 84" fill="#334" opacity="0.85"/>
</svg>`,

  "wave": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <path d="M5,60 Q20,40 35,60 Q50,80 65,60 Q80,40 95,60 Q105,72 115,60" fill="none" stroke="#4488FF" stroke-width="5" stroke-linecap="round" opacity="0.8"/>
  <path d="M5,75 Q20,55 35,75 Q50,95 65,75 Q80,55 95,75 Q105,87 115,75" fill="none" stroke="#4488FF" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
  <path d="M5,45 Q20,25 35,45 Q50,65 65,45 Q80,25 95,45 Q105,57 115,45" fill="none" stroke="#4488FF" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
</svg>`,

  "people": `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="none"/>
  <circle cx="35" cy="30" r="13" fill="#D4A574" opacity="0.8"/>
  <rect x="22" y="42" width="26" height="30" rx="5" fill="#667" opacity="0.8"/>
  <rect x="22" y="70" width="10" height="24" rx="4" fill="#445" opacity="0.8"/>
  <rect x="36" y="70" width="10" height="24" rx="4" fill="#445" opacity="0.8"/>
  <circle cx="85" cy="30" r="13" fill="#D4A574" opacity="0.8"/>
  <rect x="72" y="42" width="26" height="30" rx="5" fill="#D4255A" opacity="0.8"/>
  <rect x="72" y="70" width="10" height="24" rx="4" fill="#334" opacity="0.8"/>
  <rect x="86" y="70" width="10" height="24" rx="4" fill="#334" opacity="0.8"/>
  <circle cx="60" cy="22" r="13" fill="#C49060" opacity="0.8"/>
  <rect x="47" y="34" width="26" height="30" rx="5" fill="#446688" opacity="0.8"/>
</svg>`,
};

async function generateElements() {
  let count = 0;
  for (const [filename, svgContent] of Object.entries(elements)) {
    const svgPath = path.join(elemDir, `${filename}.svg`);
    const pngPath = path.join(elemDir, `${filename}.png`);
    
    try {
      // 1. Keep the original SVG as a valid vector file
      writeFileSync(svgPath, svgContent, "utf8");
      
      // 2. PRO LEVEL: Convert SVG to True Binary PNG using Sharp
      // This saves FFmpeg from rendering vectors on the fly!
      await sharp(Buffer.from(svgContent))
        .png()
        .toFile(pngPath);
        
      count++;
      console.log(`✅ Created true PNG & SVG: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to create ${filename}:`, error);
    }
  }

  console.log(`\n🎉 Done! ${count} elements created properly in public/elements/`);
  console.log("Path: " + elemDir);
}

generateElements();