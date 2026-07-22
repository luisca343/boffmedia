import type { IconName } from "../ui"
import type { Tone } from "../../_utils/tones"
import type { Anuncio } from "../../_types"

type KindMeta = { tone: Tone; icon: IconName; label: string }

const KIND_BASE: Record<Anuncio["kind"], Omit<KindMeta, "label">> = {
  evento: { tone: "gold", icon: "star" },
  anuncio: { tone: "civic", icon: "megaphone" },
  alerta: { tone: "danger", icon: "alert" },
}

export function getAnuncioKindMeta(
  t: (k: string) => string,
): Record<Anuncio["kind"], KindMeta> {
  return {
    evento: { ...KIND_BASE.evento, label: t("anuncios.kindEvento") },
    anuncio: { ...KIND_BASE.anuncio, label: t("anuncios.kindAnuncio") },
    alerta: { ...KIND_BASE.alerta, label: t("anuncios.kindAlerta") },
  }
}

export function getAnuncioKindOptions(
  t: (k: string) => string,
): { value: Anuncio["kind"]; label: string }[] {
  return [
    { value: "anuncio", label: t("anuncios.kindAnuncio") },
    { value: "evento", label: t("anuncios.kindEvento") },
    { value: "alerta", label: t("anuncios.kindAlerta") },
  ]
}
