import { PARCELA_STATUS, ZONA_KINDS, type Tone } from "../../_utils/tones"
import type { IconName } from "../ui"

// `status` and `kind` are free-form varchars on the API (no DB enum), so a value the
// known maps don't cover is a real possibility, not a bug — fall back to the raw string
// rather than throwing or rendering "undefined". `sin_registrar` is the API's literal
// fallback status for a WorldGuard plot that has no gobierno metadata row yet.
// Pass `sinRegistrarLabel` from the caller (e.g. `t("urbanismo.sinRegistrar")`) when
// rendering inside a translated component.
export const statusOf = (status: string, sinRegistrarLabel = "Sin registrar"): { label: string; tone: Tone } =>
  PARCELA_STATUS[status] ?? { label: status === "sin_registrar" ? sinRegistrarLabel : status, tone: "default" }

export const kindOf = (
  kind: string,
): { label: string; tone: Tone; icon: IconName; desc: string } =>
  ZONA_KINDS[kind] ?? { label: kind, tone: "default", icon: "landmark", desc: "" }

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
