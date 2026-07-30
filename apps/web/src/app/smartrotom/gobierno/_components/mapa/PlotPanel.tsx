"use client"

import { useTranslations } from "next-intl"
import { Avatar, Badge, Icon, Skeleton, Sunken } from "../ui"
import { useHistorial } from "../../_hooks/queries"
import { fmtDate, townName } from "../../_utils/format"
import { townColor, type Pt } from "../../_utils/geo"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { useFormat } from "@boffmedia/ui/useFormat"
import type { Parcela } from "../../_types"

export function PlotPanel({
  plot,
  center,
  onClose,
}: {
  plot: Parcela
  center: Pt | null
  onClose: () => void
}) {
  const t = useTranslations("gobierno")
  const { intlLocale } = useFormat()
  const openDossier = useGobiernoUi((s) => s.openDossier)
  const { data: hist, isLoading } = useHistorial({ regionId: plot.regionId, pageSize: 10 })
  const color = townColor(plot.town)

  return (
    <div className="animate-gt-pop-scale motion-reduce:animate-none">
      <div className="mb-3 flex items-center justify-between">
        <Badge tone="urbanismo">{townName(plot.town)}</Badge>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("mapa.cerrarFichaParcela")}
          className="rounded-gt-sm p-1 text-gt-ink-400 transition-colors hover:bg-gt-paper-2 hover:text-gt-ink-900"
        >
          <Icon name="x" size={18} />
        </button>
      </div>

      <h2 className="font-gt-display text-[26px] leading-none text-gt-ink-900">
        {t("urbanismo.parcela")} #{plot.number}
      </h2>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {center && (
          <span className="font-gt-mono text-[11px] text-gt-ink-400">
            X {Math.round(center.x)} · Z {Math.round(center.z)}
          </span>
        )}
        {plot.zona && (
          <span
            className="inline-flex items-center gap-[5px] rounded-gt-pill border px-2 py-0.5 text-[11px] font-bold"
            style={{
              borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
              background: `color-mix(in srgb, ${color} 9%, transparent)`,
              color,
            }}
          >
            {plot.zona.name}
          </span>
        )}
      </div>

      <div className="gt-rule my-3.5" />

      {plot.owner ? (
        <button
          type="button"
          onClick={() => plot.owner && openDossier(plot.owner.uuid)}
          className="flex w-full items-center gap-[11px] rounded-gt border border-gt-line bg-gt-paper-0 p-3 text-left shadow-gt-sm transition-colors hover:bg-gt-paper-1"
        >
          <Avatar user={plot.owner.username} size={42} />
          <div className="min-w-0 flex-1">
            <div className="font-gt-mono text-[9px] uppercase tracking-[.12em] text-gt-ink-400">
              {t("urbanismo.propietario")}
            </div>
            <div className="font-gt-display text-[15px] font-bold text-gt-ink-900">{plot.owner.username}</div>
          </div>
          <Icon name="arrowRight" size={16} className="flex-none text-gt-ink-300" />
        </button>
      ) : (
        <Sunken className="p-3.5 text-center">
          <div className="mb-1 font-gt-display text-[15px] text-gt-ink-600">{t("mapa.parcelaVacante")}</div>
          <div className="font-gt-mono text-[11px] text-gt-ink-400">{t("mapa.sinSubastaAbierta")}</div>
        </Sunken>
      )}

      <div className="mt-4">
        <div className="mb-2 font-gt-mono text-[9.5px] font-bold uppercase tracking-[.14em] text-gt-ink-400">
          {t("mapa.titularidad")}
        </div>
        {isLoading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-6" />
            ))}
          </div>
        ) : !hist || hist.items.length === 0 ? (
          <div className="text-[12px] italic text-gt-ink-400">{t("mapa.sinCambiosTitularidad")}</div>
        ) : (
          hist.items.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-2 border-b border-gt-line-soft py-[7px] text-[12px] last:border-b-0"
            >
              <Icon name="arrowRight" size={13} className="flex-none text-gt-ink-300" />
              <span className="min-w-0 flex-1 truncate text-gt-ink-700">
                {h.previousOwner?.username ?? t("zonas.municipioLabel")} → <strong>{h.newOwner?.username ?? "—"}</strong>
              </span>
              <span className="font-gt-mono text-[10px] text-gt-ink-400">{fmtDate(h.changedAt, intlLocale)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
