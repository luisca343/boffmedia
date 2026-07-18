"use client"

import { useState, type CSSProperties } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { RookerAuthor } from "../../_types"

/**
 * A trainer's face.
 *
 * The handoff drew avatars as Pokémon in a tinted disc. That is a fiction: a
 * SmartRotom user IS a Minecraft account, and their skin is already their identity in
 * ChatApp, the calls overlay and the Pasaporte. So the face is the real head render
 * (`mc-heads.net/avatar/<uuid>`, the URL the rest of SmartRotom already uses) and the
 * handoff's Pokémon becomes what it should always have been: the disc it sits in,
 * tinted by the trainer's chosen partner. Identity underneath, personality around it.
 *
 * Rendered as a `span`, not a `button`, so it can nest inside the clickable rows and
 * post cards that already own the click — a button inside a button is invalid HTML and
 * React will not hydrate it.
 */
export interface AvatarProps {
  user: Pick<RookerAuthor, "uuid" | "username" | "partnerPokemonId">
  size?: number
  /** The partner-tinted ring. Off inside dense facepiles, where it turns to mud. */
  ring?: boolean
  onClick?: () => void
  className?: string
}

export function Avatar({ user, size = 44, ring = true, onClick, className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const t = useTranslations("rooker")
  const interactive = Boolean(onClick)
  const inner = ring ? size - 4 : size

  return (
    <span
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? t("avatar.profileOfAriaLabel", { username: user.username }) : undefined}
      onClick={
        interactive
          ? (e) => {
              // The row underneath is clickable too; without this the avatar would
              // open the post AND the profile.
              e.stopPropagation()
              onClick?.()
            }
          : undefined
      }
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                e.stopPropagation()
                onClick?.()
              }
            }
          : undefined
      }
      className={cn(
        "relative grid flex-none place-items-center rounded-full",
        interactive && "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-rk-accent",
        className,
      )}
      style={{ width: size, height: size } as CSSProperties}
    >
      <span
        className={cn(
          "grid place-items-center overflow-hidden rounded-full bg-rk-elevated",
          ring && "ring-2 ring-rk-accent/25",
        )}
        style={{ width: inner, height: inner } as CSSProperties}
      >
        {failed ? (
          // The head service is a third party; when it is down the timeline still has
          // to render, so the initial stands in rather than a broken-image glyph.
          <span
            className="grid h-full w-full place-items-center bg-rk-accent/15 font-bold uppercase text-rk-accent"
            style={{ fontSize: Math.max(10, Math.round(inner * 0.42)) }}
          >
            {(user.username || "?").charAt(0)}
          </span>
        ) : (
          <img
            src={`https://mc-heads.net/avatar/${user.uuid}`}
            alt={user.username}
            width={inner}
            height={inner}
            loading="lazy"
            draggable={false}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover [image-rendering:pixelated]"
          />
        )}
      </span>
    </span>
  )
}
