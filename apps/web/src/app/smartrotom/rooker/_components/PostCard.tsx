"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { ActionBtn, AuthorLine, Avatar, Icon, ReactionControl, RichText } from "./ui"
import { CaptureCard } from "./cards/CaptureCard"
import { BattleCard } from "./cards/BattleCard"
import { MediaCard } from "./cards/MediaCard"
import { useBookmark, useReact, useRetrino, useRookerUuid } from "../_hooks/queries"
import { useComposeStore } from "../_stores/composeStore"
import { useDisplayStore } from "../_stores/displayStore"
import type { RookerPost } from "../_types"

/**
 * One trino in the timeline.
 *
 * The whole card is a click target that opens the post, which is why every control
 * inside it stops propagation — a reaction must not also navigate. The check is done
 * by inspecting the event target for an enclosing button or anchor, so a reader
 * selecting text or following a #hashtag is never yanked to the detail view.
 *
 * Density and card style are read straight from the Pantalla store rather than passed
 * down: they are display preferences, not data, and threading them through every list
 * would put them in the props of screens that do not care.
 */
export interface PostCardProps {
  post: RookerPost
  /** Suppresses the bottom rule on the last row of a flat list. */
  last?: boolean
}

export function PostCard({ post, last = false }: PostCardProps) {
  const router = useRouter()
  const t = useTranslations("rooker")
  const uuid = useRookerUuid()
  const react = useReact()
  const retrino = useRetrino()
  const bookmark = useBookmark()
  const openReply = useComposeStore((s) => s.openReply)

  const compact = useDisplayStore((s) => s.density) === "compacto"
  const carded = useDisplayStore((s) => s.cardStyle) === "tarjeta"

  const open = () => router.push(`/smartrotom/rooker/trino/${post.id}`)
  const avatar = compact ? 40 : 46

  const attachment =
    post.capture ? (
      <CaptureCard data={post.capture} />
    ) : post.battle ? (
      <BattleCard data={post.battle} author={post.author} />
    ) : post.mediaUrl ? (
      <MediaCard url={post.mediaUrl} />
    ) : null

  return (
    <article
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button,a")) return
        // Don't hijack a text selection.
        if (window.getSelection()?.toString()) return
        open()
      }}
      className={cn(
        "cursor-pointer transition-colors",
        carded
          ? "mb-3 rounded-rk border border-rk-line bg-rk-card"
          : cn("hover:bg-rk-hover", !last && "border-b border-rk-line"),
      )}
    >
      <div className={cn(compact ? "px-3.5 py-2.5" : "px-4 py-3.5")}>
        {post.pinned && (
          <div
            className="mb-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-rk-fg-subtle"
            style={{ marginLeft: avatar + 12 }}
          >
            <Icon name="pin" size={13} fill className="text-rk-accent" />
            {t("post.pinnedBy")}
          </div>
        )}
        {post.retrinoBy && (
          <div
            className="mb-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-rk-fg-subtle"
            style={{ marginLeft: avatar + 12 }}
          >
            <Icon name="retrino" size={13} />{t("post.retrinoedBy", { handle: post.retrinoBy })}
          </div>
        )}

        <div className="flex gap-3">
          <Avatar
            user={post.author}
            size={avatar}
            onClick={
              post.author.handle
                ? () => router.push(`/smartrotom/rooker/${post.author.handle}`)
                : undefined
            }
          />

          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2">
              <AuthorLine author={post.author} createdAt={post.createdAt} compact={compact} />
            </div>

            {post.text && (
              <div className="mt-0.5">
                <RichText text={post.text} className={compact ? "text-[14px]" : "text-[15px]"} />
              </div>
            )}

            {attachment && <div className="mt-2.5">{attachment}</div>}

            <div className="-ml-1.5 mt-2 flex max-w-[440px] items-center justify-between">
              <ActionBtn
                icon="reply"
                label={t("post.actions.reply")}
                count={post.counts.replies}
                tone="accent"
                onClick={() => (uuid ? openReply({ id: post.id, handle: post.author.handle }) : open())}
              />
              <ActionBtn
                icon="retrino"
                label={post.me.retrino ? t("post.actions.undoRetrino") : t("post.actions.retrino")}
                count={post.counts.retrinos}
                tone="rt"
                active={post.me.retrino}
                fillActive={false}
                onClick={() => uuid && retrino.mutate(post.id)}
              />
              <ReactionControl
                reactions={post.counts.reactions}
                mine={post.me.reaction}
                onReact={(type) => uuid && react.mutate({ id: post.id, type })}
              />
              <ActionBtn
                icon="bookmark"
                label={post.me.bookmark ? t("post.actions.unsave") : t("post.actions.save")}
                tone="accent"
                active={post.me.bookmark}
                onClick={() => uuid && bookmark.mutate(post.id)}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
