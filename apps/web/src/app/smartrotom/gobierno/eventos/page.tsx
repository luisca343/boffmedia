"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Bar, Button, Empty, PageHead, Skeleton, Stat } from "../_components/ui"
import { useEventos } from "../_hooks/queries"
import { GOBIERNO_ROOT } from "../_utils/nav"
import { EventoCard } from "../_components/eventos/shared"

export default function EventosPage() {
  const t = useTranslations("gobierno")
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
        kicker={t("eventos.listKicker")}
        dep="gold"
        title={t("nav.eventos")}
        sub={t("eventos.listSub")}
        right={
          <Link href={`${GOBIERNO_ROOT}/eventos/crear`}>
            <Button icon="plus" tone="gold">
              {t("eventos.convocarEvento")}
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
        <Empty icon="star" title={t("eventos.listEmptyTitle")} sub={t("eventos.listEmptySub")} />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={t("eventos.statActivos")}
              value={activos.length}
              icon="star"
              tone="gold"
              sub={t("eventos.statActivosSub")}
            />
            <Stat label={t("eventos.statRetos")} value={retos} icon="building" tone="urbanismo" />
            <Stat label={t("eventos.statCacerias")} value={cacerias} icon="crosshair" tone="civic" />
            <Stat
              label={t("eventos.capturasRegistradas")}
              value={capturas}
              icon="crosshair"
              tone="seguridad"
              sub={t("eventos.statCapturasSub")}
            />
          </div>

          {activos.length > 0 && (
            <>
              <Bar icon="star" dep="gold">
                {t("eventos.enCurso")}
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
                {t("eventos.statProximos")}
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
                {t("eventos.statHistorial")}
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
