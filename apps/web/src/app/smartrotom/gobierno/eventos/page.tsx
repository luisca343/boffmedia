"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Bar, Button, Empty, PageHead, Skeleton, Stat } from "../_components/ui"
import { useEventos } from "../_hooks/queries"
import { GOBIERNO_ROOT } from "../_utils/nav"
import { EventoCard } from "../_components/eventos/shared"

export default function EventosPage() {
  const { data: eventos, isLoading } = useEventos()
  const all = eventos ?? []

  const activos = useMemo(() => all.filter((e) => e.status === "rating" || e.status === "live"), [all])
  const proximos = useMemo(() => all.filter((e) => e.status === "upcoming" || e.status === "building"), [all])
  const pasados = useMemo(() => all.filter((e) => e.status === "closed"), [all])
  const retos = useMemo(() => all.filter((e) => e.type === "construccion").length, [all])
  const cacerias = useMemo(() => all.filter((e) => e.type === "caza").length, [all])
  const capturas = useMemo(
    () =>
      all
        .filter((e) => e.type === "caza" && e.status === "live")
        .reduce((sum, e) => sum + (e.capturas ?? 0), 0),
    [all],
  )

  return (
    <>
      <PageHead
        kicker="Gobierno · Actividad ciudadana"
        dep="gold"
        title="Eventos"
        sub="Eventos comunitarios de Teras: retos de construcción que la ciudadanía valora y cacerías de bichos con parámetros públicos. La organización corre a cargo del ayuntamiento."
        right={
          <Link href={`${GOBIERNO_ROOT}/eventos/crear`}>
            <Button icon="plus" tone="gold">
              Convocar evento
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[280px] w-full" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <Empty
          icon="star"
          title="Todavía no hay eventos convocados"
          sub="Convoca un reto de construcción o una cacería de bichos para que la ciudadanía de Teras participe."
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Eventos activos" value={activos.length} icon="star" tone="gold" sub="en curso ahora" />
            <Stat label="Retos de construcción" value={retos} icon="building" tone="urbanismo" />
            <Stat label="Cacerías de bichos" value={cacerias} icon="crosshair" tone="civic" />
            <Stat
              label="Capturas registradas"
              value={capturas}
              icon="crosshair"
              tone="seguridad"
              sub="en cacerías activas"
            />
          </div>

          {activos.length > 0 && (
            <>
              <Bar icon="star" dep="gold">
                En curso
              </Bar>
              <div className="mb-6 mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activos.map((ev) => (
                  <EventoCard key={ev.id} ev={ev} />
                ))}
              </div>
            </>
          )}

          {proximos.length > 0 && (
            <>
              <Bar icon="calendar" dep="gold">
                Próximos
              </Bar>
              <div className="mb-6 mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {proximos.map((ev) => (
                  <EventoCard key={ev.id} ev={ev} />
                ))}
              </div>
            </>
          )}

          {pasados.length > 0 && (
            <>
              <Bar icon="history" dep="gold">
                Historial
              </Bar>
              <div className="mt-3.5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pasados.map((ev) => (
                  <EventoCard key={ev.id} ev={ev} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
