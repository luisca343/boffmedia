/**
 * The words the scene prints on the field ("¡CRÍTICO!", "¡Falló!", a status
 * name over a plate). The engine is not React and cannot call `useToolT`, so
 * the canvas resolves these through the catalog once per mount/locale and
 * hands them over here. Defaults are Spanish — the catalog's source of truth —
 * so a popup fired before the canvas registered still reads correctly.
 */

export interface FxLabels {
  crit: string
  miss: string
  super: string
  resisted: string
  immune: string
  tera: (type: string) => string
  mega: string
  primal: string
  burst: string
  zmove: string
  zbroken: string
  cured: string
  /** Short status tag: brn → "QUE". */
  status: (id: string) => string
  /** Short stat name for boost arrows: atk → "Atq". */
  stat: (id: string) => string
  /** Weather / terrain / room / side condition label by id, `null` when unknown. */
  cond: (id: string) => string | null
}

const STATUS_ES: Record<string, string> = { brn: "QUE", par: "PAR", psn: "ENV", tox: "TOX", slp: "DOR", frz: "CON", fnt: "KO" }
const STAT_ES: Record<string, string> = { atk: "Atq", def: "Def", spa: "AtE", spd: "DfE", spe: "Vel", accuracy: "Prec", evasion: "Evas" }

let labels: FxLabels = {
  crit: "¡CRÍTICO!",
  miss: "¡Falló!",
  super: "¡Supereficaz!",
  resisted: "Poco eficaz…",
  immune: "No afecta",
  tera: (type) => `¡Tera ${type}!`,
  mega: "¡Megaevolución!",
  primal: "¡Regresión primigenia!",
  burst: "¡Ultraexplosión!",
  zmove: "¡Movimiento Z!",
  zbroken: "¡Protección rota!",
  cured: "Curado",
  status: (id) => STATUS_ES[id] || id.toUpperCase(),
  stat: (id) => STAT_ES[id] || id,
  cond: () => null,
}

export function setFxLabels(next: Partial<FxLabels>) {
  labels = { ...labels, ...next }
}

export function fxLabels(): FxLabels {
  return labels
}
