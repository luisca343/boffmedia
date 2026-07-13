import type { PasaporteProfileEntity } from "@boffmedia/shared"

const LINE = 44

function strip(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
}

/** ICAO fills every gap with a chevron; a name field carries letters and nothing else. */
function az(value: string | null | undefined): string {
  return strip(value).replace(/[^A-Z]/g, "<")
}

function alnum(value: string | null | undefined): string {
  return strip(value).replace(/[^A-Z0-9]/g, "<")
}

function pad(line: string): string {
  return line.length >= LINE ? line.slice(0, LINE) : line + "<".repeat(LINE - line.length)
}

/**
 * The machine-readable zone, in the ICAO shape: two fixed 44-character lines.
 *
 * Every field is real — the trainer's name, their region, the id the API derived from their
 * uuid, the year they arrived, their badge count and their completion. Nothing is padded
 * with invented data; the chevrons are the padding, which is exactly what they are for.
 */
export function mrz(profile: PasaporteProfileEntity, completionPct: number): string[] {
  const region = az(profile.region).slice(0, 3) || "TRS"
  const year = new Date(profile.memberSince ?? profile.createdAt ?? Date.now()).getFullYear()
  const issued = Number.isFinite(year) ? String(year) : "0000"
  const rank = String(Math.max(0, Math.round(profile.rank))).padStart(2, "0")
  const pct = String(Math.max(0, Math.min(100, Math.round(completionPct)))).padStart(3, "0")

  const top = pad(`P<TRS${region}${az(profile.username)}<<${az(profile.region)}`)
  const bottom = pad(`${alnum(profile.trainerId)}<${region}${issued}M<<<RANK${rank}<<<COMP${pct}`)

  return [top, bottom]
}
