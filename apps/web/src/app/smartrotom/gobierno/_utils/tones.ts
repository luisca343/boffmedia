// Every tone is a set of LITERAL class strings. Tailwind's JIT only ever sees literal
// strings, so a name built at runtime (`bg-gt-${tone}`) compiles to nothing at all —
// no error, no warning, just a missing style. Full maps are the fix (SMARTROTOM_V3 §4).
//
// `css` is the same colour as a raw `rgb(var(…))` value, for the handful of places that
// need it as a data-driven inline value: the department spine's `--gt-dep`, an SVG fill,
// a chart series.

export type Tone =
  | "default"
  | "accent"
  | "civic"
  | "gold"
  | "ok"
  | "warn"
  | "danger"
  | "info"
  | "urbanismo"
  | "seguridad"
  | "hacienda"
  | "justicia"
  | "poblacion"

type ToneStyle = {
  text: string
  softBg: string
  softBorder: string
  solidBg: string
  solidBorder: string
  dot: string
  border: string
  css: string
}

export const TONES: Record<Tone, ToneStyle> = {
  default: {
    text: "text-gt-ink-500",
    softBg: "bg-gt-ink-500/10",
    softBorder: "border-gt-ink-500/30",
    solidBg: "bg-gt-ink-500",
    solidBorder: "border-gt-ink-500",
    dot: "bg-gt-ink-500",
    border: "border-gt-ink-500",
    css: "rgb(var(--gt-ink-500))",
  },
  accent: {
    text: "text-gt-accent",
    softBg: "bg-gt-accent/12",
    softBorder: "border-gt-accent/35",
    solidBg: "bg-gt-accent",
    solidBorder: "border-gt-accent",
    dot: "bg-gt-accent",
    border: "border-gt-accent",
    css: "rgb(var(--gt-accent))",
  },
  civic: {
    text: "text-gt-civic",
    softBg: "bg-gt-civic/12",
    softBorder: "border-gt-civic/35",
    solidBg: "bg-gt-civic",
    solidBorder: "border-gt-civic",
    dot: "bg-gt-civic",
    border: "border-gt-civic",
    css: "rgb(var(--gt-civic))",
  },
  gold: {
    text: "text-gt-gold-600",
    softBg: "bg-gt-gold/12",
    softBorder: "border-gt-gold/35",
    solidBg: "bg-gt-gold",
    solidBorder: "border-gt-gold",
    dot: "bg-gt-gold",
    border: "border-gt-gold",
    css: "rgb(var(--gt-gold-600))",
  },
  ok: {
    text: "text-gt-ok",
    softBg: "bg-gt-ok/12",
    softBorder: "border-gt-ok/35",
    solidBg: "bg-gt-ok",
    solidBorder: "border-gt-ok",
    dot: "bg-gt-ok",
    border: "border-gt-ok",
    css: "rgb(var(--gt-ok))",
  },
  warn: {
    text: "text-gt-warn",
    softBg: "bg-gt-warn/12",
    softBorder: "border-gt-warn/35",
    solidBg: "bg-gt-warn",
    solidBorder: "border-gt-warn",
    dot: "bg-gt-warn",
    border: "border-gt-warn",
    css: "rgb(var(--gt-warn))",
  },
  danger: {
    text: "text-gt-danger",
    softBg: "bg-gt-danger/12",
    softBorder: "border-gt-danger/35",
    solidBg: "bg-gt-danger",
    solidBorder: "border-gt-danger",
    dot: "bg-gt-danger",
    border: "border-gt-danger",
    css: "rgb(var(--gt-danger))",
  },
  info: {
    text: "text-gt-info",
    softBg: "bg-gt-info/12",
    softBorder: "border-gt-info/35",
    solidBg: "bg-gt-info",
    solidBorder: "border-gt-info",
    dot: "bg-gt-info",
    border: "border-gt-info",
    css: "rgb(var(--gt-info))",
  },
  urbanismo: {
    text: "text-gt-dep-urbanismo",
    softBg: "bg-gt-dep-urbanismo/12",
    softBorder: "border-gt-dep-urbanismo/35",
    solidBg: "bg-gt-dep-urbanismo",
    solidBorder: "border-gt-dep-urbanismo",
    dot: "bg-gt-dep-urbanismo",
    border: "border-gt-dep-urbanismo",
    css: "rgb(var(--gt-dep-urbanismo))",
  },
  seguridad: {
    text: "text-gt-dep-seguridad",
    softBg: "bg-gt-dep-seguridad/12",
    softBorder: "border-gt-dep-seguridad/35",
    solidBg: "bg-gt-dep-seguridad",
    solidBorder: "border-gt-dep-seguridad",
    dot: "bg-gt-dep-seguridad",
    border: "border-gt-dep-seguridad",
    css: "rgb(var(--gt-dep-seguridad))",
  },
  hacienda: {
    text: "text-gt-dep-hacienda",
    softBg: "bg-gt-dep-hacienda/12",
    softBorder: "border-gt-dep-hacienda/35",
    solidBg: "bg-gt-dep-hacienda",
    solidBorder: "border-gt-dep-hacienda",
    dot: "bg-gt-dep-hacienda",
    border: "border-gt-dep-hacienda",
    css: "rgb(var(--gt-dep-hacienda))",
  },
  justicia: {
    text: "text-gt-dep-justicia",
    softBg: "bg-gt-dep-justicia/12",
    softBorder: "border-gt-dep-justicia/35",
    solidBg: "bg-gt-dep-justicia",
    solidBorder: "border-gt-dep-justicia",
    dot: "bg-gt-dep-justicia",
    border: "border-gt-dep-justicia",
    css: "rgb(var(--gt-dep-justicia))",
  },
  poblacion: {
    text: "text-gt-dep-poblacion",
    softBg: "bg-gt-dep-poblacion/12",
    softBorder: "border-gt-dep-poblacion/35",
    solidBg: "bg-gt-dep-poblacion",
    solidBorder: "border-gt-dep-poblacion",
    dot: "bg-gt-dep-poblacion",
    border: "border-gt-dep-poblacion",
    css: "rgb(var(--gt-dep-poblacion))",
  },
}

