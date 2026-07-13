import { USER_ROLES, GOBIERNO_RANKS } from "@boffmedia/shared/roles"
import type { Tone } from "../../_utils/tones"

// There is no officers table — GOBIERNO (base access) plus the three GOB_* ranks ARE the
// roster (SMARTROTOM_V3 domain note). Labels come from the authoritative roles module rather
// than being invented here; only the tone-per-rank mapping is a local presentation choice.

export const RANK_OPTIONS: { value: string; label: string }[] = [
  { value: USER_ROLES.GOBIERNO, label: "Funcionario" },
  ...GOBIERNO_RANKS.map((r) => ({ value: r.role as string, label: r.label })),
]

const RANK_LABEL: Record<string, string> = Object.fromEntries(RANK_OPTIONS.map((o) => [o.value, o.label]))

const RANK_TONE: Record<string, Tone> = {
  GOB_ALCALDE: "gold",
  GOB_INSPECTOR: "seguridad",
  GOB_AGENTE: "info",
}

// Highest first — used to sort the roster. Anything unrecognised sorts last.
const RANK_ORDER: Record<string, number> = {
  GOB_ALCALDE: 3,
  GOB_INSPECTOR: 2,
  GOB_AGENTE: 1,
  GOBIERNO: 0,
}

// An officer with no GOB_* rank holds only the base GOBIERNO role, so they read as "Funcionario".
export function rankMeta(role: string | null | undefined): { label: string; tone: Tone } {
  const key = role ?? USER_ROLES.GOBIERNO
  return { label: RANK_LABEL[key] ?? key, tone: RANK_TONE[key] ?? "default" }
}

export function rankOrder(role: string | null | undefined): number {
  return RANK_ORDER[role ?? USER_ROLES.GOBIERNO] ?? -1
}
