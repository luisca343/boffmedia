"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { EmptyState, FeedSkeleton, Icon, SegTabs } from "./_components/ui"
import { PostCard } from "./_components/PostCard"
import { ComposeInline } from "./_components/ComposeInline"
import { useFeed, useRookerUuid } from "./_hooks/queries"
import { useComposeStore } from "./_stores/composeStore"
import { useDisplayStore } from "./_stores/displayStore"
import { Button } from "./_components/ui"
import type { FeedTab } from "./_types"

/**
 * The timeline. A thin orchestrator (§12): it picks a tab and hands the list to
 * `PostCard`.
 *
 * The feed genuinely starts empty — Rooker ships with no fabricated trinos, because a
 * social network seeded with fake posts is a demo, not a product (§9). So the empty
 * state is a first-class screen, and it tells the reader what to do rather than
 * apologising for having nothing.
 */
export default function RookerFeedPage() {
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
          { key: "parati", label: "Para ti" },
          { key: "siguiendo", label: "Siguiendo" },
        ]}
      />

      <ComposeInline />

      {isLoading ? (
        <FeedSkeleton />
      ) : isError ? (
        <EmptyState
          icon="close"
          title="El nido no responde"
          body={error instanceof Error ? error.message : undefined}
          action={
            <Button intent="ghost" onClick={() => refetch()}>
              Reintentar
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
            Has llegado al fondo del nido.
          </p>
        </>
      ) : tab === "siguiendo" ? (
        <EmptyState
          icon="users"
          title="Tu nido está en silencio"
          body="Aquí aparecerán los trinos de los entrenadores que sigas. Todavía no sigues a nadie que haya trinado."
        />
      ) : (
        <EmptyState
          title="El nido está vacío"
          body={
            uuid
              ? "Nadie ha trinado todavía. Sé el primero: cuenta una captura, reta a alguien o simplemente saluda."
              : "Todavía no hay trinos. Inicia sesión para escribir el primero."
          }
          action={
            uuid ? (
              <Button intent="accent" onClick={() => openCompose("text")}>
                Escribir el primer trino
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  )
}
