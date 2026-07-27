"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Bar, Button, Empty, PageHead, Skeleton } from "../ui"
import { AnuncioFeatured } from "./AnuncioFeatured"
import { AnuncioCard } from "./AnuncioCard"
import { AnuncioFormModal } from "./AnuncioFormModal"
import { Pager } from "../poblacion/Pager"
import { useAnuncios, useDeleteAnuncio } from "../../_hooks/queries"
import type { Anuncio } from "../../_types"

const PAGE_SIZE = 24

export function AnunciosBoard() {
  const t = useTranslations("gobierno")
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAnuncios({ page, limit: PAGE_SIZE })
  const deleteAnuncio = useDeleteAnuncio()

  const [composing, setComposing] = useState(false)
  const [editing, setEditing] = useState<Anuncio | null>(null)

  const items = data?.items ?? []
  const pinned = items.filter((a) => a.pinned)
  const rest = items.filter((a) => !a.pinned)

  const handleDelete = (a: Anuncio) => {
    if (!window.confirm(t("anuncios.confirmDelete", { title: a.title }))) return
    deleteAnuncio.mutate(a.id)
  }

  return (
    <div>
      <PageHead
        kicker={t("anuncios.boardKicker")}
        dep="gold"
        title={t("anuncios.boardTitle")}
        sub={t("anuncios.boardSub")}
        right={
          <Button tone="gold" icon="plus" onClick={() => setComposing(true)}>
            {t("common.publish")}
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
          title={t("anuncios.emptyBoard")}
          sub={t("anuncios.emptyBoardSub")}
        />
      ) : (
        <>
          {pinned.map((a) => (
            <AnuncioFeatured key={a.id} anuncio={a} onEdit={() => setEditing(a)} onDelete={() => handleDelete(a)} deleting={deleteAnuncio.isPending} />
          ))}

          {rest.length > 0 && (
            <>
              {pinned.length > 0 && <Bar dep="gold">{t("anuncios.masPublicaciones")}</Bar>}
              <div className="mt-3 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
                {rest.map((a) => (
                  <AnuncioCard key={a.id} anuncio={a} onEdit={() => setEditing(a)} onDelete={() => handleDelete(a)} deleting={deleteAnuncio.isPending} />
                ))}
              </div>
            </>
          )}

          <Pager page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onChange={setPage} t={t} />
        </>
      )}

      {composing && <AnuncioFormModal onClose={() => setComposing(false)} />}
      {editing && <AnuncioFormModal anuncio={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
