/**
 * Renders Minecraft §-formatted text as coloured spans. The 16 §-codes are data, not a
 * fixed design-system palette, so they are the one place in Administración that is
 * allowed to paint with raw hex via inline `style` (SMARTROTOM_V3 hard rule #2) — darkened
 * from the game's bright palette so it stays legible on warm paper.
 */
const MC_COLORS: Record<string, string> = {
  "0": "#1a1a1a",
  "1": "#1f2f8a",
  "2": "#1f6f1f",
  "3": "#0e7c84",
  "4": "#a01818",
  "5": "#8a1e8a",
  "6": "#b07400",
  "7": "#7a7259",
  "8": "#4c4430",
  "9": "#3b4fd6",
  a: "#2f9e2f",
  b: "#168a90",
  c: "#cf3a3a",
  d: "#bf3abf",
  e: "#a8841e",
  f: "#2a2517",
}

export const MC_SWATCHES: [string, string][] = [
  ["0", "Negro"],
  ["1", "Azul osc."],
  ["2", "Verde osc."],
  ["3", "Cian osc."],
  ["4", "Rojo osc."],
  ["5", "Púrpura"],
  ["6", "Dorado"],
  ["7", "Gris"],
  ["8", "Gris osc."],
  ["9", "Azul"],
  ["a", "Lima"],
  ["b", "Cian"],
  ["c", "Rojo"],
  ["d", "Rosa"],
  ["e", "Amarillo"],
  ["f", "Blanco"],
]

export const MC_STYLE_CODES: [string, string][] = [
  ["l", "Negrita"],
  ["o", "Cursiva"],
  ["n", "Subray."],
  ["m", "Tachado"],
  ["r", "Reset"],
]

type Segment = {
  text: string
  color: string
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
}

// The un-coloured/§r base state is our own ink token, not a Minecraft colour — expressed
// as the real CSS custom property rather than a hardcoded hex duplicate of gt-ink-800.
const BASE_COLOR = "rgb(var(--gt-ink-800))"

function parse(format: string): Segment[] {
  const out: Segment[] = []
  let cur: Omit<Segment, "text"> = { color: BASE_COLOR, bold: false, italic: false, underline: false, strike: false }
  let buf = ""
  const flush = () => {
    if (buf) out.push({ ...cur, text: buf })
    buf = ""
  }
  for (let i = 0; i < format.length; i++) {
    if (format[i] === "§" && i + 1 < format.length) {
      const c = format[++i].toLowerCase()
      flush()
      if (MC_COLORS[c]) cur = { ...cur, color: MC_COLORS[c] }
      else if (c === "l") cur = { ...cur, bold: true }
      else if (c === "o") cur = { ...cur, italic: true }
      else if (c === "n") cur = { ...cur, underline: true }
      else if (c === "m") cur = { ...cur, strike: true }
      else if (c === "r") cur = { color: BASE_COLOR, bold: false, italic: false, underline: false, strike: false }
    } else {
      buf += format[i]
    }
  }
  flush()
  return out
}

export function MCText({ format, fallback = "Vista previa" }: { format: string | undefined; fallback?: string }) {
  if (!format) return <span className="text-gt-ink-300">{fallback}</span>
  return (
    <span className="font-gt-mono">
      {parse(format).map((seg, i) => (
        <span
          key={i}
          style={{
            color: seg.color,
            fontWeight: seg.bold ? 700 : 400,
            fontStyle: seg.italic ? "italic" : "normal",
            textDecoration: [seg.underline && "underline", seg.strike && "line-through"].filter(Boolean).join(" ") || "none",
          }}
        >
          {seg.text}
        </span>
      ))}
    </span>
  )
}