export type Department =
  | "resumen"
  | "urbanismo"
  | "seguridad"
  | "hacienda"
  | "justicia"
  | "poblacion"
  | "gobierno"
  | "admin"

// A department's colour is its identity: it does not follow the accent.
// `labelKey` is resolved with the `gobierno` translator at the call site — a module-scope
// object can never hold a translated literal.
export const DEPARTMENTS: Record<Department, { labelKey: string; tone: Tone }> = {
  resumen: { labelKey: "dep.resumen", tone: "civic" },
  urbanismo: { labelKey: "dep.urbanismo", tone: "urbanismo" },
  seguridad: { labelKey: "dep.seguridad", tone: "seguridad" },
  hacienda: { labelKey: "dep.hacienda", tone: "hacienda" },
  justicia: { labelKey: "dep.justicia", tone: "justicia" },
  poblacion: { labelKey: "dep.poblacion", tone: "poblacion" },
  gobierno: { labelKey: "dep.gobierno", tone: "gold" },
  admin: { labelKey: "dep.admin", tone: "seguridad" },
}

export const depTone = (dep: Department): ToneStyle => TONES[DEPARTMENTS[dep].tone]

// ─── Status → tone, per domain ────────────────────────────────────────────────
// Never encode meaning by colour alone: every one of these is rendered next to a
// word, and the badges below are what supply that word.

type Labelled = Record<string, { labelKey: string; tone: Tone }>

export const DENUNCIA_STATUS: Labelled = {
  pending: { labelKey: "status.pending", tone: "warn" },
  reviewing: { labelKey: "status.reviewing", tone: "info" },
  resolved: { labelKey: "status.resolved", tone: "ok" },
  dismissed: { labelKey: "status.dismissed", tone: "default" },
}

