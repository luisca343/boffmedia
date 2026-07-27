"use client"

import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Button, PageHead } from "../ui"
import { useBuscados, useParcelas, useZonas } from "../../_hooks/queries"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { useGobRegions } from "./useGobRegions"
import { MapaCanvas } from "./MapaCanvas"
import { MapSummary } from "./MapSummary"
import { PlotPanel } from "./PlotPanel"
import { ZonaPanel } from "./ZonaPanel"
import { centroid, indexRegions, type Pt } from "../../_utils/geo"
import type { Parcela, Zona } from "../../_types"

/**
 * The handoff's cadastral map is a full-bleed canvas with a floating header. The real
 * layout shell (`layout.tsx`, off-limits for this build) wraps every page in a padded,
 * document-flow container instead of a fixed-height one, so this view carries its own
 * viewport-relative height rather than inheriting one — the split canvas/panel still reads
 * as one tall plan of the region, just inside a card instead of edge-to-edge.
 */
export function MapaView() {
  const t = useTranslations("gobierno")
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null)
  const [selectedZonaId, setSelectedZonaId] = useState<number | null>(null)
  const [showZonas, setShowZonas] = useState(true)

  const openDossier = useGobiernoUi((s) => s.openDossier)

  const { data: parcelasPage, isLoading: loadingParcelas } = useParcelas({ pageSize: 500 })
  const { data: zonas = [], isLoading: loadingZonas } = useZonas()
  const { data: regions = [], isLoading: loadingRegions } = useGobRegions()
  // Every active order, not just the top few — every one of them needs a chance at a pin.
  const { data: buscadosPage } = useBuscados({ status: "active", pageSize: 200 })

  const parcelas = useMemo(() => parcelasPage?.items ?? [], [parcelasPage])
  const buscadosActive = buscadosPage?.items ?? []

  const regionsByName = useMemo(() => indexRegions(regions), [regions])

  const selectedPlot = selectedPlotId ? (parcelas.find((p) => p.regionId === selectedPlotId) ?? null) : null
  const selectedZona = selectedZonaId != null ? (zonas.find((z) => z.id === selectedZonaId) ?? null) : null

  const selectedPlotCenter: Pt | null = useMemo(() => {
    if (!selectedPlot) return null
    const region = regionsByName.get(selectedPlot.regionId)
    return region ? centroid(region.points as Pt[]) : null
  }, [selectedPlot, regionsByName])

  const zonaMembers = useMemo(
    () => (selectedZona ? parcelas.filter((p) => p.zonaId === selectedZona.id) : []),
    [selectedZona, parcelas],
  )

  const selectPlot = (p: Parcela) => {
    setSelectedPlotId(p.regionId)
    setSelectedZonaId(null)
  }
  const selectZona = (z: Zona) => {
    setSelectedZonaId(z.id)
    setSelectedPlotId(null)
  }

  const loading = loadingParcelas || loadingZonas || loadingRegions

  return (
    <div className="flex h-[calc(100dvh-210px)] min-h-[560px] flex-col animate-gt-pop motion-reduce:animate-none">
      <PageHead
        kicker={t("urbanismo.parcelasKicker")}
        title={t("mapa.titulo")}
        dep="urbanismo"
        right={
          <Button
            tone={showZonas ? "ghost" : "plain"}
            size="sm"
            icon="layers"
            onClick={() => setShowZonas((v) => !v)}
            aria-label={showZonas ? t("mapa.ocultarZonas") : t("mapa.mostrarZonas")}
          >
            {t("mapa.zonasBtn")}
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="relative min-h-[320px] flex-1 overflow-hidden rounded-gt border border-gt-line-strong shadow-gt">
          {loading ? (
            <div className="grid h-full place-items-center text-[13px] text-gt-ink-400">{t("mapa.cargandoCatastro")}</div>
          ) : (
            <MapaCanvas
              parcelas={parcelas}
              regions={regions}
              zonas={zonas}
              buscadosActive={buscadosActive}
              selectedPlotId={selectedPlotId}
              selectedZonaId={selectedZonaId}
              showZonas={showZonas}
              onSelectPlot={selectPlot}
              onSelectZona={selectZona}
              onOpenDossier={openDossier}
            />
          )}

          <MapaLegend t={t} />
        </div>

        <div className="gt-scroll min-h-[240px] w-full flex-none overflow-y-auto rounded-gt border border-gt-line bg-gt-paper-0 p-4 shadow-gt lg:min-h-0 lg:w-[320px]">
          {selectedPlot ? (
            <PlotPanel plot={selectedPlot} center={selectedPlotCenter} onClose={() => setSelectedPlotId(null)} />
          ) : selectedZona ? (
            <ZonaPanel
              zona={selectedZona}
              members={zonaMembers}
              onClose={() => setSelectedZonaId(null)}
              onSelectPlot={selectPlot}
              t={t}
            />
          ) : (
            <MapSummary parcelas={parcelas} zonas={zonas} t={t} />
          )}
        </div>
      </div>
    </div>
  )
}

function MapaLegend({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <div className="pointer-events-none absolute bottom-3.5 left-4 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-3.5 rounded-gt border border-gt-line-strong bg-gt-paper-0 px-3.5 py-2 shadow-gt">
      <LegendItem swatch="bg-gt-civic">{t("mapa.legendOcupada")}</LegendItem>
      <LegendItem swatch="border border-dashed border-gt-ink-300 bg-transparent">{t("mapa.legendVacante")}</LegendItem>
      <LegendItem swatch="bg-gt-danger">{t("mapa.legendBuscado")}</LegendItem>
      <LegendItem swatch="border border-dashed border-gt-dep-urbanismo bg-transparent">{t("mapa.legendZona")}</LegendItem>
    </div>
  )
}

function LegendItem({ swatch, children }: { swatch: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 font-gt-mono text-[11px] text-gt-ink-600">
      <span className={`h-[11px] w-[11px] rounded-[3px] ${swatch}`} />
      {children}
    </span>
  )
}
