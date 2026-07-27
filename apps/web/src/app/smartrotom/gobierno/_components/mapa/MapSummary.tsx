import type { useTranslations } from "next-intl"
import { Card, Icon } from "../ui"
import { TONES, ZONA_KINDS } from "../../_utils/tones"
import { townName } from "../../_utils/format"
import { townColor } from "../../_utils/geo"
import type { Parcela, Zona } from "../../_types"

// No "use client" here — this stays a server-shaped component — but it is only ever
// rendered from `MapaView.tsx`, a client component (`useState` for the selection),
// so it cannot itself be `async` + `getTranslations`: React client trees can't render
// an async function component. The translator is passed down as a prop from the
// client parent's own `useTranslations` instead (brief's documented fallback).
export function MapSummary({
  parcelas,
  zonas,
  t,
}: {
  parcelas: Parcela[]
  zonas: Zona[]
  t: ReturnType<typeof useTranslations>
}) {
  const towns = Array.from(new Set(parcelas.map((p) => p.town)))
  const rows = towns.map((tn) => {
    const plots = parcelas.filter((p) => p.town === tn)
    const occ = plots.filter((p) => p.status === "ocupada").length
    const zonasDeTown = zonas.filter((z) => z.town === tn).length
    return { t: tn, total: plots.length, occ, zonasDeTown }
  })

  return (
    <div className="animate-gt-pop-scale motion-reduce:animate-none">
      <div className="mb-1 font-gt-mono text-[10.5px] font-bold uppercase tracking-[.22em] text-gt-dep-urbanismo">
        {t("mapa.resumenCatastral")}
      </div>
      <h2 className="mb-1 font-gt-display text-[19px] text-gt-ink-900">
        {t("mapa.municipiosCount", { count: towns.length })}
      </h2>
      <div className="mb-4 text-[12.5px] leading-relaxed text-gt-ink-500">{t("mapa.instrucciones")}</div>

      {rows.length === 0 ? (
        <div className="py-3 text-center text-[12.5px] italic text-gt-ink-400">{t("mapa.sinParcelas")}</div>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => {
            const color = townColor(r.t)
            return (
              <div
                key={r.t}
                className="flex items-center justify-between rounded-gt-sm border border-gt-line bg-gt-paper-2 px-3 py-2.5"
                style={{ borderLeft: `3px solid ${color}` }}
              >
                <div>
                  <div className="font-gt-display text-[14px] font-bold text-gt-ink-900">{townName(r.t)}</div>
                  {r.zonasDeTown > 0 && (
                    <div className="mt-0.5 font-gt-mono text-[10px] text-gt-ink-400">
                      {t("mapa.zonasCount", { count: r.zonasDeTown })}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-gt-display text-base font-bold tabular-nums" style={{ color }}>
                    {r.occ}/{r.total}
                  </div>
                  <div className="font-gt-mono text-[9px] text-gt-ink-400">{t("urbanismo.ocupadas")}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Card className="mt-4 p-3.5">
        <div className="mb-2.5 font-gt-mono text-[9.5px] font-bold uppercase tracking-[.14em] text-gt-ink-400">
          {t("mapa.usoSueloZonas")}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {Object.entries(ZONA_KINDS).map(([key, k]) => (
            <div key={key} className="flex items-center gap-[7px] text-[12px] text-gt-ink-700">
              <Icon name={k.icon} size={14} className={`flex-none ${TONES[k.tone].text}`} />
              {t(k.labelKey)}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
