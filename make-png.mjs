// make-png.mjs - Creates real PNG files using pure Node.js (no dependencies)
import { writeFileSync, mkdirSync } from "fs"
import { createDeflate } from "zlib"
import { promisify } from "util"
import path from "path"
import { fileURLToPath } from "url"
import zlib from "zlib"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function uint32BE(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n, 0)
  return b
}

function pngChunk(name, data) {
  const nameBuf = Buffer.from(name)
  const crc = zlib.crc32(Buffer.concat([nameBuf, data]))
  return Buffer.concat([uint32BE(data.length), nameBuf, data, uint32BE(crc)])
}

function makePNG(w, h, r, g, b) {
  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8]  = 8   // bit depth
  ihdr[9]  = 2   // color type: RGB
  ihdr[10] = 0   // compression
  ihdr[11] = 0   // filter
  ihdr[12] = 0   // interlace

  // Image data: each row = filter byte (0) + RGB pixels
  const rowSize = 1 + w * 3
  const raw = Buffer.alloc(rowSize * h)
  for (let row = 0; row < h; row++) {
    const rowStart = row * rowSize
    raw[rowStart] = 0  // filter byte
    for (let col = 0; col < w; col++) {
      const px = rowStart + 1 + col * 3
      raw[px]     = r
      raw[px + 1] = g
      raw[px + 2] = b
    }
  }

  const compressed = zlib.deflateSync(raw)

  const sig  = Buffer.from([137,80,78,71,13,10,26,10])
  const ihdrChunk = pngChunk("IHDR", ihdr)
  const idatChunk = pngChunk("IDAT", compressed)
  const iendChunk = pngChunk("IEND", Buffer.alloc(0))

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk])
}

// Element colors (simple solid colored squares — real PNG format)
const ELEMENTS = {
  "statue.png":  [210, 190, 150],
  "cat.png":     [160, 155, 165],
  "clock.png":   [190, 165, 110],
  "money.png":   [100, 170,  60],
  "coin.png":    [210, 175,  40],
  "heart.png":   [210,  55,  85],
  "eye.png":     [110,  60, 190],
  "brain.png":   [210, 105, 105],
  "phone.png":   [ 70,  75, 100],
  "boy.png":     [155, 125,  95],
  "girl.png":    [210,  85, 130],
  "wave.png":    [ 55, 110, 210],
  "people.png":  [105, 125, 155],
}

const dirs = [
  path.join(__dirname, "public", "elements"),
  path.join(__dirname, "public", "characters"),
]

for (const d of dirs) {
  mkdirSync(d, { recursive: true })
}

let count = 0
for (const [name, [r, g, b]] of Object.entries(ELEMENTS)) {
  const png = makePNG(120, 120, r, g, b)
  for (const d of dirs) {
    writeFileSync(path.join(d, name), png)
  }
  console.log(`Created: ${name} (${png.length} bytes)`)
  count++
}

console.log(`\nDone! ${count} PNG files created`)
console.log("Dirs:", dirs.join(", "))
