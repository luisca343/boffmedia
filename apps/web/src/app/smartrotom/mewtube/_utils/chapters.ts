export interface Chapter {
  seconds: number
  /** original label e.g. "2:14" */
  time: string
  label: string
}

/**
 * Parse chapter markers from a video description ("0:00 Intro" / "1:02:03 - X").
 * Returns [] when there aren't at least two markers, so the chapter rail hides
 * for videos that don't provide them (derive-or-defer, §13).
 */
export function parseChapters(description?: string): Chapter[] {
  if (!description) return []
  const re = /^\s*[-•*]?\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—)\].:]?\s+(.+?)\s*$/
  const out: Chapter[] = []
  for (const line of description.split("\n")) {
    const m = line.match(re)
    if (!m) continue
    const time = m[1]
    const label = m[2].trim()
    if (!label) continue
    const parts = time.split(":").map(Number)
    const seconds = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1]
    out.push({ seconds, time, label })
  }
  return out.length >= 2 ? out : []
}
