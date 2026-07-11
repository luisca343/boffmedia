"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, Empty, Icon, Seg, Spinner, type IconName } from "@/components/boffmedia/primitives"
import { ForumComposer, ForumStats, OnlineList, ThreadRow } from "@/components/boffmedia/ui/community"
import { useForumCategory } from "@/hooks/forum/useForumCategory"
import { useForumOnline } from "@/hooks/forum/useForumOnline"
import { useForumStats } from "@/hooks/forum/useForumStats"
import { useForumThreads } from "@/hooks/forum/useForumThreads"
import { useCreateThread } from "@/hooks/forum/useCreateThread"
import type { ThreadSort } from "@/services/api/boffmedia/forumService"
import { useBoffSession } from "@/services/useBoffSession"
import { toMemberLike, toThreadLike } from "../../_lib/adapters"

const SORTS: { value: ThreadSort; label: string }[] = [
  { value: "recent", label: "Recientes" },
  { value: "top", label: "Top" },
  { value: "new", label: "Nuevos" },
]

const PAGE = 20

export function ForumCategoryView({ slug }: { slug: string }) {
  const router = useRouter()
  const [now] = React.useState(() => new Date())
  const [sort, setSort] = React.useState<ThreadSort>("recent")
  const [limit, setLimit] = React.useState(PAGE)
  const [composing, setComposing] = React.useState(false)

  const { status, isBoffAdmin } = useBoffSession()
  const loggedIn = status === "authenticated"
  const admin = isBoffAdmin()

  const { category, isLoading: catLoading, error: catError } = useForumCategory(slug)
  const { threadList, isLoading: threadsLoading } = useForumThreads(slug, { sort, limit })
  const { stats } = useForumStats()
  const { online } = useForumOnline()
  const { createThread, isSubmitting: creating, error: createError, setError: setCreateError } = useCreateThread()

  const go = (href: string) => router.push(href)

  if (catLoading) {
    return (
      <main data-ds="boffmedia" className="wrap grid min-h-[60vh] place-items-center">
        <Spinner />
      </main>
    )
  }

  if (catError || !category) {
    return (
      <main data-ds="boffmedia" className="wrap">
        <Empty icon="alert" title="Tablón no encontrado" lead="Esta categoría del foro no existe o ya no está disponible.">
          <Button variant="pri" icon="back" href="/foro">
            Volver al foro
          </Button>
        </Empty>
      </main>
    )
  }

  const items = threadList?.items ?? []
  const total = threadList?.total ?? 0

  // A logged-in member may open a new thread unless the board is locked; admins
  // can post to a locked board too. Anonymous visitors get a login nudge.
  const canCreate = loggedIn && (!category.locked || admin)

  const handleCreate = async (v: { title?: string; body: string }) => {
    const created = await createThread({ categoryId: category.id, title: v.title ?? "", body: v.body })
    if (created) router.push(`/foro/${slug}/${created.id}`)
  }

  return (
    <main data-ds="boffmedia" className="wrap pb-[90px] pt-6">
      <Link
        href="/foro"
        className="mb-5 inline-flex items-center gap-2 font-mono text-[11px]/none font-semibold uppercase tracking-[0.1em] text-txt-dim no-underline transition-colors hover:text-txt"
      >
        <Icon name="back" size={14} /> Foro
      </Link>

      <header className="mb-6 flex items-start gap-4" style={{ "--chue": category.hue } as React.CSSProperties}>
        <span className="grid h-14 w-14 flex-none place-items-center border border-solid border-[color-mix(in_srgb,hsl(var(--chue)_70%_50%)_42%,var(--line-2))] bg-[color-mix(in_srgb,hsl(var(--chue)_70%_50%)_14%,var(--panel-2))] text-[hsl(var(--chue)_78%_64%)] cut-seal [--cut:10px]">
          <Icon name={category.icon as IconName} size={26} />
        </span>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 text-[clamp(30px,4vw,44px)]">
            {category.name}
            {category.locked && <Icon name="lock" size={18} className="text-txt-dim" />}
          </h1>
          <p className="mt-2 max-w-[64ch] font-body text-[15px]/[1.55] text-txt-muted">{category.description}</p>
        </div>
        <div className="ml-auto flex-none self-start">
          {canCreate ? (
            <Button
              variant="pri"
              icon={composing ? "x" : "plus"}
              onClick={() => {
                setCreateError(null)
                setComposing((v) => !v)
              }}
            >
              {composing ? "Cancelar" : "Nuevo hilo"}
            </Button>
          ) : !loggedIn && !category.locked ? (
            <Link
              href="/entrar"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-txt-dim no-underline transition-colors hover:text-accent-bright"
            >
              <Icon name="user" size={13} /> Inicia sesión para crear un hilo
            </Link>
          ) : null}
        </div>
      </header>

      {composing && canCreate && (
        <div className="mb-6">
          {createError && (
            <p className="mb-2.5 border border-solid border-bad bg-bad-soft py-2.5 px-3.5 font-mono text-[12px] font-medium text-bad cut-tag">
              {createError}
            </p>
          )}
          <ForumComposer
            withTitle
            submitLabel="Publicar hilo"
            busy={creating}
            onSubmit={handleCreate}
            onCancel={() => {
              setCreateError(null)
              setComposing(false)
            }}
          />
        </div>
      )}

      <div className="grid items-start gap-5 [grid-template-columns:1fr_320px] max-[900px]:grid-cols-1">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="max-w-full overflow-x-auto">
              <Seg
                options={SORTS}
                value={sort}
                onChange={(v) => {
                  setSort(v as ThreadSort)
                  setLimit(PAGE)
                }}
                className="w-max"
              />
            </div>
            <span className="ml-auto font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-txt-muted">
              {total} {total === 1 ? "hilo" : "hilos"}
            </span>
          </div>

          {threadsLoading && !threadList ? (
            <div className="grid min-h-[30vh] place-items-center">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <Empty icon="list" title="Sin hilos" lead="Aún no hay hilos en este tablón." />
          ) : (
            <>
              <div className="border border-solid border-line bg-panel">
                {items.map((t) => (
                  <ThreadRow key={t.id} thread={toThreadLike(t)} onOpen={go} showCat={false} now={now} />
                ))}
              </div>
              {items.length < total && (
                <div className="mt-4 flex justify-center">
                  <Button icon="chevronDown" onClick={() => setLimit((l) => l + PAGE)}>
                    Cargar más
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="grid gap-5 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
          <OnlineList members={online.map(toMemberLike)} onOpen={go} now={now} />
          {stats && <ForumStats stats={stats} />}
        </aside>
      </div>
    </main>
  )
}
