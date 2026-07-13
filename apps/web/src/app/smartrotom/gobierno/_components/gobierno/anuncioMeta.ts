import type { IconName } from "../ui"
import type { Tone } from "../../_utils/tones"
import type { Anuncio } from "../../_types"

export const ANUNCIO_KIND_META: Record<Anuncio["kind"], { tone: Tone; icon: IconName; label: string }> = {
  evento: { tone: "gold", icon: "star", label: "Evento" },
  anuncio: { tone: "civic", icon: "megaphone", label: "Anuncio" },
  alerta: { tone: "danger", icon: "alert", label: "Alerta" },
}

export const ANUNCIO_KIND_OPTIONS: { value: Anuncio["kind"]; label: string }[] = [
  { value: "anuncio", label: "Anuncio" },
  { value: "evento", label: "Evento" },
  { value: "alerta", label: "Alerta" },
]
