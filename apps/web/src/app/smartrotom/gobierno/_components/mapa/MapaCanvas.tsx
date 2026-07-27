"use client"

import { useId, useMemo } from "react"
import { useTranslations } from "next-intl"
import type { Region } from "@boffmedia/shared"
import { Empty } from "../ui"
import { TONES, ZONA_KINDS } from "../../_utils/tones"
import { townName } from "../../_utils/format"
import { bounds, centroid, fitProjection, indexRegions, polygonPath, townColor, type Pt } from "../../_utils/geo"
import type { Buscado, Parcela, Zona } from "../../_types"

/** A buscado's `lastSeen` is free text an officer typed, not a coordinate — matched
 * against the region's own real town names rather than a hardcoded gazetteer, so it never
 * assumes fictional place names. No match simply means no pin, never a guess. */
function matchTown(lastSeen: string | null, towns: string[]): string | undefined {
  if (!lastSeen) return undefined
  const needle = lastSeen.toLowerCase()
  return towns.find((t) => needle.includes(t.toLowerCase()) || needle.includes(townName(t).toLowerCase()))
}

export function MapaCanvas({
  parcelas,
  regions,
  zonas,
  buscadosActive,
  selectedPlotId,
  selectedZonaId,
  showZonas,
  onSelectPlot,
  onSelectZona,
  onOpenDossier,
}: {
  parcelas: Parcela[]
  regions: Region[]
  zonas: Zona[]
  buscadosActive: Buscado[]
  selectedPlotId: string | null
  selectedZonaId: number | null
  showZonas: boolean
  onSelectPlot: (p: Parcela) => void
  onSelectZona: (z: Zona) => void
  onOpenDossier: (uuid: string) => void
}) {
  const t = useTranslations("gobierno")
  const hatchId = `gt-hatch-${useId().replace(/:/g, "")}`
  const vignId = `gt-vign-${useId().replace(/:/g, "")}`

  const regionsByName = useMemo(() => indexRegions(regions), [regions])

  // Only plots whose WorldGuard region we can actually resolve are drawn — a plot with a
  // stale or renamed regionId is skipped rather than placed at a guessed position.
  const plotEntries = useMemo(
    () =>
      parcelas
        .map((p) => ({ p, region: regionsByName.get(p.regionId) }))
        .filter((e): e is { p: Parcela; region: Region } => !!e.region),
    [parcelas, regionsByName],
  )

  const proj = useMemo(() => {
    const allPoints = plotEntries.flatMap((e) => e.region.points as Pt[])
    return fitProjection(allPoints, { width: 1000, pad: 140 })
  }, [plotEntries])

  const towns = useMemo(() => Array.from(new Set(parcelas.map((p) => p.town))), [parcelas])

  // A town's own boundary, when the world registers one — the same polygon-as-landmass
  // idea the Taxi map uses. Not every town necessarily has one; those simply render with
  // no backdrop, just their plots.
  const townCentroids = useMemo(() => {
    const map = new Map<string, Pt>()
    for (const t of towns) {
      const region = regionsByName.get(t)
      if (region) {
        map.set(t, centroid(region.points as Pt[]))
        continue
      }
      const members = plotEntries.filter((e) => e.p.town === t)
      if (members.length) map.set(t, centroid(members.map((e) => centroid(e.region.points as Pt[]))))
    }
    return map
  }, [towns, regionsByName, plotEntries])

  const zonaBoxes = useMemo(() => {
    if (!showZonas) return []
    return zonas
      .map((z) => {
        const members = plotEntries.filter((e) => e.p.zonaId === z.id)
        if (!members.length) return null
        const pts = members.flatMap((e) => e.region.points as Pt[])
        const b = bounds(pts)
        return { zona: z, ...b }
      })
      .filter((v): v is { zona: Zona; minX: number; maxX: number; minZ: number; maxZ: number } => !!v)
  }, [zonas, plotEntries, showZonas])

  const pins = useMemo(
    () =>
      buscadosActive
        .map((b) => {
          const t = matchTown(b.lastSeen, towns)
          const at = t ? townCentroids.get(t) : undefined
          return at ? { b, at } : null
        })
        .filter((v): v is { b: Buscado; at: Pt } => !!v),
    [buscadosActive, towns, townCentroids],
  )

  if (plotEntries.length === 0) {
    return (
      <Empty icon="map" title={t("mapa.sinParcelasUbicables")} sub={t("mapa.sinParcelasUbicablesSub")} />
    )
  }

  const PAD = 20

  return (
    <div className="gt-scroll relative h-full overflow-auto bg-gt-paper-1">
      <svg
        viewBox={`0 0 ${proj.width} ${proj.height}`}
        style={{ width: "128%", minWidth: 760 }}
        className="mx-auto block"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id={hatchId} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgb(var(--gt-line-strong))" strokeWidth="1.2" opacity="0.5" />
          </pattern>
          <radialGradient id={vignId} cx="50%" cy="42%" r="75%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(120,100,60,.1)" />
          </radialGradient>
        </defs>

        {/* town landmass, where the world registers a boundary region for it */}
        {towns.map((t) => {
          const region = regionsByName.get(t)
          if (!region) return null
          const hue = townColor(t)
          return (
            <path
              key={t}
              d={polygonPath(region.points as Pt[], proj)}
              fill={hue}
              fillOpacity={0.1}
              stroke={hue}
              strokeOpacity={0.4}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
            />
          )
        })}

        {/* urbanismo zonas — a dashed footprint around their member plots */}
        {zonaBoxes.map(({ zona, minX, maxX, minZ, maxZ }) => {
          const kind = ZONA_KINDS[zona.kind]
          const color = kind ? TONES[kind.tone].css : TONES.urbanismo.css
          const x0 = proj.x(minX - PAD)
          const y0 = proj.y(minZ - PAD)
          const w = proj.x(maxX + PAD) - x0
          const h = proj.y(maxZ + PAD) - y0
          const on = selectedZonaId === zona.id
          const faded = selectedZonaId != null && !on
          return (
            <g
              key={zona.id}
              className={`cursor-pointer ${on ? "animate-gt-pulse motion-reduce:animate-none" : ""}`}
              onClick={() => onSelectZona(zona)}
            >
              <rect
                x={x0}
                y={y0}
                width={w}
                height={h}
                rx={10}
                fill={color}
                fillOpacity={on ? 0.18 : faded ? 0.04 : 0.08}
                stroke={color}
                strokeOpacity={on ? 0.95 : faded ? 0.3 : 0.55}
                strokeWidth={on ? 2.4 : 1.4}
                strokeDasharray={on ? "none" : "6 4"}
              />
              <text
                x={x0 + 2}
                y={y0 - 6}
                className="font-gt-mono text-[10px] font-bold uppercase"
                fill={color}
                opacity={faded ? 0.4 : 1}
                stroke="rgb(var(--gt-paper-1))"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {zona.name}
              </text>
            </g>
          )
        })}

        {/* plots — real WorldGuard polygons, not placeholder squares */}
        {plotEntries.map(({ p, region }) => {
          const pts = region.points as Pt[]
          const c = centroid(pts)
          const owned = p.status !== "vacante"
          const isSel = selectedPlotId === p.regionId
          const inZona = selectedZonaId != null && p.zonaId === selectedZonaId
          const dimmed = selectedZonaId != null && !inZona
          const hue = townColor(p.town)
          return (
            <g
              key={p.regionId}
              className="cursor-pointer"
              style={{ opacity: dimmed ? 0.4 : 1 }}
              onClick={() => onSelectPlot(p)}
            >
              <path
                d={polygonPath(pts, proj)}
                fill={owned ? `color-mix(in srgb, ${hue} 26%, rgb(var(--gt-paper-0)))` : `url(#${hatchId})`}
                stroke={isSel ? "rgb(var(--gt-accent))" : inZona ? hue : "rgb(var(--gt-line-strong))"}
                strokeWidth={isSel ? 3 : inZona ? 2.4 : 1.3}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
              <text
                x={proj.x(c.x)}
                y={proj.y(c.z) + 4}
                textAnchor="middle"
                className="font-gt-mono text-[11px] font-bold"
                fill="rgb(var(--gt-ink-700))"
              >
                {p.number}
              </text>
            </g>
          )
        })}

        {/* town labels */}
        {Array.from(townCentroids.entries()).map(([t, c]) => (
          <text
            key={t}
            x={proj.x(c.x)}
            y={proj.y(c.z) - 58}
            textAnchor="middle"
            className="font-gt-display text-[17px] font-bold"
            fill="rgb(var(--gt-ink-900))"
          >
            {townName(t)}
          </text>
        ))}

        {/* active busca y captura, pinned only where a real town match was found */}
        {pins.map(({ b, at }) => (
          <g key={b.id} className="cursor-pointer" onClick={() => onOpenDossier(b.player.uuid)}>
            <circle
              cx={proj.x(at.x)}
              cy={proj.y(at.z)}
              r={15}
              fill="rgb(var(--gt-danger))"
              fillOpacity={0.18}
              className="animate-gt-pulse motion-reduce:animate-none"
            />
            <circle cx={proj.x(at.x)} cy={proj.y(at.z)} r={9} fill="rgb(var(--gt-danger))" stroke="#fff" strokeWidth={2} />
            <text
              x={proj.x(at.x)}
              y={proj.y(at.z) + 3.5}
              textAnchor="middle"
              className="font-gt-mono text-[10px] font-extrabold"
              fill="#fff"
            >
              !
            </text>
          </g>
        ))}

        <rect x={0} y={0} width={proj.width} height={proj.height} fill={`url(#${vignId})`} pointerEvents="none" />
      </svg>
    </div>
  )
}
