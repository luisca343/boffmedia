"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { userMessageFrom } from "@/services/boffAPI"
import {
  ActionBtn,
  Avatar,
  Button,
  EmptyState,
  FeedSkeleton,
  ReactionControl,
  ReactionSummary,
  RichText,
  SubHeader,
  Verified,
} from "../../_components/ui"
import { PostCard } from "../../_components/PostCard"
import { CaptureCard } from "../../_components/cards/CaptureCard"
import { BattleCard } from "../../_components/cards/BattleCard"
import { MediaCard } from "../../_components/cards/MediaCard"
import { useBookmark, useMe, usePost, useReact, useRetrino, useRookerUuid } from "../../_hooks/queries"
import { useComposeStore } from "../../_stores/composeStore"
import { fmt, fullTime } from "../../_utils/format"

/**
 * One trino, opened.
 *
 * The focused post is deliberately NOT a `PostCard`: it is the same content at a
 * different rank — 18px body instead of 15, an absolute timestamp instead of "3 h", the
 * reaction *breakdown* instead of a single total, and an action bar with no counts on
 * it (the counts have been promoted to their own row above). Replies below are ordinary
 * PostCards, because in the thread they are back to being timeline rows.
 */
export default function TrinoPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const uuid = useRookerUuid()
  const { data: me } = useMe()
  const { data, isLoading, isError, error } = usePost(id)
  const react = useReact()
  const retrino = useRetrino()
  const bookmark = useBookmark()
  const openReply = useComposeStore((s) => s.openReply)

  if (isLoading) {
    return (
      <div>
        <SubHeader title="Trino" back />
        <FeedSkeleton rows={3} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div>
        <SubHeader title="Trino" back />
        <EmptyState
          icon="close"
          title="Este trino ya no está"
          body={userMessageFrom(error, "Puede que su autor lo haya borrado.")}
        />
      </div>
    )
  }

  const { post, replies } = data
  const name = post.author.displayName || post.author.username

  const attachment = post.capture ? (
    <CaptureCard data={post.capture} />
  ) : post.battle ? (
    <BattleCard data={post.battle} author={post.author} />
  ) : post.mediaUrl ? (
    <MediaCard url={post.mediaUrl} />
  ) : null

  return (
    <div>
      <SubHeader title="Trino" back />

      <article className="border-b border-rk-line px-4 py-3.5">
        <div className="mb-2.5 flex items-center gap-3">
          <Avatar user={post.author} size={48} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15.5px] font-bold text-rk-fg">{name}</span>
              {post.author.isVerified && <Verified />}
            </div>
            {post.author.handle && (
              <Link
                href={`/smartrotom/rooker/${post.author.handle}`}
                className="text-[14px] text-rk-fg-subtle hover:underline"
              >
                @{post.author.handle}
              </Link>
            )}
          </div>
        </div>

        {post.text && <RichText text={post.text} className="text-[18px]" />}
        {attachment && <div className="mt-3">{attachment}</div>}

        <p className="my-3.5 text-[13.5px] text-rk-fg-subtle">{fullTime(post.createdAt)}</p>

        <div className="flex items-center justify-between gap-4 border-y border-rk-line py-2.5">
          <ReactionSummary reactions={post.counts.reactions} />
          <div className="flex gap-3.5 text-[13px] text-rk-fg-subtle">
            <span>
              <b className="text-rk-fg">{fmt(post.counts.retrinos)}</b> Retrinos
            </span>
            <span>
              <b className="text-rk-fg">{fmt(post.counts.replies)}</b> Respuestas
            </span>
          </div>
        </div>

        <div className="flex items-center justify-around pt-1">
          <ActionBtn
            icon="reply"
            label="Responder"
            tone="accent"
            onClick={() => uuid && openReply({ id: post.id, handle: post.author.handle })}
          />
          <ActionBtn
            icon="retrino"
            label={post.me.retrino ? "Deshacer retrino" : "Retrinar"}
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
            label={post.me.bookmark ? "Quitar de guardados" : "Guardar"}
            tone="accent"
            active={post.me.bookmark}
            onClick={() => uuid && bookmark.mutate(post.id)}
          />
        </div>
      </article>

      {me && (
        <div className="flex items-center gap-3 border-b border-rk-line px-4 py-3">
          <Avatar
            user={{ uuid: me.uuid, username: me.username, partnerPokemonId: me.partnerPokemonId }}
            size={40}
          />
          <button
            type="button"
            onClick={() => openReply({ id: post.id, handle: post.author.handle })}
            className="flex-1 cursor-text text-left text-[16px] text-rk-fg-subtle"
          >
            Responde a @{post.author.handle ?? name}…
          </button>
          <Button intent="accent" onClick={() => openReply({ id: post.id, handle: post.author.handle })}>
            Responder
          </Button>
        </div>
      )}

      {replies.length ? (
        replies.map((reply, i) => (
          <PostCard key={reply.id} post={reply} last={i === replies.length - 1} />
        ))
      ) : (
        <EmptyState
          icon="reply"
          title="Sin respuestas todavía"
          body="Sé quien empiece la conversación."
        />
      )}
    </div>
  )
}
