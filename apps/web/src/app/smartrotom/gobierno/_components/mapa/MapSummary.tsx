import { Card, Icon } from "../ui"
import { TONES, ZONA_KINDS } from "../../_utils/tones"
import { townName } from "../../_utils/format"
import { townColor } from "../../_utils/geo"
import type { Parcela, Zona } from "../../_types"

export function MapSummary({ parcelas, zonas }: { parcelas: Parcela[]; zonas: Zona[] }) {
  const towns = Array.from(new Set(parcelas.map((p) => p.town)))
  const rows = towns.map((t) => {
    const plots = parcelas.filter((p) => p.town === t)
    const occ = plots.filter((p) => p.status === "ocupada").length
    const zonasDeTown = zonas.filter((z) => z.town === t).length
    return { t, total: plots.length, occ, zonasDeTown }
  })

  return (
    <div className="animate-gt-pop-scale motion-reduce:animate-none">
      <div className="mb-1 font-gt-mono text-[10.5px] font-bold uppercase tracking-[.22em] text-gt-dep-urbanismo">
        Resumen catastral
      </div>
      <h2 className="mb-1 font-gt-display text-[19px] text-gt-ink-900">
        {towns.length} {towns.length === 1 ? "municipio" : "municipios"}
      </h2>
      <div className="mb-4 text-[12.5px] leading-relaxed text-gt-ink-500">
        Toca una zona o una parcela en el mapa para ver su ficha. Usa el interruptor para mostrar u ocultar las
        zonas urbanísticas.
      </div>

      {rows.length === 0 ? (
        <div className="py-3 text-center text-[12.5px] italic text-gt-ink-400">
          Todavía no hay parcelas registradas.
        </div>
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
                      {r.zonasDeTown} {r.zonasDeTown === 1 ? "zona" : "zonas"}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-gt-display text-base font-bold tabular-nums" style={{ color }}>
                    {r.occ}/{r.total}
                  </div>
                  <div className="font-gt-mono text-[9px] text-gt-ink-400">ocupadas</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Card className="mt-4 p-3.5">
        <div className="mb-2.5 font-gt-mono text-[9.5px] font-bold uppercase tracking-[.14em] text-gt-ink-400">
          Uso del suelo · zonas
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {Object.entries(ZONA_KINDS).map(([key, k]) => (
            <div key={key} className="flex items-center gap-[7px] text-[12px] text-gt-ink-700">
              <Icon name={k.icon} size={14} className={`flex-none ${TONES[k.tone].text}`} />
              {k.label}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
