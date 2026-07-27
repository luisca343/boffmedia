// The real seguridad API stores `severity` as a free string with no server-side enum check —
// its own swagger examples use Spanish words (`alta`, `baja`…), while this app's shared
// `_utils/tones.ts` SEVERITY map (built against the frontend's own `_types`) keys itself in
// English (`low`/`medium`/`high`/`critical`). Both are real, both are already built, and
// neither can be edited from here — so Seguridad sends the API's own vocabulary on write and
// normalizes to the shared map's vocabulary on read, entirely locally.
import { SEVERITY } from "../../_utils/tones"

const TO_ENGLISH: Record<string, keyof typeof SEVERITY> = {
  baja: "low",
  media: "medium",
  alta: "high",
  critica: "critical",
  crítica: "critical",
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
}

export const severityTone = (raw: string) => SEVERITY[TO_ENGLISH[raw.toLowerCase()] ?? "medium"]

// What gets written back to the API when creating a buscado — Spanish, matching
// CreateBuscadoDto's own documented examples.
export const SEVERITY_CREATE_OPTIONS = [
  { value: "baja", labelKey: SEVERITY.low.labelKey },
  { value: "media", labelKey: SEVERITY.medium.labelKey },
  { value: "alta", labelKey: SEVERITY.high.labelKey },
  { value: "critica", labelKey: SEVERITY.critical.labelKey },
]
