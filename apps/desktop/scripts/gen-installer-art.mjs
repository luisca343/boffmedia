// Genera el arte del instalador de Windows a partir de src-tauri/icons/icon.png.
//
// WiX y NSIS solo aceptan BMP (24 bits, sin canal alfa) y exigen dimensiones
// exactas: si no coinciden, el instalador se compila igual y muestra la imagen
// recortada o directamente ignorada, sin ningún aviso.
//
//   pnpm --filter launcher gen:installer-art
import { Buffer } from "node:buffer"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const logo = path.join(root, "src-tauri/icons/icon.png")
const outDir = path.join(root, "src-tauri/installer")

/** BMP de 24 bits, filas de abajo arriba y con padding a múltiplo de 4. */
function encodeBmp24({ data, width, height }) {
  const stride = (width * 3 + 3) & ~3
  const pixels = Buffer.alloc(stride * height)
  for (let y = 0; y < height; y++) {
    const row = (height - 1 - y) * stride
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 3
      const dst = row + x * 3
      pixels[dst] = data[src + 2]
      pixels[dst + 1] = data[src + 1]
      pixels[dst + 2] = data[src]
    }
  }
  const header = Buffer.alloc(54)
  header.write("BM", 0, "ascii")
  header.writeUInt32LE(54 + pixels.length, 2)
  header.writeUInt32LE(54, 10)
  header.writeUInt32LE(40, 14)
  header.writeInt32LE(width, 18)
  header.writeInt32LE(height, 22)
  header.writeUInt16LE(1, 26)
  header.writeUInt16LE(24, 28)
  header.writeUInt32LE(pixels.length, 34)
  header.writeInt32LE(2835, 38)
  header.writeInt32LE(2835, 42)
  return Buffer.concat([header, pixels])
}

// Banda grafito con el destello naranja de la marca. Ambos instaladores pintan
// SU PROPIO texto en negro encima de estas imágenes, así que la banda oscura
// solo puede cubrir la zona sin texto: el resto se queda blanco o el título
// del asistente es ilegible.
function backdrop(width, height, band) {
  const w = band?.width ?? width
  const x = band?.left ?? 0
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#141418"/>
        <stop offset="1" stop-color="#08080a"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.62">
        <stop offset="0" stop-color="#ff5a1f" stop-opacity="0.34"/>
        <stop offset="0.55" stop-color="#ff8a1f" stop-opacity="0.08"/>
        <stop offset="1" stop-color="#ff8a1f" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#ffffff"/>
    <g transform="translate(${x} 0)">
      <rect width="${w}" height="${height}" fill="url(#g)"/>
      <rect width="${w}" height="${height}" fill="url(#glow)"/>
      <rect x="${w - 2}" width="2" height="${height}" fill="#ff5a1f" opacity="0.6"/>
    </g>
  </svg>`)
}

// Solo NSIS: el .msi ya no se genera.
const targets = [
  // La cabecera es una tira de 150x57 pegada arriba a la derecha, con el
  // título de la página a su izquierda.
  { file: "nsis-header.bmp", width: 150, height: 57, logo: 38, left: 97, band: { left: 82, width: 68 } },
  // El sidebar es el panel completo de las páginas de bienvenida y final. No
  // lleva texto encima, así que va oscuro entero.
  { file: "nsis-sidebar.bmp", width: 164, height: 314, logo: 104, left: 30 },
]

await mkdir(outDir, { recursive: true })

for (const t of targets) {
  const badge = await sharp(logo).resize(t.logo, t.logo, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer()
  const { data, info } = await sharp(backdrop(t.width, t.height, t.band))
    .composite([{ input: badge, left: t.left, top: Math.round((t.height - t.logo) / 2) }])
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  await writeFile(path.join(outDir, t.file), encodeBmp24({ data, width: info.width, height: info.height }))
  console.log(`${t.file}  ${t.width}x${t.height}`)
}
