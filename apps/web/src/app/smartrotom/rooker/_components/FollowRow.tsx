"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Avatar, Button, Verified } from "./ui"
import { useFollow, useRookerUuid } from "../_hooks/queries"
import type { RookerSuggestion } from "../_types"

/**
 * A trainer in a "a quién seguir" list, with the follow button that makes it useful.
 *
 * The button flips to an outline "Siguiendo" that turns red on hover — Twitter's
 * unfollow affordance, and the reason `follow`/`following` are two Button intents
 * rather than one with a boolean.
 */
export function FollowRow({
  user,
  isFollowing = false,
}: {
  user: RookerSuggestion
  isFollowing?: boolean
}) {
  const t = useTranslations("rooker")
  const uuid = useRookerUuid()
  const follow = useFollow()
  const isMe = uuid === user.uuid

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-rk-hover">
      <Avatar user={user} size={42} />

      <Link href={`/smartrotom/rooker/${user.handle}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-[14px] font-bold text-rk-fg hover:underline">
            {user.displayName || user.username}
          </span>
          {user.isVerified && <Verified size={13} />}
        </div>
        <div className="truncate text-[13px] text-rk-fg-subtle">@{user.handle}</div>
      </Link>

      {uuid && !isMe && (
        <Button
          intent={isFollowing ? "following" : "follow"}
          onClick={() => follow.mutate(user.uuid)}
          disabled={follow.isPending}
          className="flex-none px-4 py-1.5 text-[13px]"
        >
          {isFollowing ? t("common.follow.following") : t("common.follow.follow")}
        </Button>
      )}
    </div>
  )
}
