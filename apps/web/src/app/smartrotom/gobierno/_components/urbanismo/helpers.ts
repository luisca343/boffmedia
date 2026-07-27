import { PARCELA_STATUS, ZONA_KINDS, type Tone } from "../../_utils/tones"
import type { IconName } from "../ui"

// `status` and `kind` are free-form varchars on the API (no DB enum), so a value the
// known maps don't cover is a real possibility, not a bug — fall back to the raw string
// rather than throwing or rendering "undefined". `sin_registrar` is the API's literal
// fallback status for a WorldGuard plot that has no gobierno metadata row yet.
// The `gobierno` translator is injected rather than read from a hook: these are plain
// functions, not components.
export const statusOf = (status: string, t: (k: string) => string): { label: string; tone: Tone } => {
  const known = PARCELA_STATUS[status]
  if (known) return { label: t(known.labelKey), tone: known.tone }
  return { label: status === "sin_registrar" ? t("urbanismo.sinRegistrar") : status, tone: "default" }
}

export const kindOf = (
  kind: string,
  t: (k: string) => string,
): { label: string; tone: Tone; icon: IconName; desc: string } => {
  const known = ZONA_KINDS[kind]
  if (known) return { label: t(known.labelKey), tone: known.tone, icon: known.icon, desc: t(known.descKey) }
  return { label: kind, tone: "default", icon: "landmark", desc: "" }
}

export function groupBy<T, K extends string | number>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const k = key(item)
    const bucket = map.get(k)
    if (bucket) bucket.push(item)
    else map.set(k, [item])
  }
  return map
}