export const MULTA_STATUS: Labelled = {
  pending: { labelKey: "status.pending", tone: "warn" },
  paid: { labelKey: "multaStatus.paid", tone: "ok" },
  cancelled: { labelKey: "multaStatus.cancelled", tone: "default" },
  appealed: { labelKey: "multaStatus.appealed", tone: "info" },
}

export const BUSCADO_STATUS: Labelled = {
  active: { labelKey: "buscadoStatus.active", tone: "danger" },
  resolved: { labelKey: "buscadoStatus.resolved", tone: "ok" },
  cancelled: { labelKey: "buscadoStatus.cancelled", tone: "default" },
}

export const SEVERITY: Labelled = {
  low: { labelKey: "expedientes.severity.low", tone: "default" },
  medium: { labelKey: "expedientes.severity.medium", tone: "info" },
  high: { labelKey: "expedientes.severity.high", tone: "warn" },
  critical: { labelKey: "expedientes.severity.critical", tone: "danger" },
}

export const APELACION_STATUS: Labelled = {
  pending: { labelKey: "status.pending", tone: "warn" },
  reviewing: { labelKey: "status.reviewing", tone: "info" },
  upheld: { labelKey: "apelacionStatus.upheld", tone: "default" },
  overturned: { labelKey: "apelacionStatus.overturned", tone: "ok" },
}

export const EXPEDIENTE_STATUS: Labelled = {
  open: { labelKey: "expedientes.status.open", tone: "warn" },
  closed: { labelKey: "expedientes.status.archived", tone: "default" },
}

export const SUBASTA_STATUS: Labelled = {
  live: { labelKey: "subastaStatus.live", tone: "ok" },
  closed: { labelKey: "subastaStatus.closed", tone: "default" },
  cancelled: { labelKey: "subastaStatus.cancelled", tone: "danger" },
}

export const PARCELA_STATUS: Labelled = {
  ocupada: { labelKey: "parcelaStatus.ocupada", tone: "civic" },
  vacante: { labelKey: "parcelaStatus.vacante", tone: "default" },
  embargada: { labelKey: "parcelaStatus.embargada", tone: "danger" },
  subasta: { labelKey: "parcelaStatus.subasta", tone: "gold" },
}

export const STANDING: Labelled = {
  bueno: { labelKey: "standing.bueno", tone: "ok" },
  observado: { labelKey: "standing.observado", tone: "warn" },
  sancionado: { labelKey: "standing.sancionado", tone: "danger" },
}

export const DENUNCIA_CATEGORY: Record<string, string> = {
  griefing: "denunciaCategory.griefing",
  theft: "denunciaCategory.theft",
  dispute: "denunciaCategory.dispute",
  harassment: "denunciaCategory.harassment",
  other: "denunciaCategory.other",
}

// The five land uses a district can be zoned for.
export const ZONA_KINDS: Record<
  string,
  { labelKey: string; tone: Tone; icon: "home" | "store" | "landmark" | "hammer" | "sprout"; descKey: string }
> = {
  residencial: { labelKey: "zonas.kindResidencial", tone: "civic", icon: "home", descKey: "zonaKindDesc.residencial" },
  comercial: { labelKey: "zonas.kindComercial", tone: "gold", icon: "store", descKey: "zonaKindDesc.comercial" },
  civico: { labelKey: "zonas.kindCivico", tone: "seguridad", icon: "landmark", descKey: "zonaKindDesc.civico" },
  industrial: { labelKey: "zonas.kindIndustrial", tone: "urbanismo", icon: "hammer", descKey: "zonaKindDesc.industrial" },
  agricola: { labelKey: "zonas.kindAgricola", tone: "ok", icon: "sprout", descKey: "zonaKindDesc.agricola" },
}
