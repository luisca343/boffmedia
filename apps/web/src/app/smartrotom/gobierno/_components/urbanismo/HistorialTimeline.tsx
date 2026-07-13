"use client"

import { useMemo, useState } from "react"
import { Bar, Badge, Card, Empty, PageHead, Select, Skeleton } from "../ui"
import { useHistorial } from "../../_hooks/queries"
import { fmtDateTime, townName } from "../../_utils/format"
import { groupBy } from "./helpers"

// One card per parcela, its ownership timeline newest-first. `useHistorial` is the hook
// this module was given to use — see the report for the backend gap it currently hits
// (only a per-parcela historial route exists on the real API today, not this aggregate
// one, so this page renders the honest error state until that's wired up).
export function HistorialTimeline() {
  const { data, isLoading, isError } = useHistorial({ limit: 100 })
  const [town, setTown] = useState("all")

  const items = useMemo(() => data?.items ?? [], [data])
  const towns = useMemo(() => Array.from(new Set(items.map((h) => h.town))).sort(), [items])

  const filtered = town === "all" ? items : items.filter((h) => h.town === town)

  const groups = useMemo(() => {
    const byRegion = groupBy(filtered, (h) => h.regionId)
    return Array.from(byRegion.entries())
      .map(([regionId, entries]) => ({
        regionId,
        town: entries[0].town,
        number: entries[0].number,
        entries: [...entries].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()),
      }))
      .sort((a, b) => new Date(b.entries[0].changedAt).getTime() - new Date(a.entries[0].changedAt).getTime())
  }, [filtered])

  return (
    <div>
      <PageHead
        kicker="Urbanismo · Registro de la propiedad"
        dep="urbanismo"
        title="Historial de titularidad"
        sub="Cada traspaso de parcela queda inscrito en el registro municipal de la propiedad."
        right={
          towns.length > 1 ? (
            <div className="w-[190px]">
              <Select
                value={town}
                onChange={setTown}
                options={[
                  { value: "all", label: "Todos los municipios" },
                  ...towns.map((t) => ({ value: t, label: townName(t) })),
                ]}
              />
            </div>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="grid gap-3.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <Empty icon="alert" title="No se pudo cargar el historial" sub="Inténtalo de nuevo en unos minutos." />
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <Empty
            icon="scroll"
            title="Sin movimientos registrados"
            sub="Todavía no hay traspasos inscritos en el registro de la propiedad."
          />
        </Card>
      ) : (
        <div className="grid gap-3.5">
          {groups.map((g) => (
            <Card key={g.regionId} className="overflow-hidden">
              <Bar icon="mapPin" dep="urbanismo">
                {townName(g.town)} · Parcela #{g.number}
              </Bar>
              <div className="px-[18px] py-3.5">
                {g.entries.map((h, i) => (
                  <div key={h.id} className="flex gap-3.5" style={{ paddingBottom: i < g.entries.length - 1 ? 16 : 0 }}>
                    <div className="flex flex-none flex-col items-center">
                      <span
                        className="h-[11px] w-[11px] flex-none rounded-full border-2 border-gt-paper-0"
                        style={{
                          background: i === 0 ? "rgb(var(--gt-civic))" : "rgb(var(--gt-paper-3))",
                          boxShadow: `0 0 0 1.5px ${i === 0 ? "rgb(var(--gt-civic))" : "rgb(var(--gt-line-strong))"}`,
                        }}
                      />
                      {i < g.entries.length - 1 && <div className="mt-0.5 w-0.5 flex-1 bg-gt-line" />}
                    </div>
                    <div className="flex-1 pb-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13.5px] text-gt-ink-800">
                          {h.previousOwner ? (
                            <>
                              <strong>{h.previousOwner.username}</strong> transfirió a{" "}
                            </>
                          ) : (
                            "El municipio adjudicó a "
                          )}
                          <strong className="text-gt-civic">{h.newOwner?.username ?? "—"}</strong>
                        </span>
                        {i === 0 && <Badge tone="ok">Actual</Badge>}
                      </div>
                      <div className="mt-0.5 font-gt-mono text-[10.5px] text-gt-ink-400">{fmtDateTime(h.changedAt)}</div>
                      {h.reason && <div className="mt-0.5 text-[12px] italic text-gt-ink-500">{h.reason}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
