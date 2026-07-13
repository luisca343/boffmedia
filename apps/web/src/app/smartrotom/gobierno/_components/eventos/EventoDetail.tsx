"use client"

import { Empty, Skeleton } from "../ui"
import { useEvento } from "../../_hooks/queries"
import { BackToEventos } from "./shared"
import { ConstruccionDetail } from "./ConstruccionDetail"
import { CazaDetail } from "./CazaDetail"

export function EventoDetail({ id }: { id: string }) {
  const eventoId = Number.parseInt(id, 10)
  const { data: ev, isLoading, error } = useEvento(Number.isFinite(eventoId) ? eventoId : null)

  if (!Number.isFinite(eventoId)) {
    return (
      <>
        <BackToEventos />
        <Empty icon="alert" title="Evento no válido" sub="El enlace no apunta a un evento reconocible." />
      </>
    )
  }

  if (isLoading) {
    return (
      <>
        <BackToEventos />
        <Skeleton className="h-[200px] w-full" />
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[84px] w-full" />
          ))}
        </div>
      </>
    )
  }

  if (error || !ev) {
    return (
      <>
        <BackToEventos />
        <Empty icon="alert" title="No se ha podido cargar el evento" sub={error instanceof Error ? error.message : undefined} />
      </>
    )
  }

  return ev.type === "construccion" ? <ConstruccionDetail ev={ev} /> : <CazaDetail ev={ev} />
}
