"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Empty, Spinner, ToolHeader } from "@boffmedia/ui"
import { CategoryTile, ForumStats, OnlineList } from "@/components/boffmedia/ui/community"
import { useForumCategories } from "@/hooks/forum/useForumCategories"
import { useForumOnline } from "@/hooks/forum/useForumOnline"
import { useForumStats } from "@/hooks/forum/useForumStats"
import { toCategoryLike, toMemberLike } from "../_lib/adapters"

export function ForumView() {
  const t = useTranslations("foro")
  const router = useRouter()
  const [now] = React.useState(() => new Date())
  const { categories, isLoading } = useForumCategories()
  const { stats } = useForumStats()
  const { online } = useForumOnline()

  const go = (href: string) => router.push(href)

  return (
    <main data-ds="boffmedia" className="wrap-wide pb-[5.625rem] pt-[2.125rem]">
      <ToolHeader className="mb-6" title={t("view.title")} sub={t("view.lead")} />

      <div className="grid items-start gap-5 [grid-template-columns:1fr_20rem] max-[900px]:grid-cols-1">
        <div className="min-w-0">
          {isLoading ? (
            <div className="grid min-h-[40vh] place-items-center">
              <Spinner />
            </div>
          ) : categories.length === 0 ? (
            <Empty icon="list" title={t("view.emptyTitle")} lead={t("view.emptyLead")} />
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
