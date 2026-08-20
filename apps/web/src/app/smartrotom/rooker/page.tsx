"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { userMessageFrom } from "@/services/boffAPI"
import { EmptyState, FeedSkeleton, Icon, SegTabs } from "./_components/ui"
import { PostCard } from "./_components/PostCard"
import { ComposeInline } from "./_components/ComposeInline"
import { useFeed, useRookerUuid } from "./_hooks/queries"
import { useComposeStore } from "./_stores/composeStore"
import { useDisplayStore } from "./_stores/displayStore"
import { Button } from "./_components/ui"
import type { FeedTab } from "./_types"

/**
 * The timeline. A thin orchestrator: it picks a tab and hands the list to
 * `PostCard`.
 *
 * The feed genuinely starts empty — Rooker ships with no fabricated trinos, because a
 * social network seeded with fake posts is a demo, not a product. So the empty
 * state is a first-class screen, and it tells the reader what to do rather than
 * apologising for having nothing.
 */
export default function RookerFeedPage() {
  const t = useTranslations("rooker")
  const [tab, setTab] = useState<FeedTab>("parati")
  const uuid = useRookerUuid()
  const { data: posts, isLoading, isError, error, refetch } = useFeed(tab)
  const openCompose = useComposeStore((s) => s.openCompose)
  const carded = useDisplayStore((s) => s.cardStyle) === "tarjeta"

  return (
    <div>
      <SegTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: "parati", label: t("feed.tabs.paraTi") },
          { key: "siguiendo", label: t("feed.tabs.siguiendo") },
        ]}
      />

      <ComposeInline />

      {isLoading ? (
        <FeedSkeleton />
      ) : isError ? (
        <EmptyState
          icon="close"
          title={t("feed.error.title")}
          body={error ? userMessageFrom(error, t("feed.error.fallbackBody")) : undefined}
          action={
            <Button intent="ghost" onClick={() => refetch()}>
              {t("common.retry")}
            </Button>
          }
        />
      ) : posts?.length ? (
        <>
          <div className={cn(carded && "px-3 pt-3")}>
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} last={!carded && i === posts.length - 1} />
            ))}
          </div>
          <p className="flex items-center justify-center gap-2 py-6 text-center text-[13px] text-rk-fg-subtle">
            <Icon name="feather" size={14} />
            {t("feed.endOfFeed")}
          </p>
        </>
      ) : tab === "siguiendo" ? (
        <EmptyState
          icon="users"
          title={t("feed.emptyFollowing.title")}
          body={t("feed.emptyFollowing.body")}
        />
      ) : (
        <EmptyState
          title={t("feed.emptyForYou.title")}
          body={uuid ? t("feed.emptyForYou.bodyLoggedIn") : t("feed.emptyForYou.bodyLoggedOut")}
          action={
            uuid ? (
              <Button intent="accent" onClick={() => openCompose("text")}>
                {t("feed.emptyForYou.cta")}
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  )
}
