"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Empty } from "@/components/boffmedia/primitives/empty"
import { Spinner } from "@/components/boffmedia/primitives/spinner"
import { CategoryTile, ForumStats, OnlineList } from "@/components/boffmedia/ui/community"
import { useForumCategories } from "@/hooks/forum/useForumCategories"
import { useForumOnline } from "@/hooks/forum/useForumOnline"
import { useForumStats } from "@/hooks/forum/useForumStats"
import { toCategoryLike, toMemberLike } from "../_lib/adapters"

export function ForumView() {
  const router = useRouter()
  const [now] = React.useState(() => new Date())
  const { categories, isLoading } = useForumCategories()
  const { stats } = useForumStats()
  const { online } = useForumOnline()

  const go = (href: string) => router.push(href)

  return (
    <main data-ds="boffmedia" className="wrap pb-[90px] pt-[34px]">
      <div className="mb-6">
        <span className="mono-label">Comunidad</span>
        <h1 className="mt-2 text-[clamp(46px,6vw,80px)]">Foro</h1>
        <p className="mt-3 max-w-[64ch] font-body text-[17px]/[1.6] text-txt-muted">
          Debate, dudas y estrategia con el resto de la comunidad. Elige un tablón para empezar.
        </p>
      </div>

      <div className="grid items-start gap-5 [grid-template-columns:1fr_320px] max-[900px]:grid-cols-1">
        <div className="min-w-0">
          {isLoading ? (
            <div className="grid min-h-[40vh] place-items-center">
              <Spinner />
            </div>
          ) : categories.length === 0 ? (
            <Empty icon="list" title="Sin tablones" lead="Aún no hay categorías en el foro." />
          ) : (
            <div className="grid gap-3">
              {categories.map((c) => (
                <CategoryTile key={c.id} cat={toCategoryLike(c)} onOpen={go} now={now} />
              ))}
            </div>
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
