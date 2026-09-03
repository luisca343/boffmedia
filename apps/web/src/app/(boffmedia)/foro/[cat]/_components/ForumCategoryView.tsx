"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button, Empty, Icon, Seg, Spinner, type IconName } from "@boffmedia/ui"
import { ForumComposer, ForumStats, OnlineList, ThreadRow } from "@/components/boffmedia/ui/community"
import { useForumCategory } from "@/hooks/forum/useForumCategory"
import { useForumOnline } from "@/hooks/forum/useForumOnline"
import { useForumStats } from "@/hooks/forum/useForumStats"
import { useForumThreads } from "@/hooks/forum/useForumThreads"
import { useCreateThread } from "@/hooks/forum/useCreateThread"
import type { ThreadSort } from "@/services/api/boffmedia/forumService"
import { useBoffSession } from "@/services/useBoffSession"
import { toMemberLike, toThreadLike } from "../../_lib/adapters"

const PAGE = 20

export function ForumCategoryView({ slug }: { slug: string }) {
  const t = useTranslations("foro")
  const router = useRouter()

  const SORTS: { value: ThreadSort; label: string }[] = [
    { value: "recent", label: t("cat.sortRecent") },
    { value: "top", label: t("cat.sortTop") },
    { value: "new", label: t("cat.sortNew") },
  ]
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
        <Empty icon="alert" title={t("cat.notFoundTitle")} lead={t("cat.notFoundLead")}>
          <Button variant="pri" icon="back" href="/foro">
            {t("cat.backToForum")}
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
    <main data-ds="boffmedia" className="wrap pb-[5.625rem] pt-6">
      <Link
        href="/foro"
        className="mb-5 inline-flex items-center gap-2 font-mono text-[0.6875rem]/none font-semibold uppercase tracking-[0.1em] text-txt-dim no-underline transition-colors hover:text-txt"
      >
        <Icon name="back" size={14} /> {t("cat.breadcrumb")}
      </Link>

      <header className="mb-6 flex items-start gap-4" style={{ "--chue": category.hue } as React.CSSProperties}>
        <span className="grid h-14 w-14 flex-none place-items-center border border-solid border-[color-mix(in_srgb,hsl(var(--chue)_70%_50%)_42%,var(--line-2))] bg-[color-mix(in_srgb,hsl(var(--chue)_70%_50%)_14%,var(--panel-2))] text-[hsl(var(--chue)_78%_64%)] cut-seal cut-seal-edge [--cut:10px] [--cut-line:color-mix(in_srgb,hsl(var(--chue)_70%_50%)_42%,var(--line-2))]">
          <Icon name={category.icon as IconName} size={26} />
        </span>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 text-[clamp(1.875rem,4vw,2.75rem)]">
            {category.name}
            {category.locked && <Icon name="lock" size={18} className="text-txt-dim" />}
          </h1>
          <p className="mt-2 max-w-[64ch] font-body text-[0.9375rem]/[1.55] text-txt-muted">{category.description}</p>
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
              {composing ? t("cat.cancel") : t("cat.newThread")}
            </Button>
          ) : !loggedIn && !category.locked ? (
            <Link
              href="/entrar"
              className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-txt-dim no-underline transition-colors hover:text-accent-bright"
            >
              <Icon name="user" size={13} /> {t("cat.loginToPost")}
            </Link>
          ) : null}
        </div>
      </header>

      {composing && canCreate && (
        <div className="mb-6">
          {createError && (
            <p className="mb-2.5 border border-solid border-bad bg-bad-soft py-2.5 px-3.5 font-mono text-[0.75rem] font-medium text-bad cut-tag cut-tag-edge [--cut-line:var(--bad)]">
              {createError}
            </p>
          )}
          <ForumComposer
            withTitle
            submitLabel={t("cat.submitLabel")}
            busy={creating}
            onSubmit={handleCreate}
            onCancel={() => {
              setCreateError(null)
              setComposing(false)
            }}
          />
        </div>
      )}

      <div className="grid items-start gap-5 [grid-template-columns:1fr_20rem] max-[900px]:grid-cols-1">
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
            <span className="ml-auto font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-txt-muted">
              {t("cat.threadCount", { count: total })}
            </span>
          </div>

          {threadsLoading && !threadList ? (
            <div className="grid min-h-[30vh] place-items-center">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <Empty icon="list" title={t("cat.emptyTitle")} lead={t("cat.emptyLead")} />
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
                    {t("cat.loadMore")}
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
