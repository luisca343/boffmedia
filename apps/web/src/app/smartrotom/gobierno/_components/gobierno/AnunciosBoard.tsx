"use client"

import { useState } from "react"
import { Bar, Button, Empty, PageHead, Skeleton } from "../ui"
import { AnuncioFeatured } from "./AnuncioFeatured"
import { AnuncioCard } from "./AnuncioCard"
import { AnuncioFormModal } from "./AnuncioFormModal"
import { Pager } from "../poblacion/Pager"
import { useAnuncios, useDeleteAnuncio } from "../../_hooks/queries"
import type { Anuncio } from "../../_types"

const PAGE_SIZE = 24

export function AnunciosBoard() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAnuncios({ page, limit: PAGE_SIZE })
  const deleteAnuncio = useDeleteAnuncio()

  const [composing, setComposing] = useState(false)
  const [editing, setEditing] = useState<Anuncio | null>(null)

  const items = data?.items ?? []
  const pinned = items.filter((a) => a.pinned)
  const rest = items.filter((a) => !a.pinned)

  const handleDelete = (a: Anuncio) => {
    if (!window.confirm(`¿Retirar «${a.title}» del tablón?`)) return
    deleteAnuncio.mutate(a.id)
  }

  return (
    <div>
      <PageHead
        kicker="Gobierno · Comunicación"
        dep="gold"
        title="Anuncios"
        sub="Tablón oficial del ayuntamiento. Avisos, comunicados y alertas para toda la ciudadanía de Teras."
        right={
          <Button tone="gold" icon="plus" onClick={() => setComposing(true)}>
            Publicar
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[190px]" />
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[150px]" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <Empty
          icon="megaphone"
          title="El tablón está vacío"
          sub="Todavía no se ha publicado ningún comunicado oficial. Publica el primer aviso para la ciudadanía."
        />
      ) : (
        <>
          {pinned.map((a) => (
            <AnuncioFeatured key={a.id} anuncio={a} onEdit={() => setEditing(a)} onDelete={() => handleDelete(a)} />
          ))}

          {rest.length > 0 && (
            <>
              {pinned.length > 0 && <Bar dep="gold">Más publicaciones</Bar>}
              <div className="mt-3 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
                {rest.map((a) => (
                  <AnuncioCard key={a.id} anuncio={a} onEdit={() => setEditing(a)} onDelete={() => handleDelete(a)} />
                ))}
              </div>
            </>
          )}

          <Pager page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} />
        </>
      )}

      {composing && <AnuncioFormModal onClose={() => setComposing(false)} />}
      {editing && <AnuncioFormModal anuncio={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
